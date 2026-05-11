import { beforeEach, describe, expect, it, vi } from 'vitest';
import http from '@/lib/apiClient';
import { offerService } from '@/modules/matching/services/offer.service';

vi.mock('@/lib/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe('offerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an offer', async () => {
    mockedHttp.post.mockResolvedValue({ data: { id: 1 } });
    const payload = {
      serviceRequestId: 10,
      proposedPriceAmount: 120,
      currency: 'PEN',
      proposedDate: '2026-05-12T00:00:00.000Z',
      message: 'Quick service',
    };

    const result = await offerService.createOffer(payload);

    expect(mockedHttp.post).toHaveBeenCalledWith('/offers', payload);
    expect(result).toEqual({ id: 1 });
  });

  it('fetches offers by request id', async () => {
    mockedHttp.get.mockResolvedValue({ data: [] });

    await offerService.getOffersByRequestId(44);

    expect(mockedHttp.get).toHaveBeenCalledWith('/offers/service-requests/44');
  });

  it('accepts an offer', async () => {
    mockedHttp.post.mockResolvedValue({ data: { id: 3, status: 'ACCEPTED' } });

    const result = await offerService.acceptOffer(3);

    expect(mockedHttp.post).toHaveBeenCalledWith('/offers/3/accept');
    expect(result).toEqual({ id: 3, status: 'ACCEPTED' });
  });

  it('fetches my offers with params', async () => {
    mockedHttp.get.mockResolvedValue({ data: [] });

    await offerService.getMyOffers({ status: 'PENDING' });

    expect(mockedHttp.get).toHaveBeenCalledWith('/offers/my-requests', { params: { status: 'PENDING' } });
  });

  it('fetches workshop offers with params', async () => {
    mockedHttp.get.mockResolvedValue({ data: [] });

    await offerService.getMyWorkshopOffers({ status: 'ACCEPTED' });

    expect(mockedHttp.get).toHaveBeenCalledWith('/offers/my-workshop', { params: { status: 'ACCEPTED' } });
  });
});
