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
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';


const toast = useToast();
const router = useRouter();

const activeTab = ref(0);
const requests = shallowRef<AvailableServiceRequest[]>([]);
const loading = ref(false);

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

const BOOKING_STATUS_TAG: Record<Booking['status'], { severity: string; value: string }> = {
  PENDING_SCHEDULE: { severity: 'warn', value: 'Pending Schedule' },
  SCHEDULED: { severity: 'success', value: 'Scheduled' },
  IN_PROGRESS: { severity: 'info', value: 'In Progress' },
  COMPLETED: { severity: 'success', value: 'Completed' },
  CANCELLED: { severity: 'danger', value: 'Cancelled' },
};

const OFFER_STATUS_TAG: Record<string, { severity: string; value: string }> = {
  ACCEPTED: { severity: 'success', value: 'Accepted' },
  PENDING: { severity: 'warn', value: 'Pending' },
};

function switchToActiveTab() {
  activeTab.value = 1;
  if (workshopOffers.value.length === 0) {
    fetchActiveServices();
  }
}

fetchRequests();
</script>

<template>
  <div class="an-dashboard max-w-3xl">
    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">Service Requests</h1>
      <p class="an-dashboard-subtitle">Find opportunities and manage your active services.</p>
    </div>

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="0">Nearby Opportunities</Tab>
        <Tab value="1" @click="switchToActiveTab">My Active Services</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0">
          <div v-if="loading" class="py-16 text-center">
            <p class="text-[var(--p-text-muted-color)]">Loading opportunities...</p>
          </div>

          <div v-else-if="nearbyRequests.length === 0" class="py-16 flex flex-col items-center gap-3">
            <i class="pi pi-map-marker text-4xl text-[var(--p-text-muted-color)]" />
            <p class="font-mono font-bold text-[var(--p-text-muted-color)]">No opportunities nearby.</p>
            <p class="text-sm text-[var(--p-text-muted-color)]">New service requests from car owners will appear here.</p>
          </div>

          <div v-else class="flex flex-col gap-4">
            <Card v-for="req in nearbyRequests" :key="req.id">
              <template #content>
                <div class="flex flex-col gap-4">
                  <div class="flex items-start justify-between">
                    <div class="flex flex-col">
                      <span class="text-2xl font-mono font-bold text-[var(--p-primary-color)] leading-none">
                        {{ matchScorePercent(req.matchScore) }}%
                      </span>
                      <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
                        Match
                      </span>
                    </div>
                    <div class="flex items-center gap-1.5 text-[var(--p-text-muted-color)]">
                      <i class="pi pi-map-marker text-sm" />
                      <span class="font-mono text-sm font-bold">{{ formatDistance(req.distanceKm) }}</span>
                    </div>
                  </div>

                  <p class="text-sm text-white leading-relaxed">{{ req.description }}</p>

                  <div class="flex flex-col gap-2">
                    <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[#5E7795]">Requested</span>
                    <div class="flex flex-wrap gap-1.5">
                      <Tag
                        v-for="svc in req.requestedServices"
                        :key="svc"
                        :value="svc"
                        severity="secondary"
                        class="text-[0.65rem]"
                      />
                    </div>
                  </div>

                  <div v-if="req.matchingServices.length > 0" class="flex flex-col gap-2">
                    <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[#5E7795]">Your Matching Services</span>
                    <div class="flex flex-wrap gap-1.5">
                      <Tag
                        v-for="svc in req.matchingServices"
                        :key="svc"
                        :value="svc"
                        severity="success"
                        class="text-[0.65rem]"
                      />
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-4 border-t border-[rgba(94,119,149,0.1)]">
                    <span class="text-[0.75rem] font-mono text-[#5E7795]">
                      Posted {{ new Date(req.createdAt).toLocaleDateString() }}
                    </span>
                    <Button
                      label="Send Offer"
                      severity="success"
                      size="small"
                      @click="openOfferDialog(req)"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="1">
          <div v-if="loadingActive" class="py-16 text-center">
            <p class="text-[var(--p-text-muted-color)]">Loading active services...</p>
          </div>

          <div v-else-if="activeOffers.length === 0" class="py-16 flex flex-col items-center gap-3">
            <i class="pi pi-inbox text-4xl text-[var(--p-text-muted-color)]" />
            <p class="font-mono font-bold text-[var(--p-text-muted-color)]">You don't have any accepted jobs yet.</p>
            <p class="text-sm text-[var(--p-text-muted-color)]">Keep sending offers in the "Nearby" tab!</p>
          </div>

          <div v-else class="flex flex-col gap-4">
            <Card v-for="{ offer, booking } in activeOffersWithBooking" :key="offer.id">
              <template #content>
                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-mono font-bold text-white">
                      Service for Request #{{ offer.serviceRequestId }}
                    </span>
                    <Tag
                      :value="OFFER_STATUS_TAG[offer.status].value"
                      :severity="OFFER_STATUS_TAG[offer.status].severity"
                      class="text-[0.65rem] font-bold uppercase tracking-wider"
                    />
                  </div>
                  <p class="text-sm text-[var(--p-text-muted-color)]">{{ getRequestDescription(offer.serviceRequestId) }}</p>

                  <template v-if="booking">
                    <div class="flex flex-col gap-2.5 p-3 rounded-lg border border-[var(--p-primary-color)]/15 bg-[var(--p-primary-color)]/5">
                      <div class="flex items-center justify-between">
                        <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Booking Status</span>
                        <Tag
                          :value="BOOKING_STATUS_TAG[booking.status].value"
                          :severity="BOOKING_STATUS_TAG[booking.status].severity"
                          class="text-[0.65rem] font-bold uppercase tracking-wider"
                        />
                      </div>
                      <div class="flex gap-6">
                        <div class="flex flex-col gap-0.5">
                          <span class="text-[0.6rem] font-mono font-bold uppercase tracking-wider text-[#5E7795]">Scheduled Date</span>
                          <span class="text-sm text-white">{{ formatDate(booking.scheduledDate) }}</span>
                        </div>
                        <div class="flex flex-col gap-0.5">
                          <span class="text-[0.6rem] font-mono font-bold uppercase tracking-wider text-[#5E7795]">Total Price</span>
                          <span class="text-sm font-mono font-bold text-[var(--p-primary-color)]">{{ formatPrice(booking.finalPriceAmount, booking.currency) }}</span>
                        </div>
                      </div>
                      <div v-if="booking.servicesToPerform.length > 0" class="flex flex-col gap-1.5">
                        <span class="text-[0.6rem] font-mono font-bold uppercase tracking-wider text-[#5E7795]">Services</span>
                        <div class="flex flex-wrap gap-1.5">
                          <Tag
                            v-for="svc in booking.servicesToPerform"
                            :key="svc"
                            :value="svc"
                            severity="success"
                            class="text-[0.65rem]"
                          />
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <div class="flex gap-6 p-3 rounded-lg border border-[var(--p-primary-color)]/15 bg-[var(--p-primary-color)]/5">
                      <div class="flex flex-col gap-0.5">
                        <span class="text-[0.6rem] font-mono font-bold uppercase tracking-wider text-[#5E7795]">Agreed Price</span>
                        <span class="text-sm font-mono font-bold text-[var(--p-primary-color)]">{{ formatPrice(offer.proposedPriceAmount, offer.currency) }}</span>
                      </div>
                      <div class="flex flex-col gap-0.5">
                        <span class="text-[0.6rem] font-mono font-bold uppercase tracking-wider text-[#5E7795]">Proposed Date</span>
                        <span class="text-sm text-white">{{ formatDate(offer.proposedDate) }}</span>
                      </div>
                    </div>

                    <div v-if="offer.message" class="flex flex-col gap-1.5 p-3 rounded-lg border border-[rgba(121,154,183,0.12)] bg-[rgba(121,154,183,0.06)]">
                      <span class="text-[0.6rem] font-mono font-bold uppercase tracking-wider text-[#5E7795]">Your message to the client</span>
                      <p class="text-sm text-[var(--p-text-muted-color)] leading-relaxed">{{ offer.message }}</p>
                    </div>

                    <span class="text-[0.7rem] font-mono text-[#5E7795]">Accepted {{ formatDate(offer.acceptedAt) }}</span>
                  </template>

                  <div class="flex justify-end pt-3 border-t border-[rgba(94,119,149,0.1)]">
                    <Button
                      label="View Full Details"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="router.push({ name: 'service-request-detail', params: { id: offer.serviceRequestId } })"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>

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
        <div class="mb-5 p-3 rounded-lg border border-[var(--p-primary-color)]/20 bg-[var(--p-primary-color)]/8">
          <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Service Request</span>
          <p class="text-sm text-white mt-1">{{ selectedRequest.description }}</p>
        </div>
      </template>

      <div class="flex flex-col gap-4">
        <div class="flex gap-3">
          <div class="flex-1 flex flex-col gap-1.5">
            <label for="offer-price" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Price *</label>
            <InputNumber
              id="offer-price"
              v-model="offerForm.proposedPriceAmount"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              class="w-full"
              :min="0"
            />
          </div>
          <div class="flex-1 flex flex-col gap-1.5">
            <label for="offer-currency" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Currency</label>
            <Select
              id="offer-currency"
              v-model="offerForm.currency"
              :options="currencies"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="offer-date" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Proposed Date *</label>
          <Calendar
            id="offer-date"
            v-model="offerForm.proposedDate"
            dateFormat="yy-mm-dd"
            :minDate="new Date()"
            class="w-full"
            showIcon
            iconDisplay="input"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="offer-message" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Message</label>
          <Textarea
            id="offer-message"
            v-model="offerForm.message"
            class="w-full"
            placeholder="Introduce yourself and explain why they should choose your workshop..."
            :rows="4"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button label="Cancel" severity="secondary" outlined :disabled="submittingOffer" @click="closeOfferDialog" />
          <Button label="Send Offer" severity="success" :loading="submittingOffer" @click="submitOffer" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
