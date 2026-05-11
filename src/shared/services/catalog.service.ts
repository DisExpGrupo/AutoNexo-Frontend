import http from '@/lib/apiClient';
import type {
  Brand,
  VehicleModel,
  Service,
  CapabilityTag,
  ServiceCategoryInfo,
  CapabilityTagCategoryInfo,
} from '@/shared/models/catalog.model';

const BASE_URL = '/v1/catalog';

export const catalogService = {
  async getBrands(popularOnly = false): Promise<Brand[]> {
    const response = await http.get<Brand[]>(`${BASE_URL}/brands`, {
      params: { popularOnly },
    });
    return response.data;
  },

  async getModelsByBrand(brandId: number): Promise<VehicleModel[]> {
    const response = await http.get<VehicleModel[]>(`${BASE_URL}/brands/${brandId}/models`);
    return response.data;
  },

  async getServices(category?: string): Promise<Service[]> {
    const response = await http.get<Service[]>(`${BASE_URL}/services`, {
      params: category ? { category } : undefined,
    });
    return response.data;
  },

  async getServiceCategories(): Promise<ServiceCategoryInfo[]> {
    const response = await http.get<ServiceCategoryInfo[]>(`${BASE_URL}/services/categories`);
    return response.data;
  },

  async getCapabilityTags(category?: string): Promise<CapabilityTag[]> {
    const response = await http.get<CapabilityTag[]>(`${BASE_URL}/capability-tags`, {
      params: category ? { category } : undefined,
    });
    return response.data;
  },

  async getCapabilityTagCategories(): Promise<CapabilityTagCategoryInfo[]> {
    const response = await http.get<CapabilityTagCategoryInfo[]>(`${BASE_URL}/capability-tags/categories`);
    return response.data;
  },
};