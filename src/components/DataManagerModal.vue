<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DEFAULT_HIGHLIGHT, isCardHighlight } from '@/data/cardHighlights'
import { CARD_TAG_MAP, normalizeTagFromInput } from '@/data/cardTags'
import type { BoothCard } from '@/types/card'

const props = defineProps<{
  modelValue: boolean
  cards: BoothCard[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', value: BoothCard[]): void
}>()

const jsonText = ref('')

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit('update:modelValue', value)
  },
})

function serializeCards(cards: BoothCard[]) {
  return cards.map((card) => {
    const base = {
      id: card.id,
      boothId: card.boothId,
      enabled: card.enabled,
      priority: card.priority,
      authorNames: card.authorNames,
      purchaseItems: card.purchaseItems,
      exchangeGifts: card.exchangeGifts,
      tags: card.tags.map((tagId) => CARD_TAG_MAP[tagId]?.displayName ?? tagId),
      note: card.note,
    } as Record<string, unknown>

    if (card.highlight !== DEFAULT_HIGHLIGHT) {
      base.highlight = card.highlight
    }

    return base
  })
}

function openJson() {
  jsonText.value = JSON.stringify(
    {
      version: 1,
      cards: serializeCards(props.cards),
    },
    null,
    2,
  )
}

async function copyJson() {
  await navigator.clipboard.writeText(jsonText.value)
}

async function loadExampleData() {
  try {
    const response = await fetch('/example-data/cards.json', { cache: 'no-store' })
    if (!response.ok) throw new Error('load failed')
    const payload = await response.json()
    jsonText.value = JSON.stringify(payload, null, 2)
  } catch {
    alert('載入範例資料失敗')
  }
}

function normalizeCards(cards: BoothCard[]): BoothCard[] {
  return cards
    .filter(Boolean)
    .map((card, index) => ({
      id: card.id ?? index + 1,
      boothId: card.boothId ?? '',
      enabled: card.enabled ?? true,
      priority: card.priority ?? index + 1,
      authorNames: card.authorNames ?? [],
      purchaseItems: (card.purchaseItems ?? []).map((item) => ({
        authorName: item.authorName ?? '',
        itemName: item.itemName ?? '',
        price: item.price ?? 0,
        enabled: item.enabled ?? true,
      })),
      exchangeGifts: (card.exchangeGifts ?? []).map((gift) => ({
        authorName: gift.authorName ?? '',
        itemName: gift.itemName ?? '',
        enabled: gift.enabled ?? true,
      })),
      tags: (card.tags ?? [])
        .map((tag) => normalizeTagFromInput(tag))
        .filter((tag): tag is BoothCard['tags'][number] => tag !== null),
      highlight: isCardHighlight(card.highlight) ? card.highlight : DEFAULT_HIGHLIGHT,
      note: card.note ?? '',
    }))
}

function importJson() {
  try {
    const parsed = JSON.parse(jsonText.value)

    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      alert('找不到有效的 cards 陣列')
      return
    }

    emit('save', normalizeCards(parsed.cards))
    visible.value = false
  } catch {
    alert('JSON 格式不正確')
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      openJson()
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-end bg-black/30 backdrop-blur-sm" @click="visible = false">
      <div class="flex h-[85vh] w-full flex-col rounded-t-[28px] bg-white/80 p-3 backdrop-blur-xl" @click.stop>
        <div class="mb-3 flex items-center justify-between">
          <div>
            <div class="text-base font-semibold text-slate-700">
              卡片資料
            </div>

            <div class="text-xs text-slate-400">
              JSON 匯入 / 匯出
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" class="icon-badge-button" @click="loadExampleData">載入範例資料</button>
            <button type="button" class="muted-button" @click="visible = false">關閉</button>
          </div>
        </div>

        <textarea
          v-model="jsonText"
          class="min-h-0 flex-1 resize-none rounded-2xl border border-slate-200 bg-white/70 p-3 font-mono text-xs text-slate-700 outline-none"
          spellcheck="false"
        />

        <div class="mt-3 grid grid-cols-2 gap-2">
          <button type="button" class="glass-button" @click="copyJson">
            複製
          </button>

          <button type="button" class="icon-action-button confirm-button" @click="importJson">
            保存
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
