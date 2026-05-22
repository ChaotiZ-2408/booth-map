<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import MapBoothManagerModal from "@/components/MapBoothManagerModal.vue";
import MapLayoutManagerModal from "@/components/MapLayoutManagerModal.vue";
import { CARD_TAG_MAP, getTagBadgeToneClass } from "@/data/cardTags";
import {
  defaultMapData,
  normalizeMapData,
  toSelectedStyle,
  validateMapData,
} from "@/data/mapData";
import AppIcon from "@/components/icons/AppIcon.vue";
import { useCardStore } from "@/stores/cardStore";
import type { CardHighlight } from "@/types/card"; // ← 你的 card 型別路徑
import type {
  BoothStyleKey,
  BoothVisualStyle,
  MapBooth,
  MapData,
  MapLayoutConfig,
} from "@/types/map";

const MAP_STORAGE_KEY = "booth-map-layout";
const ACTIVE_INDEX_KEY = "booth-map-active-index";

const cardStore = useCardStore();
const cards = computed(() => cardStore.cards ?? []);

const activeIndex = ref(loadActiveIndex());
const isExpanded = ref(false);
const showLayoutModal = ref(false);
const showBoothsModal = ref(false);
const dragStartY = ref<number | null>(null);
const swipeStartX = ref<number | null>(null);
const swipeStartY = ref<number | null>(null);

const mapData = ref<MapData>(loadMapData());
const stageContainerRef = ref<HTMLElement | null>(null);
const stagePan = ref({ x: 0, y: 0 });
const stageScale = ref(1);

let resizeObserver: ResizeObserver | null = null;
let pinchDistance = 0;
let pinchCenter: { x: number; y: number } | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeBoothIdForCompare(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const matched = raw.match(/^([A-Za-z]+)(\d+)$/);
  if (!matched) return raw.toUpperCase();
  const [, prefix, num] = matched;
  return `${prefix.toUpperCase()}${Number(num)}`;
}

function saveMapData() {
  localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(mapData.value));
}

function loadMapData(): MapData {
  try {
    const raw = localStorage.getItem(MAP_STORAGE_KEY);
    if (!raw) return clone(defaultMapData);
    const normalized = normalizeMapData(JSON.parse(raw));
    return validateMapData(normalized) ? clone(defaultMapData) : normalized;
  } catch {
    return clone(defaultMapData);
  }
}

function handleLayoutImport(layout: MapLayoutConfig) {
  mapData.value.layout = layout;
  saveMapData();
  resetViewport();
}

function handleBoothsImport(booths: MapBooth[]) {
  mapData.value.booths = booths;
  saveMapData();
}

function loadActiveIndex(): number {
  const raw = localStorage.getItem(ACTIVE_INDEX_KEY);
  const parsed = parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
function toggleCardEnabled(card: (typeof cards.value)[number]) {
  card.enabled = !card.enabled;
  cardStore.save();
}

watch(
  cards,
  (value) => {
    if (!value.length) {
      activeIndex.value = 0;
      return;
    }
    if (activeIndex.value > value.length - 1)
      activeIndex.value = value.length - 1;
  },
  { immediate: true },
);

// ---------------------------------------------------------------------------
// Booth → Card 查找
// ---------------------------------------------------------------------------

/**
 * boothId（正規化）→ card 的 highlight 值
 * 沒有對應卡片時為 null
 */
const boothHighlightMap = computed<Map<string, CardHighlight>>(() => {
  const map = new Map<string, CardHighlight>();
  for (const card of cards.value) {
    const key = normalizeBoothIdForCompare(card.boothId);
    if (key) map.set(key, card.highlight ?? "default");
  }
  return map;
});

const selectedBoothId = computed(() =>
  normalizeBoothIdForCompare(cards.value[activeIndex.value]?.boothId ?? ""),
);

// ---------------------------------------------------------------------------
// 樣式選取邏輯
// ---------------------------------------------------------------------------

/**
 * CardHighlight → BoothStyleKey 的對應
 * "default" → "default"，其他一對一。
 */
function highlightToStyleKey(highlight: CardHighlight): BoothStyleKey {
  // CardHighlight 的值與 BoothStyleKey 完全一致（除了 "default"）
  return highlight as BoothStyleKey;
}

function getBoothBaseStyle(booth: MapBooth): BoothVisualStyle {
  const normalizedId = normalizeBoothIdForCompare(booth.boothId);
  const highlight = boothHighlightMap.value.get(normalizedId);

  if (highlight === undefined) {
    // 沒有對應卡片 → disable
    return mapData.value.layout.boothStyle.disable;
  }

  const key = highlightToStyleKey(highlight);
  return mapData.value.layout.boothStyle[key];
}

function getBoothVisualStyle(booth: MapBooth): BoothVisualStyle {
  const base = getBoothBaseStyle(booth);
  const isSelected =
    selectedBoothId.value === normalizeBoothIdForCompare(booth.boothId);
  return isSelected ? toSelectedStyle(base) : base;
}

function isBoothClickable(booth: MapBooth) {
  return (
    !booth.disabled &&
    boothHighlightMap.value.has(normalizeBoothIdForCompare(booth.boothId))
  );
}

// ---------------------------------------------------------------------------
// 以下皆與原版相同，僅 getBoothVisualStyle 已替換
// ---------------------------------------------------------------------------

const mapPxSize = computed(() => ({
  width:
    (mapData.value.layout.mapSize.maxX -
      mapData.value.layout.mapSize.minX +
      1) *
    mapData.value.layout.unitPx.w,
  height:
    (mapData.value.layout.mapSize.maxY -
      mapData.value.layout.mapSize.minY +
      1) *
    mapData.value.layout.unitPx.h,
}));

const viewportSize = ref({ width: 1, height: 1 });

const stageConfig = computed(() => ({
  width: viewportSize.value.width,
  height: viewportSize.value.height,
}));

const contentGroupConfig = computed(() => ({
  x: stagePan.value.x,
  y: stagePan.value.y,
  scaleX: stageScale.value,
  scaleY: stageScale.value,
  draggable: true,
  dragBoundFunc: (pos: { x: number; y: number }) => {
    const clamped = clampPan(pos, stageScale.value);
    stagePan.value = clamped;
    return clamped;
  },
}));

const gridLines = computed(() => {
  const lines: Array<{ points: number[] }> = [];
  const { minX, maxX, minY, maxY } = mapData.value.layout.mapSize;
  const { w, h } = mapData.value.layout.unitPx;
  const cols = maxX - minX + 1;
  const rows = maxY - minY + 1;
  for (let col = 0; col <= cols; col += 1)
    lines.push({ points: [col * w, 0, col * w, rows * h] });
  for (let row = 0; row <= rows; row += 1)
    lines.push({ points: [0, row * h, cols * w, row * h] });
  return lines;
});

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getZoomConfig() {
  const zoom = mapData.value.layout.zoom;
  return {
    min: Number.isFinite(zoom?.min) ? Number(zoom.min) : 0.6,
    max: Number.isFinite(zoom?.max) ? Number(zoom.max) : 2.4,
    wheelStep: Number.isFinite(zoom?.wheelStep) ? Number(zoom.wheelStep) : 0.1,
  };
}

function clampScale(nextScale: number) {
  const { min, max } = getZoomConfig();
  return clamp(nextScale, min, max);
}

function clampPan(next: { x: number; y: number }, scale = stageScale.value) {
  const viewW = viewportSize.value.width;
  const viewH = viewportSize.value.height;
  const contentW = mapPxSize.value.width * scale;
  const contentH = mapPxSize.value.height * scale;
  const minX = Math.min(0, viewW - contentW);
  const maxX = Math.max(0, viewW - contentW);
  const minY = Math.min(0, viewH - contentH);
  const maxY = Math.max(0, viewH - contentH);
  return { x: clamp(next.x, minX, maxX), y: clamp(next.y, minY, maxY) };
}

function applyScaleAtPoint(
  nextScale: number,
  center: { x: number; y: number },
) {
  const currentScale = stageScale.value;
  const clampedScale = clampScale(nextScale);
  if (!Number.isFinite(clampedScale)) return;
  const worldX = (center.x - stagePan.value.x) / currentScale;
  const worldY = (center.y - stagePan.value.y) / currentScale;
  const nextPan = {
    x: center.x - worldX * clampedScale,
    y: center.y - worldY * clampedScale,
  };
  stageScale.value = clampedScale;
  stagePan.value = clampPan(nextPan, clampedScale);
}

function resetViewport() {
  nextTick(() => {
    stageScale.value = clampScale(1);
    stagePan.value = clampPan({ x: 0, y: 0 }, stageScale.value);
  });
}

function centerOnBooth(boothId: string) {
  if (!boothId) return;
  const normalizedId = normalizeBoothIdForCompare(boothId);
  const booth = mapData.value.booths.find(
    (b) => normalizeBoothIdForCompare(b.boothId) === normalizedId,
  );
  if (!booth) return;
  const rect = getBoothRectPx(booth);
  const boothCenterX = rect.x + rect.width / 2;
  const boothCenterY = rect.y + rect.height / 2;
  const pan = clampPan(
    {
      x: viewportSize.value.width / 2 - boothCenterX * stageScale.value,
      y: viewportSize.value.height / 2 - boothCenterY * stageScale.value,
    },
    stageScale.value,
  );
  animatePanTo(pan);
}

function updateViewportSize() {
  const container = stageContainerRef.value;
  if (!container) return;
  viewportSize.value = {
    width: Math.max(1, Math.floor(container.clientWidth)),
    height: Math.max(1, Math.floor(container.clientHeight)),
  };
  stagePan.value = clampPan(stagePan.value, stageScale.value);
}

function onWheel(event: WheelEvent) {
  event.preventDefault();
  const rect = stageContainerRef.value?.getBoundingClientRect();
  if (!rect) return;
  const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  const step = getZoomConfig().wheelStep;
  const factor = 1 + step * (event.deltaY > 0 ? -1 : 1);
  applyScaleAtPoint(stageScale.value * factor, pointer);
}

function onTouchMove(event: TouchEvent) {
  if (event.touches.length !== 2) {
    pinchDistance = 0;
    pinchCenter = null;
    return;
  }
  event.preventDefault();
  const t1 = event.touches[0];
  const t2 = event.touches[1];
  const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  const centerScreen = {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
  const rect = stageContainerRef.value?.getBoundingClientRect();
  if (!rect) return;
  const center = {
    x: centerScreen.x - rect.left,
    y: centerScreen.y - rect.top,
  };
  if (pinchDistance <= 0 || !pinchCenter) {
    pinchDistance = distance;
    pinchCenter = center;
    return;
  }
  applyScaleAtPoint(stageScale.value * (distance / pinchDistance), pinchCenter);
  pinchDistance = distance;
  pinchCenter = center;
}

function onTouchEndCanvas() {
  pinchDistance = 0;
  pinchCenter = null;
}

function getBoothSize(booth: MapBooth) {
  return booth.size ?? mapData.value.layout.defaultBoothSize;
}

function getBoothRectPx(booth: MapBooth) {
  const boothSize = getBoothSize(booth);
  const { unitPx, mapSize } = mapData.value.layout;
  return {
    x: (booth.position.x - mapSize.minX) * unitPx.w,
    y: (mapSize.maxY - booth.position.y - boothSize.h + 1) * unitPx.h,
    width: boothSize.w * unitPx.w,
    height: boothSize.h * unitPx.h,
  };
}

function getBoothRectConfig(booth: MapBooth) {
  const rect = getBoothRectPx(booth);
  const visual = getBoothVisualStyle(booth);
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    fill: visual.fillColor,
    stroke: visual.borderColor,
    strokeWidth: visual.borderWidth,
    cornerRadius: 10,
    opacity: booth.disabled ? 0.65 : 1,
  };
}

function getBoothIdTextConfig(booth: MapBooth) {
  const rect = getBoothRectPx(booth);
  const visual = getBoothVisualStyle(booth);
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    text: booth.boothId,
    fill: visual.textColor,
    fontSize: visual.fontSize,
    fontStyle: "bold",
    align: "center",
    verticalAlign: "middle",
    listening: false,
  };
}

function selectBooth(booth: MapBooth) {
  if (!isBoothClickable(booth)) return;
  const target = normalizeBoothIdForCompare(booth.boothId);
  const nextIndex = cards.value.findIndex(
    (card) => normalizeBoothIdForCompare(card.boothId) === target,
  );
  if (nextIndex >= 0) activeIndex.value = nextIndex;
}

function getTotalPrice(index: number) {
  const card = cards.value[index];
  if (!card) return 0;
  return card.purchaseItems.reduce(
    (total, item) => total + (item.enabled ? Number(item.price) || 0 : 0),
    0,
  );
}

function getTagLabel(tagId: string) {
  return CARD_TAG_MAP[tagId as keyof typeof CARD_TAG_MAP]?.displayName ?? tagId;
}

function getTagConfig(tagId: string) {
  return CARD_TAG_MAP[tagId as keyof typeof CARD_TAG_MAP];
}

function nextCard() {
  if (!cards.value.length) return;
  activeIndex.value = (activeIndex.value + 1) % cards.value.length;
}

function prevCard() {
  if (!cards.value.length) return;
  activeIndex.value =
    (activeIndex.value - 1 + cards.value.length) % cards.value.length;
}

function onTouchStart(event: TouchEvent) {
  dragStartY.value = event.touches[0]?.clientY ?? null;
}

function onTouchEnd(event: TouchEvent) {
  if (dragStartY.value === null) return;
  const endY = event.changedTouches[0]?.clientY ?? dragStartY.value;
  const delta = endY - dragStartY.value;
  if (delta < -40) isExpanded.value = true;
  else if (delta > 40) isExpanded.value = false;
  dragStartY.value = null;
}

function goToCard(index: number) {
  activeIndex.value = index;
}

function onCardTouchStart(event: TouchEvent) {
  swipeStartX.value = event.touches[0]?.clientX ?? null;
  swipeStartY.value = event.touches[0]?.clientY ?? null;
}

function onCardTouchEnd(event: TouchEvent) {
  if (swipeStartX.value === null || swipeStartY.value === null) return;
  const endX = event.changedTouches[0]?.clientX ?? swipeStartX.value;
  const endY = event.changedTouches[0]?.clientY ?? swipeStartY.value;
  const deltaX = endX - swipeStartX.value;
  const deltaY = endY - swipeStartY.value;
  if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) nextCard();
    else prevCard();
  }
  swipeStartX.value = null;
  swipeStartY.value = null;
}

let panAnimationId: number | null = null;
const contentGroupRef = ref(null);

function animatePanTo(target: { x: number; y: number }, duration = 400) {
  if (panAnimationId !== null) {
    cancelAnimationFrame(panAnimationId);
    panAnimationId = null;
  }
  const start = { ...stagePan.value };
  const startTime = performance.now();

  function ease(t: number) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function tick(now: number) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const et = ease(t);
    const next = {
      x: start.x + (target.x - start.x) * et,
      y: start.y + (target.y - start.y) * et,
    };
    const node = (contentGroupRef.value as any)?.getNode();
    if (node) {
      node.position(next);
      node.getLayer()?.batchDraw();
    }
    if (t < 1) {
      panAnimationId = requestAnimationFrame(tick);
    } else {
      stagePan.value = next;
      panAnimationId = null;
    }
  }

  panAnimationId = requestAnimationFrame(tick);
}

function togglePurchaseItem(card: (typeof cards.value)[number], index: number) {
  card.purchaseItems[index].enabled = !card.purchaseItems[index].enabled;
  cardStore.save();
}

function toggleExchangeGift(card: (typeof cards.value)[number], index: number) {
  card.exchangeGifts[index].enabled = !card.exchangeGifts[index].enabled;
  cardStore.save();
}

watch(
  () => mapData.value.layout.zoom,
  () => {
    stageScale.value = clampScale(stageScale.value);
    stagePan.value = clampPan(stagePan.value, stageScale.value);
  },
  { deep: true },
);

watch(mapPxSize, () => {
  stagePan.value = clampPan(stagePan.value, stageScale.value);
});

watch(activeIndex, (index) => {
  localStorage.setItem(ACTIVE_INDEX_KEY, String(index));
  const boothId = cards.value[index]?.boothId ?? "";
  if (boothId) centerOnBooth(boothId);
});

onMounted(() => {
  updateViewportSize();
  stageScale.value = clampScale(1);
  nextTick(() => {
    const firstBoothId = cards.value[0]?.boothId ?? "";
    if (firstBoothId) {
      centerOnBooth(firstBoothId);
    } else {
      stagePan.value = clampPan({ x: 0, y: 0 }, stageScale.value);
    }
  });
  if (stageContainerRef.value) {
    resizeObserver = new ResizeObserver(() => updateViewportSize());
    resizeObserver.observe(stageContainerRef.value);
  }
});

onBeforeUnmount(() => {
  if (panAnimationId !== null) cancelAnimationFrame(panAnimationId);
  if (resizeObserver && stageContainerRef.value)
    resizeObserver.unobserve(stageContainerRef.value);
  resizeObserver = null;
});
</script>

<template>
  <!-- template 與原版完全相同，無需修改 -->
  <section class="page-shell map-page-shell">
    <div class="map-shell-full">
      <div class="map-toolbar">
        <h1 class="editor-title">Map</h1>
        <div class="map-toolbar-actions">
          <button
            type="button"
            class="icon-badge-button"
            @click="showLayoutModal = true"
          >
            地圖設定
          </button>
          <button
            type="button"
            class="icon-badge-button"
            @click="showBoothsModal = true"
          >
            攤位資料
          </button>
        </div>
      </div>

      <div
        ref="stageContainerRef"
        class="map-canvas-wrap"
        @wheel="onWheel"
        @touchmove="onTouchMove"
        @touchend="onTouchEndCanvas"
        @touchcancel="onTouchEndCanvas"
      >
        <v-stage class="map-stage" :config="stageConfig">
          <v-layer>
            <v-group ref="contentGroupRef" :config="contentGroupConfig">
              <v-rect
                :config="{
                  x: 0,
                  y: 0,
                  width: mapPxSize.width,
                  height: mapPxSize.height,
                  fill: '#f8fafc',
                }"
              />
              <v-line
                v-for="(line, index) in gridLines"
                :key="`grid-${index}`"
                :config="{
                  points: line.points,
                  stroke: '#dbe2ee',
                  strokeWidth: 1,
                }"
              />
              <template
                v-for="booth in mapData.booths"
                :key="`booth-${booth.id}`"
              >
                <v-rect
                  :config="getBoothRectConfig(booth)"
                  @click="selectBooth(booth)"
                  @tap="selectBooth(booth)"
                />
                <v-text :config="getBoothIdTextConfig(booth)" />
              </template>
            </v-group>
          </v-layer>
        </v-stage>
      </div>
    </div>

    <aside class="map-bottom-sheet" :class="{ 'is-expanded': isExpanded }">
      <button
        class="map-sheet-handle"
        type="button"
        @click="isExpanded = !isExpanded"
        @touchstart="onTouchStart"
        @touchend="onTouchEnd"
      >
        <span class="map-handle-bar" />
      </button>

      <div v-if="cards.length" class="map-sheet-carousel">
        <button type="button" class="map-nav-button" @click="prevCard">
          ‹
        </button>
        <div class="map-card-track">
          <article
            v-for="(card, index) in cards"
            :key="card.id"
            class="map-preview-card"
            :class="{ active: index === activeIndex }"
            @click="goToCard(index)"
            @touchstart="onCardTouchStart"
            @touchend="onCardTouchEnd"
          >
            <div class="map-preview-top">
              <h2 class="map-booth-id">{{ card.boothId || "未設定攤位" }}</h2>
              <div class="map-author-tag-row">
                <span
                  v-for="author in card.authorNames.filter(Boolean)"
                  :key="author"
                  class="map-author-badge"
                  >{{ author }}</span
                >
                <span
                  v-if="!card.authorNames.filter(Boolean).length"
                  class="map-author-empty"
                  >尚無作者</span
                >
              </div>
            </div>
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
                    !card.tags.length &&
                    !card.exchangeGifts.length &&
                    !card.note.trim()
                  "
                  class="map-meta-empty"
                  >無標記</span
                >
              </div>
              <p class="map-total-price">金額 ${{ getTotalPrice(index) }}</p>
            </div>
            <div
              v-if="isExpanded && index === activeIndex"
              class="map-card-detail"
            >
              <!-- Purchase -->
              <div class="map-card-section">
                <p class="map-card-section-title">Purchase</p>
                <div class="map-card-glass-section">
                  <div
                    v-if="card.purchaseItems.length"
                    class="map-card-row-list"
                  >
                    <div
                      v-for="(item, i) in card.purchaseItems"
                      :key="i"
                      class="map-card-row-item"
                      :class="{ 'map-card-row-item--disabled': !item.enabled }"
                    >
                      <label class="map-card-item-label">
                        <input
                          type="checkbox"
                          class="h-4 w-4 accent-slate-500"
                          :checked="item.enabled"
                          @change="togglePurchaseItem(card, i)"
                        />
                        <div class="map-card-item-text">
                          <span class="map-card-item-author">{{
                            item.authorName
                          }}</span>
                          <span class="map-card-item-sep">/</span>
                          <span :class="{ 'line-through': !item.enabled }">{{
                            item.itemName
                          }}</span>
                        </div>
                      </label>
                      <div
                        class="map-card-item-price"
                        :class="{ 'line-through': !item.enabled }"
                      >
                        ${{ Number(item.price) || 0 }}
                      </div>
                    </div>
                  </div>
                  <p v-else class="map-card-empty">尚未新增購買項目</p>
                </div>
              </div>

              <!-- Gift -->
              <div class="map-card-section">
                <p class="map-card-section-title">Meeting Gift</p>
                <div class="map-card-glass-section">
                  <div
                    v-if="card.exchangeGifts.length"
                    class="map-card-row-list"
                  >
                    <div
                      v-for="(gift, i) in card.exchangeGifts"
                      :key="i"
                      class="map-card-row-item"
                      :class="{ 'map-card-row-item--disabled': !gift.enabled }"
                    >
                      <label class="map-card-item-label">
                        <input
                          type="checkbox"
                          class="h-4 w-4 accent-slate-500"
                          :checked="gift.enabled"
                          @change="toggleExchangeGift(card, i)"
                        />
                        <div class="map-card-item-text">
                          <span class="map-card-item-author">{{
                            gift.authorName
                          }}</span>
                          <span class="map-card-item-sep">/</span>
                          <span :class="{ 'line-through': !gift.enabled }">{{
                            gift.itemName
                          }}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  <p v-else class="map-card-empty">尚未新增認親禮</p>
                </div>
              </div>

              <!-- Note -->
              <div v-if="card.note.trim()" class="map-card-section">
                <p class="map-card-section-title">Note</p>
                <div class="map-card-glass-section">
                  <p class="map-card-note-text">{{ card.note }}</p>
                </div>
              </div>

              <div class="map-card-actions">
                <button
                  type="button"
                  class="map-card-action-button"
                  :class="
                    card.enabled
                      ? 'map-card-action-confirm'
                      : 'map-card-action-undo'
                  "
                  @click.stop="toggleCardEnabled(card)"
                >
                  <AppIcon
                    :name="card.enabled ? 'check-circle' : 'close-circle'"
                    class="h-4 w-4"
                  />
                  {{ card.enabled ? "已完成" : "完成" }}
                </button>
              </div>
            </div>
          </article>
        </div>
        <button type="button" class="map-nav-button" @click="nextCard">
          ›
        </button>
      </div>

      <p v-else class="map-empty-sheet">尚無卡片資料</p>

      <div v-if="cards.length" class="map-dots-row">
        <button
          v-for="(_, index) in cards"
          :key="index"
          type="button"
          class="map-dot"
          :class="{ active: index === activeIndex }"
          @click="goToCard(index)"
        />
      </div>
    </aside>

    <MapLayoutManagerModal
      v-model="showLayoutModal"
      :layout="mapData.layout"
      @save="handleLayoutImport"
    />
    <MapBoothManagerModal
      v-model="showBoothsModal"
      :booths="mapData.booths"
      @save="handleBoothsImport"
    />
  </section>
</template>
