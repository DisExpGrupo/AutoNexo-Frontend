import http from '@/lib/apiClient';

const BASE_URL = 'service-bookings';

export type BookingStatus =
  | 'PENDING_SCHEDULE'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Booking {
  id: number;
  serviceRequestId: number;
  workshopId: number;
  scheduledDate: string;
  finalPriceAmount: number;
  currency: string;
  status: BookingStatus;
  servicesToPerform: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export const bookingService = {
  async getBookingByRequestId(requestId: number): Promise<Booking | null> {
    const response = await http.get<Booking[]>(BASE_URL, {
      params: { serviceRequestId: requestId },
    });
    const bookings = response.data;
    if (!bookings || bookings.length === 0) return null;
    return bookings[0];
  },

  async getMyBookings(): Promise<Booking[]> {
    const response = await http.get<Booking[]>(BASE_URL);
    return response.data;
  },
};
