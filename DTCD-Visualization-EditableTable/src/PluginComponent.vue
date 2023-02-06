<template>
  <div class="VisualizationTable" style="height: 100%">
    <editable-table
      :dataset="dataset"
      :schema="schema"
      :id="id"
      :columnOptions="columnOptions"
      :title="title"
    />
  </div>
</template>

<script>


import EditableTable from './components/EditableTable'; //import Tabulator library

export default {
  name: 'PluginComponent',
  components: {
    EditableTable
  },

  data: () => ({
    panelSize: {
      height:200,
      width:200
    },
    columnOptions: null,
    columnOptionsFromConfig: null,
    dataset: [],
    title: '',
    hiddenColumns: [
      'metadata',
    ],
    id:0,
    schema: {},


  }),
  computed: {
    headers() {
      if (this.dataset.length < 1) {
        return [];
      }
      return Object.keys(this.dataset[0])
        .filter((name) => !this.hiddenColumns.includes(name))
    },

  },
  methods: {
    setId(id) {
      this.id = id;
    },
    setTitle(value = '') {
      this.title = value;
    },
    setColumnOptions(val) {
      if (val.length > 0) {
        try {
          const columnOptions = JSON?.parse(val.replaceAll("'", '"'))
          if (Object.keys(columnOptions).length > 0) {
            this.columnOptionsFromConfig = columnOptions
            return
          }
        } catch (e) {
        }
        

      }

      this.columnOptionsFromConfig = null
      this.columnOptions = null
    },
    isServiceFields(item) {
      const serviceFields = [
        '_header',
        '_columnOptions',
      ]
      return serviceFields.reduce((acc, field) => {
        return Object.keys(item).includes(field) || acc
      },false)
    },
    setSchema(schema) {
      this.schema = schema;
    },

    setDataset(data = []) {
      this.columnOptions = {}
      let hasServiceFields = false
      this.dataset = data.reduce((acc, item) => {
        if (!!(this.isServiceFields(item))) {
          hasServiceFields = true
          if (!this.columnOptionsFromConfig) {
            this.title = this.titleFromConfig || item?._header || ''
            this.columnOptions = item?._columnOptions ? JSON?.parse(item?._columnOptions?.replaceAll("'", '"')) : {};
          } else {
            this.columnOptions = this.columnOptionsFromConfig
          }
        }
        if (!(this.isServiceFields(item))) {
          return [...acc, item]
        }

        return acc
      },[])
      if (!hasServiceFields  && !!this.columnOptionsFromConfig) {
        this.columnOptions = this.columnOptionsFromConfig
      }
    },

    /**
     * Генерируем стили для ячейки по метаданным в таблице
     * metadata = "{'имяЯчейкиВСтроке':{'text_color':'red', ... }, ... }"
     * @param {Object} row
     * @param {String} colName
     * @return {null|{Object}}
     */
    getCellStyle(row, colName) {
      if (row.metadata) {
        const styles = new Map();
        const propsToStyles = [
          ['text_color', 'color'],
          ['text_weight',  'font-weight'],
          ['background_color',  'background-color'],
        ];
        try {
          const metadata = JSON.parse(row.metadata.replaceAll("'", '"'));
          if (metadata.hasOwnProperty(colName)) {
            const cellMetadata = metadata[colName];
            propsToStyles.forEach(([key, styleName]) => {
              if (cellMetadata.hasOwnProperty(key)) {
                styles.set(styleName, cellMetadata[key])
              }
            })
            return Object.fromEntries(styles);
          }
        } catch (err) {
          console.warn(err)
        }
      }
      return null;
    }
  },
};
</script>

<style lang="scss" scoped>

//@import "./scss/theme-default/index.css";
//*
//  box-sizing: border-box
//  margin: 0
//  padding: 0
//.VisualizationTable
//  width: 100%
//  height: 100%
//  overflow: auto
//  padding: 10px
//  color: var(--text_secondary)
//  font-family: 'Proxima Nova', sans-serif
//  background-color: var(--background_main)
//
//  .title
//    color: var(--text_main)
//    font-size: 18px
//    font-weight: 700
//    line-height: 25px
//    padding-bottom: 8px
//
//  .NoData
//    height: 100%
//    display: flex
//    flex-direction: column
//    align-items: center
//    justify-content: center
//
//    .Icon
//      color: var(--border_secondary)
//      font-size: 100px
//      margin-bottom: 8px
//
//  .DataTable
//    width: 100%
//    text-align: left
//    border-collapse: collapse
//
//    thead
//      color: var(--title)
//      font-size: 15px
//      font-weight: 700
//
//      tr th
//        height: 40px
//        padding: 0 30px
//        background-color: var(--border_24)
//
//    tbody
//      color: var(--text_main)
//
//      tr
//        height: 30px
//        font-size: 13px
//        line-height: 16px
//
//        td
//          padding: 10px 30px
//
//        &:nth-child(even)
//          background-color: var(--border_24)
</style>
