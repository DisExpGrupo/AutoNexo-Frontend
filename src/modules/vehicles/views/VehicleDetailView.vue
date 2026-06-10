<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/services/vehicle.service';
import { serviceRequestService } from '@/modules/matching/services/service-request.service';
import type { ServiceRequest } from '@/modules/matching/services/service-request.service';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';

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
    <Dialog
      v-model:visible="showConfirm"
      modal
      header="Cancel Service Request?"
      :style="{ width: '400px' }"
      :closable="false"
      :draggable="false"
    >
      <div class="flex flex-col items-center text-center gap-4 py-2">
        <i class="pi pi-exclamation-circle text-4xl text-[var(--p-secondary-color)]" />
        <p class="text-sm text-[var(--p-text-muted-color)] leading-relaxed">
          Are you sure you want to cancel this pending service request? This action cannot be undone.
        </p>
      </div>
      <template #footer>
        <div class="flex justify-center gap-3">
          <Button label="Keep Request" severity="secondary" outlined @click="showConfirm = false" />
          <Button label="Cancel Request" severity="danger" @click="cancelRequest" />
        </div>
      </template>
    </Dialog>

    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">Vehicle Details</h1>
      <p class="an-dashboard-subtitle">View your vehicle information and request services.</p>
    </div>

    <div v-if="loading" class="py-16 text-center">
      <p class="text-[var(--p-text-muted-color)]">Loading vehicle...</p>
    </div>

    <Message v-else-if="error" severity="error" class="mb-4" :closable="false">{{ error }}</Message>

    <template v-else-if="vehicle">
      <Card class="max-w-2xl">
        <template #content>
          <div class="flex flex-col gap-8">
            <div class="flex items-center gap-5 pb-6 border-b border-[rgba(94,119,149,0.15)]">
              <div class="w-16 h-16 rounded-xl bg-[var(--p-primary-color)]/15 flex items-center justify-center flex-shrink-0">
                <i class="pi pi-car text-2xl text-[var(--p-primary-color)]" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-1">
                  <h2 class="text-xl font-bold font-mono text-white">{{ vehicle.model }}</h2>
                  <Tag v-if="activeRequest" value="Pending Request" severity="success" class="text-[0.65rem] font-bold uppercase tracking-wider" />
                </div>
                <p class="text-sm font-mono font-bold text-[var(--p-primary-color)] tracking-wider">{{ vehicle.licensePlate }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="flex flex-col gap-1">
                <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Brand ID</span>
                <span class="text-sm text-white">{{ vehicle.brandId }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Year</span>
                <span class="text-sm text-white">{{ vehicle.year }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Color</span>
                <span class="text-sm text-white">{{ vehicle.color }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Current Mileage</span>
                <span class="text-sm text-white">{{ vehicle.currentMileage.toLocaleString() }} km</span>
              </div>
              <div class="flex flex-col gap-1 md:col-span-2">
                <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">VIN</span>
                <span class="text-sm font-mono text-white tracking-wider">{{ vehicle.vin }}</span>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t border-[rgba(94,119,149,0.15)]">
              <Button
                v-if="activeRequest"
                label="Cancel Request"
                severity="danger"
                outlined
                :disabled="cancelling"
                @click="showConfirm = true"
              />
              <Button
                v-if="activeRequest"
                label="View Request Details"
                @click="viewRequestDetails"
              />
              <Button
                v-else
                label="Request Service"
                icon="pi pi-plus"
                @click="requestService"
              />
            </div>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>
