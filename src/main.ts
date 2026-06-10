import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import { AutoNexo } from './themes/autonexo'
import Toast from 'primevue/toast'
import 'primeicons/primeicons.css'
import 'leaflet/dist/leaflet.css'
import './style.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: AutoNexo,
    options: {
      darkModeSelector: 'body'
    }
  }
})
app.use(ToastService)
app.component('Toast', Toast)

app.mount('#app')