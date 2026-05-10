<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/iam/store/auth';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Password from 'primevue/password';

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
      <div class="auth-card p-8" id="main-content" role="main">
        <div class="mb-8">
          <p class="auth-label mb-2">AutoNexo</p>
          <h1 class="auth-heading text-3xl text-white">Sign In</h1>
        </div>

        <Message
          v-if="authStore.error"
          severity="error"
          class="mb-6"
          :closable="false"
          role="alert"
          aria-live="assertive"
        >
          {{ authStore.error }}
        </Message>

        <form @submit.prevent="handleLogin" class="flex flex-col gap-5" novalidate>
          <div class="flex flex-col gap-2">
            <label for="email" class="auth-label">Email</label>
            <InputText
              id="email"
              ref="emailInput"
              v-model="email"
              type="email"
              placeholder="operator@autonexo.com"
              class="auth-input w-full py-3 px-4"
              autocomplete="email"
              :aria-invalid="!!authStore.error"
              :aria-describedby="authStore.error ? 'login-error' : undefined"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="auth-label">Password</label>
            <Password
              id="password"
              v-model="password"
              placeholder="••••••••"
              :feedback="false"
              toggleMask
              class="w-full"
              inputClass="auth-input w-full py-3 px-4"
              containerClass="border-0"
              autocomplete="current-password"
              :aria-invalid="!!authStore.error"
            />
          </div>

          <div class="auth-divider my-2" />

          <Button
            type="submit"
            label="Authenticate"
            :loading="authStore.loading"
            class="auth-btn-primary w-full py-3 mt-1"
          />
        </form>

        <p class="text-center mt-8 auth-text-muted text-sm">
          No account?
          <RouterLink to="/register" class="auth-link">Request access</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
