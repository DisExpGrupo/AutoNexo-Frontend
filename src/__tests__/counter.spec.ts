import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useCounterStore } from '@/stores/counter'

describe('Counter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with count 0', () => {
    const store = useCounterStore()
    expect(store.count).toBe(0)
  })

  it('should increment count', () => {
    const store = useCounterStore()
    store.increment()
    expect(store.count).toBe(1)
  })

  it('should decrement count', () => {
    const store = useCounterStore()
    store.decrement()
    expect(store.count).toBe(-1)
  })

  it('should reset count to 0', () => {
    const store = useCounterStore()
    store.increment()
    store.increment()
    store.reset()
    expect(store.count).toBe(0)
  })

  it('should compute double count correctly', () => {
    const store = useCounterStore()
    store.increment()
    store.increment()
    expect(store.doubleCount).toBe(4)
  })
})