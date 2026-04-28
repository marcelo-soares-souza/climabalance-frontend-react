import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { areasService } from "@/services/areas";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocateControl } from "@/components/leaflet/LocateControl";
import { MapLayerControl } from "@/components/leaflet/MapLayerControl";
import { OSM_URL, OSM_ATTR, SATELLITE_URL, SATELLITE_ATTR } from "@/components/leaflet/map-layers";
import { formatCurrency, formatKgCO2e } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCompensationStore } from "@/stores/compensation-store";
import { useAuth } from "@/hooks/use-auth";
import { TreePine, MapPin } from "lucide-react";
import type { Area } from "@/types/area";
import type { LeafletEvent } from "leaflet";

const BIOME_COLORS: Record<string, string> = {
  amazonia: "#2D6A4F",
  cerrado: "#D4A373",
  mata_atlantica: "#40916C",
  caatinga: "#C9ADA7",
  pampa: "#95D5B2",
  pantanal: "#74C69D",
};

const BIOME_SYMBOLS: Record<string, string> = {
  amazonia: `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 7 10h3l-2 4h3v5h2v-5h3l-2-4h3L12 3Z" fill="white"/>
    </svg>
  `,
  cerrado: `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="9" r="4" fill="white"/>
      <path d="M6 19c1.8-2.3 4-3.5 6-3.5s4.2 1.2 6 3.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  mata_atlantica: `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6c-5.5.4-9.3 4-10.8 10.4 4.5-.7 8.3-4.2 10.8-10.4Z" fill="white"/>
      <path d="M8 17c2-1 4.4-3.4 6-6" stroke="${BIOME_COLORS.mata_atlantica}" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `,
  caatinga: `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M9 9v3M15 8v4M9 12c0-1.2-.8-2-2-2M15 11c0-1.2.8-2 2-2" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  pampa: `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 15c2.2-2.4 4.7-3.6 7-3.6S16.8 12.6 19 15" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <path d="M7 18c1.7-1.5 3.4-2.2 5-2.2s3.3.7 5 2.2" stroke="white" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,
  pantanal: `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4c-2.7 3.2-4 5.4-4 7.4a4 4 0 1 0 8 0c0-2-1.3-4.2-4-7.4Z" fill="white"/>
      <path d="M6 18c1.8-1.2 3.8-1.8 6-1.8s4.2.6 6 1.8" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  `,
};

function createIcon(biome: string) {
  const color = BIOME_COLORS[biome] || "#0B5F4B";
  const symbol = BIOME_SYMBOLS[biome] || BIOME_SYMBOLS.amazonia;
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      ${symbol}
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createClusterIcon(count: number) {
  const size = count >= 20 ? 46 : count >= 10 ? 42 : 38;
  return L.divIcon({
    className: "",
    html: `<div style="background:#0B5F4B;width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const r = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

function clusterRadiusMeters(zoom: number): number {
  return Math.max(80, Math.min(10000, 220000 / 2 ** zoom));
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
      (cluster) =>
        haversineMeters(
          area.latitude,
          area.longitude,
          cluster.latitude,
          cluster.longitude,
        ) <= radius,
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
    target.latitude = (target.latitude * (total - 1) + area.latitude) / total;
    target.longitude =
      (target.longitude * (total - 1) + area.longitude) / total;
  }

  return clusters;
}

function MapZoomListener({
  onZoomChange,
}: {
  onZoomChange: (zoom: number) => void;
}) {
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
  t,
  navigate,
  onSelectArea,
}: {
  cluster: AreaCluster;
  t: (key: string, options?: Record<string, unknown>) => string;
  navigate: (path: string) => void;
  onSelectArea: (area: Area) => void;
}) {
  const map = useMap();

  if (cluster.areas.length === 1) {
    const area = cluster.areas[0];
    if (!area) return null;

    return (
      <Marker
        position={[area.latitude, area.longitude]}
        icon={createIcon(area.biome || "")}
      >
        <Popup>
          <div className="min-w-[220px]">
            {area.thumbnailUrl && (
              <img
                src={area.thumbnailUrl}
                alt=""
                className="w-full h-28 object-cover rounded-t-md -mt-1 -mx-1 mb-2"
                style={{ width: "calc(100% + 8px)" }}
              />
            )}
            <h3 className="font-semibold text-lg mb-1.5 leading-tight">
              {area.name}
            </h3>
            <div className="space-y-1.5">
              {area.biome && (
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: BIOME_COLORS[area.biome] || "#0B5F4B" }}
                >
                  <span dangerouslySetInnerHTML={{ __html: BIOME_SYMBOLS[area.biome] || "" }} />
                  {t(`map.biomes.${area.biome}`, { defaultValue: area.biome })}
                </span>
              )}
              {area.city && area.state && (
                <p className="text-text-secondary text-sm">
                  <MapPin className="h-3.5 w-3.5 inline" /> {area.city},{" "}
                  {area.state}
                </p>
              )}
              {area.description && (
                <p className="text-sm text-text-secondary line-clamp-4">
                  {area.description}
                </p>
              )}
              <div className="flex gap-4 pt-1.5">
                {area.pricePerTree != null && (
                  <p className="text-sm">
                    <span className="text-text-secondary">{t("area.form.pricePerTree")}:</span>{" "}
                    <span className="font-medium">{formatCurrency(area.pricePerTree)}</span>
                  </p>
                )}
                <p className="text-sm">
                  <span className="text-text-secondary">
                    {t("compensation.review.estimatedCO2")}:
                  </span>{" "}
                  <span className="font-medium">{formatKgCO2e(area.estimatedKgCO2PerTreePerYear)}</span>
                </p>
              </div>
              {(area.plantedTreesCount ?? 0) > 0 || (area.totalCompensatedTreesCount ?? 0) > 0 ? (
                <p className="text-sm">
                  <TreePine className="h-3.5 w-3.5 inline mr-0.5" />
                  <span className="font-medium">
                    {area.plantedTreesCount?.toLocaleString() ?? 0}
                    {(area.totalCompensatedTreesCount ?? 0) > 0 && (
                      <span className="text-text-secondary font-normal">
                        /{area.totalCompensatedTreesCount!.toLocaleString()}
                      </span>
                    )}
                  </span>{" "}
                  <span className="text-text-secondary">{t("map.treesPlanted")}</span>
                </p>
              ) : null}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/areas/${area.id}`)}
              >
                {t("map.viewDetails")}
              </Button>
              <Button size="sm" onClick={() => onSelectArea(area)}>
                <TreePine className="h-3 w-3 mr-1" /> {t("map.compensate")}
              </Button>
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
          map.setView(
            [cluster.latitude, cluster.longitude],
            Math.min(map.getZoom() + 2, 18),
          );
        },
      }}
    >
      <Popup>
        <div className="min-w-[260px]">
          <p className="font-semibold mb-2">
            {t("map.areasCount", { count: cluster.areas.length })}
          </p>
          <div className="space-y-2 max-h-60 overflow-auto pr-1">
            {preview.map((area) => (
              <div
                key={area.id}
                className="border border-gray-100 rounded-md p-2 flex gap-2"
              >
                {area.thumbnailUrl && (
                  <img
                    src={area.thumbnailUrl}
                    alt=""
                    className="w-12 h-12 rounded object-cover shrink-0 mt-0.5"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{area.name}</p>
                  {area.description && (
                    <p className="text-xs text-text-secondary truncate">{area.description}</p>
                  )}
                  <div className="flex gap-2 text-xs text-text-secondary">
                    {area.pricePerTree != null && (
                      <span>{formatCurrency(area.pricePerTree)}</span>
                    )}
                    <span>{formatKgCO2e(area.estimatedKgCO2PerTreePerYear)}</span>
                    {area.committedTreesCount != null && (
                      <span>{area.committedTreesCount.toLocaleString()} {t("area.trees")}</span>
                    )}
                  </div>
                  <div className="mt-1 flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/areas/${area.id}`)}
                    >
                      {t("map.viewDetails")}
                    </Button>
                    <Button size="sm" onClick={() => onSelectArea(area)}>
                      <TreePine className="h-3 w-3 mr-1" />{" "}
                      {t("map.compensate")}
                    </Button>
                  </div>
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
  const [biomeFilter, setBiomeFilter] = useState("");
  const [mapZoom, setMapZoom] = useState(3);
  const [satellite, setSatellite] = useState(false);
  const requestedCalculationId =
    searchParams.get("calculationId")?.trim() || null;
  const requestedTCO2eRaw = searchParams.get("tCO2e");
  const requestedTCO2eParsed =
    requestedTCO2eRaw == null ? NaN : Number(requestedTCO2eRaw);
  const requestedTCO2e =
    Number.isFinite(requestedTCO2eParsed) && requestedTCO2eParsed > 0
      ? requestedTCO2eParsed
      : null;
  const hasProjectionContext = !!requestedCalculationId && !!requestedTCO2e;
  const effectiveCalculationId = hasProjectionContext
    ? requestedCalculationId
    : null;
  const selectedTotalTCO2e = hasProjectionContext ? requestedTCO2e : null;

  const { data: areas, isLoading } = useQuery({
    queryKey: ["map-areas", { biome: biomeFilter }],
    queryFn: () =>
      areasService.getMapAreas(
        biomeFilter ? { biome: biomeFilter } : undefined,
      ),
  });

  useEffect(() => {
    if (!requestedCalculationId || !requestedTCO2e) return;
    setSelection({
      calculationId: requestedCalculationId,
      totalTCO2e: requestedTCO2e,
    });
  }, [requestedCalculationId, requestedTCO2e, setSelection]);

  const biomeOptions = [
    { value: "", label: t("map.allBiomes") },
    { value: "amazonia", label: t("map.biomes.amazonia") },
    { value: "cerrado", label: t("map.biomes.cerrado") },
    { value: "mata_atlantica", label: t("map.biomes.mataAtlantica") },
    { value: "caatinga", label: t("map.biomes.caatinga") },
    { value: "pampa", label: t("map.biomes.pampa") },
    { value: "pantanal", label: t("map.biomes.pantanal") },
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

  const clusters = useMemo(
    () => buildClusters(visibleAreas, mapZoom),
    [visibleAreas, mapZoom],
  );

  const handleSelectArea = (area: Area) => {
    setSelection({
      areaId: area.id,
      areaName: area.name,
      calculationId: effectiveCalculationId,
      compensationMode: "tree_purchase",
      totalTCO2e: selectedTotalTCO2e,
      treesRequested: null,
      totalAmount: null,
    });
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/compensation/review" } });
      return;
    }
    navigate("/compensation/review");
  };

  const handleZoomChange = useCallback((zoom: number) => {
    setMapZoom(zoom);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t("map.title")}</h1>
        <div className="w-48">
          <Select
            options={biomeOptions}
            value={biomeFilter}
            onChange={(e) => setBiomeFilter(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="h-[calc(100vh-220px)] min-h-[400px] relative">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <MapContainer center={center} zoom={3} className="h-full w-full">
              <MapZoomListener onZoomChange={handleZoomChange} />
              <LocateControl title={t("map.locate.title")} />
              <MapLayerControl
                satellite={satellite}
                onToggle={() => setSatellite((s) => !s)}
              />
              <TileLayer
                attribution={satellite ? SATELLITE_ATTR : OSM_ATTR}
                url={satellite ? SATELLITE_URL : OSM_URL}
              />
              {clusters.map((cluster) => (
                <ClusterMarker
                  key={cluster.id}
                  cluster={cluster}
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
        <p className="text-sm text-text-secondary">
          {t("map.areasCount", { count: visibleAreas.length })}
        </p>
      )}
    </div>
  );
}
