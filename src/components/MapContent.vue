<script setup lang="ts">
import { ref } from "vue";
import MapBottomSheet from "@/components/MapBottomSheet.vue";
import MapCanvas from "@/components/MapCanvas.vue";
import type { MapBooth, MapData } from "@/types/map";
import MapListStatistics from "@/components/MapListStatistics.vue";

import { computed } from "vue";
import type { ListItem, ListItemStyle } from "@/types/listItem";

const props = defineProps<{
  mapData: MapData;
  listItems: ListItem[];
  boothStyleMap: Map<string, ListItemStyle>;
  selectedBoothId: string;
  activeIndex: number;
}>();

const emit = defineEmits<{
  (event: "update:activeIndex", index: number): void;
  (event: "select-booth", booth: MapBooth): void;
}>();

const mapCanvasRef = ref<InstanceType<typeof MapCanvas> | null>(null);

const boothStyleMap = computed(() => {
  const map = new Map<string, ListItemStyle>();

  for (const item of props.listItems) {
    map.set(normalizeBoothId(item.boothId), item.style);
  }

  return map;
});

function normalizeBoothId(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const matched = raw.match(/^(.+?)(\d+)$/);
  if (!matched) return raw.toUpperCase();

  return `${matched[1].toUpperCase()}${Number(matched[2])}`;
}

defineExpose({
  resetViewport: () => mapCanvasRef.value?.resetViewport(),
  centerOnBooth: (boothId: string) =>
    mapCanvasRef.value?.centerOnBooth(boothId),
});
</script>

<template>
  <section class="map-content-shell">
    <MapCanvas
      ref="mapCanvasRef"
      :map-data="props.mapData"
      :booth-style-map="props.boothStyleMap"
      :selected-booth-id="props.selectedBoothId"
      @select-booth="emit('select-booth', $event)"
    />

    <MapListStatistics :list-items="props.listItems" />

    <MapBottomSheet
      :active-index="props.activeIndex"
      :list-items="props.listItems"
      @update:active-index="emit('update:activeIndex', $event)"
    />
  </section>
</template>

<style scoped>
@reference "../style.css";

.map-content-shell {
  @apply relative h-full min-h-0 overflow-hidden;
}
</style>
