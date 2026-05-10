<script setup lang="ts">
import { useAuthStore } from '@/modules/iam/store/auth';

const authStore = useAuthStore();

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
</script>

<template>
  <div class="an-dashboard">
    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">{{ getGreeting() }}, {{ authStore.user?.firstName }}</h1>
      <p class="an-dashboard-subtitle">Monitor your workshop operations and incoming requests.</p>
    </div>

    <div class="an-dashboard-grid">
      <div class="an-dashboard-card">
        <div class="an-dashboard-card-icon">
          <i class="pi pi-inbox" />
        </div>
        <h3 class="an-dashboard-card-label">Incoming Requests</h3>
        <p class="an-dashboard-card-value">0</p>
      </div>

      <div class="an-dashboard-card">
        <div class="an-dashboard-card-icon an-dashboard-card-icon--active">
          <i class="pi pi-cog" />
        </div>
        <h3 class="an-dashboard-card-label">In Progress</h3>
        <p class="an-dashboard-card-value">0</p>
      </div>

      <div class="an-dashboard-card">
        <div class="an-dashboard-card-icon an-dashboard-card-icon--success">
          <i class="pi pi-check-circle" />
        </div>
        <h3 class="an-dashboard-card-label">Completed Today</h3>
        <p class="an-dashboard-card-value">0</p>
      </div>

      <div class="an-dashboard-card">
        <div class="an-dashboard-card-icon">
          <i class="pi pi-users" />
        </div>
        <h3 class="an-dashboard-card-label">Active Staff</h3>
        <p class="an-dashboard-card-value">0</p>
      </div>
    </div>
  </div>
</template>
