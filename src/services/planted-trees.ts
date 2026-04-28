import { api } from '@/lib/api-client';
import type { PlantedTree, PendingTreeCount } from '@/types/tree-planting';

export const plantedTreesService = {
  getPlantedTrees(areaId: string) {
    return api.get<PlantedTree[]>(`/areas/${areaId}/planted-trees`);
  },

  getPendingTreeCount(areaId: string) {
    return api.get<PendingTreeCount>(`/areas/${areaId}/pending-tree-count`);
  },

  savePlantedTrees(areaId: string, points: { latitude: number; longitude: number }[]) {
    return api.post<void>(`/areas/${areaId}/planted-trees`, { points });
  },

  clearPlantedTrees(areaId: string) {
    return api.delete<void>(`/areas/${areaId}/planted-trees`);
  },
};
