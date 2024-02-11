<template>
  <div id="c_file_list">
    <section id="header">
      <span id="folder_nm">
        <span v-for="{ id, name } in cur_folder.path" :key="id">
          <span class="folder_nm_item" @click="change_folder(id)">{{name}}</span>
          <span class="spliter">/</span>
        </span>
      </span>
      <div id="file_operation" v-show="selected_file_obj_set.size > 0">
        <span>{{ selected_file_obj_set.size }} file</span>
        <font-awesome-icon icon="download" class='btn_download'
          @click="component_api.download_multi_file" v-show="component_api.check_only_file_selected()"/>
        <font-awesome-icon icon="trash" class='btn_delete'
          @click="component_api.delete_multi_file"/>
      </div>
    </section>

    <div id="file_drop_area"
      @dragover="evt => evt.preventDefault()"
      @drop="evt => component_api.drop_upload(evt)"
      @click="selected_file_obj_set.clear()">

      <!-- files in the folder -->
      <div v-for="file_obj in cur_file_obj_ls" :key="file_obj.id"
        class="file_obj" :class="selected_file_obj_set.has(file_obj) ? 'selected' : ''"
        @click="evt => component_api.select_file_obj(evt, file_obj)"
        @dblclick="component_api.dblclick_file_obj(file_obj)">
        <div>
          <font-awesome-icon :icon="file_obj.type"/>
        </div>
        <span class="file_name">{{ file_obj.name }}</span>
        <font-awesome-icon icon="signal" class='icon_using'
          v-if="file_obj.type === 'file' && (file_obj as _File).is_lock"/>
      </div>

      <!-- uploading files -->
      <div v-for="uploading_file in files_to_be_uploaded" :key="uploading_file.internal_id"
        class="file_obj uploading">
        <div>
          <font-awesome-icon icon="spinner" class="icon_uploading"/>
          <font-awesome-icon icon="times" class="icon_cancel" @click="component_api.cancel_upload(uploading_file)"/>
        </div>
        <progress :value="uploading_file.progress" max="100"></progress>
        <span class="file_name">{{ uploading_file.name }}</span>
      </div>
    </div>

    <!-- login dialog -->
    <dialog ref="dg_login_admin" id="dg_login_admin">
      <div>Please enter the admin password:</div>
      <form method="dialog">
          <div><input type="text" ref="dg_login_pw" v-model="password"></div>
          <div>
              <button class="submit"
                @click="evt => component_api.dg_login_submit(evt)">
                Login
              </button>
              <button class="cancel" ref="dg_login_cancel">Cancel</button>
          </div>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, getCurrentInstance, ref } from 'vue'

import { FileObject, File as _File, UploadingFile, Folder } from '@/structs'
import { file_operation_api as fo_api, webpage_api as wp_api } from '@/services/api'
import { change_folder } from '@/services/folder_service'
import { auth_service } from '@/services/auth_service'
import { file_upload_helper } from '@/services/upload_file_service'
import { cur_folder, cur_file_obj_ls, files_to_be_uploaded, is_admin_ip } from '@/services/store'

// === reactive objects === //
const selected_file_obj_set : Set<FileObject> = reactive(new Set())
const password = ref('')

// === variables === //
const instance = getCurrentInstance()!

// === methods === //
class ComponetApi {
  public async check_admin_pass () : Promise<boolean> {
    const admin_pass_valid = await auth_service.check_admin_pass()

    if (!is_admin_ip.value && !admin_pass_valid) {
      const dialog = instance.refs.dg_login_admin as HTMLDialogElement
      if (dialog.showModal === undefined) {
        dialog.open = true
      } else {
        dialog.showModal()
      }

      const dg_login_pw = instance.refs.dg_login_pw as HTMLInputElement
      dg_login_pw.value = ''
      dg_login_pw.focus()

      return false
    }
    return true
  }

  public check_only_file_selected () : boolean {
    if (selected_file_obj_set.size === 0) {
      return false
    }

    for (const file_obj of Array.from(selected_file_obj_set)) {
      if (file_obj.type === 'folder') {
        return false
      }
    }
    return true
  }

  public select_file_obj (evt : MouseEvent, file_obj : FileObject) {
    evt.stopPropagation()
    const item_selected = selected_file_obj_set.has(file_obj)
    const holding_ctrl = evt.ctrlKey
    const multi_selecting = selected_file_obj_set.size >= 2

    if (!holding_ctrl) {
      selected_file_obj_set.clear()
    }

    if (!item_selected || (multi_selecting && item_selected && !holding_ctrl)) {
      selected_file_obj_set.add(file_obj)
    } else {
      selected_file_obj_set.delete(file_obj)
    }
  }

  public dblclick_file_obj (file_obj : FileObject) {
    if (file_obj.type === 'folder') {
      change_folder(file_obj.id)
    } else {
      fo_api.api_download_file(file_obj as _File)
    }
  }

  public download_multi_file () : void {
    // download multiple files
    // wait for 0.1 second for each file
    const thisInstance = this ? this : component_api

    if (!thisInstance.check_only_file_selected()) {
      return
    }

    const selected_file_obj = selected_file_obj_set as Set<_File>
    let i = 0
    for (const file of Array.from(selected_file_obj)) {
      setTimeout(() => {
        fo_api.api_download_file(file)
      }, i++ * 100)
    }
  }

  public async delete_multi_file () : Promise<void> {
    const thisInstance = this ? this : component_api

    if (!await thisInstance.check_admin_pass()) {
      return
    }

    for (const file_obj of Array.from(selected_file_obj_set)) {
      const is_lock = (await fo_api.api_check_file_obj_lock(file_obj)).data
      if (is_lock) continue

      fo_api.api_delete_file_obj(file_obj, auth_service.admin_pass as string)
      selected_file_obj_set.delete(file_obj)
    }
  }

  public drop_upload (evt : DragEvent) {
    evt.preventDefault()
    if (evt.dataTransfer) {
      for (const file of evt.dataTransfer.files) {
        file_upload_helper.add_upload(file, cur_folder.value as Folder)
      }
    }
  }

  public cancel_upload (uploading_file : UploadingFile) {
    file_upload_helper.cancel_upload(uploading_file)
  }

  public async dg_login_submit (evt : UIEvent) {
    evt.preventDefault()

    const result : { data: string | false } = await wp_api.api_get_admin_pass(password.value)
    if (result.data !== false) {
      (instance.refs.dg_login_cancel as HTMLButtonElement).click()
      auth_service.admin_pass = result.data as string
    } else {
      alert('Wrong password')
    }
  }
}
const component_api = new ComponetApi()
</script>

<style>
@import url("../assets/css/FileList.css");
</style>
