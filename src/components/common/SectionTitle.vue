<template>
  <component :is="as" class="section-label flex items-center gap-1.5">
    <slot name="icon" />
    <span>{{ title }}</span>
  </component>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    as?: 'label' | 'h2' | 'div'
  }>(),
  {
    as: 'label',
  }
)
</script>

