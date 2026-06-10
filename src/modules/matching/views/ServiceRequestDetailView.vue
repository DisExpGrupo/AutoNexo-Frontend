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
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import Skeleton from 'primevue/skeleton';
import ProgressSpinner from 'primevue/progressspinner';

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

const REQUEST_STATUS_SEVERITY: Record<ServiceRequest['status'], 'warn' | 'success' | 'danger' | 'secondary'> = {
  PENDING: 'warn',
  COMPLETED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'secondary',
};

const OFFER_STATUS_LABELS: Record<Offer['status'], string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  WITHDRAWN: 'Withdrawn',
};

const OFFER_STATUS_SEVERITY: Record<Offer['status'], 'warn' | 'success' | 'danger' | 'secondary'> = {
  PENDING: 'warn',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'secondary',
  WITHDRAWN: 'secondary',
};

const BOOKING_STATUS_LABELS: Record<Booking['status'], string> = {
  PENDING_SCHEDULE: 'Pending Schedule',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const BOOKING_STATUS_SEVERITY: Record<Booking['status'], 'warn' | 'success' | 'danger' | 'secondary'> = {
  PENDING_SCHEDULE: 'warn',
  SCHEDULED: 'success',
  IN_PROGRESS: 'warn',
  COMPLETED: 'success',
  CANCELLED: 'danger',
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
      <div class="mb-2">
        <Button
          label="Back"
          icon="pi pi-arrow-left"
          text
          severity="secondary"
          size="small"
          @click="goBack"
          aria-label="Go back"
        />
      </div>
      <h1 class="an-dashboard-title">Service Request</h1>
      <p class="an-dashboard-subtitle">Details of your service request.</p>
    </div>

    <template v-if="loading">
      <div class="flex flex-col gap-4 p-16">
        <Skeleton height="2rem" class="mb-2" />
        <Skeleton height="1rem" width="50%" class="mb-4" />
        <Skeleton height="12rem" class="mb-4" />
        <Skeleton height="12rem" />
      </div>
    </template>

    <template v-else-if="error">
      <Message severity="error" class="mb-4">{{ error }}</Message>
    </template>

    <template v-else-if="request">
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div class="flex flex-col gap-5">
          <Card>
            <template #content>
              <div class="mb-6 pb-5 border-b border-[rgba(94,119,149,0.15)]">
                <div class="font-mono text-xs font-bold tracking-widest uppercase text-[#799AB7]">
                  Request #{{ request.id }}
                </div>
                <div class="flex items-center gap-3 mt-2">
                  <Tag :value="REQUEST_STATUS_LABELS[request.status]" :severity="REQUEST_STATUS_SEVERITY[request.status]" />
                  <span class="text-sm text-[#799AB7] font-sans">Created {{ new Date(request.createdAt).toLocaleDateString() }}</span>
                </div>
              </div>

              <div class="mb-6">
                <h3 class="font-mono text-[0.7rem] font-bold tracking-widest uppercase text-[#799AB7] mb-3">Requested Services</h3>
                <div class="flex flex-wrap gap-2">
                  <Tag v-for="service in request.requestedServices" :key="service" :value="service" severity="success" />
                </div>
              </div>

              <div class="mb-6">
                <h3 class="font-mono text-[0.7rem] font-bold tracking-widest uppercase text-[#799AB7] mb-3">Description</h3>
                <p class="text-[0.9375rem] text-[#F8FAFC] leading-relaxed font-sans">{{ request.description }}</p>
              </div>

              <div>
                <h3 class="font-mono text-[0.7rem] font-bold tracking-widest uppercase text-[#799AB7] mb-3">Search Parameters</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1">
                    <span class="font-mono text-[0.65rem] font-bold tracking-widest uppercase text-[#799AB7]">Radius</span>
                    <span class="font-mono text-sm text-[#F8FAFC]">{{ request.searchRadiusKm }} km</span>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="font-mono text-[0.65rem] font-bold tracking-widest uppercase text-[#799AB7]">Location</span>
                    <span class="font-mono text-sm text-[#F8FAFC]">{{ request.latitude.toFixed(4) }}, {{ request.longitude.toFixed(4) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <Card>
            <template #title>
              <span class="font-mono text-[0.7rem] font-bold tracking-widest uppercase text-[#799AB7]">
                {{ hasBooking ? 'Booking Summary' : 'Offers' }}
              </span>
            </template>
            <template #content>
              <template v-if="hasBooking">
                <Card class="mt-1 border border-[rgba(27,122,90,0.2)]" :pt="{ root: { class: 'bg-[#0f1920]' } }">
                  <template #content>
                    <div class="flex justify-between items-center mb-4">
                      <div class="flex items-center gap-2">
                        <i class="pi pi-exclamation-triangle text-[#1B7A5A] text-sm"></i>
                        <span class="font-mono text-sm font-bold tracking-wide text-[#1B7A5A]">Service Scheduled</span>
                      </div>
                      <Tag :value="BOOKING_STATUS_LABELS[booking!.status]" :severity="BOOKING_STATUS_SEVERITY[booking!.status]" />
                    </div>

                    <div class="border-t border-dashed border-[rgba(94,119,149,0.25)] my-3.5 relative">
                      <div class="absolute -top-[3px] left-0 right-0 h-[6px]" style="background-image: radial-gradient(circle, #5E7795 1px, transparent 1px); background-size: 8px 8px; opacity: 0.4;"></div>
                    </div>

                    <div class="flex gap-6">
                      <div class="flex flex-col gap-1">
                        <span class="font-mono text-[0.6rem] font-bold tracking-widest uppercase text-[#5E7795]">Scheduled Date</span>
                        <span class="font-sans text-[0.9375rem] text-[#F8FAFC]">{{ formatDate(booking!.scheduledDate) }}</span>
                      </div>
                      <div class="flex flex-col gap-1">
                        <span class="font-mono text-[0.6rem] font-bold tracking-widest uppercase text-[#5E7795]">Total Price</span>
                        <span class="font-mono font-bold text-[#1B7A5A] text-lg">{{ formatPrice(booking!.finalPriceAmount, booking!.currency) }}</span>
                      </div>
                    </div>

                    <div class="border-t border-dashed border-[rgba(94,119,149,0.25)] my-3.5 relative">
                      <div class="absolute -top-[3px] left-0 right-0 h-[6px]" style="background-image: radial-gradient(circle, #5E7795 1px, transparent 1px); background-size: 8px 8px; opacity: 0.4;"></div>
                    </div>

                    <div class="mt-1">
                      <span class="block font-mono text-[0.6rem] font-bold tracking-widest uppercase text-[#5E7795] mb-2.5">Services to Perform</span>
                      <ul class="list-none p-0 m-0 flex flex-col gap-2">
                        <li v-for="svc in booking!.servicesToPerform" :key="svc" class="flex items-center gap-2.5 font-sans text-sm text-[#F8FAFC]">
                          <i class="pi pi-check text-[#1B7A5A] text-xs"></i>
                          {{ svc }}
                        </li>
                      </ul>
                    </div>

                    <div v-if="booking!.notes" class="mt-3.5 pt-3.5 border-t border-dashed border-[rgba(94,119,149,0.2)]">
                      <span class="block font-mono text-[0.6rem] font-bold tracking-widest uppercase text-[#5E7795] mb-1.5">Notes</span>
                      <p class="font-sans text-sm text-[#799AB7] leading-relaxed">{{ booking!.notes }}</p>
                    </div>
                  </template>
                </Card>
              </template>

              <template v-else-if="offers.length === 0">
                <div class="flex flex-col items-center py-12 px-6 gap-4">
                  <ProgressSpinner style="width: 32px; height: 32px;" strokeWidth="4" />
                  <p class="text-sm text-[#799AB7] font-sans text-center">Searching for the best workshops near you...</p>
                </div>
              </template>

              <template v-else>
                <div class="flex flex-col gap-3">
                  <Card
                    v-for="offer in offers"
                    :key="offer.id"
                    :class="['border', selectedOffer?.id === offer.id ? 'border-[#1B7A5A] bg-[rgba(27,122,90,0.06)]' : 'border-[rgba(94,119,149,0.15)]']"
                    :pt="{ root: { class: 'bg-[#0f1920]' } }"
                  >
                    <template #content>
                      <div class="flex justify-between items-start mb-4">
                        <div class="flex flex-col gap-0.5">
                          <span class="font-mono text-[0.65rem] font-bold tracking-widest uppercase text-[#5E7795]">Workshop</span>
                          <span class="font-mono text-sm font-bold text-[#F8FAFC]">#{{ offer.workshopId }}</span>
                        </div>
                        <Tag :value="OFFER_STATUS_LABELS[offer.status]" :severity="OFFER_STATUS_SEVERITY[offer.status]" />
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div class="flex flex-col gap-0.5">
                          <span class="font-mono text-[0.6rem] font-bold tracking-widest uppercase text-[#5E7795]">Price</span>
                          <span class="font-mono font-bold text-[#1B7A5A] text-sm">{{ formatPrice(offer.proposedPriceAmount, offer.currency) }}</span>
                        </div>
                        <div class="flex flex-col gap-0.5">
                          <span class="font-mono text-[0.6rem] font-bold tracking-widest uppercase text-[#5E7795]">Proposed Date</span>
                          <span class="font-sans text-sm text-[#F8FAFC]">{{ formatDate(offer.proposedDate) }}</span>
                        </div>
                      </div>

                      <div v-if="offer.message" class="pt-3 border-t border-[rgba(94,119,149,0.1)] mb-3">
                        <span class="block font-mono text-[0.6rem] font-bold tracking-widest uppercase text-[#5E7795] mb-1.5">Message</span>
                        <p class="font-sans text-sm text-[#799AB7] leading-relaxed">{{ offer.message }}</p>
                      </div>

                      <template v-if="selectedOffer?.id === offer.id">
                        <div class="flex items-center gap-2 pt-3 border-t border-[rgba(27,122,90,0.2)] font-sans text-sm text-[#1B7A5A]">
                          <i class="pi pi-check text-xs"></i>
                          <span>This workshop has been selected</span>
                        </div>
                      </template>

                      <template v-else-if="request.status === 'PENDING'">
                        <div class="flex justify-end pt-3 border-t border-[rgba(94,119,149,0.1)]">
                          <Button
                            label="Accept Offer"
                            severity="success"
                            size="small"
                            @click="acceptOfferHandler(offer)"
                          />
                        </div>
                      </template>
                    </template>
                  </Card>
                </div>
              </template>
            </template>
          </Card>
        </div>

        <div v-if="vehicle" class="sticky top-6">
          <Card>
            <template #content>
              <div class="flex items-center gap-3.5 mb-5 pb-4 border-b border-[rgba(94,119,149,0.15)]">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(27,122,90,0.15)]">
                    <i class="pi pi-car text-[#1B7A5A] text-lg"></i>
                  </div>
                </div>
                <div>
                  <h4 class="font-mono text-base font-bold text-[#F8FAFC] mb-1">{{ vehicle.model }}</h4>
                  <p class="font-mono text-xs font-bold text-[#1B7A5A] tracking-wide m-0">{{ vehicle.licensePlate }}</p>
                </div>
              </div>

              <div class="flex flex-col gap-3 mb-5">
                <div class="flex justify-between items-center">
                  <span class="font-mono text-[0.65rem] font-bold tracking-widest uppercase text-[#799AB7]">Year</span>
                  <span class="font-sans text-sm text-[#F8FAFC]">{{ vehicle.year }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-mono text-[0.65rem] font-bold tracking-widest uppercase text-[#799AB7]">Color</span>
                  <span class="font-sans text-sm text-[#F8FAFC]">{{ vehicle.color }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="font-mono text-[0.65rem] font-bold tracking-widest uppercase text-[#799AB7]">Mileage</span>
                  <span class="font-sans text-sm text-[#F8FAFC]">{{ vehicle.currentMileage.toLocaleString() }} km</span>
                </div>
              </div>

              <Button
                label="View Vehicle"
                icon="pi pi-chevron-right"
                iconPos="right"
                outlined
                severity="success"
                class="w-full"
                @click="router.push({ name: 'vehicle-detail', params: { id: vehicle.id } })"
              />
            </template>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
