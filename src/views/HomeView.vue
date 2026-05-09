<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()

const inputValue = ref('')
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen gap-8 p-8">
    <h1 class="text-4xl font-bold text-gray-800">Counter Demo</h1>

    <div class="flex flex-col items-center gap-4">
      <div class="text-6xl font-bold text-blue-600">
        {{ counterStore.count }}
      </div>
      <div class="text-xl text-gray-600">
        Double count: {{ counterStore.doubleCount }}
      </div>
    </div>

    <div class="flex gap-4">
      <Button
        label="Increment"
        icon="pi pi-plus"
        severity="success"
        @click="counterStore.increment"
      />
      <Button
        label="Decrement"
        icon="pi pi-minus"
        severity="danger"
        @click="counterStore.decrement"
      />
      <Button
        label="Reset"
        icon="pi pi-refresh"
        severity="secondary"
        @click="counterStore.reset"
      />
    </div>

    <div class="flex flex-col items-center gap-4 mt-8">
      <InputText v-model="inputValue" placeholder="Type something..." />
      <p class="text-gray-600">You typed: {{ inputValue }}</p>
    </div>
  </div>
</template>