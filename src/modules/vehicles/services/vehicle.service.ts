import http from '@/lib/apiClient';

const BASE_URL = '/v1/vehicles';

export interface CreateVehicleRequest {
  brandId: number;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color: string;
  initialMileage: number;
}

export interface Vehicle {
  id: number;
  brandId: number;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  color: string;
  currentMileage: number;
  imageUrls: string[];
  active: boolean;
  primaryOwnerId: number;
}

export const vehicleService = {
  async createVehicle(data: CreateVehicleRequest): Promise<Vehicle> {
    const response = await http.post<Vehicle>(`${BASE_URL}`, data);
    return response.data;
  },
  
  async getMyVehicles(): Promise<Vehicle[]> {
    const response = await http.get<Vehicle[]>(`${BASE_URL}`);
    return response.data;
  },
  
  async getVehicleById(id: number): Promise<Vehicle> {
    const response = await http.get<Vehicle>(`${BASE_URL}/${id}`);
    return response.data;
  }
};