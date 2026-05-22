import type { CardHighlight } from "@/types/card";

export interface HighlightOption {
  id: CardHighlight;
  label: string;
  dotClass: string;
  cardClass: string;
}

export const DEFAULT_HIGHLIGHT: CardHighlight = "default";

export const CARD_HIGHLIGHTS: HighlightOption[] = [
  { id: "default", label: "一般", dotClass: "highlight-dot-default", cardClass: "card-highlight-default" },
  { id: "red", label: "紅", dotClass: "highlight-dot-red", cardClass: "card-highlight-red" },
  { id: "amber", label: "黃", dotClass: "highlight-dot-amber", cardClass: "card-highlight-amber" },
  { id: "emerald", label: "綠", dotClass: "highlight-dot-emerald", cardClass: "card-highlight-emerald" },
  { id: "sky", label: "藍", dotClass: "highlight-dot-sky", cardClass: "card-highlight-sky" },
  { id: "violet", label: "紫", dotClass: "highlight-dot-violet", cardClass: "card-highlight-violet" },
];

export const CARD_HIGHLIGHT_MAP: Record<CardHighlight, HighlightOption> = CARD_HIGHLIGHTS.reduce(
  (acc, option) => {
    acc[option.id] = option;
    return acc;
  },
  {} as Record<CardHighlight, HighlightOption>
);

export function isCardHighlight(value: unknown): value is CardHighlight {
  return typeof value === "string" && CARD_HIGHLIGHTS.some((option) => option.id === value);
}
