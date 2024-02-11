import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faDownload, faSignal, faTrash, faUpload, faTimes,
  faFile, faFolder, faFileCirclePlus, faFolderPlus, faSpinner
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faDownload, faSignal, faTrash, faUpload, faTimes,
  faFile, faFolder, faFileCirclePlus, faFolderPlus, faSpinner
)

createApp(App)
  .component('font-awesome-icon', FontAwesomeIcon)
  .use(router)
  .mount('#app')
