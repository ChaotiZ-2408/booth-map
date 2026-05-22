<script setup lang="ts">
import { ref } from 'vue'
import type { BoothCard, CardHighlight } from '@/types/card'
import { CARD_HIGHLIGHTS, CARD_HIGHLIGHT_MAP } from '@/data/cardHighlights'
import { CARD_TAGS, CARD_TAG_MAP, getTagBadgeToneClass, getTagChipToneClass } from '@/data/cardTags'
import SectionTitle from './common/SectionTitle.vue'
import IconTextButton from './common/IconTextButton.vue'
import AppIcon from './icons/AppIcon.vue'

const props = defineProps<{
  card: BoothCard
  isExpanded: boolean
  isEditing: boolean
}>()

const emit = defineEmits<{
  (event: 'save'): void
  (event: 'toggle-expand', id: number): void
  (event: 'toggle-edit', id: number): void
  (event: 'remove-card', id: number): void
}>()

const isHighlightPickerOpen = ref(false)

function save() {
  emit('save')
}

function addAuthor() {
  props.card.authorNames.push('')
  save()
}

function removeAuthor(index: number) {
  props.card.authorNames.splice(index, 1)
  save()
}

function addPurchaseItem() {
  props.card.purchaseItems.push({
    authorName: '',
    itemName: '',
    price: 0,
    enabled: true,
  })
  save()
}

function removePurchaseItem(index: number) {
  props.card.purchaseItems.splice(index, 1)
  save()
}

function addExchangeGift() {
  props.card.exchangeGifts.push({
    authorName: '',
    itemName: '',
    enabled: true,
  })
  save()
}

function removeExchangeGift(index: number) {
  props.card.exchangeGifts.splice(index, 1)
  save()
}

function getTotalPrice() {
  return props.card.purchaseItems.reduce((total, item) => {
    if (!item.enabled) return total
    return total + (Number(item.price) || 0)
  }, 0)
}

function hasTag(tagId: (typeof CARD_TAGS)[number]['id']) {
  return props.card.tags.includes(tagId)
}

function toggleTag(tagId: (typeof CARD_TAGS)[number]['id']) {
  props.card.tags = hasTag(tagId)
    ? props.card.tags.filter(id => id !== tagId)
    : [...props.card.tags, tagId]
  save()
}

function getTag(tagId: (typeof CARD_TAGS)[number]['id']) {
  return CARD_TAG_MAP[tagId]
}

function getHighlightOption(highlight: CardHighlight) {
  return CARD_HIGHLIGHT_MAP[highlight]
}

function setHighlight(highlight: CardHighlight) {
  props.card.highlight = highlight
  isHighlightPickerOpen.value = false
  save()
}

function toggleHighlightPicker() {
  isHighlightPickerOpen.value = !isHighlightPickerOpen.value
}

function closeHighlightPicker() {
  isHighlightPickerOpen.value = false
}
</script>

<template>
  <article class="glass-card" :class="[getHighlightOption(card.highlight).cardClass, { 'opacity-60': !card.enabled }]">
    <div class="drag-bar">
      ⠿
    </div>

    <div class="card-main">
      <div class="card-header" @click="emit('toggle-expand', card.id)">
        <div class="card-header-content">
          <div class="booth-code">
            {{ card.boothId }}
            <span v-if="!card.boothId">
              攤位
            </span>
          </div>

          <div class="author-tag-row">
            <span v-for="author in card.authorNames.filter(Boolean)" :key="author" class="author-badge-sm">
              {{ author }}
            </span>

            <span v-if="!card.authorNames.filter(Boolean).length" class="empty-badge">
              尚無作者
            </span>
          </div>

          <div class="card-meta-badges">
            <div v-for="tagId in card.tags" :key="tagId" class="card-meta-badge tag-badge" :class="getTagBadgeToneClass(getTag(tagId))">
              <AppIcon :name="getTag(tagId).icon" class="size-4" />
            </div>

            <div v-if="card.exchangeGifts.length" class="gift-count-badge card-meta-badge">
              <div class="gift-count-content">
                <AppIcon name="gift-solid" class="size-4" />
                <span>{{ card.exchangeGifts.length }}</span>
              </div>
            </div>

            <div v-if="card.note.trim()" class="note-badge card-meta-badge">
              <div class="note-badge-content">
                <AppIcon name="note-solid" class="size-4" />
              </div>
            </div>
          </div>

          <div class="card-total-price">
            <span>$</span>
            <span class="price-number">{{ getTotalPrice() }}</span>
          </div>
        </div>
      </div>

      <div v-if="isExpanded" class="card-content" @click.stop="closeHighlightPicker">
        <div class="section-wrap">
          <div>
            <SectionTitle title="Booth">
              <template #icon>
                <AppIcon name="map-pin" class="h-3.5 w-3.5" />
              </template>
            </SectionTitle>

            <div class="glass-section">
              <div v-if="!isEditing" class="text-sm font-bold text-slate-700">
                <div class="flex items-center gap-2">
                  <span>{{ card.boothId }}</span>
                  <input
                    v-model="card.enabled"
                    type="checkbox"
                    class="h-4 w-4 accent-slate-500"
                    @click.stop
                    @change="save"
                  >
                </div>
              </div>

              <div v-else class="booth-edit-row">
                <input v-model="card.boothId" class="edit-input font-bold" placeholder="攤位編號" @input="save">

                <div class="highlight-picker" @click.stop>
                  <button type="button" class="highlight-trigger" @click="toggleHighlightPicker">
                    <span class="highlight-dot" :class="getHighlightOption(card.highlight).dotClass" />
                  </button>

                  <div v-if="isHighlightPickerOpen" class="highlight-popover">
                    <button
                      v-for="option in CARD_HIGHLIGHTS"
                      :key="option.id"
                      type="button"
                      class="highlight-option"
                      :class="{ 'highlight-option-active': card.highlight === option.id }"
                      @click="setHighlight(option.id)"
                    >
                      <span class="highlight-dot" :class="option.dotClass" />
                    </button>
                  </div>
                </div>
              </div>

              <label v-if="isEditing" class="toggle-label mt-2">
                <input
                  v-model="card.enabled"
                  type="checkbox"
                  class="h-4 w-4 accent-slate-500"
                  @change="save"
                >
                <span>攤位啟用</span>
              </label>
            </div>
          </div>

          <div>
            <div class="section-header">
              <SectionTitle title="Authors">
                <template #icon>
                  <AppIcon name="user-group" class="h-3.5 w-3.5" />
                </template>
              </SectionTitle>
            </div>

            <div class="glass-section">
              <div v-if="!isEditing" class="author-tag-row">
                <span v-for="author in card.authorNames.filter(Boolean)" :key="author" class="author-badge">
                  {{ author }}
                </span>

                <span v-if="!card.authorNames.filter(Boolean).length" class="empty-text">
                  尚無作者
                </span>
              </div>

              <template v-else>
                <div v-for="(_, index) in card.authorNames" :key="index" class="edit-list-row">
                  <input v-model="card.authorNames[index]" class="edit-input font-semibold text-slate-700" placeholder="作者名稱" @input="save">

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
          </div>

          <div>
            <div class="section-header">
              <SectionTitle title="Purchase" as="h2">
                <template #icon>
                  <AppIcon name="shopping-bag" class="h-3.5 w-3.5" />
                </template>
              </SectionTitle>
            </div>

            <div class="glass-section">
              <div v-if="!isEditing" class="plain-row-list">
                <div v-for="(item, index) in card.purchaseItems" :key="index" class="plain-row-item" :class="{ 'opacity-45': !item.enabled }">
                  <label class="item-main-label">
                    <input v-model="item.enabled" type="checkbox" class="h-4 w-4 accent-slate-500" @click.stop @change="save">

                    <div class="item-main-text">
                      <span class="item-author-text">{{ item.authorName }}</span>
                      <span class="item-separator">/</span>
                      <span :class="{ 'line-through': !item.enabled }">{{ item.itemName }}</span>
                    </div>
                  </label>

                  <div class="item-price-text" :class="{ 'line-through': !item.enabled }">
                    ${{ Number(item.price) || 0 }}
                  </div>
                </div>

                <div v-if="!card.purchaseItems.length" class="empty-text">
                  尚未新增購買項目
                </div>
              </div>

              <template v-else>
                <div v-for="(item, index) in card.purchaseItems" :key="index" class="edit-card edit-list-row">
                  <div class="edit-list-row">
                    <div class="edit-list-main">
                      <label class="toggle-label">
                        <input v-model="item.enabled" type="checkbox" class="h-4 w-4 accent-slate-500" @change="save">
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
          </div>

          <div>
            <div class="section-header">
              <SectionTitle title="MEETING GIFT" as="h2">
                <template #icon>
                  <AppIcon name="gift-outline" class="h-3.5 w-3.5" />
                </template>
              </SectionTitle>
            </div>

            <div class="glass-section">
              <div v-if="!isEditing" class="plain-row-list">
                <div
                  v-for="(gift, index) in card.exchangeGifts"
                  :key="index"
                  class="plain-row-item"
                  :class="{ 'opacity-45': !gift.enabled }"
                >
                  <label class="item-main-label">
                    <input
                      v-model="gift.enabled"
                      type="checkbox"
                      class="h-4 w-4 accent-slate-500"
                      @click.stop
                      @change="save"
                    >
                    <div class="item-main-text">
                      <span class="item-author-text">{{ gift.authorName }}</span>
                      <span class="item-separator">/</span>
                      <span :class="{ 'line-through': !gift.enabled }">{{ gift.itemName }}</span>
                    </div>
                  </label>
                </div>

                <div v-if="!card.exchangeGifts.length" class="empty-text">
                  尚未新增認親禮
                </div>
              </div>

              <template v-else>
                <div v-for="(gift, index) in card.exchangeGifts" :key="index" class="edit-card edit-list-row">
                  <div class="edit-list-row">
                    <div class="edit-list-main">
                      <label class="toggle-label">
                        <input v-model="gift.enabled" type="checkbox" class="h-4 w-4 accent-slate-500" @change="save">
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
          </div>

          <div>
            <div class="section-header">
              <SectionTitle title="Tags" as="h2">
                <template #icon>
                  <AppIcon name="tag-bonus" class="h-3.5 w-3.5" />
                </template>
              </SectionTitle>
            </div>

            <div class="glass-section">
              <div v-if="!isEditing" class="tag-chip-list">
                <div v-for="tagId in card.tags" :key="tagId" class="tag-chip tag-chip-selected" :class="getTagChipToneClass(getTag(tagId))">
                  <AppIcon :name="getTag(tagId).icon" class="h-4 w-4" />
                  <span>{{ getTag(tagId).displayName }}</span>
                </div>

                <div v-if="!card.tags.length" class="empty-text">
                  尚未設定標籤
                </div>
              </div>

              <div v-else class="tag-chip-list">
                <button v-for="tag in CARD_TAGS" :key="tag.id" type="button" class="tag-chip" :class="[hasTag(tag.id) ? ['tag-chip-selected', getTagChipToneClass(tag)] : 'tag-chip-unselected']" @click="toggleTag(tag.id)">
                  <AppIcon :name="tag.icon" class="h-4 w-4" />
                  <span>{{ tag.displayName }}</span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="isEditing || card.note.trim()">
            <label class="section-label">
              Note
            </label>

            <div class="glass-section">
              <textarea v-if="isEditing" v-model="card.note" rows="4" class="edit-input resize-none" placeholder="請輸入註解" @input="save" />

              <p v-else class="note-text">
                {{ card.note }}
              </p>
            </div>
          </div>

          <div class="card-actions">
            <IconTextButton variant="action" extra-class="delete-button" @click="emit('remove-card', card.id)">
              <template #icon>
                <AppIcon name="trash-x" class="h-4 w-4" />
              </template>
              刪除
            </IconTextButton>

            <IconTextButton variant="action" :extra-class="isEditing ? 'confirm-button' : 'edit-button'" @click="emit('toggle-edit', card.id)">
              <template #icon>
                <AppIcon v-if="!isEditing" name="edit-pencil" class="h-4 w-4" />
                <AppIcon v-else name="check-circle" class="h-4 w-4" />
              </template>
              {{ isEditing ? '確認' : '編輯' }}
            </IconTextButton>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
