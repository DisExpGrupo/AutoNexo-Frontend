import http from '@/lib/apiClient';

const BASE_URL = '/offers';

export interface CreateOfferRequest {
  serviceRequestId: number;
  proposedPriceAmount: number;
  currency: string;
  proposedDate: string; // Formato ISO: "2026-05-11T02:35:32.417Z"
  message: string;
}

// Lo que recibimos del backend (Response)
export interface Offer {
  id: number;
  serviceRequestId: number;
  workshopId: number;
  proposedPriceAmount: number;
  currency: string;
  proposedDate: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'WITHDRAWN';
  message: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  withdrawnAt: string | null;
}

export const offerService = {
  async createOffer(data: CreateOfferRequest): Promise<Offer> {
    const response = await http.post<Offer>(BASE_URL, data);
    return response.data;
  },

  async getOffersByRequestId(requestId: number): Promise<Offer[]> {
    const response = await http.get<Offer[]>(`${BASE_URL}/service-requests/${requestId}`);
    return response.data;
  },

  async acceptOffer(offerId: number): Promise<Offer> {
    const response = await http.post<Offer>(`${BASE_URL}/${offerId}/accept`);
    return response.data;
  },

  async getMyOffers(params?: { status?: string }): Promise<Offer[]> {
    const response = await http.get<Offer[]>(`${BASE_URL}/my-requests`, { params });
    return response.data;
  },

  async getMyWorkshopOffers(params?: { status?: string }): Promise<Offer[]> {
    const response = await http.get<Offer[]>(`${BASE_URL}/my-workshop`, { params });
    return response.data;
  },
};