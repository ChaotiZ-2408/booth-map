<!-- MapPreviewCard.vue -->
<script setup lang="ts">
import { computed, ref } from "vue";
import AppIcon from "@/components/icons/AppIcon.vue";
import { CARD_TAG_MAP, getTagBadgeToneClass } from "@/data/cardTags";
import type { CardHighlight } from "@/types/card";

// ── Props ────────────────────────────────────────────────────────────────────

const props = defineProps<{
  card: CardHighlight;
  index: number;
  isActive: boolean;
  isExpanded: boolean;
}>();

// ── Emits ────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  select: [index: number];
  "swipe-left": [];
  "swipe-right": [];
}>();

// ── 金額（元件內部計算）──────────────────────────────────────────────────────

const totalPrice = computed(() =>
  props.card.purchaseItems.reduce(
    (sum, item) => sum + (item.enabled ? Number(item.price) || 0 : 0),
    0,
  ),
);

// ── Tag 輔助 ─────────────────────────────────────────────────────────────────

function getTagConfig(tagId: string) {
  return CARD_TAG_MAP[tagId as keyof typeof CARD_TAG_MAP];
}

function getTagLabel(tagId: string) {
  return getTagConfig(tagId)?.displayName ?? tagId;
}

// ── 觸控滑動偵測 ──────────────────────────────────────────────────────────────

const swipeStartX = ref<number | null>(null);
const swipeStartY = ref<number | null>(null);

function onTouchStart(event: TouchEvent) {
  swipeStartX.value = event.touches[0]?.clientX ?? null;
  swipeStartY.value = event.touches[0]?.clientY ?? null;
}

function onTouchEnd(event: TouchEvent) {
  if (swipeStartX.value === null || swipeStartY.value === null) return;

  const endX = event.changedTouches[0]?.clientX ?? swipeStartX.value;
  const endY = event.changedTouches[0]?.clientY ?? swipeStartY.value;
  const deltaX = endX - swipeStartX.value;
  const deltaY = endY - swipeStartY.value;

  // 水平滑動距離夠大，且比垂直方向更明顯 → 判定為左右滑
  if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
    emit(deltaX < 0 ? "swipe-left" : "swipe-right");
  }

  swipeStartX.value = null;
  swipeStartY.value = null;
}
</script>

<template>
  <article
    class="map-preview-card"
    :class="{ active: isActive }"
    @click="emit('select', index)"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- 上半：攤位 ID + 作者 -->
    <div class="map-preview-top">
      <h2 class="map-booth-id">{{ card.boothId || "未設定攤位" }}</h2>
      <div class="map-author-tag-row">
        <span
          v-for="author in card.authorNames.filter(Boolean)"
          :key="author"
          class="map-author-badge"
        >
          {{ author }}
        </span>
        <span
          v-if="!card.authorNames.filter(Boolean).length"
          class="map-author-empty"
        >
          尚無作者
        </span>
      </div>
    </div>

    <!-- 下半：標籤徽章 + 金額 -->
    <div class="map-preview-stats">
      <div class="map-meta-badges">
        <span
          v-for="tagId in card.tags"
          :key="tagId"
          class="map-meta-badge map-meta-badge-tag"
          :class="
            getTagConfig(tagId)
              ? getTagBadgeToneClass(getTagConfig(tagId)!)
              : ''
          "
          :title="getTagLabel(tagId)"
        >
          <AppIcon
            :name="getTagConfig(tagId)?.icon ?? 'tag-bonus'"
            class="map-badge-icon"
          />
        </span>

        <span
          v-if="card.exchangeGifts.length"
          class="map-meta-badge map-meta-badge-gift"
          title="認親禮"
        >
          <AppIcon name="gift-solid" class="map-badge-icon" />
          <span>{{ card.exchangeGifts.length }}</span>
        </span>

        <span
          v-if="card.note.trim()"
          class="map-meta-badge map-meta-badge-note"
          title="註解"
        >
          <AppIcon name="note-solid" class="map-badge-icon" />
        </span>

        <span
          v-if="
            !card.tags.length && !card.exchangeGifts.length && !card.note.trim()
          "
          class="map-meta-empty"
        >
          無標記
        </span>
      </div>

      <p class="map-total-price">金額 ${{ totalPrice }}</p>
    </div>

    <!-- 展開詳細（僅 active + expanded 時顯示） -->
    <div v-if="isExpanded && isActive" class="map-expand-placeholder">
      詳細內容稍後討論
    </div>
  </article>
</template>
