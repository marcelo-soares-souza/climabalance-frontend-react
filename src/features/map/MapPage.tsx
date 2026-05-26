import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { areasService } from "@/services/areas";
import { LocateControl } from "@/components/leaflet/LocateControl";
import { MapLayerControl } from "@/components/leaflet/MapLayerControl";
import { AreaMarkers } from "@/components/leaflet/AreaMarkers";
import {
  OSM_URL,
  OSM_ATTR,
  SATELLITE_URL,
  SATELLITE_ATTR,
} from "@/components/leaflet/map-layers";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCompensationStore } from "@/stores/compensation-store";
import { useAuth } from "@/hooks/use-auth";
import type { Area } from "@/types/area";
import { getAreaDetailPath } from "@/lib/public-refs";

const DEFAULT_CENTER: [number, number] = [15, 15];
const DEFAULT_ZOOM = 3.25;

export function MapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const setSelection = useCompensationStore((s) => s.setSelection);
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
    queryKey: ["areas", "map"],
    queryFn: () => areasService.getMapAreas(),
  });

  useEffect(() => {
    if (!requestedCalculationId || !requestedTCO2e) return;
    setSelection({
      calculationId: requestedCalculationId,
      totalTCO2e: requestedTCO2e,
    });
  }, [requestedCalculationId, requestedTCO2e, setSelection]);

  const center: [number, number] = DEFAULT_CENTER;

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
    [
      setSelection,
      effectiveCalculationId,
      selectedTotalTCO2e,
      isAuthenticated,
      navigate,
    ],
  );

  const handleNavigateToArea = useCallback(
    (area: Area) => {
      navigate(getAreaDetailPath(area));
    },
    [navigate],
  );

  return (
    <>
      <SEO title={t("seo.map.title")} description={t("seo.map.description")} />
      <div className="fixed top-[53px] left-0 right-0 bottom-0 z-0">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <MapContainer
            center={center}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
          >
            <LocateControl title={t("map.locate.title")} />
            <MapLayerControl
              satellite={satellite}
              onToggle={() => setSatellite((s) => !s)}
            />
            <TileLayer
              attribution={satellite ? SATELLITE_ATTR : OSM_ATTR}
              url={satellite ? SATELLITE_URL : OSM_URL}
            />
            <AreaMarkers
              areas={areas ?? []}
              t={t}
              onSelectArea={handleSelectArea}
              onNavigateToArea={handleNavigateToArea}
            />
          </MapContainer>
        )}
      </div>
    </>
  );
}
