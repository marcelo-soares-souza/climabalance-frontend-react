import { ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import type { SatelliteImage } from '@/services/satellite';

type Props = {
  image: SatelliteImage;
  opacity?: number;
};

export function SatelliteImageOverlay({ image, opacity = 0.85 }: Props) {
  const bounds = L.latLngBounds(
    [image.bboxSouth, image.bboxWest],
    [image.bboxNorth, image.bboxEast],
  );

  return (
    <ImageOverlay
      url={image.imageUrl}
      bounds={bounds}
      opacity={opacity}
    />
  );
}
