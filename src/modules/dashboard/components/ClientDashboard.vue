<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/modules/iam/store/auth';
import { serviceRequestService } from '@/modules/matching/services/service-request.service';
import type { ServiceRequest } from '@/modules/matching/services/service-request.service';
import { offerService } from '@/modules/matching/services/offer.service';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import Skeleton from 'primevue/skeleton';

const authStore = useAuthStore();

const recentRequests = ref<ServiceRequest[]>([]);
const pendingOffersCount = ref(0);
const loading = ref(true);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const STATUS_TAG: Record<ServiceRequest['status'], { severity: string; value: string }> = {
  PENDING: { severity: 'warn', value: 'Pending' },
  COMPLETED: { severity: 'success', value: 'Completed' },
  REJECTED: { severity: 'danger', value: 'Rejected' },
  CANCELLED: { severity: 'secondary', value: 'Cancelled' },
};

const quickActions = [
  {
    title: 'New Service Request',
    desc: 'Find workshops and get offers',
    icon: 'pi pi-plus',
    route: 'create-service-request',
    primary: true,
  },
  {
    title: 'My Service Requests',
    desc: 'Track active and past requests',
    icon: 'pi pi-list',
    route: 'car-owner-requests',
    primary: false,
  },
  {
    title: 'Add a Vehicle',
    desc: 'Register a new car',
    icon: 'pi pi-car',
    route: 'vehicle-registration',
    primary: false,
  },
];

onMounted(async () => {
  try {
    const [reqs, allOffers] = await Promise.all([
      serviceRequestService.getMyServiceRequests(),
      offerService.getMyOffers(),
    ]);
    recentRequests.value = reqs.slice(0, 4);
    pendingOffersCount.value = allOffers.filter((o) => o.status === 'PENDING').length;
  } catch {
    // silently fail
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="an-dashboard">
    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">{{ getGreeting() }}, {{ authStore.user?.firstName }}</h1>
      <p class="an-dashboard-subtitle">Here's an overview of your auto care activity.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-7">
      <Card
        v-for="action in quickActions"
        :key="action.route"
        class="cursor-pointer transition-all duration-150 hover:border-[var(--p-primary-color)]"
        :class="action.primary ? 'border-[var(--p-primary-color)]/30' : ''"
        @click="$router.push({ name: action.route })"
      >
        <template #content>
          <div class="flex items-center gap-3.5">
            <div
              class="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="action.primary ? 'bg-[var(--p-primary-color)]/25 text-[var(--p-primary-color)]' : 'bg-[var(--p-primary-color)]/15 text-[var(--p-primary-color)]'"
            >
              <i :class="action.icon" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-mono text-sm font-bold text-white truncate">{{ action.title }}</p>
              <p class="text-xs text-[var(--p-text-muted-color)]">{{ action.desc }}</p>
            </div>
            <i class="pi pi-chevron-right text-sm text-[var(--p-text-muted-color)]" />
          </div>
        </template>
      </Card>
    </div>

    <template v-if="pendingOffersCount > 0">
      <Message severity="warn" class="mb-7">
        You have <strong>{{ pendingOffersCount }} pending offer{{ pendingOffersCount > 1 ? 's' : '' }}</strong> waiting for review.
        <Button
          link
          class="ml-1 p-0 text-[var(--p-secondary-color)]"
          @click="$router.push({ name: 'car-owner-requests' })"
        >
          View
        </Button>
      </Message>
    </template>

    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">Recent Service Requests</h2>
          <Button
            v-if="recentRequests.length > 0"
            link
            class="p-0 text-[var(--p-primary-color)]"
            @click="$router.push({ name: 'car-owner-requests' })"
          >
            View all
          </Button>
        </div>
      </template>
      <template #content>
        <div v-if="loading" class="flex flex-col gap-2">
          <Skeleton v-for="i in 3" :key="i" height="3rem" />
        </div>

        <div v-else-if="recentRequests.length === 0" class="py-4">
          <p class="text-sm text-[var(--p-text-muted-color)]">
            No service requests yet. Create your first one to get started.
          </p>
        </div>

        <div v-else class="flex flex-col gap-2">
          <div
            v-for="req in recentRequests"
            :key="req.id"
            class="flex items-center justify-between p-3.5 rounded-lg border border-[rgba(94,119,149,0.1)] bg-[var(--p-form-field-filled-background)] cursor-pointer transition-all duration-150 hover:border-[var(--p-primary-color)]/30"
            @click="$router.push({ name: 'service-request-detail', params: { id: req.id } })"
          >
            <div class="flex flex-col gap-0.5 min-w-0 flex-1 mr-3">
              <span class="text-sm text-white truncate">{{ req.description }}</span>
              <span class="text-[0.7rem] font-mono text-[var(--p-text-muted-color)]">{{ new Date(req.createdAt).toLocaleDateString() }}</span>
            </div>
            <Tag
              :value="STATUS_TAG[req.status].value"
              :severity="STATUS_TAG[req.status].severity"
              class="text-[0.65rem] font-bold uppercase tracking-wider flex-shrink-0"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
