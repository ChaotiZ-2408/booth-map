<script setup lang="ts">
import { computed } from 'vue'

type IconPath = {
  d: string
  fillRule?: 'evenodd' | 'nonzero'
  clipRule?: 'evenodd' | 'nonzero'
  strokeLinecap?: 'round' | 'butt' | 'square'
  strokeLinejoin?: 'round' | 'miter' | 'bevel'
}

type IconDef = {
  viewBox: string
  fill?: string
  stroke?: string
  strokeWidth?: string
  paths: IconPath[]
}

type IconName =
  | 'plus'
  | 'close-circle'
  | 'map-pin'
  | 'user-group'
  | 'shopping-bag'
  | 'gift-outline'
  | 'gift-solid'
  | 'note-solid'
  | 'tag-must-buy'
  | 'tag-new-item'
  | 'tag-limited'
  | 'tag-bonus'
  | 'tag-high-priority'
  | 'trash-x'
  | 'edit-pencil'
  | 'check-circle'

const ICONS: Record<IconName, IconDef> = {
  'plus': {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    paths: [
      { d: 'M12 4.5v15m7.5-7.5h-15', strokeLinecap: 'round', strokeLinejoin: 'round' },
    ],
  },
  'close-circle': {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    paths: [
      { d: 'm9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', strokeLinecap: 'round', strokeLinejoin: 'round' },
    ],
  },
  'map-pin': {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    paths: [
      { d: 'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z', strokeLinecap: 'round', strokeLinejoin: 'round' },
      { d: 'M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z', strokeLinecap: 'round', strokeLinejoin: 'round' },
    ],
  },
  'user-group': {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    paths: [
      { d: 'M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z', strokeLinecap: 'round', strokeLinejoin: 'round' },
    ],
  },
  'shopping-bag': {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    paths: [
      { d: 'M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z', strokeLinecap: 'round', strokeLinejoin: 'round' },
    ],
  },
  'gift-outline': {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    paths: [
      { d: 'M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z', strokeLinecap: 'round', strokeLinejoin: 'round' },
    ],
  },
  'gift-solid': {
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    paths: [
      { d: 'M14 6a2.5 2.5 0 0 0-4-3 2.5 2.5 0 0 0-4 3H3.25C2.56 6 2 6.56 2 7.25v.5C2 8.44 2.56 9 3.25 9h6V6h1.5v3h6C17.44 9 18 8.44 18 7.75v-.5C18 6.56 17.44 6 16.75 6H14Zm-1-1.5a1 1 0 0 1-1 1h-1v-1a1 1 0 1 1 2 0Zm-6 0a1 1 0 0 0 1 1h1v-1a1 1 0 0 0-2 0Z', fillRule: 'evenodd', clipRule: 'evenodd' },
      { d: 'M9.25 10.5H3v4.75A2.75 2.75 0 0 0 5.75 18h3.5v-7.5ZM10.75 18v-7.5H17v4.75A2.75 2.75 0 0 1 14.25 18h-3.5Z' },
    ],
  },
  'note-solid': {
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    paths: [
      { d: 'M10 3c-4.31 0-8 3.033-8 7 0 2.024.978 3.825 2.499 5.085a3.478 3.478 0 0 1-.522 1.756.75.75 0 0 0 .584 1.143 5.976 5.976 0 0 0 3.936-1.108c.487.082.99.124 1.503.124 4.31 0 8-3.033 8-7s-3.69-7-8-7Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-2-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z', fillRule: 'evenodd', clipRule: 'evenodd' },
    ],
  },
  'tag-must-buy': {
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    paths: [
      { d: 'M10 1.25c.414 0 .75.336.75.75v.537a6.75 6.75 0 0 1 2.823 1.2l.38-.38a.75.75 0 1 1 1.06 1.06l-.379.38a6.75 6.75 0 0 1 1.2 2.823H16.5a.75.75 0 0 1 0 1.5h-.537a6.75 6.75 0 0 1-1.2 2.823l.38.38a.75.75 0 1 1-1.06 1.06l-.38-.379a6.75 6.75 0 0 1-2.823 1.2V16a.75.75 0 0 1-1.5 0v-.537a6.75 6.75 0 0 1-2.823-1.2l-.38.38a.75.75 0 1 1-1.06-1.06l.379-.38a6.75 6.75 0 0 1-1.2-2.823H3.5a.75.75 0 0 1 0-1.5h.537a6.75 6.75 0 0 1 1.2-2.823l-.38-.38a.75.75 0 1 1 1.06-1.06l.38.379a6.75 6.75 0 0 1 2.823-1.2V2c0-.414.336-.75.75-.75Zm0 4a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z' },
    ],
  },
  'tag-new-item': {
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    paths: [
      { d: 'M3 3.75A1.75 1.75 0 0 1 4.75 2h6.69c.464 0 .909.184 1.237.513l3.56 3.56c.329.328.513.773.513 1.237v8.94A1.75 1.75 0 0 1 15 18H4.75A1.75 1.75 0 0 1 3 16.25V3.75ZM8.5 7a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Zm-1 3a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Z' },
    ],
  },
  'tag-limited': {
    viewBox: '-2 -2 20 20',
    fill: 'currentColor',
    stroke: 'currentColor',
    strokeWidth: '0.3',
    paths: [
      { d: 'M2.97 1.35A1 1 0 0 1 3.73 1h8.54a1 1 0 0 1 .76.35l2.609 3.044A1.5 1.5 0 0 1 16 5.37v.255a2.375 2.375 0 0 1-4.25 1.458A2.37 2.37 0 0 1 9.875 8 2.37 2.37 0 0 1 8 7.083 2.37 2.37 0 0 1 6.125 8a2.37 2.37 0 0 1-1.875-.917A2.375 2.375 0 0 1 0 5.625V5.37a1.5 1.5 0 0 1 .361-.976zm1.78 4.275a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 1 0 2.75 0V5.37a.5.5 0 0 0-.12-.325L12.27 2H3.73L1.12 5.045A.5.5 0 0 0 1 5.37v.255a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0' },
      { d: 'M1.5 8.5A.5.5 0 0 1 2 9v6h12V9a.5.5 0 0 1 1 0v6h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1V9a.5.5 0 0 1 .5-.5m2 .5a.5.5 0 0 1 .5.5V13h8V9.5a.5.5 0 0 1 1 0V13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5a.5.5 0 0 1 .5-.5' },
    ],
  },

  'tag-bonus': {
    viewBox: '-2 -2 20 20',
    fill: 'currentColor',
    stroke: 'currentColor',
    strokeWidth: '0.3',
    paths: [
      { d: 'm10.354 6.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708 0', fillRule: 'evenodd', clipRule: 'evenodd' },
      { d: 'm10.273 2.513-.921-.944.715-.698.622.637.89-.011a2.89 2.89 0 0 1 2.924 2.924l-.01.89.636.622a2.89 2.89 0 0 1 0 4.134l-.637.622.011.89a2.89 2.89 0 0 1-2.924 2.924l-.89-.01-.622.636a2.89 2.89 0 0 1-4.134 0l-.622-.637-.89.011a2.89 2.89 0 0 1-2.924-2.924l.01-.89-.636-.622a2.89 2.89 0 0 1 0-4.134l.637-.622-.011-.89a2.89 2.89 0 0 1 2.924-2.924l.89.01.622-.636a2.89 2.89 0 0 1 4.134 0l-.715.698a1.89 1.89 0 0 0-2.704 0l-.92.944-1.32-.016a1.89 1.89 0 0 0-1.911 1.912l.016 1.318-.944.921a1.89 1.89 0 0 0 0 2.704l.944.92-.016 1.32a1.89 1.89 0 0 0 1.912 1.911l1.318-.016.921.944a1.89 1.89 0 0 0 2.704 0l.92-.944 1.32.016a1.89 1.89 0 0 0 1.911-1.912l-.016-1.318.944-.921a1.89 1.89 0 0 0 0-2.704l-.944-.92.016-1.32a1.89 1.89 0 0 0-1.912-1.911z' },
    ],
  },
  'tag-high-priority': {
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    paths: [
      { d: 'M11.983 1.904a.75.75 0 0 0-1.466 0L9.64 5.75H6a.75.75 0 0 0-.53 1.28l2.952 2.952-.86 4.302a.75.75 0 0 0 1.11.79L11.25 13.5l2.578 1.574a.75.75 0 0 0 1.11-.79l-.86-4.302 2.952-2.952A.75.75 0 0 0 16.5 5.75h-3.64l-.877-3.846Z' },
    ],
  },
  'trash-x': {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    paths: [
      { d: 'm20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z', strokeLinecap: 'round', strokeLinejoin: 'round' },
    ],
  },
  'edit-pencil': {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    paths: [
      { d: 'm16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10', strokeLinecap: 'round', strokeLinejoin: 'round' },
    ],
  },
  'check-circle': {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    paths: [
      { d: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', strokeLinecap: 'round', strokeLinejoin: 'round' },
    ],
  },
}

const props = withDefaults(defineProps<{
  name: IconName
  class?: string
}>(), {
  class: 'h-4 w-4',
})

const icon = computed(() => ICONS[props.name])
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="icon.viewBox"
    :fill="icon.fill"
    :stroke="icon.stroke"
    :stroke-width="icon.strokeWidth"
    :class="props.class"
  >
    <path
      v-for="(path, index) in icon.paths"
      :key="index"
      :d="path.d"
      :fill-rule="path.fillRule"
      :clip-rule="path.clipRule"
      :stroke-linecap="path.strokeLinecap"
      :stroke-linejoin="path.strokeLinejoin"
    />
  </svg>
</template>
