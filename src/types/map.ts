export type BoothFacing = "up" | "right" | "down" | "left";

export interface UnitSize {
  w: number;
  h: number;
}

export interface UnitPoint {
  x: number;
  y: number;
}

export interface MapLayoutConfig {
  unitPx: UnitSize;
  mapPadding: {
    left: number;
    right: number;
    bottom: number;
    top: number;
  };
  defaultBoothSize: UnitSize;
  zoom: {
    min: number;
    max: number;
    wheelStep: number;
  };
  boothStyle: {
    normal: BoothVisualStyle;
    clickable: BoothVisualStyle;
    selected: BoothVisualStyle;
  };
}

export interface BoothVisualStyle {
  borderWidth: number;
  fillColor: string;
  borderColor: string;
  fontSize: number;
  textColor: string;
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
  axis: "x" | "y"; // 延伸方向
  start: { x: number; y: number }; // 起點座標
  facing?: BoothFacing;
}

export type BoothOverrides = Record<
  string,
  Partial<Omit<MapBooth, "id" | "boothId" | "position">>
>;

export interface RangeMapBooths {
  version: number;
  eventName?: string;
  ranges: BoothRange[];
  overrides?: BoothOverrides;
}
