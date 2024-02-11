import * as upload_file_service from '@/services/upload_file_service'
import { Folder, UploadingFile } from '@/structs'
import { file_operation_api } from '@/services/api'
import { files_to_be_uploaded } from '@/services/store'

jest.mock('@/structs', () => {
  return {
    UploadingFile: class {
      readonly file : any
      readonly folder_id : number
      readonly abort_controller = {
        abort: jest.fn()
      }
      constructor (file : any, folder : { id: number }) {
        this.file = file
        this.folder_id = folder.id
      }
    },
    Folder: class {}
  }
})
jest.mock('@/services/api', () => {
  return {
    file_operation_api: {
      api_upload_file: jest.fn()
    }
  }
})

class fake_FileUploadHelper extends upload_file_service.FileUploadHelper {
  public get uploading_file () {
    return this.__uploading_file
  }
  public set uploading_file (object : any) {
    this.__uploading_file = object
  }

  public clear () {
    while (files_to_be_uploaded.length > 0) { files_to_be_uploaded.pop() }
    this.__uploading_file = undefined
  }

  public add_upload_file (file : UploadingFile) {
    files_to_be_uploaded.push(file)
  }
}

describe('upload_file_service', () => {
  describe('FileUploadHelper', () => {
    const file_upload_helper = new fake_FileUploadHelper()
    
    describe('add_upload', () => {
      const start_upload_spy = jest.spyOn(file_upload_helper, '__start_upload')

      beforeAll(() => {
        start_upload_spy.mockImplementation(() => Promise.resolve())
        file_upload_helper.clear()
      })

      beforeEach(() => {
        start_upload_spy.mockClear()
      })

      afterAll(() => {
        start_upload_spy.mockRestore()
      })

      test('when no file is uploading', () => {
        const file : Partial<globalThis.File> = { name: 'test_file' }
        const folder : Partial<Folder> = { id: 1 }

        file_upload_helper.add_upload(file as globalThis.File, folder as Folder)
        
        expect(files_to_be_uploaded.length).toBe(1)
        expect(files_to_be_uploaded[0].file).toStrictEqual(file)
        expect(files_to_be_uploaded[0].folder_id).toBe(folder.id)

        expect(start_upload_spy).toBeCalled()
      })

      test('when a file is uploading', () => {
        file_upload_helper.uploading_file = {}

        const file : Partial<globalThis.File> = { name: 'test_file2' }
        const folder : Partial<Folder> = { id: 2 }

        file_upload_helper.add_upload(file as globalThis.File, folder as Folder)
        
        expect(files_to_be_uploaded.length).toBe(2)
        expect(files_to_be_uploaded[1].file).toStrictEqual(file)
        expect(files_to_be_uploaded[1].folder_id).toBe(folder.id)

        expect(start_upload_spy).not.toBeCalled()
      })
    })

    describe('cancel_upload', () => {
      const upload_file1 = new UploadingFile({ name: 'test_file1' } as globalThis.File, { id: 1 } as Folder)
      const upload_file2 = new UploadingFile({ name: 'test_file2' } as globalThis.File, { id: 2 } as Folder)
      const upload_file3 = new UploadingFile({ name: 'test_file3' } as globalThis.File, { id: 3 } as Folder)

      beforeAll(() => {
        file_upload_helper.clear()
        file_upload_helper.add_upload_file(upload_file1)
        file_upload_helper.add_upload_file(upload_file2)
        file_upload_helper.add_upload_file(upload_file3)
      })

      it('cancel uploading correctly', () => {
        file_upload_helper.cancel_upload(upload_file2)

        expect(upload_file2.abort_controller.abort).toBeCalled()
        expect(upload_file1.abort_controller.abort).not.toBeCalled()
        expect(upload_file3.abort_controller.abort).not.toBeCalled()
        expect(files_to_be_uploaded).toEqual([upload_file1, upload_file3])
      })
    })

    describe('start_upload', () => {
      const api_upload_file_spy = file_operation_api.api_upload_file as jest.Mock

      const upload_file1 = new UploadingFile({ name: 'test_file1' } as globalThis.File, { id: 1 } as Folder)
      const upload_file2 = new UploadingFile({ name: 'test_file2' } as globalThis.File, { id: 2 } as Folder)
      const upload_file3 = new UploadingFile({ name: 'test_file3' } as globalThis.File, { id: 3 } as Folder)

      beforeAll(() => {
        api_upload_file_spy.mockImplementation(() => Promise.resolve())
        api_upload_file_spy.mockClear()

        file_upload_helper.clear()
        file_upload_helper.add_upload_file(upload_file1)
        file_upload_helper.add_upload_file(upload_file2)
        file_upload_helper.add_upload_file(upload_file3)
      })

      afterAll(() => {
        api_upload_file_spy.mockRestore()
      });

      test('upload file', async () => {
        await file_upload_helper.__start_upload()

        expect(api_upload_file_spy).toBeCalledTimes(3)
        expect(api_upload_file_spy.mock.calls[0][0]).toStrictEqual(upload_file1)
        expect(api_upload_file_spy.mock.calls[1][0]).toStrictEqual(upload_file2)
        expect(api_upload_file_spy.mock.calls[2][0]).toStrictEqual(upload_file3)

        expect(file_upload_helper.uploading_file).toBeUndefined()
        expect(files_to_be_uploaded).toEqual([])
      })
    })
  })
})
