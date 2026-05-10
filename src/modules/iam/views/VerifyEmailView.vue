<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/iam/store/auth';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

const router = useRouter();
const authStore = useAuthStore();
const token = ref('');
const tokenInput = ref();

async function handleVerify() {
  try {
    await authStore.verify({ token: token.value });
    router.push({ name: 'dashboard' });
  } catch {
    tokenInput.value?.$el?.querySelector('input')?.focus();
  }
}
</script>

<template>
  <div class="auth-grid-bg min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      <div class="auth-card p-8 text-center" id="main-content" role="main">
        <div class="mb-8">
          <p class="auth-label mb-2">AutoNexo</p>
          <h1 class="auth-heading text-3xl text-white">Verify Email</h1>
        </div>

        <p class="auth-text-muted text-sm mb-8 leading-relaxed">
          A verification token has been sent to your email. Paste it below to activate your account.
        </p>

        <form @submit.prevent="handleVerify" class="flex flex-col gap-5" novalidate>
          <div class="flex flex-col gap-2 text-left">
            <label for="token" class="auth-label">Verification Token</label>
            <InputText
              id="token"
              ref="tokenInput"
              v-model="token"
              placeholder="a9599e49-e80d-4f50-953e-77670d0bd9c6"
              class="auth-input w-full py-3 px-4 font-mono text-sm tracking-wide"
              autocomplete="one-time-code"
              spellcheck="false"
            />
          </div>

          <div class="auth-divider my-2" />

          <Button
            type="submit"
            label="Verify Account"
            :loading="authStore.loading"
            :disabled="!token"
            class="auth-btn-primary w-full py-3 mt-1"
          />
        </form>
      </div>
    </div>
  </div>
</template>
