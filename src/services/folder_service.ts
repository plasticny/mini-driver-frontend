import { FileObject, Folder } from '@/structs'
import { ws_api, webpage_api } from './api'
import { cur_folder, set_file_obj_ls } from './store'

/* === websocket for updating file object list === */
const __file_obj_ls_ws = ws_api.ws_file_list(cur_folder.value as Folder)
__file_obj_ls_ws.onmessage = on_ws_message

function on_ws_message (evt : MessageEvent) {
  let msg_list : Array<FileObject> = JSON.parse(evt.data)
  msg_list = msg_list.sort(
    (a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    }
  )
  set_file_obj_ls(msg_list)
}

/* === public functions === */
export async function change_folder (id : number) : Promise<boolean> {
  while (__file_obj_ls_ws.readyState === WebSocket.CONNECTING) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return new Promise((resolve, reject) => {
    if (__file_obj_ls_ws.readyState !== WebSocket.OPEN) {
      reject(new Error(`websocket not open. State: ${__file_obj_ls_ws.readyState}`))
      return
    }

    __file_obj_ls_ws.send(JSON.stringify({ action: 'change_folder', id }))
    webpage_api.api_get_folder_info(id).then(ret_folder => {
      cur_folder.value = ret_folder.data
      resolve(true)
    })
  })
}
