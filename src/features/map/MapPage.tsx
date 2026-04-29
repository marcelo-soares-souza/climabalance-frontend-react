import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { areasService } from "@/services/areas";
import { Combobox } from "@/components/ui/Combobox";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocateControl } from "@/components/leaflet/LocateControl";
import { MapLayerControl } from "@/components/leaflet/MapLayerControl";
import { OSM_URL, OSM_ATTR, SATELLITE_URL, SATELLITE_ATTR } from "@/components/leaflet/map-layers";
import { formatCurrency, formatKgCO2e, formatNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCompensationStore } from "@/stores/compensation-store";
import { useAuth } from "@/hooks/use-auth";
import { countries, getCountryName } from "@/lib/countries";
import { MapPin, TreePine, Sprout } from "lucide-react";
import type { Area } from "@/types/area";

const countryOptions = countries.map((c) => ({ value: c.code, label: c.name }));

const DEFAULT_ICON = L.divIcon({
  className: "",
  html: '<div style="background:#0B5F4B;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3 7 10h3l-2 4h3v5h2v-5h3l-2-4h3L12 3Z" fill="white"/></svg></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const CLUSTER_ICON = (count: number) =>
  L.divIcon({
    className: "",
    html: `<div style="background:#0B5F4B;width:38px;height:38px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;">${count}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });

function haversineMeters(
  aLat: number, aLng: number,
  bLat: number, bLng: number,
): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const a =
    sinDLat * sinDLat +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CLUSTER_RADIUS_METERS = 120_000;

interface AreaCluster {
  id: string;
  areas: Area[];
  latitude: number;
  longitude: number;
}

function buildClusters(areas: Area[]): AreaCluster[] {
  const clusters: AreaCluster[] = [];

  for (const area of areas) {
    let added = false;
    for (const cluster of clusters) {
      const dist = haversineMeters(
        area.latitude, area.longitude,
        cluster.latitude, cluster.longitude,
      );
      if (dist <= CLUSTER_RADIUS_METERS) {
        cluster.areas.push(area);
        added = true;
        break;
      }
    }
    if (!added) {
      clusters.push({
        id: area.id,
        areas: [area],
        latitude: area.latitude,
        longitude: area.longitude,
      });
    }
  }

  for (const cluster of clusters) {
    if (cluster.areas.length > 1) {
      const avgLat =
        cluster.areas.reduce((s, a) => s + a.latitude, 0) /
        cluster.areas.length;
      const avgLng =
        cluster.areas.reduce((s, a) => s + a.longitude, 0) /
        cluster.areas.length;
      cluster.latitude = avgLat;
      cluster.longitude = avgLng;
    }
  }

  return clusters;
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
  if (cluster.areas.length === 1) {
    const area = cluster.areas[0];

    return (
      <Marker
        position={[area.latitude, area.longitude]}
        icon={DEFAULT_ICON}
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
              <p className="text-text-secondary text-sm">
                <MapPin className="h-3.5 w-3.5 inline" />{" "}
                {[area.city, area.state, getCountryName(area.countryCode ?? "")].filter(Boolean).join(", ") || "-"}
              </p>
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
              {(area.plantedTreesCount != null || area.totalCompensatedTreesCount != null) && (
                <div className="flex gap-3 pt-1 text-xs text-text-secondary">
                  {area.plantedTreesCount != null && (
                    <span className="flex items-center gap-1">
                      <TreePine className="h-3 w-3" />
                      {t("map.treesPlanted")}: {formatNumber(area.plantedTreesCount, "pt-BR", 0)}
                    </span>
                  )}
                  {area.totalCompensatedTreesCount != null && (
                    <span className="flex items-center gap-1">
                      <Sprout className="h-3 w-3" />
                      {t("map.treesCompensated")}: {formatNumber(area.totalCompensatedTreesCount, "pt-BR", 0)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/areas/${area.id}`)}
              >
                {t("common.details")}
              </Button>
              <Button
                size="sm"
                onClick={() => onSelectArea(area)}
              >
                {t("map.compensate")}
              </Button>
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }

  return (
    <Marker
      position={[cluster.latitude, cluster.longitude]}
      icon={CLUSTER_ICON(cluster.areas.length)}
    >
      <Popup>
        <div className="space-y-2">
          <p className="font-semibold text-sm">
            {t("map.areasCount", { count: cluster.areas.length })}
          </p>
          <div className="space-y-1.5">
            {cluster.areas.map((area) => (
              <button
                key={area.id}
                type="button"
                className="block w-full text-left text-sm text-primary hover:underline"
                onClick={() => navigate(`/areas/${area.id}`)}
              >
                {area.name}
              </button>
            ))}
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
  const [countryFilter, setCountryFilter] = useState("");
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
    queryKey: ["areas", "map", { country: countryFilter }],
    queryFn: () => areasService.getMapAreas(),
  });

  useEffect(() => {
    if (!requestedCalculationId || !requestedTCO2e) return;
    setSelection({
      calculationId: requestedCalculationId,
      totalTCO2e: requestedTCO2e,
    });
  }, [requestedCalculationId, requestedTCO2e, setSelection]);

  const filteredAreas = useMemo(() => {
    if (!areas) return [];
    if (!countryFilter) return areas;
    return areas.filter((a) => a.countryCode === countryFilter);
  }, [areas, countryFilter]);

  const visibleAreas = useMemo(() => {
    if (!filteredAreas) return [];
    return filteredAreas;
  }, [filteredAreas]);

  const clusters = useMemo(
    () => buildClusters(visibleAreas),
    [visibleAreas],
  );

  const center = useMemo(() => {
    if (filteredAreas && filteredAreas.length > 0) {
      const lat = filteredAreas.reduce((s, a) => s + a.latitude, 0) / filteredAreas.length;
      const lng = filteredAreas.reduce((s, a) => s + a.longitude, 0) / filteredAreas.length;
      return [lat, lng] as [number, number];
    }
    return [-14.235, -51.925] as [number, number];
  }, [filteredAreas]);

  const handleSelectArea = useCallback(
    (area: Area) => {
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
    },
    [setSelection, effectiveCalculationId, selectedTotalTCO2e, isAuthenticated, navigate],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t("map.title")}</h1>
        <div className="w-48">
          <Combobox
            id="map-country-filter"
            value={countryFilter}
            options={countryOptions}
            emptyLabel={t("map.allCountries")}
            placeholder={t("area.form.selectCountry")}
            onChange={(val) => setCountryFilter(val)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="h-[calc(100vh-220px)] min-h-[400px] relative">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <MapContainer center={center} zoom={3} className="h-full w-full">
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

      {filteredAreas && (
        <p className="text-sm text-text-secondary">
          {t("map.areasCount", { count: visibleAreas.length })}
        </p>
      )}
    </div>
  );
}


