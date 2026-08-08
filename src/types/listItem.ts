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

export type TagId = "tagA" | "tagB" | "tagC" | "tagD" | "tagE";

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

export type ListItemStyle = "default" | "red" | "amber" | "sky" | "violet";

export type BoothId = string;

export interface ListItem {
  id: number;
  boothId: BoothId;
  enabled: boolean;
  authorNames: string[];
  purchaseItems: PurchaseItem[];
  exchangeGifts: ExchangeGift[];
  tags: TagId[];
  style: ListItemStyle;
  priority: number;
  note: string;
}
