export type AreaStatus = 'draft' | 'pending' | 'pending_audit' | 'approved' | 'active' | 'rejected' | 'suspended';
export type BiomeType = 'amazonia' | 'cerrado' | 'mata_atlantica' | 'caatinga' | 'pampa' | 'pantanal';

export interface Area {
  id: string;
  ownerUserId: string;
  ownerEmail: string | null;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  biome: string | null;
  countryCode: string | null;
  state: string | null;
  city: string | null;
  status: AreaStatus;
  totalCapacityTCO2e: number;
  committedTCO2e: number;
  tCO2ePerTreePerYear: number;
  estimatedKgCO2PerTreePerYear: number;
  pricePerTree: number | null;
  defaultHorizonYears: number | null;
  pricePerTCO2e: number | null;
  maxPurchasableTrees?: number | null;
  thumbnailUrl?: string;
  imageUrl?: string;
  committedTreesCount?: number;
  plantedTreesCount?: number;
  totalCompensatedTreesCount?: number;
  auditNotes: string | null;
  auditedBy: string | null;
  auditedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AreaContribution {
  id: string;
  areaId: string;
  userId: string;
  userEmail: string;
  treesCount: number;
  totalTCO2e: number;
  totalAmount: number;
  currency: string;
  compensationMode: string;
  paidAt: string;
}

export interface AreaCriterion {
  id: string;
  areaId: string;
  criterionKey: string;
  criterionLabel: string;
  met: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AreaMedia {
  id: string;
  areaId: string;
  mediaType: 'photo' | 'video';
  description: string | null;
  mimeType: string;
  fileName: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export interface CreateAreaRequest {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  biome?: string;
  countryCode?: string;
  state?: string;
  city?: string;
  total_capacity_t_co2e?: number;
  t_co2e_per_tree_per_year?: number;
  price_per_tree?: number;
  default_horizon_years?: number;
  price_per_t_co2e?: number;
}

export interface UpdateAreaRequest {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  status?: AreaStatus;
  biome?: string;
  countryCode?: string;
  state?: string;
  city?: string;
  total_capacity_t_co2e?: number;
  t_co2e_per_tree_per_year?: number;
  price_per_tree?: number;
  default_horizon_years?: number;
  price_per_t_co2e?: number;
  max_purchasable_trees?: number | null;
}

export interface ApproveAreaRequest {
  criteria?: Array<{
    criterion_key: string;
    criterion_label: string;
    met: boolean;
    notes?: string;
  }>;
  notes?: string;
}

export interface AreaCapacity {
  totalCapacityTCO2e: number;
  committedTCO2e: number;
  availableTCO2e: number;
}
