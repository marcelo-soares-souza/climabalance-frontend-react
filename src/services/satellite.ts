import { api } from "@/lib/api-client";

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
    return api.post<SatelliteImage>(`/areas/${areaId}/satellite-image`, {});
  },

  async getLatest(areaId: string): Promise<SatelliteImage | null> {
    try {
      return await api.get<SatelliteImage>(
        `/areas/${areaId}/satellite-image/latest`,
      );
    } catch {
      return null;
    }
  },
};
