export type BoothFacing = "up" | "right" | "down" | "left";

export interface UnitSize {
  w: number;
  h: number;
}

export interface UnitPoint {
  x: number;
  y: number;
}

/** 對應 CardHighlight + disable 狀態的攤位樣式鍵 */
export type BoothStyleKey =
  | "disable"   // 沒有對應卡片
  | "default"   // 有卡片，highlight === "default"
  | "red"
  | "amber"
  | "emerald"
  | "sky"
  | "violet";

export interface BoothVisualStyle {
  borderWidth: number;
  fillColor: string;
  borderColor: string;
  fontSize: number;
  textColor: string;
}

/**
 * selected 不再是獨立的樣式設定，
 * 而是執行時將對應樣式的 fillColor / borderColor 互換產生。
 */
export interface MapLayoutConfig {
  unitPx: UnitSize;
  mapSize: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  defaultBoothSize: UnitSize;
  highlightColor: string;
  zoom: {
    min: number;
    max: number;
    wheelStep: number;
  };
  boothStyle: Record<BoothStyleKey, BoothVisualStyle>;
}

export interface MapBooth {
  id: number;
  boothId: string;
  position: UnitPoint;
  facing: BoothFacing;
  size?: UnitSize;
  labelOffset?: UnitPoint;
  disabled?: boolean;
}

export interface MapData {
  layout: MapLayoutConfig;
  booths: MapBooth[];
}

// --- Range-based booth storage format ---

export interface BoothRange {
  from: string;
  to: string;
  axis: "x" | "y";
  start: { x: number; y: number };
  facing?: BoothFacing;
}

export type BoothOverrides = Record<
  string,
  Partial<Omit<MapBooth, "id" | "boothId" | "position">>
>;

export interface RangeMapBooths {
  version: number;
  ranges: BoothRange[];
  overrides?: BoothOverrides;
}