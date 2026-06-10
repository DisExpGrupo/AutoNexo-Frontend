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
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

import L from 'leaflet';

const toast = useToast();

const workshop = ref<Workshop | null>(null);
const locations = ref<WorkshopLocation[]>([]);
const loading = ref(true);
const workshopError = ref<string | null>(null);
const activeTab = ref(0);

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
      <div class="py-16 text-center">
        <p class="text-[var(--p-text-muted-color)]">Loading workshop...</p>
      </div>
    </template>

    <template v-else-if="workshopError">
      <div class="p-4 rounded-lg border border-[var(--p-secondary-color)] bg-[var(--p-secondary-color)]/15 text-white" role="alert">
        {{ workshopError }}
      </div>
    </template>

    <template v-else-if="workshop">
      <Tabs v-model:value="activeTab">
        <TabList>
          <Tab value="0">General Info</Tab>
          <Tab value="1">Locations</Tab>
          <Tab value="2">Services</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <Card>
              <template #content>
                <div class="flex flex-col gap-7">
                  <div class="flex items-center gap-5 pb-6 border-b border-[rgba(94,119,149,0.15)]">
                    <div class="w-18 h-18 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--p-primary-color)]/10 flex items-center justify-center">
                      <img v-if="workshop.logoUrl" :src="workshop.logoUrl" :alt="`${workshop.name} logo`" class="w-full h-full object-cover" />
                      <i v-else class="pi pi-building text-2xl text-[var(--p-primary-color)]" />
                    </div>
                    <div class="flex-1">
                      <h2 class="text-xl font-bold font-mono text-white mb-2">{{ workshop.name }}</h2>
                      <Tag
                        :value="workshop.rucVerified ? 'RUC Verified' : 'RUC Not Verified'"
                        :severity="workshop.rucVerified ? 'success' : 'warn'"
                        class="text-[0.65rem] font-bold uppercase tracking-wider"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div class="flex flex-col gap-1">
                      <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Legal Name</span>
                      <span class="text-sm text-white">{{ workshop.legalName }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">RUC</span>
                      <span class="text-sm font-mono text-white tracking-wider">{{ workshop.ruc }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Trust Score</span>
                      <span class="text-sm text-white">{{ workshop.trustScore ?? 'N/A' }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Status</span>
                      <span class="text-sm text-white">{{ workshop.active ? 'Active' : 'Inactive' }}</span>
                    </div>
                    <div class="flex flex-col gap-1 md:col-span-2">
                      <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Description</span>
                      <span class="text-sm text-white">{{ workshop.shortDescription }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </TabPanel>

          <TabPanel value="1">
            <div class="flex justify-end mb-5">
              <Button label="Add New Location" icon="pi pi-plus" @click="openLocationDialog" />
            </div>

            <div v-if="locations.length === 0" class="py-16 flex flex-col items-center gap-3">
              <i class="pi pi-map-marker text-4xl text-[var(--p-text-muted-color)]" />
              <p class="font-mono font-bold text-[var(--p-text-muted-color)]">No locations registered yet.</p>
              <p class="text-sm text-[var(--p-text-muted-color)]">Add your first workshop location to start receiving service requests.</p>
            </div>

            <div v-else class="flex flex-col gap-3">
              <Card v-for="loc in locations" :key="loc.id">
                <template #content>
                  <div class="flex flex-col gap-3">
                    <div class="flex items-start justify-between">
                      <div class="w-9 h-9 rounded-lg bg-[var(--p-primary-color)]/15 flex items-center justify-center">
                        <i class="pi pi-map-marker text-[var(--p-primary-color)]" />
                      </div>
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        size="small"
                        aria-label="Delete location"
                        @click="confirmDeleteLocation(loc.id)"
                      />
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <p class="text-sm font-semibold text-white">{{ loc.street }}</p>
                      <p class="text-sm text-[var(--p-text-muted-color)]">{{ loc.city }}, {{ loc.state }} {{ loc.zip }}</p>
                      <p class="text-sm text-[var(--p-text-muted-color)]">{{ loc.country }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-[0.6rem] font-mono font-bold uppercase tracking-wider text-[#5E7795]">Lat/Lng</span>
                      <span class="text-[0.75rem] font-mono text-[#5E7795]">{{ loc.latitude.toFixed(4) }}, {{ loc.longitude.toFixed(4) }}</span>
                    </div>
                  </div>
                </template>
              </Card>
            </div>
          </TabPanel>

          <TabPanel value="2">
            <div class="flex justify-end mb-5">
              <Button label="Add Service to Menu" icon="pi pi-plus" @click="openServiceDialog" />
            </div>

            <div v-if="serviceTemplates.length === 0" class="py-16 flex flex-col items-center gap-3">
              <i class="pi pi-wrench text-4xl text-[var(--p-text-muted-color)]" />
              <p class="font-mono font-bold text-[var(--p-text-muted-color)]">No services in your menu yet.</p>
              <p class="text-sm text-[var(--p-text-muted-color)]">Add services so car owners can find you when searching for repairs.</p>
            </div>

            <div v-else class="mb-8">
              <DataTable :value="serviceTemplates" class="p-datatable-sm" stripedRows>
                <Column field="displayName" header="Service">
                  <template #body="{ data }">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-sm font-semibold text-white">{{ data.displayName }}</span>
                      <span class="text-xs text-[#5E7795]">{{ data.description }}</span>
                    </div>
                  </template>
                </Column>
                <Column field="code" header="Category">
                  <template #body="{ data }">
                    <Tag :value="data.code" severity="success" class="text-[0.65rem] font-bold uppercase tracking-wider" />
                  </template>
                </Column>
                <Column field="basePriceAmount" header="Price">
                  <template #body="{ data }">
                    <span class="text-sm font-mono font-bold text-white">{{ formatPrice(data.basePriceAmount, data.currency) }}</span>
                  </template>
                </Column>
                <Column field="estimatedDurationMinutes" header="Duration">
                  <template #body="{ data }">
                    <span class="text-sm font-mono text-[var(--p-text-muted-color)]">{{ data.estimatedDurationMinutes }} min</span>
                  </template>
                </Column>
              </DataTable>
            </div>

            <div class="pt-6 border-t border-[rgba(94,119,149,0.15)]">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold font-mono uppercase tracking-wider text-[var(--p-text-muted-color)]">Public Preview</h3>
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

              <div v-if="loadingPreview" class="py-8 text-center text-[#5E7795]">Loading preview...</div>

              <Card v-else-if="publicWorkshop">
                <template #content>
                  <div class="flex flex-col gap-5">
                    <div class="pb-4 border-b border-[rgba(94,119,149,0.15)]">
                      <h4 class="text-lg font-bold font-mono text-white mb-1">{{ publicWorkshop.name }}</h4>
                      <span class="text-xs font-mono text-[var(--p-text-muted-color)]">RUC: {{ publicWorkshop.ruc }}</span>
                    </div>

                    <div v-if="publicWorkshop.locations?.length > 0" class="flex flex-col gap-2">
                      <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[#5E7795]">Locations</span>
                      <div v-for="loc in publicWorkshop.locations" :key="loc.id" class="flex items-center gap-2 text-sm text-[var(--p-text-muted-color)]">
                        <i class="pi pi-map-marker text-[var(--p-primary-color)]" />
                        <span>{{ loc.street }}, {{ loc.city }}</span>
                      </div>
                    </div>

                    <div v-if="publicWorkshop.services?.length > 0" class="flex flex-col gap-2">
                      <span class="text-[0.65rem] font-mono font-bold uppercase tracking-wider text-[#5E7795]">Services ({{ publicWorkshop.services.length }})</span>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div v-for="svc in publicWorkshop.services" :key="svc.id" class="flex items-center justify-between p-2.5 rounded-lg border border-[var(--p-primary-color)]/15 bg-[var(--p-primary-color)]/8">
                          <span class="text-sm text-white">{{ svc.displayName }}</span>
                          <span class="text-xs font-mono font-bold text-[var(--p-primary-color)]">{{ formatPrice(svc.basePriceAmount, svc.currency) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>

              <div v-else class="p-8 rounded-xl border border-dashed border-[rgba(94,119,149,0.2)] bg-[var(--p-content-background)] text-center">
                <p class="text-sm text-[#5E7795]">Click "Refresh Preview" to see how your workshop appears to car owners.</p>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
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
      <div class="flex flex-col gap-4 p-2">
        <div class="flex flex-col gap-1.5">
          <label for="street" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Street *</label>
          <InputText id="street" v-model="locationForm.street" class="w-full" placeholder="Av. Example 123" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="city" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">City *</label>
            <InputText id="city" v-model="locationForm.city" class="w-full" placeholder="Lima" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="state" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">State</label>
            <InputText id="state" v-model="locationForm.state" class="w-full" placeholder="Lima" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="zip" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Zip</label>
            <InputText id="zip" v-model="locationForm.zip" class="w-full" placeholder="15001" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="country" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Country *</label>
            <InputText id="country" v-model="locationForm.country" class="w-full" placeholder="Peru" />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Location *</label>
          <div class="flex gap-2 items-center mb-2">
            <InputText v-model="addressSearch" class="flex-1" placeholder="Search address..." @keyup.enter="searchAddress" />
            <Button icon="pi pi-search" severity="secondary" outlined :loading="searchingAddress" @click="searchAddress" aria-label="Search address" />
            <Button icon="pi pi-map-marker" severity="secondary" outlined :loading="locating" @click="locateMe" aria-label="Use my location" v-tooltip="'Use my location'" />
          </div>
          <div v-if="searchResults.length > 0" class="bg-[var(--p-content-background)] border border-[rgba(94,119,149,0.2)] rounded-lg mb-2 overflow-hidden max-h-40 overflow-y-auto">
            <button
              v-for="(result, idx) in searchResults"
              :key="idx"
              class="block w-full text-left bg-none border-none border-b border-[rgba(94,119,149,0.1)] px-3.5 py-2.5 text-sm text-white cursor-pointer hover:bg-[var(--p-primary-color)]/10 transition-colors"
              @click="selectSearchResult(result)"
            >
              {{ result.display }}
            </button>
          </div>
          <p class="text-xs text-[#5E7795] mb-2">Click on the map or drag the marker to set coordinates.</p>
          <div ref="mapContainer" class="h-56 rounded-lg overflow-hidden border border-[rgba(94,119,149,0.2)]" />
          <div class="flex gap-4 font-mono text-xs text-[var(--p-text-muted-color)]">
            <span>Lat: {{ locationForm.latitude.toFixed(6) }}</span>
            <span>Lng: {{ locationForm.longitude.toFixed(6) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
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
      <div class="flex flex-col gap-4 p-2">
        <div class="flex flex-col gap-1.5">
          <label for="category" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Category *</label>
          <Select
            id="category"
            v-model="serviceForm.categoryCode"
            :options="serviceCategories"
            optionLabel="displayName"
            optionValue="code"
            placeholder="Select a category"
            class="w-full"
            @change="onCategoryChange"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="service" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Service *</label>
          <Select
            id="service"
            v-model="serviceForm.catalogServiceCode"
            :options="availableServices"
            :disabled="!serviceForm.categoryCode"
            optionLabel="displayName"
            optionValue="code"
            placeholder="Select a service"
            class="w-full"
            @change="onServiceChange"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="customName" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Display Name</label>
          <InputText id="customName" v-model="serviceForm.customName" class="w-full" placeholder="Service name" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="serviceDesc" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Description</label>
          <InputText id="serviceDesc" v-model="serviceForm.description" class="w-full" placeholder="Describe what this service includes" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="price" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Base Price (PEN) *</label>
            <InputNumber id="price" v-model="serviceForm.basePriceAmount" mode="currency" currency="PEN" locale="es-PE" class="w-full" :min="0" />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="duration" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Duration (min)</label>
            <InputNumber id="duration" v-model="serviceForm.estimatedDurationMinutes" class="w-full" :min="5" :max="480" />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button label="Cancel" severity="secondary" outlined @click="() => { showServiceDialog = false; }" :disabled="savingTemplate" />
          <Button label="Add Service" severity="success" :loading="savingTemplate" @click="saveServiceTemplate" />
        </div>
      </template>
    </Dialog>
  </div>
</template>
