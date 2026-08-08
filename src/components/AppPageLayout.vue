<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import EventBoothManagerModal from '@/components/EventBoothManagerModal.vue'
import type { MapBooth } from '@/types/map'

const props = defineProps<{
  title: string
  booths: MapBooth[]
}>()

const emit = defineEmits<{
  (event: 'save-booths', booths: MapBooth[]): void
  (event: 'settings'): void
}>()

const showBoothsModal = ref(false)

function handleSettings() {
  emit('settings')
}
</script>

<template>
  <div class="h-dvh overflow-hidden bg-editor-bg text-editor-text">
    <AppHeader :title="props.title" @switch-event="showBoothsModal = true" @settings="handleSettings" />

    <main class="fixed inset-x-0 top-app-header bottom-app-footer min-h-0 overflow-hidden">
      <slot />
    </main>

    <AppFooter />

    <EventBoothManagerModal v-model="showBoothsModal" :booths="props.booths" @save="emit('save-booths', $event)" />
  </div>
</template>
