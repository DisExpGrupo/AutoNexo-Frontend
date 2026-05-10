<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { serviceRequestService } from '@/modules/matching/services/service-request.service';
import type { ServiceRequest } from '@/modules/matching/services/service-request.service';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/services/vehicle.service';

const route = useRoute();
const router = useRouter();

const request = ref<ServiceRequest | null>(null);
const vehicle = ref<Vehicle | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  const id = Number(route.params.id);
  if (isNaN(id)) {
    error.value = 'Invalid service request ID.';
    loading.value = false;
    return;
  }
  try {
    const [req, vehicles] = await Promise.all([
      serviceRequestService.getServiceRequestById(id),
      vehicleService.getMyVehicles(),
    ]);
    request.value = req;
    vehicle.value = vehicles.find((v) => v.id === req.vehicleId) || null;
  } catch {
    error.value = 'Failed to load service request details.';
  } finally {
    loading.value = false;
  }
});

function goBack() {
  if (vehicle.value) {
    router.push({ name: 'vehicle-detail', params: { id: vehicle.value.id } });
  } else {
    router.push({ name: 'dashboard' });
  }
}

const STATUS_LABELS: Record<ServiceRequest['status'], string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const STATUS_CLASS: Record<ServiceRequest['status'], string> = {
  PENDING: 'status-pending',
  COMPLETED: 'status-completed',
  REJECTED: 'status-rejected',
  CANCELLED: 'status-cancelled',
};
</script>

<template>
  <div class="an-dashboard">
    <div class="an-dashboard-header">
      <div class="header-back">
        <button class="back-btn" @click="goBack" aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back
        </button>
      </div>
      <h1 class="an-dashboard-title">Service Request</h1>
      <p class="an-dashboard-subtitle">Details of your service request.</p>
    </div>

    <template v-if="loading">
      <div class="detail-loading">
        <p class="detail-loading-text">Loading...</p>
      </div>
    </template>

    <template v-else-if="error">
      <div class="detail-error" role="alert">
        {{ error }}
      </div>
    </template>

    <template v-else-if="request">
      <div class="request-layout">
        <div class="request-main">
          <div class="request-card">
            <div class="request-header">
              <div>
                <span class="request-id">Request #{{ request.id }}</span>
                <div class="request-meta">
                  <span :class="['status-badge', STATUS_CLASS[request.status]]">
                    {{ STATUS_LABELS[request.status] }}
                  </span>
                  <span class="request-date">Created {{ new Date(request.createdAt).toLocaleDateString() }}</span>
                </div>
              </div>
            </div>

            <div class="request-section">
              <h3 class="section-title">Requested Services</h3>
              <ul class="services-list">
                <li v-for="service in request.requestedServices" :key="service" class="service-item">
                  {{ service }}
                </li>
              </ul>
            </div>

            <div class="request-section">
              <h3 class="section-title">Description</h3>
              <p class="description-text">{{ request.description }}</p>
            </div>

            <div class="request-section">
              <h3 class="section-title">Search Parameters</h3>
              <div class="params-grid">
                <div class="param-item">
                  <span class="param-label">Radius</span>
                  <span class="param-value">{{ request.searchRadiusKm }} km</span>
                </div>
                <div class="param-item">
                  <span class="param-label">Location</span>
                  <span class="param-value">{{ request.latitude.toFixed(4) }}, {{ request.longitude.toFixed(4) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="request-card">
            <h3 class="section-title">Offers</h3>
            <div class="offers-empty">
              <svg class="offers-spinner" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <circle cx="16" cy="16" r="12" stroke="rgba(121, 154, 183, 0.2)" stroke-width="4"/>
                <path d="M16 4c-6.627 0-12 5.373-12 12" stroke="#799AB7" stroke-width="4" stroke-linecap="round"/>
              </svg>
              <p class="offers-empty-text">Waiting for offers...</p>
            </div>
          </div>
        </div>

        <div v-if="vehicle" class="request-sidebar">
          <div class="vehicle-card">
            <div class="vehicle-card-header">
              <div class="vehicle-icon">
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <rect width="40" height="40" rx="12" fill="rgba(27, 122, 90, 0.15)"/>
                  <path d="M10 26V18L14 14H26L30 18V26H10Z" stroke="#1B7A5A" stroke-width="2" stroke-linejoin="round"/>
                  <circle cx="15" cy="26" r="2" fill="#1B7A5A"/>
                  <circle cx="25" cy="26" r="2" fill="#1B7A5A"/>
                  <path d="M16 14H24" stroke="#1B7A5A" stroke-width="2"/>
                </svg>
              </div>
              <div>
                <h4 class="vehicle-name">{{ vehicle.model }}</h4>
                <p class="vehicle-plate">{{ vehicle.licensePlate }}</p>
              </div>
            </div>
            <div class="vehicle-details">
              <div class="vehicle-detail">
                <span class="vehicle-detail-label">Year</span>
                <span class="vehicle-detail-value">{{ vehicle.year }}</span>
              </div>
              <div class="vehicle-detail">
                <span class="vehicle-detail-label">Color</span>
                <span class="vehicle-detail-value">{{ vehicle.color }}</span>
              </div>
              <div class="vehicle-detail">
                <span class="vehicle-detail-label">Mileage</span>
                <span class="vehicle-detail-value">{{ vehicle.currentMileage.toLocaleString() }} km</span>
              </div>
            </div>
            <button class="vehicle-link-btn" @click="router.push({ name: 'vehicle-detail', params: { id: vehicle.id } })">
              View Vehicle
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M5 3L9 7L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.header-back {
  margin-bottom: 8px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: #799AB7;
  cursor: pointer;
  padding: 6px 0;
  transition: color 0.15s;
}

.back-btn:hover {
  color: #F8FAFC;
}

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 64px;
}

.detail-loading-text {
  font-family: 'Inter', sans-serif;
  color: #799AB7;
  font-size: 1rem;
}

.detail-error {
  background: rgba(128, 12, 31, 0.15);
  border: 1px solid #800C1F;
  border-radius: 8px;
  padding: 16px 20px;
  color: #F8FAFC;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
}

.request-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  align-items: start;
}

.request-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.request-card {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 16px;
  padding: 28px;
}

.request-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(94, 119, 149, 0.15);
}

.request-id {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #799AB7;
}

.request-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.status-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 4px;
}

.status-pending {
  color: #F59E0B;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-completed {
  color: #1B7A5A;
  background: rgba(27, 122, 90, 0.15);
  border: 1px solid rgba(27, 122, 90, 0.3);
}

.status-rejected {
  color: #800C1F;
  background: rgba(128, 12, 31, 0.15);
  border: 1px solid rgba(128, 12, 31, 0.3);
}

.status-cancelled {
  color: #799AB7;
  background: rgba(121, 154, 183, 0.15);
  border: 1px solid rgba(121, 154, 183, 0.3);
}

.request-date {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: #799AB7;
}

.request-section {
  margin-bottom: 24px;
}

.request-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #799AB7;
  margin: 0 0 12px;
}

.services-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.service-item {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #F8FAFC;
  background: rgba(27, 122, 90, 0.1);
  border: 1px solid rgba(27, 122, 90, 0.2);
  padding: 6px 14px;
  border-radius: 20px;
}

.description-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: #F8FAFC;
  line-height: 1.6;
  margin: 0;
}

.params-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #799AB7;
}

.param-value {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  color: #F8FAFC;
}

.offers-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  gap: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.offers-spinner {
  animation: spin 1.2s linear infinite;
}

.offers-empty-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #799AB7;
  margin: 0;
}

.request-sidebar {
  position: sticky;
  top: 24px;
}

.vehicle-card {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 16px;
  padding: 24px;
}

.vehicle-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(94, 119, 149, 0.15);
}

.vehicle-icon {
  flex-shrink: 0;
}

.vehicle-name {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 4px;
}

.vehicle-plate {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: #1B7A5A;
  margin: 0;
  letter-spacing: 0.05em;
}

.vehicle-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.vehicle-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vehicle-detail-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #799AB7;
}

.vehicle-detail-value {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #F8FAFC;
}

.vehicle-link-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  background: rgba(27, 122, 90, 0.1);
  border: 1px solid rgba(27, 122, 90, 0.25);
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1B7A5A;
  padding: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.vehicle-link-btn:hover {
  background: rgba(27, 122, 90, 0.2);
}

@media (max-width: 768px) {
  .request-layout {
    grid-template-columns: 1fr;
  }

  .request-sidebar {
    position: static;
  }
}

@media (max-width: 480px) {
  .request-card {
    padding: 20px;
  }

  .params-grid {
    grid-template-columns: 1fr;
  }
}
</style>