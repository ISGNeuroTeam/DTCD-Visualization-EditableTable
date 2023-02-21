export const getFieldsForConfig = (key) => ([
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
        label: `Замарозить`,
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
        { label: 'Текстовое поле', value: 'input' },
        { label: 'Выпадающий список', value: 'list' },
      ],
    },
    {
      component: 'textarea',
      propName: `field.${key}.list`,
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
      ],
    },
    {
      component: 'select',
      propName: `field.${key}.headerFilter`,
      attrs: {
        label: `Фильтр`,
        propValue: 'input',
      },
      options: [
        { label: 'Текст', value: 'input' },
        { label: 'Checkbox', value: 'tickCross' },
      ],
    },
])

export default {getFieldsForConfig}