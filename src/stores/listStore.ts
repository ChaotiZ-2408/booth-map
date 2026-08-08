import { defineStore } from "pinia";
import { defaultListItems } from "@/data/listItemData";
import { DEFAULT_LIST_ITEM_STYLE, isListItemStyle } from "@/data/listItemStyles";
import { isTagId } from "@/data/listItemTags";
import type { BoothId, ListItem } from "@/types/listItem";

const STORAGE_KEY = "booth-map-list-items";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function loadListItems(): ListItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return normalizeListItems(clone(defaultListItems));
    }

    return normalizeListItems(JSON.parse(raw) as ListItem[]);
  } catch {
    return normalizeListItems(clone(defaultListItems));
  }
}

function normalizeListItems(listItems: ListItem[]): ListItem[] {
  return listItems.filter(Boolean).map((listItem, index) => ({
    id: listItem.id ?? index + 1,
    boothId: listItem.boothId ?? "",
    enabled: listItem.enabled ?? true,
    authorNames: listItem.authorNames ?? [],
    purchaseItems: (listItem.purchaseItems ?? []).map((item) => ({
      authorName: item.authorName ?? "",
      itemName: item.itemName ?? "",
      price: item.price ?? 0,
      enabled: item.enabled ?? true,
    })),
    exchangeGifts: (listItem.exchangeGifts ?? []).map((gift) => ({
      authorName: gift.authorName ?? "",
      itemName: gift.itemName ?? "",
      enabled: gift.enabled ?? true,
    })),
    tags: (listItem.tags ?? []).filter(isTagId),
    style: isListItemStyle(listItem.style) ? listItem.style : DEFAULT_LIST_ITEM_STYLE,
    priority: listItem.priority ?? index + 1,
    note: listItem.note ?? "",
  }));
}

export const useListStore = defineStore("listStore", {
  state: () => ({
    listItems: loadListItems() as ListItem[],
    selectedBoothId: null as BoothId | null,
  }),

  getters: {
    selectedListItem(state): ListItem | null {
      return (
        state.listItems.find((listItem) => listItem.boothId === state.selectedBoothId) ??
        state.listItems[0] ??
        null
      );
    },

    routeBoothIds(state): BoothId[] {
      return state.listItems
        .slice()
        .sort((a, b) => a.priority - b.priority)
        .map((listItem) => listItem.boothId);
    },
  },

  actions: {
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.listItems));
    },

    selectBooth(boothId: BoothId) {
      this.selectedBoothId = boothId;
    },

    updateListItem(boothId: BoothId, patch: Partial<ListItem>) {
      const listItem = this.listItems.find((listItem) => listItem.boothId === boothId);
      if (!listItem) return;

      Object.assign(listItem, patch);
      this.save();
    },

    addListItem() {
      const nextNumber = this.listItems.length + 1;

      const listItem: ListItem = {
        id: this.listItems.length ? Math.max(...this.listItems.map((item) => item.id)) + 1 : 1,
        boothId: `M${String(nextNumber).padStart(2, "0")}`,
        enabled: true,
        priority: nextNumber,
        authorNames: [],
        purchaseItems: [],
        exchangeGifts: [],
        tags: [],
        style: DEFAULT_LIST_ITEM_STYLE,
        note: "",
      };

      this.listItems.push(listItem);
      this.selectedBoothId = listItem.boothId;
      this.save();
    },

    removeListItem(id: number) {
      this.listItems = this.listItems.filter((listItem) => listItem.id !== id);

      this.save();
    },

    resetListItems() {
      this.listItems = normalizeListItems(clone(defaultListItems));
      this.selectedBoothId = this.listItems[0]?.boothId ?? null;
      this.save();
    },

    setListItems(listItems: ListItem[]) {
      this.listItems = normalizeListItems(listItems).map((listItem, index) => ({
        ...listItem,
        priority: index + 1,
      }));

      this.save();
    },
  },
});
