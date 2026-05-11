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

export interface WorkshopLocation {
  id: number;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude: number;
  longitude: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Lo que envías para crear (POST)
// Nota: Según tu curl, el backend no pide 'active' ni 'id' aquí
export interface CreateWorkshopLocationRequest {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude: number;
  longitude: number;
}

export type UpdateWorkshopLocationRequest = CreateWorkshopLocationRequest;

// Lo que enviamos al backend (POST)
export interface CreateServiceTemplateRequest {
  code: string;             // Ej: "MAINTENANCE" (Categoría)
  catalogService: string;   // Ej: "OIL_CHANGE" (Código del servicio)
  customName: string;       // Nombre personalizado del taller
  description: string;
  estimatedDurationMinutes: number;
  basePriceAmount: number;
  currency: string;         // Ej: "PEN" o "USD"
}

// Lo que recibimos del backend (GET)
export interface ServiceTemplate {
  id: number | null; // Aceptamos que puede venir nulo del POST
  code: string;
  catalogService: string;
  serviceCategory: string;
  customName: string;
  displayName: string;
  description: string;
  estimatedDurationMinutes: number;
  basePriceAmount: number;
  currency: string;
  active: boolean;
  linkedToCatalog: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export const workshopService = {
  async createWorkshop(data: CreateWorkshopRequest): Promise<Workshop> {
    const response = await http.post<Workshop>(`${BASE_URL}`, data);
    return response.data;
  },

  async getMyWorkshop(): Promise<Workshop> {
    const response = await http.get<Workshop>(`${BASE_URL}/my-workshop`);
    return response.data;
  },

  async getLocations(): Promise<WorkshopLocation[]> {
    const response = await http.get<WorkshopLocation[]>(`${BASE_URL}/my-workshop/locations`);
    return response.data;
  },

  async createLocation(data: CreateWorkshopLocationRequest): Promise<WorkshopLocation> {
    const response = await http.post<WorkshopLocation>(`${BASE_URL}/locations`, data);
    return response.data;
  },

  async deleteLocation(id: number): Promise<void> {
    await http.delete(`${BASE_URL}/my-workshop/locations/${id}`);
  },

  async getServiceTemplates(workshopId: number): Promise<ServiceTemplate[]> {
    const response = await http.get<ServiceTemplate[]>(`${BASE_URL}/${workshopId}/services`);
    return response.data;
  },

  async createServiceTemplate(data: CreateServiceTemplateRequest): Promise<ServiceTemplate> {
    const response = await http.post<ServiceTemplate>(`${BASE_URL}/service-templates`, data);
    return response.data;
  },

  async getPublicWorkshop(workshopId: number): Promise<any> {
    const response = await http.get<any>(`${BASE_URL}/${workshopId}/public`);
    return response.data;
  },
};