import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { areasService } from '@/services/areas';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LocateControl } from '@/components/leaflet/LocateControl';
import { formatTCO2e } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCompensationStore } from '@/stores/compensation-store';
import { useAuth } from '@/hooks/use-auth';
import { TreePine, MapPin } from 'lucide-react';
import type { Area } from '@/types/area';
import type { LeafletEvent } from 'leaflet';

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

function createClusterIcon(count: number) {
  const size = count >= 20 ? 46 : count >= 10 ? 42 : 38;
  return L.divIcon({
    className: '',
    html: `<div style="background:#0B5F4B;width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const r = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

function clusterRadiusMeters(zoom: number): number {
  return Math.max(80, Math.min(10000, 220000 / (2 ** zoom)));
}

type AreaCluster = {
  id: string;
  latitude: number;
  longitude: number;
  areas: Area[];
};

function buildClusters(areas: Area[], zoom: number): AreaCluster[] {
  const radius = clusterRadiusMeters(zoom);
  const clusters: AreaCluster[] = [];

  for (const area of areas) {
    const target = clusters.find(
      (cluster) => haversineMeters(area.latitude, area.longitude, cluster.latitude, cluster.longitude) <= radius
    );

    if (!target) {
      clusters.push({
        id: area.id,
        latitude: area.latitude,
        longitude: area.longitude,
        areas: [area],
      });
      continue;
    }

    target.areas.push(area);
    const total = target.areas.length;
    target.latitude = ((target.latitude * (total - 1)) + area.latitude) / total;
    target.longitude = ((target.longitude * (total - 1)) + area.longitude) / total;
  }

  return clusters;
}

function MapZoomListener({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: (event: LeafletEvent) => {
      const target = event.target as L.Map;
      onZoomChange(target.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

function ClusterMarker({
  cluster,
  isAuthenticated,
  t,
  navigate,
  onSelectArea,
}: {
  cluster: AreaCluster;
  isAuthenticated: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  navigate: (path: string) => void;
  onSelectArea: (area: Area) => void;
}) {
  const map = useMap();

  if (cluster.areas.length === 1) {
    const area = cluster.areas[0];
    if (!area) return null;

    return (
      <Marker position={[area.latitude, area.longitude]} icon={createIcon(area.biome || '')}>
        <Popup>
          <div className="min-w-[200px]">
            <h3 className="font-semibold text-base mb-1">{area.name}</h3>
            <div className="space-y-1 text-sm">
              {area.biome && <p><span className="text-text-secondary">{t('map.biome')}:</span> {t(`map.biomes.${area.biome}`, { defaultValue: area.biome })}</p>}
              {area.city && area.state && <p><MapPin className="h-3 w-3 inline" /> {area.city}, {area.state}</p>}
              <p><span className="text-text-secondary">{t('map.capacity')}:</span> {formatTCO2e(area.totalCapacityTCO2e)}</p>
              <p><span className="text-text-secondary">{t('map.available')}:</span> {formatTCO2e(area.totalCapacityTCO2e - area.committedTCO2e)}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate(`/areas/${area.id}`)}>{t('map.viewDetails')}</Button>
              {isAuthenticated && (
                <Button size="sm" onClick={() => onSelectArea(area)}>
                  <TreePine className="h-3 w-3 mr-1" /> {t('map.compensate')}
                </Button>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }

  const preview = cluster.areas.slice(0, 8);
  const remaining = cluster.areas.length - preview.length;

  return (
    <Marker
      position={[cluster.latitude, cluster.longitude]}
      icon={createClusterIcon(cluster.areas.length)}
      eventHandlers={{
        click: () => {
          map.setView([cluster.latitude, cluster.longitude], Math.min(map.getZoom() + 2, 18));
        },
      }}
    >
      <Popup>
        <div className="min-w-[240px]">
          <p className="font-semibold mb-2">
            {t('map.areasCount', { count: cluster.areas.length })}
          </p>
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {preview.map((area) => (
              <div key={area.id} className="border border-gray-100 rounded-md p-2">
                <p className="font-medium text-sm">{area.name}</p>
                <p className="text-xs text-text-secondary">
                  {t('map.available')}: {formatTCO2e(area.totalCapacityTCO2e - area.committedTCO2e)}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/areas/${area.id}`)}>
                    {t('map.viewDetails')}
                  </Button>
                  {isAuthenticated && (
                    <Button size="sm" onClick={() => onSelectArea(area)}>
                      <TreePine className="h-3 w-3 mr-1" /> {t('map.compensate')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {remaining > 0 && (
              <p className="text-xs text-text-secondary">+ {remaining}</p>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export function MapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const setSelection = useCompensationStore((s) => s.setSelection);
  const [biomeFilter, setBiomeFilter] = useState('');
  const [mapZoom, setMapZoom] = useState(5);
  const requestedCalculationId = searchParams.get('calculationId')?.trim() || null;
  const requestedTCO2eRaw = searchParams.get('tCO2e');
  const requestedTCO2eParsed = requestedTCO2eRaw == null ? NaN : Number(requestedTCO2eRaw);
  const requestedTCO2e = Number.isFinite(requestedTCO2eParsed) && requestedTCO2eParsed > 0
    ? requestedTCO2eParsed
    : null;
  const hasProjectionContext = !!requestedCalculationId && !!requestedTCO2e;
  const effectiveCalculationId = hasProjectionContext ? requestedCalculationId : null;
  const selectedTotalTCO2e = hasProjectionContext ? requestedTCO2e : null;

  const { data: areas, isLoading } = useQuery({
    queryKey: ['map-areas', { biome: biomeFilter }],
    queryFn: () => areasService.getMapAreas(biomeFilter ? { biome: biomeFilter } : undefined),
  });

  useEffect(() => {
    if (!requestedCalculationId || !requestedTCO2e) return;
    setSelection({
      calculationId: requestedCalculationId,
      totalTCO2e: requestedTCO2e,
    });
  }, [requestedCalculationId, requestedTCO2e, setSelection]);

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

  const visibleAreas = useMemo(() => {
    return areas ?? [];
  }, [areas]);

  const clusters = useMemo(() => buildClusters(visibleAreas, mapZoom), [visibleAreas, mapZoom]);

  const handleSelectArea = (area: Area) => {
    if (effectiveCalculationId && selectedTotalTCO2e) {
      setSelection({
        areaId: area.id,
        areaName: area.name,
        calculationId: effectiveCalculationId,
        compensationMode: 'tco2e',
        totalTCO2e: selectedTotalTCO2e,
        treesRequested: null,
        totalAmount: null,
      });
    } else {
      setSelection({
        areaId: area.id,
        areaName: area.name,
        calculationId: null,
        compensationMode: 'tree_purchase',
        totalTCO2e: null,
        treesRequested: null,
        totalAmount: null,
      });
    }
    navigate('/compensation/review');
  };

  const handleZoomChange = useCallback((zoom: number) => {
    setMapZoom(zoom);
  }, []);

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
              <MapZoomListener onZoomChange={handleZoomChange} />
              <LocateControl title={t('map.locate.title')} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {clusters.map((cluster) => (
                <ClusterMarker
                  key={cluster.id}
                  cluster={cluster}
                  isAuthenticated={isAuthenticated}
                  t={t}
                  navigate={navigate}
                  onSelectArea={handleSelectArea}
                />
              ))}
            </MapContainer>
          )}
        </div>
      </Card>

      {areas && (
        <p className="text-sm text-text-secondary">{t('map.areasCount', { count: visibleAreas.length })}</p>
      )}
    </div>
  );
}
