<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/modules/iam/store/auth';
import { UserRole } from '@/modules/iam/models/auth.model';
import ClientDashboard from '@/modules/dashboard/components/ClientDashboard.vue';
import WorkshopDashboard from '@/modules/dashboard/components/WorkshopDashboard.vue';

const authStore = useAuthStore();

const isWorkshopRole = computed(() => {
  const role = authStore.userRole;
  return role === UserRole.WORKSHOP_MANAGER || role === UserRole.WORKSHOP_EMPLOYEE;
});
</script>

<template>
  <ClientDashboard v-if="authStore.userRole === UserRole.CAR_OWNER" />
  <WorkshopDashboard v-else-if="isWorkshopRole" />
  <div v-else class="an-dashboard">
    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">Welcome</h1>
      <p class="an-dashboard-subtitle">Your role is being configured. Please contact support.</p>
    </div>
  </div>
</template>
