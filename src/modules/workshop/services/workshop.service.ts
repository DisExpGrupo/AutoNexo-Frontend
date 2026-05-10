import http from '@/lib/apiClient';

const BASE_URL = '/v1/workshops';

export interface CreateWorkshopRequest {
  ownerUserId: number;
  name: string;
  shortDescription: string;
  legalName: string;
  ruc: string;
}

export interface Workshop {
  id: number;
  ownerUserId: number;
  name: string;
  shortDescription: string;
  legalName: string;
  ruc: string;
  rucVerified: boolean;
  trustScore: number | null;
  active: boolean;
  logoUrl: string | null;
  photoUrls: string[];
  capabilityTags: any[];
  createdAt: string;
  updatedAt: string;
}

export const workshopService = {
  async createWorkshop(data: CreateWorkshopRequest): Promise<Workshop> {
    const response = await http.post<Workshop>(`${BASE_URL}`, data);
    return response.data;
  },

  async getMyWorkshop(): Promise<Workshop> {
    const response = await http.get<Workshop>(`${BASE_URL}/my-workshop`);
    return response.data;
  }
};