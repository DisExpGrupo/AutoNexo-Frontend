<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/iam/store/auth';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Password from 'primevue/password';
import Card from 'primevue/card';
import Divider from 'primevue/divider';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const emailInput = ref();

async function handleLogin() {
  try {
    await authStore.login({ email: email.value, password: password.value });
    router.push({ name: 'dashboard' });
  } catch {
    emailInput.value?.$el?.querySelector('input')?.focus();
  }
}
</script>

<template>
  <div class="auth-grid-bg min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      <Card id="main-content" role="main">
        <template #title>
          <div class="mb-2">
            <p class="text-sm font-medium text-[var(--p-primary-color)] mb-2">AutoNexo</p>
            <h1 class="text-3xl font-bold">Sign In</h1>
          </div>
        </template>
        <template #content>
          <Message
            v-if="authStore.error"
            severity="error"
            class="mb-4"
            :closable="false"
            role="alert"
            aria-live="assertive"
          >
            {{ authStore.error }}
          </Message>

          <form @submit.prevent="handleLogin" class="flex flex-col gap-4" novalidate>
            <div class="flex flex-col gap-2">
              <label for="email" class="font-medium text-sm">Email</label>
              <InputText
                id="email"
                ref="emailInput"
                v-model="email"
                type="email"
                placeholder="operator@autonexo.com"
                class="w-full"
                autocomplete="email"
                :aria-invalid="!!authStore.error"
                :aria-describedby="authStore.error ? 'login-error' : undefined"
              />
            </div>

            <div class="flex flex-col gap-2">
              <label for="password" class="font-medium text-sm">Password</label>
              <Password
                id="password"
                v-model="password"
                placeholder="••••••••"
                :feedback="false"
                toggleMask
                class="w-full"
                autocomplete="current-password"
                :aria-invalid="!!authStore.error"
              />
            </div>

            <Divider class="my-2" />

            <Button
              type="submit"
              label="Authenticate"
              :loading="authStore.loading"
              class="w-full"
            />
          </form>

          <p class="text-center mt-6 text-sm">
            No account?
            <RouterLink to="/register" class="text-[var(--p-primary-color)] hover:underline">
              Request access
            </RouterLink>
          </p>
        </template>
      </Card>
    </div>
  </div>
</template>
