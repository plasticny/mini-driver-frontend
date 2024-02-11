import * as structs from "@/structs"

describe('structs', () => {
  describe('UploadingFile', () => {
    const file : Partial<globalThis.File> = {
      name: 'test.txt'
    }
    const folder : Partial<structs.Folder> = {
      id: 1
    }
    const uploading_file = new structs.UploadingFile(file as globalThis.File, folder as structs.Folder)

    test('constructor', () => {
      expect(uploading_file.file).toBe(file)
      expect(uploading_file.folder_id).toBe(1)
    })

    test('name', () => {
      expect(uploading_file.name).toBe('test.txt')
    })

    test('form_data', () => {
      const append_mock = jest.fn()
      globalThis.FormData = class {
        constructor () {}
        append (key : string, value : any) {
          append_mock(key, value)
        }
      } as any

      uploading_file.form_data
      expect(append_mock).toBeCalledWith('file', file)
      expect(append_mock).toBeCalledWith('folder_id', '1')
    })

    test('on_progress', () => {
      uploading_file.on_progress(111, 55)
      expect(uploading_file.progress).toBe(49)
    })
  })
})