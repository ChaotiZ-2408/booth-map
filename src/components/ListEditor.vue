<script setup lang="ts">
import { computed, ref } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import { DEFAULT_LIST_ITEM_STYLE } from "@/data/listItemStyles";
import { useListStore } from "@/stores/listStore";
import type { ListItem } from "@/types/listItem";
import ListDataManagerModal from "./ListDataManagerModal.vue";
import ListItemComponent from "./ListItem.vue";
import IconTextButton from "./common/IconTextButton.vue";
import AppIcon from "./icons/AppIcon.vue";
import MapListStatistics from "@/components/MapListStatistics.vue";

const listStore = useListStore();

const expandedIds = ref<number[]>([]);
const editingIds = ref<number[]>([]);
const showDataModal = ref(false);
const showDragHandles = ref(false);

const listItems = computed({
  get: () => listStore.listItems,
  set: (value) => listStore.setListItems(value),
});

function handleImport(listItemsData: ListItem[]) {
  listItems.value = listItemsData;
  save();
}

function isExpanded(id: number) {
  return expandedIds.value.includes(id);
}

function isEditing(id: number) {
  return editingIds.value.includes(id);
}

function toggleExpand(id: number) {
  expandedIds.value = isExpanded(id)
    ? expandedIds.value.filter((item) => item !== id)
    : [...expandedIds.value, id];
}

function toggleEdit(id: number) {
  editingIds.value = isEditing(id)
    ? editingIds.value.filter((item) => item !== id)
    : [...editingIds.value, id];

  save();
}

function save() {
  listStore.save();
}

function getNextListItemId() {
  if (!listItems.value.length) return 1;
  return Math.max(...listItems.value.map((listItem) => listItem.id)) + 1;
}

function addListItem() {
  const listItem: ListItem = {
    id: getNextListItemId(),
    boothId: "",
    enabled: true,
    priority: listItems.value.length + 1,
    authorNames: [],
    purchaseItems: [],
    exchangeGifts: [],
    tags: [],
    style: DEFAULT_LIST_ITEM_STYLE,
    note: "",
  };

  listItems.value.push(listItem);
  expandedIds.value.push(listItem.id);
  editingIds.value.push(listItem.id);
  save();
}

function removeListItem(id: number) {
  listStore.removeListItem(id);
}
</script>

<template>
  <section class="page-shell">
    <div class="editor-container">
      <div class="editor-topbar">
        <div class="flex items-center gap-3">
          <MapListStatistics :list-items="listItems" />

          <div class="ml-auto flex items-center gap-2">
            <button
              type="button"
              class="editor-toolbar-button"
              @click="showDataModal = true"
            >
              匯入/匯出
            </button>

            <button
              type="button"
              class="editor-toolbar-icon-button"
              :class="{
                'editor-toolbar-icon-button-active': showDragHandles,
              }"
              :aria-pressed="showDragHandles"
              aria-label="切換拖曳排序手把"
              title="切換拖曳排序手把"
              @click="showDragHandles = !showDragHandles"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-arrow-down-up"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5m-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <VueDraggable
        v-model="listItems"
        handle=".drag-bar"
        :animation="150"
        class="list-item-list"
        @end="save"
      >
        <ListItemComponent
          v-for="listItem in listItems"
          :key="listItem.id"
          :list-item="listItem"
          :is-expanded="isExpanded(listItem.id)"
          :is-editing="isEditing(listItem.id)"
          :show-drag-handle="showDragHandles"
          @toggle-expand="toggleExpand"
          @toggle-edit="toggleEdit"
          @remove-list-item="removeListItem"
          @save="save"
        />
      </VueDraggable>

      <IconTextButton extra-class="editor-fab" @click="addListItem">
        <template #icon>
          <AppIcon name="plus" class="h-6 w-6" />
        </template>
      </IconTextButton>
    </div>

    <ListDataManagerModal
      v-model="showDataModal"
      :list-items="listItems"
      @save="handleImport"
    />
  </section>
</template>

<style scoped>
@reference "../style.css";

.page-shell {
  @apply h-full overflow-y-auto bg-editor-bg text-editor-text;
}

.editor-container {
  @apply mx-auto flex min-h-full max-w-xl flex-col;
}

.editor-topbar {
  @apply sticky top-0 z-20 border-b border-editor-border/30 bg-editor-bg/0 px-5 py-3 backdrop-blur-sm;
}

.editor-title {
  @apply text-[20px] leading-[1.4] font-medium text-editor-text;
}

.editor-toolbar-button {
  @apply inline-flex items-center justify-center rounded-editor-card border border-editor-border/80 bg-editor-muted-surface px-3 py-1.5 text-[12px] leading-none font-medium tracking-wide text-editor-muted transition-colors hover:bg-[#eeeeec] active:scale-95;
}

.editor-toolbar-icon-button {
  @apply inline-flex h-7 w-7 items-center justify-center rounded-editor-card border border-editor-border/80 bg-editor-muted-surface text-editor-muted transition-colors hover:bg-[#eeeeec] active:scale-95;
}

.editor-toolbar-icon-button-active {
  @apply border-editor-primary bg-editor-primary text-white hover:bg-editor-primary;
}

.list-item-list {
  @apply flex flex-col gap-3 px-5 py-6 pb-28;
}

.editor-fab {
  @apply fixed right-4 bottom-16 z-30 flex h-12 w-12 items-center justify-center rounded-md border border-editor-border/70 bg-editor-accent p-0 text-editor-primary shadow-editor-fab transition-transform active:scale-95;
}

.editor-fab > :deep(span) {
  @apply hidden;
}
</style>
