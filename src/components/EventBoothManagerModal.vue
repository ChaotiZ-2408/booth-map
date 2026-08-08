<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { parseMapBooths, serializeMapBooths, validateMapBooths } from "@/data/mapData";
import type { MapBooth } from "@/types/map";

interface EventOption {
  eventName: string;
  path: string;
}

const CUSTOM_EVENT_PATH = "__custom__";
const LAST_EVENT_PATH_STORAGE_KEY = "booth-map-last-event-path";
const CUSTOM_EVENT_STORAGE_KEY = "booth-map-custom-event-booths";
const CUSTOM_EVENT_OPTION: EventOption = {
  eventName: "自訂",
  path: CUSTOM_EVENT_PATH,
};
const customEventExample = {
  version: 2,
  eventName: "自訂",
  ranges: [
    {
      from: "A01",
      to: "A06",
      axis: "y",
      start: { x: 0, y: 2 },
      facing: "right",
    },
    {
      from: "A12",
      to: "A07",
      axis: "y",
      start: { x: 1, y: 2 },
      facing: "left",
    },
    {
      from: "B01",
      to: "B06",
      axis: "y",
      start: { x: 4, y: 2 },
      facing: "right",
    },
    {
      from: "B12",
      to: "B07",
      axis: "y",
      start: { x: 5, y: 2 },
      facing: "left",
    },
    {
      from: "C01",
      to: "C06",
      axis: "y",
      start: { x: 8, y: 2 },
      facing: "right",
    },
    {
      from: "C12",
      to: "C07",
      axis: "y",
      start: { x: 9, y: 2 },
      facing: "left",
    },
    {
      from: "D01",
      to: "D06",
      axis: "y",
      start: { x: 12, y: 2 },
      facing: "right",
    },
    {
      from: "D12",
      to: "D07",
      axis: "y",
      start: { x: 13, y: 2 },
      facing: "left",
    },
  ],
  overrides: {
    A01: {
      size: { w: 1, h: 2 },
      labelOffset: { x: 0, y: 0.5 },
    },
    A02: {
      disabled: true,
    },
    C12: {
      size: { w: 1, h: 2 },
      labelOffset: { x: 0, y: 0.5 },
    },
    C11: {
      disabled: true,
    },
  },
  booths: [
    {
      boothId: "出口1",
      position: { x: 0, y: 0 },
      facing: "up",
      size: { w: 2, h: 1 },
      disabled: true,
    },
    {
      boothId: "服務台",
      position: { x: 6, y: 0 },
      facing: "up",
      size: { w: 2, h: 1 },
      disabled: true,
    },
    {
      boothId: "出口2",
      position: { x: 12, y: 0 },
      facing: "up",
      size: { w: 2, h: 1 },
      disabled: true,
    },
  ],
};

const props = defineProps<{
  modelValue: boolean;
  booths: MapBooth[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "save", value: MapBooth[]): void;
}>();

const jsonText = ref("");
const eventOptions = ref<EventOption[]>([]);
const selectedEventPath = ref("");
const currentEventName = ref("");
const isLoadingEvents = ref(false);
const isEventMenuOpen = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const selectedEventLabel = computed(() => {
  const selected = eventOptions.value.find(
    (option) => option.path === selectedEventPath.value,
  );
  return selected?.eventName ?? "選擇場次";
});

function openJson() {
  if (selectedEventPath.value === CUSTOM_EVENT_PATH) {
    jsonText.value =
      localStorage.getItem(CUSTOM_EVENT_STORAGE_KEY) ??
      JSON.stringify(customEventExample, null, 2);
    return;
  }

  jsonText.value = JSON.stringify(
    serializeMapBooths(props.booths, currentEventName.value),
    null,
    2,
  );
}

async function copyJson() {
  await navigator.clipboard.writeText(jsonText.value);
}

function normalizeEventOptions(input: unknown): EventOption[] {
  const events = (input as { events?: unknown })?.events;
  if (!Array.isArray(events)) return [];

  return events
    .map((item) => {
      const option = item as Partial<EventOption>;
      return {
        eventName: typeof option.eventName === "string" ? option.eventName : "",
        path: typeof option.path === "string" ? option.path : "",
      };
    })
    .filter((option) => option.eventName.trim() && option.path.trim());
}

function getDefaultEventPath(input: unknown): string {
  const path = (input as { defaultEventPath?: unknown })?.defaultEventPath;
  return typeof path === "string" ? path : "";
}

async function loadEventIndex() {
  if (eventOptions.value.length) return;

  try {
    isLoadingEvents.value = true;
    const response = await fetch("/data/map-index.json", { cache: "no-store" });
    if (!response.ok) throw new Error("load failed");
    const payload = await response.json();
    const events = normalizeEventOptions(payload);
    eventOptions.value = [...events, CUSTOM_EVENT_OPTION];
    if (!eventOptions.value.length) throw new Error("empty index");
    const lastEventPath = localStorage.getItem(LAST_EVENT_PATH_STORAGE_KEY) ?? "";
    const defaultEventPath = getDefaultEventPath(payload);
    selectedEventPath.value =
      [lastEventPath, defaultEventPath, events[0]?.path ?? CUSTOM_EVENT_PATH].find(
        (path) => eventOptions.value.some((option) => option.path === path),
      ) ?? CUSTOM_EVENT_PATH;
    await loadSelectedEvent();
  } catch {
    alert("載入場次清單失敗");
  } finally {
    isLoadingEvents.value = false;
  }
}

async function loadSelectedEvent() {
  isEventMenuOpen.value = false;
  const selected = eventOptions.value.find(
    (option) => option.path === selectedEventPath.value,
  );
  if (!selected) return;

  if (selected.path === CUSTOM_EVENT_PATH) {
    currentEventName.value = selected.eventName;
    jsonText.value =
      localStorage.getItem(CUSTOM_EVENT_STORAGE_KEY) ??
      JSON.stringify(customEventExample, null, 2);
    return;
  }

  try {
    isLoadingEvents.value = true;
    const response = await fetch(selected.path, { cache: "no-store" });
    if (!response.ok) throw new Error("load failed");
    const payload = await response.json();
    currentEventName.value =
      typeof payload?.eventName === "string" && payload.eventName.trim()
        ? payload.eventName
        : selected.eventName;
    jsonText.value = JSON.stringify(payload, null, 2);
  } catch {
    alert("載入場次地圖失敗");
  } finally {
    isLoadingEvents.value = false;
  }
}

function selectEvent(option: EventOption) {
  selectedEventPath.value = option.path;
  void loadSelectedEvent();
}

function importJson() {
  try {
    const parsed = JSON.parse(jsonText.value);

    let normalized: MapBooth[];
    try {
      normalized = parseMapBooths(parsed);
    } catch (e) {
      return alert(e instanceof Error ? e.message : "JSON 格式錯誤");
    }

    const error = validateMapBooths(normalized);
    if (error) return alert(error);

    currentEventName.value =
      typeof parsed?.eventName === "string" ? parsed.eventName : currentEventName.value;
    if (selectedEventPath.value === CUSTOM_EVENT_PATH) {
      localStorage.setItem(CUSTOM_EVENT_STORAGE_KEY, JSON.stringify(parsed, null, 2));
    }
    if (selectedEventPath.value) {
      localStorage.setItem(LAST_EVENT_PATH_STORAGE_KEY, selectedEventPath.value);
    }
    emit("save", normalized);
    visible.value = false;
  } catch {
    alert("JSON 格式錯誤");
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      isEventMenuOpen.value = false;
      return;
    }
    openJson();
    if (eventOptions.value.length) {
      void loadSelectedEvent();
    } else {
      void loadEventIndex();
    }
  }
);
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-backdrop" @click="visible = false">
      <section class="modal-panel modal-panel-wide" role="dialog" aria-modal="true"
        aria-labelledby="event-booth-modal-title" @click.stop>
        <header class="modal-header">
          <div class="modal-title-group">
            <h2 id="event-booth-modal-title" class="modal-title">切換場次</h2>
            <p class="modal-subtitle">選擇場次或編輯攤位 JSON</p>
          </div>

          <button type="button" class="modal-close-button" aria-label="關閉" @click="visible = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"
              aria-hidden="true">
              <path
                d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
            </svg>
          </button>
        </header>

        <div class="modal-body">
          <div>
            <label class="modal-field-label">場次地圖</label>
            <div class="relative" @keydown.esc="isEventMenuOpen = false">
              <button type="button" class="modal-select-button" :disabled="isLoadingEvents || !eventOptions.length"
                :aria-expanded="isEventMenuOpen" @click="isEventMenuOpen = !isEventMenuOpen">
                <span class="min-w-0 truncate">{{ isLoadingEvents ? "載入中..." : selectedEventLabel }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"
                  class="shrink-0 text-editor-muted transition-transform" :class="{ 'rotate-180': isEventMenuOpen }"
                  aria-hidden="true">
                  <path fill-rule="evenodd"
                    d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
                </svg>
              </button>

              <div v-if="isEventMenuOpen" class="modal-select-menu">
                <button v-for="option in eventOptions" :key="option.path" type="button" class="modal-select-option"
                  :class="{ 'modal-select-option-active': option.path === selectedEventPath }"
                  @click="selectEvent(option)">
                  <span class="min-w-0 truncate">{{ option.eventName }}</span>
                  <svg v-if="option.path === selectedEventPath" xmlns="http://www.w3.org/2000/svg" width="14"
                    height="14" fill="currentColor" viewBox="0 0 16 16" class="shrink-0" aria-hidden="true">
                    <path
                      d="M13.485 1.929a.75.75 0 0 1 .086 1.057l-7 8a.75.75 0 0 1-1.09.042l-3.5-3.5a.75.75 0 0 1 1.06-1.06l2.933 2.932 6.454-7.385a.75.75 0 0 1 1.057-.086" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <textarea v-model="jsonText" class="modal-textarea" aria-label="場次攤位 JSON 資料" spellcheck="false" />
        </div>

        <footer class="modal-footer">
          <button type="button" class="modal-button modal-button-subtle mr-auto"
            :disabled="isLoadingEvents || !selectedEventPath" @click="loadSelectedEvent">
            重新載入
          </button>
          <button type="button" class="modal-button modal-button-secondary" @click="copyJson">複製</button>
          <button type="button" class="modal-button modal-button-primary" @click="importJson">保存</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
<style scoped>
@reference "../style.css";

.modal-backdrop {
  @apply fixed inset-0 z-50 flex items-end justify-center bg-black/25 backdrop-blur-sm sm:items-center sm:p-5;
}

.modal-panel {
  @apply flex h-[85dvh] w-full flex-col overflow-hidden border border-editor-border bg-editor-surface text-editor-text shadow-editor-card sm:h-auto sm:max-h-[85dvh] sm:max-w-lg sm:rounded-editor-card;
  border-radius: 20px 20px 0 0;
}

@media (min-width: 640px) {
  .modal-panel {
    border-radius: 8px;
  }
}

.modal-panel-wide {
  @apply sm:max-w-4xl;
}

.modal-header {
  @apply flex shrink-0 items-center justify-between gap-3 border-b border-editor-border/70 px-4 py-3 sm:px-5;
}

.modal-title-group {
  @apply min-w-0;
}

.modal-title {
  @apply m-0 text-[18px] leading-[1.4] font-medium text-editor-text;
}

.modal-subtitle {
  @apply mt-0.5 text-[12px] leading-[1.5] font-normal tracking-wide text-editor-muted;
}

.modal-close-button {
  @apply inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-editor-card border-0 bg-transparent text-editor-muted transition-colors hover:bg-editor-muted-surface hover:text-editor-text active:scale-95;
}

.modal-body {
  @apply flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5;
}

.modal-description {
  @apply m-0 text-[14px] leading-[1.6] text-editor-muted;
}

.modal-field-label {
  @apply mb-1.5 block text-[12px] leading-none font-medium tracking-wide text-editor-muted;
}

.modal-textarea {
  @apply min-h-[240px] w-full flex-1 resize-none rounded-editor-card border border-editor-border bg-editor-bg p-3 font-mono text-[12px] leading-[1.6] text-editor-text outline-none transition-colors placeholder:text-editor-muted/70 focus:border-editor-primary;
}

.modal-footer {
  @apply flex shrink-0 items-center justify-end gap-2 border-t border-editor-border/70 bg-editor-surface px-4 py-3 sm:px-5;
}

.modal-button {
  @apply inline-flex min-h-9 items-center justify-center rounded-editor-card border px-4 py-2 text-[12px] leading-none font-medium tracking-wide transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-45;
}

.modal-button-secondary {
  @apply border-editor-border bg-editor-muted-surface text-editor-muted hover:bg-[#eeeeec] hover:text-editor-text;
}

.modal-button-primary {
  @apply border-editor-primary bg-editor-primary text-white hover:opacity-90;
}

.modal-button-subtle {
  @apply border-transparent bg-transparent text-editor-muted hover:bg-editor-muted-surface hover:text-editor-text;
}

.modal-select-button {
  @apply flex w-full items-center justify-between gap-3 rounded-editor-card border border-editor-border bg-editor-bg px-3 py-2.5 text-left text-[14px] leading-[1.5] font-normal text-editor-text outline-none transition-colors focus:border-editor-primary disabled:cursor-not-allowed disabled:opacity-45;
}

.modal-select-menu {
  @apply absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-editor-card border border-editor-border bg-editor-surface shadow-editor-fab;
}

.modal-select-option {
  @apply flex w-full items-center justify-between gap-3 border-0 bg-transparent px-3 py-2.5 text-left text-[14px] leading-[1.5] text-editor-text transition-colors hover:bg-editor-muted-surface;
}

.modal-select-option-active {
  @apply bg-editor-primary-soft/50 font-medium text-editor-primary;
}
</style>
