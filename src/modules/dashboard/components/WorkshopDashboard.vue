<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/modules/iam/store/auth';
import { workshopService } from '@/modules/workshop/services/workshop.service';
import type { Workshop } from '@/modules/workshop/services/workshop.service';
import Button from 'primevue/button';

const authStore = useAuthStore();

const workshop = ref<Workshop | null>(null);
const loading = ref(true);

authStore.workshopId
  ? workshopService.getMyWorkshop()
      .then((w) => {
        workshop.value = w;
        authStore.setWorkshopId(w.id);
      })
      .catch(() => {
        workshop.value = null;
      })
      .finally(() => { loading.value = false; })
  : (loading.value = false);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
</script>

<template>
  <div class="an-dashboard">
    <template v-if="loading">
      <div class="an-dashboard-header">
        <h1 class="an-dashboard-title">{{ getGreeting() }}, {{ authStore.user?.firstName }}</h1>
        <p class="an-dashboard-subtitle">Loading workshop data...</p>
      </div>
    </template>

    <template v-else-if="!workshop">
      <div class="an-dashboard-header">
        <h1 class="an-dashboard-title">{{ getGreeting() }}, {{ authStore.user?.firstName }}</h1>
        <p class="an-dashboard-subtitle">Welcome to AutoNexo. Register your workshop to get started.</p>
      </div>

      <div class="workshop-empty-state">
        <div class="workshop-empty-icon">
          <i class="pi pi-building" />
        </div>
        <h2 class="workshop-empty-title">No Workshop Registered</h2>
        <p class="workshop-empty-text">
          You haven't set up your workshop yet. Create your workshop profile to start receiving service requests from car owners.
        </p>
        <Button
          label="Register My Workshop"
          class="workshop-empty-btn"
          @click="$router.push({ name: 'workshop-registration' })"
        />
      </div>
    </template>

    <template v-else>
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
    </template>
  </div>
</template>

<style scoped>
.workshop-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 64px 32px;
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 16px;
  max-width: 520px;
  margin-top: 32px;
}

.workshop-empty-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(27, 122, 90, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.workshop-empty-icon .pi {
  font-size: 2rem;
  color: #1B7A5A;
}

.workshop-empty-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 12px;
}

.workshop-empty-text {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: #799AB7;
  margin: 0 0 32px;
  line-height: 1.6;
}

.workshop-empty-btn {
  background: #1B7A5A;
  border: none;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  padding: 12px 28px;
  color: #F8FAFC;
}

.workshop-empty-btn:hover {
  background: #165c48;
}
</style>