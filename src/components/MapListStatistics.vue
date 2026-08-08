<script setup lang="ts">
import type { ListItem } from "@/types/listItem";
import { useListStatistics } from "@/composables/useListStatistics";

const props = defineProps<{
  listItems: ListItem[];
}>();

const {
  unvisitedBoothCount,
  totalBoothCount,
  activeTotalPrice,
  activeTotalGiftPeopleCount,
} = useListStatistics(() => props.listItems);
</script>

<template>
  <div class="map-list-statistics">
    <span class="map-list-statistics-item">
      <span class="map-list-statistics-label">攤位：</span>
      <span class="map-list-statistics-value">
        {{ unvisitedBoothCount }}/{{ totalBoothCount }}
      </span>
    </span>

    <span class="map-list-statistics-separator">|</span>

    <span class="map-list-statistics-item">
      <span class="map-list-statistics-label">金額：</span>
      <span class="map-list-statistics-value">
        {{ activeTotalPrice }}
      </span>
    </span>

    <span class="map-list-statistics-separator">|</span>

    <span class="map-list-statistics-item">
      <span class="map-list-statistics-label">認親：</span>
      <span class="map-list-statistics-value">
        {{ activeTotalGiftPeopleCount }}
      </span>
    </span>
  </div>
</template>

<style scoped>
.map-list-statistics {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;

  display: flex;
  align-items: center;
  gap: 8px;

  padding: 6px 12px;
  border-radius: var(--radius-editor-card);

  background: var(--color-editor-surface);
  box-shadow: var(--shadow-editor-fab);

  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
}

.map-list-statistics-item {
  display: inline-flex;
  align-items: center;
}

.map-list-statistics-label {
  color: var(--color-editor-muted);
}

.map-list-statistics-value {
  color: var(--color-editor-text);
}

.map-list-statistics-separator {
  color: var(--color-editor-muted);
}
</style>
