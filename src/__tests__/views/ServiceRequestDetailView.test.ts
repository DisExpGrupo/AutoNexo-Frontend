import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { setActivePinia, createPinia } from 'pinia';
import ServiceRequestDetailView from '@/modules/matching/views/ServiceRequestDetailView.vue';
import { offerService } from '@/modules/matching/services/offer.service';
import { bookingService } from '@/modules/matching/services/booking.service';
import { serviceRequestService } from '@/modules/matching/services/service-request.service';
import { vehicleService } from '@/modules/vehicles/services/vehicle.service';

vi.mock('@/modules/matching/services/offer.service', () => ({
  offerService: {
    getOffersByRequestId: vi.fn(),
    acceptOffer: vi.fn(),
  },
}));

vi.mock('@/modules/matching/services/booking.service', () => ({
  bookingService: {
    getBookingByRequestId: vi.fn(),
  },
}));

vi.mock('@/modules/matching/services/service-request.service', () => ({
  serviceRequestService: {
    getServiceRequestById: vi.fn(),
  },
}));

vi.mock('@/modules/vehicles/services/vehicle.service', () => ({
  vehicleService: {
    getMyVehicles: vi.fn(),
  },
}));

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() }),
}));

const mockOfferService = offerService as unknown as {
  getOffersByRequestId: ReturnType<typeof vi.fn>;
  acceptOffer: ReturnType<typeof vi.fn>;
};

const mockBookingService = bookingService as unknown as {
  getBookingByRequestId: ReturnType<typeof vi.fn>;
};

const mockServiceRequestService = serviceRequestService as unknown as {
  getServiceRequestById: ReturnType<typeof vi.fn>;
};

const mockVehicleService = vehicleService as unknown as {
  getMyVehicles: ReturnType<typeof vi.fn>;
};

const request = {
  id: 44,
  userId: 1,
  vehicleId: 5,
  requestedServices: ['Oil change'],
  description: 'Need maintenance',
  latitude: 0,
  longitude: 0,
  searchRadiusKm: 5,
  status: 'PENDING' as const,
  createdAt: '2026-05-11T00:00:00.000Z',
  cancelledAt: null,
};

const vehicle = {
  id: 5,
  brandId: 1,
  model: 'Toyota',
  year: 2021,
  color: 'Red',
  licensePlate: 'ABC-123',
  vin: 'VIN',
  currentMileage: 45200,
  imageUrls: [],
  active: true,
  primaryOwnerId: 9,
};

const pendingOffer = {
  id: 10,
  serviceRequestId: 44,
  workshopId: 2,
  proposedPriceAmount: 100,
  currency: 'PEN',
  proposedDate: '2026-05-12T00:00:00.000Z',
  status: 'PENDING' as const,
  message: 'We can help',
  createdAt: '2026-05-11T00:00:00.000Z',
  expiresAt: '2026-05-12T00:00:00.000Z',
  acceptedAt: null,
  withdrawnAt: null,
};

const booking = {
  id: 99,
  serviceRequestId: 44,
  workshopId: 2,
  scheduledDate: '2026-05-13T00:00:00.000Z',
  finalPriceAmount: 100,
  currency: 'PEN',
  status: 'SCHEDULED' as const,
  servicesToPerform: ['Oil change'],
  notes: 'Bring the car at 9am',
  createdAt: '2026-05-11T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
};

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/requests/:id', name: 'service-request-detail', component: ServiceRequestDetailView }],
  });

  router.push('/requests/44');
  await router.isReady();

  return mount(ServiceRequestDetailView, {
    global: {
      plugins: [router],
      stubs: {
        Button: {
          template: '<button>{{ label }}<slot /></button>',
          props: ['label'],
        },
      },
    },
  });
}

describe('ServiceRequestDetailView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-11T10:00:00.000Z'));
    mockServiceRequestService.getServiceRequestById.mockResolvedValue(request);
    mockVehicleService.getMyVehicles.mockResolvedValue([vehicle]);
    mockOfferService.getOffersByRequestId.mockResolvedValue([pendingOffer]);
    mockBookingService.getBookingByRequestId.mockResolvedValue(booking);
  });

  it('loads offers and accepts one to show booking receipt', async () => {
    mockOfferService.acceptOffer.mockResolvedValue({ ...pendingOffer, status: 'ACCEPTED' });

    const wrapper = await mountView();
    await flushPromises();

    expect(wrapper.text()).toContain('Offers');
    expect(wrapper.text()).toContain('Accept Offer');

    const acceptButton = wrapper.findAll('button').find((btn) => btn.text().includes('Accept Offer'));
    await acceptButton?.trigger('click');
    await flushPromises();

    expect(mockOfferService.acceptOffer).toHaveBeenCalledWith(pendingOffer.id);
    expect(mockBookingService.getBookingByRequestId).toHaveBeenCalledWith(request.id);
    expect(wrapper.text()).toContain('Booking Summary');
    expect(wrapper.text()).toContain('Service Scheduled');
  });

  it('starts polling when request is pending', async () => {
    await mountView();
    await flushPromises();

    const callsAfterMount = mockOfferService.getOffersByRequestId.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThanOrEqual(1);
    vi.advanceTimersByTime(10_000);
    await flushPromises();

    expect(mockOfferService.getOffersByRequestId.mock.calls.length).toBe(callsAfterMount + 1);
  });
});
