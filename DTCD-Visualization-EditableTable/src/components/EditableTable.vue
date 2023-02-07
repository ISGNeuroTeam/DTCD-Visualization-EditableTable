<template>
  <div class="editable-table-container" style="height: 100%">
    <div
      v-if="title"
      class="title"
      v-text="title"
    />
    <editable-table-controls
      @action="execute"
    />

    <div :style="`height: ${tableHeight}`">
      <div class="editable-table" ref="table"></div>
    </div>
  </div>
</template>

<script>
import {TabulatorFull as Tabulator} from 'tabulator-tables';
import {throttle} from '../throttle';
import EditableTableControls from './EditableTableControls';


const colorFixed = function(cell, formatterParams, onRendered){
  cell.getElement().style.backgroundColor = this.sanitizeHTML(cell.getValue());

  return "&nbsp;";
}

export default {
  name: 'editableTable',
  components: {
    EditableTableControls
  },

  props: {
    title: {
      type: String,
      default: ''
    },
    dataset: {
      type: Array,
      default: () => ([])
    },
    // columns: {
    //   type: Array,
    //   default: () => ([])
    // },
    id: {
      type: Number,
      require: true
    },
    schema: {
      type: Object,
      default: () => ({})
    },
    columnOptions: {
      type: Object,
      default: () => ({})
    }
  },
  data: () => ({
    tabulator: null, //variable to hold your table
    tableData: [],
    isLoadFromFile: false,
  }),
  computed: {
    tableHeight() {
      let offset = 38
      offset += this.title ? 33 : 0
      return  `calc(100% - ${offset}px)`
    },
    columns() {
      // return [
      //   {field: "name", title: "Name", frozen: true, editor: "input", headerFilter:"input"},
      //   {field: "date", title: "Date", editor: true /*this.dateEditor*/, headerFilter:"input"},
      //   {field: "hobby", title: "Hobby", formatter: "tickCross", editor: true, headerFilter:"tickCross"},
      //   {field: "address", title: "Address"},
      //   {field: "color", title: "Цвет", formatter: "color",editor: "input",},
      //   {field: "img", title: "image", formatter: "image",editor: "input",},
      // ]
      const defaultColumns = [
        { title: 'Выделение', formatter:"rowSelection", titleFormatter:"rowSelection", hozAlign:"center", headerHozAlign:"center", headerSort:false, cellClick:function(e, cell){
            cell.getRow().toggleSelect();
          }},
      ]
      if (!Object.keys(this.schema).includes('_columnOptions')) {
        return Object.keys(this.schema).reduce((acc, key) => {
          const column = {
            field: key,
            title: key,
            editor: this.schema[key] === 'BOOLEAN'? "tickCross" : true,
            headerFilter: this.schema[key] === 'BOOLEAN'? "tickCross" : "input",
            headerMenu: this.headerMenu

          };
          if (this.schema[key] === 'BOOLEAN') {
            column.formatter = "tickCross";
            column.headerFilterParams ={"tristate":true};
            column.headerFilterEmptyCheck = function(value){return value === null}
          }
          return [
            ...acc,
            column,
          ]
        },defaultColumns)
      } else {
        return Object.keys(this.columnOptions).reduce((acc, key) => {
          const options = this.columnOptions[key]
          const column = {
            field: key,
            title: options.title || key,
            frozen: options?.frozen || false,
            headerFilter: options?.headerFilter || false,
            editor: options?.editor || false,
            headerMenu: this.headerMenu

          };

          if (options?.formatter) {
            if (options?.formatter === "color") {
              column.formatter = colorFixed
            } else {
              column.formatter = options?.formatter
            }
          }
          if (options?.formatter === "tickCross") {
            column.headerFilterParams ={"tristate":true};
            column.headerFilterEmptyCheck = function(value){return value === null}
          }
          if (options?.editor === "list" && options?.editorParams) {
            column.editorParams = options.editorParams
          }

          return [
            ...acc,
            column,
          ]
        },defaultColumns);
      }

    }
  },
  watch: {
    dataset: {
      handler(val) {
        this.tableData = structuredClone(val)
        this.isLoadFromFile = false
        this.createTable()
      },
      deep: true
    },
  },
  mounted() {
    this.createTable = throttle(this.createTable, 3000)
  },
  methods: {
    createTable() {
      if (this.tabulator) {
        this.tabulator.destroy()
      }
      this.tabulator = new Tabulator(this.$refs.table, {
        addRowPos: 'top',
        placeholder:"No Data Available", //display message to user on empty table
        popupContainer: '#page',
        maxHeight: "100%",
        height: "100%",
        layout:"fitColumns",

        persistence: {
          columns: ["width", "visible"]
        },
        persistenceID:this.id,


        // data: this.tableData, //link data to table
        data: this.tableData, //link data to table
        reactiveData:true, //enable data reactivity

        //define table columns
        autoColumns: this.isLoadFromFile,

        autoColumnsDefinitions: (definitions) =>{

          definitions.forEach((column) => {
            column.headerFilter = true; // add header filter to every column
            column.editor = "input";
            column.headerMenu = this.headerMenu
          });

          // definitions.push({ title: 'Выделение', formatter:"rowSelection", titleFormatter:"rowSelection", hozAlign:"center", headerHozAlign:"center", headerSort:false, cellClick:function(e, cell){
          //     cell.getRow().toggleSelect();
          //   }},)
          return definitions;
        },

        columns: this.columns,



        pagination:"local",
        paginationSize:true,
        paginationSizeSelector:[100, 500, 1000, true],
        paginationCounter:"rows",

        movableColumns:true,

        // history
        history:true,

      });
    },
    headerMenu(){
      const menu = [];
      const columns = this.tabulator.getColumns();

      for(let column of columns){

        //create checkbox element using font awesome icons
        let icon = document.createElement("span");
        icon.classList.add("FontIcon");
        icon.classList.add(column.isVisible() ? "name_check" : "name_closeBig");

        //build label
        let label = document.createElement("span");
        let title = document.createElement("span");

        title.textContent = " " + column.getDefinition().title;

        label.appendChild(icon);
        label.appendChild(title);

        //create menu item
        menu.push({
          label:label,
          action(e){
            //prevent menu closing
            e.stopPropagation();

            const visibleColumns = columns.filter((item) => {
              return item.isVisible()
            }).length

            if (visibleColumns > 1) {
              //toggle current column visibility
              column.toggle();
            } else if (visibleColumns === 1 && !column.isVisible()) {
              column.toggle();
            }

            //change menu item icon
            if(column.isVisible()){
              icon.classList.remove("name_closeBig");
              icon.classList.add("name_check");
            }else{
              icon.classList.remove("name_check");
              icon.classList.add("name_closeBig");
            }
          }
        });
      }

      return menu;
    },
    /*dateEditor(cell, onRendered, success, cancel){
     //cell - the cell component for the editable cell
     //onRendered - function to call when the editor has been rendered
     //success - function to call to pass thesuccessfully updated value to Tabulator
     //cancel - function to call to abort the edit and return to a normal cell

     //create and style input
     const cellValue = luxon.DateTime.fromFormat(cell.getValue(), "dd/MM/yyyy").toFormat("yyyy-MM-dd"),
       input = document.createElement("input");

     input.setAttribute("type", "date");

     input.style.padding = "4px";
     input.style.width = "100%";
     input.style.boxSizing = "border-box";

     input.value = cellValue;

     onRendered(function(){
       input.focus();
       input.style.height = "100%";
     });

     function onChange(){
       if(input.value !== cellValue){
         success(luxon.DateTime.fromFormat(input.value, "yyyy-MM-dd").toFormat("dd/MM/yyyy"));
       }else{
         cancel();
       }
     }

     //submit new value on blur or change
     input.addEventListener("blur", onChange);

     //submit new value on enter
     input.addEventListener("keydown", function(e){
       if(e.code == 13){
         onChange();
       }

       if(e.code == 27){
         cancel();
       }
     });

     return input;
   },*/

    writeData() {
      this.$root.writeData(structuredClone(this.tableData));
    },

    //undo button
    undo() {
      this.tabulator.undo();
    },

    //redo button
    redo() {
      this.tabulator.redo();
    },

    addDataRow() {
      this.tabulator.addRow({});
      this.tableData = this.tabulator.getData()
    },
    removeDataRow() {
      this.tabulator.getSelectedRows().forEach((row) => {
        row.delete();
      })

      this.tableData = this.tabulator.getData()
    },

    //trigger download of data.csv file
    downloadCSV(){
      this.tabulator.download("csv", "data.csv");
    },

    //trigger download of data.json file
    downloadJSON(){
      this.tabulator.download("json", "data.json");
    },

    //trigger download of data.xlsx file
    downloadXLSX(){
      this.tabulator.download("xlsx", "data.xlsx", {sheetName:"My Data"}, {compress:false});
    },

    //trigger download of data.pdf file
    downloadPDF(){
      this.tabulator.download("pdf", "data.pdf", {
        orientation:"portrait", //set page orientation to portrait
      });
    },

    //trigger download of data.html file
    downloadHTML(){
      this.tabulator.download("html", "data.html", {style:true});
    },

    loadCSV() {
      this.tabulator.importFormat = 'csv'
      this.isLoadFromFile = true
      this.tabulator.import("csv", ".csv")
      .then(() => {
        this.tableData = this.tabulator.getData()
        console.log(this.tableData);
        this.createTable()
        delete this.tabulator.importFormat
        this.isLoadFromFile = false
      })
      .catch(() => {
        this.tableData = []
      })
    },
    loadJSON() {
      this.tabulator.import("json", ".json")
      .then(() => {
        this.isLoadFromFile = true
        this.tableData = this.tabulator.getData()
        this.createTable()
      })
      .catch(() => {
        this.tableData = []
      })
    },

    execute(action) {
      this[action]()
    }
  }
};
</script>

<style lang="scss">
@import  "../scss/tabulator";

.editable-table-container {
  padding: 10px;

  .title {

    color: var(--text_main);
    font-size: 18px;
    font-weight: 700;
    line-height: 25px;
    padding-bottom: 8px;
  }
}

/*Theme the Tabulator element*/
.editable-table {
  background-color: var(--background_main)!important;
  border: 1px solid var(--border)!important;
  border-radius: 4px;

  /*Theme the header*/
  .tabulator-header {
    background: var(--background_main)!important;
    color: var(--text_main)!important;

    /*Allow column header names to wrap lines*/
    .tabulator-col,
    .tabulator-col-row-handle {
      background: var(--background_main)!important;
      white-space: normal;
    }

    .tabulator-header-filter input {
      background-color: var(--border_12);
      border: 1px solid var(--border);
      border-radius: 4.44px;
      padding: 6px var(--padding-field-x);
      font-size: 13px;
      line-height: 1.23;
      color: var(--text_main);
      transition: border-color 0.3s, background-color 0.3s;
    }
  }

  /*Color the table rows*/
  .tabulator-row{
    color: var(--text_main)!important;
    background-color: var(--background_main)!important;

    /*Color even rows*/
    &:nth-child(even) {
      background-color: var(--background_secondary)!important;
    }
    .tabulator-cell {

    }
  }

  .tabulator-footer {
    background: var(--background_main)!important;
    border-top: 1px solid var(--border)!important;
    color: var(--text_main)!important;

    .tabulator-paginator {
      color: var(--text_main)!important;
    }

    .tabulator-page-size {
      background-color: var(--border_12);
      border: 1px solid var(--border);
      border-radius: 4.44px;
      //padding: 5px 25px 5px 12px;
      color: var(--text_main);
      transition: border-color 0.3s, background-color 0.3s;
      font-size: 13px;
      line-height: 1.218;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;

      option {
        cursor: pointer;
        background-color: var(--background_main);
        border-top: 1px solid var(--border);
        color: var(--text_secondary);
      }
    }


    .tabulator-page-size:focus-visible {
      outline: none;
    }

    .tabulator-page {
      font-size: 11px;
      padding: 4px 13px;
      border-radius: 4.66px;
      transition: background-color 0.3s;
      color: var(--background_main);
      background-color: var(--button-bg-color);
      border: none;

      &:hover {
        background-color: var(--button_primary_86)!important;
        color: var(--background_main)!important;
      }

      &.active {
        color: var(--background_main)!important;
        background-color: var(--accent)!important;
      }
    }
  }


}
.tabulator-menu.tabulator-popup-container {
  & > .tabulator-menu-item {
    color: var(--text_main)!important;
    background-color: var(--background_main)!important;
    transition: all 0.3s ease-in-out;

  

    &:hover {
      background-color: var(--button_primary_86)!important;
      color: var(--background_main)!important;
    }

  }

}

</style>