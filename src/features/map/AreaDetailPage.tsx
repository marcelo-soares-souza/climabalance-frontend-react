import { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { areasService } from "@/services/areas";
import { plantedTreesService } from "@/services/planted-trees";
import { stripeService } from "@/services/stripe";
import { satelliteService } from "@/services/satellite";
import { usersService } from "@/services/users";
import { SatelliteImageOverlay } from "@/components/leaflet/SatelliteImageOverlay";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { useCompensationStore } from "@/stores/compensation-store";
import { useAuth } from "@/hooks/use-auth";
import {
  formatCurrency,
  formatKgCO2e,
  formatNumber,
  formatTCO2e,
} from "@/lib/format";
import {
  ArrowLeft,
  TreePine,
  Image,
  Send,
  ShieldOff,
  Upload,
  Trash2,
  Edit,
  X,
  Coins,
  Sprout,
  Leaf,
  MapPin,
  AlertTriangle,
  Satellite,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
} from "lucide-react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCountryName } from "@/lib/countries";
import { MapLayerControl } from "@/components/leaflet/MapLayerControl";
import {
  OSM_URL,
  OSM_ATTR,
  SATELLITE_URL,
  SATELLITE_ATTR,
} from "@/components/leaflet/map-layers";
import {
  getAreaAuditPath,
  getAreaEditPath,
  getAreaPlantTreesPath,
  getUserProfilePath,
} from "@/lib/public-refs";

const treeDotIcon = L.divIcon({
  className: "",
  html: `<div style="background:#40916C;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 7 10h3l-2 4h3v5h2v-5h3l-2-4h3L12 3Z" fill="white"/>
    </svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export function AreaDetailPage() {
  const DESCRIPTION_PREVIEW_LENGTH = 260;
  const { areaId } = useParams<{ areaId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, userId, isAdmin } = useAuth();
  const setSelection = useCompensationStore((s) => s.setSelection);
  const queryClient = useQueryClient();

  const [satellite, setSatellite] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submitNotes, setSubmitNotes] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  const { data: area, isLoading } = useQuery({
    queryKey: ["areas", areaId],
    queryFn: () => areasService.getArea(areaId!),
    enabled: !!areaId,
  });

  const { data: contributions } = useQuery({
    queryKey: ["areas", areaId, "contributions"],
    queryFn: () => areasService.listAreaContributions(areaId!),
    enabled: !!areaId,
  });

  const { data: media } = useQuery({
    queryKey: ["areas", areaId, "media"],
    queryFn: () => areasService.listAreaMedia(areaId!),
    enabled: !!areaId,
  });

  const { data: plantedTrees } = useQuery({
    queryKey: ["planted-trees", areaId],
    queryFn: () => plantedTreesService.getPlantedTrees(areaId!),
    enabled: !!areaId,
  });

  const { data: pendingCount } = useQuery({
    queryKey: ["pending-tree-count", areaId],
    queryFn: () => plantedTreesService.getPendingTreeCount(areaId!),
    enabled: !!areaId,
  });

  const { data: stripeStatus } = useQuery({
    queryKey: ["producer-stripe-status", userId],
    queryFn: () => stripeService.getStripeOnboardingStatus(),
    enabled: isAuthenticated && !!userId && userId === area?.ownerUserId,
  });

  const { data: ownerUser, isFetched: isOwnerUserFetched } = useQuery({
    queryKey: ["users", area?.ownerUserId, "owner-link"],
    queryFn: () => usersService.getUser(area!.ownerUserId),
    enabled: !!area?.ownerUserId && !area?.ownerSlug,
  });

  const { data: satelliteImage } = useQuery({
    queryKey: ["satellite-image", areaId],
    queryFn: () => satelliteService.getLatest(areaId!),
    enabled: !!areaId,
  });

  const areaIdentifier = area?.id ?? areaId ?? "";

  const handleCompensate = () => {
    if (!area) return;
    setSelection({
      areaId: area.id,
      areaName: area.name,
      calculationId: null,
      compensationMode: "tree_purchase",
      totalTCO2e: null,
      treesRequested: null,
      totalAmount: null,
    });
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/compensation/review" } });
      return;
    }
    navigate("/compensation/review");
  };

  const submitMutation = useMutation({
    mutationFn: () =>
      areasService.submitForAudit(areaIdentifier, submitNotes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas", areaId] });
      setSubmitDialogOpen(false);
      setSubmitNotes("");
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () =>
      areasService.suspendArea(areaIdentifier, suspendReason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas", areaId] });
      setSuspendDialogOpen(false);
      setSuspendReason("");
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!areaIdentifier) throw new Error("area.not_found");
      const mediaType = file.type.startsWith("video/") ? "video" : "photo";
      return areasService.uploadAreaMedia(areaIdentifier, file, mediaType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      queryClient.invalidateQueries({ queryKey: ["areas", areaId, "media"] });
    },
  });

  const deleteMediMutation = useMutation({
    mutationFn: (mediaId: string) => areasService.deleteAreaMedia(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      queryClient.invalidateQueries({ queryKey: ["areas", areaId, "media"] });
    },
  });

  const deleteAreaMutation = useMutation({
    mutationFn: () => areasService.deleteArea(areaIdentifier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      navigate("/areas/available");
    },
  });

  const satelliteMutation = useMutation({
    mutationFn: () => satelliteService.fetchNewImage(areaIdentifier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["satellite-image", areaId] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!lightboxImage) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxImage(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxImage]);

  if (isLoading) return <PageSkeleton />;
  if (!area) return <div>{t("common.notFound")}</div>;

  const totalTreesFunded =
    contributions?.reduce((sum, item) => sum + item.treesCount, 0) ?? 0;
  const ownerSlug = area.ownerSlug ?? ownerUser?.slug ?? null;
  const ownerLabel =
    area.ownerName ?? area.ownerEmail ?? area.ownerEmailMasked ?? null;
  const ownerProfilePath = ownerSlug
    ? getUserProfilePath({
        id: area.ownerUserId,
        slug: ownerSlug,
      })
    : isOwnerUserFetched
      ? getUserProfilePath({
          id: area.ownerUserId,
        })
      : null;
  const totalEstimatedTCO2e =
    contributions?.reduce((sum, item) => sum + item.totalTCO2e, 0) ?? 0;
  const supporterCount = contributions?.length ?? 0;
  const defaultHorizonYears = area.defaultHorizonYears ?? 20;
  const plantedCount = plantedTrees?.length ?? 0;
  const availableCount = pendingCount?.totalCompensated ?? totalTreesFunded;
  const description = area.description?.trim() ?? "";
  const hasLongDescription = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const visibleDescription =
    hasLongDescription && !isDescriptionExpanded
      ? `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}...`
      : description;
  const formatMetric = (value: number, unit: string) => {
    const abs = Math.abs(value);
    const decimals = abs >= 1000 ? 0 : abs >= 100 ? 1 : 2;
    return {
      amount: new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value),
      unit,
    };
  };
  const perTreeDisplay = formatMetric(
    (area.estimatedKgCO2PerTreePerYear ?? 0) / 1000,
    t("units.tco2e"),
  );
  const compensatedDisplay = formatMetric(
    totalEstimatedTCO2e,
    t("units.tco2e"),
  );

  const isOwner = userId === area.ownerUserId;
  const producerReadyToReceiveSupport =
    stripeStatus?.connected && stripeStatus?.charges_enabled;
  const shouldShowProducerStripeWarning =
    isOwner &&
    area.status === "active" &&
    stripeStatus !== undefined &&
    !producerReadyToReceiveSupport;
  const canManageMedia = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;
  const canSubmitForAudit = isOwner && area.status === "draft";
  const canSuspend = isAdmin && area.status === "active";
  const canEdit =
    isAdmin ||
    (isOwner && (area.status === "draft" || area.status === "active"));

  return (
    <>
      <SEO
        title={area?.name || t("seo.areaDetail.title")}
        description={area?.description || t("seo.areaDetail.description")}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </button>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{area.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-text-secondary">
              {/* <MapPin className="h-4 w-4" /> */}
              <span>
                {[area.city, area.state, getCountryName(area.countryCode ?? "")]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
            {area.ownerUserId && (
              <p className="text-sm mt-1">
                <span className="text-text-secondary">{t("area.owner")}: </span>
                {ownerProfilePath ? (
                  <Link
                    to={ownerProfilePath}
                    className="text-primary hover:underline"
                  >
                    {ownerLabel || t("area.anonymousContributor")}
                  </Link>
                ) : (
                  <span className="text-primary">
                    {ownerLabel || t("area.anonymousContributor")}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={area.status} />
            <InfoTooltip
              ariaLabel={t("tooltips.area.statusAria")}
              panelClassName="left-auto right-0"
              content={
                <>
                  <p>
                    <strong className="text-text-primary">
                      {t("common.status.draft")}:
                    </strong>{" "}
                    {t("tooltips.area.statusDraft")}
                  </p>
                  <p className="mt-2">
                    <strong className="text-text-primary">
                      {t("common.status.pending_audit")}:
                    </strong>{" "}
                    {t("tooltips.area.statusPendingAudit")}
                  </p>
                  <p className="mt-2">
                    <strong className="text-text-primary">
                      {t("common.status.approved")}:
                    </strong>{" "}
                    {t("tooltips.area.statusApproved")}
                  </p>
                  <p className="mt-2">
                    <strong className="text-text-primary">
                      {t("common.status.active")}:
                    </strong>{" "}
                    {t("tooltips.area.statusActive")}
                  </p>
                  <p className="mt-2">
                    <strong className="text-text-primary">
                      {t("common.status.rejected")}:
                    </strong>{" "}
                    {t("tooltips.area.statusRejected")}
                  </p>
                  <p className="mt-2">
                    <strong className="text-text-primary">
                      {t("common.status.suspended")}:
                    </strong>{" "}
                    {t("tooltips.area.statusSuspended")}
                  </p>
                </>
              }
            />
          </div>
        </div>

        {area.description && (
          <Card>
            <CardContent className="py-6">
              <p className="whitespace-pre-line text-text-secondary">
                {visibleDescription}
              </p>
              {hasLongDescription && (
                <button
                  type="button"
                  onClick={() =>
                    setIsDescriptionExpanded((current) => !current)
                  }
                  className="mt-3 text-sm font-medium text-primary hover:underline"
                >
                  {isDescriptionExpanded
                    ? t("common.showLess")
                    : t("common.showMore")}
                </button>
              )}
            </CardContent>
          </Card>
        )}

        {area.treeSpecies && (
          <Card>
            <CardHeader>
              <h3 className="font-medium">{t("area.form.treeSpecies")}</h3>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-text-secondary">
                {area.treeSpecies}
              </p>
            </CardContent>
          </Card>
        )}

        {area.externalLink && (
          <Card>
            <CardHeader>
              <h3 className="font-medium flex items-center gap-2">
                <ExternalLink className="h-4 w-4" /> {t("area.form.links")}
              </h3>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <a
                href={area.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <Globe className="h-4 w-4" /> {t("area.form.externalLink")}
              </a>
            </CardContent>
          </Card>
        )}

        {shouldShowProducerStripeWarning && (
          <Card className="border-amber-300 bg-amber-50">
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2 text-amber-900">
                <AlertTriangle className="h-5 w-5" />
                {t("area.stripeSetupRequiredTitle")}
              </h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-amber-900">
              <p>{t("area.stripeSetupRequiredDesc")}</p>
              <p className="text-xs text-amber-900/80">
                {t("area.stripeSetupStatusDebug", {
                  connected: stripeStatus?.connected ? "true" : "false",
                  charges: stripeStatus?.charges_enabled ? "true" : "false",
                  payouts: stripeStatus?.payouts_enabled ? "true" : "false",
                })}
              </p>
              <p>{t("area.stripeSetupRequiredStep1")}</p>
              <p>{t("area.stripeSetupRequiredStep2")}</p>
              <p>{t("area.stripeSetupRequiredStep3")}</p>
              <Button
                size="sm"
                onClick={() => navigate("/how-to-use/stripe-setup")}
              >
                {t("area.stripeSetupRequiredCta")}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50 to-white shadow-sm">
            <CardContent className="text-center py-4">
              <Coins className="mx-auto mb-2 h-6 w-6 text-emerald-700" />
              <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
                {t("area.form.pricePerTree")}
                <InfoTooltip
                  ariaLabel={t("tooltips.area.pricePerTreeAria")}
                  content={<p>{t("tooltips.area.pricePerTree")}</p>}
                />
              </div>
              <p className="break-words text-[clamp(1.35rem,2vw,1.7rem)] font-bold leading-none text-emerald-700">
                {area.pricePerTree != null
                  ? formatCurrency(area.pricePerTree, "USD")
                  : "-"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-gradient-to-b from-amber-50 to-white shadow-sm">
            <CardContent className="text-center py-4">
              <Sprout className="mx-auto mb-2 h-6 w-6 text-amber-700" />
              <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
                {t("area.tCO2ePerTree")}
                <InfoTooltip
                  ariaLabel={t("tooltips.shared.tco2ePerTreeAria")}
                  content={<p>{t("tooltips.shared.tco2ePerTree")}</p>}
                />
              </div>
              <div className="space-y-1">
                <p className="break-words text-[clamp(1.35rem,2vw,1.7rem)] font-bold leading-none text-amber-700">
                  {perTreeDisplay.amount}
                </p>
                <p className="text-sm font-semibold leading-none text-amber-600">
                  {perTreeDisplay.unit}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-teal-200 bg-gradient-to-b from-teal-50 to-white shadow-sm">
            <CardContent className="text-center py-4">
              <TreePine className="mx-auto mb-2 h-6 w-6 text-teal-700" />
              <div className="flex items-center justify-center gap-1">
                <p className="text-sm text-text-secondary">
                  {t("profile.treesPlanted")}
                </p>
                <InfoTooltip
                  ariaLabel={t("profile.treesPlanted")}
                  content={<p>{t("tooltips.area.treesPlanted")}</p>}
                />
              </div>
              <p className="break-words text-[clamp(1.35rem,2vw,1.7rem)] font-bold leading-none text-teal-700">
                {formatNumber(plantedCount, "pt-BR", 0)}
                {availableCount > 0 && (
                  <span className="text-base font-normal text-text-secondary">
                    /{formatNumber(availableCount, "pt-BR", 0)}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="border-sky-200 bg-gradient-to-b from-sky-50 to-white shadow-sm">
            <CardContent className="text-center py-4">
              <Leaf className="mx-auto mb-2 h-6 w-6 text-sky-700" />
              <div className="flex items-center justify-center gap-1">
                <p className="text-sm text-text-secondary">
                  {t("profile.compensated")}
                </p>
                <InfoTooltip
                  ariaLabel={t("profile.compensated")}
                  content={<p>{t("tooltips.area.compensated")}</p>}
                />
              </div>
              <div className="space-y-1">
                <p className="break-words text-[clamp(1.35rem,2vw,1.7rem)] font-bold leading-none text-sky-700">
                  {compensatedDisplay.amount}
                </p>
                <p className="text-sm font-semibold leading-none text-sky-600">
                  {compensatedDisplay.unit}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-text-secondary">
              {t("area.tCO2ePerTree")}:{" "}
              {formatKgCO2e(area.estimatedKgCO2PerTreePerYear)}
              <InfoTooltip
                ariaLabel={t("tooltips.shared.tco2ePerTreeAria")}
                content={<p>{t("tooltips.shared.tco2ePerTree")}</p>}
              />
            </span>
            <span className="text-sm text-text-secondary">
              {defaultHorizonYears} {t("common.years")}
            </span>
            {area.maxPurchasableTrees != null && (
              <span className="text-sm text-text-secondary">
                {t("area.maxPurchasableTrees")}: {area.maxPurchasableTrees}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Area Map */}
        <Card>
          <CardHeader>
            <h3 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {t("map.title")}
              {availableCount > 0 && (
                <span className="text-sm font-normal text-text-secondary">
                  ({t("profile.treesPlanted")}: {plantedCount}/{availableCount})
                </span>
              )}
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-72 rounded-b-lg overflow-hidden">
              <MapContainer
                center={[area.latitude, area.longitude]}
                zoom={15}
                className="h-full w-full"
                zoomControl={true}
              >
                <TileLayer
                  attribution={satellite ? SATELLITE_ATTR : OSM_ATTR}
                  url={satellite ? SATELLITE_URL : OSM_URL}
                />
                <MapLayerControl
                  satellite={satellite}
                  onToggle={() => setSatellite((s) => !s)}
                />
                <Marker
                  position={[area.latitude, area.longitude]}
                  icon={L.divIcon({
                    className: "",
                    html: `<div style="background:#0B5F4B;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                  })}
                />
                {plantedTrees?.map((tree) => (
                  <Marker
                    key={tree.id}
                    position={[tree.latitude, tree.longitude]}
                    icon={treeDotIcon}
                  />
                ))}
                {satelliteImage && showOverlay && (
                  <SatelliteImageOverlay image={satelliteImage} />
                )}
              </MapContainer>
            </div>
            {satelliteImage && (
              <div
                className="px-4 py-2 flex items-center justify-between text-xs text-text-secondary border-t"
                title={t("tooltips.satellite.data")}
              >
                <span>
                  {t("satellite.captureDate")}: {satelliteImage.captureDate}
                  {satelliteImage.cloudCover !== null && (
                    <>
                      {" "}
                      &middot; {t("satellite.cloudCover")}:{" "}
                      {satelliteImage.cloudCover}%
                    </>
                  )}
                  &middot; {satelliteImage.collection}
                  {satelliteImage.isFallback && (
                    <>
                      {" "}
                      &middot;{" "}
                      <span className="text-amber-600">
                        {t("satellite.fallback")}
                      </span>
                    </>
                  )}
                </span>
                <button
                  onClick={() => setShowOverlay((s) => !s)}
                  className="p-1 hover:text-text-primary transition-colors"
                  title={
                    showOverlay
                      ? t("satellite.hideOverlay")
                      : t("satellite.showOverlay")
                  }
                >
                  {showOverlay ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isAuthenticated && (area.ownerUserId === userId || isAdmin) && (
            <Button onClick={() => navigate(getAreaPlantTreesPath(area))}>
              <TreePine className="h-4 w-4 mr-1.5" /> {t("map.plantTrees")}
            </Button>
          )}
          {(isOwner || isAdmin) && (
            <Button
              onClick={() => satelliteMutation.mutate()}
              disabled={satelliteMutation.isPending}
              variant="outline"
            >
              <Satellite className="h-4 w-4 mr-1.5" />
              {satelliteMutation.isPending
                ? t("common.loading")
                : t("satellite.fetchNew")}
            </Button>
          )}
        </div>

        {/* Media Gallery */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Image className="h-4 w-4" /> {t("area.media")} (
                {media?.length ?? 0}){" "}
                <InfoTooltip
                  ariaLabel={t("area.media")}
                  content={<p>{t("tooltips.area.media")}</p>}
                />
              </h3>
              {canManageMedia && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMutation.isPending}
                  >
                    <Upload className="h-4 w-4 mr-1" />{" "}
                    {uploadMutation.isPending
                      ? t("common.loading")
                      : t("area.uploadMedia")}
                  </Button>
                </>
              )}
            </div>
            {uploadMutation.isError && (
              <p className="mt-2 text-sm text-error">
                {t("area.uploadMediaError")}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {media && media.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {media.map((m) => (
                  <div
                    key={m.id}
                    className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden"
                  >
                    {m.mediaType === "photo" ? (
                      <button
                        type="button"
                        className="w-full h-full cursor-zoom-in"
                        onClick={() =>
                          setLightboxImage({
                            url: m.url,
                            alt: m.description || m.fileName,
                          })
                        }
                        aria-label={t("area.mediaLightbox.open")}
                      >
                        <img
                          src={m.url}
                          alt={m.description || m.fileName}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <video
                        src={m.url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}
                    {canManageMedia && (
                      <button
                        onClick={() => deleteMediMutation.mutate(m.id)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                        title={t("common.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                {t("area.mediaEmpty")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Contributions */}
        {contributions && contributions.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-medium">
                {t("area.contributions")} ({contributions.length}){" "}
                <InfoTooltip
                  ariaLabel={t("area.contributions")}
                  content={<p>{t("tooltips.area.contributions")}</p>}
                />
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="rounded-md bg-primary-50 p-3 text-center">
                  <p className="text-xs text-text-secondary">
                    {t("profile.treesPlanted")}
                  </p>
                  <p className="text-lg font-semibold text-primary">
                    {formatNumber(totalTreesFunded, "pt-BR", 0)}
                  </p>
                </div>
                <div className="rounded-md bg-success/10 p-3 text-center">
                  <p className="text-xs text-text-secondary">
                    {t("profile.compensated")}
                  </p>
                  <p className="text-lg font-semibold text-success">
                    {formatTCO2e(totalEstimatedTCO2e)}
                  </p>
                </div>
                <div className="rounded-md bg-gray-100 p-3 text-center">
                  <p className="text-xs text-text-secondary">
                    {t("area.supporters")}
                  </p>
                  <p className="text-lg font-semibold text-text-primary">
                    {formatNumber(supporterCount, "pt-BR", 0)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {contributions.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm"
                  >
                    {c.userId ? (
                      <Link
                        to={getUserProfilePath({
                          id: c.userId,
                          slug: c.userSlug,
                        })}
                        className="text-primary hover:underline"
                      >
                        {c.userEmail || t("area.anonymousContributor")}
                      </Link>
                    ) : (
                      <span>{t("area.anonymousContributor")}</span>
                    )}
                    <span className="font-medium">
                      {formatTCO2e(c.totalTCO2e)} ({c.treesCount}{" "}
                      {t("area.trees")})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {area.status === "active" && (
            <Button size="lg" className="flex-1" onClick={handleCompensate}>
              <TreePine className="h-5 w-5 mr-2" /> {t("area.compensateNow")}
            </Button>
          )}
          {isAdmin && area.status === "pending_audit" && (
            <Button
              size="lg"
              variant="secondary"
              className="flex-1"
              onClick={() => navigate(getAreaAuditPath(area))}
            >
              {t("audit.review.approve")}
            </Button>
          )}
          {isAdmin && area.status === "approved" && (
            <Button
              size="lg"
              variant="secondary"
              className="flex-1"
              onClick={() => navigate(getAreaAuditPath(area))}
            >
              {t("audit.review.activate")}
            </Button>
          )}
          {canSubmitForAudit && (
            <Button
              size="lg"
              variant="secondary"
              className="flex-1"
              onClick={() => setSubmitDialogOpen(true)}
              title={t("tooltips.area.submitForAudit")}
            >
              <Send className="h-5 w-5 mr-2" />{" "}
              {t("area.actions.submitForAudit")}
            </Button>
          )}
          {canSuspend && (
            <Button
              size="lg"
              variant="outline"
              className="flex-1 border-error text-error hover:bg-red-50"
              onClick={() => setSuspendDialogOpen(true)}
              title={t("tooltips.area.suspend")}
            >
              <ShieldOff className="h-5 w-5 mr-2" /> {t("area.actions.suspend")}
            </Button>
          )}
          {canEdit && (
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(getAreaEditPath(area))}
            >
              <Edit className="h-5 w-5 mr-2" /> {t("common.edit")}
            </Button>
          )}
          {canDelete && (
            <Button
              size="lg"
              variant="outline"
              className="flex-1 border-error text-error hover:bg-red-50"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-5 w-5 mr-2" /> {t("area.actions.delete")}
            </Button>
          )}
        </div>

        {/* Submit for Audit Dialog */}
        <Dialog
          open={submitDialogOpen}
          onClose={() => setSubmitDialogOpen(false)}
        >
          <DialogTitle>{t("area.submitConfirm.title")}</DialogTitle>
          <DialogContent>{t("area.submitConfirm.message")}</DialogContent>
          <Input
            label={t("area.submitConfirm.notesLabel")}
            value={submitNotes}
            onChange={(e) => setSubmitNotes(e.target.value)}
            placeholder={t("area.submitConfirm.notesPlaceholder")}
          />
          {submitMutation.isError && (
            <p className="mt-2 text-sm text-error">
              {t("area.submitConfirm.error")}
            </p>
          )}
          <DialogActions>
            <Button
              variant="outline"
              onClick={() => setSubmitDialogOpen(false)}
              disabled={submitMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending
                ? t("common.loading")
                : t("area.actions.submitForAudit")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Suspend Area Dialog */}
        <Dialog
          open={suspendDialogOpen}
          onClose={() => setSuspendDialogOpen(false)}
        >
          <DialogTitle>{t("area.suspendConfirm.title")}</DialogTitle>
          <DialogContent>{t("area.suspendConfirm.message")}</DialogContent>
          <Input
            label={t("area.suspendConfirm.reasonLabel")}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder={t("area.suspendConfirm.reasonPlaceholder")}
          />
          {suspendMutation.isError && (
            <p className="mt-2 text-sm text-error">
              {t("area.suspendConfirm.error")}
            </p>
          )}
          <DialogActions>
            <Button
              variant="outline"
              onClick={() => setSuspendDialogOpen(false)}
              disabled={suspendMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="outline"
              className="border-error text-error hover:bg-red-50"
              onClick={() => suspendMutation.mutate()}
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending
                ? t("common.loading")
                : t("area.actions.suspend")}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>{t("area.deleteConfirm.title")}</DialogTitle>
          <DialogContent>{t("area.deleteConfirm.message")}</DialogContent>
          {deleteAreaMutation.isError && (
            <p className="mt-2 text-sm text-error">
              {t("area.deleteConfirm.error")}
            </p>
          )}
          <DialogActions>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteAreaMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="outline"
              className="border-error text-error hover:bg-red-50"
              onClick={() => deleteAreaMutation.mutate()}
              disabled={deleteAreaMutation.isPending}
            >
              {deleteAreaMutation.isPending
                ? t("common.loading")
                : t("area.actions.delete")}
            </Button>
          </DialogActions>
        </Dialog>

        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
            role="dialog"
            aria-modal="true"
            aria-label={t("area.mediaLightbox.title")}
          >
            <button
              type="button"
              className="absolute top-4 right-4 p-2 rounded-full bg-white/15 text-white hover:bg-white/25"
              onClick={(event) => {
                event.stopPropagation();
                setLightboxImage(null);
              }}
              aria-label={t("area.mediaLightbox.close")}
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.alt}
              className="max-h-[90vh] max-w-[95vw] object-contain rounded-md"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        )}
      </div>
    </>
  );
}
