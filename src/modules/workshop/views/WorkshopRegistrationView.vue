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

    <Card class="workshop-reg-card">
      <template #content>
        <form @submit.prevent="handleSubmit" class="flex flex-col gap-6" novalidate>
          <div class="flex flex-col gap-2">
            <label for="name" class="form-label">Workshop Name</label>
            <InputText
              id="name"
              v-model="form.name"
              placeholder="AutoNexo Workshop"
              class="form-input w-full"
              required
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="legalName" class="form-label">Legal Name</label>
            <InputText
              id="legalName"
              v-model="form.legalName"
              placeholder="AutoNexo S.A.C."
              class="form-input w-full"
              required
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="ruc" class="form-label">RUC</label>
            <InputText
              id="ruc"
              v-model="form.ruc"
              placeholder="12345678910"
              class="form-input w-full"
              required
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="shortDescription" class="form-label">Short Description</label>
            <Textarea
              id="shortDescription"
              v-model="form.shortDescription"
              placeholder="Describe your workshop services and expertise..."
              class="form-input w-full"
              rows="3"
              required
            />
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              label="Cancel"
              severity="secondary"
              class="form-btn-secondary"
              @click="router.push({ name: 'dashboard' })"
            />
            <Button
              type="submit"
              label="Register Workshop"
              :loading="submitting"
              class="form-btn-primary"
            />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.workshop-reg-card {
  background: #1a2630;
  border: 1px solid rgba(94, 119, 149, 0.15);
  border-radius: 16px;
  max-width: 600px;
}

.form-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #799AB7;
}

.form-input {
  background: #0f1920;
  border: 1px solid #5E7795;
  border-radius: 8px;
  color: #F8FAFC;
  padding: 10px 14px;
}

.form-input:focus {
  border-color: #1B7A5A;
  box-shadow: 0 0 0 2px rgba(27, 122, 90, 0.25);
  outline: none;
}

.form-btn-primary {
  background: #1B7A5A;
  border: none;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  padding: 10px 24px;
  color: #F8FAFC;
}

.form-btn-primary:hover {
  background: #165c48;
}

.form-btn-secondary {
  background: transparent;
  border: 1px solid #5E7795;
  border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  padding: 10px 24px;
  color: #799AB7;
}

.form-btn-secondary:hover {
  border-color: #799AB7;
  background: rgba(94, 119, 149, 0.1);
}
</style>