<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/iam/store/auth';
import { UserRole } from '@/modules/iam/models/auth.model';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  requestedRole: UserRole.CAR_OWNER,
});

const roleOptions = [
  { label: 'Car Owner', value: UserRole.CAR_OWNER },
  { label: 'Workshop Owner', value: UserRole.WORKSHOP_OWNER },
];

async function handleRegister() {
  try {
    await authStore.register(form.value);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Account created. Please sign in.', life: 3000 });
    router.push({ name: 'login' });
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Registration failed. Please try again.', life: 5000 });
  }
}
</script>

<template>
  <div class="auth-grid-bg min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-lg">
      <div class="auth-card p-8" id="main-content" role="main">
        <div class="mb-8">
          <p class="auth-label mb-2">AutoNexo</p>
          <h1 class="auth-heading text-3xl text-white">Create Account</h1>
        </div>

        <form @submit.prevent="handleRegister" class="flex flex-col gap-5" novalidate>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <label for="firstName" class="auth-label">First Name</label>
              <InputText
                id="firstName"
                v-model="form.firstName"
                placeholder="John"
                class="auth-input w-full py-3 px-4"
                autocomplete="given-name"
                required
              />
            </div>
            <div class="flex flex-col gap-2">
              <label for="lastName" class="auth-label">Last Name</label>
              <InputText
                id="lastName"
                v-model="form.lastName"
                placeholder="Doe"
                class="auth-input w-full py-3 px-4"
                autocomplete="family-name"
                required
              />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label for="email" class="auth-label">Email</label>
            <InputText
              id="email"
              v-model="form.email"
              type="email"
              placeholder="operator@autonexo.com"
              class="auth-input w-full py-3 px-4"
              autocomplete="email"
              required
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="phoneNumber" class="auth-label">Phone</label>
            <InputText
              id="phoneNumber"
              v-model="form.phoneNumber"
              placeholder="+1 555 0123"
              class="auth-input w-full py-3 px-4"
              autocomplete="tel"
              required
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="auth-label">Password</label>
            <InputText
              id="password"
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              class="auth-input w-full py-3 px-4"
              autocomplete="new-password"
              required
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="auth-label">Account Type</label>
            <SelectButton
              v-model="form.requestedRole"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              aria-label="Select account type"
            />
          </div>

          <div class="auth-divider my-2" />

          <Button
            type="submit"
            label="Register"
            :loading="authStore.loading"
            class="auth-btn-primary w-full py-3 mt-1"
          />
        </form>

        <p class="text-center mt-8 auth-text-muted text-sm">
          Already registered?
          <RouterLink to="/login" class="auth-link">Sign in</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
