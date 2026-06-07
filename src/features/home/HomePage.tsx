import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import { areasService } from "@/services/areas";
import { footprintService } from "@/services/footprint";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTCO2e, formatNumber, formatDate } from "@/lib/format";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import {
  Calculator,
  MapPin,
  TreePine,
  Award,
  ArrowRight,
  Leaf,
  Plus,
  User,
  Sprout,
} from "lucide-react";
import {
  getAreaDetailPath,
  getUserCertificatesPath,
  getUserNewCalculationPath,
} from "@/lib/public-refs";

const LOGO_URL = "/logo.png";
const heroLinkClass =
  "inline-flex items-center justify-center rounded-[var(--radius-button)] px-6 py-3 text-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50";
const heroOutlineLinkClass = `${heroLinkClass} border-2 border-white/40 text-white hover:bg-white/10`;
const heroPrimaryLinkClass = `${heroLinkClass} bg-white text-primary shadow-lg hover:bg-white/90`;

export function HomePage() {
  const { isAuthenticated, userId, userSlug, hasRestoredSession } = useAuth();

  if (!hasRestoredSession) return <PageSkeleton />;

  if (!isAuthenticated) return <UnauthenticatedHome />;
  return <AuthenticatedHome userId={userId!} userSlug={userSlug} />;
}

function UnauthenticatedHome() {
  const { t } = useTranslation();

  const { data: globalStats } = useQuery({
    queryKey: ["global-stats"],
    queryFn: () => areasService.getGlobalStats(),
  });

  return (
    <>
      <SEO
        title={t("seo.home.title")}
        description={t("seo.home.description")}
      />
      <div className="max-w-5xl mx-auto text-center py-2">
        <div className="bg-gradient-to-br from-primary via-primary-light to-accent rounded-3xl px-8 py-6 mb-4 text-white relative overflow-hidden">
          <Leaf className="absolute -top-6 -right-6 h-40 w-40 text-white/5 rotate-12" />
          <Leaf className="absolute -bottom-4 -left-4 h-24 w-24 text-white/5 -rotate-45" />
          <img
            src={LOGO_URL}
            alt={t("app.name")}
            className="h-28 w-28 mx-auto mb-6 drop-shadow-lg"
          />
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
            {t("home.welcome.title")}
          </h1>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            {t("home.welcome.description")}
          </p>
          {/* <p className="mx-auto mb-8 max-w-2xl rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/90">
          {t("home.welcome.transferNotice")}
        </p> */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/about" className={heroOutlineLinkClass}>
              {t("home.welcome.learnMore")}
            </Link>
            <Link to="/how-to-use" className={heroOutlineLinkClass}>
              {t("home.welcome.howToUse")}
            </Link>
            <Link to="/calculator" className={heroOutlineLinkClass}>
              {t("home.welcome.tryCalculator")}
            </Link>
            <Link to="/map" className={heroOutlineLinkClass}>
              {t("home.welcome.exploreMap")}
            </Link>
            <Link to="/register" className={heroPrimaryLinkClass}>
              {t("home.welcome.getStarted")}
            </Link>
          </div>
        </div>

        <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {t("home.welcome.betaNotice")}
        </div>

        {globalStats && (
          <div className="mb-4">
            <h2 className="text-xl font-bold text-text-primary mb-3 text-center">
              {t("home.stats.title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Card className="border-l-4 border-l-emerald-400">
                <CardContent className="py-4">
                  <p className="text-sm text-text-secondary mb-1">
                    {t("home.stats.totalAreas")}
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatNumber(globalStats.totalAreas, "en-US", 0)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-primary">
                <CardContent className="py-4">
                  <p className="text-sm text-text-secondary mb-1">
                    {t("home.stats.totalTrees")}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatNumber(globalStats.totalTreesPlanted, "en-US", 0)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-400">
                <CardContent className="py-4">
                  <p className="text-sm text-text-secondary mb-1">
                    {t("home.stats.totalCO2")}
                  </p>
                  <p className="text-2xl font-bold text-amber-700">
                    {formatTCO2e(globalStats.totalCO2Captured)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-4 text-center">
            {t("home.profiles.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/how-to-use" className="block">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {t("auth.register.roleIndividual")}
                  </h3>
                  <p className="text-base text-text-secondary">
                    {t("auth.register.roleIndividualDescription")}
                  </p>
                </CardContent>
              </Card>
            </Link>
            {/* <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/how-to-use")}
          >
            <CardContent className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {t("auth.register.roleLegalEntity")}
              </h3>
              <p className="text-base text-text-secondary">
                {t("auth.register.roleLegalEntityDescription")}
              </p>
            </CardContent>
          </Card> */}
            <Link to="/how-to-use?tab=producer" className="block">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <Sprout className="h-7 w-7 text-emerald-700" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {t("auth.register.roleProducer")}
                  </h3>
                  <p className="text-base text-text-secondary">
                    {t("auth.register.roleProducerDescription")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {t("home.welcome.step1Title")}
              </h3>
              <p className="text-base text-text-secondary">
                {t("home.welcome.step1Description")}
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-4">
                <TreePine className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {t("home.welcome.step2Title")}
              </h3>
              <p className="text-base text-text-secondary">
                {t("home.welcome.step2Description")}
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-earth/20 flex items-center justify-center mx-auto mb-4">
                <Award className="h-7 w-7 text-amber-700" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {t("home.welcome.step3Title")}
              </h3>
              <p className="text-base text-text-secondary">
                {t("home.welcome.step3Description")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function AuthenticatedHome({
  userId,
  userSlug,
}: {
  userId: string;
  userSlug: string | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isProducer = roles.includes("producer");
  const calculatorPath = getUserNewCalculationPath({
    id: userId,
    slug: userSlug,
  });
  const certificatesPath = getUserCertificatesPath({
    id: userId,
    slug: userSlug,
  });

  const { data: compensations, isLoading: loadingComp } = useQuery({
    queryKey: ["users", userId, "contributions"],
    queryFn: () => usersService.getUserContributions(userId, { limit: 5 }),
  });

  const { data: climateBalance, isLoading: loadingBalance } = useQuery({
    queryKey: ["users", userId, "climate-balance"],
    queryFn: () => usersService.getClimateBalance(userId),
  });

  const { data: calculations, isLoading: loadingCalc } = useQuery({
    queryKey: ["calculations"],
    queryFn: () => footprintService.listCalculations({ limit: 5 }),
  });

  const { data: myAreas, isLoading: loadingAreas } = useQuery({
    queryKey: ["areas", "my", userId],
    queryFn: () => areasService.listAreas({ ownerUserId: userSlug ?? userId }),
    enabled: isProducer,
  });

  const totalFootprint =
    climateBalance?.grossEmissionsTCO2e ??
    (calculations?.reduce((sum, c) => sum + c.totalTCO2e, 0) || 0);
  const totalCompensated =
    climateBalance?.estimatedOffsetTCO2e ??
    (compensations
      ?.filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.totalTCO2e, 0) ||
      0);
  const totalTrees =
    climateBalance?.totalTreesPurchased ??
    (compensations
      ?.filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.treesCount, 0) ||
      0);
  const balance =
    climateBalance?.netBalanceTCO2e ?? totalFootprint - totalCompensated;

  return (
    <>
      <SEO
        title={t("seo.home.title")}
        description={t("seo.home.description")}
      />
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-display">
          {t("home.dashboard.title")}
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t("home.dashboard.totalFootprint")}
            tooltip={t("tooltips.dashboard.totalFootprint")}
            value={loadingCalc ? null : formatTCO2e(totalFootprint)}
            icon={<Calculator className="h-5 w-5" />}
            color="text-amber-600"
            bg="bg-amber-50"
            borderColor="border-l-amber-400"
          />
          <StatCard
            label={t("home.dashboard.compensated")}
            tooltip={t("tooltips.dashboard.compensated")}
            value={
              loadingComp || loadingBalance
                ? null
                : formatTCO2e(totalCompensated)
            }
            icon={<TreePine className="h-5 w-5" />}
            color="text-success"
            bg="bg-green-50"
            borderColor="border-l-green-400"
          />
          <StatCard
            label={t("home.dashboard.balance")}
            tooltip={t("tooltips.dashboard.balance")}
            value={
              loadingCalc || loadingComp || loadingBalance
                ? null
                : formatTCO2e(balance)
            }
            icon={<Leaf className="h-5 w-5" />}
            color={balance > 0 ? "text-error" : "text-success"}
            bg={balance > 0 ? "bg-red-50" : "bg-green-50"}
            borderColor={
              balance > 0 ? "border-l-red-400" : "border-l-green-400"
            }
          />
          <StatCard
            label={t("home.dashboard.treesPlanted")}
            tooltip={t("tooltips.dashboard.treesPlanted")}
            value={
              loadingComp || loadingBalance
                ? null
                : formatNumber(totalTrees, "pt-BR", 0)
            }
            icon={<TreePine className="h-5 w-5" />}
            color="text-primary"
            bg="bg-primary-50"
            borderColor="border-l-primary"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(calculatorPath)}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-3 bg-primary-50 rounded-xl">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {t("home.dashboard.calculateAction")}
                </p>
                <p className="text-base text-text-secondary">
                  {t("home.dashboard.calculateDescription")}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-secondary" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate("/map")}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-3 bg-accent/15 rounded-xl">
                <MapPin className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {t("home.dashboard.compensateAction")}
                </p>
                <p className="text-base text-text-secondary">
                  {t("home.dashboard.compensateDescription")}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-secondary" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(certificatesPath)}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <div className="p-3 bg-earth/20 rounded-xl">
                <Award className="h-6 w-6 text-amber-700" />
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {t("home.dashboard.certificatesAction")}
                </p>
                <p className="text-base text-text-secondary">
                  {t("home.dashboard.certificatesDescription")}
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-secondary" />
            </CardContent>
          </Card>
        </div>

        {/* My Areas (producer only) */}
        {isProducer && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">
                  {t("home.dashboard.myAreas")}
                </h2>
                <Button size="sm" onClick={() => navigate("/areas/create")}>
                  <Plus className="h-4 w-4 mr-1" /> {t("area.form.create")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingAreas ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : myAreas && myAreas.length > 0 ? (
                <div className="space-y-2">
                  {myAreas.map((area) => (
                    <div
                      key={area.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100"
                      onClick={() => navigate(getAreaDetailPath(area))}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {area.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {[area.city, area.state].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <StatusBadge status={area.status} />
                        <ArrowRight className="h-4 w-4 text-text-secondary" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={t("home.dashboard.noAreas")}
                  description={t("home.dashboard.noAreasDescription")}
                  action={
                    <Button size="sm" onClick={() => navigate("/areas/create")}>
                      <Plus className="h-4 w-4 mr-1" /> {t("area.form.create")}
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardContent>
            <h2 className="font-semibold text-lg mb-4">
              {t("home.dashboard.recentActivity")}
            </h2>
            {loadingComp ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : compensations && compensations.length > 0 ? (
              <div className="space-y-3">
                {compensations.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                    onClick={() =>
                      navigate(
                        getAreaDetailPath({ id: c.areaId, slug: c.areaSlug }),
                      )
                    }
                  >
                    <div>
                      <p className="text-base font-medium">{c.areaName}</p>
                      <p className="text-sm text-text-secondary">
                        {formatDate(c.createdAt)}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className="text-base font-medium">
                        {formatTCO2e(c.totalTCO2e)}
                      </p>
                      <StatusBadge status={c.status} />
                      <ArrowRight className="h-4 w-4 text-text-secondary shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("home.dashboard.noActivity")}
                description={t("home.dashboard.noActivityDescription")}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  label,
  tooltip,
  value,
  icon,
  color,
  bg,
  borderColor,
}: {
  label: string;
  tooltip?: string;
  value: string | null;
  icon: React.ReactNode;
  color: string;
  bg: string;
  borderColor: string;
}) {
  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="py-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</div>
          <span className="inline-flex items-center gap-2 text-base text-text-secondary">
            {label}
            {tooltip ? (
              <InfoTooltip ariaLabel={label} content={<p>{tooltip}</p>} />
            ) : null}
          </span>
        </div>
        {value === null ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <p className={`text-xl font-bold ${color}`}>{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
