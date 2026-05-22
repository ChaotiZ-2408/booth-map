<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ROUTE_BOOTH_EDITOR, ROUTE_MAP } from '@/router'
</script>

<template>
  <div class="app-shell">
    <header class="top-nav">
      <nav class="top-nav-inner">
        <RouterLink :to="ROUTE_MAP" class="top-nav-link" active-class="top-nav-link-active" exact-active-class="top-nav-link-active">
          場次地圖
        </RouterLink>
        <RouterLink :to="ROUTE_BOOTH_EDITOR" class="top-nav-link" active-class="top-nav-link-active">
          逛攤清單
        </RouterLink>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>
