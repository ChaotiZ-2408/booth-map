<script setup lang="ts">
defineProps<{
  title: string;
}>();

const emit = defineEmits<{
  (event: "switch-event"): void;
  (event: "settings"): void;
}>();
</script>

<template>
  <header class="fixed top-0 left-0 z-50 w-full border-b border-editor-border/70 bg-editor-bg/90 backdrop-blur-xl">
    <div class="mx-auto flex h-app-header max-w-xl items-center justify-between px-4">
      <div class="flex min-w-0 items-center gap-2">
        <h1 class="truncate text-[18px] leading-[1.35] font-medium text-editor-text">
          {{ title }}
        </h1>

        <button type="button"
          class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-editor-card text-editor-primary transition-colors hover:bg-editor-muted-surface active:scale-95"
          aria-label="切換場次" title="切換場次" @click="emit('switch-event')">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"
            aria-hidden="true">
            <path d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3 3m-3-3 3-3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <button type="button"
        class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-editor-card bg-editor-primary text-white transition-transform active:scale-95"
        aria-label="設定" title="設定" @click="emit('settings')">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"
          aria-hidden="true">
          <path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" />
          <path
            d="M19.1 13.1a7.7 7.7 0 0 0 .05-1.1 7.7 7.7 0 0 0-.05-1.1l2-1.55-2-3.46-2.48 1a8.6 8.6 0 0 0-1.9-1.1L14.35 3h-4.7l-.37 2.79a8.6 8.6 0 0 0-1.9 1.1l-2.48-1-2 3.46 2 1.55A7.7 7.7 0 0 0 4.85 12c0 .37.02.74.05 1.1l-2 1.55 2 3.46 2.48-1a8.6 8.6 0 0 0 1.9 1.1L9.65 21h4.7l.37-2.79a8.6 8.6 0 0 0 1.9-1.1l2.48 1 2-3.46-2-1.55Z"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </header>
</template>
