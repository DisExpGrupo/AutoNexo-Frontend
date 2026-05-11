<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { catalogService } from '@/shared/services/catalog.service';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Brand, VehicleModel } from '@/shared/models/catalog.model';

const router = useRouter();

const brands = ref<Brand[]>([]);
const models = ref<VehicleModel[]>([]);
const loadingBrands = ref(false);
const loadingModels = ref(false);
const submitting = ref(false);
const submitted = ref(false);

const selectedBrand = ref<Brand | null>(null);
const selectedModel = ref<VehicleModel | null>(null);

const form = ref({
  year: '',
  licensePlate: '',
  vin: '',
  color: '',
  initialMileage: '',
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

  if (!form.value.year || Number(form.value.year) < 1900 || Number(form.value.year) > 2030) {
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
  if (!form.value.initialMileage || Number(form.value.initialMileage) < 0) {
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
      year: Number(form.value.year),
      licensePlate: form.value.licensePlate,
      vin: form.value.vin,
      color: form.value.color,
      initialMileage: Number(form.value.initialMileage),
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

    <div v-if="submitted" class="vehicle-success-state">
      <div class="vehicle-success-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="20" stroke="#1B7A5A" stroke-width="3"/>
          <path d="M16 24l6 6 12-12" stroke="#1B7A5A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2 class="vehicle-success-title">Vehicle Registered</h2>
      <p class="vehicle-success-text">Your vehicle has been added successfully. You can now request services from workshops.</p>
      <button class="vehicle-btn-primary" @click="router.push({ name: 'dashboard' })">
        Back to Dashboard
      </button>
    </div>

    <form v-else @submit.prevent="handleSubmit" aria-label="Vehicle registration form" novalidate>
      <div v-if="errors.form" class="vehicle-form-error" role="alert">
        {{ errors.form }}
      </div>

      <div class="vehicle-form-card">
        <div class="vehicle-step-header">
          <span class="vehicle-step-badge">01</span>
          <span class="vehicle-step-label">Vehicle Identity</span>
        </div>

        <div class="vehicle-form-grid">
          <div class="vehicle-form-group">
            <label for="brand" class="vehicle-form-label">
              Brand <span class="vehicle-form-required" aria-hidden="true">*</span>
            </label>
            <div class="vehicle-select-wrapper" :class="{ 'vehicle-select--loading': loadingBrands }">
              <select
                id="brand"
                v-model="selectedBrand"
                class="vehicle-select"
                :aria-invalid="!!errors.brand"
                :aria-describedby="errors.brand ? 'brand-error' : undefined"
                :disabled="loadingBrands"
              >
                <option value="" disabled>Select brand</option>
                <option v-for="brand in brands" :key="brand.id" :value="brand">
                  {{ brand.name }}
                </option>
              </select>
              <span v-if="loadingBrands" class="vehicle-select-spinner" aria-hidden="true"></span>
            </div>
            <span v-if="errors.brand" id="brand-error" class="vehicle-form-field-error" role="alert">{{ errors.brand }}</span>
          </div>

          <div class="vehicle-form-group">
            <label for="model" class="vehicle-form-label">
              Model <span class="vehicle-form-required" aria-hidden="true">*</span>
            </label>
            <div class="vehicle-select-wrapper" :class="{ 'vehicle-select--loading': loadingModels }">
              <select
                id="model"
                v-model="selectedModel"
                class="vehicle-select"
                :disabled="!selectedBrand || loadingModels"
                :aria-invalid="!!errors.model"
              >
                <option value="" disabled>{{ selectedBrand ? 'Select model' : 'Select a brand first' }}</option>
                <option v-for="model in models" :key="model.id" :value="model">
                  {{ model.name }}
                </option>
              </select>
              <span v-if="loadingModels" class="vehicle-select-spinner" aria-hidden="true"></span>
            </div>
          </div>

          <div class="vehicle-form-group">
            <label for="year" class="vehicle-form-label">
              Year <span class="vehicle-form-required" aria-hidden="true">*</span>
            </label>
            <input
              id="year"
              v-model="form.year"
              type="number"
              min="1900"
              max="2030"
              placeholder="2023"
              class="vehicle-input"
              :class="{ 'vehicle-input--error': errors.year }"
              :aria-invalid="!!errors.year"
              :aria-describedby="errors.year ? 'year-error' : undefined"
              autocomplete="off"
            />
            <span v-if="errors.year" id="year-error" class="vehicle-form-field-error" role="alert">{{ errors.year }}</span>
          </div>

          <div class="vehicle-form-group">
            <label for="color" class="vehicle-form-label">
              Color <span class="vehicle-form-required" aria-hidden="true">*</span>
            </label>
            <input
              id="color"
              v-model="form.color"
              type="text"
              placeholder="Silver"
              class="vehicle-input"
              :class="{ 'vehicle-input--error': errors.color }"
              :aria-invalid="!!errors.color"
              :aria-describedby="errors.color ? 'color-error' : undefined"
              autocomplete="off"
            />
            <span v-if="errors.color" id="color-error" class="vehicle-form-field-error" role="alert">{{ errors.color }}</span>
          </div>
        </div>
      </div>

      <div class="vehicle-form-card">
        <div class="vehicle-step-header">
          <span class="vehicle-step-badge">02</span>
          <span class="vehicle-step-label">Registration Details</span>
        </div>

        <div class="vehicle-form-grid">
          <div class="vehicle-form-group">
            <label for="licensePlate" class="vehicle-form-label">
              License Plate <span class="vehicle-form-required" aria-hidden="true">*</span>
            </label>
            <input
              id="licensePlate"
              v-model="form.licensePlate"
              type="text"
              placeholder="ABC-1234"
              class="vehicle-input vehicle-input--mono"
              :class="{ 'vehicle-input--error': errors.licensePlate }"
              :aria-invalid="!!errors.licensePlate"
              :aria-describedby="errors.licensePlate ? 'plate-error' : undefined"
              autocomplete="off"
            />
            <span v-if="errors.licensePlate" id="plate-error" class="vehicle-form-field-error" role="alert">{{ errors.licensePlate }}</span>
          </div>

          <div class="vehicle-form-group">
            <label for="initialMileage" class="vehicle-form-label">
              Current Mileage (km) <span class="vehicle-form-required" aria-hidden="true">*</span>
            </label>
            <input
              id="initialMileage"
              v-model="form.initialMileage"
              type="number"
              min="0"
              placeholder="0"
              class="vehicle-input"
              :class="{ 'vehicle-input--error': errors.initialMileage }"
              :aria-invalid="!!errors.initialMileage"
              :aria-describedby="errors.initialMileage ? 'mileage-error' : undefined"
              autocomplete="off"
            />
            <span v-if="errors.initialMileage" id="mileage-error" class="vehicle-form-field-error" role="alert">{{ errors.initialMileage }}</span>
          </div>

          <div class="vehicle-form-group vehicle-form-group--full">
            <label for="vin" class="vehicle-form-label">
              VIN <span class="vehicle-form-required" aria-hidden="true">*</span>
            </label>
            <input
              id="vin"
              v-model="form.vin"
              type="text"
              placeholder="1HGBH41JXMN109186"
              class="vehicle-input vehicle-input--mono vehicle-input--vin"
              :class="{ 'vehicle-input--error': errors.vin }"
              :aria-invalid="!!errors.vin"
              :aria-describedby="errors.vin ? 'vin-error' : 'vin-hint'"
              autocomplete="off"
            />
            <span id="vin-hint" class="vehicle-form-hint">17-character Vehicle Identification Number</span>
            <span v-if="errors.vin" id="vin-error" class="vehicle-form-field-error" role="alert">{{ errors.vin }}</span>
          </div>
        </div>

        <div class="vehicle-form-actions">
          <button
            type="button"
            class="vehicle-btn-secondary"
            @click="router.push({ name: 'dashboard' })"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="vehicle-btn-primary"
            :disabled="submitting"
            :aria-busy="submitting"
          >
            <span v-if="submitting" class="vehicle-btn-spinner" aria-hidden="true"></span>
            {{ submitting ? 'Registering...' : 'Register Vehicle' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.vehicle-success-state {
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

.vehicle-success-icon {
  margin-bottom: 24px;
}

.vehicle-success-title {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 12px;
}

.vehicle-success-text {
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  color: #799AB7;
  margin: 0 0 32px;
  line-height: 1.6;
}

.vehicle-form-error {
  background: rgba(128, 12, 31, 0.15);
  border: 1px solid #800C1F;
  border-radius: 8px;
  padding: 12px 16px;
  color: #F8FAFC;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  margin-bottom: 24px;
}

.vehicle-form-card {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 20px;
}

.vehicle-step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.vehicle-step-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1B7A5A;
  background: rgba(27, 122, 90, 0.15);
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.vehicle-step-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #F8FAFC;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.vehicle-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.vehicle-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vehicle-form-group--full {
  grid-column: 1 / -1;
}

.vehicle-form-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #799AB7;
}

.vehicle-form-required {
  color: #1B7A5A;
}

.vehicle-form-hint {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #5E7795;
}

.vehicle-form-field-error {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #800C1F;
}

.vehicle-input {
  background: #0f1920;
  border: 1px solid #5E7795;
  border-radius: 8px;
  color: #F8FAFC;
  padding: 12px 14px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.vehicle-input::placeholder {
  color: #5E7795;
}

.vehicle-input:focus {
  outline: none;
  border-color: #1B7A5A;
  box-shadow: 0 0 0 3px rgba(27, 122, 90, 0.2);
}

.vehicle-input--error {
  border-color: #800C1F;
}

.vehicle-input--error:focus {
  box-shadow: 0 0 0 3px rgba(128, 12, 31, 0.2);
}

.vehicle-input--mono {
  font-family: 'IBM Plex Mono', monospace;
  letter-spacing: 0.05em;
}

.vehicle-input--vin {
  letter-spacing: 0.12em;
}

.vehicle-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.vehicle-select {
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

.vehicle-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.vehicle-select:focus {
  outline: none;
  border-color: #1B7A5A;
  box-shadow: 0 0 0 3px rgba(27, 122, 90, 0.2);
}

.vehicle-select-wrapper::after {
  content: '';
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #5E7795;
  pointer-events: none;
}

.vehicle-select-spinner {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border: 2px solid rgba(94, 119, 149, 0.3);
  border-top-color: #1B7A5A;
  border-radius: 50%;
  animation: vehicle-spin 0.7s linear infinite;
}

@keyframes vehicle-spin {
  to { transform: translateY(-50%) rotate(360deg); }
}

.vehicle-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(94, 119, 149, 0.15);
}

.vehicle-btn-primary {
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

.vehicle-btn-primary:hover:not(:disabled) {
  background: #165c48;
}

.vehicle-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.vehicle-btn-secondary {
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

.vehicle-btn-secondary:hover {
  border-color: #799AB7;
  background: rgba(94, 119, 149, 0.1);
}

.vehicle-btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(248, 250, 252, 0.3);
  border-top-color: #F8FAFC;
  border-radius: 50%;
  animation: vehicle-spin 0.7s linear infinite;
}

@media (max-width: 640px) {
  .vehicle-form-grid {
    grid-template-columns: 1fr;
  }

  .vehicle-form-card {
    padding: 24px 20px;
  }
}
</style>