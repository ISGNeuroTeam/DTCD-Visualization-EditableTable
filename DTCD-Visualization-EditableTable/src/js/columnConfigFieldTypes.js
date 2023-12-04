export const getFieldsForConfig = (key) => ([
  {
    component: 'divider',
  },
  {
    component: 'title',
    propValue: `${key}`,
  },
  {
    component: 'text',
    propName: `field.${key}.title`,
    attrs: {
      label: `Имя`,
      propValue: key,
    },
  },
  {
    component: 'switch',
    propName: `field.${key}.frozen`,
    attrs: {
      label: `Закрепить`,
      propValue: false,
    },
  },
  {
    component: 'select',
    propName: `field.${key}.editor`,
    attrs: {
      label: `Редактирование`,
      propValue: false,
    },
    options: [
      { label: 'Выключить', value: false },
      { label: 'Включить', value: true },
      { label: 'Текстовое поле', value: 'input' },
      { label: 'Выпадающий список', value: 'list' },
    ],
  },
  {
    component: 'textarea',
    propName: `field.${key}.editorParams`,
    attrs: {
      label: 'Настройки для выпадающего списка',
      propValue: '{}',
    },
  },
  {
    component: 'select',
    propName: `field.${key}.formatter`,
    attrs: {
      label: `Формат отображения данных`,
      propValue: null,
    },
    options: [
      { label: 'Текст', value: null },
      { label: 'Checkbox', value: 'tickCross' },
      { label: 'Цвет', value: 'color' },

      //TODO: добавить выбор графика
      // (в данный момент можно выбрать график для не подходящих данных и словить ошибку)

      // { label: 'График', value: 'chart' },
    ],
  },
  {
    component: 'select',
    propName: `field.${key}.headerFilter`,
    attrs: {
      label: `Фильтр`,
    },
    options: [
      { label: 'Текст', value: 'input' },
      { label: 'Checkbox', value: 'tickCross' },
      { label: 'Отключено', value: 'turned-off' },
    ],
  },
])

export default {getFieldsForConfig}
