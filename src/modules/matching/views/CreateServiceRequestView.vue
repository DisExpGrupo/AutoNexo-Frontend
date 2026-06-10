<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/services/vehicle.service';
import { catalogService } from '@/shared/services/catalog.service';
import type { Service } from '@/shared/models/catalog.model';
import { serviceRequestService } from '@/modules/matching/services/service-request.service';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import Skeleton from 'primevue/skeleton';
import Slider from 'primevue/slider';
import L from 'leaflet';

const route = useRoute();
const router = useRouter();

const vehicles = ref<Vehicle[]>([]);
const services = ref<Service[]>([]);
const loading = ref(true);
const submitting = ref(false);
const submitted = ref(false);
const locating = ref(false);

const selectedVehicleId = ref<number | null>(
  route.query.vehicleId ? Number(route.query.vehicleId) : null
);
const selectedServiceCodes = ref<string[]>([]);

const form = ref({
  description: '',
  latitude: null as number | null,
  longitude: null as number | null,
  searchRadiusKm: 5,
});

const errors = ref<Record<string, string>>({});

let map: L.Map | null = null;
let marker: L.Marker | null = null;

const vehicleOptions = computed(() =>
  vehicles.value.map((v) => ({ ...v, label: `${v.model} \u2014 ${v.licensePlate}` }))
);

const isFormValid = computed(() =>
  selectedVehicleId.value !== null &&
  selectedServiceCodes.value.length > 0 &&
  form.value.description.trim().length > 10 &&
  form.value.latitude !== null &&
  form.value.longitude !== null &&
  form.value.searchRadiusKm > 0
);

onMounted(async () => {
  try {
    const [v, s] = await Promise.all([
      vehicleService.getMyVehicles(),
      catalogService.getServices(),
    ]);
    vehicles.value = v;
    services.value = s;
  } catch {
    errors.value.form = 'Failed to load form data. Please refresh.';
  } finally {
    loading.value = false;

    await nextTick();
    initMap();
  }
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

function initMap() {
  const defaultCenter: [number, number] = [-12.0464, -77.0428];
  map = L.map('service-request-map', {
    center: defaultCenter,
    zoom: 13,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);
}

function getLocation() {
  if (!navigator.geolocation) {
    errors.value.location = 'Geolocation is not supported by your browser.';
    return;
  }

  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      form.value.latitude = lat;
      form.value.longitude = lng;

      if (map) {
        map.setView([lat, lng], 16);

        if (marker) {
          marker.setLatLng([lat, lng]);
        } else {
          marker = L.marker([lat, lng], {
            draggable: true,
            icon: L.divIcon({
              className: 'custom-marker-icon',
              html: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12z" fill="#1B7A5A"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`,
              iconSize: [24, 36],
              iconAnchor: [12, 36],
            }),
          }).addTo(map);

          marker.on('dragend', () => {
            const pos = marker!.getLatLng();
            form.value.latitude = pos.lat;
            form.value.longitude = pos.lng;
          });
        }
      }

      locating.value = false;
    },
    () => {
      errors.value.location = 'Unable to retrieve your location.';
      locating.value = false;
    }
  );
}

async function handleSubmit() {
  if (!isFormValid.value || selectedVehicleId.value === null) return;
  submitting.value = true;
  try {
    await serviceRequestService.createServiceRequest({
      vehicleId: selectedVehicleId.value,
      requestedServices: selectedServiceCodes.value,
      description: form.value.description,
      latitude: form.value.latitude!,
      longitude: form.value.longitude!,
      searchRadiusKm: form.value.searchRadiusKm,
    });
    submitted.value = true;
  } catch {
    errors.value.form = 'Failed to create service request. Please try again.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="an-dashboard">
    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">Request Service</h1>
      <p class="an-dashboard-subtitle">Select your vehicle and the services you need.</p>
    </div>

    <template v-if="loading">
      <div class="flex flex-col gap-4">
        <Skeleton height="20rem" />
        <Skeleton height="24rem" />
      </div>
    </template>

    <template v-else-if="submitted">
      <Card class="max-w-[520px] mt-8">
        <template #content>
          <div class="flex flex-col items-center text-center gap-6">
            <i class="pi pi-check-circle text-5xl text-[var(--p-primary-color)]" />
            <div>
              <h2 class="font-mono text-2xl font-bold text-white mb-3">Request Sent</h2>
              <p class="text-[var(--p-text-muted-color)]">
                Your service request has been submitted. Workshops will respond shortly.
              </p>
            </div>
            <Button label="Back to Dashboard" @click="router.push({ name: 'dashboard' })" />
          </div>
        </template>
      </Card>
    </template>

    <form v-else @submit.prevent="handleSubmit" aria-label="Service request form" novalidate>
      <Message v-if="errors.form" severity="error" class="mb-6">
        {{ errors.form }}
      </Message>

      <Card class="mb-5">
        <template #content>
          <div class="flex items-center gap-3 mb-7">
            <span class="font-mono text-xs font-bold text-[var(--p-primary-color)] bg-[var(--p-primary-color)]/15 px-2.5 py-1 rounded tracking-wider">
              01
            </span>
            <span class="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Vehicle & Services
            </span>
          </div>

          <div class="flex flex-col gap-1.5 mb-5">
            <label for="vehicle" class="font-mono text-[0.75rem] font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
              Vehicle <span class="text-[var(--p-primary-color)]" aria-hidden="true">*</span>
            </label>
            <Select
              id="vehicle"
              v-model="selectedVehicleId"
              :options="vehicleOptions"
              option-label="label"
              option-value="id"
              placeholder="Select your vehicle"
              class="w-full"
              :aria-invalid="!!errors.vehicle"
            />
            <span v-if="errors.vehicle" class="text-xs text-[#800C1F]" role="alert">{{ errors.vehicle }}</span>
          </div>

          <div class="flex flex-col gap-1.5 mb-5">
            <span class="font-mono text-[0.75rem] font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
              Services Needed <span class="text-[var(--p-primary-color)]" aria-hidden="true">*</span>
            </span>
            <MultiSelect
              v-model="selectedServiceCodes"
              :options="services"
              option-label="displayName"
              option-value="code"
              placeholder="Select services"
              class="w-full"
              :aria-invalid="!!errors.services"
              display="chip"
            />
            <span v-if="errors.services" class="text-xs text-[#800C1F]" role="alert">{{ errors.services }}</span>
            <p v-else class="text-xs text-[#5E7795]">
              {{ selectedServiceCodes.length }} service{{ selectedServiceCodes.length !== 1 ? 's' : '' }} selected
            </p>
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="description" class="font-mono text-[0.75rem] font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
              Description <span class="text-[var(--p-primary-color)]" aria-hidden="true">*</span>
            </label>
            <Textarea
              id="description"
              v-model="form.description"
              placeholder="Describe the issue or service needed in detail..."
              rows="4"
              class="w-full"
              :aria-invalid="!!errors.description"
              :aria-describedby="errors.description ? 'desc-error' : 'desc-hint'"
            />
            <span v-if="errors.description" id="desc-error" class="text-xs text-[#800C1F]" role="alert">{{ errors.description }}</span>
            <span v-else id="desc-hint" class="text-xs text-[#5E7795]">Minimum 10 characters</span>
          </div>
        </template>
      </Card>

      <Card class="mb-5">
        <template #content>
          <div class="flex items-center gap-3 mb-7">
            <span class="font-mono text-xs font-bold text-[var(--p-primary-color)] bg-[var(--p-primary-color)]/15 px-2.5 py-1 rounded tracking-wider">
              02
            </span>
            <span class="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Location
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="flex flex-col gap-1.5">
              <label for="latitude" class="font-mono text-[0.75rem] font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
                Latitude
              </label>
              <InputNumber
                id="latitude"
                v-model="form.latitude"
                :minFractionDigits="4"
                :maxFractionDigits="8"
                placeholder="\u2014"
                class="w-full"
                aria-readonly="true"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="longitude" class="font-mono text-[0.75rem] font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
                Longitude
              </label>
              <InputNumber
                id="longitude"
                v-model="form.longitude"
                :minFractionDigits="4"
                :maxFractionDigits="8"
                placeholder="\u2014"
                class="w-full"
                aria-readonly="true"
              />
            </div>
          </div>

          <div class="flex items-center gap-3 mb-4">
            <Button
              type="button"
              icon="pi pi-map-marker"
              label="Get My Location"
              severity="secondary"
              outlined
              :loading="locating"
              @click="getLocation"
            />
            <span v-if="errors.location" class="text-sm text-[#800C1F]" role="alert">{{ errors.location }}</span>
          </div>

          <div id="service-request-map" class="h-[300px] w-full rounded-xl overflow-hidden border border-[rgba(94,119,149,0.15)] mb-2" aria-label="Location map" />
          <p class="text-xs text-[#5E7795] mb-6">Drag the marker to adjust your exact location</p>

          <div class="flex flex-col md:flex-row md:items-center gap-4 mt-5">
            <label for="searchRadius" class="font-mono text-[0.75rem] font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
              Search Radius (km)
            </label>
            <div class="flex items-center gap-4 flex-1">
              <Slider v-model="form.searchRadiusKm" :min="1" :max="50" class="flex-1" />
              <InputNumber
                id="searchRadius"
                v-model="form.searchRadiusKm"
                :min="1"
                :max="50"
                class="w-20 text-center"
                aria-label="Search radius in kilometers"
              />
            </div>
          </div>
        </template>
      </Card>

      <div class="flex justify-end gap-3 pt-6 border-t border-[rgba(94,119,149,0.15)]">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          outlined
          @click="router.push({ name: 'dashboard' })"
        />
        <Button
          type="submit"
          label="Send Request"
          :loading="submitting"
          :disabled="!isFormValid"
        />
      </div>
    </form>
  </div>
</template>

<style>
.leaflet-container {
  background: #0f1920;
}

.custom-marker-icon {
  background: none;
  border: none;
}
</style>
