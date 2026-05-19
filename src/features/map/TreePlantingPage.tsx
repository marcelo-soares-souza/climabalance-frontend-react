import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { areasService } from "@/services/areas";
import { plantedTreesService } from "@/services/planted-trees";
import {
  MapContainer,
  TileLayer,
  Marker,
  Rectangle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@/components/ui/Dialog";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { MapLayerControl } from "@/components/leaflet/MapLayerControl";
import {
  OSM_URL,
  OSM_ATTR,
  SATELLITE_URL,
  SATELLITE_ATTR,
} from "@/components/leaflet/map-layers";
import { getCountryName } from "@/lib/countries";
import {
  ArrowLeft,
  TreePine,
  Check,
  Trash2,
  MapPin,
  MousePointer2,
  Square,
} from "lucide-react";
import { getAreaDetailPath } from "@/lib/public-refs";

const treeIcon = L.divIcon({
  className: "",
  html: `<div style="background:#2D6A4F;width:26px;height:26px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 7 10h3l-2 4h3v5h2v-5h3l-2-4h3L12 3Z" fill="white"/>
    </svg>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const existingTreeIcon = L.divIcon({
  className: "",
  html: `<div style="background:#40916C;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 7 10h3l-2 4h3v5h2v-5h3l-2-4h3L12 3Z" fill="white"/>
    </svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface DrawingBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

function generateGridPoints(
  bounds: DrawingBounds,
  count: number,
): { latitude: number; longitude: number }[] {
  if (count <= 0) return [];

  const latSpan = bounds.maxLat - bounds.minLat;
  const lngSpan = bounds.maxLng - bounds.minLng;

  if (latSpan < 0.00001 || lngSpan < 0.00001) return [];

  const aspectRatio = latSpan > 0 ? lngSpan / latSpan : 1;
  const cols = Math.max(1, Math.round(Math.sqrt(count * aspectRatio)));
  const rows = Math.max(1, Math.ceil(count / cols));

  const cellLat = latSpan / rows;
  const cellLng = lngSpan / cols;
  const points: { latitude: number; longitude: number }[] = [];

  for (let r = 0; r < rows && points.length < count; r++) {
    for (let c = 0; c < cols && points.length < count; c++) {
      const lat =
        bounds.minLat +
        cellLat * (r + 0.5) +
        (Math.random() - 0.5) * cellLat * 0.6;
      const lng =
        bounds.minLng +
        cellLng * (c + 0.5) +
        (Math.random() - 0.5) * cellLng * 0.6;
      points.push({ latitude: lat, longitude: lng });
    }
  }

  return points;
}

function AreaDrawHandler({
  areaMode,
  maxPoints,
  currentCount,
  onAreaSelected,
}: {
  areaMode: boolean;
  maxPoints: number;
  currentCount: number;
  onAreaSelected: (bounds: DrawingBounds) => void;
}) {
  const map = useMap();
  const drawingRef = useRef(false);
  const startRef = useRef<[number, number] | null>(null);
  const [rectStart, setRectStart] = useState<[number, number] | null>(null);
  const [rectEnd, setRectEnd] = useState<[number, number] | null>(null);

  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = areaMode ? "crosshair" : "";
    return () => {
      container.style.cursor = "";
    };
  }, [map, areaMode]);

  useMapEvents({
    mousedown: (e) => {
      if (!areaMode) return;
      if (!e.originalEvent.shiftKey) return;
      if (maxPoints > 0 && currentCount >= maxPoints) return;
      drawingRef.current = true;
      startRef.current = [e.latlng.lat, e.latlng.lng];
      setRectStart([e.latlng.lat, e.latlng.lng]);
      setRectEnd([e.latlng.lat, e.latlng.lng]);
    },
    mousemove: (e) => {
      if (!drawingRef.current || !startRef.current) return;
      setRectEnd([e.latlng.lat, e.latlng.lng]);
    },
    mouseup: (e) => {
      if (!drawingRef.current || !startRef.current) return;
      const start = startRef.current;
      drawingRef.current = false;
      startRef.current = null;
      setRectStart(null);
      setRectEnd(null);
      const minLat = Math.min(start[0], e.latlng.lat);
      const maxLat = Math.max(start[0], e.latlng.lat);
      const minLng = Math.min(start[1], e.latlng.lng);
      const maxLng = Math.max(start[1], e.latlng.lng);
      onAreaSelected({ minLat, maxLat, minLng, maxLng });
    },
  });

  if (!rectStart || !rectEnd) return null;
  return (
    <Rectangle
      bounds={[
        [rectStart[0], rectStart[1]],
        [rectEnd[0], rectEnd[1]],
      ]}
      pathOptions={{ color: "#2D6A4F", weight: 2, fillOpacity: 0.15 }}
    />
  );
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function TreePlantingPage() {
  const { areaId } = useParams<{ areaId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [points, setPoints] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [areaMode, setAreaMode] = useState(false);

  const { data: area, isLoading: areaLoading } = useQuery({
    queryKey: ["areas", areaId],
    queryFn: () => areasService.getArea(areaId!),
    enabled: !!areaId,
  });

  const { data: pendingCount } = useQuery({
    queryKey: ["pending-tree-count", areaId],
    queryFn: () => plantedTreesService.getPendingTreeCount(areaId!),
    enabled: !!areaId,
  });

  const { data: existingTrees } = useQuery({
    queryKey: ["planted-trees", areaId],
    queryFn: () => plantedTreesService.getPlantedTrees(areaId!),
    enabled: !!areaId,
  });

  const areaIdSafe = area?.id ?? areaId!;

  const saveMutation = useMutation({
    mutationFn: (pts: { latitude: number; longitude: number }[]) =>
      plantedTreesService.savePlantedTrees(areaIdSafe, pts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      queryClient.invalidateQueries({
        queryKey: ["planted-trees", areaIdSafe],
      });
      queryClient.invalidateQueries({
        queryKey: ["pending-tree-count", areaIdSafe],
      });
      navigate(
        getAreaDetailPath({ id: area?.id ?? areaIdSafe, slug: area?.slug }),
      );
    },
    onError: () => {
      setError(t("treePlanting.saveError"));
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => plantedTreesService.clearPlantedTrees(areaIdSafe),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      queryClient.invalidateQueries({
        queryKey: ["planted-trees", areaIdSafe],
      });
      queryClient.invalidateQueries({
        queryKey: ["pending-tree-count", areaIdSafe],
      });
      setShowClearConfirm(false);
      setPoints([]);
    },
    onError: () => {
      setError(t("treePlanting.clearError"));
    },
  });

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (areaMode) return;
      setPoints((prev) => [...prev, { latitude: lat, longitude: lng }]);
    },
    [areaMode],
  );

  const handleAreaSelected = useCallback(
    (bounds: DrawingBounds) => {
      if (!pendingCount) return;
      setPoints((prev) => {
        const remaining = pendingCount.pending - prev.length;
        if (remaining <= 0) return prev;
        const generated = generateGridPoints(bounds, remaining);
        return [...prev, ...generated];
      });
    },
    [pendingCount],
  );

  const handleRemovePoint = useCallback((index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = () => {
    if (points.length === 0) return;
    saveMutation.mutate(points);
  };

  if (areaLoading) return <PageSkeleton />;

  if (!area) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <ErrorBanner messageKey="area.notFound" />
      </div>
    );
  }

  const existingCount = existingTrees?.length ?? 0;
  const maxNewPoints = pendingCount?.pending ?? 0;
  const totalPlanted = existingCount + points.length;
  const totalCompensated = pendingCount?.totalCompensated ?? 0;

  return (
    <>
      <SEO title={t("seo.treePlanting.title")} />
      <div className="max-w-4xl mx-auto space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </button>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t("map.plantTrees")}</h1>
            <p className="text-text-secondary text-sm mt-1">
              <MapPin className="h-3.5 w-3.5 inline" /> {area.name}
              {area.city && area.state && (
                <>
                  {" "}
                  &mdash;{" "}
                  {[
                    area.city,
                    area.state,
                    getCountryName(area.countryCode ?? ""),
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </>
              )}
            </p>
          </div>
        </div>

        {error && (
          <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />
        )}

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm">
              <TreePine className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {totalPlanted} / {totalCompensated}
              </span>
              <span className="text-text-secondary">
                {t("map.treesPlanted")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setAreaMode(false)}
                  title={t("tooltips.treePlanting.manualMode")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    !areaMode
                      ? "bg-primary text-white"
                      : "bg-white text-text-secondary hover:bg-gray-50"
                  }`}
                >
                  <MousePointer2 className="h-3.5 w-3.5" />
                  {t("map.manualMode")}
                </button>
                <button
                  type="button"
                  onClick={() => setAreaMode(true)}
                  title={t("tooltips.treePlanting.areaMode")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                    areaMode
                      ? "bg-primary text-white"
                      : "bg-white text-text-secondary hover:bg-gray-50"
                  }`}
                >
                  <Square className="h-3.5 w-3.5" />
                  {t("map.areaMode")}
                </button>
              </div>
              <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{
                    width: `${totalCompensated > 0 ? (totalPlanted / totalCompensated) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-text-secondary mb-3">
            {areaMode
              ? t("map.areaModeHint")
              : maxNewPoints > 0 && existingCount > 0
                ? t("map.plantMoreHint", { existingCount, maxNewPoints })
                : maxNewPoints === 0 && existingCount > 0
                  ? t("map.allPlantedHint")
                  : t("map.plantTreesHint")}
          </p>

          <div className="h-[550px] rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
              center={[area.latitude, area.longitude]}
              zoom={16}
              className="h-full w-full"
            >
              <TileLayer
                attribution={satellite ? SATELLITE_ATTR : OSM_ATTR}
                url={satellite ? SATELLITE_URL : OSM_URL}
              />
              <MapLayerControl
                satellite={satellite}
                onToggle={() => setSatellite((s) => !s)}
              />
              <MapClickHandler onMapClick={handleMapClick} />
              <AreaDrawHandler
                areaMode={areaMode}
                maxPoints={maxNewPoints}
                currentCount={points.length}
                onAreaSelected={handleAreaSelected}
              />
              <Marker
                position={[area.latitude, area.longitude]}
                icon={L.divIcon({
                  className: "",
                  html: `<div style="background:#0B5F4B;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                })}
              />
              {existingTrees?.map((tree) => (
                <Marker
                  key={tree.id}
                  position={[tree.latitude, tree.longitude]}
                  icon={existingTreeIcon}
                />
              ))}
              {points.map((point, index) => (
                <Marker
                  key={`new-${index}`}
                  position={[point.latitude, point.longitude]}
                  icon={treeIcon}
                  eventHandlers={{
                    click: () => handleRemovePoint(index),
                  }}
                />
              ))}
            </MapContainer>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                getAreaDetailPath({ id: area?.id ?? areaId, slug: area?.slug }),
              )
            }
          >
            {t("common.cancel")}
          </Button>
          <div className="flex-1" />
          {existingCount > 0 && (
            <Button
              variant="outline"
              className="text-error border-error/40 hover:bg-red-50"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> {t("common.clearAll")}
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={points.length === 0 || saveMutation.isPending}
            loading={saveMutation.isPending}
          >
            <Check className="h-4 w-4 mr-1.5" /> {t("common.save")}
          </Button>
        </div>

        <Dialog
          open={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
        >
          <DialogTitle>{t("map.clearTreesTitle")}</DialogTitle>
          <DialogContent>
            <p className="text-sm text-text-secondary">
              {t("map.clearTreesConfirm")}
            </p>
          </DialogContent>
          <DialogActions>
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-error hover:bg-error/90"
              onClick={() => clearMutation.mutate()}
              loading={clearMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> {t("common.clearAll")}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
}
