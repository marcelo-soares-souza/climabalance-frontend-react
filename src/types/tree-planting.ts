export interface PlantedTree {
  id: string;
  latitude: number;
  longitude: number;
  plantedAt: string;
}

export interface PendingTreeCount {
  totalCompensated: number;
  totalPlanted: number;
  pending: number;
}
