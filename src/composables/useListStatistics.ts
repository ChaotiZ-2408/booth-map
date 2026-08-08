import { computed, toValue, type MaybeRefOrGetter } from "vue";
import type { ListItem } from "@/types/listItem";

export function useListStatistics(
  listItemsSource: MaybeRefOrGetter<ListItem[]>,
) {
  const listItems = computed(() => toValue(listItemsSource) ?? []);

  function getBoothTotalPrice(listItem: ListItem): number {
    return listItem.purchaseItems.reduce(
      (total, item) => total + (item.enabled ? Number(item.price) || 0 : 0),
      0,
    );
  }

  function getBoothGiftPeopleCount(listItem: ListItem): number {
    const authors = new Set();
    let emptyAuthorCount = 0;

    for (const gift of listItem.exchangeGifts) {
      if (!gift.enabled) continue;

      const authorName = gift.authorName?.trim();

      if (!authorName) {
        emptyAuthorCount++;
        continue;
      }

      authors.add(authorName);
    }

    return authors.size + emptyAuthorCount;
  }

  const totalPrice = computed(() =>
    listItems.value.reduce(
      (total, listItem) => total + getBoothTotalPrice(listItem),
      0,
    ),
  );

  const totalGiftPeopleCount = computed(() => {
    const authors = new Set();
    let emptyAuthorCount = 0;

    for (const listItem of listItems.value) {
      for (const gift of listItem.exchangeGifts) {
        if (!gift.enabled) continue;

        const authorName = gift.authorName?.trim();

        if (!authorName) {
          emptyAuthorCount++;
          continue;
        }

        authors.add(authorName);
      }
    }

    return authors.size + emptyAuthorCount;
  });

  const visitedBoothCount = computed(
    () => listItems.value.filter((listItem) => !listItem.enabled).length,
  );

  const unvisitedBoothCount = computed(
    () => listItems.value.filter((listItem) => listItem.enabled).length,
  );

  const totalBoothCount = computed(() => listItems.value.length);

  const activeTotalPrice = computed(() =>
    listItems.value.reduce(
      (total, listItem) =>
        total + (listItem.enabled ? getBoothTotalPrice(listItem) : 0),
      0,
    ),
  );

  const activeTotalGiftPeopleCount = computed(() => {
    const authors = new Set();
    let emptyAuthorCount = 0;

    for (const listItem of listItems.value) {
      if (!listItem.enabled) continue;

      for (const gift of listItem.exchangeGifts) {
        if (!gift.enabled) continue;

        const authorName = gift.authorName?.trim();

        if (!authorName) {
          emptyAuthorCount++;
          continue;
        }

        authors.add(authorName);
      }
    }

    return authors.size + emptyAuthorCount;
  });

  return {
    getBoothTotalPrice,
    getBoothGiftPeopleCount,

    totalPrice,
    activeTotalPrice,

    totalGiftPeopleCount,
    activeTotalGiftPeopleCount,

    visitedBoothCount,
    unvisitedBoothCount,
    totalBoothCount,
  };
}
