import http from '@/lib/apiClient';
import type {
  Brand,
  VehicleModel,
  Service,
  CapabilityTag,
  ServiceCategoryInfo,
  CapabilityTagCategoryInfo,
} from '@/shared/models/catalog.model';

export const catalogService = {
  async getBrands(popularOnly = false): Promise<Brand[]> {
    const response = await http.get<Brand[]>('/catalog/brands', {
      params: { popularOnly },
    });
    return response.data;
  },

  async getModelsByBrand(brandId: number): Promise<VehicleModel[]> {
    const response = await http.get<VehicleModel[]>(`/catalog/brands/${brandId}/models`);
    return response.data;
  },

  async getServices(category?: string): Promise<Service[]> {
    const response = await http.get<Service[]>('/catalog/services', {
      params: category ? { category } : undefined,
    });
    return response.data;
  },

  async getServiceCategories(): Promise<ServiceCategoryInfo[]> {
    const response = await http.get<ServiceCategoryInfo[]>('/catalog/services/categories');
    return response.data;
  },

  async getCapabilityTags(category?: string): Promise<CapabilityTag[]> {
    const response = await http.get<CapabilityTag[]>('/catalog/capability-tags', {
      params: category ? { category } : undefined,
    });
    return response.data;
  },

  async getCapabilityTagCategories(): Promise<CapabilityTagCategoryInfo[]> {
    const response = await http.get<CapabilityTagCategoryInfo[]>('/catalog/capability-tags/categories');
    return response.data;
  },
};