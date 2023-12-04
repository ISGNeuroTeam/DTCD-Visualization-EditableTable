<template>
  <div class="editable-table-container" style="height: 100%">
    <div
      v-if="title"
      class="title"
      v-text="title"
    />
    <editable-table-controls
      :writeStatus="writeStatus"
      @action="execute"
    />

    <div :style="`height: ${tableHeight}`">
      <div class="editable-table" ref="table"></div>
    </div>
  </div>
</template>

<script>
import {TabulatorFull as Tabulator} from 'tabulator-tables';
import {throttle} from '../js/throttle';
import {debounce} from '../js/debounce';
import EditableTableControls from './EditableTableControls';
import Chart from 'chart.js/auto';

const colorFixed = function(cell, formatterParams, onRendered){
  cell.getElement().style.backgroundColor = this.sanitizeHTML(cell.getValue());

  return "&nbsp;";
}

const chartFormatter = (cell, formatterParams, onRendered) => {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.height = `${formatterParams?.chartHeight || 150}px`;

  const canvas = document.createElement('canvas');

  onRendered(() => {
    const { chartOptions } = formatterParams;

    if (!chartOptions) {
      throw new Error(`Chart required chartOptions in formatterParams`);
    }

    new Chart(canvas, {
      ...structuredClone(chartOptions),
      data: cell.getValue(),
    });
  });

  wrapper.append(canvas);

  return wrapper;
};

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
    tableOptions: {
      type: Object,
      default: () => ({})
    },
    columnOptions: {
      type: Object,
      default: () => ({})
    },
    writeStatus: {
      type: String,
      default: ''
    },
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
        {
          title: 'Выделение',
          formatter: "rowSelection",
          titleFormatter: "rowSelection",
          width: 50,
          hozAlign: "center",
          headerHozAlign: "center",
          headerSort: false,
          cellClick: function (e, cell) {
            cell.getRow().toggleSelect();
          }
        },
      ]

      if (this.columnOptions && !!Object.keys(this.columnOptions).length) {
        return Object.keys(this.schema).reduce((acc, key) => {
          if (key === '_columnOptions') {
            return acc
          }
          const options = this.columnOptions[key]
          const column = {
            field: key,
            title: options?.title || key,
            frozen: options?.frozen || false,
            headerFilter: options?.headerFilter == 'turned-off' ? false : options.headerFilter,
            headerSort: options?.headerSort ?? true,
            editor: options?.editor || false,
            headerMenu: this.headerMenu,
            cellClick: this.cellClickEvent
          };

          if (options?.formatter) {
            if (options?.formatter === "color") {
              column.formatter = colorFixed
            } else if (options?.formatter === "chart") {
              column.headerSort = false
              column.headerFilter = false
              column.formatter = chartFormatter
              column.formatterParams = options.formatterParams
            } else {
              column.formatter = options?.formatter
            }
          }
          if (options?.formatter === "tickCross") {
            column.headerFilterParams = {"tristate": true};
            column.headerFilterEmptyCheck = function (value) {
              return value === null
            }
          }
          if (options?.editor === "list" && options?.editorParams) {
            column.editorParams = options.editorParams
            column.headerFilter =  options?.headerFilter == 'turned-off' ? false : options.headerFilter
          }

          return [
            ...acc,
            column,
          ]
        }, defaultColumns);
      }

      return Object.keys(this.schema).reduce((acc, key) => {
        if (key === '_columnOptions') {
          return acc
        }
        const column = {
          field: key,
          title: key,
          editor: this.schema[key] === 'BOOLEAN'? "tickCross" : true,
          headerFilter: this.schema[key] === 'BOOLEAN'? "tickCross" : "input",
          headerMenu: this.headerMenu,
          cellClick:this.cellClickEvent,
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
    }
  },
  watch: {
    schema: {
      handler(val, oldVal) {
        if (JSON.stringify(val) !== JSON.stringify(oldVal)) {
          this.$nextTick(() => {
            this.createTable()
          })
        }
      },
      deep: true
    },
    dataset: {
      handler(val, oldVal) {
        this.tableData = structuredClone(val)
        this.isLoadFromFile = false
        if (this.tabulator) {
          // const newColumns =
          // this.tabulator.setColumns(this.columns);
          setTimeout(() => {
            // this.tabulator.updateColumnDefinition(this.columns);
            this.tabulator.setData(this.dataset);
          },100)
        }
      },
      deep: true
    },
    columnOptions: {
      handler(val, oldVal) {
        this.updateColumnDefinition()
      },
      deep: true
    },
  },
  created() {
    this.createTable = throttle(this.createTable, 500)
  },
  methods: {
    async updateColumnDefinition() {
      if (this.tabulator && Object.keys(this.dataset).length > 0 ) {
        const tabulatorColumns = this.tabulator.getColumns()
        const columnDefinition = this.columns.reduce((acc, col) => {
          if (!col.field) {
            return [
              ...acc,
              col,
            ]
          }
          const tCol = tabulatorColumns.find((item) => {
            return item?._column.field === col.field
          })
          return [
            ...acc,
            {
              ...col,
              width: tCol?._column?.width || 90
            }
          ]
        },[])

        this.tabulator.setColumns(columnDefinition)
      }
    },
    createTable() {
      if (this.tabulator) {
        this.tabulator.destroy()
        this.tabulator = null
      }
      this.tabulator = new Tabulator(this.$refs.table, {
        addRowPos: 'top',
        placeholder:"No Data Available", //display message to user on empty table
        popupContainer: '#page',
        maxHeight: "100%",
        height: "100%",
        layout:"fitDataFill",

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
        ...this.tableOptions,
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

    cellClickEvent(e, {_cell: cell}){
      if (e instanceof FocusEvent) {
        const column = cell.column.field;
        const value = cell.value;
        const row = cell.row.position;
        this.$emit('cellClick', {row, column, value})
      }
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
      this.tableData = this.tabulator.getData()
      this.$root.writeData({data: structuredClone(this.tableData), schema: this.schema});
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
      const newRow = Object.keys(this.schema).reduce((acc, item) => {
        const defaultValue = this.schema[item] === 'BOOLEAN'
          ? false
          : ''
        return {
          ...acc,
          [item]: defaultValue
        }
      },{})
      this.tabulator.addRow(newRow);

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
    },
    getDataFromTable() {
      return this.tabulator.getData()
    },
    destroyTable() {
      if (this.tabulator) {
        this.tabulator.destroy()
      }
    },
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
.tabulator.editable-table {
  background-color: var(--background_main);
  border: 1px solid var(--border);
  border-radius: 4px;

  /*Theme the header*/
  .tabulator-header {
    background: var(--background_main);
    color: var(--text_main);

    /*Allow column header names to wrap lines*/
    .tabulator-col,
    .tabulator-col-row-handle {
      background: var(--background_main);
      white-space: normal;
    }

    .tabulator-col {
      &.tabulator-sortable.tabulator-col-sorter-element:hover {
        background-color: var(--background_secondary);
      }
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
    color: var(--text_main);
    background-color: var(--background_main);

    /*Color even rows*/
    &:nth-child(even) {
      background-color: var(--background_secondary);
    }
  }

  .tabulator-footer {
    background: var(--background_main);
    border-top: 1px solid var(--border);
    color: var(--text_main);

    .tabulator-paginator {
      color: var(--text_main);
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
        background-color: var(--button_primary_86);
        color: var(--background_main);
      }

      &.active {
        color: var(--background_main);
        background-color: var(--accent);
      }
    }
  }


}

.tabulator-menu.tabulator-popup-container {
  max-height: 150px;
  overflow: auto;

  & > .tabulator-menu-item {
    font-family: 'Proxima Nova', sans-serif;
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
