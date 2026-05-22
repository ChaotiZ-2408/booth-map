export interface PurchaseItem {
  authorName: string;
  itemName: string;
  price: number;
  enabled: boolean;
}

export interface ExchangeGift {
  authorName: string;
  itemName: string;
  enabled: boolean;
}

export type TagId =
  | "tagA"
  | "tagB"
  | "tagC"
  | "tagD"
  | "tagE";

export type TagIconName =
  | "tag-must-buy"
  | "tag-new-item"
  | "tag-limited"
  | "tag-bonus"
  | "tag-high-priority";

export type TagColorToken =
  | "rose-300"
  | "cyan-300"
  | "amber-300"
  | "violet-300"
  | "emerald-300";

export type TagChipColorToken =
  | "rose-400"
  | "cyan-400"
  | "amber-400"
  | "violet-400"
  | "emerald-400";

export interface TagDefinition {
  id: TagId;
  displayName: string;
  icon: TagIconName;
  color: TagColorToken;
  chipColor: TagChipColorToken;
}

export type CardHighlight =
  | "default"
  | "red"
  | "amber"
  | "emerald"
  | "sky"
  | "violet";

export interface BoothCard {
  id: number;
  boothId: string;
  enabled: boolean;
  authorNames: string[];
  purchaseItems: PurchaseItem[];
  exchangeGifts: ExchangeGift[];
  tags: TagId[];
  highlight: CardHighlight;
  priority: number;
  note: string;
}
