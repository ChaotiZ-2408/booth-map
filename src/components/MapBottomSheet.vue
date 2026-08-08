<script setup lang="ts">
import { computed, ref } from "vue";
import type { ListItem, ListItemStyle } from "@/types/listItem";
import {
  LIST_ITEM_TAG_MAP,
  getTagBadgeToneClass,
  getTagChipToneClass,
} from "@/data/listItemTags";
import AppIcon from "@/components/icons/AppIcon.vue";
import { useListStatistics } from "@/composables/useListStatistics";

const props = defineProps<{
  listItems: ListItem[];
  activeIndex: number;
}>();

const { getBoothTotalPrice, getBoothGiftPeopleCount } = useListStatistics(
  () => props.listItems,
);

const emit = defineEmits<{
  (event: "update:activeIndex", index: number): void;
}>();

// Mirrors STYLE_BAR_CLASS_MAP / STYLE_BOOTH_CLASS_MAP in ListItem.vue so the
// map preview card uses the exact same per-style colors as the editor.
const STYLE_BAR_CLASS_MAP: Record<ListItemStyle, string> = {
  default: "bg-editor-primary-soft",
  red: "bg-[#fedadd]",
  amber: "bg-amber-200",
  sky: "bg-[#d4e5f3]",
  violet: "bg-violet-200",
};

const STYLE_BOOTH_CLASS_MAP: Record<ListItemStyle, string> = {
  default: "bg-editor-accent/30 text-editor-primary",
  red: "bg-[#fedadd]/45 text-[#775c5e]",
  amber: "bg-amber-100 text-amber-700",
  sky: "bg-[#d4e5f3]/55 text-[#667783]",
  violet: "bg-violet-100 text-violet-700",
};

const isExpanded = ref(false);
const swipeStartX = ref<number | null>(null);
const swipeStartY = ref<number | null>(null);
const didSwipe = ref(false);

const activePositionLabel = computed(() => {
  const total = props.listItems.length;
  const width = Math.max(2, String(total).length);
  return `${String(props.activeIndex + 1).padStart(width, "0")}/${String(total).padStart(width, "0")}`;
});

function getTagLabel(tagId: string) {
  return (
    LIST_ITEM_TAG_MAP[tagId as keyof typeof LIST_ITEM_TAG_MAP]?.displayName ??
    tagId
  );
}

function getTagConfig(tagId: string) {
  return LIST_ITEM_TAG_MAP[tagId as keyof typeof LIST_ITEM_TAG_MAP];
}

function getBarClass(style: ListItemStyle) {
  return STYLE_BAR_CLASS_MAP[style] ?? STYLE_BAR_CLASS_MAP.default;
}

function getBoothAccentClass(style: ListItemStyle) {
  return STYLE_BOOTH_CLASS_MAP[style] ?? STYLE_BOOTH_CLASS_MAP.default;
}

// NOTE: I don't have ListItem.vue's actual getAuthorSummary() implementation,
// so this is a best-effort equivalent (first two names, then "等N人"). Swap
// this out if the real logic differs.
function getAuthorSummary(listItem: ListItem) {
  const names = listItem.authorNames.filter(Boolean);
  if (!names.length) return "尚無作者";
  return names.join(" | ");
}

function toggleEnabled(listItem: ListItem) {
  listItem.enabled = !listItem.enabled;
}

function nextListItem() {
  if (!props.listItems.length) return;
  emit("update:activeIndex", (props.activeIndex + 1) % props.listItems.length);
}

function prevListItem() {
  if (!props.listItems.length) return;
  emit(
    "update:activeIndex",
    (props.activeIndex - 1 + props.listItems.length) % props.listItems.length,
  );
}

function goToListItem(index: number) {
  emit("update:activeIndex", index);
}

function onListItemClick(index: number) {
  if (didSwipe.value) {
    didSwipe.value = false;
    return;
  }
  goToListItem(index);
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value;
}

function onHeaderClick(index: number) {
  if (didSwipe.value) {
    didSwipe.value = false;
    return;
  }

  if (index !== props.activeIndex) {
    goToListItem(index);
    isExpanded.value = true;
    return;
  }

  toggleExpanded();
}

function onListItemTouchStart(event: TouchEvent) {
  swipeStartX.value = event.touches[0]?.clientX ?? null;
  swipeStartY.value = event.touches[0]?.clientY ?? null;
}

function onListItemTouchEnd(event: TouchEvent) {
  if (swipeStartX.value === null || swipeStartY.value === null) return;
  const endX = event.changedTouches[0]?.clientX ?? swipeStartX.value;
  const endY = event.changedTouches[0]?.clientY ?? swipeStartY.value;
  const deltaX = endX - swipeStartX.value;
  const deltaY = endY - swipeStartY.value;
  if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
    didSwipe.value = true;
    window.setTimeout(() => {
      didSwipe.value = false;
    }, 350);

    if (deltaX < 0) nextListItem();
    else prevListItem();
  }
  swipeStartX.value = null;
  swipeStartY.value = null;
}
</script>

<template>
  <aside class="map-bottom-sheet" :class="{ 'is-expanded': isExpanded }">
    <button
      class="map-sheet-handle"
      type="button"
      :aria-expanded="isExpanded"
      :aria-label="isExpanded ? '收合預覽' : '展開預覽'"
      @click="toggleExpanded"
    >
      <span class="map-handle-bar" />
    </button>

    <div v-if="listItems.length" class="map-list-item-track">
      <article
        v-for="(listItem, index) in listItems"
        :key="listItem.id"
        class="map-list-item-card"
        :class="{ active: index === activeIndex }"
        @click="onListItemClick(index)"
        @touchstart="onListItemTouchStart"
        @touchend="onListItemTouchEnd"
      >
        <span
          class="map-list-item-style-bar"
          :class="getBarClass(listItem.style)"
        />

        <div
          class="map-list-item-header"
          role="button"
          tabindex="0"
          :aria-expanded="isExpanded && index === activeIndex"
          :style="!listItem.enabled ? { opacity: 0.3 } : undefined"
          @click.stop="onHeaderClick(index)"
          @keydown.enter.stop.prevent="onHeaderClick(index)"
          @keydown.space.stop.prevent="onHeaderClick(index)"
        >
          <div
            class="map-booth-code"
            :class="getBoothAccentClass(listItem.style)"
          >
            {{ listItem.boothId || "—" }}
          </div>

          <div class="map-list-item-header-content">
            <div class="map-list-item-top-row">
              <p class="map-author-summary">
                {{ getAuthorSummary(listItem) }}
              </p>
              <span class="map-total-price">
                ${{ getBoothTotalPrice(listItem) }}
              </span>
            </div>

            <div class="map-list-item-bottom-row">
              <div class="map-list-item-meta-icons">
                <AppIcon
                  v-for="tagId in listItem.tags"
                  :key="tagId"
                  :name="getTagConfig(tagId)?.icon ?? 'tag-bonus'"
                  class="h-3.5 w-3.5"
                  :class="
                    getTagConfig(tagId)
                      ? getTagBadgeToneClass(getTagConfig(tagId)!)
                      : ''
                  "
                />
                <AppIcon
                  v-if="listItem.note.trim()"
                  name="note-solid"
                  class="h-3.5 w-3.5 text-[#73575a]"
                />
              </div>

              <span
                v-if="getBoothGiftPeopleCount(listItem)"
                class="map-gift-count-content"
              >
                <AppIcon name="gift-solid" class="h-3.5 w-3.5 text-[#e1bec1]" />
                <span>{{ getBoothGiftPeopleCount(listItem) }}</span>
              </span>
            </div>
          </div>
        </div>

        <div
          v-if="isExpanded && index === activeIndex"
          class="map-list-item-content"
        >
          <section class="map-list-item-section">
            <h3 class="map-section-label">
              <AppIcon name="map-pin" class="h-3.5 w-3.5" />
              BOOTH
            </h3>
            <div class="map-section-body">
              <div class="map-view-row">
                <span>{{ listItem.boothId || "尚未設定攤位" }}</span>
                <span
                  v-if="!listItem.enabled"
                  class="map-status-chip map-status-off"
                >
                  已逛過
                </span>
              </div>
            </div>
          </section>

          <section class="map-list-item-section">
            <h3 class="map-section-label">
              <AppIcon name="user-group" class="h-3.5 w-3.5" />
              AUTHORS
            </h3>
            <div class="map-section-body">
              <div class="map-author-tag-row">
                <span
                  v-for="author in listItem.authorNames.filter(Boolean)"
                  :key="author"
                  class="map-author-badge"
                  :class="getBoothAccentClass(listItem.style)"
                >
                  {{ author }}
                </span>
                <span
                  v-if="!listItem.authorNames.filter(Boolean).length"
                  class="map-empty-text"
                  >尚無作者</span
                >
              </div>
            </div>
          </section>

          <section
            v-if="listItem.purchaseItems.length"
            class="map-list-item-section"
          >
            <h3 class="map-section-label">
              <AppIcon name="shopping-bag" class="h-3.5 w-3.5" />
              PURCHASE
            </h3>
            <div class="map-section-body">
              <div class="map-plain-row-list">
                <div
                  v-for="(item, idx) in listItem.purchaseItems"
                  :key="idx"
                  class="map-plain-row-item"
                  :class="{ 'map-row-disabled': !item.enabled }"
                >
                  <span class="map-item-main-text">
                    <span class="map-item-author-text">{{
                      item.authorName
                    }}</span>
                    <span class="map-item-separator">/</span>
                    <span>{{ item.itemName }}</span>
                  </span>
                  <span class="map-row-end">
                    <span class="map-item-price-text"
                      >${{ Number(item.price) || 0 }}</span
                    >
                    <input
                      v-model="item.enabled"
                      type="checkbox"
                      class="map-row-checkbox"
                      @click.stop
                    />
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section
            v-if="listItem.exchangeGifts.length"
            class="map-list-item-section"
          >
            <h3 class="map-section-label">
              <AppIcon name="gift-solid" class="h-3.5 w-3.5" />
              MEETING GIFT
            </h3>
            <div class="map-section-body">
              <div class="map-plain-row-list">
                <div
                  v-for="(gift, idx) in listItem.exchangeGifts"
                  :key="idx"
                  class="map-plain-row-item"
                  :class="{ 'map-row-disabled': !gift.enabled }"
                >
                  <span class="map-item-main-text">
                    <span class="map-item-author-text">{{
                      gift.authorName
                    }}</span>
                    <span class="map-item-separator">/</span>
                    <span>{{ gift.itemName }}</span>
                  </span>
                  <input
                    v-model="gift.enabled"
                    type="checkbox"
                    class="map-row-checkbox"
                    @click.stop
                  />
                </div>
              </div>
            </div>
          </section>

          <section v-if="listItem.tags.length" class="map-list-item-section">
            <h3 class="map-section-label">
              <AppIcon name="tag-bonus" class="h-3.5 w-3.5" />
              TAGS
            </h3>
            <div class="map-section-body">
              <div class="map-tag-chip-list">
                <div
                  v-for="tagId in listItem.tags"
                  :key="tagId"
                  class="map-tag-chip"
                  :class="
                    getTagConfig(tagId)
                      ? getTagChipToneClass(getTagConfig(tagId)!)
                      : ''
                  "
                >
                  <AppIcon
                    :name="getTagConfig(tagId)?.icon ?? 'tag-bonus'"
                    class="h-4 w-4"
                  />
                  <span>{{ getTagLabel(tagId) }}</span>
                </div>
              </div>
            </div>
          </section>

          <section v-if="listItem.note.trim()" class="map-list-item-section">
            <h3 class="map-section-label">
              <AppIcon name="note-solid" class="h-3.5 w-3.5" />
              NOTE
            </h3>
            <div class="map-section-body">
              <p class="map-note-text">{{ listItem.note }}</p>
            </div>
          </section>

          <div class="map-list-item-actions">
            <button
              type="button"
              class="map-confirm-button"
              :style="!listItem.enabled ? { opacity: 0.5 } : undefined"
              @click.stop="toggleEnabled(listItem)"
            >
              <AppIcon
                :name="listItem.enabled ? 'check-circle' : 'close-circle'"
                class="h-4 w-4"
              />
              {{ listItem.enabled ? "完成" : "取消完成" }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <p v-else class="map-empty-sheet">尚無清單資料</p>

    <div v-if="listItems.length" class="map-pagination-row">
      <button type="button" class="map-nav-button" @click="prevListItem">
        &lt;
      </button>
      <span class="map-position-label">{{ activePositionLabel }}</span>
      <button type="button" class="map-nav-button" @click="nextListItem">
        &gt;
      </button>
    </div>
  </aside>
</template>

<style scoped>
@reference "../style.css";

.map-bottom-sheet {
  @apply absolute bottom-0 left-1/2 z-40 flex flex-col overflow-hidden border border-editor-border/80 bg-editor-surface px-4 pt-2 pb-3 text-editor-text;
  transform: translateX(-50%);
  width: min(calc(100% - 1rem), 36rem);
  max-height: calc(100% - 0.5rem);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -10px 32px rgba(0, 0, 0, 0.1);
}

.map-sheet-handle {
  @apply relative z-10 grid w-full shrink-0 cursor-pointer touch-manipulation place-items-center border-0 bg-transparent;
  min-height: 32px;
  padding: 0.25rem 0 0.5rem;
}

.map-handle-bar {
  @apply rounded-full bg-editor-border;
  width: 44px;
  height: 5px;
}

.map-nav-button {
  @apply inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-editor-card border-0 bg-transparent text-[14px] leading-none font-medium text-editor-muted transition-colors hover:text-editor-primary active:scale-95;
}

.map-list-item-track {
  @apply min-h-0 overflow-visible;
  flex: 0 1 auto;
}

.map-bottom-sheet.is-expanded .map-list-item-track {
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* Content lives directly in the sheet now (no nested card box) — matches
   how .list-item-content sits inside the already-styled .list-item-card
   in ListItem.vue, just without the extra border/shadow layer here. */
.map-list-item-card {
  @apply relative hidden flex-col;
}

.map-list-item-card.active {
  @apply flex;
}

.map-list-item-style-bar {
  @apply absolute top-0 left-0 h-[3px] w-full;
}

.map-list-item-header {
  @apply flex w-full min-w-0 cursor-pointer touch-manipulation items-start gap-3 p-4 text-left;
}

.map-booth-code {
  @apply mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-editor-card text-[12px] leading-none font-medium;
}

.map-list-item-header-content {
  @apply flex min-w-0 flex-1 flex-col gap-1;
}

.map-list-item-top-row {
  @apply flex min-w-0 items-start justify-between gap-2;
}

.map-list-item-bottom-row {
  @apply flex min-h-4 items-center justify-between gap-2;
}

.map-author-summary {
  @apply m-0 min-w-0 truncate text-[14px] leading-[1.6] font-normal text-editor-text;
}

.map-list-item-meta-icons {
  @apply flex min-w-0 flex-wrap items-center gap-2;
}

.map-total-price {
  @apply ml-2 shrink-0 text-[14px] leading-none font-medium text-editor-text tabular-nums;
}

.map-gift-count-content {
  @apply ml-2 inline-flex shrink-0 items-center gap-1 text-[12px] leading-none font-medium text-editor-muted;
}

/* Expanded content — mirrors .list-item-content / .list-item-section / .section-label */
.map-list-item-content {
  @apply flex flex-col border-t border-editor-border/70;
}

.map-list-item-section {
  @apply border-b border-editor-border/70 px-4 py-3 last:border-b-0;
}

.map-section-label {
  @apply mb-2 flex items-center gap-1.5 text-[12px] leading-none font-medium uppercase tracking-wide text-editor-muted;
}

.map-section-body {
  @apply pl-1.5;
}

.map-view-row {
  @apply flex items-center justify-between gap-3 text-[14px] leading-[1.6] font-normal text-editor-text;
}

.map-status-chip {
  @apply rounded-editor-card px-2 py-1 text-[12px] leading-none font-medium;
}

.map-status-on {
  @apply bg-editor-primary-soft text-editor-primary;
}

.map-status-off {
  @apply bg-editor-muted-surface text-editor-muted;
}

.map-author-tag-row {
  @apply flex min-w-0 flex-wrap gap-2;
}

.map-author-badge {
  @apply rounded-editor-card border-0 px-2 py-1 text-[12px] leading-none font-medium;
}

.map-empty-text {
  @apply text-[14px] leading-[1.6] text-editor-muted;
}

.map-plain-row-list {
  @apply flex flex-col gap-2;
}

.map-plain-row-item {
  @apply flex items-start justify-between gap-3;
}

.map-row-disabled {
  @apply opacity-45;
}

.map-item-main-text {
  @apply min-w-0 truncate text-[14px] leading-[1.6] text-editor-text;
}

.map-item-author-text {
  @apply font-normal text-editor-muted;
}

.map-item-separator {
  @apply mx-1 text-editor-muted;
}

.map-item-price-text {
  @apply shrink-0 text-[12px] leading-[1.6] font-medium text-editor-text tabular-nums;
}

.map-row-end {
  @apply flex shrink-0 items-center gap-2;
}

.map-row-checkbox {
  @apply h-3.5 w-3.5 shrink-0 rounded accent-editor-primary;
}

.map-tag-chip-list {
  @apply flex flex-wrap gap-2;
}

.map-tag-chip {
  @apply inline-flex items-center gap-1 rounded-editor-card px-2 py-1 text-[12px] leading-none font-medium text-white;
}

.map-note-text {
  @apply m-0 whitespace-pre-wrap rounded-editor-card bg-editor-muted-surface/70 p-3 text-[14px] leading-[1.6] text-editor-text;
}

.map-list-item-actions {
  @apply flex justify-end bg-editor-surface px-4 py-4;
}

.map-confirm-button {
  @apply inline-flex items-center gap-1.5 rounded-editor-card border-transparent bg-editor-accent/30 px-4 py-2 text-[12px] leading-none font-medium text-[#3c4a3d] transition-colors hover:bg-editor-accent/50;
}

.map-empty-sheet {
  @apply text-center text-editor-muted;
}

.map-pagination-row {
  @apply flex h-4 shrink-0 items-center justify-center gap-3 bg-editor-surface;
}

.map-position-label {
  @apply text-[12px] leading-none font-medium tracking-wide text-editor-muted tabular-nums;
}
</style>
