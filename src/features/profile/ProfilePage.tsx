import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/config/i18n";
import { SEO } from "@/components/SEO";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { authService } from "@/services/auth";
import { usersService } from "@/services/users";
import { areasService } from "@/services/areas";
import { stripeService } from "@/services/stripe";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { StatusBadge } from "@/components/StatusBadge";
import { RoleBadge } from "@/components/RoleBadge";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ApiError } from "@/lib/api-client";
import {
  formatTCO2e,
  formatDate,
  formatDateTime,
  maskDocumentNumber,
} from "@/lib/format";
import { getPrimaryAccountType, getNormalizedRoles } from "@/lib/user-display";
import {
  User,
  Edit,
  Award,
  TreePine,
  Calculator,
  Leaf,
  Scale,
  Lock,
  ChevronDown,
  ChevronUp,
  Smartphone,
  ArrowRight,
  MapPin,
  Globe,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  InstagramIcon,
  FacebookIcon,
  XIcon,
  BlueskyIcon,
  MastodonIcon,
  YoutubeIcon,
  LinkedinIcon,
} from "@/components/SocialIcons";
import { API_URL } from "@/config/api";
import {
  getAreaDetailPath,
  getUserCertificatesPath,
  getUserProfileEditPath,
  getUserPublicRef,
  getUserSessionsPath,
  matchesPublicRef,
} from "@/lib/public-refs";

const PWD_SEQUENCES = [
  "0123",
  "1234",
  "2345",
  "3456",
  "4567",
  "5678",
  "6789",
  "9876",
  "8765",
  "7654",
  "6543",
  "5432",
  "4321",
  "3210",
  "abcd",
  "bcde",
  "cdef",
  "defg",
  "efgh",
  "fghi",
  "ghij",
  "hijk",
  "ijkl",
  "jklm",
  "klmn",
  "lmno",
  "mnop",
  "nopq",
  "opqr",
  "pqrs",
  "qrst",
  "rstu",
  "stuv",
  "tuvw",
  "uvwx",
  "vwxy",
  "wxyz",
  "zyxw",
  "yxwv",
  "xwvu",
  "wvut",
  "vuts",
  "utsr",
  "tsrq",
  "srqp",
  "rqpo",
  "qpon",
  "ponm",
  "onml",
  "nmlk",
  "mlkj",
  "lkji",
  "kjih",
  "jihg",
  "ihgf",
  "hgfe",
  "gfed",
  "fedc",
  "edcb",
  "dcba",
];

function hasSequential(value: string): boolean {
  const lower = value.toLowerCase();
  return PWD_SEQUENCES.some((seq) => lower.includes(seq));
}

function validatePassword(value: string): string | null {
  if (value.length < 8) return "auth.validation.password.tooShort";
  if (!/[0-9]/.test(value)) return "auth.validation.password.noNumber";
  if (!/[!@#$%^&*(),.?":{}|<>_\-[\]\\/`~]/.test(value))
    return "auth.validation.password.noSpecial";
  if (hasSequential(value)) return "auth.validation.password.sequential";
  return null;
}

function formatProfileTCO2e(value: number): { amount: string; unit: string } {
  const abs = Math.abs(value);
  const decimals = abs >= 1000 ? 0 : abs >= 100 ? 1 : 2;
  return {
    amount: new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value),
    unit: i18n.t("units.tco2e"),
  };
}

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, userSlug, isAdmin } = useAuth();
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const targetUserId = routeUserId ?? userId ?? null;
  const isOwnProfile =
    !routeUserId ||
    matchesPublicRef(routeUserId, { id: userId, slug: userSlug });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const passwordMutation = useMutation({
    mutationFn: () =>
      authService.changePassword(oldPassword, newPassword, newPasswordConfirm),
    onSuccess: () => {
      setOldPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setShowPasswordForm(false);
      setPasswordError(null);
      setPasswordSuccess(true);
    },
    onError: (err) => {
      setPasswordError(
        err instanceof ApiError ? err.messageKey : "server.error",
      );
      setPasswordSuccess(false);
    },
  });

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["users", targetUserId],
    queryFn: () => usersService.getUser(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["users", targetUserId, "profile"],
    queryFn: () => usersService.getUserProfile(targetUserId!),
    enabled: !!targetUserId,
  });

  const { data: compensations } = useQuery({
    queryKey: ["users", targetUserId, "contributions"],
    queryFn: () =>
      usersService.getUserContributions(targetUserId!, { limit: 5 }),
    enabled: !!targetUserId,
  });

  const { data: climateBalance } = useQuery({
    queryKey: ["users", targetUserId, "climate-balance"],
    queryFn: () => usersService.getClimateBalance(targetUserId!),
    enabled: !!targetUserId,
  });

  const isProducer = user?.roles?.includes("producer");
  const canOwnAreas = user?.roles?.some(
    (r) => r === "producer" || r === "administrator",
  );
  const { data: stripeStatus } = useQuery({
    queryKey: ["profile", "stripe-status", userId],
    queryFn: () => stripeService.getStripeOnboardingStatus(),
    enabled: isOwnProfile && !!isProducer,
  });
  const isProducerReadyToReceivePayments =
    !!stripeStatus?.connected && !!stripeStatus?.charges_enabled;
  const isStripePendingVerification =
    stripeStatus?.onboarding_status === "pending_verification";
  const { data: userAreas } = useQuery({
    queryKey: ["areas", "owner", user?.id],
    queryFn: () =>
      areasService.listAreas({ ownerUserId: user!.slug || user!.id }),
    enabled: !!user?.id && !!canOwnAreas,
  });

  if (loadingUser || loadingProfile) return <PageSkeleton />;

  const grossEmissions = climateBalance?.grossEmissionsTCO2e ?? 0;
  const totalCompensated = climateBalance?.estimatedOffsetTCO2e ?? 0;
  const netBalance =
    climateBalance?.netBalanceTCO2e ?? grossEmissions - totalCompensated;
  const totalTrees = climateBalance?.totalTreesPurchased ?? 0;
  const primaryAccountType = getPrimaryAccountType(user?.roles, t);
  const roles = getNormalizedRoles(user?.roles);
  const grossDisplay = formatProfileTCO2e(grossEmissions);
  const compensatedDisplay = formatProfileTCO2e(totalCompensated);
  const balanceDisplay = formatProfileTCO2e(netBalance);
  const targetUserRef = getUserPublicRef(
    isOwnProfile
      ? { id: userId, slug: userSlug }
      : { id: user?.id ?? targetUserId, slug: user?.slug ?? routeUserId },
  );
  const editProfilePath = getUserProfileEditPath(
    targetUserRef
      ? { id: user?.id ?? targetUserId, slug: targetUserRef }
      : undefined,
  );
  const certificatesPath = getUserCertificatesPath(
    targetUserRef
      ? { id: user?.id ?? targetUserId, slug: targetUserRef }
      : undefined,
  );
  const sessionsPath = getUserSessionsPath(
    targetUserRef
      ? { id: user?.id ?? targetUserId, slug: targetUserRef }
      : undefined,
  );
  const avatarUserRef = targetUserRef || user?.id || targetUserId;
  const userEmailLabel = user?.email ?? user?.emailMasked ?? "";
  const profileDocumentNumberLabel =
    profile?.documentNumberMasked ??
    (profile?.documentNumber
      ? maskDocumentNumber(profile.documentNumber)
      : null);
  const profileBirthDateLabel =
    profile?.birthDateMasked ??
    (profile?.birthDate ? formatDate(profile.birthDate) : null);

  return (
    <>
      <SEO title={profile?.displayName || t("seo.profile.title")} />
      <div className="max-w-2xl mx-auto space-y-6">
        {isOwnProfile && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(editProfilePath)}
            >
              <Edit className="h-4 w-4 mr-1" /> {t("profile.edit")}
            </Button>
          </div>
        )}

        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                {profile?.avatarPath ? (
                  <img
                    src={`${API_URL}/api/v1/users/${avatarUserRef}/profile/avatar/file`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {profile?.displayName || userEmailLabel || "-"}
                </h2>
                <p className="text-text-secondary">{userEmailLabel}</p>
                <p className="text-sm text-text-secondary mt-1">
                  <span className="font-medium text-text-primary">
                    {t("profile.accountType")}:
                  </span>{" "}
                  {primaryAccountType}
                </p>
                <div className="flex gap-2 mt-1">
                  {roles.map((role) => (
                    <RoleBadge key={role} role={role} />
                  ))}
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  {t("profile.memberSince")}{" "}
                  {user?.createdAt ? formatDate(user.createdAt) : "-"}
                </p>
                {user?.lastLoginAt && (
                  <p className="text-xs text-text-secondary">
                    {t("profile.lastLogin")} {formatDateTime(user.lastLoginAt)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {isOwnProfile && (
          <Card>
            <CardContent className="py-4">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  if (!showPasswordForm) {
                    setPasswordSuccess(false);
                    setPasswordError(null);
                  }
                }}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-text-secondary" />
                  <span className="font-medium">
                    {t("profile.changePassword")}
                  </span>
                </div>
                {showPasswordForm ? (
                  <ChevronUp className="h-4 w-4 text-text-secondary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                )}
              </button>
              {passwordSuccess && !showPasswordForm && (
                <p className="mt-3 text-sm text-success border-t border-gray-100 pt-3">
                  {t("profile.passwordChanged")}
                </p>
              )}
              {showPasswordForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setPasswordSuccess(false);
                    const pwdError = validatePassword(newPassword);
                    if (pwdError) {
                      setPasswordError(pwdError);
                      return;
                    }
                    if (newPassword !== newPasswordConfirm) {
                      setPasswordError("errors.auth.register.passwordMismatch");
                      return;
                    }
                    passwordMutation.mutate();
                  }}
                  className="mt-4 space-y-3 border-t border-gray-100 pt-4"
                >
                  {passwordError && (
                    <ErrorBanner
                      messageKey={passwordError}
                      onDismiss={() => setPasswordError(null)}
                    />
                  )}
                  <Input
                    id="old_password"
                    type={showOldPassword ? "text" : "password"}
                    label={t("profile.oldPassword")}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    suffixIcon={
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="text-text-secondary hover:text-text-primary p-1"
                      >
                        {showOldPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                  />
                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    label={t("profile.newPassword")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    suffixIcon={
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-text-secondary hover:text-text-primary p-1"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                  />
                  <Input
                    id="new_password_confirm"
                    type={showNewPasswordConfirm ? "text" : "password"}
                    label={t("auth.confirmPassword")}
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    required
                    suffixIcon={
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() =>
                          setShowNewPasswordConfirm(!showNewPasswordConfirm)
                        }
                        className="text-text-secondary hover:text-text-primary p-1"
                      >
                        {showNewPasswordConfirm ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    }
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      type="button"
                      size="sm"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordError(null);
                        setPasswordSuccess(false);
                        setOldPassword("");
                        setNewPassword("");
                        setNewPasswordConfirm("");
                      }}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      loading={passwordMutation.isPending}
                    >
                      {t("common.save")}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {isOwnProfile && isProducer && (
          <Card>
            <CardHeader>
              <h3 className="font-medium">{t("producer.stripe.title")}</h3>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isProducerReadyToReceivePayments ? (
                <div className="flex items-center gap-2">
                  <p className="text-success">{t("producer.stripe.enabled")}</p>
                  <InfoTooltip
                    ariaLabel={t("producer.stripe.enabled")}
                    content={<p>{t("tooltips.producer.chargesEnabled")}</p>}
                  />
                </div>
              ) : isStripePendingVerification ? (
                <div className="flex items-center gap-2">
                  <p className="text-warning">
                    {t("producer.stripe.pending_verification")}
                  </p>
                  <InfoTooltip
                    ariaLabel={t("producer.stripe.pending_verification")}
                    content={
                      <p>{t("tooltips.producer.pendingVerification")}</p>
                    }
                  />
                </div>
              ) : (
                <>
                  <p className="text-text-secondary">
                    {t("producer.stripe.not_connected")}
                  </p>
                  <div className="space-y-2 text-text-secondary">
                    <p>{t("producer.stripe.step1_desc")}</p>
                    <p>{t("producer.stripe.step2_desc")}</p>
                    <p>{t("producer.stripe.step3_desc")}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate("/how-to-use/stripe-setup")}
                  >
                    {t("producer.stripe.connect_now")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {profile &&
          (profileDocumentNumberLabel ||
            profile.phone ||
            profile.addressCity) && (
            <Card>
              <CardHeader>
                <h3 className="font-medium">{t("profile.personalInfo")}</h3>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                {profile.documentType && (
                  <div>
                    <span className="text-text-secondary">
                      {t("profile.documentType")}:
                    </span>{" "}
                    {profile.documentType}
                  </div>
                )}
                {profileDocumentNumberLabel && (
                  <div>
                    <span className="text-text-secondary">
                      {t("profile.documentNumber")}:
                    </span>{" "}
                    {profileDocumentNumberLabel}
                  </div>
                )}
                {profile.phone && (
                  <div>
                    <span className="text-text-secondary">
                      {t("profile.phone")}:
                    </span>{" "}
                    {profile.phone}
                  </div>
                )}
                {profileBirthDateLabel && (
                  <div>
                    <span className="text-text-secondary">
                      {t("profile.birthDate")}:
                    </span>{" "}
                    {profileBirthDateLabel}
                  </div>
                )}
                {profile.addressCity && (
                  <div className="col-span-2">
                    <span className="text-text-secondary">
                      {t("profile.address")}:
                    </span>{" "}
                    {[
                      profile.addressLine1,
                      profile.addressCity,
                      profile.addressState,
                      profile.addressPostalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {profile?.about && (
          <Card>
            <CardContent className="py-6">
              <p className="whitespace-pre-line text-text-secondary">
                {profile.about}
              </p>
            </CardContent>
          </Card>
        )}

        {profile &&
          (profile.websiteUrl ||
            profile.instagramUrl ||
            profile.facebookUrl ||
            profile.xUrl ||
            profile.blueskyUrl ||
            profile.mastodonUrl ||
            profile.youtubeUrl ||
            profile.linkedinUrl) && (
            <Card>
              <CardHeader>
                <h3 className="font-medium flex items-center gap-2">
                  {t("profile.links")}
                </h3>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("profile.website")}
                    aria-label={t("profile.website")}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
                {profile.instagramUrl && (
                  <a
                    href={profile.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("profile.social.instagram")}
                    aria-label={t("profile.social.instagram")}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
                  >
                    <InstagramIcon className="h-5 w-5" />
                  </a>
                )}
                {profile.facebookUrl && (
                  <a
                    href={profile.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("profile.social.facebook")}
                    aria-label={t("profile.social.facebook")}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
                  >
                    <FacebookIcon className="h-5 w-5" />
                  </a>
                )}
                {profile.xUrl && (
                  <a
                    href={profile.xUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("profile.social.x")}
                    aria-label={t("profile.social.x")}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
                  >
                    <XIcon className="h-5 w-5" />
                  </a>
                )}
                {profile.blueskyUrl && (
                  <a
                    href={profile.blueskyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("profile.social.bluesky")}
                    aria-label={t("profile.social.bluesky")}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
                  >
                    <BlueskyIcon className="h-5 w-5" />
                  </a>
                )}
                {profile.mastodonUrl && (
                  <a
                    href={profile.mastodonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("profile.social.mastodon")}
                    aria-label={t("profile.social.mastodon")}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
                  >
                    <MastodonIcon className="h-5 w-5" />
                  </a>
                )}
                {profile.youtubeUrl && (
                  <a
                    href={profile.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("profile.social.youtube")}
                    aria-label={t("profile.social.youtube")}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
                  >
                    <YoutubeIcon className="h-5 w-5" />
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("profile.social.linkedin")}
                    aria-label={t("profile.social.linkedin")}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
                  >
                    <LinkedinIcon className="h-5 w-5" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-sm">
            <CardContent className="text-center py-4">
              <Calculator className="h-6 w-6 text-slate-700 mx-auto mb-2" />
              <div className="space-y-1">
                <p className="break-words text-[clamp(1.35rem,2vw,1.7rem)] font-bold leading-none text-slate-800">
                  {grossDisplay.amount}
                </p>
                <p className="text-sm font-semibold leading-none text-slate-700">
                  {grossDisplay.unit}
                </p>
              </div>
              <div className="mt-2 flex min-h-12 items-start justify-center gap-2 text-sm text-text-secondary">
                <span className="text-center leading-5">
                  {t("home.dashboard.totalFootprint")}
                </span>
                <InfoTooltip
                  ariaLabel={t("home.dashboard.totalFootprint")}
                  content={<p>{t("tooltips.dashboard.totalFootprint")}</p>}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50 to-white shadow-sm">
            <CardContent className="text-center py-4">
              <Leaf className="h-6 w-6 text-emerald-700 mx-auto mb-2" />
              <div className="space-y-1">
                <p className="break-words text-[clamp(1.35rem,2vw,1.7rem)] font-bold leading-none text-emerald-700">
                  {compensatedDisplay.amount}
                </p>
                <p className="text-sm font-semibold leading-none text-emerald-600">
                  {compensatedDisplay.unit}
                </p>
              </div>
              <div className="mt-2 flex min-h-12 items-start justify-center gap-2 text-sm text-text-secondary">
                <span className="text-center leading-5">
                  {t("profile.compensated")}
                </span>
                <InfoTooltip
                  ariaLabel={t("profile.compensated")}
                  content={<p>{t("tooltips.dashboard.compensated")}</p>}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-gradient-to-b from-amber-50 to-white shadow-sm">
            <CardContent className="text-center py-4">
              <Scale className="h-6 w-6 text-amber-700 mx-auto mb-2" />
              <div className="space-y-1">
                <p className="break-words text-[clamp(1.35rem,2vw,1.7rem)] font-bold leading-none text-amber-700">
                  {balanceDisplay.amount}
                </p>
                <p className="text-sm font-semibold leading-none text-amber-600">
                  {balanceDisplay.unit}
                </p>
              </div>
              <div className="mt-2 flex min-h-12 items-start justify-center gap-2 text-sm text-text-secondary">
                <span className="text-center leading-5">
                  {t("home.dashboard.balance")}
                </span>
                <InfoTooltip
                  ariaLabel={t("home.dashboard.balance")}
                  content={<p>{t("tooltips.dashboard.balance")}</p>}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="border-teal-200 bg-gradient-to-b from-teal-50 to-white shadow-sm">
            <CardContent className="text-center py-4">
              <TreePine className="h-6 w-6 text-teal-700 mx-auto mb-2" />
              <p className="break-words text-[clamp(1.35rem,2vw,1.7rem)] font-bold leading-none text-teal-700">
                {totalTrees}
              </p>
              <div className="mt-2 flex min-h-12 items-start justify-center gap-2 text-sm text-text-secondary">
                <span className="text-center leading-5">
                  {t("profile.treesPlanted")}
                </span>
                <InfoTooltip
                  ariaLabel={t("profile.treesPlanted")}
                  content={<p>{t("tooltips.dashboard.treesPlanted")}</p>}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {compensations && compensations.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-medium">
                {t("profile.recentCompensations")}
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {compensations.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm"
                  >
                    <div>
                      <p className="font-medium">{c.areaName}</p>
                      <p className="text-xs text-text-secondary">
                        {formatDate(c.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatTCO2e(c.totalTCO2e)}</p>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {canOwnAreas && userAreas && userAreas.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-medium">{t("nav.myAreas")}</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {userAreas.map((area) => (
                <Link
                  key={area.id}
                  to={getAreaDetailPath(area)}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {area.name}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {[area.city, area.state].filter(Boolean).join(", ")}
                        {area.biome && (
                          <span className="ml-1">
                            · {t(`biome.${area.biome}`, area.biome)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={area.status} />
                    <ArrowRight className="h-4 w-4 text-text-secondary" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {(isOwnProfile || isAdmin) && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(certificatesPath)}
          >
            <Award className="h-4 w-4 mr-2" /> {t("profile.viewCertificates")}
          </Button>
        )}
        {isOwnProfile && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(sessionsPath)}
          >
            <Smartphone className="h-4 w-4 mr-2" /> {t("profile.sessions")}
          </Button>
        )}
      </div>
    </>
  );
}
