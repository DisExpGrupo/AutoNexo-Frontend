<script setup lang="ts">
import { ref, shallowRef, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { serviceRequestService } from '@/modules/matching/services/service-request.service';
import type { ServiceRequest, ServiceRequestStatus } from '@/modules/matching/services/service-request.service';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/services/vehicle.service';
import { offerService } from '@/modules/matching/services/offer.service';
import type { Offer } from '@/modules/matching/services/offer.service';
import Button from 'primevue/button';

const router = useRouter();

const activeTab = ref<'active' | 'history'>('active');
const requests = shallowRef<ServiceRequest[]>([]);
const offers = shallowRef<Offer[]>([]);
const vehicles = shallowRef<Vehicle[]>([]);
const loading = ref(true);

const ACTIVE_STATUSES: ServiceRequestStatus[] = ['PENDING', 'COMPLETED'];

const HISTORY_STATUSES: ServiceRequestStatus[] = ['REJECTED', 'CANCELLED'];

const activeRequests = computed(() =>
  requests.value.filter((r) => ACTIVE_STATUSES.includes(r.status))
);

const historyRequests = computed(() =>
  requests.value.filter((r) => HISTORY_STATUSES.includes(r.status))
);

function getVehicle(vehicleId: number): Vehicle | undefined {
  return vehicles.value.find((v) => v.id === vehicleId);
}

function getAcceptedOffer(requestId: number): Offer | undefined {
  return offers.value.find((o) => o.serviceRequestId === requestId && o.status === 'ACCEPTED');
}

function getPendingOffersCount(requestId: number): number {
  return offers.value.filter((o) => o.serviceRequestId === requestId && o.status === 'PENDING').length;
}

const REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const REQUEST_STATUS_CLASS: Record<ServiceRequestStatus, string> = {
  PENDING: 'status-pending',
  COMPLETED: 'status-completed',
  REJECTED: 'status-rejected',
  CANCELLED: 'status-cancelled',
};

function formatPrice(amount: number, currency: string): string {
  if (!currency) return new Intl.NumberFormat('es-PE', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);
}

onMounted(async () => {
  try {
    const [reqs, allOffers, vehs] = await Promise.all([
      serviceRequestService.getMyServiceRequests(),
      offerService.getMyOffers(),
      vehicleService.getMyVehicles(),
    ]);
    requests.value = reqs;
    offers.value = allOffers;
    vehicles.value = vehs;
  } catch {
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="cor-hub">
    <div class="cor-hub-header">
      <h1 class="cor-hub-title">Service Requests</h1>
      <p class="cor-hub-subtitle">Track your active and past service requests.</p>
    </div>

    <div class="cor-tabs">
      <div class="tab-list" role="tablist">
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'active' }"
          role="tab"
          :aria-selected="activeTab === 'active'"
          @click="activeTab = 'active'"
        >
          Active
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'history' }"
          role="tab"
          :aria-selected="activeTab === 'history'"
          @click="activeTab = 'history'"
        >
          History
        </button>
      </div>

      <template v-if="activeTab === 'active'">
        <div class="tab-panel" role="tabpanel">
          <template v-if="loading">
            <div class="cor-loading">
              <p class="cor-loading-text">Loading your requests...</p>
            </div>
          </template>

          <template v-else-if="activeRequests.length === 0">
            <div class="cor-empty">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <path d="M14 24h20M24 14v20" stroke="#799AB7" stroke-width="2" stroke-linecap="round"/>
                <circle cx="24" cy="24" r="18" stroke="#799AB7" stroke-width="2"/>
              </svg>
              <p class="cor-empty-text">No active service requests.</p>
              <p class="cor-empty-hint">When you create a service request, it will appear here.</p>
            </div>
          </template>

          <template v-else>
            <div class="requests-grid">
              <article
                v-for="req in activeRequests"
                :key="req.id"
                class="request-card"
              >
                <div class="req-card-header">
                  <div class="req-vehicle">
                    <span class="req-vehicle-model">{{ getVehicle(req.vehicleId)?.model ?? 'Unknown Vehicle' }}</span>
                    <span class="req-vehicle-plate">{{ getVehicle(req.vehicleId)?.licensePlate ?? '—' }}</span>
                  </div>
                  <span :class="['status-badge', REQUEST_STATUS_CLASS[req.status]]">
                    {{ REQUEST_STATUS_LABELS[req.status] }}
                  </span>
                </div>

                <p class="req-description">{{ req.description }}</p>

                <div class="req-services">
                  <span v-for="svc in req.requestedServices" :key="svc" class="req-service-tag">{{ svc }}</span>
                </div>

                <template v-if="getAcceptedOffer(req.id)">
                  <div class="req-workshop-info">
                    <div class="req-workshop-detail">
                      <span class="req-workshop-label">Workshop</span>
                      <span class="req-workshop-value">#{{ getAcceptedOffer(req.id)!.workshopId }}</span>
                    </div>
                    <div class="req-workshop-detail">
                      <span class="req-workshop-label">Agreed Price</span>
                      <span class="req-workshop-value req-workshop-price">
                        {{ formatPrice(getAcceptedOffer(req.id)!.proposedPriceAmount, getAcceptedOffer(req.id)!.currency) }}
                      </span>
                    </div>
                  </div>
                </template>

                <template v-else-if="getPendingOffersCount(req.id) > 0">
                  <div class="req-pending-count">
                    <span>{{ getPendingOffersCount(req.id) }} offer{{ getPendingOffersCount(req.id) > 1 ? 's' : '' }} waiting</span>
                  </div>
                </template>

                <div class="req-card-footer">
                  <span class="req-date">Created {{ new Date(req.createdAt).toLocaleDateString() }}</span>
                  <Button
                    label="View Details"
                    severity="secondary"
                    outlined
                    size="small"
                    @click="router.push({ name: 'service-request-detail', params: { id: req.id } })"
                  />
                </div>
              </article>
            </div>
          </template>
        </div>
      </template>

      <template v-if="activeTab === 'history'">
        <div class="tab-panel" role="tabpanel">
          <template v-if="loading">
            <div class="cor-loading">
              <p class="cor-loading-text">Loading...</p>
            </div>
          </template>

          <template v-else-if="historyRequests.length === 0">
            <div class="cor-empty">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <circle cx="24" cy="24" r="20" stroke="#799AB7" stroke-width="2"/>
                <path d="M24 16v8M24 28h.01" stroke="#799AB7" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
              <p class="cor-empty-text">No history yet.</p>
              <p class="cor-empty-hint">Completed and cancelled requests will appear here.</p>
            </div>
          </template>

          <template v-else>
            <div class="requests-grid">
              <article
                v-for="req in historyRequests"
                :key="req.id"
                class="request-card"
              >
                <div class="req-card-header">
                  <div class="req-vehicle">
                    <span class="req-vehicle-model">{{ getVehicle(req.vehicleId)?.model ?? 'Unknown Vehicle' }}</span>
                    <span class="req-vehicle-plate">{{ getVehicle(req.vehicleId)?.licensePlate ?? '—' }}</span>
                  </div>
                  <span :class="['status-badge', REQUEST_STATUS_CLASS[req.status]]">
                    {{ REQUEST_STATUS_LABELS[req.status] }}
                  </span>
                </div>

                <p class="req-description">{{ req.description }}</p>

                <div class="req-services">
                  <span v-for="svc in req.requestedServices" :key="svc" class="req-service-tag">{{ svc }}</span>
                </div>

                <div class="req-card-footer">
                  <span class="req-date">Created {{ new Date(req.createdAt).toLocaleDateString() }}</span>
                  <Button
                    label="View Details"
                    severity="secondary"
                    outlined
                    size="small"
                    @click="router.push({ name: 'service-request-detail', params: { id: req.id } })"
                  />
                </div>
              </article>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.cor-hub {
  max-width: 800px;
}

.cor-hub-header {
  margin-bottom: 32px;
}

.cor-hub-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 8px;
}

.cor-hub-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: #799AB7;
  margin: 0;
}

.cor-tabs {
  max-width: 700px;
}

.tab-list {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(94, 119, 149, 0.15);
}

.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #799AB7;
  padding: 10px 20px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.tab-btn:hover {
  color: #F8FAFC;
}

.tab-btn--active {
  color: #1B7A5A;
  border-bottom-color: #1B7A5A;
}

.tab-panel {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.cor-loading {
  display: flex;
  justify-content: center;
  padding: 64px;
}

.cor-loading-text {
  font-family: 'Inter', sans-serif;
  color: #799AB7;
  font-size: 1rem;
}

.cor-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 32px;
  gap: 12px;
}

.cor-empty-text {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #799AB7;
  margin: 0;
}

.cor-empty-hint {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #5E7795;
  margin: 0;
  text-align: center;
}

.requests-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.request-card {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 12px;
  padding: 20px 24px;
}

.req-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.req-vehicle {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.req-vehicle-model {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #F8FAFC;
}

.req-vehicle-plate {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: #1B7A5A;
  letter-spacing: 0.05em;
}

.status-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;
  flex-shrink: 0;
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

.req-description {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #F8FAFC;
  margin: 0 0 12px;
  line-height: 1.5;
}

.req-services {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.req-service-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #799AB7;
  background: rgba(121, 154, 183, 0.12);
  border: 1px solid rgba(121, 154, 183, 0.2);
  padding: 3px 10px;
  border-radius: 4px;
}

.req-workshop-info {
  display: flex;
  gap: 24px;
  background: rgba(27, 122, 90, 0.06);
  border: 1px solid rgba(27, 122, 90, 0.15);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.req-workshop-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.req-workshop-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #799AB7;
}

.req-workshop-value {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #F8FAFC;
}

.req-workshop-price {
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  color: #1B7A5A;
}

.req-pending-count {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: #799AB7;
  margin-bottom: 12px;
}

.req-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(94, 119, 149, 0.1);
}

.req-date {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: #5E7795;
}

@media (max-width: 480px) {
  .req-card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .req-workshop-info {
    flex-direction: column;
    gap: 12px;
  }
}
</style>