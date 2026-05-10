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
      <p class="an-dashboard-subtitle">Manage your vehicles and service requests from one place.</p>
    </div>

    <div class="an-dashboard-grid">
      <div class="an-dashboard-card">
        <div class="an-dashboard-card-icon">
          <i class="pi pi-car" />
        </div>
        <h3 class="an-dashboard-card-label">My Vehicles</h3>
        <p class="an-dashboard-card-value">0</p>
      </div>

      <div class="an-dashboard-card">
        <div class="an-dashboard-card-icon an-dashboard-card-icon--warning">
          <i class="pi pi-exclamation-circle" />
        </div>
        <h3 class="an-dashboard-card-label">Pending Service</h3>
        <p class="an-dashboard-card-value">0</p>
      </div>

      <div class="an-dashboard-card">
        <div class="an-dashboard-card-icon an-dashboard-card-icon--success">
          <i class="pi pi-check-circle" />
        </div>
        <h3 class="an-dashboard-card-label">Completed</h3>
        <p class="an-dashboard-card-value">0</p>
      </div>

      <div class="an-dashboard-card">
        <div class="an-dashboard-card-icon">
          <i class="pi pi-clock" />
        </div>
        <h3 class="an-dashboard-card-label">Service History</h3>
        <p class="an-dashboard-card-value">0</p>
      </div>
    </div>
  </div>
</template>
