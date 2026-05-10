<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
</script>

<template>
  <div class="min-h-screen">
    <a
      href="#main-content"
      class="skip-link"
    >
      Skip to main content
    </a>
    <Toast />
    <RouterView />
  </div>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  z-index: 9999;
  padding: 12px 24px;
  background: var(--an-teal);
  color: var(--an-white);
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 0.85rem;
  border-radius: 8px;
  text-decoration: none;
  transition: top 0.15s ease;
}

.skip-link:focus {
  top: 16px;
  outline: 2px solid var(--an-white);
  outline-offset: 2px;
}
</style>
