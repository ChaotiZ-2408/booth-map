import { defineStore } from "pinia";
import { defaultCards } from "@/data/cardData";
import { DEFAULT_HIGHLIGHT, isCardHighlight } from "@/data/cardHighlights";
import { isTagId } from "@/data/cardTags";
import type { BoothCard, BoothId } from "@/types/card";

const STORAGE_KEY = "booth-map-cards";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function loadCards(): BoothCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return normalizeCards(clone(defaultCards));
    }

    return normalizeCards(JSON.parse(raw) as BoothCard[]);
  } catch {
    return normalizeCards(clone(defaultCards));
  }
}

function normalizeCards(cards: BoothCard[]): BoothCard[] {
  return cards.filter(Boolean).map((card, index) => ({
    id: card.id ?? index + 1,
    boothId: card.boothId ?? "",
    enabled: card.enabled ?? true,
    authorNames: card.authorNames ?? [],
    purchaseItems: (card.purchaseItems ?? []).map((item) => ({
      authorName: item.authorName ?? "",
      itemName: item.itemName ?? "",
      price: item.price ?? 0,
      enabled: item.enabled ?? true,
    })),
    exchangeGifts: (card.exchangeGifts ?? []).map((gift) => ({
      authorName: gift.authorName ?? "",
      itemName: gift.itemName ?? "",
      enabled: gift.enabled ?? true,
    })),
    tags: (card.tags ?? []).filter(isTagId),
    highlight: isCardHighlight(card.highlight) ? card.highlight : DEFAULT_HIGHLIGHT,
    priority: card.priority ?? index + 1,
    note: card.note ?? "",
  }));
}

export const useCardStore = defineStore("cardStore", {
  state: () => ({
    cards: loadCards() as BoothCard[],
    selectedBoothId: null as BoothId | null,
  }),

  getters: {
    selectedCard(state): BoothCard | null {
      return (
        state.cards.find((card) => card.boothId === state.selectedBoothId) ??
        state.cards[0] ??
        null
      );
    },

    routeBoothIds(state): BoothId[] {
      return state.cards
        .slice()
        .sort((a, b) => a.priority - b.priority)
        .map((card) => card.boothId);
    },
  },

  actions: {
    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cards));
    },

    selectBooth(boothId: BoothId) {
      this.selectedBoothId = boothId;
    },

    updateCard(boothId: BoothId, patch: Partial<BoothCard>) {
      const card = this.cards.find((card) => card.boothId === boothId);
      if (!card) return;

      Object.assign(card, patch);
      this.save();
    },

    addCard() {
      const nextNumber = this.cards.length + 1;

      const card: BoothCard = {
        id: this.cards.length ? Math.max(...this.cards.map((item) => item.id)) + 1 : 1,
        boothId: `M${String(nextNumber).padStart(2, "0")}`,
        enabled: true,
        priority: nextNumber,
        authorNames: [],
        purchaseItems: [],
        exchangeGifts: [],
        tags: [],
        highlight: DEFAULT_HIGHLIGHT,
        note: "",
      };

      this.cards.push(card);
      this.selectedBoothId = card.boothId;
      this.save();
    },

    removeCard(id: number) {
      this.cards = this.cards.filter((card) => card.id !== id);

      this.save();
    },

    resetCards() {
      this.cards = normalizeCards(clone(defaultCards));
      this.selectedBoothId = this.cards[0]?.boothId ?? null;
      this.save();
    },

    setCards(cards: BoothCard[]) {
      this.cards = normalizeCards(cards).map((card, index) => ({
        ...card,
        priority: index + 1,
      }));

      this.save();
    },
  },
});
