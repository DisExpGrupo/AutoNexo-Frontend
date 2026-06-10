<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { catalogService } from '@/shared/services/catalog.service';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Brand, VehicleModel } from '@/shared/models/catalog.model';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';

const router = useRouter();

const brands = ref<Brand[]>([]);
const models = ref<VehicleModel[]>([]);
const loadingBrands = ref(false);
const loadingModels = ref(false);
const submitting = ref(false);
const submitted = ref(false);

const selectedBrand = ref<Brand | null>(null);
const selectedModel = ref<VehicleModel | null>(null);

const form = ref<{
  year: number | null;
  licensePlate: string;
  vin: string;
  color: string;
  initialMileage: number | null;
}>({
  year: null,
  licensePlate: '',
  vin: '',
  color: '',
  initialMileage: null,
});

const errors = ref<Record<string, string>>({});

onMounted(async () => {
  loadingBrands.value = true;
  try {
    brands.value = await catalogService.getBrands();
  } catch {
    errors.value.form = 'Failed to load brands. Please refresh the page.';
  } finally {
    loadingBrands.value = false;
  }
});

watch(selectedBrand, (brand) => {
  if (!brand) {
    models.value = [];
    selectedModel.value = null;
    return;
  }
  loadingModels.value = true;
  try {
    catalogService.getModelsByBrand(brand.id).then((m) => {
      models.value = m;
      selectedModel.value = null;
    });
  } catch {
    models.value = [];
  } finally {
    loadingModels.value = false;
  }
});

function validate(): boolean {
  const errs: Record<string, string> = {};

  if (form.value.year == null || form.value.year < 1900 || form.value.year > 2030) {
    errs.year = 'Enter a valid year between 1900 and 2030.';
  }
  if (!form.value.licensePlate.trim()) {
    errs.licensePlate = 'License plate is required.';
  }
  if (!form.value.vin.trim() || form.value.vin.length < 11) {
    errs.vin = 'Enter a valid VIN (at least 11 characters).';
  }
  if (!form.value.color.trim()) {
    errs.color = 'Color is required.';
  }
  if (form.value.initialMileage == null || form.value.initialMileage < 0) {
    errs.initialMileage = 'Enter a valid mileage.';
  }

  errors.value = errs;
  return Object.keys(errs).length === 0;
}

async function handleSubmit() {
  if (!validate() || !selectedBrand.value || !selectedModel.value) return;
  submitting.value = true;
  try {
    await vehicleService.createVehicle({
      brandId: selectedBrand.value.id,
      model: selectedModel.value.name,
      year: form.value.year!,
      licensePlate: form.value.licensePlate,
      vin: form.value.vin,
      color: form.value.color,
      initialMileage: form.value.initialMileage!,
    });
    submitted.value = true;
  } catch {
    errors.value.form = 'Vehicle registration failed. Please try again.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="an-dashboard">
    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">Register Your Vehicle</h1>
      <p class="an-dashboard-subtitle">Add a vehicle to start requesting services from workshops.</p>
    </div>

    <div v-if="submitted" class="py-16 flex flex-col items-center gap-3 max-w-lg mx-auto">
      <Card class="w-full">
        <template #content>
          <div class="flex flex-col items-center text-center gap-4 py-8">
            <div class="w-16 h-16 rounded-full bg-[var(--p-primary-color)]/15 flex items-center justify-center">
              <i class="pi pi-check-circle text-2xl text-[var(--p-primary-color)]" />
            </div>
            <h2 class="text-xl font-bold font-mono text-white">Vehicle Registered</h2>
            <p class="text-sm text-[var(--p-text-muted-color)] leading-relaxed">
              Your vehicle has been added successfully. You can now request services from workshops.
            </p>
            <Button label="Back to Dashboard" icon="pi pi-home" @click="router.push({ name: 'dashboard' })" />
          </div>
        </template>
      </Card>
    </div>

    <form v-else @submit.prevent="handleSubmit" aria-label="Vehicle registration form" novalidate>
      <Message v-if="errors.form" severity="error" class="mb-6" :closable="false">{{ errors.form }}</Message>

      <Card class="mb-5">
        <template #content>
          <div class="flex flex-col gap-7">
            <div class="flex items-center gap-3">
              <span class="text-xs font-mono font-bold text-[var(--p-primary-color)] bg-[var(--p-primary-color)]/15 px-2.5 py-1 rounded">01</span>
              <span class="text-sm font-bold font-mono uppercase tracking-wider text-white">Vehicle Identity</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="flex flex-col gap-1.5">
                <label for="brand" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
                  Brand <span class="text-[var(--p-primary-color)]">*</span>
                </label>
                <Select
                  id="brand"
                  v-model="selectedBrand"
                  :options="brands"
                  optionLabel="name"
                  placeholder="Select brand"
                  class="w-full"
                  :loading="loadingBrands"
                  :invalid="!!errors.brand"
                />
                <span v-if="errors.brand" class="text-xs text-[var(--p-secondary-color)]">{{ errors.brand }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="model" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
                  Model <span class="text-[var(--p-primary-color)]">*</span>
                </label>
                <Select
                  id="model"
                  v-model="selectedModel"
                  :options="models"
                  optionLabel="name"
                  :placeholder="selectedBrand ? 'Select model' : 'Select a brand first'"
                  class="w-full"
                  :disabled="!selectedBrand || loadingModels"
                  :loading="loadingModels"
                  :invalid="!!errors.model"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="year" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
                  Year <span class="text-[var(--p-primary-color)]">*</span>
                </label>
                <InputNumber
                  id="year"
                  v-model="form.year"
                  :min="1900"
                  :max="2030"
                  placeholder="2023"
                  class="w-full"
                  :invalid="!!errors.year"
                />
                <span v-if="errors.year" class="text-xs text-[var(--p-secondary-color)]">{{ errors.year }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="color" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
                  Color <span class="text-[var(--p-primary-color)]">*</span>
                </label>
                <InputText
                  id="color"
                  v-model="form.color"
                  placeholder="Silver"
                  class="w-full"
                  :invalid="!!errors.color"
                />
                <span v-if="errors.color" class="text-xs text-[var(--p-secondary-color)]">{{ errors.color }}</span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex flex-col gap-7">
            <div class="flex items-center gap-3">
              <span class="text-xs font-mono font-bold text-[var(--p-primary-color)] bg-[var(--p-primary-color)]/15 px-2.5 py-1 rounded">02</span>
              <span class="text-sm font-bold font-mono uppercase tracking-wider text-white">Registration Details</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="flex flex-col gap-1.5">
                <label for="licensePlate" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
                  License Plate <span class="text-[var(--p-primary-color)]">*</span>
                </label>
                <InputText
                  id="licensePlate"
                  v-model="form.licensePlate"
                  placeholder="ABC-1234"
                  class="w-full font-mono tracking-wider"
                  :invalid="!!errors.licensePlate"
                />
                <span v-if="errors.licensePlate" class="text-xs text-[var(--p-secondary-color)]">{{ errors.licensePlate }}</span>
              </div>

              <div class="flex flex-col gap-1.5">
                <label for="initialMileage" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
                  Current Mileage (km) <span class="text-[var(--p-primary-color)]">*</span>
                </label>
                <InputNumber
                  id="initialMileage"
                  v-model="form.initialMileage"
                  :min="0"
                  placeholder="0"
                  class="w-full"
                  :invalid="!!errors.initialMileage"
                />
                <span v-if="errors.initialMileage" class="text-xs text-[var(--p-secondary-color)]">{{ errors.initialMileage }}</span>
              </div>

              <div class="flex flex-col gap-1.5 md:col-span-2">
                <label for="vin" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
                  VIN <span class="text-[var(--p-primary-color)]">*</span>
                </label>
                <InputText
                  id="vin"
                  v-model="form.vin"
                  placeholder="1HGBH41JXMN109186"
                  class="w-full font-mono tracking-widest"
                  :invalid="!!errors.vin"
                />
                <span v-if="errors.vin" class="text-xs text-[var(--p-secondary-color)]">{{ errors.vin }}</span>
                <span v-else class="text-xs text-[#5E7795]">17-character Vehicle Identification Number</span>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-6 border-t border-[rgba(94,119,149,0.15)]">
              <Button label="Cancel" severity="secondary" outlined @click="router.push({ name: 'dashboard' })" />
              <Button
                type="submit"
                label="Register Vehicle"
                :loading="submitting"
                :disabled="submitting"
              />
            </div>
          </div>
        </template>
      </Card>
    </form>
  </div>
</template>
