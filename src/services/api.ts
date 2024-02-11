import axios, { AxiosResponse } from 'axios'
import { File, FileObject, Folder, UploadingFile } from '@/structs'

// for development
// export const api_address = 'localhost:3000'
// for production
export const api_address = window.location.host

export default class FileOperationApi {
  protected __download_file (url : string) : void {
    window.location.href = url
  }

  public api_download_file (file : File) : void {
    this.__download_file(`http://${api_address}/f/downloadFile?id=${file.id}`)
  }

  public api_add_folder (folder : Folder, name : string) : Promise<{ data: Folder }> {
    /*
      Args:
        folder: the folder to add the new folder to
        name: the name of the new folder
    */
    return axios.get(`http://${api_address}/f/addFolder`, { params: { id: folder.id, name: name } })
  }

  public api_delete_file_obj (file_obj : FileObject, pw? : string) : Promise<{ data: null }> {
    return axios.get(`http://${api_address}/f/deleteFileObj`, { params: { id: file_obj.id, pw: pw } })
  }

  public api_check_file_obj_lock (file_obj : FileObject) : Promise<{ data: boolean }> {
    return axios.get(`http://${api_address}/f/checkFileObjLock`, { params: { id: file_obj.id } })
  }

  public api_upload_file (file : UploadingFile) : Promise<AxiosResponse> {
    return axios.post(
      `http://${api_address}/f/uploadFile`,
      file.form_data,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: file.abort_controller.signal,
        onUploadProgress: ({ total, loaded }) => {
          if (total === undefined) {
            return
          }
          file.on_progress(total, loaded)
        }
      }
    )
  }
}

export class WebpageApi {
  public api_check_admin () : Promise<{ data: boolean }> {
    return axios.get(`http://${api_address}/w/checkAdmin`)
  }

  public api_get_admin_pass (password : string) : Promise<{ data: string | false }> {
    return axios.get(`http://${api_address}/w/getAdminPass`, { params: { pw: password } })
  }

  public api_check_admin_pass (password : string) : Promise<{ data: boolean }> {
    return axios.get(`http://${api_address}/w/checkAdminPass`, { params: { pw: password } })
  }

  public api_get_folder_info (folder_id : number) : Promise<{ data: Folder }> {
    return axios.get(`http://${api_address}/w/getFolderInfo`, { params: { id: folder_id } })
  }
}

export class WsApi {
  protected __create_websocket (url : string) : WebSocket {
    return new WebSocket(url)
  }

  public ws_file_list (folder : Folder) : WebSocket {
    return this.__create_websocket(`ws://${api_address}/ws/fileList?id=${folder.id}`)
  }
}

export const file_operation_api = new FileOperationApi()
export const webpage_api = new WebpageApi()
export const ws_api = new WsApi()
