<script setup lang="ts">
import { nextTick, ref } from "vue";
import AppPageLayout from "@/components/AppPageLayout.vue";
import MapContent from "@/components/MapContent.vue";
import { useMap } from "@/composables/useMap";
import type { MapBooth } from "@/types/map";

const mapContentRef = ref<InstanceType<typeof MapContent> | null>(null);

const {
  activeIndex,
  boothStyleMap,
  currentMapName,
  listItems,
  mapData,
  selectedBoothId,
  selectBooth,
  updateBooths,
} = useMap({
  resetViewport: () => nextTick(() => mapContentRef.value?.resetViewport()),
});

function handleBoothSelect(booth: MapBooth) {
  const result = selectBooth(booth);
  if (result?.wasActive) mapContentRef.value?.centerOnBooth(booth.boothId);
}

function handleSettings() {
  // TODO: settings action
}
</script>

<template>
  <AppPageLayout
    :title="currentMapName"
    :booths="mapData.booths"
    @save-booths="updateBooths"
    @settings="handleSettings"
  >
    <MapContent
      ref="mapContentRef"
      v-model:active-index="activeIndex"
      :map-data="mapData"
      :list-items="listItems"
      :booth-style-map="boothStyleMap"
      :selected-booth-id="selectedBoothId"
      @select-booth="handleBoothSelect"
    />
  </AppPageLayout>
</template>
