import * as store from '@/services/store'
import { FileObject } from '@/structs'

describe('store', () => {
  describe('set_file_obj_ls', () => {
    beforeAll(() => {
      // clear file object list
      while (store.cur_file_obj_ls.length > 0) { store.cur_file_obj_ls.pop() }
    })

    test('replace the current file object list', () => {
      store.cur_file_obj_ls.push({} as FileObject)

      const file1 = { id: 1, name: 'file1' } as FileObject
      const file2 = { id: 2, name: 'file2' } as FileObject
      const file_obj_ls : Array<FileObject> = [file1, file2]

      store.set_file_obj_ls(file_obj_ls)
      expect(store.cur_file_obj_ls).toEqual(file_obj_ls)
    })
  })
})