export type ProfileType = 'individual' | 'legal_entity';
export type DataQuality = 'real' | 'estimated' | 'standard';
export type CalculationStatus = 'draft' | 'finalized';
export type InputCategory = 'energy' | 'fuel' | 'transport' | 'flights' | 'scope1' | 'scope2' | 'scope3';

export interface FootprintInput {
  category: InputCategory;
  unit: string;
  value: number;
  metadata?: Record<string, unknown> | null;
}

export interface FootprintInputDetail extends FootprintInput {
  id: string;
  calculationId: string;
  activityType: string;
  quantity: number;
  kgCO2e: number;
  metadata: Record<string, unknown> | null;
}

export interface BreakdownItem {
  category: string;
  totalKgCO2e: number;
  totalTCO2e: number;
  percentage: number;
}

export interface CalculationResult {
  id: string;
  userId?: string;
  profileType: ProfileType;
  periodStart: string;
  periodEnd: string;
  totalKgCO2e: number;
  totalTCO2e: number;
  status: CalculationStatus;
  dataQuality: DataQuality;
  factorsVersion: string;
  region?: string;
  breakdown: BreakdownItem[];
  createdAt: string;
  updatedAt: string;
}

export interface FootprintCalculation extends CalculationResult {
  inputs: FootprintInputDetail[];
}

export interface EmissionFactor {
  id: string;
  category: string;
  factor: number;
  unit: string;
  version: string;
  region: string;
}

export interface CompensationProjection {
  projectionId: string;
  calculationId: string;
  areaId: string;
  biome: string | null;
  totalTCO2e: number;
  treesNeeded: number;
  horizonYears: number;
  tCO2ePerTreePerYear: number;
}

export interface CreateCalculationRequest {
  profile_type: ProfileType;
  period_start: string;
  period_end: string;
  data_quality?: DataQuality;
  factors_version?: string;
  region?: string;
  inputs: FootprintInput[];
}

export interface UpdateCalculationRequest {
  period_start?: string;
  period_end?: string;
  inputs?: FootprintInput[];
}
