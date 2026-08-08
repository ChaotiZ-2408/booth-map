<script setup lang="ts">
import { ref } from 'vue'
import type { ListItem, ListItemStyle } from '@/types/listItem'
import { LIST_ITEM_STYLES, LIST_ITEM_STYLE_MAP } from '@/data/listItemStyles'
import { LIST_ITEM_TAGS, LIST_ITEM_TAG_MAP, getTagBadgeToneClass, getTagChipToneClass } from '@/data/listItemTags'
import SectionTitle from './common/SectionTitle.vue'
import IconTextButton from './common/IconTextButton.vue'
import AppIcon from './icons/AppIcon.vue'
import { useListStatistics } from "@/composables/useListStatistics";

const props = defineProps<{
  listItem: ListItem
  isExpanded: boolean
  isEditing: boolean
  showDragHandle: boolean
}>()

const {
  getBoothTotalPrice,
  getBoothGiftPeopleCount,
} = useListStatistics(() => [props.listItem]);

const emit = defineEmits<{
  (event: 'save'): void
  (event: 'toggle-expand', id: number): void
  (event: 'toggle-edit', id: number): void
  (event: 'remove-list-item', id: number): void
}>()

const isStylePickerOpen = ref(false)

const STYLE_BAR_CLASS_MAP: Record<ListItemStyle, string> = {
  default: 'bg-editor-primary-soft',
  red: 'bg-[#fedadd]',
  amber: 'bg-amber-200',
  sky: 'bg-[#d4e5f3]',
  violet: 'bg-violet-200',
}

const STYLE_BOOTH_CLASS_MAP: Record<ListItemStyle, string> = {
  default: 'bg-editor-accent/30 text-editor-primary',
  red: 'bg-[#fedadd]/45 text-[#775c5e]',
  amber: 'bg-amber-100 text-taupe-500',
  sky: 'bg-[#d4e5f3]/55 text-[#667783]',
  violet: 'bg-violet-100 text-mauve-500',
}

function save() {
  emit('save')
}

function addAuthor() {
  props.listItem.authorNames.push('')
  save()
}

function removeAuthor(index: number) {
  props.listItem.authorNames.splice(index, 1)
  save()
}

function addPurchaseItem() {
  props.listItem.purchaseItems.push({
    authorName: '',
    itemName: '',
    price: 0,
    enabled: true,
  })
  save()
}

function removePurchaseItem(index: number) {
  props.listItem.purchaseItems.splice(index, 1)
  save()
}

function addExchangeGift() {
  props.listItem.exchangeGifts.push({
    authorName: '',
    itemName: '',
    enabled: true,
  })
  save()
}

function removeExchangeGift(index: number) {
  props.listItem.exchangeGifts.splice(index, 1)
  save()
}


function hasTag(tagId: (typeof LIST_ITEM_TAGS)[number]['id']) {
  return props.listItem.tags.includes(tagId)
}

function toggleTag(tagId: (typeof LIST_ITEM_TAGS)[number]['id']) {
  props.listItem.tags = hasTag(tagId)
    ? props.listItem.tags.filter(id => id !== tagId)
    : [...props.listItem.tags, tagId]
  save()
}

function getTag(tagId: (typeof LIST_ITEM_TAGS)[number]['id']) {
  return LIST_ITEM_TAG_MAP[tagId]
}

function getStyleOption(style: ListItemStyle) {
  return LIST_ITEM_STYLE_MAP[style]
}

function getStyleBarClass(style: ListItemStyle) {
  return STYLE_BAR_CLASS_MAP[style]
}

function getBoothAccentClass(style: ListItemStyle) {
  return STYLE_BOOTH_CLASS_MAP[style]
}

function getAuthorSummary() {
  const authors = props.listItem.authorNames.filter(Boolean)
  return authors.length ? authors.join(' | ') : '尚無作者'
}

function setStyle(style: ListItemStyle) {
  props.listItem.style = style
  isStylePickerOpen.value = false
  save()
}

function toggleStylePicker() {
  isStylePickerOpen.value = !isStylePickerOpen.value
}

function closeStylePicker() {
  isStylePickerOpen.value = false
}
</script>

<template>
  <article class="list-item-card" :class="{ 'opacity-60': !listItem.enabled }">
    <div class="list-item-style-bar" :class="getStyleBarClass(listItem.style)" />

    <div v-if="showDragHandle" class="drag-bar" title="拖曳排序">
      ⠿
    </div>

    <button type="button" class="list-item-header" :class="{ 'list-item-header-with-drag': showDragHandle }"
      @click="emit('toggle-expand', listItem.id)">
      <div class="booth-code" :class="getBoothAccentClass(listItem.style)">
        {{ listItem.boothId || '攤位' }}
      </div>

      <div class="list-item-header-content">
        <div class="list-item-top-row">
          <p class="author-summary">
            {{ getAuthorSummary() }}
          </p>
          <span class="list-item-total-price">
            ${{ getBoothTotalPrice(listItem) }}
          </span>
        </div>

        <div class="list-item-bottom-row">
          <div class="list-item-meta-icons">
            <AppIcon v-for="tagId in listItem.tags" :key="tagId" :name="getTag(tagId).icon" class="h-3.5 w-3.5"
              :class="getTagBadgeToneClass(getTag(tagId))" />

            <AppIcon v-if="listItem.note.trim()" name="note-solid" class="h-3.5 w-3.5 text-[#73575a]" />
          </div>

          <span v-if="getBoothGiftPeopleCount(listItem)" class="gift-count-content">
            <AppIcon name="gift-solid" class="h-3.5 w-3.5 text-[#e1bec1]" />
            <span>{{ getBoothGiftPeopleCount(listItem) }}</span>
          </span>
        </div>
      </div>
    </button>

    <div v-if="isExpanded" class="list-item-content" @click.stop="closeStylePicker">
      <section class="list-item-section">
        <SectionTitle title="Booth">
          <template #icon>
            <AppIcon name="map-pin" class="h-3.5 w-3.5" />
          </template>
        </SectionTitle>

        <div class="section-body">
          <div v-if="!isEditing" class="view-row">
            <span>{{ listItem.boothId || '尚未設定攤位' }}</span>
            <label class="toggle-label">
              <input v-model="listItem.enabled" type="checkbox" class="editor-checkbox" @click.stop @change="save">
              <span>啟用</span>
            </label>
          </div>

          <div v-else class="space-y-2">
            <div class="booth-edit-row">
              <input v-model="listItem.boothId" class="edit-input" placeholder="攤位編號" @input="save">

              <div class="style-picker" @click.stop>
                <button type="button" class="style-trigger" @click="toggleStylePicker">
                  <span class="style-dot" :class="getStyleOption(listItem.style).dotClass" />
                </button>

                <div v-if="isStylePickerOpen" class="style-popover">
                  <button v-for="option in LIST_ITEM_STYLES" :key="option.id" type="button" class="style-option"
                    :class="{ 'style-option-active': listItem.style === option.id }" @click="setStyle(option.id)">
                    <span class="style-dot" :class="option.dotClass" />
                  </button>
                </div>
              </div>
            </div>

            <label class="toggle-label">
              <input v-model="listItem.enabled" type="checkbox" class="editor-checkbox" @change="save">
              <span>攤位啟用</span>
            </label>
          </div>
        </div>
      </section>

      <section class="list-item-section">
        <SectionTitle title="Authors">
          <template #icon>
            <AppIcon name="user-group" class="h-3.5 w-3.5" />
          </template>
        </SectionTitle>

        <div class="section-body">
          <div v-if="!isEditing" class="author-tag-row">
            <span v-for="author in listItem.authorNames.filter(Boolean)" :key="author" class="author-badge"
              :class="getBoothAccentClass(listItem.style)">
              {{ author }}
            </span>

            <span v-if="!listItem.authorNames.filter(Boolean).length" class="empty-text">
              尚無作者
            </span>
          </div>

          <template v-else>
            <div v-for="(_, index) in listItem.authorNames" :key="index" class="edit-list-row">
              <input v-model="listItem.authorNames[index]" class="edit-input" placeholder="作者名稱" @input="save">

              <IconTextButton extra-class="remove-item-button" @click="removeAuthor(index)">
                <template #icon>
                  <AppIcon name="close-circle" class="h-4 w-4" />
                </template>
              </IconTextButton>
            </div>

            <IconTextButton extra-class="add-item-button" @click="addAuthor">
              <template #icon>
                <AppIcon name="plus" class="h-3.5 w-3.5" />
              </template>
              新增作者
            </IconTextButton>
          </template>
        </div>
      </section>

      <section class="list-item-section">
        <SectionTitle title="Purchase" as="h2">
          <template #icon>
            <AppIcon name="shopping-bag" class="h-3.5 w-3.5" />
          </template>
        </SectionTitle>

        <div class="section-body">
          <div v-if="!isEditing" class="plain-row-list">
            <div v-for="(item, index) in listItem.purchaseItems" :key="index" class="plain-row-item"
              :class="{ 'opacity-45': !item.enabled }">
              <label class="item-main-label">
                <input v-model="item.enabled" type="checkbox" class="editor-checkbox mt-1" @click.stop @change="save">

                <span class="item-main-text">
                  <span class="item-author-text">{{ item.authorName }}</span>
                  <span class="item-separator">/</span>
                  <span :class="{ 'line-through': !item.enabled }">{{ item.itemName }}</span>
                </span>
              </label>

              <span class="item-price-text" :class="{ 'line-through': !item.enabled }">
                ${{ Number(item.price) || 0 }}
              </span>
            </div>

            <div v-if="!listItem.purchaseItems.length" class="empty-text">
              尚未新增購買項目
            </div>
          </div>

          <template v-else>
            <div v-for="(item, index) in listItem.purchaseItems" :key="index" class="edit-list-item">
              <div class="edit-list-row">
                <div class="edit-list-main">
                  <label class="toggle-label">
                    <input v-model="item.enabled" type="checkbox" class="editor-checkbox" @change="save">
                    <span>納入計算</span>
                  </label>

                  <input v-model="item.authorName" class="edit-input" placeholder="作者" @input="save">
                  <input v-model="item.itemName" class="edit-input" placeholder="項目" @input="save">
                  <input v-model.number="item.price" type="number" class="edit-input" placeholder="金額" @input="save">
                </div>

                <IconTextButton extra-class="remove-item-button" @click="removePurchaseItem(index)">
                  <template #icon>
                    <AppIcon name="close-circle" class="h-4 w-4" />
                  </template>
                </IconTextButton>
              </div>
            </div>

            <IconTextButton extra-class="add-item-button" @click="addPurchaseItem">
              <template #icon>
                <AppIcon name="plus" class="h-3.5 w-3.5" />
              </template>
              新增項目
            </IconTextButton>
          </template>
        </div>
      </section>

      <section class="list-item-section">
        <SectionTitle title="MEETING GIFT" as="h2">
          <template #icon>
            <AppIcon name="gift-outline" class="h-3.5 w-3.5" />
          </template>
        </SectionTitle>

        <div class="section-body">
          <div v-if="!isEditing" class="plain-row-list">
            <div v-for="(gift, index) in listItem.exchangeGifts" :key="index" class="plain-row-item"
              :class="{ 'opacity-45': !gift.enabled }">
              <label class="item-main-label">
                <input v-model="gift.enabled" type="checkbox" class="editor-checkbox mt-1" @click.stop @change="save">
                <span class="item-main-text">
                  <span class="item-author-text">{{ gift.authorName }}</span>
                  <span class="item-separator">/</span>
                  <span :class="{ 'line-through': !gift.enabled }">{{ gift.itemName }}</span>
                </span>
              </label>
            </div>

            <div v-if="!listItem.exchangeGifts.length" class="empty-text">
              尚未新增認親禮
            </div>
          </div>

          <template v-else>
            <div v-for="(gift, index) in listItem.exchangeGifts" :key="index" class="edit-list-item">
              <div class="edit-list-row">
                <div class="edit-list-main">
                  <label class="toggle-label">
                    <input v-model="gift.enabled" type="checkbox" class="editor-checkbox" @change="save">
                    <span>納入計算</span>
                  </label>
                  <input v-model="gift.authorName" class="edit-input" placeholder="作者" @input="save">
                  <input v-model="gift.itemName" class="edit-input" placeholder="項目" @input="save">
                </div>

                <IconTextButton extra-class="remove-item-button" @click="removeExchangeGift(index)">
                  <template #icon>
                    <AppIcon name="close-circle" class="h-4 w-4" />
                  </template>
                </IconTextButton>
              </div>
            </div>

            <IconTextButton extra-class="add-item-button" @click="addExchangeGift">
              <template #icon>
                <AppIcon name="plus" class="h-3.5 w-3.5" />
              </template>
              新增認親禮
            </IconTextButton>
          </template>
        </div>
      </section>

      <section class="list-item-section">
        <SectionTitle title="Tags" as="h2">
          <template #icon>
            <AppIcon name="tag-bonus" class="h-3.5 w-3.5" />
          </template>
        </SectionTitle>

        <div class="section-body">
          <div v-if="!isEditing" class="tag-chip-list">
            <div v-for="tagId in listItem.tags" :key="tagId" class="tag-chip tag-chip-selected"
              :class="getTagChipToneClass(getTag(tagId))">
              <AppIcon :name="getTag(tagId).icon" class="h-4 w-4" />
              <span>{{ getTag(tagId).displayName }}</span>
            </div>

            <div v-if="!listItem.tags.length" class="empty-text">
              尚未設定標籤
            </div>
          </div>

          <div v-else class="tag-chip-list">
            <button v-for="tag in LIST_ITEM_TAGS" :key="tag.id" type="button" class="tag-chip"
              :class="[hasTag(tag.id) ? ['tag-chip-selected', getTagChipToneClass(tag)] : 'tag-chip-unselected']"
              @click="toggleTag(tag.id)">
              <AppIcon :name="tag.icon" class="h-4 w-4" />
              <span>{{ tag.displayName }}</span>
            </button>
          </div>
        </div>
      </section>

      <section v-if="isEditing || listItem.note.trim()" class="list-item-section">
        <SectionTitle title="Note" as="h2">
          <template #icon>
            <AppIcon name="note-solid" class="h-3.5 w-3.5" />
          </template>
        </SectionTitle>

        <div class="section-body">
          <textarea v-if="isEditing" v-model="listItem.note" rows="4" class="edit-input resize-none" placeholder="請輸入註解"
            @input="save" />

          <p v-else class="note-text">
            {{ listItem.note }}
          </p>
        </div>
      </section>

      <div class="list-item-actions">
        <IconTextButton variant="action" extra-class="delete-button" @click="emit('remove-list-item', listItem.id)">
          <template #icon>
            <AppIcon name="trash-x" class="h-4 w-4" />
          </template>
          刪除
        </IconTextButton>

        <IconTextButton variant="action" :extra-class="isEditing ? 'confirm-button' : 'edit-button'"
          @click="emit('toggle-edit', listItem.id)">
          <template #icon>
            <AppIcon v-if="!isEditing" name="edit-pencil" class="h-4 w-4" />
            <AppIcon v-else name="check-circle" class="h-4 w-4" />
          </template>
          {{ isEditing ? '確認' : '編輯' }}
        </IconTextButton>
      </div>
    </div>
  </article>
</template>

<style scoped>
@reference "../style.css";

.list-item-card {
  @apply relative flex flex-col overflow-hidden rounded-editor-card border border-editor-border/80 bg-editor-surface shadow-editor-card transition-all duration-300;
}

.list-item-style-bar {
  @apply absolute top-0 left-0 h-[3px] w-full;
}

.drag-bar {
  @apply absolute top-1/2 right-2 z-10 flex -translate-y-1/2 cursor-grab items-center justify-center text-editor-muted transition-colors hover:text-editor-text active:cursor-grabbing;
}

.list-item-header {
  @apply flex w-full min-w-0 items-start gap-3 p-4 pr-5 text-left transition-colors hover:bg-editor-muted-surface focus:bg-editor-muted-surface focus:outline-none;
}

.list-item-header-with-drag {
  @apply pr-10;
}

.booth-code {
  @apply mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-editor-card text-[12px] leading-none font-medium;
}

.list-item-header-content {
  @apply flex min-w-0 flex-1 flex-col gap-1;
}

.list-item-top-row {
  @apply flex min-w-0 items-start justify-between gap-2;
}

.list-item-bottom-row {
  @apply flex min-h-4 items-center justify-between gap-2;
}

.author-summary {
  @apply min-w-0 truncate text-[14px] leading-[1.6] font-normal text-editor-text;
}

.list-item-meta-icons {
  @apply flex min-w-0 flex-wrap items-center gap-2;
}

.list-item-total-price {
  @apply ml-2 shrink-0 text-[14px] leading-[1.6] font-medium text-editor-text tabular-nums;
}

.gift-count-content {
  @apply ml-2 inline-flex shrink-0 items-center gap-1 text-[12px] leading-none font-medium text-editor-muted;
}

.list-item-content {
  @apply flex flex-col border-t border-editor-border/70;
}

.list-item-section {
  @apply border-b border-editor-border/70 px-4 py-3 last:border-b-0;
}

.section-body {
  @apply pl-1.5;
}

.view-row {
  @apply flex items-center justify-between gap-3 text-[14px] leading-[1.6] font-normal text-editor-text;
}

.author-tag-row {
  @apply flex min-w-0 flex-wrap gap-2;
}

.author-badge {
  @apply rounded-editor-card border-0 px-2 py-1 text-[12px] leading-none font-medium;
}

.empty-text {
  @apply text-[14px] leading-[1.6] text-editor-muted;
}

.plain-row-list {
  @apply flex flex-col gap-2;
}

.plain-row-item {
  @apply flex items-start justify-between gap-3;
}

.item-main-label {
  @apply flex min-w-0 flex-1 cursor-pointer items-start gap-3;
}

.item-main-text {
  @apply min-w-0 truncate text-[14px] leading-[1.6] text-editor-text;
}

.item-author-text {
  @apply font-normal text-editor-muted;
}

.item-separator {
  @apply mx-1 text-editor-muted;
}

.item-price-text {
  @apply shrink-0 text-[12px] leading-[1.6] font-medium text-editor-text tabular-nums;
}

.price-number {
  display: inline-block;
  min-width: 3ch;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.edit-list-row {
  @apply flex gap-2;
}

.edit-list-main {
  @apply min-w-0 flex-1 space-y-2;
}

.edit-list-item {
  @apply mb-2 rounded-editor-card border border-editor-border/80 bg-[#f9f9f7] p-3 last:mb-0;
}

.edit-input {
  @apply w-full rounded-editor-card border border-[#c4c8c1] bg-editor-surface px-3 py-2 text-[14px] leading-[1.6] text-editor-text outline-none transition focus:border-editor-primary;
}

.toggle-label {
  @apply flex items-center gap-2 text-[13px] font-medium text-editor-text;
}

.editor-checkbox {
  @apply h-3.5 w-3.5 rounded accent-editor-primary;
}

.booth-edit-row {
  @apply flex items-center gap-2;
}

.style-picker {
  @apply relative shrink-0;
}

.style-trigger {
  @apply flex h-9 w-9 items-center justify-center rounded-editor-card border border-[#c4c8c1] bg-editor-muted-surface transition-colors hover:bg-[#eeeeec];
}

.style-dot {
  @apply block h-4 w-4 rounded-editor-card border border-white;
}

.style-dot-default {
  @apply bg-editor-accent;
}

.style-dot-red {
  @apply bg-rose-400;
}

.style-dot-amber {
  @apply bg-amber-400;
}

.style-dot-sky {
  @apply bg-sky-400;
}

.style-dot-violet {
  @apply bg-violet-400;
}

.style-popover {
  @apply absolute top-11 right-0 z-20 flex items-center gap-1 rounded-editor-card border border-[#c4c8c1] bg-editor-surface p-2 shadow-sm;
}

.style-option {
  @apply flex h-8 w-8 items-center justify-center rounded-editor-card border border-transparent transition-colors hover:bg-editor-muted-surface;
}

.style-option-active {
  @apply border-editor-primary bg-[#eeeeec];
}

.tag-chip-list {
  @apply flex flex-wrap gap-2;
}

.tag-chip {
  @apply inline-flex items-center gap-1 rounded-editor-card border px-2 py-1 text-[12px] leading-none font-medium transition-colors;
}

.tag-chip-unselected {
  @apply border-[#c4c8c1] bg-editor-surface text-editor-text hover:bg-editor-muted-surface;
}

.tag-chip-selected {
  @apply text-white;
}

.tag-tone-must-buy {
  @apply border-rose-300 text-rose-400;
}

.tag-tone-new-item {
  @apply border-cyan-300 text-cyan-400;
}

.tag-tone-limited {
  @apply border-rose-300 text-rose-400;
}

.tag-tone-bonus {
  @apply border-violet-400 text-violet-400;
}

.tag-tone-high-priority {
  @apply border-emerald-300 text-emerald-400;
}

.tag-chip-tone-must-buy {
  @apply border-rose-300 bg-rose-400/85;
}

.tag-chip-tone-new-item {
  @apply border-cyan-300 bg-cyan-400/85;
}

.tag-chip-tone-limited {
  @apply border-rose-300 bg-rose-400/85;
}

.tag-chip-tone-bonus {
  @apply border-violet-300 bg-violet-400/85;
}

.tag-chip-tone-high-priority {
  @apply border-emerald-300 bg-emerald-400/85;
}

.note-text {
  @apply whitespace-pre-wrap rounded-editor-card bg-editor-muted-surface/70 p-3 text-[14px] leading-[1.6] text-editor-text;
}

.remove-item-button {
  @apply shrink-0 self-start rounded-editor-card px-2 py-2 text-editor-danger transition-colors hover:bg-[#ffdad6]/40;
}

.add-item-button {
  @apply ml-auto mt-2 flex rounded-editor-card px-3 py-2 text-[12px] font-medium text-editor-primary transition-colors hover:bg-editor-primary-soft/40;
}

.list-item-actions {
  @apply flex justify-end gap-3 bg-editor-surface px-4 py-4;
}

.delete-button {
  @apply rounded-editor-card border-transparent px-4 py-2 text-[12px] leading-none font-medium text-editor-danger transition-colors hover:bg-[#ffdad6]/40;
}

.edit-button {
  @apply rounded-editor-card border-transparent bg-editor-primary-soft/50 px-4 py-2 text-[12px] leading-none font-medium text-[#3c4a3d] transition-colors hover:bg-editor-primary-soft/80;
}

.confirm-button {
  @apply rounded-editor-card border-transparent bg-editor-accent/30 px-4 py-2 text-[12px] leading-none font-medium text-[#3c4a3d] transition-colors hover:bg-editor-accent/50;
}
</style>