<script setup lang="ts">
import { computed, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { DEFAULT_HIGHLIGHT } from '@/data/cardHighlights'
import { useCardStore } from '@/stores/cardStore'
import type { BoothCard } from '@/types/card'
import DataManagerModal from './DataManagerModal.vue'
import CardItem from './CardItem.vue'
import IconTextButton from './common/IconTextButton.vue'
import AppIcon from './icons/AppIcon.vue'

const cardStore = useCardStore()

const expandedIds = ref<number[]>([])
const editingIds = ref<number[]>([])
const showDataModal = ref(false)

const cards = computed({
  get: () => cardStore.cards,
  set: value => cardStore.setCards(value),
})

function handleImport(cardsData: BoothCard[]) {
  cards.value = cardsData
  save()
}

function isExpanded(id: number) {
  return expandedIds.value.includes(id)
}

function isEditing(id: number) {
  return editingIds.value.includes(id)
}

function toggleExpand(id: number) {
  expandedIds.value = isExpanded(id)
    ? expandedIds.value.filter(item => item !== id)
    : [...expandedIds.value, id]
}

function toggleEdit(id: number) {
  editingIds.value = isEditing(id)
    ? editingIds.value.filter(item => item !== id)
    : [...editingIds.value, id]

  save()
}

function save() {
  cardStore.save()
}

function getNextCardId() {
  if (!cards.value.length) return 1
  return Math.max(...cards.value.map(card => card.id)) + 1
}

function addCard() {
  const card: BoothCard = {
    id: getNextCardId(),
    boothId: '',
    enabled: true,
    priority: cards.value.length + 1,
    authorNames: [],
    purchaseItems: [],
    exchangeGifts: [],
    tags: [],
    highlight: DEFAULT_HIGHLIGHT,
    note: '',
  }

  cards.value.push(card)
  expandedIds.value.push(card.id)
  editingIds.value.push(card.id)
  save()
}

function removeCard(id: number) {
  cardStore.removeCard(id)
}
</script>

<template>
  <section class="page-shell">
    <div class="editor-container">
      <h1 class="editor-title">
        資料編輯
      </h1>

      <div class="editor-toolbar">
        <button type="button" class="icon-badge-button" @click="showDataModal = true">匯入/匯出
        </button>
      </div>

      <VueDraggable v-model="cards" handle=".drag-bar" :animation="150" class="card-list" @end="save">
        <CardItem v-for="card in cards" :key="card.id" :card="card" :is-expanded="isExpanded(card.id)"
          :is-editing="isEditing(card.id)" @toggle-expand="toggleExpand" @toggle-edit="toggleEdit"
          @remove-card="removeCard" @save="save" />
      </VueDraggable>

      <IconTextButton extra-class="glass-button flex mx-auto w-30 justify-center py-2 my-4 text-center text-sm text-slate-600 font-bold shadow-sm backdrop-blur-xl" @click="addCard">
        <template #icon>
          <AppIcon name="plus" class="h-3.5 w-3.5" />
        </template>
        新增攤位
      </IconTextButton>
    </div>

    <DataManagerModal v-model="showDataModal" :cards="cards" @save="handleImport" />
  </section>
</template>
