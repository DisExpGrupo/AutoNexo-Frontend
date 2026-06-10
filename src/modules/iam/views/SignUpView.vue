<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/iam/store/auth';
import { UserRole, ErrorCode } from '@/modules/iam/models/auth.model';
import { parseApiError } from '@/lib/apiError';
import type { ErrorResponse } from '@/modules/iam/models/auth.model';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import Card from 'primevue/card';
import Divider from 'primevue/divider';
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
  { label: 'Workshop Manager', value: UserRole.WORKSHOP_MANAGER },
];

async function handleRegister() {
  try {
    await authStore.register(form.value);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Account created. Please sign in.', life: 3000 });
    router.push({ name: 'login' });
  } catch (err) {
    const parsed = parseApiError(err) as ErrorResponse;
    const code = parsed.errorCode || authStore.error;

    if (code === ErrorCode.EMAIL_ALREADY_EXISTS) {
      toast.add({
        severity: 'warn',
        summary: 'Email Already Registered',
        detail: 'An account with this email already exists. Please sign in instead.',
        life: 6000,
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Registration Failed',
        detail: parsed.message || 'An unexpected error occurred. Please try again.',
        life: 5000,
      });
    }
  }
}
</script>

<template>
  <div class="auth-grid-bg min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-lg">
      <Card id="main-content" role="main">
        <template #title>
          <div class="mb-2">
            <p class="text-sm font-medium text-[var(--p-primary-color)] mb-2">AutoNexo</p>
            <h1 class="text-3xl font-bold">Create Account</h1>
          </div>
        </template>
        <template #content>
          <form @submit.prevent="handleRegister" class="flex flex-col gap-4" novalidate>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label for="firstName" class="font-medium text-sm">First Name</label>
                <InputText
                  id="firstName"
                  v-model="form.firstName"
                  placeholder="John"
                  class="w-full"
                  autocomplete="given-name"
                  required
                />
              </div>
              <div class="flex flex-col gap-2">
                <label for="lastName" class="font-medium text-sm">Last Name</label>
                <InputText
                  id="lastName"
                  v-model="form.lastName"
                  placeholder="Doe"
                  class="w-full"
                  autocomplete="family-name"
                  required
                />
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label for="email" class="font-medium text-sm">Email</label>
              <InputText
                id="email"
                v-model="form.email"
                type="email"
                placeholder="operator@autonexo.com"
                class="w-full"
                autocomplete="email"
                required
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="phoneNumber" class="font-medium text-sm">Phone</label>
              <InputText
                id="phoneNumber"
                v-model="form.phoneNumber"
                placeholder="+1 555 0123"
                class="w-full"
                autocomplete="tel"
                required
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="password" class="font-medium text-sm">Password</label>
              <InputText
                id="password"
                v-model="form.password"
                type="password"
                placeholder="••••••••"
                class="w-full"
                autocomplete="new-password"
                required
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="font-medium text-sm">Account Type</label>
              <SelectButton
                v-model="form.requestedRole"
                :options="roleOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
                aria-label="Select account type"
              />
            </div>

            <Divider class="my-2" />

            <Button
              type="submit"
              label="Register"
              :loading="authStore.loading"
              class="w-full"
            />
          </form>

          <p class="text-center mt-6 text-sm">
            Already registered?
            <RouterLink to="/login" class="text-[var(--p-primary-color)] hover:underline">
              Sign in
            </RouterLink>
          </p>
        </template>
      </Card>
    </div>
  </div>
</template>
