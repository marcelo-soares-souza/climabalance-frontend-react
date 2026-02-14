import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { areasService } from '@/services/areas';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatTCO2e } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCompensationStore } from '@/stores/compensation-store';
import { useAuth } from '@/hooks/use-auth';
import { TreePine, MapPin } from 'lucide-react';

const BIOME_COLORS: Record<string, string> = {
  amazonia: '#2D6A4F',
  cerrado: '#D4A373',
  mata_atlantica: '#40916C',
  caatinga: '#C9ADA7',
  pampa: '#95D5B2',
  pantanal: '#74C69D',
};

function createIcon(biome: string) {
  const color = BIOME_COLORS[biome] || '#0B5F4B';
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L8 8h3v4H8l4 6 4-6h-3V8h3L12 2z"/></svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function MapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const setSelection = useCompensationStore((s) => s.setSelection);
  const [biomeFilter, setBiomeFilter] = useState('');

  const { data: areas, isLoading } = useQuery({
    queryKey: ['map-areas', { biome: biomeFilter }],
    queryFn: () => areasService.getMapAreas(biomeFilter ? { biome: biomeFilter } : undefined),
  });

  const biomeOptions = [
    { value: '', label: t('map.allBiomes') },
    { value: 'amazonia', label: t('map.biomes.amazonia') },
    { value: 'cerrado', label: t('map.biomes.cerrado') },
    { value: 'mata_atlantica', label: t('map.biomes.mataAtlantica') },
    { value: 'caatinga', label: t('map.biomes.caatinga') },
    { value: 'pampa', label: t('map.biomes.pampa') },
    { value: 'pantanal', label: t('map.biomes.pantanal') },
  ];

  const center = useMemo(() => {
    if (areas && areas.length > 0) {
      const lat = areas.reduce((s, a) => s + a.latitude, 0) / areas.length;
      const lng = areas.reduce((s, a) => s + a.longitude, 0) / areas.length;
      return [lat, lng] as [number, number];
    }
    return [-14.235, -51.9253] as [number, number];
  }, [areas]);

  const handleSelectArea = (area: typeof areas extends (infer T)[] | undefined ? T : never) => {
    setSelection({ areaId: area.id, areaName: area.name });
    navigate(`/areas/${area.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('map.title')}</h1>
        <div className="w-48">
          <Select options={biomeOptions} value={biomeFilter} onChange={(e) => setBiomeFilter(e.target.value)} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="h-[calc(100vh-220px)] min-h-[400px] relative">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <MapContainer center={center} zoom={5} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {areas?.map((area) => (
                <Marker key={area.id} position={[area.latitude, area.longitude]} icon={createIcon(area.biome || '')}>
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-semibold text-base mb-1">{area.name}</h3>
                      <div className="space-y-1 text-sm">
                        {area.biome && <p><span className="text-text-secondary">{t('map.biome')}:</span> {t(`map.biomes.${area.biome}`, area.biome)}</p>}
                        {area.city && area.state && <p><MapPin className="h-3 w-3 inline" /> {area.city}, {area.state}</p>}
                        <p><span className="text-text-secondary">{t('map.capacity')}:</span> {formatTCO2e(area.totalCapacityTCO2e)}</p>
                        <p><span className="text-text-secondary">{t('map.available')}:</span> {formatTCO2e(area.totalCapacityTCO2e - area.committedTCO2e)}</p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/areas/${area.id}`)}>{t('map.viewDetails')}</Button>
                        {isAuthenticated && (
                          <Button size="sm" onClick={() => handleSelectArea(area)}>
                            <TreePine className="h-3 w-3 mr-1" /> {t('map.compensate')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </Card>

      {areas && (
        <p className="text-sm text-text-secondary">{t('map.areasCount', { count: areas.length })}</p>
      )}
    </div>
  );
}
