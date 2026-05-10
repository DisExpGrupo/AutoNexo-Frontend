export interface Brand {
  id: number;
  name: string;
  logoUrl: string | null;
  country: string;
  isActive: boolean;
  popular: boolean;
}

export interface VehicleModel {
  id: number;
  brandId: number;
  name: string;
  startYear: number;
  endYear: number | null;
  isActive: boolean;
}

export type ServiceCategory = 'MAINTENANCE' | 'BRAKES' | 'ENGINE' | 'TRANSMISSION' | 'SUSPENSION' | 'ELECTRICAL' | 'COOLING' | 'EXHAUST' | 'TIRES' | 'BODYWORK' | 'DIAGNOSTICS' | 'OTHER';

export interface Service {
  code: string;
  displayName: string;
  categoryDisplayName: string;
  description: string;
  category: ServiceCategory;
}

export type CapabilityTagCategory = 'VEHICLE_TYPE' | 'BRAND' | 'SPECIALIZATION' | 'SERVICE' | 'FACILITY';

export interface CapabilityTag {
  code: string;
  displayName: string;
  categoryDisplayName: string;
  category: CapabilityTagCategory;
}

export interface ServiceCategoryInfo {
  code: string;
  displayName: string;
}

export interface CapabilityTagCategoryInfo {
  code: string;
  displayName: string;
}