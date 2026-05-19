import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@/components/ui/Dialog";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { formatDateTime } from "@/lib/format";
import { Smartphone, Monitor, Trash2, LogOut, ArrowLeft } from "lucide-react";
import { matchesPublicRef } from "@/lib/public-refs";

function DeviceIcon({ userAgent }: { userAgent: string | null }) {
  const isMobile =
    userAgent?.toLowerCase().includes("mobile") ||
    userAgent?.toLowerCase().includes("android") ||
    userAgent?.toLowerCase().includes("iphone");
  return isMobile ? (
    <Smartphone className="h-5 w-5 text-text-secondary" />
  ) : (
    <Monitor className="h-5 w-5 text-text-secondary" />
  );
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "-";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return ua.slice(0, 40);
}

function parseOS(ua: string | null): string {
  if (!ua) return "-";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux") && !ua.includes("Android")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iOS")) return "iOS";
  return ua.slice(0, 30);
}

export function SessionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, userSlug } = useAuth();
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const targetUserId = routeUserId ?? userId ?? null;
  const isOwnProfile =
    !routeUserId ||
    matchesPublicRef(routeUserId, { id: userId, slug: userSlug });
  const queryClient = useQueryClient();
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => authService.listSessions(),
    enabled: !!targetUserId && isOwnProfile,
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => authService.revokeSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => authService.revokeAllSessions(),
    onSuccess: () => {
      setRevokeAllOpen(false);
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  if (!isOwnProfile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <p className="text-text-secondary">{t("common.accessDenied")}</p>
      </div>
    );
  }

  if (isLoading) return <PageSkeleton />;

  return (
    <>
      <SEO title={t("seo.sessions.title")} />
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </button>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("profile.sessions")}</h1>
          {sessions && sessions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-error text-error hover:bg-red-50"
              onClick={() => setRevokeAllOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-1" /> {t("profile.revokeAll")}
            </Button>
          )}
        </div>

        {sessions && sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        <DeviceIcon userAgent={session.userAgent} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          {session.userAgent
                            ? `${parseBrowser(session.userAgent)} — ${parseOS(session.userAgent)}`
                            : t("profile.unknownDevice")}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          {t("profile.sessionCreated")}:{" "}
                          {formatDateTime(session.createdAt)}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {t("profile.sessionExpires")}:{" "}
                          {formatDateTime(session.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-error hover:bg-red-50 shrink-0"
                      onClick={() => revokeMutation.mutate(session.id)}
                      disabled={revokeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Monitor className="h-12 w-12" />}
            title={t("profile.noSessions")}
          />
        )}

        <Dialog open={revokeAllOpen} onClose={() => setRevokeAllOpen(false)}>
          <DialogTitle>{t("profile.revokeAllTitle")}</DialogTitle>
          <DialogContent>
            <p className="text-sm text-text-secondary">
              {t("profile.revokeAllConfirm")}
            </p>
          </DialogContent>
          <DialogActions>
            <Button
              variant="outline"
              onClick={() => setRevokeAllOpen(false)}
              disabled={revokeAllMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-error hover:bg-error/90"
              onClick={() => revokeAllMutation.mutate()}
              loading={revokeAllMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-1" /> {t("profile.revokeAll")}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
}
