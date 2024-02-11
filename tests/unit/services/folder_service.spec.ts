import * as folder_service from '@/services/folder_service'
import { ws_api, webpage_api } from '@/services/api'
import { Folder } from '@/structs'
import * as store_service from '@/services/store'

jest.mock('@/services/api', () => {
  const fake_ws = {
    get readyState () { return undefined },
    onmessage: jest.fn(),
    send: jest.fn()
  }

  return {
    webpage_api: {
      api_get_folder_info: jest.fn()
    },
    ws_api: {
      ws_file_list: () => {
        return fake_ws
      }
    }
  }
})
jest.mock('@/services/store', () => {
  return {
    cur_folder: { value: {} },
    set_file_obj_ls: jest.fn()
  }
})

describe('folder_store', () => {
  const fake_ws = ws_api.ws_file_list({} as Folder)

  describe('change_folder', () => {
    const api_get_folder_info_mock = webpage_api.api_get_folder_info as jest.Mock
    const ws_send_mock = fake_ws.send as jest.Mock

    beforeEach(() => {
      api_get_folder_info_mock.mockClear()
      ws_send_mock.mockClear()
    })

    test('normal run', async () => {
      jest.spyOn(fake_ws, 'readyState', 'get').mockReturnValue(WebSocket.OPEN)
  
      const folder = {
        id: -1,
        name: 'test folder',
        type: 'folder',
        path: []
      }
      api_get_folder_info_mock.mockReturnValue(
        Promise.resolve({ data: folder })
      )
    
      await folder_service.change_folder(0)
  
      expect(api_get_folder_info_mock).toBeCalledWith(0)
      expect(ws_send_mock).toBeCalledWith(JSON.stringify({ action: 'change_folder', id: 0 }))
      expect(store_service.cur_folder.value).toEqual(folder)
    })

    test('when websocket is not ready', async () => {
      jest.spyOn(fake_ws, 'readyState', 'get').mockReturnValue(WebSocket.CLOSED)

      expect(folder_service.change_folder(0)).rejects.toThrow('websocket not open. State: 3')
      expect(api_get_folder_info_mock).not.toBeCalled()
      expect(ws_send_mock).not.toBeCalled()
    })
  })

  describe('on_ws_message', () => {
    it('sort the file object list correctly before update the storage', () => {
      const set_file_obj_ls_mock = store_service.set_file_obj_ls as jest.Mock

      // prepare event
      const evt : Partial<MessageEvent> = {
        data: JSON.stringify([
          { name: 'c', type: 'file' },
          { name: 'b', type: 'folder' },
          { name: 'a', type: 'file' }
        ])
      }
      fake_ws.onmessage!(evt as MessageEvent)

      expect(set_file_obj_ls_mock).toBeCalledTimes(1)
      expect(set_file_obj_ls_mock.mock.calls[0][0]).toEqual([
        { name: 'b', type: 'folder' },
        { name: 'a', type: 'file' },
        { name: 'c', type: 'file' }
      ])
    })
  })
})