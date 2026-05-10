<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/services/vehicle.service';
import { catalogService } from '@/shared/services/catalog.service';
import type { Service } from '@/shared/models/catalog.model';
import { serviceRequestService } from '@/modules/matching/services/service-request.service';
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
      <div class="sr-loading">
        <p class="sr-loading-text">Loading...</p>
      </div>
    </template>

    <template v-else-if="submitted">
      <div class="sr-success-state">
        <div class="sr-success-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <circle cx="24" cy="24" r="20" stroke="#1B7A5A" stroke-width="3"/>
            <path d="M16 24l6 6 12-12" stroke="#1B7A5A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="sr-success-title">Request Sent</h2>
        <p class="sr-success-text">Your service request has been submitted. Workshops will respond shortly.</p>
        <button class="sr-btn-primary" @click="router.push({ name: 'dashboard' })">
          Back to Dashboard
        </button>
      </div>
    </template>

    <form v-else @submit.prevent="handleSubmit" aria-label="Service request form" novalidate>
      <div v-if="errors.form" class="sr-form-error" role="alert">
        {{ errors.form }}
      </div>

      <div class="sr-form-card">
        <div class="sr-step-header">
          <span class="sr-step-badge">01</span>
          <span class="sr-step-label">Vehicle & Services</span>
        </div>

        <div class="sr-form-group">
          <label for="vehicle" class="sr-form-label">
            Vehicle <span class="sr-form-required" aria-hidden="true">*</span>
          </label>
          <div class="sr-select-wrapper">
            <select
              id="vehicle"
              v-model="selectedVehicleId"
              class="sr-select"
              :aria-invalid="!!errors.vehicle"
            >
              <option :value="null" disabled>Select your vehicle</option>
              <option v-for="v in vehicles" :key="v.id" :value="v.id">
                {{ v.model }} — {{ v.licensePlate }}
              </option>
            </select>
          </div>
          <span v-if="errors.vehicle" class="sr-form-field-error" role="alert">{{ errors.vehicle }}</span>
        </div>

        <div class="sr-form-group">
          <label for="services" class="sr-form-label">
            Services Needed <span class="sr-form-required" aria-hidden="true">*</span>
          </label>
          <div class="sr-select-wrapper">
            <select
              id="services"
              v-model="selectedServiceCodes"
              class="sr-select"
              multiple
              size="5"
              style="height: auto;"
              :aria-invalid="!!errors.services"
            >
              <option v-for="svc in services" :key="svc.code" :value="svc.code">
                {{ svc.displayName }}
              </option>
            </select>
            <p class="sr-form-hint">Hold Ctrl / Cmd to select multiple services</p>
          </div>
        </div>

        <div class="sr-form-group">
          <label for="description" class="sr-form-label">
            Description <span class="sr-form-required" aria-hidden="true">*</span>
          </label>
          <textarea
            id="description"
            v-model="form.description"
            class="sr-textarea"
            placeholder="Describe the issue or service needed in detail..."
            rows="4"
            :aria-invalid="!!errors.description"
            :aria-describedby="errors.description ? 'desc-error' : 'desc-hint'"
          />
          <span v-if="errors.description" id="desc-error" class="sr-form-field-error" role="alert">{{ errors.description }}</span>
          <span v-else id="desc-hint" class="sr-form-hint">Minimum 10 characters</span>
        </div>
      </div>

      <div class="sr-form-card">
        <div class="sr-step-header">
          <span class="sr-step-badge">02</span>
          <span class="sr-step-label">Location</span>
        </div>

        <div class="sr-form-grid">
          <div class="sr-form-group">
            <label for="latitude" class="sr-form-label">Latitude</label>
            <input
              id="latitude"
              v-model="form.latitude"
              type="number"
              step="any"
              class="sr-input sr-input--disabled"
              disabled
              placeholder="—"
              aria-readonly="true"
            />
          </div>

          <div class="sr-form-group">
            <label for="longitude" class="sr-form-label">Longitude</label>
            <input
              id="longitude"
              v-model="form.longitude"
              type="number"
              step="any"
              class="sr-input sr-input--disabled"
              disabled
              placeholder="—"
              aria-readonly="true"
            />
          </div>
        </div>

        <div class="sr-location-action">
          <button
            type="button"
            class="sr-btn-location"
            :disabled="locating"
            @click="getLocation"
          >
            <svg v-if="!locating" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span v-if="locating" class="sr-btn-spinner-sm" aria-hidden="true"></span>
            {{ locating ? 'Locating...' : 'Get My Location' }}
          </button>
          <span v-if="errors.location" class="sr-form-field-error" role="alert">{{ errors.location }}</span>
        </div>

        <div id="service-request-map" class="sr-map" aria-label="Location map"></div>
        <p class="sr-map-hint">Drag the marker to adjust your exact location</p>

        <div class="sr-form-group sr-form-group--inline sr-radius-group">
          <label for="searchRadius" class="sr-form-label">
            Search Radius (km)
          </label>
          <div class="sr-slider-wrapper">
            <Slider
              v-model="form.searchRadiusKm"
              :min="1"
              :max="50"
              class="sr-slider"
            />
            <input
              id="searchRadius"
              v-model="form.searchRadiusKm"
              type="number"
              min="1"
              max="50"
              class="sr-input sr-input--sm"
              aria-label="Search radius in kilometers"
            />
          </div>
        </div>
      </div>

      <div class="sr-form-actions">
        <button
          type="button"
          class="sr-btn-secondary"
          @click="router.push({ name: 'dashboard' })"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="sr-btn-primary"
          :disabled="!isFormValid || submitting"
          :aria-busy="submitting"
        >
          <span v-if="submitting" class="sr-btn-spinner" aria-hidden="true"></span>
          {{ submitting ? 'Sending...' : 'Send Request' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.sr-loading {
  display: flex;
  justify-content: center;
  padding: 64px;
}

.sr-loading-text {
  font-family: 'Inter', sans-serif;
  color: #799AB7;
}

.sr-success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 32px;
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 16px;
  max-width: 520px;
  margin-top: 32px;
}

.sr-success-icon {
  margin-bottom: 24px;
}

.sr-success-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 12px;
}

.sr-success-text {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: #799AB7;
  margin: 0 0 32px;
  line-height: 1.6;
}

.sr-form-error {
  background: rgba(128, 12, 31, 0.15);
  border: 1px solid #800C1F;
  border-radius: 8px;
  padding: 12px 16px;
  color: #F8FAFC;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  margin-bottom: 24px;
}

.sr-form-card {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 20px;
}

.sr-step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.sr-step-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1B7A5A;
  background: rgba(27, 122, 90, 0.15);
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.sr-step-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #F8FAFC;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.sr-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}

.sr-form-group:last-child {
  margin-bottom: 0;
}

.sr-form-group--inline {
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

.sr-form-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #799AB7;
}

.sr-form-required {
  color: #1B7A5A;
}

.sr-form-hint {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #5E7795;
  margin-top: 4px;
}

.sr-form-field-error {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #800C1F;
}

.sr-input {
  background: #0f1920;
  border: 1px solid #5E7795;
  border-radius: 8px;
  color: #F8FAFC;
  padding: 12px 14px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.sr-input::placeholder {
  color: #5E7795;
}

.sr-input:focus {
  outline: none;
  border-color: #1B7A5A;
  box-shadow: 0 0 0 3px rgba(27, 122, 90, 0.2);
}

.sr-input--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sr-input--sm {
  max-width: 80px;
  padding: 8px 12px;
  font-size: 0.875rem;
  text-align: center;
}

.sr-select-wrapper {
  position: relative;
}

.sr-select {
  appearance: none;
  background: #0f1920;
  border: 1px solid #5E7795;
  border-radius: 8px;
  color: #F8FAFC;
  padding: 12px 40px 12px 14px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  width: 100%;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.sr-select:focus {
  outline: none;
  border-color: #1B7A5A;
  box-shadow: 0 0 0 3px rgba(27, 122, 90, 0.2);
}

.sr-select option {
  background: #1a2630;
  color: #F8FAFC;
}

.sr-textarea {
  background: #0f1920;
  border: 1px solid #5E7795;
  border-radius: 8px;
  color: #F8FAFC;
  padding: 12px 14px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.sr-textarea::placeholder {
  color: #5E7795;
}

.sr-textarea:focus {
  outline: none;
  border-color: #1B7A5A;
  box-shadow: 0 0 0 3px rgba(27, 122, 90, 0.2);
}

.sr-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.sr-location-action {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.sr-btn-location {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(27, 122, 90, 0.15);
  border: 1px solid #1B7A5A;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 0.8rem;
  padding: 8px 16px;
  color: #1B7A5A;
  cursor: pointer;
  transition: background 0.15s;
  letter-spacing: 0.03em;
}

.sr-btn-location:hover:not(:disabled) {
  background: rgba(27, 122, 90, 0.25);
}

.sr-btn-location:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sr-map {
  height: 300px;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(94, 119, 149, 0.15);
  margin-bottom: 8px;
}

.sr-map-hint {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #5E7795;
  margin-bottom: 24px;
}

.sr-radius-group {
  margin-top: 20px;
}

.sr-slider-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.sr-slider {
  flex: 1;
}

.sr-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid rgba(94, 119, 149, 0.15);
}

.sr-btn-primary {
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

.sr-btn-primary:hover:not(:disabled) {
  background: #165c48;
}

.sr-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sr-btn-secondary {
  background: transparent;
  border: 1px solid #5E7795;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 12px 28px;
  color: #799AB7;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  letter-spacing: 0.03em;
}

.sr-btn-secondary:hover {
  border-color: #799AB7;
  background: rgba(94, 119, 149, 0.1);
}

.sr-btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(248, 250, 252, 0.3);
  border-top-color: #F8FAFC;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.sr-btn-spinner-sm {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(27, 122, 90, 0.3);
  border-top-color: #1B7A5A;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .sr-form-grid {
    grid-template-columns: 1fr;
  }

  .sr-form-card {
    padding: 24px 20px;
  }

  .sr-form-group--inline {
    flex-direction: column;
    align-items: flex-start;
  }

  .sr-slider-wrapper {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
}
</style>

<style>
.leaflet-container {
  background: #0f1920;
}

.custom-marker-icon {
  background: none;
  border: none;
}
</style>