import { shallowMount } from '@vue/test-utils'
import HomeView from '@/views/HomeView.vue'

import * as folder_service from '@/services/folder_service'

jest.mock('@/components/FileList.vue', () => ({
  name: 'FileList',
  render: () => null
}))
jest.mock('@/components/ToolBar.vue', () => ({
  name: 'ToolBar',
  render: () => null
}))
jest.mock('@/services/folder_service', () => ({
  change_folder: jest.fn()
}))

describe('HomeView.vue', () => {
  it('set folder to 0 when init', () => {
    const folder_store_spy = jest.spyOn(folder_service, 'change_folder')
    shallowMount(HomeView)
    expect(folder_store_spy).toHaveBeenCalledWith(0)
  })

  it('contains FileList and ToolBar', () => {
    const wrapper = shallowMount(HomeView)
    expect(wrapper.find('tool-bar-stub').exists()).toBe(true)
    expect(wrapper.find('file-list-stub').exists()).toBe(true)
  })
})
