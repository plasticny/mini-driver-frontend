import { DOMWrapper, VueWrapper, shallowMount } from '@vue/test-utils'
import { ComponentPublicInstance, nextTick } from 'vue'

import ToolBar from '@/components/ToolBar.vue'

import { file_upload_helper } from '@/services/upload_file_service'
import { cur_folder, is_admin_ip } from '@/services/store'
import { File, Folder } from '@/structs'
import { file_operation_api } from '@/services/api'

jest.mock('@/services/api', () => {
  return {
    file_operation_api: {
      api_add_folder: jest.fn()
    }
  }
})
jest.mock('@/services/upload_file_service', () => {
  return {
    file_upload_helper: {
      add_upload: jest.fn()
    }
  }
})

interface ComponentApi {
  upload_clicked : () => void
  add_folder_clicked : () => void
  dg_add_folder_submit : () => void
}
interface ToolBarInstance {
  component_api : ComponentApi
}

function mount_tool_bar () : VueWrapper<any, ComponentPublicInstance<{}, any>> {
  return shallowMount(ToolBar, {
    global: {
      stubs: ['FontAwesomeIcon']
    }
  })
}

describe('ToolBar.vue', () => {
  describe('test methods', () => {
    let wrapper : VueWrapper<any, ComponentPublicInstance<{}, any>>
    let instance : ToolBarInstance
    let component_api : ComponentApi

    beforeAll(() => {
      wrapper = mount_tool_bar()
      instance = wrapper.vm as any
      component_api = instance.component_api
    })

    describe('upload_clicked', () => {
      const add_upload_mock = file_upload_helper.add_upload as jest.Mock

      const input_click_mock = jest.fn()
      let createElement_spy : jest.SpyInstance

      const test_file1 = { id: 1, name: 'test_file1' } as File
      const test_file2 = { id: 2, name: 'test_file2' } as File
      const test_folder = { id: 3, name: 'test_folder' } as Folder

      beforeAll(() => {
        add_upload_mock.mockClear()
        createElement_spy = jest.spyOn(document, 'createElement').mockImplementation(
          (tagName : string) => {
            expect(tagName).toBe('input')
            return new class {
              files = [test_file1, test_file2]
              onchange () {}
              click () {
                input_click_mock()
                this.onchange()
              }
            }() as any
          }
        )
        cur_folder.value = test_folder
      })

      afterAll(() => {
        add_upload_mock.mockClear()
        createElement_spy.mockRestore()
      })

      test('run normally', () => {
        component_api.upload_clicked()
        expect(input_click_mock).toHaveBeenCalled()
        expect(add_upload_mock).toHaveBeenCalledWith(test_file1, test_folder)
        expect(add_upload_mock).toHaveBeenCalledWith(test_file2, test_folder)
      })
    })

    // only need to check ui, nothing to do here
    describe('add_folder_clicked', () => {})

    describe('dg_add_folder_submit', () => {
      const api_add_folder_mock = file_operation_api.api_add_folder as jest.Mock

      beforeAll(() => {
        api_add_folder_mock.mockClear()
      })

      afterAll(() => {
        api_add_folder_mock.mockClear()
      })

      test('call api_add_folder correctly', () => {
        const test_folder = { id: 1, name: 'test_folder' } as Folder
        cur_folder.value = test_folder
        const folder_nm = 'test_folder'
        wrapper.find({ ref: 'dg_add_folder_nm' }).setValue(folder_nm)

        component_api.dg_add_folder_submit()

        expect(api_add_folder_mock).toHaveBeenCalledWith(test_folder, folder_nm)
      })
    })
  })

  describe('test ui', () => {
    describe('functional buttons', () => {
      test('upload button', async () => {
        const wrapper = mount_tool_bar()
        const instance = wrapper.vm as any
        const component_api = instance.component_api

        const upload_clicked_mock = jest.spyOn(component_api, 'upload_clicked')
        upload_clicked_mock.mockImplementation(() => {})
        
        const upload_button = wrapper.find('#btn_upload')
        upload_button.trigger('click')
        expect(upload_clicked_mock).toHaveBeenCalled()
      })

      describe('add folder button', () => {
        test('not exist if ip is not admin ip', () => {
          is_admin_ip.value = false
          const wrapper = mount_tool_bar()
          expect(wrapper.find('#btn_add_folder').exists()).toBe(false)
        })

        test('call add_folder_clicked if clicked', () => {
          is_admin_ip.value = true

          const wrapper = mount_tool_bar()
          const instance = wrapper.vm as any
          const component_api = instance.component_api

          const add_folder_clicked_mock = jest.fn()
          component_api.add_folder_clicked = add_folder_clicked_mock

          const add_folder_button = wrapper.find('#btn_add_folder')
          add_folder_button.trigger('click')

          expect(add_folder_clicked_mock).toHaveBeenCalled()
        })
      })
    })

    describe('add folder dialog', () => {
      let wrapper : VueWrapper<any, ComponentPublicInstance<{}, any>>
      let instance : ToolBarInstance
      let component_api : ComponentApi

      let dg_add_folder : DOMWrapper<Element>

      beforeAll(() => {
        wrapper = mount_tool_bar()
        instance = wrapper.vm as any
        component_api = instance.component_api

        dg_add_folder = wrapper.find('#dg_add_folder')
      })

      it('is not visiable at first', () => {
        expect(dg_add_folder.isVisible()).toBe(false)
      })

      it('show if add_folder_clicked is called', async () => {
        component_api.add_folder_clicked()
        expect(dg_add_folder.isVisible()).toBe(true)
      })

      test('dg_add_folder_submit is called when submit', () => {
        const dg_add_folder_submit_mock = jest.spyOn(component_api, 'dg_add_folder_submit')
        const submit_button = dg_add_folder.find('.submit')
        submit_button.trigger('click')
        expect(dg_add_folder_submit_mock).toHaveBeenCalled()
      })
    })
  })
})