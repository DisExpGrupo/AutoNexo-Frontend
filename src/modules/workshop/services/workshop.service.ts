import http from '@/lib/apiClient';

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
    const response = await http.post<Workshop>('/workshops', data);
    return response.data;
  },

  async getMyWorkshop(): Promise<Workshop> {
    const response = await http.get<Workshop>('/workshops/my-workshop');
    return response.data;
  }
};