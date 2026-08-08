import { computed, onMounted, ref, watch } from "vue";
import {
  defaultMapData,
  normalizeMapData,
  parseMapBooths,
  validateMapBooths,
  validateMapData,
} from "@/data/mapData";
import { useListStore } from "@/stores/listStore";
import type { MapBooth, MapData, MapLayoutConfig } from "@/types/map";
import type { ListItemStyle } from "@/types/listItem";

const MAP_STORAGE_KEY = "booth-map-layout";
const ACTIVE_INDEX_KEY = "booth-map-active-list-item-index";
const LAST_EVENT_PATH_STORAGE_KEY = "booth-map-last-event-path";
const LAST_EVENT_NAME_STORAGE_KEY = "booth-map-last-event-name";
const CUSTOM_EVENT_PATH = "__custom__";
const CUSTOM_EVENT_STORAGE_KEY = "booth-map-custom-event-booths";

type UseMapOptions = {
  resetViewport?: () => void;
};

export function useMap(options: UseMapOptions = {}) {
  const listStore = useListStore();
  const listItems = computed(() => listStore.listItems ?? []);
  const activeIndex = ref(loadActiveIndex());
  const currentMapName = ref(getStoredMapName());

  const storedMap = loadStoredMapData();
  const mapData = ref<MapData>(storedMap.data);
  let shouldLoadDefaultEvent = !storedMap.valid;

  const boothStyleMap = computed(
    () =>
      new Map<string, ListItemStyle>(
        listItems.value
          .map((item) => [normalizeBoothId(item.boothId), item.style] as const)
          .filter(([boothId]) => boothId),
      ),
  );

  const selectedBoothId = computed(() =>
    normalizeBoothId(listItems.value[activeIndex.value]?.boothId),
  );

  function saveMapData() {
    localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(mapData.value));
  }

  function updateLayout(layout: MapLayoutConfig) {
    mapData.value.layout = layout;
    saveMapData();
    options.resetViewport?.();
  }

  function updateBooths(booths: MapBooth[]) {
    mapData.value.booths = booths;
    currentMapName.value = getStoredMapName();
    saveMapData();
  }

  function selectBooth(booth: MapBooth) {
    const targetId = normalizeBoothId(booth.boothId);
    const nextIndex = listItems.value.findIndex(
      (item) => normalizeBoothId(item.boothId) === targetId,
    );

    if (nextIndex < 0) return null;

    const wasActive = nextIndex === activeIndex.value;
    activeIndex.value = nextIndex;
    listStore.selectBooth(listItems.value[nextIndex].boothId);

    return { index: nextIndex, wasActive };
  }

  async function loadDefaultEventMap() {
    if (!shouldLoadDefaultEvent) return;
    shouldLoadDefaultEvent = false;

    try {
      const indexResponse = await fetch("/data/map-index.json", {
        cache: "no-store",
      });
      if (!indexResponse.ok) throw new Error("load failed");

      const defaultEventPath = getDefaultEventPath(await indexResponse.json());
      let eventPath =
        localStorage.getItem(LAST_EVENT_PATH_STORAGE_KEY) || defaultEventPath;
      if (!eventPath) throw new Error("missing event path");

      const customPayload =
        eventPath === CUSTOM_EVENT_PATH
          ? localStorage.getItem(CUSTOM_EVENT_STORAGE_KEY)
          : null;

      if (eventPath === CUSTOM_EVENT_PATH && !customPayload)
        eventPath = defaultEventPath;
      if (!eventPath) throw new Error("missing event path");

      const eventPayload = customPayload
        ? JSON.parse(customPayload)
        : await fetch(eventPath, { cache: "no-store" }).then((response) => {
            if (!response.ok) throw new Error("load failed");
            return response.json();
          });

      const booths = parseMapBooths(eventPayload);
      const error = validateMapBooths(booths);
      if (error) throw new Error(error);

      mapData.value.booths = booths;
      localStorage.setItem(LAST_EVENT_PATH_STORAGE_KEY, eventPath);
      currentMapName.value = getEventName(eventPayload, eventPath);
      localStorage.setItem(LAST_EVENT_NAME_STORAGE_KEY, currentMapName.value);
      saveMapData();
      options.resetViewport?.();
    } catch {
      mapData.value = clone(defaultMapData);
      currentMapName.value = "Map";
      localStorage.removeItem(LAST_EVENT_NAME_STORAGE_KEY);
    }
  }

  watch(
    listItems,
    (items) => {
      if (!items.length) {
        activeIndex.value = 0;
        return;
      }

      if (activeIndex.value >= items.length)
        activeIndex.value = items.length - 1;
    },
    { immediate: true },
  );

  watch(activeIndex, (index) => {
    localStorage.setItem(ACTIVE_INDEX_KEY, String(index));
  });

  onMounted(() => {
    void loadDefaultEventMap();
  });

  return {
    activeIndex,
    boothStyleMap,
    currentMapName,
    listItems,
    mapData,
    selectedBoothId,
    selectBooth,
    updateBooths,
    updateLayout,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeBoothId(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const matched = raw.match(/^(.+?)(\d+)$/);
  if (!matched) return raw.toUpperCase();

  return `${matched[1].toUpperCase()}${Number(matched[2])}`;
}

function loadActiveIndex(): number {
  const parsed = parseInt(localStorage.getItem(ACTIVE_INDEX_KEY) ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function loadStoredMapData(): { data: MapData; valid: boolean } {
  try {
    const raw = localStorage.getItem(MAP_STORAGE_KEY);
    if (!raw) return { data: clone(defaultMapData), valid: false };

    const normalized = normalizeMapData(JSON.parse(raw));
    if (validateMapData(normalized))
      return { data: clone(defaultMapData), valid: false };

    return { data: normalized, valid: true };
  } catch {
    return { data: clone(defaultMapData), valid: false };
  }
}

function getDefaultEventPath(input: unknown): string {
  const path = (input as { defaultEventPath?: unknown })?.defaultEventPath;
  return typeof path === "string" ? path : "";
}

function getStoredMapName(): string {
  const storedName = localStorage.getItem(LAST_EVENT_NAME_STORAGE_KEY);
  if (storedName && storedName.trim()) return storedName.trim();

  const eventPath = localStorage.getItem(LAST_EVENT_PATH_STORAGE_KEY) ?? "";
  return getEventName(null, eventPath);
}

function getEventName(payload: unknown, eventPath: string): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["eventName", "name", "title"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }

  if (eventPath === CUSTOM_EVENT_PATH) return "自訂地圖";
  const fileName = eventPath
    .split("/")
    .pop()
    ?.replace(/\.json$/i, "")
    .trim();
  return fileName || "Map";
}
