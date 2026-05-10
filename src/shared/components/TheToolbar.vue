<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/iam/store/auth';

const router = useRouter();
const authStore = useAuthStore();
const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggleMenu();
  }
  if (event.key === 'Escape') {
    closeMenu();
  }
}

function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    closeMenu();
  }
}

function handleSignOut() {
  authStore.logout();
  router.push('/login');
}

function getInitials(): string {
  const user = authStore.user;
  if (!user) return '?';
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
}

function getDisplayName(): string {
  const user = authStore.user;
  if (!user) return 'User';
  return `${user.firstName} ${user.lastName}`;
}

defineEmits<{
  'toggle-sidebar': [];
}>();

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <header class="toolbar" role="banner">
    <div class="toolbar-start">
      <button
        class="toolbar-menu-btn"
        type="button"
        @click="$emit('toggle-sidebar')"
        aria-label="Toggle navigation menu"
      >
        <i class="pi pi-bars" aria-hidden="true" />
      </button>
      <span class="toolbar-brand">AutoNexo</span>
    </div>

    <div class="toolbar-end" ref="menuRef">
      <button
        class="toolbar-user"
        type="button"
        @click="toggleMenu"
        @keydown="handleKeydown"
        :aria-expanded="menuOpen"
        :aria-label="`User menu for ${getDisplayName()}`"
        :aria-controls="menuOpen ? 'user-dropdown' : undefined"
      >
        <span class="toolbar-user-name">{{ getDisplayName() }}</span>
        <span class="toolbar-avatar" aria-hidden="true">
          {{ getInitials() }}
        </span>
      </button>

      <div
        v-if="menuOpen"
        id="user-dropdown"
        class="toolbar-dropdown"
        role="menu"
      >
        <button
          class="toolbar-dropdown-item"
          role="menuitem"
          @click="router.push({ name: 'profile' }); closeMenu()"
        >
          <i class="pi pi-user" aria-hidden="true" />
          <span>Profile</span>
        </button>
        <button
          class="toolbar-dropdown-item"
          role="menuitem"
          @click="router.push({ name: 'settings' }); closeMenu()"
        >
          <i class="pi pi-cog" aria-hidden="true" />
          <span>Settings</span>
        </button>
        <div class="toolbar-dropdown-divider" role="separator" />
        <button
          class="toolbar-dropdown-item toolbar-dropdown-item--danger"
          role="menuitem"
          @click="handleSignOut"
        >
          <i class="pi pi-sign-out" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  </header>
</template>
