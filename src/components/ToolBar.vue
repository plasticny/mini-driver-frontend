<template>
  <div id="c_tool_bar">
    <div id="tool_button_wrapper">
      <div @click="component_api.upload_clicked">
        <font-awesome-icon
          icon="file-circle-plus"
          id="btn_upload"
          class="tool_button"
        />
      </div>
      <div v-if="is_admin_ip" @click="component_api.add_folder_clicked">
        <font-awesome-icon
          icon="folder-plus"
          id="btn_add_folder"
          class="tool_button"
        />
      </div>
    </div>

    <!-- add folder dialog -->
    <dialog ref="dg_add_folder" id="dg_add_folder">
      <div>Enter the name of new folder:</div>
      <form method="dialog">
          <div><input type="text" ref="dg_add_folder_nm"></div>
          <div>
              <button class="submit" @click="component_api.dg_add_folder_submit()">
                Add
              </button>
              <button class="cancel" ref="dg_add_folder_cancel">Cancel</button>
          </div>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue'

import { file_operation_api } from '@/services/api'
import { file_upload_helper } from '@/services/upload_file_service'

import { cur_folder, is_admin_ip } from '@/services/store'
import { Folder } from '@/structs'

// === variables === //
const instasnce = getCurrentInstance()!

// === methods === //
class ComponetApi {
  public upload_clicked () {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = () => {
      for (const file of input.files!) {
        file_upload_helper.add_upload(file, cur_folder.value as Folder)
      }
    }
    input.click()
  }

  public add_folder_clicked () {
    const dg_add_folder = instasnce.refs.dg_add_folder as HTMLDialogElement
    if (dg_add_folder.showModal === undefined) {
      dg_add_folder.open = true
    } else {
      dg_add_folder.showModal()
    }

    const dg_add_folder_nm = instasnce.refs.dg_add_folder_nm as HTMLInputElement
    dg_add_folder_nm.value = 'New Folder'
    dg_add_folder_nm.focus()
  }

  public dg_add_folder_submit () {
    const dg_add_folder_nm = instasnce.refs.dg_add_folder_nm as HTMLInputElement
    file_operation_api.api_add_folder(cur_folder.value as Folder, dg_add_folder_nm.value)
    dg_add_folder_nm.value = ''

    // close dialog
    const dg_add_folder = instasnce.refs.dg_add_folder as HTMLDialogElement
    if (dg_add_folder.close === undefined) {
      dg_add_folder.open = false
    } else {
      dg_add_folder.close()
    }
  }
}
const component_api = new ComponetApi()
</script>

<style>
@import url("../assets/css/ToolBar.css");
</style>
