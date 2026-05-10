<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/modules/iam/store/auth';
import { UserRole } from '@/modules/iam/models/auth.model';

const authStore = useAuthStore();

const sidebarItems = computed(() => {
  const role = authStore.userRole;
  const hasWorkshop = authStore.workshopId !== null;

  const base = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
  ];

  if (role === UserRole.CAR_OWNER) {
    return [
      ...base,
      { label: 'My Vehicles', icon: 'pi pi-car', route: '/vehicles' },
      { label: 'Service Requests', icon: 'pi pi-wrench', route: '/service-requests' },
      { label: 'History', icon: 'pi pi-history', route: '/history' },
    ];
  }

  if (role === UserRole.WORKSHOP_MANAGER || role === UserRole.WORKSHOP_EMPLOYEE) {
    if (hasWorkshop) {
      return [
        ...base,
        { label: 'My Workshop', icon: 'pi pi-building', route: '/workshop' },
        { label: 'Requests', icon: 'pi pi-inbox', route: '/requests' },
        { label: 'Team', icon: 'pi pi-users', route: '/team' },
      ];
    }

    return [
      ...base,
      { label: 'Register Workshop', icon: 'pi pi-plus', route: '/workshop/register' },
    ];
  }

  return base;
});

defineEmits<{
  'item-click': [];
}>();
</script>

<template>
  <nav class="an-sidebar" aria-label="Main navigation">
    <div class="an-sidebar-header">
      <span class="an-sidebar-logo">AutoNexo</span>
    </div>

    <ul class="an-sidebar-nav" role="list">
      <li
        v-for="item in sidebarItems"
        :key="item.label"
        class="an-sidebar-nav-item"
        :class="{ 'an-sidebar-nav-item--active': $route.path === item.route }"
      >
        <RouterLink
          :to="item.route"
          class="an-sidebar-nav-link"
          @click="$emit('item-click')"
        >
          <i :class="item.icon" class="an-sidebar-nav-icon" />
          <span class="an-sidebar-nav-label">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>