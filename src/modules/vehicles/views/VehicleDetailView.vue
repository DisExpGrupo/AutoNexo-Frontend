<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/services/vehicle.service';
import { serviceRequestService } from '@/modules/matching/services/service-request.service';
import type { ServiceRequest } from '@/modules/matching/services/service-request.service';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const vehicle = ref<Vehicle | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const activeRequest = ref<ServiceRequest | null>(null);
const cancelling = ref(false);
const showConfirm = ref(false);

onMounted(async () => {
  const id = Number(route.params.id);
  if (isNaN(id)) {
    error.value = 'Invalid vehicle ID.';
    loading.value = false;
    return;
  }
  try {
    const [v, requests] = await Promise.all([
      vehicleService.getVehicleById(id),
      serviceRequestService.getMyServiceRequests('PENDING'),
    ]);
    vehicle.value = v;
    activeRequest.value = requests.find((r) => r.vehicleId === id) || null;
  } catch {
    error.value = 'Failed to load vehicle details.';
  } finally {
    loading.value = false;
  }
});

function requestService() {
  router.push({ name: 'create-service-request', query: { vehicleId: String(vehicle.value!.id) } });
}

function viewRequestDetails() {
  if (activeRequest.value) {
    router.push({ name: 'service-request-detail', params: { id: activeRequest.value.id } });
  }
}

function cancelRequest() {
  showConfirm.value = false;
  if (!activeRequest.value) return;
  cancelling.value = true;
  serviceRequestService.cancelServiceRequest(activeRequest.value.id)
    .then(() => {
      activeRequest.value = null;
      toast.add({ severity: 'success', summary: 'Cancelled', detail: 'Service request cancelled.', life: 3000 });
    })
    .catch(() => {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to cancel request.', life: 4000 });
    })
    .finally(() => {
      cancelling.value = false;
    });
}
</script>

<template>
  <div class="an-dashboard">
    <div v-if="showConfirm" class="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div class="confirm-backdrop" @click="showConfirm = false"></div>
      <div class="confirm-dialog">
        <div class="confirm-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 3C9.373 3 4 8.373 4 15s5.373 12 12 12 12-5.373 12-12S22.627 3 16 3zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z" fill="#F59E0B"/>
            <circle cx="16" cy="16" r="2" fill="#F59E0B"/>
          </svg>
        </div>
        <h3 id="confirm-title" class="confirm-title">Cancel Service Request?</h3>
        <p class="confirm-message">Are you sure you want to cancel this pending service request? This action cannot be undone.</p>
        <div class="confirm-actions">
          <button class="confirm-btn-cancel" @click="showConfirm = false">Keep Request</button>
          <button class="confirm-btn-confirm" @click="cancelRequest">Cancel Request</button>
        </div>
      </div>
    </div>

    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">Vehicle Details</h1>
      <p class="an-dashboard-subtitle">View your vehicle information and request services.</p>
    </div>

    <template v-if="loading">
      <div class="detail-loading">
        <p class="detail-loading-text">Loading vehicle...</p>
      </div>
    </template>

    <template v-else-if="error">
      <div class="detail-error" role="alert">
        {{ error }}
      </div>
    </template>

    <template v-else-if="vehicle">
      <div class="detail-card">
        <div class="detail-header">
          <div class="detail-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect width="40" height="40" rx="12" fill="rgba(27, 122, 90, 0.15)"/>
              <path d="M10 26V18L14 14H26L30 18V26H10Z" stroke="#1B7A5A" stroke-width="2" stroke-linejoin="round"/>
              <circle cx="15" cy="26" r="2" fill="#1B7A5A"/>
              <circle cx="25" cy="26" r="2" fill="#1B7A5A"/>
              <path d="M16 14H24" stroke="#1B7A5A" stroke-width="2"/>
            </svg>
          </div>
          <div class="detail-header-info">
            <div class="detail-header-title">
              <h2 class="detail-vehicle-name">{{ vehicle.model }}</h2>
              <span v-if="activeRequest" class="detail-status-badge">
                Pending Request
              </span>
            </div>
            <p class="detail-vehicle-plate">{{ vehicle.licensePlate }}</p>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-item-label">Brand ID</span>
            <span class="detail-item-value">{{ vehicle.brandId }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item-label">Year</span>
            <span class="detail-item-value">{{ vehicle.year }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item-label">Color</span>
            <span class="detail-item-value">{{ vehicle.color }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item-label">Current Mileage</span>
            <span class="detail-item-value">{{ vehicle.currentMileage.toLocaleString() }} km</span>
          </div>
          <div class="detail-item detail-item--full">
            <span class="detail-item-label">VIN</span>
            <span class="detail-item-value detail-item-value--mono">{{ vehicle.vin }}</span>
          </div>
        </div>

        <div class="detail-actions">
          <button
            v-if="activeRequest"
            class="detail-btn-secondary"
            :disabled="cancelling"
            @click="showConfirm = true"
          >
            Cancel Request
          </button>
          <button
            v-if="activeRequest"
            class="detail-btn-primary"
            @click="viewRequestDetails"
          >
            View Request Details
          </button>
          <button
            v-else
            class="detail-btn-primary"
            @click="requestService"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M9 1.5v15M1.5 9h15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Request Service
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
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

.detail-card {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(94, 119, 149, 0.15);
}

.detail-icon {
  flex-shrink: 0;
}

.detail-header-info {
  flex: 1;
}

.detail-header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.detail-status-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #1B7A5A;
  background: rgba(27, 122, 90, 0.15);
  border: 1px solid rgba(27, 122, 90, 0.3);
  padding: 3px 8px;
  border-radius: 4px;
}

.detail-vehicle-name {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.25rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0;
}

.detail-vehicle-plate {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1B7A5A;
  margin: 0;
  letter-spacing: 0.05em;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item--full {
  grid-column: 1 / -1;
}

.detail-item-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #799AB7;
}

.detail-item-value {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: #F8FAFC;
}

.detail-item-value--mono {
  font-family: 'IBM Plex Mono', monospace;
  letter-spacing: 0.1em;
  font-size: 0.875rem;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid rgba(94, 119, 149, 0.15);
}

.detail-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1B7A5A;
  border: none;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 12px 28px;
  color: #F8FAFC;
  cursor: pointer;
  transition: background 0.15s;
  letter-spacing: 0.03em;
}

.detail-btn-primary:hover {
  background: #165c48;
}

.detail-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px solid #800C1F;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 12px 28px;
  color: #800C1F;
  cursor: pointer;
  transition: background 0.15s;
  letter-spacing: 0.03em;
}

.detail-btn-secondary:hover:not(:disabled) {
  background: rgba(128, 12, 31, 0.1);
}

.detail-btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .detail-card {
    padding: 24px 20px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(10, 15, 20, 0.75);
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  position: relative;
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.2);
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.confirm-icon {
  margin-bottom: 16px;
}

.confirm-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.125rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 12px;
}

.confirm-message {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #799AB7;
  margin: 0 0 28px;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn-cancel {
  background: transparent;
  border: 1px solid rgba(94, 119, 149, 0.3);
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 10px 24px;
  color: #799AB7;
  cursor: pointer;
  transition: all 0.15s;
}

.confirm-btn-cancel:hover {
  background: rgba(94, 119, 149, 0.1);
  color: #F8FAFC;
}

.confirm-btn-confirm {
  background: #800C1F;
  border: none;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 10px 24px;
  color: #F8FAFC;
  cursor: pointer;
  transition: background 0.15s;
}

.confirm-btn-confirm:hover {
  background: #a01026;
}
</style>