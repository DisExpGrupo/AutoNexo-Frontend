<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/iam/store/auth';
import { workshopService } from '@/modules/workshop/services/workshop.service';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Card from 'primevue/card';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const submitting = ref(false);

const form = ref({
  name: '',
  legalName: '',
  ruc: '',
  shortDescription: '',
});

async function handleSubmit() {
  if (!authStore.user?.id) return;
  submitting.value = true;
  try {
    const workshop = await workshopService.createWorkshop({
      ownerUserId: authStore.user.id,
      name: form.value.name,
      legalName: form.value.legalName,
      ruc: form.value.ruc,
      shortDescription: form.value.shortDescription,
    });
    authStore.setWorkshopId(workshop.id);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Workshop registered successfully.', life: 3000 });
    router.push({ name: 'dashboard' });
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Workshop registration failed. Please try again.', life: 5000 });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="an-dashboard">
    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">Register Your Workshop</h1>
      <p class="an-dashboard-subtitle">Set up your workshop profile to start receiving service requests.</p>
    </div>

    <Card class="max-w-[600px]">
      <template #content>
        <form @submit.prevent="handleSubmit" class="flex flex-col gap-6" novalidate>
          <div class="flex flex-col gap-1.5">
            <label for="name" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
              Workshop Name
            </label>
            <InputText
              id="name"
              v-model="form.name"
              placeholder="AutoNexo Workshop"
              class="w-full"
              required
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="legalName" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
              Legal Name
            </label>
            <InputText
              id="legalName"
              v-model="form.legalName"
              placeholder="AutoNexo S.A.C."
              class="w-full"
              required
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="ruc" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
              RUC
            </label>
            <InputText
              id="ruc"
              v-model="form.ruc"
              placeholder="12345678910"
              class="w-full"
              required
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="shortDescription" class="text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[var(--p-text-muted-color)]">
              Short Description
            </label>
            <Textarea
              id="shortDescription"
              v-model="form.shortDescription"
              placeholder="Describe your workshop services and expertise..."
              class="w-full"
              rows="3"
              required
            />
          </div>

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
              label="Register Workshop"
              :loading="submitting"
            />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>
