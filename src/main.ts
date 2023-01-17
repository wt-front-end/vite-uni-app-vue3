import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import App from './App.vue'
import { appPlugin } from './app/index'
import uView from 'vk-uview-ui'
import 'uno.css'
export function createApp() {
  const app = createSSRApp(App)
  app.use(appPlugin)
  app.use(uView)
  return { app, Pinia }
}
