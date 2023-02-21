<template>
  <div class="VisualizationTable" style="height: 100%">
    <editable-table
      ref="editableTableComponent"
      :dataset="dataset"
      :schema="schema"
      :id="id"
      :columnOptions="columnOptions"
      :title="getTitle"
      :writeStatus="writeStatus"
      @cellClick="this.$root.publishEventClicked"
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
    titleFromConfig: '',
    hiddenColumns: [
      'metadata',
    ],
    id:0,
    schema: {},
    writeStatus: ''

  }),
  computed: {
    headers() {
      if (this.dataset.length < 1) {
        return [];
      }
      return Object.keys(this.dataset[0])
        .filter((name) => !this.hiddenColumns.includes(name))
    },
    getTitle() {
      return this.titleFromConfig || this.title
    }
  },
  methods: {
    setId(id) {
      this.id = id;
    },
    setTitle(value = '') {
      this.titleFromConfig = value;
    },
    // setColumnOptions(val) {
    //   if (val.length > 0) {
    //     try {
    //       const columnOptions = JSON?.parse(val.replaceAll("'", '"'))
    //       if (Object.keys(columnOptions).length > 0) {
    //         this.columnOptionsFromConfig = columnOptions
    //         return;
    //       }
    //     } catch (e) {
    //       console.error('error')
    //     }
    //
    //
    //   }
    //
    //   this.columnOptionsFromConfig = null
    //   this.columnOptions = null
    // },
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
    setColumnConfig(columnConfig) {
      const columnOptions = Object.keys(columnConfig).reduce((metricAcc,metric) => {
        const metricProps = Object.keys(columnConfig[metric]).reduce((processedProp, prop) => {
          const propValue = columnConfig[metric][prop]
          if (prop === 'editor') {
            if (propValue !== '') {
              processedProp.editor = propValue === 'false'
                ? false
                : propValue === 'true'
                  ? true
                  : propValue;
            } else {
              processedProp.editor = false
            }
            return processedProp
          }
          if (prop === 'list') {
            try {
              const parsedValue = JSON.parse(propValue?.replaceAll("'", '"'))
              if (Object.keys(parsedValue).length > 0) {
                processedProp.editorParams = parsedValue
              }
              return processedProp
            } catch (e) {
              return processedProp
            }
          }
          if (prop === 'formatter') {
            if (propValue !== 'null') {
            processedProp[prop] = propValue
            }
            return processedProp
          }

          processedProp[prop] = propValue
          return processedProp

        },{})

        return {
          ...metricAcc,
          [metric]: metricProps,
        }
      }, {})

      this.columnOptionsFromConfig = columnOptions
      this.columnOptions = columnOptions
    },
    setDataset(data = []) {
      this.columnOptions = {}
      let hasServiceFields = false
      this.dataset = data.reduce((acc, item) => {
        if (!!(this.isServiceFields(item))) {
          hasServiceFields = true
          if (!this.columnOptionsFromConfig) {
            this.title = this.titleFromConfig || item?._header || ''
            this.columnOptions = item?._columnOptions ? JSON.parse(item?._columnOptions?.replaceAll("'", '"')) : {};
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
    },
    setWriteStatus(status) {
      if (status === 'new') {
        this.writeStatus = 'run'
      } else if (status === 'success') {
        this.writeStatus = 'done'
        setTimeout(() => {
          this.writeStatus = ''
        },500);
      } else {
        this.writeStatus = ''
      }
    },
    destroyTable() {
      this.$refs.editableTableComponent?.destroyTable()
    }
  },
};
</script>

<style lang="scss" scoped>
</style>
