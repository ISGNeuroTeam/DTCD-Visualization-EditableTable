import pluginMeta from './Plugin.Meta';
import PluginComponent from './PluginComponent.vue';

import vClickOutside from 'v-click-outside'

import {
  PanelPlugin,
  LogSystemAdapter,
  EventSystemAdapter,
  StorageSystemAdapter,
  DataSourceSystemAdapter, WorkspaceSystemAdapter,
} from './../../DTCD-SDK';


export class VisualizationTable extends PanelPlugin {

  #id;
  #guid;
  #logSystem;
  #eventSystem;
  #storageSystem;
  #dataSourceSystem;
  #dataSourceSystemGUID;
  #workspaceSystem;
  #vueComponent;
  #vue
  #lastVisible
  #selector

  #config = {
    ...this.defaultConfig,
    columnOptions: "{}",
    dataSource: '',
    writeTokenName: ''
  }

  static getRegistrationMeta() {
    return pluginMeta;
  }

  constructor (guid, selector) {
    super();

    this.#guid = guid;
    this.#id = `${pluginMeta.name}[${guid}]`;
    this.#logSystem = new LogSystemAdapter('0.5.0', guid, pluginMeta.name);
    this.#eventSystem = new EventSystemAdapter('0.4.0', guid);
    this.#eventSystem.registerPluginInstance(this, ['Clicked']);
    this.#storageSystem = new StorageSystemAdapter('0.5.0');
    this.#dataSourceSystem = new DataSourceSystemAdapter('0.4.0');

    this.#dataSourceSystemGUID = this.getGUID(
      this.getSystem('DataSourceSystem', '0.2.0')
    );

    this.#selector = selector;


    this.#lastVisible = true

    this.createVueInstance()

    this.#logSystem.debug(`${this.#id} initialization complete`);
    this.#logSystem.info(`${this.#id} initialization complete`);
  }

  createVueInstance() {
    const { default: VueJS } = this.getDependence('Vue');

    VueJS.use(vClickOutside)

    const selector = this.#selector

    this.#vue = new VueJS({
      el: selector,
      data: () => ({}),
      render: h => h(PluginComponent),
      methods: {
        publishEventClicked: (value) => {
          this.#eventSystem.publishEvent('Clicked', value);
        },
        writeData: (dataset) => {
          this.writeData(dataset)
        }
      },
    })

    this.#vueComponent = this.#vue.$children[0];

    const workSpaceID = Application.autocomplete.WorkspaceSystem.currentWorkspaceID

    this.#vueComponent.setId(workSpaceID + this.#guid)

    this.setPluginConfig(this.#config)

  }

  setVisible(isVisible) {
    if (this.#lastVisible !== isVisible) {
      isVisible ? this.createVueInstance() : this.beforeUninstall();
      this.#lastVisible = isVisible;
    }
  }

  beforeUninstall() {
    this.#vueComponent.destroyTable()
    this.#vue.$destroy();
    const newRootElement = document.createElement(`div`);
    newRootElement.id = this.#selector.replace('#', '')
    this.#vue.$el.parentElement?.appendChild(newRootElement)
    this.#vue.$el.parentNode?.removeChild(this.#vue.$el);
  }

  setVueComponentPropValue(prop, value) {
    const methodName = `set${prop.charAt(0).toUpperCase() + prop.slice(1)}`;
    if (this.#vueComponent[methodName]) {
      this.#vueComponent[methodName](value)
    } else {
      throw new Error(`В компоненте отсутствует метод ${methodName} для присвоения свойства ${prop}`)
    }
  }

  setPluginConfig(config = {}) {
    this.#logSystem.debug(`Set new config to ${this.#id}`);
    this.#logSystem.info(`Set new config to ${this.#id}`);

    const configProps = Object.keys(this.#config);

    for (const [prop, value] of Object.entries(config)) {
      if (!configProps.includes(prop)) continue;

      if (prop !== 'dataSource' && prop !== 'writeTokenName') {
        this.setVueComponentPropValue(prop, value)
      } else if (prop === 'dataSource' && value) {
        if (this.#config[prop]) {
          this.#logSystem.debug(
              `Unsubscribing ${this.#id} from DataSourceStatusUpdate({ dataSource: ${this.#config[prop]}, status: success })`
          );
          this.#eventSystem.unsubscribe(
              this.#dataSourceSystemGUID,
              'DataSourceStatusUpdate',
              this.#guid,
              'processDataSourceEvent',
              { dataSource: this.#config[prop], status: 'success' },
          );

          this.#eventSystem.unsubscribe(
            this.#dataSourceSystemGUID,
            'DataSourceWriteStatusUpdate',
            this.#guid,
            'processDataSourceWriteEvent',
            { dataSource: this.#config[prop], status: 'new' },
          );

        }

        const dsNewName = value;

        this.#logSystem.debug(
            `Subscribing ${this.#id} for DataSourceStatusUpdate({ dataSource: ${dsNewName}, status: success })`
        );

        this.#eventSystem.subscribe(
            this.#dataSourceSystemGUID,
            'DataSourceStatusUpdate',
            this.#guid,
            'processDataSourceEvent',
            { dataSource: dsNewName, status: 'success' },
        );

        const ds = this.#dataSourceSystem.getDataSource(dsNewName);

        if (ds.type === 'otlrw') {
          this.#eventSystem.subscribe(
            this.#dataSourceSystemGUID,
            'DataSourceWriteStatusUpdate',
            this.#guid,
            'processDataSourceWriteEvent',
            { dataSource: dsNewName, status: 'failed' },
          );
        }

        if (ds && ds.status === 'success') {
          const data = this.#storageSystem.session.getRecord(dsNewName);
          const schema = this.#storageSystem.session.getRecord(`${dsNewName}_SCHEMA`)
          this.loadSchema(schema);
          this.loadData(data);
        }
      }

      this.#config[prop] = value;
      this.#logSystem.debug(`${this.#id} config prop value "${prop}" set to "${value}"`);
    }
  }

  getPluginConfig() {
    return { ...this.#config };
  }

  loadData(data) {
    this.#vueComponent.setDataset(data);
  }
  loadSchema(schema) {
    this.#vueComponent.setSchema(schema);
  }

  processDataSourceEvent(eventData) {
    const { dataSource, status } = eventData;
    const data = this.#storageSystem.session.getRecord(dataSource);
    const schema = this.#storageSystem.session.getRecord(`${dataSource}_SCHEMA`)

    this.#logSystem.debug(
      `${this.#id} process DataSourceStatusUpdate({ dataSource: ${dataSource}, status: ${status} })`
    );
    this.loadSchema(schema);
    this.loadData(data);
  }

  processDataSourceWriteEvent({dataSource, status}) {
    this.#vueComponent.setWriteStatus(status)

    this.#logSystem.debug(
      `${this.#id} process DataSourceWriteStatusUpdate({ dataSource: ${dataSource}, status: ${status} })`
    );

  }

  getDatasetFromTable() {
    return this.#vueComponent.$refs.editableTableComponent.getDataFromTable()
  }

  setFormSettings(config) {
    return this.setPluginConfig(config);
  }

  getFormSettings() {
    return {
      fields: [
        {
          component: 'title',
          propValue: 'Общие настройки',
        },
        {
          component: 'title',
          propValue: 'Источник данных',
        },
        {
          component: 'datasource',
          propName: 'dataSource',
          attrs: {
            label: 'Выберите источник данных',
            placeholder: 'Выберите значение',
            required: true,
          },
        },
        ...this.defaultFields,
        {
          component: 'textarea',
          propName: 'columnOptions',
          attrs: {
            label: 'Настройки для колонок',
            propValue: '{}',
          },
        },
      ],
    };
  }

  getState() {
    return Object.assign(
      this.getPluginConfig(),
      { dataset: this.#vueComponent.dataset },
    );
  }

  setState(newState) {
    if (typeof newState !== 'object' ) return;

    this.setPluginConfig(newState);

    const vueNamesFields = [
      'dataset',
    ];

    for (const [prop, value] of Object.entries(newState)) {
      if (!vueNamesFields.includes(prop)) continue;
      this.#vueComponent[prop] = value;
    }
  }



  writeData(dataset) {
    const dsName = this.#config?.dataSource
    if (!dsName) return
    this.#dataSourceSystem.instance.runDataSourceWrite(dsName, dataset)
  }
}
