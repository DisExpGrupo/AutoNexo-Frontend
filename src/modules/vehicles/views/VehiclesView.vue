<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';
import type { Vehicle } from '@/modules/vehicles/services/vehicle.service';
import Button from 'primevue/button';
import Card from 'primevue/card';

const router = useRouter();

const vehicles = ref<Vehicle[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    vehicles.value = await vehicleService.getMyVehicles();
  } catch {
    vehicles.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="an-dashboard">
    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">My Vehicles</h1>
      <p class="an-dashboard-subtitle">Manage your registered vehicles.</p>
    </div>

    <div v-if="loading" class="py-16 text-center">
      <p class="text-[var(--p-text-muted-color)]">Loading vehicles...</p>
    </div>

    <div v-else-if="vehicles.length === 0" class="py-16 flex flex-col items-center gap-3 max-w-lg mx-auto">
      <Card class="w-full">
        <template #content>
          <div class="flex flex-col items-center text-center gap-4 py-8">
            <div class="w-16 h-16 rounded-full bg-[var(--p-primary-color)]/15 flex items-center justify-center">
              <i class="pi pi-car text-2xl text-[var(--p-primary-color)]" />
            </div>
            <h2 class="text-xl font-bold font-mono text-white">No Vehicles Yet</h2>
            <p class="text-sm text-[var(--p-text-muted-color)] leading-relaxed">
              Register your first vehicle to start requesting services from workshops.
            </p>
            <Button label="Add My First Vehicle" icon="pi pi-plus" @click="router.push({ name: 'vehicle-registration' })" />
          </div>
        </template>
      </Card>
    </div>

    <template v-else>
      <div class="mb-6 flex justify-end">
        <Button label="Add Vehicle" icon="pi pi-plus" @click="router.push({ name: 'vehicle-registration' })" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <RouterLink
          v-for="vehicle in vehicles"
          :key="vehicle.id"
          :to="{ name: 'vehicle-detail', params: { id: vehicle.id } }"
          class="block no-underline"
          :aria-label="`View details for ${vehicle.model}, plate ${vehicle.licensePlate}`"
        >
          <Card class="h-full transition-all duration-150 hover:border-[var(--p-primary-color)]/40 hover:bg-[var(--p-primary-color)]/5 cursor-pointer">
            <template #content>
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-[var(--p-primary-color)]/15 flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-car text-lg text-[var(--p-primary-color)]" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-bold font-mono text-white truncate">{{ vehicle.model }}</h3>
                  <p class="text-sm font-mono font-bold text-[var(--p-primary-color)] tracking-wider">{{ vehicle.licensePlate }}</p>
                  <p class="text-xs text-[var(--p-text-muted-color)]">{{ vehicle.year }} · {{ vehicle.color }}</p>
                </div>
                <i class="pi pi-chevron-right text-sm text-[var(--p-text-muted-color)] flex-shrink-0" />
              </div>
            </template>
          </Card>
        </RouterLink>
      </div>
    </template>
  </div>
</template>
