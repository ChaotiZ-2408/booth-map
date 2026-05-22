<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { normalizeMapLayout, validateMapLayout } from "@/data/mapData";
import type { MapLayoutConfig } from "@/types/map";

const props = defineProps<{
  modelValue: boolean;
  layout: MapLayoutConfig;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "save", value: MapLayoutConfig): void;
}>();

const jsonText = ref("");

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

function openJson() {
  jsonText.value = JSON.stringify(
    {
      version: 1,
      layout: props.layout,
    },
    null,
    2
  );
}

async function copyJson() {
  await navigator.clipboard.writeText(jsonText.value);
}

async function loadExampleData() {
  try {
    const response = await fetch("./example-data/map-layout.json", { cache: "no-store" });
    if (!response.ok) throw new Error("load failed");
    const payload = await response.json();
    jsonText.value = JSON.stringify(payload, null, 2);
  } catch {
    alert("載入範例資料失敗");
  }
}

function importJson() {
  try {
    const parsed = JSON.parse(jsonText.value) as { layout?: unknown };
    if (!parsed.layout) return alert("蝻箏? layout 甈?");

    const normalized = normalizeMapLayout(parsed.layout);
    const error = validateMapLayout(normalized);
    if (error) return alert(error);

    emit("save", normalized);
    visible.value = false;
  } catch {
    alert("JSON 載入資料失敗");
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) openJson();
  }
);
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-end bg-black/30 backdrop-blur-sm" @click="visible = false">
      <div class="flex h-[85vh] w-full flex-col rounded-t-[28px] bg-white/80 p-3 backdrop-blur-xl" @click.stop>
        <div class="mb-3 flex items-center justify-between">
          <div>
            <div class="text-base font-semibold text-slate-700">地圖設定</div>
            <div class="text-xs text-slate-400">JSON 匯入 / 匯出</div>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="icon-badge-button" @click="loadExampleData">載入範例資料</button>
            <button type="button" class="icon-badge-button" @click="visible = false">關閉</button>
          </div>
        </div>

        <textarea v-model="jsonText" class="min-h-0 flex-1 resize-none rounded-2xl border border-slate-200 bg-white/70 p-3 font-mono text-xs text-slate-700 outline-none" spellcheck="false" />

        <div class="mt-3 grid grid-cols-2 gap-2">
          <button type="button" class="glass-button" @click="copyJson">複製JSON</button>
          <button type="button" class="icon-action-button confirm-button" @click="importJson">保存 JSON</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>



