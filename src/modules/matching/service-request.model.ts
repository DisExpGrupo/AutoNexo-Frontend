export interface CreateServiceRequest {
  vehicleId: number;
  requestedServices: string[]; // Ej: ["OIL_CHANGE"]
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
  status: 'PENDING' | 'CANCELLED' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  cancelledAt: string | null;
}