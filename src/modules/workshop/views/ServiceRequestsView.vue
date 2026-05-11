<script setup lang="ts">
import { ref, shallowRef, computed } from 'vue';
import { useRouter } from 'vue-router';
import { workshopService } from '@/modules/workshop/services/workshop.service';
import type { AvailableServiceRequest } from '@/modules/workshop/services/workshop.service';
import { offerService } from '@/modules/matching/services/offer.service';
import type { CreateOfferRequest, Offer } from '@/modules/matching/services/offer.service';
import { serviceRequestService } from '@/modules/matching/services/service-request.service';
import { bookingService } from '@/modules/matching/services/booking.service';
import type { Booking } from '@/modules/matching/services/booking.service';
import { useToast } from 'primevue/usetoast';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Calendar from 'primevue/calendar';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

const toast = useToast();
const router = useRouter();

const activeTab = ref<'nearby' | 'active'>('nearby');
const requests = shallowRef<AvailableServiceRequest[]>([]);
const loading = ref(false);

// Active services
const workshopOffers = shallowRef<Offer[]>([]);
const serviceRequestMap = shallowRef<Record<number, string>>({});
const bookingMap = shallowRef<Record<number, Booking | null>>({});
const loadingActive = ref(false);

const showOfferDialog = ref(false);
const selectedRequest = ref<AvailableServiceRequest | null>(null);
const offerForm = ref({
  proposedPriceAmount: 0 as number,
  currency: 'PEN',
  proposedDate: null as Date | null,
  message: '',
});
const submittingOffer = ref(false);

const currencies = [
  { label: 'Soles (PEN)', value: 'PEN' },
  { label: 'US Dollar (USD)', value: 'USD' },
];

const nearbyRequests = computed(() => {
  return [...requests.value].sort((a, b) => b.matchScore - a.matchScore);
});

const activeOffers = computed(() => {
  return workshopOffers.value.filter((o) => o.status === 'ACCEPTED' || o.status === 'PENDING');
});

const activeOffersWithBooking = computed(() => {
  return activeOffers.value.map((o) => ({
    offer: o,
    booking: bookingMap.value[o.serviceRequestId] ?? null,
  }));
});

async function fetchRequests() {
  loading.value = true;
  try {
    requests.value = await workshopService.getAvailableRequests();
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load service requests.', life: 4000 });
  } finally {
    loading.value = false;
  }
}

async function fetchActiveServices() {
  loadingActive.value = true;
  try {
    const allOffers = await offerService.getMyWorkshopOffers();
    workshopOffers.value = allOffers;

    const uniqueIds = [...new Set(allOffers.map((o) => o.serviceRequestId))];
    const [reqResults, bookingResults] = await Promise.all([
      Promise.allSettled(uniqueIds.map((id) => serviceRequestService.getServiceRequestById(id))),
      Promise.allSettled(uniqueIds.map((id) => bookingService.getBookingByRequestId(id))),
    ]);

    const reqMap: Record<number, string> = {};
    reqResults.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        reqMap[uniqueIds[i]] = r.value.description;
      }
    });
    serviceRequestMap.value = reqMap;

    const bMap: Record<number, Booking | null> = {};
    bookingResults.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        bMap[uniqueIds[i]] = r.value;
      }
    });
    bookingMap.value = bMap;
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load active services.', life: 4000 });
  } finally {
    loadingActive.value = false;
  }
}

function openOfferDialog(req: AvailableServiceRequest) {
  selectedRequest.value = req;
  offerForm.value = {
    proposedPriceAmount: 0,
    currency: 'PEN',
    proposedDate: null,
    message: '',
  };
  showOfferDialog.value = true;
}

function closeOfferDialog() {
  showOfferDialog.value = false;
  selectedRequest.value = null;
}

function submitOffer() {
  if (!selectedRequest.value || offerForm.value.proposedPriceAmount <= 0 || !offerForm.value.proposedDate) {
    toast.add({ severity: 'warn', summary: 'Required', detail: 'Enter a valid price and date.', life: 3000 });
    return;
  }
  const payload: CreateOfferRequest = {
    serviceRequestId: selectedRequest.value.id,
    proposedPriceAmount: offerForm.value.proposedPriceAmount,
    currency: offerForm.value.currency,
    proposedDate: offerForm.value.proposedDate.toISOString(),
    message: offerForm.value.message,
  };
  submittingOffer.value = true;
  offerService.createOffer(payload)
    .then(() => {
      toast.add({ severity: 'success', summary: 'Offer Sent', detail: 'Your offer has been sent to the car owner.', life: 4000 });
      closeOfferDialog();
      return fetchRequests();
    })
    .catch(() => {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to send offer. Please try again.', life: 4000 });
    })
    .finally(() => {
      submittingOffer.value = false;
    });
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function matchScorePercent(score: number): number {
  return Math.round(score * 100);
}

function formatPrice(amount: number, currency: string): string {
  if (!currency) return new Intl.NumberFormat('es-PE', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getRequestDescription(requestId: number): string {
  return serviceRequestMap.value[requestId] ?? `Request #${requestId}`;
}

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

function switchToActiveTab() {
  activeTab.value = 'active';
  if (workshopOffers.value.length === 0) {
    fetchActiveServices();
  }
}

fetchRequests();
</script>

<template>
  <div class="sr-hub">
    <div class="sr-hub-header">
      <h1 class="sr-hub-title">Service Requests</h1>
      <p class="sr-hub-subtitle">Find opportunities and manage your active services.</p>
    </div>

    <div class="sr-tabs">
      <div class="tab-list" role="tablist">
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'nearby' }"
          role="tab"
          :aria-selected="activeTab === 'nearby'"
          @click="activeTab = 'nearby'"
        >
          Nearby Opportunities
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'active' }"
          role="tab"
          :aria-selected="activeTab === 'active'"
          @click="switchToActiveTab"
        >
          My Active Services
        </button>
      </div>

      <div v-if="activeTab === 'nearby'" class="tab-panel" role="tabpanel">
        <template v-if="loading">
          <div class="sr-loading">
            <p class="sr-loading-text">Loading opportunities...</p>
          </div>
        </template>

        <template v-else-if="nearbyRequests.length === 0">
          <div class="sr-empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="20" stroke="#799AB7" stroke-width="2"/>
              <path d="M24 16v8M24 28h.01" stroke="#799AB7" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            <p class="sr-empty-text">No opportunities nearby.</p>
            <p class="sr-empty-hint">New service requests from car owners will appear here.</p>
          </div>
        </template>

        <template v-else>
          <div class="opportunities-grid">
            <article
              v-for="req in nearbyRequests"
              :key="req.id"
              class="opportunity-card"
            >
              <div class="opp-card-header">
                <div class="opp-score">
                  <span class="opp-score-value">{{ matchScorePercent(req.matchScore) }}%</span>
                  <span class="opp-score-label">Match</span>
                </div>
                <div class="opp-distance">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 2C7.24 2 5 4.24 5 7c0 4.25 5 11 5 11s5-6.75 5-11c0-2.76-2.24-5-5-5z" stroke="#1B7A5A" stroke-width="1.5"/>
                    <circle cx="10" cy="7" r="1.5" fill="#1B7A5A"/>
                  </svg>
                  <span class="opp-distance-value">{{ formatDistance(req.distanceKm) }}</span>
                </div>
              </div>

              <p class="opp-description">{{ req.description }}</p>

              <div class="opp-section">
                <span class="opp-section-label">Requested</span>
                <div class="opp-tags">
                  <span v-for="svc in req.requestedServices" :key="svc" class="opp-tag opp-tag--requested">{{ svc }}</span>
                </div>
              </div>

              <div v-if="req.matchingServices.length > 0" class="opp-section">
                <span class="opp-section-label">Your Matching Services</span>
                <div class="opp-tags">
                  <span v-for="svc in req.matchingServices" :key="svc" class="opp-tag opp-tag--matching">{{ svc }}</span>
                </div>
              </div>

              <div class="opp-card-footer">
                <span class="opp-posted">Posted {{ new Date(req.createdAt).toLocaleDateString() }}</span>
                <Button
                  label="Send Offer"
                  severity="success"
                  size="small"
                  @click="openOfferDialog(req)"
                />
              </div>
            </article>
          </div>
        </template>
      </div>

      <div v-if="activeTab === 'active'" class="tab-panel" role="tabpanel">
        <template v-if="loadingActive">
          <div class="sr-loading">
            <p class="sr-loading-text">Loading active services...</p>
          </div>
        </template>

        <template v-else-if="activeOffers.length === 0">
          <div class="sr-empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M14 24h20M24 14v20" stroke="#799AB7" stroke-width="2" stroke-linecap="round"/>
              <circle cx="24" cy="24" r="18" stroke="#799AB7" stroke-width="2"/>
            </svg>
            <p class="sr-empty-text">You don't have any accepted jobs yet.</p>
            <p class="sr-empty-hint">Keep sending offers in the "Nearby" tab!</p>
          </div>
        </template>

        <template v-else>
          <div class="active-list">
            <article
              v-for="{ offer, booking } in activeOffersWithBooking"
              :key="offer.id"
              class="active-card"
            >
              <div class="active-card-header">
                <div class="active-card-title-row">
                  <span class="active-card-title">Service for Request #{{ offer.serviceRequestId }}</span>
                  <span v-if="offer.status === 'ACCEPTED'" class="status-badge status-accepted">Accepted</span>
                  <span v-else class="status-badge status-pending">Pending</span>
                </div>
                <p class="active-card-desc">{{ getRequestDescription(offer.serviceRequestId) }}</p>
              </div>

              <template v-if="booking">
                <div class="active-booking-info">
                  <div class="booking-status-row">
                    <span class="booking-status-label">Booking Status</span>
                    <span :class="['status-badge', BOOKING_STATUS_CLASS[booking.status]]">
                      {{ BOOKING_STATUS_LABELS[booking.status] }}
                    </span>
                  </div>
                  <div class="booking-details-row">
                    <div class="booking-detail">
                      <span class="booking-detail-label">Scheduled Date</span>
                      <span class="booking-detail-value">{{ formatDate(booking.scheduledDate) }}</span>
                    </div>
                    <div class="booking-detail">
                      <span class="booking-detail-label">Total Price</span>
                      <span class="booking-detail-value booking-price">{{ formatPrice(booking.finalPriceAmount, booking.currency) }}</span>
                    </div>
                  </div>
                  <div v-if="booking.servicesToPerform.length > 0" class="booking-services-list">
                    <span class="booking-services-label">Services</span>
                    <div class="booking-service-tags">
                      <span v-for="svc in booking.servicesToPerform" :key="svc" class="booking-service-tag">{{ svc }}</span>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="active-card-highlights">
                  <div class="highlight-item">
                    <span class="highlight-label">Agreed Price</span>
                    <span class="highlight-value highlight-price">{{ formatPrice(offer.proposedPriceAmount, offer.currency) }}</span>
                  </div>
                  <div class="highlight-item">
                    <span class="highlight-label">Proposed Date</span>
                    <span class="highlight-value">{{ formatDate(offer.proposedDate) }}</span>
                  </div>
                </div>

                <div v-if="offer.message" class="active-card-message">
                  <span class="active-card-message-label">Your message to the client</span>
                  <p class="active-card-message-text">{{ offer.message }}</p>
                </div>

                <div class="active-card-meta">
                  <span>Accepted {{ formatDate(offer.acceptedAt) }}</span>
                </div>
              </template>

              <div class="active-card-actions">
                <Button
                  label="View Full Details"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="router.push({ name: 'service-request-detail', params: { id: offer.serviceRequestId } })"
                />
              </div>
            </article>
          </div>
        </template>
      </div>
    </div>

    <Dialog
      v-model:visible="showOfferDialog"
      modal
      header="Send Offer"
      :style="{ width: '440px' }"
      :closable="true"
      :draggable="false"
      @hide="closeOfferDialog"
    >
      <template v-if="selectedRequest">
        <div class="offer-context">
          <span class="offer-context-label">Service Request</span>
          <p class="offer-context-desc">{{ selectedRequest.description }}</p>
        </div>
      </template>

      <div class="offer-form">
        <div class="form-row">
          <div class="form-field">
            <label for="offer-price" class="form-label">Price *</label>
            <InputNumber
              id="offer-price"
              v-model="offerForm.proposedPriceAmount"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              class="form-input"
              :min="0"
            />
          </div>
          <div class="form-field">
            <label for="offer-currency" class="form-label">Currency</label>
            <Select
              id="offer-currency"
              v-model="offerForm.currency"
              :options="currencies"
              optionLabel="label"
              optionValue="value"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-field">
          <label for="offer-date" class="form-label">Proposed Date *</label>
          <Calendar
            id="offer-date"
            v-model="offerForm.proposedDate"
            dateFormat="yy-mm-dd"
            :minDate="new Date()"
            class="form-input"
            showIcon
            iconDisplay="input"
          />
        </div>

        <div class="form-field">
          <label for="offer-message" class="form-label">Message</label>
          <Textarea
            id="offer-message"
            v-model="offerForm.message"
            class="form-input"
            placeholder="Introduce yourself and explain why they should choose your workshop..."
            :rows="4"
          />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button label="Cancel" severity="secondary" outlined :disabled="submittingOffer" @click="closeOfferDialog" />
          <Button label="Send Offer" severity="success" :loading="submittingOffer" @click="submitOffer" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.sr-hub {
  max-width: 800px;
}

.sr-hub-header {
  margin-bottom: 32px;
}

.sr-hub-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 8px;
}

.sr-hub-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: #799AB7;
  margin: 0;
}

.sr-tabs {
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

.sr-loading {
  display: flex;
  justify-content: center;
  padding: 64px;
}

.sr-loading-text {
  font-family: 'Inter', sans-serif;
  color: #799AB7;
  font-size: 1rem;
}

.sr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 32px;
  gap: 12px;
}

.sr-empty-text {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #799AB7;
  margin: 0;
}

.sr-empty-hint {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #5E7795;
  margin: 0;
  text-align: center;
}

.opportunities-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.opportunity-card {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 12px;
  padding: 20px 24px;
}

.opp-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.opp-score {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.opp-score-value {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1B7A5A;
  line-height: 1;
}

.opp-score-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #799AB7;
  margin-top: 2px;
}

.opp-distance {
  display: flex;
  align-items: center;
  gap: 6px;
}

.opp-distance-value {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #799AB7;
}

.opp-description {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: #F8FAFC;
  margin: 0 0 16px;
  line-height: 1.5;
}

.opp-section {
  margin-bottom: 12px;
}

.opp-section-label {
  display: block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
  margin-bottom: 8px;
}

.opp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.opp-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 4px 10px;
  border-radius: 4px;
}

.opp-tag--requested {
  color: #799AB7;
  background: rgba(121, 154, 183, 0.15);
  border: 1px solid rgba(121, 154, 183, 0.25);
}

.opp-tag--matching {
  color: #1B7A5A;
  background: rgba(27, 122, 90, 0.15);
  border: 1px solid rgba(27, 122, 90, 0.25);
}

.opp-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(94, 119, 149, 0.1);
}

.opp-posted {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  color: #5E7795;
}

.sr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 32px;
  gap: 12px;
}

.sr-placeholder-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #5E7795;
  margin: 0;
  text-align: center;
}

.active-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.active-card {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 12px;
  padding: 20px 24px;
}

.active-card-header {
  margin-bottom: 16px;
}

.active-card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.active-card-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #F8FAFC;
}

.active-card-desc {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #799AB7;
  margin: 0;
}

.status-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;
}

.status-accepted {
  color: #1B7A5A;
  background: rgba(27, 122, 90, 0.15);
  border: 1px solid rgba(27, 122, 90, 0.3);
}

.status-pending {
  color: #F59E0B;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.active-card-highlights {
  display: flex;
  gap: 32px;
  background: rgba(27, 122, 90, 0.06);
  border: 1px solid rgba(27, 122, 90, 0.15);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.highlight-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.highlight-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
}

.highlight-value {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #F8FAFC;
}

.highlight-price {
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  color: #1B7A5A;
}

.active-card-message {
  padding: 12px 14px;
  background: rgba(121, 154, 183, 0.06);
  border: 1px solid rgba(121, 154, 183, 0.12);
  border-radius: 8px;
  margin-bottom: 12px;
}

.active-card-message-label {
  display: block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
  margin-bottom: 6px;
}

.active-card-message-text {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #799AB7;
  line-height: 1.5;
  margin: 0;
}

.active-card-meta {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  color: #5E7795;
  margin-bottom: 12px;
}

.active-card-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid rgba(94, 119, 149, 0.1);
}

.active-booking-info {
  background: rgba(27, 122, 90, 0.06);
  border: 1px solid rgba(27, 122, 90, 0.15);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.booking-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.booking-status-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #799AB7;
}

.booking-details-row {
  display: flex;
  gap: 24px;
}

.booking-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.booking-detail-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
}

.booking-detail-value {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #F8FAFC;
}

.booking-price {
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  color: #1B7A5A;
}

.booking-services-label {
  display: block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
  margin-bottom: 6px;
}

.booking-service-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.booking-service-tag {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #1B7A5A;
  background: rgba(27, 122, 90, 0.12);
  border: 1px solid rgba(27, 122, 90, 0.2);
  padding: 3px 8px;
  border-radius: 4px;
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

.offer-context {
  background: rgba(27, 122, 90, 0.08);
  border: 1px solid rgba(27, 122, 90, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.offer-context-label {
  display: block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #799AB7;
  margin-bottom: 4px;
}

.offer-context-desc {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #F8FAFC;
  margin: 0;
}

.offer-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-field {
  flex: 1;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #799AB7;
}

.form-input {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
  }

  .opp-card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>