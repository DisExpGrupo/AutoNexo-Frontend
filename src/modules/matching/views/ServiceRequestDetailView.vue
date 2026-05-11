<script setup lang="ts">
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { serviceRequestService } from '@/modules/matching/services/service-request.service';
import type { ServiceRequest } from '@/modules/matching/services/service-request.service';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/services/vehicle.service';
import { offerService } from '@/modules/matching/services/offer.service';
import type { Offer } from '@/modules/matching/services/offer.service';
import { bookingService } from '@/modules/matching/services/booking.service';
import type { Booking } from '@/modules/matching/services/booking.service';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';

const toast = useToast();
const route = useRoute();
const router = useRouter();

const request = ref<ServiceRequest | null>(null);
const vehicle = ref<Vehicle | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const offers = shallowRef<Offer[]>([]);
const loadingOffers = ref(false);
let pollingTimer: ReturnType<typeof setInterval> | null = null;

const acceptedOffer = ref<Offer | null>(null);
const booking = ref<Booking | null>(null);
const loadingBooking = ref(false);

const selectedOffer = computed(() => {
  if (request.value?.status === 'COMPLETED' && acceptedOffer.value) {
    return acceptedOffer.value;
  }
  return null;
});

const REQUEST_STATUS_LABELS: Record<ServiceRequest['status'], string> = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const REQUEST_STATUS_CLASS: Record<ServiceRequest['status'], string> = {
  PENDING: 'status-pending',
  COMPLETED: 'status-completed',
  REJECTED: 'status-rejected',
  CANCELLED: 'status-cancelled',
};

const OFFER_STATUS_LABELS: Record<Offer['status'], string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  WITHDRAWN: 'Withdrawn',
};

const OFFER_STATUS_CLASS: Record<Offer['status'], string> = {
  PENDING: 'status-gold',
  ACCEPTED: 'status-accepted',
  REJECTED: 'status-rejected',
  EXPIRED: 'status-expired',
  WITHDRAWN: 'status-withdrawn',
};

const BOOKING_STATUS_LABELS: Record<Booking['status'], string> = {
  PENDING_SCHEDULE: 'Pending Schedule',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const BOOKING_STATUS_CLASS: Record<Booking['status'], string> = {
  PENDING_SCHEDULE: 'status-pending',
  SCHEDULED: 'status-scheduled',
  IN_PROGRESS: 'status-inprogress',
  COMPLETED: 'status-completed',
  CANCELLED: 'status-cancelled',
};

const hasBooking = computed(() => booking.value !== null);

async function fetchOffers(requestId: number) {
  loadingOffers.value = true;
  try {
    offers.value = await offerService.getOffersByRequestId(requestId);
    const accepted = offers.value.find((o) => o.status === 'ACCEPTED');
    if (accepted) acceptedOffer.value = accepted;
  } catch {
  } finally {
    loadingOffers.value = false;
  }
}

async function fetchBooking(requestId: number): Promise<Booking | null> {
  loadingBooking.value = true;
  try {
    const result = await bookingService.getBookingByRequestId(requestId);
    booking.value = result;
    return result;
  } catch {
    return null;
  } finally {
    loadingBooking.value = false;
  }
}

function startPolling(requestId: number) {
  pollingTimer = setInterval(() => fetchOffers(requestId), 10_000);
}

function stopPolling() {
  if (pollingTimer !== null) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

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
    await fetchOffers(id);
    if (req.status === 'PENDING') {
      startPolling(id);
    } else if (req.status === 'COMPLETED') {
      await fetchBooking(id);
    }
  } catch {
    error.value = 'Failed to load service request details.';
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  stopPolling();
});

function goBack() {
  if (vehicle.value) {
    router.push({ name: 'vehicle-detail', params: { id: vehicle.value.id } });
  } else {
    router.push({ name: 'dashboard' });
  }
}

function formatPrice(amount: number, currency: string): string {
  if (!currency) return new Intl.NumberFormat('es-PE', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function acceptOfferHandler(offer: Offer) {
  offerService.acceptOffer(offer.id)
    .then((updated) => {
      acceptedOffer.value = updated;
      stopPolling();
      toast.add({
        severity: 'success',
        summary: 'Congratulations!',
        detail: 'Your request has been accepted. The workshop will contact you soon.',
        life: 6000,
      });
      if (request.value) {
        request.value = { ...request.value, status: 'COMPLETED' };
      }
    })
    .then(async () => {
      if (request.value) {
        const b = await fetchBooking(request.value.id);
        if (b) booking.value = b;
      }
    })
    .catch(() => {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to accept offer. Please try again.',
        life: 4000,
      });
    });
}
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
                  <span :class="['status-badge', REQUEST_STATUS_CLASS[request.status]]">
                    {{ REQUEST_STATUS_LABELS[request.status] }}
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
            <h3 class="section-title">{{ hasBooking ? 'Booking Summary' : 'Offers' }}</h3>

            <template v-if="hasBooking">
              <div class="booking-receipt">
                <div class="booking-receipt-header">
                  <div class="booking-receipt-title-row">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M9 2L2 16h14L9 2z" stroke="#1B7A5A" stroke-width="1.5" stroke-linejoin="round"/>
                      <path d="M9 7v4M9 13h.01" stroke="#1B7A5A" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <span class="booking-receipt-title">Service Scheduled</span>
                  </div>
                  <span :class="['status-badge', BOOKING_STATUS_CLASS[booking!.status]]">
                    {{ BOOKING_STATUS_LABELS[booking!.status] }}
                  </span>
                </div>

                <div class="booking-receipt-divider">
                  <div class="receipt-dots" aria-hidden="true"></div>
                </div>

                <div class="booking-receipt-highlights">
                  <div class="receipt-highlight">
                    <span class="receipt-highlight-label">Scheduled Date</span>
                    <span class="receipt-highlight-value">{{ formatDate(booking!.scheduledDate) }}</span>
                  </div>
                  <div class="receipt-highlight">
                    <span class="receipt-highlight-label">Total Price</span>
                    <span class="receipt-highlight-value receipt-price">{{ formatPrice(booking!.finalPriceAmount, booking!.currency) }}</span>
                  </div>
                </div>

                <div class="booking-receipt-divider">
                  <div class="receipt-dots" aria-hidden="true"></div>
                </div>

                <div class="booking-services">
                  <span class="booking-services-label">Services to Perform</span>
                  <ul class="booking-services-list">
                    <li v-for="svc in booking!.servicesToPerform" :key="svc" class="booking-service-item">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M2 7l4 4 6-6" stroke="#1B7A5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      {{ svc }}
                    </li>
                  </ul>
                </div>

                <div v-if="booking!.notes" class="booking-notes">
                  <span class="booking-notes-label">Notes</span>
                  <p class="booking-notes-text">{{ booking!.notes }}</p>
                </div>
              </div>
            </template>

            <template v-else-if="offers.length === 0">
              <div class="offers-loading">
                <svg class="offers-spinner" width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <circle cx="16" cy="16" r="12" stroke="rgba(121, 154, 183, 0.2)" stroke-width="4"/>
                  <path d="M16 4c-6.627 0-12 5.373-12 12" stroke="#799AB7" stroke-width="4" stroke-linecap="round"/>
                </svg>
                <p class="offers-loading-text">Searching for the best workshops near you...</p>
              </div>
            </template>

            <template v-else>
              <div class="offers-list">
                <article
                  v-for="offer in offers"
                  :key="offer.id"
                  class="offer-card"
                  :class="{ 'offer-card--selected': selectedOffer?.id === offer.id }"
                >
                  <div class="offer-header">
                    <div class="offer-workshop">
                      <span class="offer-workshop-label">Workshop</span>
                      <span class="offer-workshop-id">#{{ offer.workshopId }}</span>
                    </div>
                    <span :class="['offer-badge', OFFER_STATUS_CLASS[offer.status]]">
                      {{ OFFER_STATUS_LABELS[offer.status] }}
                    </span>
                  </div>

                  <div class="offer-details">
                    <div class="offer-detail">
                      <span class="offer-detail-label">Price</span>
                      <span class="offer-detail-value offer-price">{{ formatPrice(offer.proposedPriceAmount, offer.currency) }}</span>
                    </div>
                    <div class="offer-detail">
                      <span class="offer-detail-label">Proposed Date</span>
                      <span class="offer-detail-value">{{ formatDate(offer.proposedDate) }}</span>
                    </div>
                  </div>

                  <div v-if="offer.message" class="offer-message">
                    <span class="offer-message-label">Message</span>
                    <p class="offer-message-text">{{ offer.message }}</p>
                  </div>

                  <template v-if="selectedOffer?.id === offer.id">
                    <div class="offer-selected-note">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8l4 4 6-6" stroke="#1B7A5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <span>This workshop has been selected</span>
                    </div>
                  </template>

                  <template v-else-if="request.status === 'PENDING'">
                    <div class="offer-actions">
                      <Button
                        label="Accept Offer"
                        severity="success"
                        size="small"
                        @click="acceptOfferHandler(offer)"
                      />
                    </div>
                  </template>
                </article>
              </div>
            </template>
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

.status-gold {
  color: #F59E0B;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-accepted {
  color: #1B7A5A;
  background: rgba(27, 122, 90, 0.15);
  border: 1px solid rgba(27, 122, 90, 0.3);
}

.status-expired,
.status-withdrawn {
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

.offers-loading {
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

.offers-loading-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #799AB7;
  margin: 0;
  text-align: center;
}

.offers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.offer-card {
  background: #0f1920;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 12px;
  padding: 20px;
  transition: border-color 0.15s;
}

.offer-card--selected {
  border-color: #1B7A5A;
  background: rgba(27, 122, 90, 0.06);
}

.offer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.offer-workshop {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.offer-workshop-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
}

.offer-workshop-id {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #F8FAFC;
}

.offer-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;
}

.offer-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.offer-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.offer-detail-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
}

.offer-detail-value {
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: #F8FAFC;
}

.offer-price {
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  color: #1B7A5A;
}

.offer-message {
  padding-top: 12px;
  border-top: 1px solid rgba(94, 119, 149, 0.1);
  margin-bottom: 12px;
}

.offer-message-label {
  display: block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
  margin-bottom: 6px;
}

.offer-message-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #799AB7;
  line-height: 1.5;
  margin: 0;
}

.offer-selected-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(27, 122, 90, 0.2);
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #1B7A5A;
}

.offer-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid rgba(94, 119, 149, 0.1);
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

.booking-receipt {
  background: #0f1920;
  border: 1px solid rgba(27, 122, 90, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-top: 4px;
}

.booking-receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.booking-receipt-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.booking-receipt-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1B7A5A;
  letter-spacing: 0.03em;
}

.booking-receipt-divider {
  border-top: 1px dashed rgba(94, 119, 149, 0.25);
  margin: 14px 0;
  position: relative;
}

.receipt-dots {
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 6px;
  background-image: radial-gradient(circle, #5E7795 1px, transparent 1px);
  background-size: 8px 8px;
  opacity: 0.4;
}

.booking-receipt-highlights {
  display: flex;
  gap: 24px;
}

.receipt-highlight {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.receipt-highlight-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
}

.receipt-highlight-value {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: #F8FAFC;
}

.receipt-price {
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  color: #1B7A5A;
  font-size: 1.125rem;
}

.booking-services {
  margin-top: 4px;
}

.booking-services-label {
  display: block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
  margin-bottom: 10px;
}

.booking-services-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.booking-service-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #F8FAFC;
}

.booking-notes {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed rgba(94, 119, 149, 0.2);
}

.booking-notes-label {
  display: block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
  margin-bottom: 6px;
}

.booking-notes-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #799AB7;
  line-height: 1.5;
  margin: 0;
}

.status-scheduled {
  color: #1B7A5A;
  background: rgba(27, 122, 90, 0.15);
  border: 1px solid rgba(27, 122, 90, 0.3);
}

.status-inprogress {
  color: #F59E0B;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

@media (max-width: 768px) {
  .request-layout {
    grid-template-columns: 1fr;
  }

  .request-sidebar {
    position: static;
  }

  .offer-details {
    grid-template-columns: 1fr;
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