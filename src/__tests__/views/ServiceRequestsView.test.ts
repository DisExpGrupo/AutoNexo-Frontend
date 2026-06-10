import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import { setActivePinia, createPinia } from 'pinia';
import ServiceRequestsView from '@/modules/workshop/views/ServiceRequestsView.vue';
import { workshopService } from '@/modules/workshop/services/workshop.service';
import { offerService } from '@/modules/matching/services/offer.service';
import { serviceRequestService } from '@/modules/matching/services/service-request.service';
import { bookingService } from '@/modules/matching/services/booking.service';

vi.mock('@/modules/workshop/services/workshop.service', () => ({
  workshopService: {
    getAvailableRequests: vi.fn(),
  },
}));

vi.mock('@/modules/matching/services/offer.service', () => ({
  offerService: {
    getMyWorkshopOffers: vi.fn(),
    createOffer: vi.fn(),
  },
}));

vi.mock('@/modules/matching/services/service-request.service', () => ({
  serviceRequestService: {
    getServiceRequestById: vi.fn(),
  },
}));

vi.mock('@/modules/matching/services/booking.service', () => ({
  bookingService: {
    getBookingByRequestId: vi.fn(),
  },
}));

vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: vi.fn() }),
}));

const mockWorkshopService = workshopService as unknown as {
  getAvailableRequests: ReturnType<typeof vi.fn>;
};

const mockOfferService = offerService as unknown as {
  getMyWorkshopOffers: ReturnType<typeof vi.fn>;
  createOffer: ReturnType<typeof vi.fn>;
};

const mockServiceRequestService = serviceRequestService as unknown as {
  getServiceRequestById: ReturnType<typeof vi.fn>;
};

const mockBookingService = bookingService as unknown as {
  getBookingByRequestId: ReturnType<typeof vi.fn>;
};

const availableRequest = {
  id: 7,
  vehicleId: 1,
  description: 'Brake inspection',
  requestedServices: ['Brakes'],
  matchingServices: ['Brakes'],
  matchScore: 0.72,
  distanceKm: 2.3,
  userLocation: { latitude: -12.1, longitude: -77.0 },
  status: 'PENDING',
  createdAt: '2026-05-10T00:00:00.000Z',
};

const offer = {
  id: 10,
  serviceRequestId: 7,
  workshopId: 2,
  proposedPriceAmount: 120,
  currency: 'PEN',
  proposedDate: '2026-05-12T00:00:00.000Z',
  status: 'PENDING',
  message: 'We can help',
  createdAt: '2026-05-11T00:00:00.000Z',
  expiresAt: '2026-05-12T00:00:00.000Z',
  acceptedAt: null,
  withdrawnAt: null,
};

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'service-requests-hub', component: ServiceRequestsView }],
  });
  router.push('/');
  await router.isReady();

  return mount(ServiceRequestsView, {
    global: {
      plugins: [router],
      stubs: {
        Button: {
          template: '<button>{{ label }}<slot /></button>',
          props: ['label'],
        },
        Dialog: {
          template: '<div><slot /><slot name="footer" /></div>',
          props: ['visible'],
        },
        InputNumber: { template: '<input />' },
        Select: { template: '<select />', props: ['options'] },
        Calendar: { template: '<input />' },
        Textarea: { template: '<textarea />' },
        Tabs: { template: '<div><slot /></div>', props: ['value'] },
        TabList: { template: '<div><slot /></div>' },
        Tab: { template: '<button @click="$emit(\'click\')"><slot /></button>', props: ['value'] },
        TabPanels: { template: '<div><slot /></div>' },
        TabPanel: { template: '<div><slot /></div>', props: ['value'] },
        Card: { template: '<div><slot /><slot name="content" /></div>' },
        Tag: { template: '<span>{{ value }}</span>', props: ['value', 'severity'] },
      },
    },
  });
}

describe('ServiceRequestsView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockWorkshopService.getAvailableRequests.mockResolvedValue([availableRequest]);
    mockOfferService.getMyWorkshopOffers.mockResolvedValue([offer]);
    mockServiceRequestService.getServiceRequestById.mockResolvedValue({ description: 'Brake inspection' });
    mockBookingService.getBookingByRequestId.mockResolvedValue(null);
  });

  it('renders nearby opportunities', async () => {
    const wrapper = await mountView();
    await flushPromises();

    expect(wrapper.text()).toContain('Nearby Opportunities');
    expect(wrapper.text()).toContain('Brake inspection');
    expect(wrapper.text()).toContain('Send Offer');
  });

  it('switches to active services and renders offers', async () => {
    const wrapper = await mountView();
    await flushPromises();

    const activeTab = wrapper.findAll('button').find((btn) => btn.text().includes('My Active Services'));
    await activeTab?.trigger('click');
    await flushPromises();

    expect(mockOfferService.getMyWorkshopOffers).toHaveBeenCalled();
    expect(wrapper.text()).toContain('Service for Request #7');
  });
});
