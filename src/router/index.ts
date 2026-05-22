import { createRouter, createWebHashHistory } from 'vue-router'
import MapView from '@/views/MapView.vue'
import BoothEditorView from '@/views/BoothEditorView.vue'

export const ROUTE_MAP = '/'
export const ROUTE_BOOTH_EDITOR = '/boothEditor'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: ROUTE_MAP,
      name: 'map',
      component: MapView,
    },
    {
      path: ROUTE_BOOTH_EDITOR,
      name: 'boothEditor',
      component: BoothEditorView,
    },
  ],
})

export default router
