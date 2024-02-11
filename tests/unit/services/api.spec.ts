import axois from 'axios'
import FileOperationApi, {
  api_address,
  webpage_api,
  WsApi
} from '@/services/api'

import { File, Folder, FileObject, UploadingFile } from '@/structs'

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn()
}))

class fake_FileOperationApi extends FileOperationApi {
  public __download_file (url : string) : void {
    window.location.href = url
  }
}
class fake_WsApi extends WsApi {
  id = Math.random()
  public __create_websocket (url : string) : WebSocket {
    // ensure the ws_file_list function returns this object
    return { url: this.id.toString() } as WebSocket
  }
}

describe('api.ts', () => {
  const axios_get_mock = jest.spyOn(axois, 'get')
  const axios_post_mock = jest.spyOn(axois, 'post')

  beforeEach(() => {
    axios_get_mock.mockClear()
  })

  test('the api address is production ip', () => {
    expect(api_address).toBe(window.location.host)
  })

  describe('file_operation_api', () => {
    const fo_api = new fake_FileOperationApi()

    test('api_download_file', () => {
      const download_file_mock = jest.spyOn(fo_api, '__download_file')
      download_file_mock.mockImplementation(() => {})

      const file : Partial<File> = { id: 1 }
      fo_api.api_download_file(file as File)

      expect(download_file_mock).toBeCalledTimes(1)

      const url = new URL(download_file_mock.mock.calls[0][0])
      expect(url.hostname).toBe(api_address)
      expect(url.pathname).toBe('/f/downloadFile')
      expect(url.searchParams.get('id')).toBe(file.id!.toString())
    })

    test('api_add_folder', () => {
      const parent_folder : Partial<Folder> = { id: 1 }

      const folder : Partial<Folder> = { id: 2, name: 'test' }
      axios_get_mock.mockResolvedValue({ data: folder })

      const ret_folder = fo_api.api_add_folder(parent_folder as Folder, 'test')
      
      expect(axios_get_mock).toBeCalledTimes(1)
      expect(ret_folder).resolves.toEqual({ data: folder })
      
      const url = new URL(axios_get_mock.mock.calls[0][0])
      const get_params = axios_get_mock.mock.calls[0][1]

      expect(url.hostname).toBe(api_address)
      expect(url.pathname).toBe('/f/addFolder')
      expect(get_params!.params.id).toBe(parent_folder.id!)
      expect(get_params!.params.name).toBe('test')
    })

    test('api_delete_file_obj', () => {
      const file_obj : Partial<FileObject> = { id: 1 }

      fo_api.api_delete_file_obj(file_obj as FileObject, 'pw')

      expect(axios_get_mock).toBeCalledTimes(1)

      const url = new URL(axios_get_mock.mock.calls[0][0])
      const get_params = axios_get_mock.mock.calls[0][1]

      expect(url.hostname).toBe(api_address)
      expect(url.pathname).toBe('/f/deleteFileObj')
      expect(get_params!.params.id).toBe(file_obj.id!)
      expect(get_params!.params.pw).toBe('pw')
    })

    test('api_check_file_obj_lock', () => {
      const file_obj : Partial<FileObject> = { id: 1 }
      axios_get_mock.mockResolvedValue({ data: true })

      const ret = fo_api.api_check_file_obj_lock(file_obj as FileObject)

      expect(axios_get_mock).toBeCalledTimes(1)
      expect(ret).resolves.toEqual({ data: true })

      const url = new URL(axios_get_mock.mock.calls[0][0])
      const get_params = axios_get_mock.mock.calls[0][1]

      expect(url.hostname).toBe(api_address)
      expect(url.pathname).toBe('/f/checkFileObjLock')
      expect(get_params!.params.id).toBe(file_obj.id!)
    })

    test('api_upload_file', () => {
      const uploading_file = new UploadingFile(
        { name: 'test' } as globalThis.File,
        { id: 1 } as Folder
      )
      const fake_form_data = new FormData()
      jest.spyOn(uploading_file, 'form_data', 'get').mockReturnValue(fake_form_data)

      fo_api.api_upload_file(uploading_file)

      expect(axios_post_mock).toBeCalledTimes(1)

      const url = new URL(axios_post_mock.mock.calls[0][0])
      const form_data = axios_post_mock.mock.calls[0][1]
      const post_params = axios_post_mock.mock.calls[0][2]

      expect(url.hostname).toBe(api_address)
      expect(url.pathname).toBe('/f/uploadFile')
      expect(form_data).toBe(fake_form_data)
      expect(post_params?.signal).toBe(uploading_file.abort_controller.signal)
      
      const uploading_file_onprogress_spy = jest.spyOn(uploading_file, 'on_progress')
      post_params?.onUploadProgress!({ total: 100, loaded: 50 } as any)
      expect(uploading_file_onprogress_spy).toBeCalledWith(100, 50)
    })
  })

  describe('webpage_api', () => {
    test('api_check_admin', () => {
      axios_get_mock.mockResolvedValue({ data: true })

      const ret = webpage_api.api_check_admin()

      expect(axios_get_mock).toBeCalledTimes(1)
      expect(ret).resolves.toEqual({ data: true })

      const url = new URL(axios_get_mock.mock.calls[0][0])

      expect(url.hostname).toBe(api_address)
      expect(url.pathname).toBe('/w/checkAdmin')
    })

    test('api_get_admin_pass', () => {
      axios_get_mock.mockResolvedValue({ data: true })

      const ret = webpage_api.api_get_admin_pass('pw')

      expect(axios_get_mock).toBeCalledTimes(1)
      expect(ret).resolves.toEqual({ data: true })

      const url = new URL(axios_get_mock.mock.calls[0][0])
      const get_params = axios_get_mock.mock.calls[0][1]

      expect(url.hostname).toBe(api_address)
      expect(url.pathname).toBe('/w/getAdminPass')
      expect(get_params!.params.pw).toBe('pw')
    })

    test('api_check_admin_pass', () => {
      axios_get_mock.mockResolvedValue({ data: true })

      const ret = webpage_api.api_check_admin_pass('pw')

      expect(axios_get_mock).toBeCalledTimes(1)
      expect(ret).resolves.toEqual({ data: true })

      const url = new URL(axios_get_mock.mock.calls[0][0])
      const get_params = axios_get_mock.mock.calls[0][1]

      expect(url.hostname).toBe(api_address)
      expect(url.pathname).toBe('/w/checkAdminPass')
      expect(get_params!.params.pw).toBe('pw')
    })

    test('api_get_folder_info', () => {
      const folder : Partial<Folder> = { id: 1 }
      axios_get_mock.mockResolvedValue({ data: folder })

      const ret = webpage_api.api_get_folder_info(folder.id!)

      expect(axios_get_mock).toBeCalledTimes(1)
      expect(ret).resolves.toEqual({ data: folder })

      const url = new URL(axios_get_mock.mock.calls[0][0])
      const get_params = axios_get_mock.mock.calls[0][1]

      expect(url.hostname).toBe(api_address)
      expect(url.pathname).toBe('/w/getFolderInfo')
      expect(get_params!.params.id).toBe(folder.id!)
    })
  })

  describe('ws_api', () => {
    const ws_api = new fake_WsApi()

    test('ws_file_list', () => {
      const create_websocket_mock = jest.spyOn(ws_api, '__create_websocket')

      const folder : Partial<Folder> = { id: 1 }
      const ws = ws_api.ws_file_list(folder as Folder)

      expect(ws.url).toBe(String(ws_api.id))
      
      expect(create_websocket_mock).toBeCalledTimes(1)

      const url = new URL(create_websocket_mock.mock.calls[0][0])
      expect(url.hostname).toBe(api_address)
      expect(url.pathname).toBe('/ws/fileList')
      expect(url.searchParams.get('id')).toBe(folder.id!.toString())
    })
  })
})
