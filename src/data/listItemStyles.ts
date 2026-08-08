import type { ListItemStyle } from "@/types/listItem";

export interface ListItemStyleOption {
  id: ListItemStyle;
  label: string;
  dotClass: string;
  listItemClass: string;
}

export interface ListItemStyleColors {
  fill: string;
  accent: string;
}

export interface MapBoothVisualStyle {
  fillColor: string;
  borderColor: string;
  textColor: string;
  borderWidth: number;
  fontSize: number;
}

export const DEFAULT_LIST_ITEM_STYLE: ListItemStyle = "default";

export const LIST_ITEM_STYLES: ListItemStyleOption[] = [
  {
    id: "default",
    label: "一般",
    dotClass: "style-dot-default",
    listItemClass: "list-item-style-default",
  },
  {
    id: "red",
    label: "紅",
    dotClass: "style-dot-red",
    listItemClass: "list-item-style-red",
  },
  {
    id: "amber",
    label: "黃",
    dotClass: "style-dot-amber",
    listItemClass: "list-item-style-amber",
  },
  {
    id: "sky",
    label: "藍",
    dotClass: "style-dot-sky",
    listItemClass: "list-item-style-sky",
  },
  {
    id: "violet",
    label: "紫",
    dotClass: "style-dot-violet",
    listItemClass: "list-item-style-violet",
  },
];

export const LIST_ITEM_STYLE_MAP: Record<ListItemStyle, ListItemStyleOption> =
  LIST_ITEM_STYLES.reduce(
    (acc, option) => {
      acc[option.id] = option;
      return acc;
    },
    {} as Record<ListItemStyle, ListItemStyleOption>,
  );

export const LIST_ITEM_STYLE_COLORS: Record<
  ListItemStyle,
  ListItemStyleColors
> = {
  default: {
    fill: "#f4f4f2",
    accent: "#789674",
  },
  red: {
    fill: "#fee2e2",
    accent: "#ef4444",
  },
  amber: {
    fill: "#fef3c7",
    accent: "#f59e0b",
  },
  sky: {
    fill: "#dbeafe",
    accent: "#3b82f6",
  },
  violet: {
    fill: "#ede9fe",
    accent: "#8b5cf6",
  },
};

const MAP_BOOTH_BORDER_WIDTH = 2;
const MAP_BOOTH_FONT_SIZE = 12;

export const NON_CLICKABLE_MAP_BOOTH_STYLE: MapBoothVisualStyle = {
  fillColor: "#d1d6de",
  borderColor: "#d1d6de",
  textColor: "#ffffff",
  borderWidth: MAP_BOOTH_BORDER_WIDTH,
  fontSize: MAP_BOOTH_FONT_SIZE,
};

export function getMapBoothStyle(
  style: ListItemStyle,
  selected = false,
): MapBoothVisualStyle {
  const { fill, accent } = LIST_ITEM_STYLE_COLORS[style];

  return {
    fillColor: selected ? accent : fill,
    borderColor: selected ? fill : accent,
    textColor: selected ? fill : accent,
    borderWidth: MAP_BOOTH_BORDER_WIDTH,
    fontSize: MAP_BOOTH_FONT_SIZE,
  };
}

export function isListItemStyle(value: unknown): value is ListItemStyle {
  return (
    typeof value === "string" &&
    LIST_ITEM_STYLES.some((option) => option.id === value)
  );
}