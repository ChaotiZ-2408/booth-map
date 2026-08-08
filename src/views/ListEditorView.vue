<script setup lang="ts">
import AppPageLayout from '@/components/AppPageLayout.vue'
import ListEditor from '@/components/ListEditor.vue'
import { useMap } from '@/composables/useMap'

const {
  currentMapName,
  mapData,
  updateBooths,
} = useMap()

function handleSettings() {
  // TODO: settings action
}
</script>

<template>
  <AppPageLayout :title="currentMapName" :booths="mapData.booths" @save-booths="updateBooths"
    @settings="handleSettings">
    <ListEditor />
  </AppPageLayout>
</template>
