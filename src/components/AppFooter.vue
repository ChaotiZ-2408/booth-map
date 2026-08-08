<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ROUTE_LIST_EDITOR, ROUTE_MAP } from "@/router";
</script>

<template>
  <nav class="fixed bottom-0 left-0 z-50 w-full border-t border-editor-border/70 bg-editor-bg/90 backdrop-blur-xl">
    <div class="mx-auto flex h-app-footer max-w-xl items-center justify-around px-4">
      <RouterLink :to="ROUTE_MAP"
        class="flex min-w-24 items-center justify-center gap-2 text-editor-muted transition-colors"
        active-class="!text-editor-primary font-medium">
        <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8"
          aria-hidden="true">
          <path d="m3.5 6.5 5-2 7 2 5-2v13l-5 2-7-2-5 2v-13Z" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M8.5 4.5v13M15.5 6.5v13" />
        </svg>
        <span class="text-[11px] leading-none font-medium">Map</span>
      </RouterLink>

      <RouterLink :to="ROUTE_LIST_EDITOR"
        class="flex min-w-24 items-center justify-center gap-2 text-editor-muted transition-colors"
        active-class="!text-editor-primary font-medium">
        <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8"
          aria-hidden="true">
          <path d="M9 6h11M9 12h11M9 18h11" stroke-linecap="round" />
          <path d="M4 6h.01M4 12h.01M4 18h.01" stroke-linecap="round" stroke-width="3" />
        </svg>
        <span class="text-[11px] leading-none font-medium">My List</span>
      </RouterLink>
    </div>
  </nav>
</template>
