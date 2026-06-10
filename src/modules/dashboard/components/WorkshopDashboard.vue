<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/modules/iam/store/auth';
import { workshopService } from '@/modules/workshop/services/workshop.service';
import type { Workshop } from '@/modules/workshop/services/workshop.service';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';

const authStore = useAuthStore();

const workshop = ref<Workshop | null>(null);
const loading = ref(true);

authStore.workshopId
  ? workshopService.getMyWorkshop()
      .then((w) => {
        workshop.value = w;
        authStore.setWorkshopId(w.id);
      })
      .catch(() => {
        workshop.value = null;
      })
      .finally(() => { loading.value = false; })
  : (loading.value = false);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const stats = [
  { label: 'Incoming Requests', value: '0', icon: 'pi pi-inbox' },
  { label: 'In Progress', value: '0', icon: 'pi pi-cog' },
  { label: 'Completed Today', value: '0', icon: 'pi pi-check-circle' },
  { label: 'Active Staff', value: '0', icon: 'pi pi-users' },
];
</script>

<template>
  <div class="an-dashboard">
    <template v-if="loading">
      <div class="an-dashboard-header">
        <h1 class="an-dashboard-title">{{ getGreeting() }}, {{ authStore.user?.firstName }}</h1>
        <p class="an-dashboard-subtitle">Loading workshop data...</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton v-for="i in 4" :key="i" height="8rem" />
      </div>
    </template>

    <template v-else-if="!workshop">
      <div class="an-dashboard-header">
        <h1 class="an-dashboard-title">{{ getGreeting() }}, {{ authStore.user?.firstName }}</h1>
        <p class="an-dashboard-subtitle">Welcome to AutoNexo. Register your workshop to get started.</p>
      </div>

      <Card class="max-w-lg mt-8">
        <template #content>
          <div class="flex flex-col items-center text-center gap-6 py-8">
            <div class="w-16 h-16 rounded-full bg-[rgba(27,122,90,0.15)] flex items-center justify-center">
              <i class="pi pi-building text-2xl text-[var(--p-primary-color)]" />
            </div>
            <div>
              <h2 class="text-2xl font-bold mb-3">No Workshop Registered</h2>
              <p class="text-[var(--p-text-muted-color)] leading-relaxed">
                You haven't set up your workshop yet. Create your workshop profile to start receiving service requests from car owners.
              </p>
            </div>
            <Button
              label="Register My Workshop"
              @click="$router.push({ name: 'workshop-registration' })"
            />
          </div>
        </template>
      </Card>
    </template>

    <template v-else>
      <div class="an-dashboard-header">
        <h1 class="an-dashboard-title">{{ getGreeting() }}, {{ authStore.user?.firstName }}</h1>
        <p class="an-dashboard-subtitle">Monitor your workshop operations and incoming requests.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card v-for="stat in stats" :key="stat.label">
          <template #content>
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg bg-[rgba(27,122,90,0.12)] flex items-center justify-center text-[var(--p-primary-color)]">
                <i :class="stat.icon" />
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-[var(--p-text-muted-color)]">{{ stat.label }}</p>
                <p class="text-2xl font-bold font-mono">{{ stat.value }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </template>
  </div>
</template>
