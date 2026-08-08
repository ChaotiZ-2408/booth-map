<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  DEFAULT_LIST_ITEM_STYLE,
  isListItemStyle,
} from "@/data/listItemStyles";
import { LIST_ITEM_TAG_MAP, normalizeTagFromInput } from "@/data/listItemTags";
import type { ListItem } from "@/types/listItem";

const props = defineProps<{
  modelValue: boolean;
  listItems: ListItem[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", value: ListItem[]): void;
}>();

const jsonText = ref("");

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit("update:modelValue", value);
  },
});

function serializeListItems(listItems: ListItem[]) {
  return listItems.map((listItem) => {
    const base = {
      id: listItem.id,
      boothId: listItem.boothId,
      enabled: listItem.enabled,
      priority: listItem.priority,
      authorNames: listItem.authorNames,
      purchaseItems: listItem.purchaseItems,
      exchangeGifts: listItem.exchangeGifts,
      tags: listItem.tags.map(
        (tagId) => LIST_ITEM_TAG_MAP[tagId]?.displayName ?? tagId,
      ),
      note: listItem.note,
    } as Record<string, unknown>;

    if (listItem.style !== DEFAULT_LIST_ITEM_STYLE) {
      base.style = listItem.style;
    }

    return base;
  });
}

function openJson() {
  jsonText.value = JSON.stringify(
    {
      version: 1,
      listItems: serializeListItems(props.listItems),
    },
    null,
    2,
  );
}

const copied = ref(false);

async function copyJson() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(jsonText.value);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = jsonText.value;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      textarea.setAttribute("readonly", "");

      document.body.appendChild(textarea);
      textarea.select();

      const success = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (!success) {
        throw new Error("Copy failed");
      }
    }

    copied.value = true;

    window.setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch (error) {
    console.error("複製 JSON 失敗:", error);
    alert("複製失敗，請手動選取 JSON 複製");
  }
}

async function loadExampleData() {
  try {
    const response = await fetch("/example-data/list-items.json", {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("load failed");
    const payload = await response.json();
    jsonText.value = JSON.stringify(payload, null, 2);
  } catch {
    alert("載入範例資料失敗");
  }
}

function normalizeListItems(listItems: ListItem[]): ListItem[] {
  return listItems.filter(Boolean).map((listItem, index) => ({
    id: listItem.id ?? index + 1,
    boothId: listItem.boothId ?? "",
    enabled: listItem.enabled ?? true,
    priority: listItem.priority ?? index + 1,
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
    tags: (listItem.tags ?? [])
      .map((tag) => normalizeTagFromInput(tag))
      .filter((tag): tag is ListItem["tags"][number] => tag !== null),
    style: isListItemStyle(listItem.style)
      ? listItem.style
      : DEFAULT_LIST_ITEM_STYLE,
    note: listItem.note ?? "",
  }));
}

function importJson() {
  try {
    const parsed = JSON.parse(jsonText.value);

    if (!parsed.listItems || !Array.isArray(parsed.listItems)) {
      alert("找不到有效的 listItems 陣列");
      return;
    }

    emit("save", normalizeListItems(parsed.listItems));
    visible.value = false;
  } catch {
    alert("JSON 格式不正確");
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      openJson();
    }
  },
);
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-backdrop" @click="visible = false">
      <section
        class="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-data-modal-title"
        @click.stop
      >
        <header class="modal-header">
          <div class="modal-title-group">
            <h2 id="list-data-modal-title" class="modal-title">清單資料</h2>
            <p class="modal-subtitle">JSON 匯入 / 匯出</p>
          </div>

          <button
            type="button"
            class="modal-close-button"
            aria-label="關閉"
            @click="visible = false"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path
                d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"
              />
            </svg>
          </button>
        </header>

        <div class="modal-body">
          <p class="modal-description">
            貼上 JSON 可更新目前清單；也可以複製現有資料作為備份。
          </p>

          <textarea
            v-model="jsonText"
            class="modal-textarea"
            aria-label="清單 JSON 資料"
            spellcheck="false"
          />
        </div>

        <footer class="modal-footer">
          <!-- <button
            type="button"
            class="modal-button modal-button-subtle mr-auto"
            @click="loadExampleData"
          >
            載入範例
          </button> -->
          <button
            type="button"
            class="modal-button modal-button-secondary"
            @click="copyJson"
          >
            {{ copied ? "已複製" : "複製" }}
          </button>
          <button
            type="button"
            class="modal-button modal-button-primary"
            @click="importJson"
          >
            保存
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
<style scoped>
@reference "../style.css";

.modal-backdrop {
  @apply fixed inset-0 z-50 flex items-end justify-center bg-black/25 backdrop-blur-sm sm:items-center sm:p-5;
}

.modal-panel {
  @apply flex h-[85dvh] w-full flex-col overflow-hidden border border-editor-border bg-editor-surface text-editor-text shadow-editor-card sm:h-auto sm:max-h-[85dvh] sm:max-w-lg sm:rounded-editor-card;
  border-radius: 20px 20px 0 0;
}

@media (min-width: 640px) {
  .modal-panel {
    border-radius: 8px;
  }
}

.modal-panel-wide {
  @apply sm:max-w-4xl;
}

.modal-header {
  @apply flex shrink-0 items-center justify-between gap-3 border-b border-editor-border/70 px-4 py-3 sm:px-5;
}

.modal-title-group {
  @apply min-w-0;
}

.modal-title {
  @apply m-0 text-[18px] leading-[1.4] font-medium text-editor-text;
}

.modal-subtitle {
  @apply mt-0.5 text-[12px] leading-[1.5] font-normal tracking-wide text-editor-muted;
}

.modal-close-button {
  @apply inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-editor-card border-0 bg-transparent text-editor-muted transition-colors hover:bg-editor-muted-surface hover:text-editor-text active:scale-95;
}

.modal-body {
  @apply flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5;
}

.modal-description {
  @apply m-0 text-[14px] leading-[1.6] text-editor-muted;
}

.modal-field-label {
  @apply mb-1.5 block text-[12px] leading-none font-medium tracking-wide text-editor-muted;
}

.modal-textarea {
  @apply min-h-[240px] w-full flex-1 resize-none rounded-editor-card border border-editor-border bg-editor-bg p-3 font-mono text-[12px] leading-[1.6] text-editor-text outline-none transition-colors placeholder:text-editor-muted/70 focus:border-editor-primary;
}

.modal-footer {
  @apply flex shrink-0 items-center justify-end gap-2 border-t border-editor-border/70 bg-editor-surface px-4 py-3 sm:px-5;
}

.modal-button {
  @apply inline-flex min-h-9 items-center justify-center rounded-editor-card border px-4 py-2 text-[12px] leading-none font-medium tracking-wide transition-colors active:scale-95 disabled:cursor-not-allowed disabled:opacity-45;
}

.modal-button-secondary {
  @apply border-editor-border bg-editor-muted-surface text-editor-muted hover:bg-[#eeeeec] hover:text-editor-text;
}

.modal-button-primary {
  @apply border-editor-primary bg-editor-primary text-white hover:opacity-90;
}

.modal-button-subtle {
  @apply border-transparent bg-transparent text-editor-muted hover:bg-editor-muted-surface hover:text-editor-text;
}

.modal-select-button {
  @apply flex w-full items-center justify-between gap-3 rounded-editor-card border border-editor-border bg-editor-bg px-3 py-2.5 text-left text-[14px] leading-[1.5] font-normal text-editor-text outline-none transition-colors focus:border-editor-primary disabled:cursor-not-allowed disabled:opacity-45;
}

.modal-select-menu {
  @apply absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-editor-card border border-editor-border bg-editor-surface shadow-editor-fab;
}

.modal-select-option {
  @apply flex w-full items-center justify-between gap-3 border-0 bg-transparent px-3 py-2.5 text-left text-[14px] leading-[1.5] text-editor-text transition-colors hover:bg-editor-muted-surface;
}

.modal-select-option-active {
  @apply bg-editor-primary-soft/50 font-medium text-editor-primary;
}
</style>
