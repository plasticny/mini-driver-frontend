export interface FileObject {
  readonly type: 'file' | 'folder'
  readonly id: number
  name: string
}

export interface File extends FileObject {
  readonly type: 'file'
  is_lock: boolean
}

export interface Folder extends FileObject {
  readonly type: 'folder'
  readonly path: Array<{ id: number, name: string }>
}

export class UploadingFile {
  readonly internal_id : number
  readonly file : globalThis.File
  readonly folder_id : number
  readonly abort_controller : AbortController
  progress = 0

  constructor (file : globalThis.File, folder : Folder) {
    this.internal_id = Date.now()
    this.file = file
    this.folder_id = folder.id
    this.abort_controller = new AbortController()
  }

  public get name () { return this.file.name }

  public get form_data () : FormData {
    const form_data = new FormData()
    form_data.append('file', this.file)
    form_data.append('folder_id', this.folder_id.toString())
    return form_data
  }

  public on_progress (total : number, loaded : number) {
    this.progress = Math.floor(loaded / total * 100)
  }
}
