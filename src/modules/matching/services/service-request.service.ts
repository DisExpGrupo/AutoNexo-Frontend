import http from '@/lib/apiClient';

const BASE_URL = '/service-requests';

export type ServiceRequestStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface CreateServiceRequest {
  vehicleId: number;
  requestedServices: string[];
  description: string;
  latitude: number;
  longitude: number;
  searchRadiusKm: number;
}

export interface ServiceRequest {
  id: number;
  userId: number;
  vehicleId: number;
  requestedServices: string[];
  description: string;
  latitude: number;
  longitude: number;
  searchRadiusKm: number;
  status: ServiceRequestStatus;
  createdAt: string;
  cancelledAt: string | null;
}

export const serviceRequestService = {
  async createServiceRequest(data: CreateServiceRequest): Promise<ServiceRequest> {
    const response = await http.post<ServiceRequest>(`${BASE_URL}`, data);
    return response.data;
  },

  async getMyServiceRequests(status?: ServiceRequestStatus): Promise<ServiceRequest[]> {
    const params = status ? { status } : undefined;
    const response = await http.get<ServiceRequest[]>(`${BASE_URL}`, { params });
    return response.data;
  },

  async getServiceRequestById(id: number): Promise<ServiceRequest> {
    const response = await http.get<ServiceRequest>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async cancelServiceRequest(id: number): Promise<void> {
    await http.delete(`${BASE_URL}/${id}`);
  },
};