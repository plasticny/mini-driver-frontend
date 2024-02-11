import { DOMWrapper, VueWrapper, shallowMount } from '@vue/test-utils'
import FileList from '@/components/FileList.vue'

import { file_upload_helper } from '@/services/upload_file_service'
import { FileObject, UploadingFile, Folder, File } from '@/structs'
import { file_operation_api, webpage_api } from '@/services/api'
import { change_folder } from '@/services/folder_service'
import { auth_service } from '@/services/auth_service'
import { ComponentPublicInstance, nextTick } from 'vue'
import { cur_folder, cur_file_obj_ls, files_to_be_uploaded, is_admin_ip } from '@/services/store'

jest.mock('@/structs', () => {
  return {
    FileObject: {},
    File: {},
    UploadingFile: {}
  }
})
jest.mock('@/services/api', () => {
  return {
    file_operation_api: {
      api_download_file: jest.fn(),
      api_check_file_obj_lock: jest.fn(),
      api_delete_file_obj: jest.fn()
    },
    webpage_api: {
      api_get_admin_pass: jest.fn()
    },
    ws_api: {
      ws_file_list: () => { return {} }
    }
  }
})
jest.mock('@/services/folder_service', () => {
  return {
    change_folder: jest.fn()
  }
})
jest.mock('@/services/auth_service', () => {
  return {
    auth_service: {
      check_admin_ip: jest.fn(),
      check_admin_pass: jest.fn()
    }
  }
})
jest.mock('@/services/upload_file_service', () => {
  return {
    file_upload_helper: {
      cancel_upload: jest.fn(),
      add_upload: jest.fn()
    }
  }
})

interface ComponentApi {
  select_file_obj: (evt: MouseEvent, file_obj: FileObject) => void
  dblclick_file_obj: (file_obj: FileObject) => void
  check_only_file_selected: () => boolean
  check_admin_pass: () => Promise<boolean>
  download_multi_file: () => void
  delete_multi_file: () => Promise<void>
  drop_upload: (evt: any) => void
  cancel_upload: (uploading_file : UploadingFile) => void
  dg_login_submit: (evt: UIEvent) => Promise<void>
  test: (x: any) => void
}
interface FileListInstance {
  selected_file_obj_set: Set<FileObject>
  component_api: ComponentApi
}

function mount_file_list() : VueWrapper<any, ComponentPublicInstance<{}, any>> {
  return shallowMount(FileList, {
    global: {
      stubs: ['FontAwesomeIcon']
    }
  })
}

describe('FileList.vue', () => {
  describe('test methods', () => {
    let wrapper : VueWrapper<any, ComponentPublicInstance<{}, any>>
    let instance : FileListInstance
    let component_api : ComponentApi  

    beforeAll(() => {
      wrapper = mount_file_list()
      instance = wrapper.vm as any
      component_api = instance.component_api
    })

    describe('check_only_file_selected', () => {
      let selected_file_obj_set : Set<FileObject>

      beforeEach(() => {
        selected_file_obj_set = instance.selected_file_obj_set
        selected_file_obj_set.clear()
      })

      test('when nothing selected', () => {
        expect(component_api.check_only_file_selected()).toBe(false)
      })

      test('when only file selected', () => {
        selected_file_obj_set.add({ type: 'file' } as FileObject)
        expect(component_api.check_only_file_selected()).toBe(true)
      })

      test('when only folder selected', () => {
        selected_file_obj_set.add({ type: 'folder' } as FileObject)
        expect(component_api.check_only_file_selected()).toBe(false)
      })

      test('when both file and folder selected', () => {
        selected_file_obj_set
          .add({ type: 'file' } as FileObject)
          .add({ type: 'folder' } as FileObject)
        expect(component_api.check_only_file_selected()).toBe(false)
      })
    })

    describe('check_admin_pass', () => {
      // only check the function return correct boolean value
      // the ui interaction should be tested in other section
      let check_admin_ip_mock : jest.Mock<Promise<void>, []>
      let check_admin_pass_mock : jest.Mock<Promise<boolean>, []>

      beforeAll(() => {
        check_admin_ip_mock = auth_service.check_admin_ip as jest.Mock<Promise<void>, []>
        check_admin_pass_mock = auth_service.check_admin_pass as jest.Mock<Promise<boolean>, []>
      })

      afterAll(() => {
        check_admin_ip_mock.mockRestore()
        check_admin_pass_mock.mockRestore()
      })

      test('is admin ip', async () => {
        is_admin_ip.value = true
        check_admin_pass_mock.mockResolvedValueOnce(false)
        expect(await component_api.check_admin_pass()).toBe(true)
      })

      test('not amin ip but have admin pass', async () => {
        is_admin_ip.value = false
        check_admin_pass_mock.mockResolvedValueOnce(true)
        expect(await component_api.check_admin_pass()).toBe(true)
      })

      test('not admin ip and no admin pass', async () => {
        is_admin_ip.value = false
        check_admin_pass_mock.mockResolvedValueOnce(false)
        expect(await component_api.check_admin_pass()).toBe(false)
      })
    })

    describe('select_file_obj', () => {  
      const test_file1 = { name: 'file1' } as FileObject
      const test_file2 = { name: 'file2' } as FileObject
      const test_file3 = { name: 'file3' } as FileObject
      const test_file4 = { name: 'file4' } as FileObject

      let selected_file_obj_set : Set<FileObject>

      beforeAll(() => {
        selected_file_obj_set = instance.selected_file_obj_set
        selected_file_obj_set.clear()
      })

      test('select file', () => {
        const evt : Partial<MouseEvent> = {
          stopPropagation: jest.fn(),
          ctrlKey: false
        }
        component_api.select_file_obj(evt as MouseEvent, test_file1)
        expect(selected_file_obj_set.size).toBe(1)
        expect(selected_file_obj_set.has(test_file1)).toBe(true)
      })

      test('select three more file with ctrl key', () => {
        const evt : Partial<MouseEvent> = {
          stopPropagation: jest.fn(),
          ctrlKey: true
        }
        component_api.select_file_obj(evt as MouseEvent, test_file2)
        component_api.select_file_obj(evt as MouseEvent, test_file3)

        expect(selected_file_obj_set.size).toBe(3)
        expect(selected_file_obj_set.has(test_file1)).toBe(true)
        expect(selected_file_obj_set.has(test_file2)).toBe(true)
        expect(selected_file_obj_set.has(test_file3)).toBe(true)
      })

      test('deselect file with ctrl key', () => {
        const evt : Partial<MouseEvent> = {
          stopPropagation: jest.fn(),
          ctrlKey: true
        }
        component_api.select_file_obj(evt as MouseEvent, test_file1)
        expect(selected_file_obj_set.size).toBe(2)
        expect(selected_file_obj_set.has(test_file1)).toBe(false)
        expect(selected_file_obj_set.has(test_file2)).toBe(true)
        expect(selected_file_obj_set.has(test_file3)).toBe(true)
      })

      test('select other file without ctrl key', () => {
        const evt : Partial<MouseEvent> = {
          stopPropagation: jest.fn(),
          ctrlKey: false
        }
        component_api.select_file_obj(evt as MouseEvent, test_file4)
        expect(selected_file_obj_set.size).toBe(1)
        expect(selected_file_obj_set.has(test_file4)).toBe(true)
      })
    })

    describe('dblclick_file_obj', () => {
      const set_folder_mock = change_folder as jest.Mock
      const api_download_file_mock = file_operation_api.api_download_file as jest.Mock

      beforeAll(() => {
        set_folder_mock.mockClear()
        api_download_file_mock.mockClear()
      })

      test('dblclick folder', () => {
        const test_folder = { id: 1, type: 'folder' } as FileObject
        component_api.dblclick_file_obj(test_folder)
        expect(set_folder_mock).toHaveBeenCalledWith(test_folder.id)
      })

      test('dblclick file', () => {
        const test_file = { id: 1, type: 'file' } as FileObject
        component_api.dblclick_file_obj(test_file)
        expect(api_download_file_mock).toHaveBeenCalledWith(test_file)
      })
    })

    describe('download_multi_file', () => {
      const api_download_file_mock = file_operation_api.api_download_file as jest.Mock

      let selected_file_obj_set : Set<FileObject>
      let check_only_file_selected_mock : jest.SpyInstance
    
      beforeEach(() => {
        selected_file_obj_set = instance.selected_file_obj_set
        check_only_file_selected_mock = jest.spyOn(component_api, 'check_only_file_selected')

        api_download_file_mock.mockClear()
        selected_file_obj_set.clear()
      })

      afterAll(() => {
        check_only_file_selected_mock.mockRestore()
      })

      test('when no file is selected', () => {
        check_only_file_selected_mock.mockReturnValue(false)
        component_api.download_multi_file()
        expect(api_download_file_mock).not.toHaveBeenCalled()
      })

      test('download file', async () => {
        const file1 = { type: 'file' } as FileObject
        const file2 = { type: 'file' } as FileObject

        selected_file_obj_set
          .add(file1).add(file2)
        
        check_only_file_selected_mock.mockReturnValue(true)

        component_api.download_multi_file()

        // wait for all api download has been called
        await new Promise(resolve => setTimeout(resolve, 200))

        expect(api_download_file_mock).toHaveBeenCalledTimes(2)
        expect(api_download_file_mock).toHaveBeenCalledWith(file1)
        expect(api_download_file_mock).toHaveBeenCalledWith(file2)
      })
    })

    describe('delete_multi_file', () => {
      const test_file = { type: 'file' } as FileObject
      const test_folder = { type: 'folder' } as FileObject

      const api_check_file_obj_lock_mock = file_operation_api.api_check_file_obj_lock as jest.Mock<Promise<{ data: boolean }>, [FileObject]>
      const api_delete_file_obj_mock = file_operation_api.api_delete_file_obj as jest.Mock<Promise<any>, [FileObject, string]>

      let selected_file_obj_set : Set<FileObject>
      let check_admin_pass_mock : jest.SpyInstance

      beforeAll(() => {
        selected_file_obj_set = instance.selected_file_obj_set
        selected_file_obj_set.clear()
        selected_file_obj_set.add(test_file).add(test_folder)

        check_admin_pass_mock = jest.spyOn(component_api, 'check_admin_pass')
      })
      
      afterAll(() => {
        check_admin_pass_mock.mockRestore()
        api_check_file_obj_lock_mock.mockRestore()
        api_delete_file_obj_mock.mockRestore()
      })

      test('when no admin pass', async () => {
        const expected_selected_file_obj_set = new Set(selected_file_obj_set)
        check_admin_pass_mock.mockResolvedValueOnce(false)

        await component_api.delete_multi_file()

        expect(api_delete_file_obj_mock).not.toHaveBeenCalled()
        expect(selected_file_obj_set).toEqual(expected_selected_file_obj_set)
      })

      test('when all file obj locked', async () => {
        const expected_selected_file_obj_set = new Set(selected_file_obj_set)

        check_admin_pass_mock.mockResolvedValueOnce(true)
        api_check_file_obj_lock_mock.mockResolvedValue({ data: true })

        await component_api.delete_multi_file()

        expect(api_delete_file_obj_mock).not.toHaveBeenCalled()
        expect(selected_file_obj_set).toEqual(expected_selected_file_obj_set)
      })

      test('delete file obj', async () => {
        check_admin_pass_mock.mockResolvedValueOnce(true)
        api_check_file_obj_lock_mock.mockResolvedValue({ data: false })

        await component_api.delete_multi_file()

        expect(api_delete_file_obj_mock).toHaveBeenCalledTimes(2)
        expect(api_delete_file_obj_mock.mock.calls[0]).toContainEqual(test_file)
        expect(api_delete_file_obj_mock.mock.calls[1]).toContainEqual(test_folder)
        expect(selected_file_obj_set.size).toBe(0)
      })
    })

    describe('drop_upload', () => {
      const add_upload_mock = file_upload_helper.add_upload as jest.Mock

      test('upload files', () => {
        cur_folder.value = { id: 1, type: 'folder' } as Folder

        // fake drag event
        const test_file1 = { name: 'file1' }
        const test_file2 = { name: 'file2' }
        const evt = {
          preventDefault: jest.fn(),
          dataTransfer: {
            files: [test_file1, test_file2]
          }
        }

        component_api.drop_upload(evt)
        expect(add_upload_mock).toHaveBeenCalledTimes(2)
        expect(add_upload_mock.mock.calls[0]).toContainEqual(test_file1)
        expect(add_upload_mock.mock.calls[0]).toContainEqual(cur_folder.value)
        expect(add_upload_mock.mock.calls[1]).toContainEqual(test_file2)
        expect(add_upload_mock.mock.calls[1]).toContainEqual(cur_folder.value)
      })
    })

    describe('cancel_upload', () => {
      it('should call file_upload_helper.cancel_upload', () => {
        component_api.cancel_upload({} as UploadingFile)
        expect(file_upload_helper.cancel_upload).toHaveBeenCalled()
      })
    })

    describe('dg_login_submit', () => {
      const api_get_admin_pass_mock = webpage_api.api_get_admin_pass as jest.Mock<Promise<{ data: string | false }>, []>

      const evt : Partial<UIEvent> = {
        preventDefault: jest.fn()
      }

      beforeAll(() => {
        window.alert = jest.fn()
      })

      beforeEach(() => {
        auth_service.admin_pass = undefined
      })

      test('when password wrong', async () => {
        api_get_admin_pass_mock.mockResolvedValueOnce({ data: false })
        await component_api.dg_login_submit(evt as UIEvent)
        expect(auth_service.admin_pass).toBeUndefined()
      })

      test('when password correct', async () => {
        const ret_pass = 'test_pass'
        api_get_admin_pass_mock.mockResolvedValueOnce({ data: ret_pass })
        await component_api.dg_login_submit(evt as UIEvent)
        expect(auth_service.admin_pass).toBe(ret_pass)
      })
    })
  })

  describe('test ui', () => {
    describe('#header', () => {  
      describe('#folder_nm', () => {
        let wrapper : VueWrapper<any, ComponentPublicInstance<{}, any>>
        let folder_nm_el : DOMWrapper<Element>

        const path_item1 = { id: 0, name: 'Root' }
        const path_item2 = { id: 1, name: 'Folder1' }

        beforeAll(() => {  
          wrapper = mount_file_list()
          folder_nm_el = wrapper.find('#header').find('#folder_nm')
        })
    
        test('folder name correct', async () => {
          cur_folder.value = {
            path: [path_item1]
          } as Folder

          await nextTick()
          expect(folder_nm_el.text()).toBe('Root/')
        })
        
        test('display folder path changed when cur_folder changed', async () => {
          cur_folder.value = {
            path: [path_item1, path_item2]
          } as Folder

          await nextTick()
          expect(folder_nm_el.text()).toBe('Root/Folder1/')
        })

        test('trigger change_folder when click folder name', async () => {
          const change_folder_mock = change_folder as jest.Mock
          const folder_nm_items = folder_nm_el.findAll('.folder_nm_item')
          
          folder_nm_items[0].trigger('click')
          expect(change_folder_mock).toHaveBeenCalledWith(path_item1.id)

          folder_nm_items[1].trigger('click')
          expect(change_folder_mock).toHaveBeenCalledWith(path_item2.id)
        })
      })

      describe('#file_operation', () => {
        let wrapper : VueWrapper<any, ComponentPublicInstance<{}, any>>
        let instance : FileListInstance
        let component_api : ComponentApi
        let file_operation_el : DOMWrapper<Element>

        beforeAll(() => {
          wrapper = mount_file_list()
          instance = wrapper.vm as any
          component_api = instance.component_api
          file_operation_el = wrapper.find('#header').find('#file_operation')
        })

        test('it hide when no file selected', async () => {
          instance.selected_file_obj_set.clear()
          await nextTick()
          expect(file_operation_el.isVisible()).toBe(false)
        })

        test('it show when any file selected', async () => {
          instance.selected_file_obj_set.add({ type: 'file' } as FileObject)
          await nextTick()
          expect(file_operation_el.isVisible()).toBe(true)
        })

        test('it show correct amount of file selected', async () => {
          instance.selected_file_obj_set.clear()
          instance.selected_file_obj_set.add({ type: 'file' } as FileObject)
          await nextTick()
          expect(file_operation_el.text()).toContain('1 file')

          instance.selected_file_obj_set.add({ type: 'file' } as FileObject)
          await nextTick()
          expect(file_operation_el.text()).toContain('2 file')
        })

        describe('download button', () => {
          let download_btn : DOMWrapper<Element>
          let download_multi_file_mock : jest.SpyInstance

          beforeAll(() => {
            download_btn = file_operation_el.find('.btn_download')
            download_multi_file_mock = jest.spyOn(component_api, 'download_multi_file')
            download_multi_file_mock.mockImplementation(() => {})
          })

          afterAll(() => {
            download_multi_file_mock.mockRestore()
          })

          test('it show only if only file selected', async () => {
            instance.selected_file_obj_set.clear()
            await nextTick()
            expect(download_btn.isVisible()).toBe(false)
            
            instance.selected_file_obj_set.add({ type: 'file' } as FileObject)
            await nextTick()
            expect(download_btn.isVisible()).toBe(true)
          })

          test('it call download_multi_file when clicked', async () => {
            download_btn.trigger('click')
            expect(download_multi_file_mock).toHaveBeenCalled()
          })
        })

        describe('delete button', () => {
          const delete_multi_file_mock = jest.fn()

          beforeAll(() => {
            component_api.delete_multi_file = delete_multi_file_mock
          })

          test('it call delete_multi_file when clicked', async () => {
            // update selected file obj set to make the delete button has the mocked delete_multi_file
            instance.selected_file_obj_set.clear()
            instance.selected_file_obj_set.add({ type: 'file' } as FileObject)
            await nextTick()

            const delete_btn = wrapper.find('#file_operation').find('.btn_delete')
            delete_btn.trigger('click')
            expect(delete_multi_file_mock).toHaveBeenCalled()
          })
        })
      })
    })

    describe('file list area', () => {
      describe('#file_drop_area', () => {
        let wrapper : VueWrapper<any, ComponentPublicInstance<{}, any>>
        let instance : FileListInstance
        let component_api : ComponentApi

        let drop_area_el : DOMWrapper<Element>
        let drop_upload_mock : jest.SpyInstance

        beforeAll(() => {
          wrapper = mount_file_list()
          instance = wrapper.vm as any
          component_api = instance.component_api

          drop_area_el = wrapper.find('#file_drop_area')
          drop_upload_mock = jest.spyOn(component_api, 'drop_upload')
          drop_upload_mock.mockImplementation(() => {})
        })

        afterAll(() => {
          drop_upload_mock.mockRestore()
        })

        test('it call drop_upload when drop event', () => {
          drop_area_el.trigger('drop')
          expect(drop_upload_mock).toHaveBeenCalled()
        })
      })

      describe('file list', () => {
        const test_file1 = { id: 1, name: 'file1', type: 'file', is_lock: true } as File
        const test_file2 = { id: 2, name: 'file2' } as FileObject

        let wrapper : VueWrapper<any, ComponentPublicInstance<{}, any>>
        let instance : FileListInstance
        let component_api : ComponentApi

        let file_drop_area_el : DOMWrapper<Element>

        let select_file_obj_mock : jest.SpyInstance
        let dblclick_file_obj_mock : jest.SpyInstance

        beforeAll(() => {
          wrapper = mount_file_list()
          instance = wrapper.vm as any
          component_api = instance.component_api

          file_drop_area_el = wrapper.find('#file_drop_area')

          select_file_obj_mock = jest.spyOn(component_api, 'select_file_obj')
          select_file_obj_mock.mockImplementation(() => {})
          dblclick_file_obj_mock = jest.spyOn(component_api, 'dblclick_file_obj')
          dblclick_file_obj_mock.mockImplementation(() => {})

          while(cur_file_obj_ls.length > 0) {
            cur_file_obj_ls.pop()
          }
        })

        afterAll(() => {
          select_file_obj_mock.mockRestore()
          dblclick_file_obj_mock.mockRestore()
        })

        test('file list change when cur_file_obj_ls change', async () => {
          // empty in the beginning
          await nextTick()
          expect(file_drop_area_el.findAll('.file_obj').length).toBe(0)

          // add some file objects
          cur_file_obj_ls.push(test_file1)
          cur_file_obj_ls.push(test_file2)

          await nextTick()
          expect(file_drop_area_el.findAll('.file_obj').length).toBe(2)
        })

        test('info of file object are correct', () => {
          const file_objs = file_drop_area_el.findAll('.file_obj')
          expect(file_objs[0].text()).toContain('file1')
          expect(file_objs[1].text()).toContain('file2')
        })

        test('signal icon shown if the object is locked', () => {
          const file_objs = file_drop_area_el.findAll('.file_obj')
          expect(file_objs[0].find('.icon_using').exists()).toBe(true)
          expect(file_objs[1].find('.icon_using').exists()).toBe(false)
        })

        test('the file object has selected class if it is selected', async () => {
          instance.selected_file_obj_set.clear()
          const file_objs = file_drop_area_el.findAll('.file_obj')
          expect(file_objs[0].classes()).not.toContain('selected')
          expect(file_objs[1].classes()).not.toContain('selected')

          instance.selected_file_obj_set.add(test_file1)
          await nextTick()
          expect(file_objs[0].classes()).toContain('selected')
          expect(file_objs[1].classes()).not.toContain('selected')
        })

        test('it call select_file_obj when click file object', () => {
          file_drop_area_el.findAll('.file_obj')[0].trigger('click')
          expect(select_file_obj_mock).toHaveBeenCalledWith(expect.any(MouseEvent), test_file1)
        })

        test('it call dblclick_file_obj when dblclick file object', () => {
          file_drop_area_el.findAll('.file_obj')[0].trigger('dblclick')
          expect(dblclick_file_obj_mock).toHaveBeenCalledWith(test_file1)
        })
      })

      describe('uploading file list', () => {
        const test_uploading_file1 = { internal_id: 1, name: 'file1', progress: 50 } as UploadingFile
        const test_uploading_file2 = { internal_id: 2, name: 'file2', progress: 80 } as UploadingFile

        const cancel_upload_mock = jest.fn()

        let wrapper : VueWrapper<any, ComponentPublicInstance<{}, any>>
        let instance : FileListInstance
        let component_api : ComponentApi
        let file_drop_area_el : DOMWrapper<Element>

        beforeAll(() => {
          wrapper = mount_file_list()
          instance = wrapper.vm as any
          component_api = instance.component_api
          file_drop_area_el = wrapper.find('#file_drop_area')

          component_api.cancel_upload = cancel_upload_mock

          while(files_to_be_uploaded.length > 0) {
            files_to_be_uploaded.pop()
          }
        })

        test('file list change when files_to_be_uploaded change', async () => {
          let uploading_files_el = file_drop_area_el.findAll('.file_obj.uploading')
          expect(uploading_files_el.length).toBe(0)

          files_to_be_uploaded.push(test_uploading_file1)
          files_to_be_uploaded.push(test_uploading_file2)
          await nextTick()
          uploading_files_el = file_drop_area_el.findAll('.file_obj.uploading')
          expect(uploading_files_el.length).toBe(2)
        })

        test('show file name correctly', () => {
          const uploading_files_el = file_drop_area_el.findAll('.file_obj.uploading')
          expect(uploading_files_el[0].text()).toContain(test_uploading_file1.name)
          expect(uploading_files_el[1].text()).toContain(test_uploading_file2.name)
        })

        test('it calls cancel_upload when click cancel button', () => {
          cancel_upload_mock.mockClear()
          const cancel_btns = file_drop_area_el.findAll('.file_obj.uploading .icon_cancel')
          cancel_btns[0].trigger('click')
          expect(cancel_upload_mock).toHaveBeenCalledWith(test_uploading_file1)
        })
      })
    })

    describe('dg_login_admin', () => {
      let wrapper : VueWrapper<any, ComponentPublicInstance<{}, any>>
      let instance : FileListInstance
      let component_api : ComponentApi

      let dg_login_admin_el : DOMWrapper<Element>

      const dg_login_admin_mock =  jest.fn()

      beforeAll(() => {
        wrapper = mount_file_list()
        instance = wrapper.vm as any
        component_api = instance.component_api

        dg_login_admin_el = wrapper.find('#dg_login_admin')

        component_api.dg_login_submit = dg_login_admin_mock
      })

      test('not showing when init', () => {
        expect(dg_login_admin_el.isVisible()).toBe(false)
      })

      test('call dg_login_submit when submit', () => {
        dg_login_admin_el.find('.submit').trigger('click')
        expect(dg_login_admin_mock).toHaveBeenCalled()
      })

      test('it open when check admin pass failed', async () => {
        const check_admin_pass_mock = jest.spyOn(auth_service, 'check_admin_pass')
        check_admin_pass_mock.mockResolvedValueOnce(false)
        is_admin_ip.value = false

        await component_api.check_admin_pass()
        await nextTick()

        expect(dg_login_admin_el.isVisible()).toBe(true)

        check_admin_pass_mock.mockRestore()
      })
    })
  })
}) 
