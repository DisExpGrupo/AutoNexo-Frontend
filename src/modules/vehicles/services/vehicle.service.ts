import http from '@/lib/apiClient';

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
    const response = await http.post<Vehicle>('/vehicles', data);
    return response.data;
  },
  
  async getMyVehicles(): Promise<Vehicle[]> {
    const response = await http.get<Vehicle[]>('/vehicles');
    return response.data;
  },
  
  async getVehicleById(id: number): Promise<Vehicle> {
    const response = await http.get<Vehicle>(`/vehicles/${id}`);
    return response.data;
  }
};