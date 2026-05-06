import { api } from '@/lib/api-client';

export interface SatelliteImage {
  id: string;
  captureDate: string;
  cloudCover: number | null;
  sceneId: string;
  collection: string;
  isFallback: boolean;
  bboxWest: number;
  bboxSouth: number;
  bboxEast: number;
  bboxNorth: number;
  imageUrl: string;
  thumbnailUrl: string;
  createdAt: string;
}

export const satelliteService = {
  async fetchNewImage(areaId: string): Promise<SatelliteImage> {
    const raw = await api.post<{ data: SatelliteImage }>(
      `/areas/${areaId}/satellite-image`,
      {},
    );
    return raw.data;
  },

  async getLatest(areaId: string): Promise<SatelliteImage | null> {
    try {
      const raw = await api.get<{ data: SatelliteImage }>(
        `/areas/${areaId}/satellite-image/latest`,
      );
      return raw.data;
    } catch {
      return null;
    }
  },
};
