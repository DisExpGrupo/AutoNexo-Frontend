import { beforeEach, describe, expect, it, vi } from 'vitest';
import http from '@/lib/apiClient';
import { bookingService } from '@/modules/matching/services/booking.service';

vi.mock('@/lib/apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe('bookingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the first booking for a request', async () => {
    mockedHttp.get.mockResolvedValue({ data: [{ id: 7 }] });

    const result = await bookingService.getBookingByRequestId(12);

    expect(mockedHttp.get).toHaveBeenCalledWith('service-bookings', {
      params: { serviceRequestId: 12 },
    });
    expect(result).toEqual({ id: 7 });
  });

  it('returns null when no bookings exist', async () => {
    mockedHttp.get.mockResolvedValue({ data: [] });

    const result = await bookingService.getBookingByRequestId(55);

    expect(result).toBeNull();
  });
});
