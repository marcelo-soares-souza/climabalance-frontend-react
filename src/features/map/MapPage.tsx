import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { areasService } from "@/services/areas";
import { Combobox } from "@/components/ui/Combobox";
import { Card } from "@/components/ui/Card";
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
import { countries } from "@/lib/countries";
import type { Area } from "@/types/area";
import { getAreaDetailPath } from "@/lib/public-refs";

const countryOptions = countries.map((c) => ({ value: c.code, label: c.name }));

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

  const center = useMemo(() => {
    if (filteredAreas && filteredAreas.length > 0) {
      const lat =
        filteredAreas.reduce((s, a) => s + a.latitude, 0) /
        filteredAreas.length;
      const lng =
        filteredAreas.reduce((s, a) => s + a.longitude, 0) /
        filteredAreas.length;
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
                <AreaMarkers
                  areas={filteredAreas}
                  t={t}
                  onSelectArea={handleSelectArea}
                  onNavigateToArea={handleNavigateToArea}
                />
              </MapContainer>
            )}
          </div>
        </Card>

        {filteredAreas && (
          <p className="text-sm text-text-secondary">
            {t("map.areasCount", { count: filteredAreas.length })}
          </p>
        )}
      </div>
    </>
  );
}
