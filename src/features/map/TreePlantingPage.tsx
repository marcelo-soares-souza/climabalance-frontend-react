import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { areasService } from "@/services/areas";
import { plantedTreesService } from "@/services/planted-trees";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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
import { ArrowLeft, TreePine, Check, Trash2, MapPin } from "lucide-react";

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
  html: `<div style="background:#95D5B2;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 7 10h3l-2 4h3v5h2v-5h3l-2-4h3L12 3Z" fill="white"/>
    </svg>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

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
  const [points, setPoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  const saveMutation = useMutation({
    mutationFn: (pts: { latitude: number; longitude: number }[]) =>
      plantedTreesService.savePlantedTrees(areaId!, pts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planted-trees", areaId] });
      queryClient.invalidateQueries({ queryKey: ["pending-tree-count", areaId] });
      navigate(`/areas/${areaId}`);
    },
    onError: () => {
      setError("Erro ao salvar plantio. Tente novamente.");
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => plantedTreesService.clearPlantedTrees(areaId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planted-trees", areaId] });
      queryClient.invalidateQueries({ queryKey: ["pending-tree-count", areaId] });
      setShowClearConfirm(false);
      setPoints([]);
    },
    onError: () => {
      setError("Erro ao limpar \u00e1rvores. Tente novamente.");
    },
  });

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!pendingCount) return;
      if (points.length >= pendingCount.pending) return;
      setPoints((prev) => [...prev, { latitude: lat, longitude: lng }]);
    },
    [points.length, pendingCount],
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
            {area.city && area.state && <> &mdash; {area.city}, {area.state}</>}
          </p>
        </div>
      </div>

      {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm">
            <TreePine className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {totalPlanted} / {totalCompensated}
            </span>
            <span className="text-text-secondary">{t("map.treesPlanted")}</span>
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

        <p className="text-sm text-text-secondary mb-3">
          {existingCount > 0
            ? `${existingCount} j\u00e1 plantadas. Clique no mapa para adicionar mais ${maxNewPoints}.`
            : t("map.plantTreesHint")}
        </p>

        <div className="h-[550px] rounded-lg overflow-hidden border border-gray-200">
          <MapContainer
            center={[area.latitude, area.longitude]}
            zoom={16}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
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
          onClick={() => navigate(`/areas/${areaId}`)}
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

      <Dialog open={showClearConfirm} onClose={() => setShowClearConfirm(false)}>
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
  );
}
