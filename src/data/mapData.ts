import type {
  BoothRange,
  BoothOverrides,
  MapBooth,
  MapData,
  MapLayoutConfig,
  RangeMapBooths,
} from "@/types/map";

export const defaultMapData: MapData = {
  layout: {
    unitPx: { w: 40, h: 40 },
    mapPadding: { left: 2, right: 2, bottom: 6, top: 2 },
    defaultBoothSize: { w: 1, h: 1 },
    zoom: { min: 0.1, max: 2, wheelStep: 0.1 },
  },
  booths: [],
};

function clampToNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

// function normalizeStyle(
//   style: unknown,
//   fallback: MapLayoutConfig["boothStyle"]["normal"],
// ): MapLayoutConfig["boothStyle"]["normal"] {
//   const value = style as
//     | Partial<MapLayoutConfig["boothStyle"]["normal"]>
//     | undefined;
//   return {
//     borderWidth: clampToNumber(value?.borderWidth, fallback.borderWidth),
//     fillColor:
//       typeof value?.fillColor === "string" && value.fillColor.trim()
//         ? value.fillColor
//         : fallback.fillColor,
//     borderColor:
//       typeof value?.borderColor === "string" && value.borderColor.trim()
//         ? value.borderColor
//         : fallback.borderColor,
//     fontSize: clampToNumber(value?.fontSize, fallback.fontSize),
//     textColor:
//       typeof value?.textColor === "string" && value.textColor.trim()
//         ? value.textColor
//         : fallback.textColor,
//   };
// }

export function normalizeMapLayout(input: unknown): MapLayoutConfig {
  const layout = input as Partial<MapLayoutConfig> | undefined;

  return {
    unitPx: {
      w: clampToNumber(layout?.unitPx?.w, defaultMapData.layout.unitPx.w),
      h: clampToNumber(layout?.unitPx?.h, defaultMapData.layout.unitPx.h),
    },
    mapPadding: {
      left: clampToNumber(
        layout?.mapPadding?.left,
        defaultMapData.layout.mapPadding.left,
      ),
      right: clampToNumber(
        layout?.mapPadding?.right,
        defaultMapData.layout.mapPadding.right,
      ),
      bottom: clampToNumber(
        layout?.mapPadding?.bottom,
        defaultMapData.layout.mapPadding.bottom,
      ),
      top: clampToNumber(
        layout?.mapPadding?.top,
        defaultMapData.layout.mapPadding.top,
      ),
    },
    defaultBoothSize: {
      w: clampToNumber(
        layout?.defaultBoothSize?.w,
        defaultMapData.layout.defaultBoothSize.w,
      ),
      h: clampToNumber(
        layout?.defaultBoothSize?.h,
        defaultMapData.layout.defaultBoothSize.h,
      ),
    },
    zoom: {
      min: clampToNumber(layout?.zoom?.min, defaultMapData.layout.zoom.min),
      max: clampToNumber(layout?.zoom?.max, defaultMapData.layout.zoom.max),
      wheelStep: clampToNumber(
        layout?.zoom?.wheelStep,
        defaultMapData.layout.zoom.wheelStep,
      ),
    },
  };
}

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

// --- Range format helpers ---

type NumberedBoothId = { prefix: string; num: number; numWidth: number };

function parseNumberedBoothId(id: string): NumberedBoothId | null {
  const match = id.trim().match(/^(.+?)(\d+)$/);
  if (!match) return null;
  return { prefix: match[1], num: Number(match[2]), numWidth: match[2].length };
}

function parseBoothId(id: string): NumberedBoothId {
  const parsed = parseNumberedBoothId(id);
  if (!parsed) throw new Error(`Invalid boothId format: ${id}`);
  return parsed;
}

function parseNumericBoothId(
  id: string,
): { prefix: string; num: number } | null {
  const parsed = parseNumberedBoothId(id);
  if (!parsed) return null;
  return { prefix: parsed.prefix, num: parsed.num };
}

export function expandRanges(input: RangeMapBooths): MapBooth[] {
  const booths: MapBooth[] = [];
  let idCounter = 1;

  for (const range of input.ranges) {
    const from = parseBoothId(range.from);
    const to = parseBoothId(range.to);

    if (from.prefix !== to.prefix) {
      throw new Error(`Range prefix mismatch: ${range.from} vs ${range.to}`);
    }

    const step = to.num >= from.num ? 1 : -1;
    const count = Math.abs(to.num - from.num) + 1;
    const numWidth = Math.max(from.numWidth, to.numWidth);

    for (let i = 0; i < count; i++) {
      const num = from.num + step * i;
      const boothId = `${from.prefix}${String(num).padStart(numWidth, "0")}`;
      const override = input.overrides?.[boothId] ?? {};

      // axis controls the direction from the start coordinate.
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

/**
 * Supports range format, flat booths format, or both merged together.
 */
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

function isDefaultOverride(booth: MapBooth): boolean {
  return !booth.size && !booth.labelOffset && !booth.disabled;
}

export function serializeMapBooths(
  booths: MapBooth[],
  eventName = "",
): {
  version: number;
  eventName: string;
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

    // Export numeric booths as single-booth ranges.
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
    eventName,
    ranges,
    overrides,
  };
  if (flatBooths.length) payload.booths = flatBooths;
  return payload;
}

export function normalizeMapData(input: unknown): MapData {
  const parsed = input as Partial<MapData> | undefined;
  return {
    layout: normalizeMapLayout(parsed?.layout),
    booths: normalizeMapBooths(parsed?.booths),
  };
}

export function validateMapLayout(layout: MapLayoutConfig): string | null {
  if (layout.unitPx.w <= 0 || layout.unitPx.h <= 0) return "unitPx must be > 0";

  const paddingValues = Object.values(layout.mapPadding);
  if (paddingValues.some((value) => !Number.isFinite(value) || value < 0))
    return "mapPadding must be >= 0";

  if (layout.defaultBoothSize.w <= 0 || layout.defaultBoothSize.h <= 0)
    return "defaultBoothSize must be > 0";

  if (layout.zoom.min <= 0 || layout.zoom.max <= 0)
    return "zoom min/max must be > 0";

  if (layout.zoom.min > layout.zoom.max)
    return "zoom min cannot be greater than max";

  if (layout.zoom.wheelStep <= 0) return "zoom wheelStep must be > 0";

  return null;
}

export function validateMapBooths(booths: MapBooth[]): string | null {
  const boothIds = new Set<string>();
  const validFacing = new Set(["up", "right", "down", "left"]);

  for (const booth of booths) {
    if (!booth.boothId.trim()) return "boothId is required";
    if (boothIds.has(booth.boothId))
      return `duplicate boothId: ${booth.boothId}`;
    boothIds.add(booth.boothId);
    if (!validFacing.has(booth.facing))
      return `invalid facing: ${booth.boothId}`;
  }
  return null;
}

export function validateMapData(data: MapData): string | null {
  return validateMapLayout(data.layout) ?? validateMapBooths(data.booths);
}
