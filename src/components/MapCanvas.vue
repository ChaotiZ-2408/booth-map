<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import type { CSSProperties } from "vue";
import type { MapBooth, MapData } from "@/types/map";

import type { ListItemStyle } from "@/types/listItem";
import {
  getMapBoothStyle,
  NON_CLICKABLE_MAP_BOOTH_STYLE,
} from "@/data/listItemStyles";

const TAP_MOVE_THRESHOLD_PX = 8;

const props = defineProps<{
  mapData: MapData;
  boothStyleMap: Map<string, ListItemStyle>;
  selectedBoothId: string;
}>();

const emit = defineEmits<{
  (event: "select-booth", booth: MapBooth): void;
}>();

const stageContainerRef = ref<HTMLElement | null>(null);
const mapContentRef = ref<HTMLElement | null>(null);
const stagePan = ref({ x: 0, y: 0 });
const stageScale = ref(1);
const viewportSize = ref({ width: 1, height: 1 });

let resizeObserver: ResizeObserver | null = null;
let liveStagePan = { x: 0, y: 0 };
let liveStageScale = 1;
const activePointers = new Map<number, { x: number; y: number }>();
let lastPointerCenter: { x: number; y: number } | null = null;
let pointerStartCenter: { x: number; y: number } | null = null;
let lastPointerDistance = 0;
let didMoveDuringPointer = false;
let suppressClickUntil = 0;
let wheelSyncTimer: number | null = null;
let panAnimationId: number | null = null;

type NumberedBoothId = {
  prefix: string;
  num: number;
  numText: string;
};

type RenderedBoothItem = {
  key: string;
  booth: MapBooth;
  label: string;
  clickable: boolean;
  selected: boolean;
  merged: boolean;
  style: CSSProperties;
};

function normalizeBoothIdForCompare(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const matched = raw.match(/^(.+?)(\d+)$/);
  if (!matched) return raw.toUpperCase();
  const [, prefix, num] = matched;
  return `${prefix.toUpperCase()}${Number(num)}`;
}

function parseNumberedBoothId(value: string): NumberedBoothId | null {
  const matched = value.trim().match(/^(.+?)(\d+)$/);
  if (!matched) return null;
  return { prefix: matched[1], num: Number(matched[2]), numText: matched[2] };
}

const mapBounds = computed(() => {
  const { mapPadding } = props.mapData.layout;
  if (!props.mapData.booths.length) {
    return {
      minX: -mapPadding.left,
      maxX: mapPadding.right,
      minY: -mapPadding.bottom,
      maxY: mapPadding.top,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const booth of props.mapData.booths) {
    const boothSize = getBoothSize(booth);
    minX = Math.min(minX, booth.position.x);
    maxX = Math.max(maxX, booth.position.x + boothSize.w - 1);
    minY = Math.min(minY, booth.position.y);
    maxY = Math.max(maxY, booth.position.y + boothSize.h - 1);
  }

  return {
    minX: minX - mapPadding.left,
    maxX: maxX + mapPadding.right,
    minY: minY - mapPadding.bottom,
    maxY: maxY + mapPadding.top,
  };
});

const mapPxSize = computed(() => ({
  width:
    (mapBounds.value.maxX - mapBounds.value.minX + 1) *
    props.mapData.layout.unitPx.w,
  height:
    (mapBounds.value.maxY - mapBounds.value.minY + 1) *
    props.mapData.layout.unitPx.h,
}));

const mapContentStyle = computed(
  () =>
    ({
      width: `${mapPxSize.value.width}px`,
      height: `${mapPxSize.value.height}px`,
      transform: getTransform(stagePan.value, stageScale.value),
      "--unit-w": `${props.mapData.layout.unitPx.w}px`,
      "--unit-h": `${props.mapData.layout.unitPx.h}px`,
    }) as CSSProperties,
);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getZoomConfig() {
  const zoom = props.mapData.layout.zoom;
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

function getTransform(pan: { x: number; y: number }, scale: number) {
  return `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`;
}

function applyViewportTransform(
  pan: { x: number; y: number },
  scale: number,
  syncVue = true,
) {
  liveStagePan = { ...pan };
  liveStageScale = scale;

  const content = mapContentRef.value;
  if (content)
    content.style.transform = getTransform(liveStagePan, liveStageScale);

  if (syncVue || !content) {
    stageScale.value = liveStageScale;
    stagePan.value = liveStagePan;
  }
}

function syncViewportState() {
  stageScale.value = liveStageScale;
  stagePan.value = liveStagePan;
}

function applyScaleAtPoint(
  nextScale: number,
  center: { x: number; y: number },
  syncVue = true,
) {
  const currentScale = liveStageScale;
  const clampedScale = clampScale(nextScale);
  if (!Number.isFinite(clampedScale)) return;

  const worldX = (center.x - liveStagePan.x) / currentScale;
  const worldY = (center.y - liveStagePan.y) / currentScale;
  const nextPan = {
    x: center.x - worldX * clampedScale,
    y: center.y - worldY * clampedScale,
  };
  applyViewportTransform(
    clampPan(nextPan, clampedScale),
    clampedScale,
    syncVue,
  );
}

function resetViewport() {
  nextTick(() => {
    const scale = clampScale(1);
    applyViewportTransform(clampPan({ x: 0, y: 0 }, scale), scale);
  });
}

function centerOnBooth(boothId: string) {
  if (!boothId) return;
  const normalizedId = normalizeBoothIdForCompare(boothId);
  const booth = props.mapData.booths.find(
    (item) => normalizeBoothIdForCompare(item.boothId) === normalizedId,
  );
  if (!booth) return;

  const rect = getBoothRectPx(booth);
  const target = clampPan(
    {
      x:
        viewportSize.value.width / 2 -
        (rect.x + rect.width / 2) * liveStageScale,
      y:
        viewportSize.value.height / 2 -
        (rect.y + rect.height / 2) * liveStageScale,
    },
    liveStageScale,
  );
  animatePanTo(target);
}

function updateViewportSize() {
  const container = stageContainerRef.value;
  if (!container) return;
  viewportSize.value = {
    width: Math.max(1, Math.floor(container.clientWidth)),
    height: Math.max(1, Math.floor(container.clientHeight)),
  };
  applyViewportTransform(
    clampPan(liveStagePan, liveStageScale),
    liveStageScale,
  );
}

function onWheel(event: WheelEvent) {
  event.preventDefault();
  const rect = stageContainerRef.value?.getBoundingClientRect();
  if (!rect) return;
  const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  const step = getZoomConfig().wheelStep;
  const factor = 1 + step * (event.deltaY > 0 ? -1 : 1);
  applyScaleAtPoint(liveStageScale * factor, pointer, false);
  if (wheelSyncTimer !== null) window.clearTimeout(wheelSyncTimer);
  wheelSyncTimer = window.setTimeout(() => {
    syncViewportState();
    wheelSyncTimer = null;
  }, 120);
}

function getPointerCenter() {
  const pointers = [...activePointers.values()];
  if (!pointers.length) return null;
  return {
    x:
      pointers.reduce((total, pointer) => total + pointer.x, 0) /
      pointers.length,
    y:
      pointers.reduce((total, pointer) => total + pointer.y, 0) /
      pointers.length,
  };
}

function getPointerDistance() {
  const pointers = [...activePointers.values()];
  if (pointers.length < 2) return 0;
  return Math.hypot(
    pointers[0].x - pointers[1].x,
    pointers[0].y - pointers[1].y,
  );
}

function onPointerDown(event: PointerEvent) {
  const rect = stageContainerRef.value?.getBoundingClientRect();
  if (!rect) return;
  const captureTarget =
    event.target instanceof HTMLElement
      ? event.target
      : (event.currentTarget as HTMLElement);
  captureTarget.setPointerCapture(event.pointerId);
  activePointers.set(event.pointerId, {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });
  lastPointerCenter = getPointerCenter();
  pointerStartCenter =
    activePointers.size === 1 ? lastPointerCenter : pointerStartCenter;
  lastPointerDistance = getPointerDistance();
  didMoveDuringPointer = activePointers.size > 1;
}

function onPointerMove(event: PointerEvent) {
  if (!activePointers.has(event.pointerId)) return;
  event.preventDefault();
  const rect = stageContainerRef.value?.getBoundingClientRect();
  if (!rect) return;

  activePointers.set(event.pointerId, {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });
  const center = getPointerCenter();
  if (!center || !lastPointerCenter) {
    lastPointerCenter = center;
    return;
  }

  const delta = {
    x: center.x - lastPointerCenter.x,
    y: center.y - lastPointerCenter.y,
  };
  const startDelta = pointerStartCenter
    ? Math.hypot(
        center.x - pointerStartCenter.x,
        center.y - pointerStartCenter.y,
      )
    : 0;
  if (activePointers.size > 1 || startDelta > TAP_MOVE_THRESHOLD_PX) {
    didMoveDuringPointer = true;
    suppressClickUntil = performance.now() + 250;
  }

  if (activePointers.size >= 2) {
    const distance = getPointerDistance();
    if (distance > 0 && lastPointerDistance > 0) {
      applyScaleAtPoint(
        liveStageScale * (distance / lastPointerDistance),
        lastPointerCenter,
        false,
      );
    }
    lastPointerDistance = distance;
  }

  applyViewportTransform(
    clampPan(
      { x: liveStagePan.x + delta.x, y: liveStagePan.y + delta.y },
      liveStageScale,
    ),
    liveStageScale,
    false,
  );
  lastPointerCenter = center;
}

function onPointerEnd(event: PointerEvent) {
  activePointers.delete(event.pointerId);
  lastPointerCenter = getPointerCenter();
  lastPointerDistance = getPointerDistance();
  if (!activePointers.size) pointerStartCenter = null;
  syncViewportState();
}

function getBoothSize(booth: MapBooth) {
  return booth.size ?? props.mapData.layout.defaultBoothSize;
}

function getBoothRectPx(booth: MapBooth) {
  const boothSize = getBoothSize(booth);
  const { unitPx } = props.mapData.layout;
  const bounds = mapBounds.value;
  return {
    x: (booth.position.x - bounds.minX) * unitPx.w,
    y: (bounds.maxY - booth.position.y - boothSize.h + 1) * unitPx.h,
    width: boothSize.w * unitPx.w,
    height: boothSize.h * unitPx.h,
  };
}

function isBoothClickable(booth: MapBooth) {
  return (
    !booth.disabled &&
    props.boothStyleMap.has(normalizeBoothIdForCompare(booth.boothId))
  );
}

function getBoothVisualStyle(
  booth: MapBooth,
  clickable = isBoothClickable(booth),
) {
  if (!clickable) return NON_CLICKABLE_MAP_BOOTH_STYLE;

  const boothId = normalizeBoothIdForCompare(booth.boothId);
  const itemStyle = props.boothStyleMap.get(boothId) ?? "default";

  return getMapBoothStyle(itemStyle, props.selectedBoothId === boothId);
}

function getBoothStyle(
  booth: MapBooth,
  clickable = isBoothClickable(booth),
): CSSProperties {
  const rect = getBoothRectPx(booth);
  const visual = getBoothVisualStyle(booth, clickable);
  return {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    background: visual.fillColor,
    borderColor: visual.borderColor,
    borderWidth: `${visual.borderWidth}px`,
    color: visual.textColor,
    fontSize: `${visual.fontSize}px`,
    opacity: booth.disabled ? 0.65 : 1,
    pointerEvents: clickable ? "auto" : "none",
  };
}

function getBoothItem(booth: MapBooth): RenderedBoothItem {
  const clickable = isBoothClickable(booth);
  return {
    key: `booth-${booth.id}`,
    booth,
    label: booth.boothId,
    clickable,
    selected:
      props.selectedBoothId === normalizeBoothIdForCompare(booth.boothId),
    merged: false,
    style: getBoothStyle(booth, clickable),
  };
}

function canMergeBooths(prev: MapBooth, next: MapBooth) {
  const prevId = parseNumberedBoothId(prev.boothId);
  const nextId = parseNumberedBoothId(next.boothId);
  if (!prevId || !nextId || prevId.prefix !== nextId.prefix) return false;
  if (Math.abs(prevId.num - nextId.num) !== 1 || prev.facing !== next.facing)
    return false;
  const prevSize = getBoothSize(prev);
  const nextSize = getBoothSize(next);
  if (prevSize.w !== nextSize.w || prevSize.h !== nextSize.h) return false;
  const adjacentX =
    prev.position.y === next.position.y &&
    Math.abs(prev.position.x - next.position.x) === prevSize.w;
  const adjacentY =
    prev.position.x === next.position.x &&
    Math.abs(prev.position.y - next.position.y) === prevSize.h;
  return adjacentX || adjacentY;
}

function getMergedBoothStyle(booths: MapBooth[]): CSSProperties {
  const rects = booths.map(getBoothRectPx);
  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));
  const visual = NON_CLICKABLE_MAP_BOOTH_STYLE;

  return {
    left: `${minX}px`,
    top: `${minY}px`,
    width: `${maxX - minX}px`,
    height: `${maxY - minY}px`,
    background: visual.fillColor,
    borderColor: visual.borderColor,
    borderWidth: `${visual.borderWidth}px`,
    color: visual.textColor,
    fontSize: `${visual.fontSize}px`,
    opacity: booths.some((booth) => booth.disabled) ? 0.65 : 1,
    pointerEvents: "none",
  };
}

function getMergedBoothItem(booths: MapBooth[]): RenderedBoothItem {
  if (booths.length === 1) return getBoothItem(booths[0]);
  const firstId = parseNumberedBoothId(booths[0].boothId);
  const lastId = parseNumberedBoothId(booths[booths.length - 1].boothId);
  return {
    key: `merged-${booths[0].id}-${booths[booths.length - 1].id}`,
    booth: booths[0],
    label:
      firstId && lastId
        ? `${firstId.prefix} | ${firstId.numText}-${lastId.numText}`
        : `${booths[0].boothId}~${booths[booths.length - 1].boothId}`,
    clickable: false,
    selected: false,
    merged: true,
    style: getMergedBoothStyle(booths),
  };
}

const renderedBooths = computed(() => {
  if (stageScale.value >= 1) return props.mapData.booths.map(getBoothItem);
  const items: RenderedBoothItem[] = [];
  let pending: MapBooth[] = [];
  const flushPending = () => {
    if (!pending.length) return;
    items.push(getMergedBoothItem(pending));
    pending = [];
  };

  for (const booth of props.mapData.booths) {
    const clickable = isBoothClickable(booth);
    if (clickable || booth.disabled || !parseNumberedBoothId(booth.boothId)) {
      flushPending();
      items.push(getBoothItem(booth));
      continue;
    }
    const prev = pending[pending.length - 1];
    if (prev && !canMergeBooths(prev, booth)) flushPending();
    pending.push(booth);
  }
  flushPending();
  return items;
});

function handleBoothClick(booth: MapBooth) {
  if (
    performance.now() < suppressClickUntil ||
    didMoveDuringPointer ||
    !isBoothClickable(booth)
  )
    return;
  emit("select-booth", booth);
}

function animatePanTo(target: { x: number; y: number }, duration = 400) {
  if (panAnimationId !== null) cancelAnimationFrame(panAnimationId);
  const start = { ...liveStagePan };
  const startTime = performance.now();
  const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

  function tick(now: number) {
    const t = Math.min((now - startTime) / duration, 1);
    const et = ease(t);
    const next = {
      x: start.x + (target.x - start.x) * et,
      y: start.y + (target.y - start.y) * et,
    };
    applyViewportTransform(next, liveStageScale, false);
    if (t < 1) panAnimationId = requestAnimationFrame(tick);
    else {
      applyViewportTransform(next, liveStageScale);
      panAnimationId = null;
    }
  }
  panAnimationId = requestAnimationFrame(tick);
}

watch(
  () => props.mapData.layout.zoom,
  () => {
    const scale = clampScale(liveStageScale);
    applyViewportTransform(clampPan(liveStagePan, scale), scale);
  },
  { deep: true },
);
watch(mapPxSize, () =>
  applyViewportTransform(
    clampPan(liveStagePan, liveStageScale),
    liveStageScale,
  ),
);
watch(
  () => props.selectedBoothId,
  (boothId) => centerOnBooth(boothId),
);

onMounted(() => {
  updateViewportSize();
  resetViewport();
  nextTick(() => centerOnBooth(props.selectedBoothId));
  if (stageContainerRef.value) {
    resizeObserver = new ResizeObserver(updateViewportSize);
    resizeObserver.observe(stageContainerRef.value);
  }
});

onBeforeUnmount(() => {
  if (panAnimationId !== null) cancelAnimationFrame(panAnimationId);
  if (wheelSyncTimer !== null) window.clearTimeout(wheelSyncTimer);
  if (resizeObserver && stageContainerRef.value)
    resizeObserver.unobserve(stageContainerRef.value);
  resizeObserver = null;
});

defineExpose({ resetViewport, centerOnBooth });
</script>

<template>
  <div
    ref="stageContainerRef"
    class="map-canvas-wrap"
    @wheel="onWheel"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerEnd"
    @pointercancel="onPointerEnd"
    @lostpointercapture="onPointerEnd"
  >
    <div ref="mapContentRef" class="map-html-content" :style="mapContentStyle">
      <button
        v-for="item in renderedBooths"
        :key="item.key"
        type="button"
        class="map-html-booth"
        :class="{
          clickable: item.clickable,
          selected: item.selected,
          merged: item.merged,
        }"
        :style="item.style"
        :tabindex="item.clickable ? 0 : -1"
        :aria-pressed="item.selected"
        @click.stop="handleBoothClick(item.booth)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@reference "../style.css";

.map-canvas-wrap {
  @apply h-full w-full overflow-hidden;
  background: #ffffffa8;
  position: relative;
  touch-action: none;
  user-select: none;
}
.map-html-content {
  position: relative;
  transform-origin: 0 0;
  will-change: transform;
  background-color: #f8fafc;
  background-image:
    linear-gradient(to right, #dbe2ee 1px, transparent 1px),
    linear-gradient(to bottom, #dbe2ee 1px, transparent 1px);
  background-size: var(--unit-w) var(--unit-h);
}
.map-html-booth {
  position: absolute;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  appearance: none;
  overflow: hidden;
  border-style: solid;
  border-radius: 6px;
  margin: 0;
  padding: 0 2px;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  touch-action: none;
}
.map-html-booth.clickable {
  cursor: pointer;
}
.map-html-booth.selected {
  z-index: 1;
}
.map-html-booth.merged {
  border-radius: 6px;
  cursor: default;
}
</style>
