import type {
  BoothOverrides,
  BoothRange,
  BoothStyleKey,
  BoothVisualStyle,
  MapBooth,
  MapData,
  MapLayoutConfig,
  RangeMapBooths,
} from "@/types/map";

// ---------------------------------------------------------------------------
// 預設樣式定義
// ---------------------------------------------------------------------------

const defaultBoothStyles: Record<BoothStyleKey, BoothVisualStyle> = {
  disable: {
    borderWidth: 2,
    fillColor: "#f8fafc",
    borderColor: "#d3dce8",
    fontSize: 12,
    textColor: "#94a3b8",
  },
  default: {
    borderWidth: 2,
    fillColor: "#eff6ff",
    borderColor: "#3b82f6",
    fontSize: 12,
    textColor: "#3b82f6",
  },
  red: {
    borderWidth: 2,
    fillColor: "#fff1f2",
    borderColor: "#f43f5e",
    fontSize: 12,
    textColor: "#f43f5e",
  },
  amber: {
    borderWidth: 2,
    fillColor: "#fffbeb",
    borderColor: "#f59e0b",
    fontSize: 12,
    textColor: "#f59e0b",
  },
  emerald: {
    borderWidth: 2,
    fillColor: "#ecfdf5",
    borderColor: "#10b981",
    fontSize: 12,
    textColor: "#10b981",
  },
  sky: {
    borderWidth: 2,
    fillColor: "#f0f9ff",
    borderColor: "#0ea5e9",
    fontSize: 12,
    textColor: "#0ea5e9",
  },
  violet: {
    borderWidth: 2,
    fillColor: "#f5f3ff",
    borderColor: "#8b5cf6",
    fontSize: 12,
    textColor: "#8b5cf6",
  },
};

export const defaultMapData: MapData = {
  layout: {
    unitPx: { w: 40, h: 30 },
    mapSize: { minX: -3, maxX: 60, minY: -10, maxY: 50 },
    defaultBoothSize: { w: 1, h: 1 },
    highlightColor: "#3b82f6",
    zoom: { min: 0.6, max: 2.4, wheelStep: 0.1 },
    boothStyle: defaultBoothStyles,
  },
  booths: [],
};

// ---------------------------------------------------------------------------
// 工具函式
// ---------------------------------------------------------------------------

function clampToNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

const STYLE_KEYS: BoothStyleKey[] = [
  "disable",
  "default",
  "red",
  "amber",
  "emerald",
  "sky",
  "violet",
];

function normalizeStyle(
  style: unknown,
  fallback: BoothVisualStyle,
): BoothVisualStyle {
  const value = style as Partial<BoothVisualStyle> | undefined;
  return {
    borderWidth: clampToNumber(value?.borderWidth, fallback.borderWidth),
    fillColor:
      typeof value?.fillColor === "string" && value.fillColor.trim()
        ? value.fillColor
        : fallback.fillColor,
    borderColor:
      typeof value?.borderColor === "string" && value.borderColor.trim()
        ? value.borderColor
        : fallback.borderColor,
    fontSize: clampToNumber(value?.fontSize, fallback.fontSize),
    textColor:
      typeof value?.textColor === "string" && value.textColor.trim()
        ? value.textColor
        : fallback.textColor,
  };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function normalizeMapLayout(input: unknown): MapLayoutConfig {
  const layout = input as Partial<MapLayoutConfig> | undefined;

  const boothStyle = {} as Record<BoothStyleKey, BoothVisualStyle>;
  for (const key of STYLE_KEYS) {
    boothStyle[key] = normalizeStyle(
      (layout?.boothStyle as Record<string, unknown> | undefined)?.[key],
      defaultBoothStyles[key],
    );
  }

  return {
    unitPx: {
      w: clampToNumber(layout?.unitPx?.w, defaultMapData.layout.unitPx.w),
      h: clampToNumber(layout?.unitPx?.h, defaultMapData.layout.unitPx.h),
    },
    mapSize: {
      minX: clampToNumber(layout?.mapSize?.minX, defaultMapData.layout.mapSize.minX),
      maxX: clampToNumber(layout?.mapSize?.maxX, defaultMapData.layout.mapSize.maxX),
      minY: clampToNumber(layout?.mapSize?.minY, defaultMapData.layout.mapSize.minY),
      maxY: clampToNumber(layout?.mapSize?.maxY, defaultMapData.layout.mapSize.maxY),
    },
    defaultBoothSize: {
      w: clampToNumber(layout?.defaultBoothSize?.w, defaultMapData.layout.defaultBoothSize.w),
      h: clampToNumber(layout?.defaultBoothSize?.h, defaultMapData.layout.defaultBoothSize.h),
    },
    highlightColor:
      typeof layout?.highlightColor === "string" && layout.highlightColor.trim()
        ? layout.highlightColor
        : defaultMapData.layout.highlightColor,
    zoom: {
      min: clampToNumber(layout?.zoom?.min, defaultMapData.layout.zoom.min),
      max: clampToNumber(layout?.zoom?.max, defaultMapData.layout.zoom.max),
      wheelStep: clampToNumber(layout?.zoom?.wheelStep, defaultMapData.layout.zoom.wheelStep),
    },
    boothStyle,
  };
}

// ---------------------------------------------------------------------------
// Booths
// ---------------------------------------------------------------------------

function normalizeBooth(booth: Partial<MapBooth>, index: number): MapBooth {
  const normalized: MapBooth = {
    id: index + 1,
    boothId: typeof booth.boothId === "string" ? booth.boothId : "",
    position: {
      x: clampToNumber(booth.position?.x, 0),
      y: clampToNumber(booth.position?.y, 0),
    },
    facing:
      booth.facing === "up" ||
      booth.facing === "right" ||
      booth.facing === "down" ||
      booth.facing === "left"
        ? booth.facing
        : "up",
    disabled: Boolean(booth.disabled),
  };

  if (booth.size) {
    normalized.size = {
      w: clampToNumber(booth.size.w, defaultMapData.layout.defaultBoothSize.w),
      h: clampToNumber(booth.size.h, defaultMapData.layout.defaultBoothSize.h),
    };
  }

  if (booth.labelOffset) {
    normalized.labelOffset = {
      x: clampToNumber(booth.labelOffset.x, 0),
      y: clampToNumber(booth.labelOffset.y, 0),
    };
  }

  return normalized;
}

export function normalizeMapBooths(input: unknown): MapBooth[] {
  const booths = Array.isArray(input) ? input : [];
  return booths.map((booth, index) =>
    normalizeBooth(booth as Partial<MapBooth>, index),
  );
}

// ---------------------------------------------------------------------------
// Range format helpers
// ---------------------------------------------------------------------------

function parseBoothId(id: string): { prefix: string; num: number } {
  const match = id.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) throw new Error(`Invalid boothId format: ${id}`);
  return { prefix: match[1], num: parseInt(match[2]) };
}

export function expandRanges(input: RangeMapBooths): MapBooth[] {
  const booths: MapBooth[] = [];
  let idCounter = 1;

  for (const range of input.ranges) {
    const { prefix: fromPrefix, num: fromNum } = parseBoothId(range.from);
    const { prefix: toPrefix, num: toNum } = parseBoothId(range.to);

    if (fromPrefix !== toPrefix) {
      throw new Error(`Range prefix mismatch: ${range.from} vs ${range.to}`);
    }

    const step = toNum >= fromNum ? 1 : -1;
    const count = Math.abs(toNum - fromNum) + 1;

    for (let i = 0; i < count; i++) {
      const num = fromNum + step * i;
      const boothId = `${fromPrefix}${String(num).padStart(2, "0")}`;
      const override = input.overrides?.[boothId] ?? {};
      const position =
        range.axis === "y"
          ? { x: range.start.x, y: range.start.y + i }
          : { x: range.start.x + i, y: range.start.y };

      booths.push({
        id: idCounter++,
        boothId,
        position,
        facing: range.facing ?? "up",
        ...override,
      });
    }
  }

  return booths;
}

export function parseMapBooths(input: unknown): MapBooth[] {
  const parsed = input as Record<string, unknown>;
  const flatBooths = Array.isArray(parsed?.booths)
    ? normalizeMapBooths(parsed.booths)
    : [];

  if (Array.isArray(parsed?.ranges)) {
    const expanded = expandRanges(parsed as unknown as RangeMapBooths);
    return normalizeMapBooths([...expanded, ...flatBooths]);
  }

  if (flatBooths.length) return flatBooths;

  throw new Error("缺少 ranges 或 booths 欄位");
}

function parseNumericBoothId(id: string): { prefix: string; num: number } | null {
  const match = id.trim().match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return null;
  return { prefix: match[1], num: Number(match[2]) };
}

function isDefaultOverride(booth: MapBooth): boolean {
  return !booth.size && !booth.labelOffset && !booth.disabled;
}

export function serializeMapBooths(booths: MapBooth[]): {
  version: number;
  ranges: BoothRange[];
  overrides: BoothOverrides;
  booths?: Array<Omit<MapBooth, "id">>;
} {
  const ranges: BoothRange[] = [];
  const overrides: BoothOverrides = {};
  const flatBooths: Array<Omit<MapBooth, "id">> = [];

  for (const booth of booths) {
    const parsed = parseNumericBoothId(booth.boothId);
    if (!parsed) {
      const { id: _id, ...rest } = booth;
      flatBooths.push(rest);
      continue;
    }

    ranges.push({
      from: booth.boothId,
      to: booth.boothId,
      axis: "x",
      start: { x: booth.position.x, y: booth.position.y },
      facing: booth.facing,
    });

    if (!isDefaultOverride(booth)) {
      overrides[booth.boothId] = {
        size: booth.size,
        labelOffset: booth.labelOffset,
        disabled: booth.disabled,
      };
    }
  }

  const payload: ReturnType<typeof serializeMapBooths> = {
    version: 2,
    ranges,
    overrides,
  };
  if (flatBooths.length) payload.booths = flatBooths;
  return payload;
}

// ---------------------------------------------------------------------------
// MapData
// ---------------------------------------------------------------------------

export function normalizeMapData(input: unknown): MapData {
  const parsed = input as Partial<MapData> | undefined;
  return {
    layout: normalizeMapLayout(parsed?.layout),
    booths: normalizeMapBooths(parsed?.booths),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateMapLayout(layout: MapLayoutConfig): string | null {
  if (layout.mapSize.minX > layout.mapSize.maxX)
    return "mapSize minX cannot be greater than maxX";
  if (layout.mapSize.minY > layout.mapSize.maxY)
    return "mapSize minY cannot be greater than maxY";
  if (layout.unitPx.w <= 0 || layout.unitPx.h <= 0)
    return "unitPx must be > 0";
  if (layout.defaultBoothSize.w <= 0 || layout.defaultBoothSize.h <= 0)
    return "defaultBoothSize must be > 0";
  if (layout.zoom.min <= 0 || layout.zoom.max <= 0)
    return "zoom min/max must be > 0";
  if (layout.zoom.min > layout.zoom.max)
    return "zoom min cannot be greater than max";
  if (layout.zoom.wheelStep <= 0)
    return "zoom wheelStep must be > 0";

  for (const key of STYLE_KEYS) {
    const style = layout.boothStyle[key];
    if (style.borderWidth < 0) return `boothStyle[${key}] borderWidth must be >= 0`;
    if (style.fontSize <= 0) return `boothStyle[${key}] fontSize must be > 0`;
  }
  return null;
}

export function validateMapBooths(booths: MapBooth[]): string | null {
  const boothIds = new Set<string>();
  const validFacing = new Set(["up", "right", "down", "left"]);

  for (const booth of booths) {
    if (!booth.boothId.trim()) return "boothId is required";
    if (boothIds.has(booth.boothId)) return `duplicate boothId: ${booth.boothId}`;
    boothIds.add(booth.boothId);
    if (!validFacing.has(booth.facing)) return `invalid facing: ${booth.boothId}`;
  }
  return null;
}

export function validateMapData(data: MapData): string | null {
  return validateMapLayout(data.layout) ?? validateMapBooths(data.booths);
}

// ---------------------------------------------------------------------------
// Selected style 反色工具（供 View 使用）
// ---------------------------------------------------------------------------

/**
 * 將某個樣式的 fillColor / borderColor 互換，模擬「選中」外觀。
 * borderWidth 加粗一點以強調選中狀態。
 */
export function toSelectedStyle(style: BoothVisualStyle): BoothVisualStyle {
  return {
    ...style,
    borderWidth: style.borderWidth + 1,
    fillColor: style.borderColor,   // 原邊框色 → 填滿
    borderColor: style.fillColor,   // 原填滿色 → 外框
    textColor: style.fillColor,     // 文字跟著外框走，讓對比度足夠
  };
}