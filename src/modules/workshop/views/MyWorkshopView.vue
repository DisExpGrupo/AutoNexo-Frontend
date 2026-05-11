<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue';
import { workshopService } from '@/modules/workshop/services/workshop.service';
import type { Workshop, WorkshopLocation, CreateWorkshopLocationRequest, ServiceTemplate, CreateServiceTemplateRequest } from '@/modules/workshop/services/workshop.service';
import { catalogService } from '@/shared/services/catalog.service';
import type { ServiceCategoryInfo, Service } from '@/shared/models/catalog.model';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import { useToast } from 'primevue/usetoast';
import L from 'leaflet';

const toast = useToast();

const workshop = ref<Workshop | null>(null);
const locations = ref<WorkshopLocation[]>([]);
const loading = ref(true);
const workshopError = ref<string | null>(null);
const activeTab = ref<'general' | 'locations' | 'services'>('general');

const showLocationDialog = ref(false);
const locationForm = ref<CreateWorkshopLocationRequest>({
  street: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  latitude: -12.0464,
  longitude: -77.0428,
});
const savingLocation = ref(false);
const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let marker: L.Marker | null = null;

const addressSearch = ref('');
interface AddressResult {
  lat: number;
  lng: number;
  display: string;
}
const searchResults = shallowRef<AddressResult[]>([]);
const searchingAddress = ref(false);
const locating = ref(false);

// Service templates
const serviceTemplates = ref<ServiceTemplate[]>([]);
const showServiceDialog = ref(false);
const serviceCategories = ref<ServiceCategoryInfo[]>([]);
const availableServices = ref<Service[]>([]);
const savingTemplate = ref(false);
const serviceForm = ref({
  categoryCode: '' as string,
  catalogServiceCode: '' as string,
  customName: '',
  description: '',
  basePriceAmount: 0,
  estimatedDurationMinutes: 30,
});

// Public preview
const publicWorkshop = ref<any>(null);
const loadingPreview = ref(false);

onMounted(async () => {
  try {
    workshop.value = await workshopService.getMyWorkshop();
    const [locs, cats] = await Promise.all([
      workshopService.getLocations(),
      catalogService.getServiceCategories(),
    ]);
    locations.value = locs;
    serviceCategories.value = cats;
    if (workshop.value?.id) {
      serviceTemplates.value = await workshopService.getServiceTemplates(workshop.value.id);
    }
  } catch {
    workshopError.value = 'Failed to load workshop data.';
  } finally {
    loading.value = false;
  }
});

function openLocationDialog() {
  locationForm.value = {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    latitude: -12.0464,
    longitude: -77.0428,
  };
  addressSearch.value = '';
  searchResults.value = [];
  showLocationDialog.value = true;
  setTimeout(initMap, 100);
}

function initMap() {
  if (!mapContainer.value || map) return;

  map = L.map(mapContainer.value).setView([locationForm.value.latitude, locationForm.value.longitude], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  marker = L.marker([locationForm.value.latitude, locationForm.value.longitude], {
    draggable: true,
  }).addTo(map);

  marker.on('dragend', () => {
    const pos = marker!.getLatLng();
    locationForm.value.latitude = pos.lat;
    locationForm.value.longitude = pos.lng;
    reverseGeocode(pos.lat, pos.lng);
  });

  map.on('click', (e) => {
    marker!.setLatLng(e.latlng);
    locationForm.value.latitude = e.latlng.lat;
    locationForm.value.longitude = e.latlng.lng;
    reverseGeocode(e.latlng.lat, e.latlng.lng);
  });
}

function updateMapPosition(lat: number, lng: number) {
  if (!map || !marker) return;
  marker.setLatLng([lat, lng]);
  map.setView([lat, lng], 15);
  locationForm.value.latitude = lat;
  locationForm.value.longitude = lng;
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept': 'application/json' } }
    );
    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      locationForm.value.street = addr.road || addr.pedestrian || addr.roundabout || addr.path || addr.place || data.display_name.split(',')[0];
      locationForm.value.city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
      locationForm.value.state = addr.state || '';
      locationForm.value.zip = addr.postcode || '';
      locationForm.value.country = addr.country || '';
    }
  } catch {
  }
}

async function searchAddress() {
  if (!addressSearch.value.trim()) return;
  searchingAddress.value = true;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch.value)}&limit=5`,
      { headers: { 'Accept': 'application/json' } }
    );
    const data = await res.json();
    searchResults.value = data.map((r: any): AddressResult => ({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), display: r.display_name }));
  } catch {
    toast.add({ severity: 'error', summary: 'Search failed', detail: 'Could not search that address.', life: 3000 });
  } finally {
    searchingAddress.value = false;
  }
}

function selectSearchResult(result: AddressResult) {
  updateMapPosition(result.lat, result.lng);
  const parts = result.display.split(',');
  locationForm.value.street = parts[0] || '';
  locationForm.value.city = parts[1]?.trim() || '';
  searchResults.value = [];
  addressSearch.value = '';
  reverseGeocode(result.lat, result.lng);
}

function locateMe() {
  if (!navigator.geolocation) {
    toast.add({ severity: 'warn', summary: 'Unavailable', detail: 'Geolocation is not supported by your browser.', life: 3000 });
    return;
  }
  locating.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      updateMapPosition(latitude, longitude);
      reverseGeocode(latitude, longitude);
      locating.value = false;
    },
    () => {
      toast.add({ severity: 'error', summary: 'Location Error', detail: 'Could not get your current location.', life: 4000 });
      locating.value = false;
    }
  );
}

function onDialogHide() {
  if (map) {
    map.remove();
    map = null;
    marker = null;
  }
  showLocationDialog.value = false;
  searchResults.value = [];
  showServiceDialog.value = false;
}

function saveLocation() {
  if (!locationForm.value.street || !locationForm.value.city || !locationForm.value.country) {
    toast.add({ severity: 'warn', summary: 'Required', detail: 'Fill all required fields.', life: 3000 });
    return;
  }
  savingLocation.value = true;
  workshopService.createLocation(locationForm.value)
    .then(() => {
      toast.add({ severity: 'success', summary: 'Saved', detail: 'Location added successfully.', life: 3000 });
      onDialogHide();
      return workshopService.getLocations();
    })
    .then((updated) => {
      locations.value = updated;
    })
    .catch(() => {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save location.', life: 4000 });
    })
    .finally(() => {
      savingLocation.value = false;
    });
}

function confirmDeleteLocation(id: number) {
  if (!confirm('Delete this location?')) return;
  workshopService.deleteLocation(id)
    .then(() => {
      locations.value = locations.value.filter((l) => l.id !== id);
      toast.add({ severity: 'success', summary: 'Deleted', detail: 'Location removed.', life: 3000 });
    })
    .catch(() => {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete location.', life: 4000 });
    });
}

function openServiceDialog() {
  serviceForm.value = {
    categoryCode: '',
    catalogServiceCode: '',
    customName: '',
    description: '',
    basePriceAmount: 0,
    estimatedDurationMinutes: 30,
  };
  availableServices.value = [];
  showServiceDialog.value = true;
}

async function onCategoryChange() {
  serviceForm.value.catalogServiceCode = '';
  if (serviceForm.value.categoryCode) {
    availableServices.value = await catalogService.getServices(serviceForm.value.categoryCode);
  } else {
    availableServices.value = [];
  }
}

async function onServiceChange() {
  const svc = availableServices.value.find((s) => s.code === serviceForm.value.catalogServiceCode);
  if (svc) {
    serviceForm.value.customName = svc.displayName;
    serviceForm.value.description = svc.description;
  }
}

function saveServiceTemplate() {
  if (!serviceForm.value.categoryCode || !serviceForm.value.catalogServiceCode || serviceForm.value.basePriceAmount <= 0) {
    toast.add({ severity: 'warn', summary: 'Required', detail: 'Select a service and enter a valid price.', life: 3000 });
    return;
  }
  savingTemplate.value = true;
  const payload: CreateServiceTemplateRequest = {
    code: serviceForm.value.categoryCode,
    catalogService: serviceForm.value.catalogServiceCode,
    customName: serviceForm.value.customName,
    description: serviceForm.value.description,
    basePriceAmount: serviceForm.value.basePriceAmount,
    estimatedDurationMinutes: serviceForm.value.estimatedDurationMinutes,
    currency: 'PEN',
  };
  workshopService.createServiceTemplate(payload)
    .then(() => {
      toast.add({ severity: 'success', summary: 'Added', detail: 'Service added to your menu.', life: 3000 });
      onDialogHide();
      if (workshop.value?.id) {
        return workshopService.getServiceTemplates(workshop.value.id);
      }
    })
    .then((updated) => {
      if (updated) serviceTemplates.value = updated;
    })
    .catch(() => {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to add service.', life: 4000 });
    })
    .finally(() => {
      savingTemplate.value = false;
    });
}

function loadPublicPreview() {
  if (!workshop.value?.id) return;
  loadingPreview.value = true;
  workshopService.getPublicWorkshop(workshop.value.id)
    .then((data) => {
      publicWorkshop.value = data;
    })
    .catch(() => {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load public preview.', life: 4000 });
    })
    .finally(() => {
      loadingPreview.value = false;
    });
}

function formatPrice(amount: number, currency: string): string {
  if (!currency) return new Intl.NumberFormat('es-PE', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);
}
</script>

<template>
  <div class="an-dashboard">
    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">My Workshop</h1>
      <p class="an-dashboard-subtitle">Manage your workshop information and locations.</p>
    </div>

    <template v-if="loading">
      <div class="detail-loading">
        <p class="detail-loading-text">Loading workshop...</p>
      </div>
    </template>

    <template v-else-if="workshopError">
      <div class="detail-error" role="alert">{{ workshopError }}</div>
    </template>

    <template v-else-if="workshop">
      <div class="workshop-tabs">
        <div class="tab-list" role="tablist">
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'general' }"
            role="tab"
            :aria-selected="activeTab === 'general'"
            @click="activeTab = 'general'"
          >
            General Info
          </button>
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'locations' }"
            role="tab"
            :aria-selected="activeTab === 'locations'"
            @click="activeTab = 'locations'"
          >
            Locations
          </button>
          <button
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === 'services' }"
            role="tab"
            :aria-selected="activeTab === 'services'"
            @click="activeTab = 'services'"
          >
            Services
          </button>
        </div>

        <div v-if="activeTab === 'general'" class="tab-panel" role="tabpanel">
          <div class="general-card">
            <div class="general-header">
              <div v-if="workshop.logoUrl" class="workshop-logo">
                <img :src="workshop.logoUrl" :alt="`${workshop.name} logo`" />
              </div>
              <div v-else class="workshop-logo-placeholder">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <rect width="40" height="40" rx="12" fill="rgba(27, 122, 90, 0.15)"/>
                  <path d="M12 28V20L16 16H24L28 20V28H12Z" stroke="#1B7A5A" stroke-width="2" stroke-linejoin="round"/>
                  <circle cx="17" cy="28" r="2" fill="#1B7A5A"/>
                  <circle cx="23" cy="28" r="2" fill="#1B7A5A"/>
                </svg>
              </div>
              <div class="general-header-info">
                <h2 class="general-workshop-name">{{ workshop.name }}</h2>
                <span class="verified-badge" :class="workshop.rucVerified ? 'verified-badge--yes' : 'verified-badge--no'">
                  {{ workshop.rucVerified ? 'RUC Verified' : 'RUC Not Verified' }}
                </span>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Legal Name</span>
                <span class="info-value">{{ workshop.legalName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">RUC</span>
                <span class="info-value info-value--mono">{{ workshop.ruc }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Trust Score</span>
                <span class="info-value">{{ workshop.trustScore ?? 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status</span>
                <span class="info-value">{{ workshop.active ? 'Active' : 'Inactive' }}</span>
              </div>
              <div class="info-item info-item--full">
                <span class="info-label">Description</span>
                <span class="info-value">{{ workshop.shortDescription }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'locations'" class="tab-panel" role="tabpanel">
          <div class="locations-toolbar">
            <button class="add-location-btn" @click="openLocationDialog">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Add New Location
            </button>
          </div>

          <div v-if="locations.length === 0" class="locations-empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="20" r="8" stroke="#799AB7" stroke-width="2"/>
              <path d="M24 28v10M18 38h12" stroke="#799AB7" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p class="locations-empty-text">No locations registered yet.</p>
            <p class="locations-empty-hint">Add your first workshop location to start receiving service requests.</p>
          </div>

          <div v-else class="locations-grid">
            <div v-for="loc in locations" :key="loc.id" class="location-card">
              <div class="location-card-header">
                <div class="location-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 2C7.24 2 5 4.24 5 7c0 4.25 5 11 5 11s5-6.75 5-11c0-2.76-2.24-5-5-5z" stroke="#1B7A5A" stroke-width="1.5"/>
                    <circle cx="10" cy="7" r="1.5" fill="#1B7A5A"/>
                  </svg>
                </div>
                <button class="location-delete-btn" aria-label="Delete location" @click="confirmDeleteLocation(loc.id)">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 3.5h10M5 3.5V2h4v1.5M3.5 3.5l.5 9h6l.5-9" stroke="#800C1F" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div class="location-address">
                <p class="location-street">{{ loc.street }}</p>
                <p class="location-city">{{ loc.city }}, {{ loc.state }} {{ loc.zip }}</p>
                <p class="location-country">{{ loc.country }}</p>
              </div>
              <div class="location-coords">
                <span class="location-coords-label">Lat/Lng</span>
                <span class="location-coords-value">{{ loc.latitude.toFixed(4) }}, {{ loc.longitude.toFixed(4) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'services'" class="tab-panel" role="tabpanel">
          <div class="services-toolbar">
            <button class="add-service-btn" @click="openServiceDialog">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Add Service to Menu
            </button>
          </div>

          <div v-if="serviceTemplates.length === 0" class="services-empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M24 10v28M10 24h28" stroke="#799AB7" stroke-width="2" stroke-linecap="round"/>
              <circle cx="24" cy="24" r="18" stroke="#799AB7" stroke-width="2"/>
            </svg>
            <p class="services-empty-text">No services in your menu yet.</p>
            <p class="services-empty-hint">Add services so car owners can find you when searching for repairs.</p>
          </div>

          <div v-else class="services-table-wrapper">
            <table class="services-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tpl in serviceTemplates" :key="tpl.id ?? tpl.catalogService">
                  <td>
                    <div class="service-name">{{ tpl.displayName }}</div>
                    <div class="service-desc">{{ tpl.description }}</div>
                  </td>
                  <td>
                    <span class="service-category-badge">{{ tpl.code }}</span>
                  </td>
                  <td class="service-price">{{ formatPrice(tpl.basePriceAmount, tpl.currency) }}</td>
                  <td class="service-duration">{{ tpl.estimatedDurationMinutes }} min</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="public-preview-section">
            <div class="preview-header">
              <h3 class="preview-title">Public Preview</h3>
              <Button
                label="Refresh Preview"
                icon="pi pi-refresh"
                severity="secondary"
                outlined
                size="small"
                :loading="loadingPreview"
                @click="loadPublicPreview"
              />
            </div>

            <template v-if="loadingPreview">
              <div class="preview-loading">Loading preview...</div>
            </template>

            <template v-else-if="publicWorkshop">
              <div class="preview-card">
                <div class="preview-workshop-header">
                  <h4 class="preview-workshop-name">{{ publicWorkshop.name }}</h4>
                  <span class="preview-workshop-ruc">RUC: {{ publicWorkshop.ruc }}</span>
                </div>

                <div v-if="publicWorkshop.locations?.length > 0" class="preview-locations">
                  <h5 class="preview-section-label">Locations</h5>
                  <div v-for="loc in publicWorkshop.locations" :key="loc.id" class="preview-location-item">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M10 2C7.24 2 5 4.24 5 7c0 4.25 5 11 5 11s5-6.75 5-11c0-2.76-2.24-5-5-5z" stroke="#1B7A5A" stroke-width="1.5"/>
                      <circle cx="10" cy="7" r="1.5" fill="#1B7A5A"/>
                    </svg>
                    <span>{{ loc.street }}, {{ loc.city }}</span>
                  </div>
                </div>

                <div v-if="publicWorkshop.services?.length > 0" class="preview-services">
                  <h5 class="preview-section-label">Services ({{ publicWorkshop.services.length }})</h5>
                  <div class="preview-services-grid">
                    <div v-for="svc in publicWorkshop.services" :key="svc.id" class="preview-service-item">
                      <span class="preview-service-name">{{ svc.displayName }}</span>
                      <span class="preview-service-price">{{ formatPrice(svc.basePriceAmount, svc.currency) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="preview-placeholder">
                <p>Click "Refresh Preview" to see how your workshop appears to car owners.</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>
    
    <Dialog
      v-model:visible="showLocationDialog"
      modal
      header="Add Workshop Location"
      :style="{ width: '540px' }"
      :closable="true"
      :draggable="false"
      @hide="onDialogHide"
      >
      <div class="location-form">
        <div class="form-row">
          <div class="form-field">
            <label for="street" class="form-label">Street *</label>
            <InputText id="street" v-model="locationForm.street" class="form-input" placeholder="Av. Example 123" />
          </div>
        </div>
        <div class="form-row form-row--2">
          <div class="form-field">
            <label for="city" class="form-label">City *</label>
            <InputText id="city" v-model="locationForm.city" class="form-input" placeholder="Lima" />
          </div>
          <div class="form-field">
            <label for="state" class="form-label">State</label>
            <InputText id="state" v-model="locationForm.state" class="form-input" placeholder="Lima" />
          </div>
        </div>
        <div class="form-row form-row--2">
          <div class="form-field">
            <label for="zip" class="form-label">Zip</label>
            <InputText id="zip" v-model="locationForm.zip" class="form-input" placeholder="15001" />
          </div>
          <div class="form-field">
            <label for="country" class="form-label">Country *</label>
            <InputText id="country" v-model="locationForm.country" class="form-input" placeholder="Peru" />
          </div>
        </div>
        <div class="form-field">
          <label class="form-label">Location *</label>
          <div class="address-search-row">
            <InputText
              v-model="addressSearch"
              class="address-search-input"
              placeholder="Search address..."
              @keyup.enter="searchAddress"
            />
            <Button
              icon="pi pi-search"
              severity="secondary"
              outlined
              :loading="searchingAddress"
              @click="searchAddress"
              aria-label="Search address"
            />
            <Button
              icon="pi pi-map-marker"
              severity="secondary"
              outlined
              :loading="locating"
              @click="locateMe"
              aria-label="Use my location"
              v-tooltip="'Use my location'"
            />
          </div>
          <div v-if="searchResults.length > 0" class="search-results">
            <button
              v-for="(result, idx) in searchResults"
              :key="idx"
              class="search-result-item"
              @click="selectSearchResult(result)"
            >
              {{ result.display }}
            </button>
          </div>
          <p class="form-hint">Click on the map or drag the marker to set coordinates.</p>
          <div ref="mapContainer" class="location-map"></div>
          <div class="coords-display">
            <span>Lat: {{ locationForm.latitude.toFixed(6) }}</span>
            <span>Lng: {{ locationForm.longitude.toFixed(6) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button label="Cancel" severity="secondary" outlined @click="onDialogHide" :disabled="savingLocation" />
          <Button label="Save Location" severity="success" :loading="savingLocation" @click="saveLocation" />
        </div>
      </template>
    </Dialog>

    <Dialog
      v-model:visible="showServiceDialog"
      modal
      header="Add Service to Menu"
      :style="{ width: '480px' }"
      :closable="true"
      :draggable="false"
      @hide="onDialogHide"
    >
      <div class="service-form">
        <div class="form-field">
          <label for="category" class="form-label">Category *</label>
          <Select
            id="category"
            v-model="serviceForm.categoryCode"
            :options="serviceCategories"
            optionLabel="displayName"
            optionValue="code"
            placeholder="Select a category"
            class="form-input"
            @change="onCategoryChange"
          />
        </div>

        <div class="form-field">
          <label for="service" class="form-label">Service *</label>
          <Select
            id="service"
            v-model="serviceForm.catalogServiceCode"
            :options="availableServices"
            :disabled="!serviceForm.categoryCode"
            optionLabel="displayName"
            optionValue="code"
            placeholder="Select a service"
            class="form-input"
            @change="onServiceChange"
          />
        </div>

        <div class="form-field">
          <label for="customName" class="form-label">Display Name</label>
          <InputText id="customName" v-model="serviceForm.customName" class="form-input" placeholder="Service name" />
        </div>

        <div class="form-field">
          <label for="serviceDesc" class="form-label">Description</label>
          <InputText id="serviceDesc" v-model="serviceForm.description" class="form-input" placeholder="Describe what this service includes" />
        </div>

        <div class="form-row form-row--2">
          <div class="form-field">
            <label for="price" class="form-label">Base Price (PEN) *</label>
            <InputNumber
              id="price"
              v-model="serviceForm.basePriceAmount"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              class="form-input"
              :min="0"
            />
          </div>
          <div class="form-field">
            <label for="duration" class="form-label">Duration (min)</label>
            <InputNumber
              id="duration"
              v-model="serviceForm.estimatedDurationMinutes"
              class="form-input"
              :min="5"
              :max="480"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button label="Cancel" severity="secondary" outlined @click="() => { showServiceDialog = false; }" :disabled="savingTemplate" />
          <Button label="Add Service" severity="success" :loading="savingTemplate" @click="saveServiceTemplate" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
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

.workshop-tabs {
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

.general-card {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 16px;
  padding: 32px;
}

.general-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(94, 119, 149, 0.15);
}

.workshop-logo {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.workshop-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.workshop-logo-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  background: rgba(27, 122, 90, 0.1);
  border: 1px solid rgba(27, 122, 90, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.general-header-info {
  flex: 1;
}

.general-workshop-name {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.375rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 8px;
}

.verified-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 4px;
}

.verified-badge--yes {
  color: #1B7A5A;
  background: rgba(27, 122, 90, 0.15);
  border: 1px solid rgba(27, 122, 90, 0.3);
}

.verified-badge--no {
  color: #F59E0B;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item--full {
  grid-column: 1 / -1;
}

.info-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #799AB7;
}

.info-value {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  color: #F8FAFC;
}

.info-value--mono {
  font-family: 'IBM Plex Mono', monospace;
  letter-spacing: 0.05em;
}

.locations-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.add-location-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1B7A5A;
  border: none;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 10px 20px;
  color: #F8FAFC;
  cursor: pointer;
  transition: background 0.15s;
}

.add-location-btn:hover {
  background: #165c48;
}

.locations-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 32px;
  gap: 12px;
}

.locations-empty-text {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #799AB7;
  margin: 0;
}

.locations-empty-hint {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #5E7795;
  margin: 0;
  text-align: center;
}

.locations-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-card {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 12px;
  padding: 20px;
}

.location-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.location-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(27, 122, 90, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.location-delete-btn {
  background: rgba(128, 12, 31, 0.1);
  border: 1px solid rgba(128, 12, 31, 0.2);
  border-radius: 6px;
  cursor: pointer;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.location-delete-btn:hover {
  background: rgba(128, 12, 31, 0.2);
  border-color: rgba(128, 12, 31, 0.5);
}

.location-address {
  margin-bottom: 12px;
}

.location-street {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #F8FAFC;
  margin: 0 0 4px;
}

.location-city {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #799AB7;
  margin: 0 0 2px;
}

.location-country {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #799AB7;
  margin: 0;
}

.location-coords {
  display: flex;
  align-items: center;
  gap: 8px;
}

.location-coords-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
}

.location-coords-value {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  color: #5E7795;
}

.location-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row--2 {
  flex-direction: row;
  gap: 12px;
}

.form-row--2 .form-field {
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

.form-hint {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: #5E7795;
  margin: 0 0 8px;
}

.location-map {
  height: 220px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(94, 119, 149, 0.2);
}

.coords-display {
  display: flex;
  gap: 16px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  color: #799AB7;
}

.address-search-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.address-search-input {
  flex: 1;
}

.search-results {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.2);
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
  max-height: 160px;
  overflow-y: auto;
}

.search-result-item {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(94, 119, 149, 0.1);
  padding: 10px 14px;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: #F8FAFC;
  cursor: pointer;
  transition: background 0.1s;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: rgba(27, 122, 90, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.services-toolbar,
.locations-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.add-service-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1B7A5A;
  border: none;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 10px 20px;
  color: #F8FAFC;
  cursor: pointer;
  transition: background 0.15s;
}

.add-service-btn:hover {
  background: #165c48;
}

.add-location-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1B7A5A;
  border: none;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 10px 20px;
  color: #F8FAFC;
  cursor: pointer;
  transition: background 0.15s;
}

.add-location-btn:hover {
  background: #165c48;
}

.services-empty,
.locations-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 32px;
  gap: 12px;
}

.services-empty-text,
.locations-empty-text {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #799AB7;
  margin: 0;
}

.services-empty-hint,
.locations-empty-hint {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #5E7795;
  margin: 0;
  text-align: center;
}

.services-table-wrapper {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 32px;
}

.services-table {
  width: 100%;
  border-collapse: collapse;
}

.services-table thead tr {
  border-bottom: 1px solid rgba(94, 119, 149, 0.15);
}

.services-table th {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #799AB7;
  padding: 14px 20px;
  text-align: left;
}

.services-table tbody tr {
  border-bottom: 1px solid rgba(94, 119, 149, 0.1);
}

.services-table tbody tr:last-child {
  border-bottom: none;
}

.services-table td {
  padding: 16px 20px;
  vertical-align: middle;
}

.service-name {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #F8FAFC;
  margin-bottom: 4px;
}

.service-desc {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: #5E7795;
  margin: 0;
}

.service-category-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #1B7A5A;
  background: rgba(27, 122, 90, 0.15);
  border: 1px solid rgba(27, 122, 90, 0.25);
  padding: 3px 8px;
  border-radius: 4px;
}

.service-price {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.9rem;
  font-weight: 700;
  color: #F8FAFC;
  white-space: nowrap;
}

.service-duration {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.85rem;
  color: #799AB7;
  white-space: nowrap;
}

.public-preview-section {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(94, 119, 149, 0.15);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.preview-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #799AB7;
  margin: 0;
}

.preview-loading {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #5E7795;
  padding: 32px;
  text-align: center;
}

.preview-placeholder {
  background: #1a2630;
  border: 1px dashed rgba(94, 119, 149, 0.2);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
}

.preview-placeholder p {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #5E7795;
  margin: 0;
}

.preview-card {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 12px;
  padding: 24px;
}

.preview-workshop-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(94, 119, 149, 0.15);
}

.preview-workshop-name {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.125rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 4px;
}

.preview-workshop-ruc {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  color: #799AB7;
}

.preview-section-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5E7795;
  margin: 0 0 12px;
}

.preview-locations {
  margin-bottom: 20px;
}

.preview-location-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #799AB7;
}

.preview-services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.preview-service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(27, 122, 90, 0.08);
  border: 1px solid rgba(27, 122, 90, 0.15);
  border-radius: 8px;
  padding: 10px 14px;
}

.preview-service-name {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #F8FAFC;
}

.preview-service-price {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  color: #1B7A5A;
}

@media (max-width: 480px) {
  .form-row--2 {
    flex-direction: column;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .general-card {
    padding: 24px 20px;
  }

  .services-table th:nth-child(3),
  .services-table th:nth-child(4),
  .services-table td:nth-child(3),
  .services-table td:nth-child(4) {
    display: none;
  }
}
</style>