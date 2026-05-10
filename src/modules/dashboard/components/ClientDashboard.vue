<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/modules/iam/store/auth';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/services/vehicle.service';

const authStore = useAuthStore();

const vehicles = ref<Vehicle[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    vehicles.value = await vehicleService.getMyVehicles();
  } catch {
    vehicles.value = [];
  } finally {
    loading.value = false;
  }
});

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
        <p class="an-dashboard-subtitle">Loading your vehicles...</p>
      </div>
    </template>

    <template v-else-if="vehicles.length === 0">
      <div class="an-dashboard-header">
        <h1 class="an-dashboard-title">{{ getGreeting() }}, {{ authStore.user?.firstName }}</h1>
        <p class="an-dashboard-subtitle">Manage your vehicles and service requests from one place.</p>
      </div>

      <div class="vehicle-empty-state">
        <div class="vehicle-empty-icon">
          <i class="pi pi-car" />
        </div>
        <h2 class="vehicle-empty-title">No Vehicles Yet</h2>
        <p class="vehicle-empty-text">
          Register your first vehicle to start requesting services from workshops.
        </p>
        <button
          class="vehicle-empty-btn"
          @click="$router.push({ name: 'vehicle-registration' })"
        >
          Add My First Vehicle
        </button>
      </div>
    </template>

    <template v-else>
      <div class="an-dashboard-header">
        <h1 class="an-dashboard-title">{{ getGreeting() }}, {{ authStore.user?.firstName }}</h1>
        <p class="an-dashboard-subtitle">Manage your vehicles and service requests from one place.</p>
      </div>

      <div class="mb-6 flex justify-end">
        <button
          class="add-vehicle-btn"
          @click="$router.push({ name: 'vehicle-registration' })"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Add Vehicle
        </button>
      </div>

      <div class="vehicle-grid">
        <RouterLink
          v-for="vehicle in vehicles"
          :key="vehicle.id"
          :to="{ name: 'vehicle-detail', params: { id: vehicle.id } }"
          class="vehicle-card"
          :aria-label="`View details for ${vehicle.model}, plate ${vehicle.licensePlate}`"
        >
          <div class="vehicle-card-content">
            <div class="vehicle-card-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path d="M6 19V13.5L9 11H19L22 13.5V19H6Z" stroke="#1B7A5A" stroke-width="1.75" stroke-linejoin="round"/>
                <circle cx="10" cy="19" r="1.5" fill="#1B7A5A"/>
                <circle cx="18" cy="19" r="1.5" fill="#1B7A5A"/>
                <path d="M11 11H17" stroke="#1B7A5A" stroke-width="1.75"/>
              </svg>
            </div>
            <div class="vehicle-card-info">
              <h3 class="vehicle-card-title">{{ vehicle.model }}</h3>
              <p class="vehicle-card-subtitle">{{ vehicle.licensePlate }}</p>
              <p class="vehicle-card-meta">{{ vehicle.year }} · {{ vehicle.color }}</p>
            </div>
            <div class="vehicle-card-arrow" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="#5E7795" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.vehicle-empty-state {
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

.vehicle-empty-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(27, 122, 90, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.vehicle-empty-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 12px;
}

.vehicle-empty-text {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: #799AB7;
  margin: 0 0 32px;
  line-height: 1.6;
}

.vehicle-empty-btn {
  background: #1B7A5A;
  border: none;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  padding: 12px 28px;
  color: #F8FAFC;
}

.vehicle-empty-btn:hover {
  background: #165c48;
}

.add-vehicle-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1B7A5A;
  border: none;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 10px 20px;
  color: #F8FAFC;
  cursor: pointer;
  transition: background 0.15s;
}

.add-vehicle-btn:hover {
  background: #165c48;
}

.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.vehicle-card {
  display: block;
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 16px;
  padding: 20px;
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s;
  cursor: pointer;
}

.vehicle-card:hover {
  border-color: rgba(27, 122, 90, 0.4);
  background: rgba(27, 122, 90, 0.05);
}

.vehicle-card:focus-visible {
  outline: 2px solid #1B7A5A;
  outline-offset: 2px;
}

.vehicle-card-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.vehicle-card-arrow {
  margin-left: auto;
  flex-shrink: 0;
}

.vehicle-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(27, 122, 90, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vehicle-card-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 4px;
}

.vehicle-card-subtitle {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1B7A5A;
  margin: 0 0 4px;
  letter-spacing: 0.03em;
}

.vehicle-card-meta {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #799AB7;
  margin: 0;
}
</style>