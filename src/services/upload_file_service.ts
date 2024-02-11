/* provide service for uploading file */

import { UploadingFile, Folder } from '@/structs'
import { file_operation_api } from './api'
import { files_to_be_uploaded } from './store'

export class FileUploadHelper {
  // file that the uploading is processing
  protected __uploading_file : UploadingFile | undefined

  public async __start_upload () {
    while (files_to_be_uploaded.length > 0) {
      this.__uploading_file = files_to_be_uploaded[0]
      try {
        await file_operation_api.api_upload_file(this.__uploading_file)
      } catch (e) { /* catch cancel error */ }
      files_to_be_uploaded.shift()
    }
    this.__uploading_file = undefined
  }

  public add_upload (file : globalThis.File, folder : Folder) {
    files_to_be_uploaded.push(new UploadingFile(file, folder))
    if (this.__uploading_file === undefined) {
      this.__start_upload()
    }
  }

  public cancel_upload (file : UploadingFile) {
    file.abort_controller.abort()
    files_to_be_uploaded.splice(files_to_be_uploaded.indexOf(file), 1)
  }
}
export const file_upload_helper = new FileUploadHelper()
