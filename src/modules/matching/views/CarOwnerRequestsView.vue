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
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Skeleton from 'primevue/skeleton';
import Message from 'primevue/message';

const router = useRouter();

const activeTab = ref(0);
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

const STATUS_TAG: Record<ServiceRequestStatus, { severity: string; value: string }> = {
  PENDING: { severity: 'warn', value: 'Pending' },
  COMPLETED: { severity: 'success', value: 'Completed' },
  REJECTED: { severity: 'danger', value: 'Rejected' },
  CANCELLED: { severity: 'secondary', value: 'Cancelled' },
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
    // silently fail
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="an-dashboard max-w-3xl">
    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">Service Requests</h1>
      <p class="an-dashboard-subtitle">Track your active and past service requests.</p>
    </div>

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="0">Active</Tab>
        <Tab value="1">History</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0">
          <div v-if="loading" class="flex flex-col gap-4">
            <Skeleton v-for="i in 3" :key="i" height="12rem" />
          </div>

          <div v-else-if="activeRequests.length === 0" class="py-16 flex flex-col items-center gap-3">
            <i class="pi pi-inbox text-4xl text-[var(--p-text-muted-color)]" />
            <p class="font-mono font-bold text-[var(--p-text-muted-color)]">No active service requests.</p>
            <p class="text-sm text-[var(--p-text-muted-color)]">When you create a service request, it will appear here.</p>
          </div>

          <div v-else class="flex flex-col gap-4">
            <Card v-for="req in activeRequests" :key="req.id">
              <template #content>
                <div class="flex flex-col gap-3">
                  <div class="flex items-start justify-between">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-sm font-semibold text-white">
                        {{ getVehicle(req.vehicleId)?.model ?? 'Unknown Vehicle' }}
                      </span>
                      <span class="text-[0.8rem] font-mono font-bold text-[var(--p-primary-color)] tracking-wider">
                        {{ getVehicle(req.vehicleId)?.licensePlate ?? '—' }}
                      </span>
                    </div>
                    <Tag
                      :value="STATUS_TAG[req.status].value"
                      :severity="STATUS_TAG[req.status].severity"
                      class="text-[0.65rem] font-bold uppercase tracking-wider"
                    />
                  </div>

                  <p class="text-sm text-white leading-relaxed">{{ req.description }}</p>

                  <div class="flex flex-wrap gap-1.5">
                    <Tag
                      v-for="svc in req.requestedServices"
                      :key="svc"
                      :value="svc"
                      severity="secondary"
                      class="text-[0.65rem]"
                    />
                  </div>

                  <template v-if="getAcceptedOffer(req.id)">
                    <div class="flex gap-6 p-3 rounded-lg border border-[var(--p-primary-color)]/15 bg-[var(--p-primary-color)]/5">
                      <div class="flex flex-col gap-0.5">
                        <span class="text-[0.6rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Workshop</span>
                        <span class="text-sm text-white">#{{ getAcceptedOffer(req.id)!.workshopId }}</span>
                      </div>
                      <div class="flex flex-col gap-0.5">
                        <span class="text-[0.6rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Agreed Price</span>
                        <span class="text-sm font-mono font-bold text-[var(--p-primary-color)]">
                          {{ formatPrice(getAcceptedOffer(req.id)!.proposedPriceAmount, getAcceptedOffer(req.id)!.currency) }}
                        </span>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="getPendingOffersCount(req.id) > 0">
                    <Message severity="info" :closable="false" class="text-sm">
                      {{ getPendingOffersCount(req.id) }} offer{{ getPendingOffersCount(req.id) > 1 ? 's' : '' }} waiting
                    </Message>
                  </template>

                  <div class="flex items-center justify-between pt-3 border-t border-[rgba(94,119,149,0.1)]">
                    <span class="text-[0.7rem] font-mono text-[#5E7795]">
                      Created {{ new Date(req.createdAt).toLocaleDateString() }}
                    </span>
                    <Button
                      label="View Details"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="router.push({ name: 'service-request-detail', params: { id: req.id } })"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="1">
          <div v-if="loading" class="flex flex-col gap-4">
            <Skeleton v-for="i in 3" :key="i" height="12rem" />
          </div>

          <div v-else-if="historyRequests.length === 0" class="py-16 flex flex-col items-center gap-3">
            <i class="pi pi-history text-4xl text-[var(--p-text-muted-color)]" />
            <p class="font-mono font-bold text-[var(--p-text-muted-color)]">No history yet.</p>
            <p class="text-sm text-[var(--p-text-muted-color)]">Completed and cancelled requests will appear here.</p>
          </div>

          <div v-else class="flex flex-col gap-4">
            <Card v-for="req in historyRequests" :key="req.id">
              <template #content>
                <div class="flex flex-col gap-3">
                  <div class="flex items-start justify-between">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-sm font-semibold text-white">
                        {{ getVehicle(req.vehicleId)?.model ?? 'Unknown Vehicle' }}
                      </span>
                      <span class="text-[0.8rem] font-mono font-bold text-[var(--p-primary-color)] tracking-wider">
                        {{ getVehicle(req.vehicleId)?.licensePlate ?? '—' }}
                      </span>
                    </div>
                    <Tag
                      :value="STATUS_TAG[req.status].value"
                      :severity="STATUS_TAG[req.status].severity"
                      class="text-[0.65rem] font-bold uppercase tracking-wider"
                    />
                  </div>

                  <p class="text-sm text-white leading-relaxed">{{ req.description }}</p>

                  <div class="flex flex-wrap gap-1.5">
                    <Tag
                      v-for="svc in req.requestedServices"
                      :key="svc"
                      :value="svc"
                      severity="secondary"
                      class="text-[0.65rem]"
                    />
                  </div>

                  <div class="flex items-center justify-between pt-3 border-t border-[rgba(94,119,149,0.1)]">
                    <span class="text-[0.7rem] font-mono text-[#5E7795]">
                      Created {{ new Date(req.createdAt).toLocaleDateString() }}
                    </span>
                    <Button
                      label="View Details"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="router.push({ name: 'service-request-detail', params: { id: req.id } })"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
