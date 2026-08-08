import { createRouter, createWebHashHistory } from 'vue-router'
import MapView from '@/views/MapView.vue'
import ListEditorView from '@/views/ListEditorView.vue'

export const ROUTE_MAP = '/'
export const ROUTE_LIST_EDITOR = '/listEditor'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: ROUTE_MAP,
      name: 'map',
      component: MapView,
    },
    {
      path: ROUTE_LIST_EDITOR,
      name: 'listEditor',
      component: ListEditorView,
    },
  ],
})

export default router
