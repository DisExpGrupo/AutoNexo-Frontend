<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/modules/iam/store/auth';
import { serviceRequestService } from '@/modules/matching/services/service-request.service';
import type { ServiceRequest } from '@/modules/matching/services/service-request.service';
import { offerService } from '@/modules/matching/services/offer.service';

const authStore = useAuthStore();

const recentRequests = ref<ServiceRequest[]>([]);
const pendingOffersCount = ref(0);
const loading = ref(true);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
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

onMounted(async () => {
  try {
    const [reqs, allOffers] = await Promise.all([
      serviceRequestService.getMyServiceRequests(),
      offerService.getMyOffers(),
    ]);
    recentRequests.value = reqs.slice(0, 4);
    pendingOffersCount.value = allOffers.filter((o) => o.status === 'PENDING').length;
  } catch {
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="an-dashboard">
    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">{{ getGreeting() }}, {{ authStore.user?.firstName }}</h1>
      <p class="an-dashboard-subtitle">Here's an overview of your auto care activity.</p>
    </div>

    <div class="quick-actions">
      <button
        class="quick-action-card quick-action-card--primary"
        @click="$router.push({ name: 'create-service-request' })"
      >
        <div class="qa-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="qa-content">
          <span class="qa-title">New Service Request</span>
          <span class="qa-desc">Find workshops and get offers</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <button
        class="quick-action-card"
        @click="$router.push({ name: 'car-owner-requests' })"
      >
        <div class="qa-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 12h6M9 16h6M7 4H4v16h16v-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="qa-content">
          <span class="qa-title">My Service Requests</span>
          <span class="qa-desc">Track active and past requests</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <button
        class="quick-action-card"
        @click="$router.push({ name: 'vehicle-registration' })"
      >
        <div class="qa-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 17V10L8 7H16L19 10V17H5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="8.5" cy="17" r="1.5" fill="currentColor"/>
            <circle cx="15.5" cy="17" r="1.5" fill="currentColor"/>
            <path d="M10 7H14" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="qa-content">
          <span class="qa-title">Add a Vehicle</span>
          <span class="qa-desc">Register a new car</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <template v-if="pendingOffersCount > 0">
      <div class="offers-alert">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M9 2L2 16h14L9 2z" stroke="#F59E0B" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M9 7v4M9 13h.01" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>You have <strong>{{ pendingOffersCount }} pending offer{{ pendingOffersCount > 1 ? 's' : '' }}</strong> waiting for review.</span>
        <button class="offers-alert-link" @click="$router.push({ name: 'car-owner-requests' })">View</button>
      </div>
    </template>

    <div class="dashboard-section">
      <div class="section-header">
        <h2 class="section-title">Recent Service Requests</h2>
        <button
          v-if="recentRequests.length > 0"
          class="section-link"
          @click="$router.push({ name: 'car-owner-requests' })"
        >
          View all
        </button>
      </div>

      <template v-if="loading">
        <div class="section-loading">Loading...</div>
      </template>

      <template v-else-if="recentRequests.length === 0">
        <div class="section-empty">
          <p>No service requests yet. Create your first one to get started.</p>
        </div>
      </template>

      <template v-else>
        <div class="recent-list">
          <div
            v-for="req in recentRequests"
            :key="req.id"
            class="recent-item"
            @click="$router.push({ name: 'service-request-detail', params: { id: req.id } })"
          >
            <div class="recent-item-info">
              <span class="recent-item-desc">{{ req.description }}</span>
              <span class="recent-item-date">{{ new Date(req.createdAt).toLocaleDateString() }}</span>
            </div>
            <span :class="['status-badge', STATUS_CLASS[req.status]]">
              {{ STATUS_LABELS[req.status] }}
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.an-dashboard-header {
  margin-bottom: 32px;
}

.an-dashboard-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 8px;
}

.an-dashboard-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: #799AB7;
  margin: 0;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}

.quick-action-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 12px;
  padding: 16px 18px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
}

.quick-action-card:hover {
  border-color: rgba(27, 122, 90, 0.4);
  background: rgba(27, 122, 90, 0.05);
}

.quick-action-card--primary {
  border-color: rgba(27, 122, 90, 0.3);
  background: rgba(27, 122, 90, 0.06);
}

.quick-action-card--primary:hover {
  border-color: #1B7A5A;
  background: rgba(27, 122, 90, 0.12);
}

.qa-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(27, 122, 90, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #1B7A5A;
}

.quick-action-card--primary .qa-icon {
  background: rgba(27, 122, 90, 0.25);
}

.qa-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.qa-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #F8FAFC;
}

.qa-desc {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: #799AB7;
}

.offers-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 28px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #F8FAFC;
}

.offers-alert strong {
  color: #F59E0B;
}

.offers-alert-link {
  background: none;
  border: none;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #F59E0B;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.dashboard-section {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 16px;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #799AB7;
  margin: 0;
}

.section-link {
  background: none;
  border: none;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1B7A5A;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.section-link:hover {
  color: #2ea87a;
}

.section-loading {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #799AB7;
  padding: 16px 0;
}

.section-empty p {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #5E7795;
  margin: 0;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #0f1920;
  border: 1px solid rgba(94, 119, 149, 0.1);
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.recent-item:hover {
  border-color: rgba(27, 122, 90, 0.3);
}

.recent-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
  margin-right: 12px;
}

.recent-item-desc {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #F8FAFC;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-item-date {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: #5E7795;
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

@media (max-width: 480px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>