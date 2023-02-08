<template>
  <div class="Buttons">
    <base-tooltip content="Write to server" placement="bottom">
      <base-icon-button @click="$emit('action', 'writeData')">
        <span class="FontIcon name_cloudUp "/>
      </base-icon-button>
    </base-tooltip>

    <base-tooltip content="Add new row" placement="bottom">
      <base-icon-button @click="$emit('action', 'addDataRow')">
        <span class="FontIcon name_addRow"/>
      </base-icon-button>
    </base-tooltip>

    <base-tooltip content="Delete selected rows" placement="bottom">
      <base-icon-button @click="$emit('action', 'removeDataRow')">
        <span class="FontIcon name_deleteRow"/>
      </base-icon-button>
    </base-tooltip>


    <span class="ButtonsSeparator"></span>

    <base-dropdown
      v-if="false"
      class="listDropDownWrapper"
    >
      <div slot="toggle-btn">
        <base-tooltip content="Load from local file" placement="bottom" >
          <base-icon-button>
              <span
                v-if="!loadListIsActive"
                @click="openLoadFileList"
                class="FontIcon size_md"
                :class="loadArrowIcon"
              />
            <span
              v-else
              @click="loadListIsActive = false"
              class="FontIcon size_md"
              :class="loadArrowIcon"
            />
          </base-icon-button>
        </base-tooltip>

        <div
          class="Select"
          v-if="loadListIsActive"
        >
          <ul
            class="Menu"
            v-click-outside="openLoadFileList"
          >
            <li
              v-for="(item, index) in this.loadFiles"
              :key="index"

              class="Item"
              @click="loadFile(index)"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
      <span slot="icon-arrow"/>
    </base-dropdown>

    <base-dropdown class="listDropDownWrapper">
      <div slot="toggle-btn">
        <base-tooltip content="Download file" placement="bottom" >
          <base-icon-button>
              <span
                v-if="!downloadListIsActive"
                @click="openDownloadFileList"
                class="FontIcon size_md"
                :class="downloadArrowIcon"
              />
            <span
              v-else
              @click="downloadListIsActive = false"
              class="FontIcon size_md"
              :class="downloadArrowIcon"
            />
          </base-icon-button>
        </base-tooltip>

        <div
          class="Select"
          v-if="downloadListIsActive"
        >
          <ul
            class="Menu"
            v-click-outside="closeDownloadFileList"
          >
            <li
              v-for="(item, index) in this.downloadFiles"
              :key="index"

              class="Item"
              @click="downloadFile(index)"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
      <span slot="icon-arrow"/>
    </base-dropdown>

    <span class="ButtonsSeparator"></span>
    <base-tooltip content="Undo" placement="bottom">
      <base-icon-button @click="$emit('action', 'undo')">
        <span class="FontIcon name_undo"/>
      </base-icon-button>
    </base-tooltip>

    <base-tooltip content="Redo" placement="bottom">
      <base-icon-button @click="$emit('action', 'redo')">
        <span class="FontIcon name_redo"/>
      </base-icon-button>
    </base-tooltip>

  </div>
</template>

<script>

export default {
  name: 'EditableTableControls',
  data: () => ({
    downloadListIsActive: false,
    downloadFiles: {
      downloadCSV: 'CSV',
      downloadJSON: 'JSON',
      downloadXLSX: 'XLSX',
      downloadPDF: 'PDF',
      downloadHTML: 'HTML',
    },
    loadListIsActive: false,
    loadFiles: {
      loadCSV: 'CSV',
      loadJSON: 'JSON',
    }
  }),
  computed: {
    loadArrowIcon() {
      if (this.loadListIsActive) {
        return 'FontIcon name_chevronDown rotate_180';
      } else {
        return 'FontIcon name_fileBlankFill';
      }
    },
    downloadArrowIcon() {
      if (this.downloadListIsActive) {
        return 'FontIcon name_chevronDown rotate_180';
      } else {
        return 'FontIcon name_download';
      }
    },
  },
  methods: {
    openDownloadFileList() {
        this.downloadListIsActive = true
    },
    downloadFile(downloadType) {
      this.$emit('action', downloadType)
      this.closeDownloadFileList()
    },
    closeDownloadFileList() {
      if (this.downloadListIsActive === true) {
        this.downloadListIsActive = false
      }

    },
    openLoadFileList() {
        this.loadListIsActive = true
    },
    loadFile(loadType) {
      this.$emit('action', loadType)
      this.closeLoadFileList()
    },
    closeLoadFileList() {
      if (this.loadListIsActive === true) {
        this.loadListIsActive = false
      }

    }
  },
};
</script>

<style lang="scss" scoped>
.Buttons {
  padding: 0 10px 10px;
  display: flex;
  flex-wrap: wrap;
  column-gap: 4px;
  row-gap: 10px;

  &Separator {
    height: 28px;
    width: 2px;
    background-color: var(--border_secondary);
    display: inline-block;
    vertical-align: middle;
  }
}

.Select {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  min-width: 160px;
  width: 249px;
  display: inline-block;
  vertical-align: middle;
  z-index: 1;

  .Menu {
    border: 1px solid var(--border);
    background-color: var(--background_main);
    list-style-type: none;
    border-radius: 4.44px;
    margin: 0;
    max-height: 251px;
    overflow-y: scroll;
    padding: 3px;
    margin-top: -1px;
  }

  .Item {
    font-weight: 400;
    font-size: 14px;
    color: var(--text_secondary);
    padding: 7px 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    position: relative;

    & + .Item::after {
      content: '';
      position: absolute;
      top: -0.5px;
      left: 0;
      width: calc(100% + 6px);
      margin-left: -3px;
      height: 1px;
      background-color: var(--border);
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      box-shadow: 0 0 0 3px var(--button_primary);
      border-radius: 1px;
      pointer-events: none;
      opacity: 0;
      transition: opacity .1s ease;
      z-index: 1;
    }

    &:hover {
      color: var(--text_main);
      z-index: 5;

      &::before {
        opacity: 1;
      }
    }
  }
}
</style>
