<script setup lang="ts">
import { ref, shallowRef, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { bookingService } from '@/modules/matching/services/booking.service';
import type { Booking } from '@/modules/matching/services/booking.service';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Skeleton from 'primevue/skeleton';

const router = useRouter();

const bookings = shallowRef<Booking[]>([]);
const loading = ref(true);
const selectedDate = ref<Date | null>(null);
const calendarMonth = ref(new Date());
const showMonthPicker = ref(false);
const pickerYear = ref(calendarMonth.value.getFullYear());

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthLabels = Array.from({ length: 12 }, (_, index) =>
  new Date(2020, index, 1).toLocaleString('en-US', { month: 'short' })
);

const filteredBookings = computed<Booking[]>(() => {
  if (!selectedDate.value) return bookings.value.filter((b) => b.status === 'SCHEDULED' || b.status === 'IN_PROGRESS');
  const key = dateKey(selectedDate.value);
  return bookings.value.filter((b) => dateKey(new Date(b.scheduledDate)) === key);
});

type DotKind = 'pending' | 'scheduled' | 'inprogress';

const DOT_STATUS_MAP: Partial<Record<Booking['status'], DotKind>> = {
  PENDING_SCHEDULE: 'pending',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'inprogress',
};

const DOT_ORDER: DotKind[] = ['pending', 'scheduled', 'inprogress'];

const calendarMonthLabel = computed(() =>
  calendarMonth.value.toLocaleString('en-US', { month: 'long' })
);

const calendarYearLabel = computed(() => calendarMonth.value.getFullYear());

const bookingDotsByDate = computed(() => {
  const map = new Map<string, Set<DotKind>>();
  for (const booking of bookings.value) {
    const dot = DOT_STATUS_MAP[booking.status];
    if (!dot) continue;
    const key = dateKey(new Date(booking.scheduledDate));
    const set = map.get(key) ?? new Set<DotKind>();
    set.add(dot);
    map.set(key, set);
  }
  return map;
});

const calendarDays = computed(() => {
  const year = calendarMonth.value.getFullYear();
  const month = calendarMonth.value.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startIndex = (firstOfMonth.getDay() + 6) % 7;
  const days: Array<{
    date: Date;
    key: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    dots: DotKind[];
  }> = [];

  for (let i = 0; i < 42; i += 1) {
    const dayNumber = i - startIndex + 1;
    const date = new Date(year, month, dayNumber);
    const key = dateKey(date);
    const dotSet = bookingDotsByDate.value.get(key);
    const dots = dotSet ? DOT_ORDER.filter((dot) => dotSet.has(dot)) : [];
    days.push({
      date,
      key,
      isCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, new Date()),
      isSelected: selectedDate.value ? isSameDay(date, selectedDate.value) : false,
      dots,
    });
  }

  return days;
});

const BOOKING_STATUS_LABELS: Record<Booking['status'], string> = {
  PENDING_SCHEDULE: 'Pending Schedule',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const BOOKING_STATUS_SEVERITY: Record<Booking['status'], 'warning' | 'success' | 'secondary' | 'danger'> = {
  PENDING_SCHEDULE: 'warning',
  SCHEDULED: 'success',
  IN_PROGRESS: 'warning',
  COMPLETED: 'secondary',
  CANCELLED: 'danger',
};

function formatPrice(amount: number, currency: string): string {
  if (!currency) return new Intl.NumberFormat('es-PE', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0);
  return normalized;
}

function dateKey(date: Date): string {
  return normalizeDate(date).toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

function prevMonth(): void {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() - 1, 1);
}

function nextMonth(): void {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + 1, 1);
}

function toggleMonthPicker(): void {
  showMonthPicker.value = !showMonthPicker.value;
  if (showMonthPicker.value) pickerYear.value = calendarMonth.value.getFullYear();
}

function closeMonthPicker(): void {
  showMonthPicker.value = false;
}

function prevPickerYear(): void {
  pickerYear.value -= 1;
}

function nextPickerYear(): void {
  pickerYear.value += 1;
}

function selectMonth(monthIndex: number): void {
  calendarMonth.value = new Date(pickerYear.value, monthIndex, 1);
  closeMonthPicker();
}

function selectDay(date: Date): void {
  selectedDate.value = normalizeDate(date);
  calendarMonth.value = new Date(date.getFullYear(), date.getMonth(), 1);
  closeMonthPicker();
}

function goToday(): void {
  const today = normalizeDate(new Date());
  selectedDate.value = today;
  calendarMonth.value = new Date(today.getFullYear(), today.getMonth(), 1);
  closeMonthPicker();
}

onMounted(async () => {
  try {
    const all = await bookingService.getMyBookings();
    bookings.value = all;
  } catch {
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="an-dashboard">
    <div class="an-dashboard-header">
      <h1 class="an-dashboard-title">Agenda</h1>
      <p class="an-dashboard-subtitle">Overview of your upcoming scheduled services.</p>
    </div>

    <div class="agenda-layout grid grid-cols-1 gap-6 items-start md:grid-cols-[360px_1fr]">
      <div class="flex flex-col gap-4 order-1 md:order-0">
        <Card class="relative">
          <template #content>
            <div class="cal-header">
              <button class="cal-nav-btn" type="button" aria-label="Previous month" @click="prevMonth">
                <span aria-hidden="true">‹</span>
              </button>
              <button class="cal-month-label" type="button" @click="toggleMonthPicker">
                <span class="cal-month">{{ calendarMonthLabel }}</span>
                <span class="cal-year">{{ calendarYearLabel }}</span>
              </button>
              <button class="cal-nav-btn" type="button" aria-label="Next month" @click="nextMonth">
                <span aria-hidden="true">›</span>
              </button>
            </div>

            <div class="cal-subheader">
              <span class="cal-subtitle">Jump to date</span>
              <button class="cal-today-btn" type="button" @click="goToday">Today</button>
            </div>

            <div v-if="showMonthPicker" class="cal-picker">
              <div class="cal-picker-header">
                <button class="cal-picker-nav" type="button" aria-label="Previous year" @click="prevPickerYear">‹</button>
                <span class="cal-picker-year">{{ pickerYear }}</span>
                <button class="cal-picker-nav" type="button" aria-label="Next year" @click="nextPickerYear">›</button>
              </div>
              <div class="cal-month-grid">
                <button
                  v-for="(label, index) in monthLabels"
                  :key="label"
                  class="cal-month-btn"
                  :class="{ 'is-active': index === calendarMonth.getMonth() && pickerYear === calendarMonth.getFullYear() }"
                  type="button"
                  @click="selectMonth(index)"
                >
                  {{ label }}
                </button>
              </div>
            </div>

            <div class="cal-weekdays">
              <span v-for="day in weekdayLabels" :key="day">{{ day }}</span>
            </div>

            <div class="cal-grid">
              <button
                v-for="day in calendarDays"
                :key="day.key"
                type="button"
                class="cal-day"
                :class="{ 'other-month': !day.isCurrentMonth, 'is-today': day.isToday, 'is-selected': day.isSelected }"
                @click="selectDay(day.date)"
              >
                <span class="cal-day-num">{{ day.date.getDate() }}</span>
                <span v-if="day.dots.length > 0" class="cal-day-badges">
                  <span v-for="dot in day.dots" :key="dot" class="cal-dot" :class="`cal-dot--${dot}`"></span>
                </span>
              </button>
            </div>

            <div class="calendar-legend">
              <div class="legend-item">
                <div class="legend-dot legend-dot--pending"></div>
                <span>Pending Schedule</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot legend-dot--scheduled"></div>
                <span>Scheduled</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot legend-dot--inprogress"></div>
                <span>In Progress</span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <template v-if="selectedDate">
            <span class="font-mono text-sm font-bold text-white capitalize">{{ selectedDate.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
            <Button
              link
              class="p-0 font-mono text-xs font-bold text-[#1B7A5A]"
              @click="selectedDate = null"
            >
              Show all upcoming
            </Button>
          </template>
          <template v-else>
            <span class="font-mono text-sm font-bold text-white">Upcoming Services</span>
          </template>
        </div>

        <template v-if="loading">
          <div class="flex flex-col gap-3">
            <Skeleton v-for="i in 3" :key="i" height="8rem" class="rounded-xl" />
          </div>
        </template>

        <template v-else-if="filteredBookings.length === 0">
          <Card>
            <template #content>
              <div class="flex flex-col items-center py-16 px-8 gap-3">
                <i class="pi pi-calendar text-[2.5rem] text-[#799AB7]"></i>
                <p class="font-mono text-sm font-bold text-[#799AB7] m-0">No services scheduled.</p>
              </div>
            </template>
          </Card>
        </template>

        <template v-else>
          <div class="flex flex-col gap-3">
            <Card v-for="booking in filteredBookings" :key="booking.id">
              <template #content>
                <div class="flex gap-5 items-start max-md:flex-col max-md:gap-3">
                  <div class="flex flex-col items-center min-w-[72px] flex-shrink-0 max-md:flex-row max-md:gap-2 max-md:items-center">
                    <span class="font-mono text-base font-bold text-[#1B7A5A]">{{ formatTime(booking.scheduledDate) }}</span>
                    <span class="font-mono text-xs text-[#799AB7]">{{ formatDate(booking.scheduledDate) }}</span>
                  </div>

                  <div class="flex-1 min-w-0 flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                      <Tag :severity="BOOKING_STATUS_SEVERITY[booking.status]" :value="BOOKING_STATUS_LABELS[booking.status]" />
                      <span class="font-mono text-xs text-[#5E7795] ml-auto">Req. #{{ booking.serviceRequestId }}</span>
                    </div>

                    <div class="flex gap-5">
                      <div class="flex flex-col gap-0.5">
                        <span class="font-mono text-[0.6rem] font-bold tracking-wider uppercase text-[#5E7795]">Workshop</span>
                        <span class="font-sans text-sm text-[#F8FAFC]">#{{ booking.workshopId }}</span>
                      </div>
                      <div class="flex flex-col gap-0.5">
                        <span class="font-mono text-[0.6rem] font-bold tracking-wider uppercase text-[#5E7795]">Price</span>
                        <span class="font-mono text-sm font-bold text-[#1B7A5A]">{{ formatPrice(booking.finalPriceAmount, booking.currency) }}</span>
                      </div>
                    </div>

                    <div v-if="booking.servicesToPerform.length > 0" class="flex flex-wrap gap-1.5">
                      <Tag v-for="svc in booking.servicesToPerform" :key="svc" severity="secondary" :value="svc" />
                    </div>
                  </div>

                  <div class="flex items-center flex-shrink-0">
                    <Button
                      label="View Details"
                      severity="secondary"
                      outlined
                      size="small"
                      @click="router.push({ name: 'service-request-detail', params: { id: booking.serviceRequestId } })"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cal-header {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 8px;
}

.cal-nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(94, 119, 149, 0.25);
  background: rgba(15, 25, 32, 0.8);
  color: #F8FAFC;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 1.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.cal-nav-btn:hover {
  border-color: rgba(27, 122, 90, 0.5);
  background: rgba(27, 122, 90, 0.12);
}

.cal-nav-btn:focus-visible {
  outline: 2px solid var(--an-teal);
  outline-offset: 2px;
}

.cal-month-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: transparent;
  border: none;
  color: #F8FAFC;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 10px;
  transition: background 0.15s ease, color 0.15s ease;
}

.cal-month-label:hover {
  background: rgba(94, 119, 149, 0.18);
}

.cal-month-label:focus-visible {
  outline: 2px solid var(--an-teal);
  outline-offset: 2px;
}

.cal-month {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.cal-year {
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #799AB7;
}

.cal-subheader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(15, 25, 32, 0.7);
  border: 1px solid rgba(94, 119, 149, 0.2);
}

.cal-subtitle {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #799AB7;
}

.cal-today-btn {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1B7A5A;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
}

.cal-today-btn:hover {
  background: rgba(27, 122, 90, 0.12);
}

.cal-today-btn:focus-visible {
  outline: 2px solid var(--an-teal);
  outline-offset: 2px;
}

.cal-picker {
  position: absolute;
  inset: 90px 20px auto 20px;
  background: #101923;
  border: 1px solid rgba(94, 119, 149, 0.3);
  border-radius: 16px;
  padding: 16px;
  z-index: 10;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.35);
}

.cal-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.cal-picker-nav {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(94, 119, 149, 0.25);
  background: rgba(15, 25, 32, 0.8);
  color: #F8FAFC;
  font-family: 'IBM Plex Mono', monospace;
  cursor: pointer;
}

.cal-picker-nav:hover {
  border-color: rgba(27, 122, 90, 0.5);
}

.cal-picker-nav:focus-visible {
  outline: 2px solid var(--an-teal);
  outline-offset: 2px;
}

.cal-picker-year {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: #F8FAFC;
}

.cal-month-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.cal-month-btn {
  border-radius: 10px;
  padding: 8px 6px;
  border: 1px solid rgba(94, 119, 149, 0.2);
  background: rgba(15, 25, 32, 0.8);
  color: #799AB7;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cal-month-btn:hover {
  border-color: rgba(27, 122, 90, 0.5);
  color: #F8FAFC;
}

.cal-month-btn.is-active {
  border-color: rgba(27, 122, 90, 0.6);
  color: #F8FAFC;
  background: rgba(27, 122, 90, 0.2);
}

.cal-month-btn:focus-visible {
  outline: 2px solid var(--an-teal);
  outline-offset: 2px;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-top: 16px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #5E7795;
}

.cal-weekdays span {
  text-align: center;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.cal-day {
  position: relative;
  min-height: 64px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: rgba(15, 25, 32, 0.65);
  color: #F8FAFC;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cal-day:hover {
  border-color: rgba(27, 122, 90, 0.4);
  background: rgba(27, 122, 90, 0.12);
}

.cal-day:focus-visible {
  outline: 2px solid var(--an-teal);
  outline-offset: 2px;
}

.cal-day.other-month {
  opacity: 0.35;
}

.cal-day.is-today {
  border-color: rgba(121, 154, 183, 0.5);
  box-shadow: 0 0 0 1px rgba(121, 154, 183, 0.4) inset;
}

.cal-day.is-selected {
  background: rgba(27, 122, 90, 0.2);
  border-color: rgba(27, 122, 90, 0.6);
}

.cal-day-num {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.85rem;
  font-weight: 700;
}

.cal-day-badges {
  display: inline-flex;
  gap: 4px;
}

.cal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.cal-dot--pending {
  background: rgba(245, 158, 11, 0.85);
}

.cal-dot--scheduled {
  background: rgba(27, 122, 90, 0.85);
}

.cal-dot--inprogress {
  background: rgba(245, 158, 11, 1);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
}

.calendar-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(94, 119, 149, 0.12);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: #799AB7;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot--pending {
  background: rgba(245, 158, 11, 0.7);
}

.legend-dot--scheduled {
  background: rgba(27, 122, 90, 0.7);
}

.legend-dot--inprogress {
  background: rgba(245, 158, 11, 1);
  border: 2px solid rgba(245, 158, 11, 0.4);
}
</style>
