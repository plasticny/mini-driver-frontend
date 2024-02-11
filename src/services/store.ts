/* Service that store ref and reactive variables that are used by multiple components */
import { Ref, ref, reactive } from 'vue'

import { Folder, FileObject, UploadingFile } from '@/structs'

/* === current viewing folder === */
export const cur_folder : Ref<Folder | Partial<Folder>> = ref({ id: 0 })

/* === file objects in the folder === */
export const cur_file_obj_ls : Array<FileObject> = reactive([])
export function set_file_obj_ls (file_obj_ls : Array<FileObject>) : void {
  while (cur_file_obj_ls.length > 0) { cur_file_obj_ls.pop() }
  file_obj_ls.forEach((file_obj) => {
    cur_file_obj_ls.push(file_obj)
  })
}

/* === files to be uploaded === */
export const files_to_be_uploaded : Array<UploadingFile> = reactive([])

/* === is admin ip === */
export const is_admin_ip : Ref<boolean> = ref(false)
