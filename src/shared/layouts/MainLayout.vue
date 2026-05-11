<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import TheToolbar from '@/shared/components/TheToolbar.vue';
import AppSidebar from '@/shared/components/AppSidebar.vue';

const isDesktop = ref(true);
const isSidebarVisible = ref(true);

function checkDesktop() {
  isDesktop.value = window.innerWidth >= 1024;
  if (isDesktop.value) {
    isSidebarVisible.value = true;
  } else {
    isSidebarVisible.value = false;
  }
}

function toggleSidebar() {
  isSidebarVisible.value = !isSidebarVisible.value;
}

function closeSidebar() {
  if (!isDesktop.value) {
    isSidebarVisible.value = false;
  }
}

onMounted(() => {
  checkDesktop();
  window.addEventListener('resize', checkDesktop);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkDesktop);
});
</script>

<template>
  <div class="an-layout">
    <TheToolbar @toggle-sidebar="toggleSidebar" />

    <div class="an-layout-body">
      <AppSidebar
        :class="{
          'an-sidebar--visible': isSidebarVisible,
          'an-sidebar--collapsed': isDesktop && !isSidebarVisible,
        }"
        @item-click="closeSidebar"
      />

      <div
        v-if="isSidebarVisible && !isDesktop"
        class="an-sidebar-backdrop"
        @click="closeSidebar"
      />

      <main
        id="main-content"
        class="an-layout-main"
        :class="{ 'an-layout-main--expanded': isDesktop && !isSidebarVisible }"
        role="main"
      >
        <RouterView />
      </main>
    </div>
  </div>
</template>
