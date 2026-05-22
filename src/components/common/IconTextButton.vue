<template>
  <button type="button" :class="buttonClass">
    <slot name="icon" />
    <span><slot /></span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'badge' | 'action'
    extraClass?: string
  }>(),
  {
    variant: 'badge',
    extraClass: '',
  }
)

const buttonClass = computed(() => {
  const base = props.variant === 'action' ? 'icon-action-button' : 'icon-badge-button'
  return props.extraClass ? `${base} ${props.extraClass}` : base
})
</script>

