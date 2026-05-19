import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/api-client";
import { ShieldAlert, Download } from "lucide-react";

type RequestType =
  | "access"
  | "rectification"
  | "erasure"
  | "portability"
  | "restrict"
  | "object"
  | "withdraw_consent";

export function PrivacyPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [requestType, setRequestType] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestTypeOptions: { value: RequestType; label: string }[] = [
    { value: "access", label: t("privacy.requestTypes.access") },
    { value: "rectification", label: t("privacy.requestTypes.rectification") },
    { value: "erasure", label: t("privacy.requestTypes.erasure") },
    { value: "portability", label: t("privacy.requestTypes.portability") },
    { value: "restrict", label: t("privacy.requestTypes.restrict") },
    { value: "object", label: t("privacy.requestTypes.object") },
    {
      value: "withdraw_consent",
      label: t("privacy.requestTypes.withdrawConsent"),
    },
  ];

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!requestType) return;
    setLoading(true);
    try {
      await api.post("/privacy/subject-request", {
        request_type: requestType,
        details: details || undefined,
      });
      setMessage(t("privacy.requestSubmitted"));
      setRequestType("");
      setDetails("");
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setMessage(null);
    setError(null);
    setExportLoading(true);
    try {
      await api.post("/privacy/subject-request", {
        request_type: "portability",
        details: t("privacy.exportRequestDetails"),
      });
      setMessage(t("privacy.exportRequested"));
    } catch {
      setError(t("errors.generic"));
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <>
      <SEO title="Privacidade" />
      <div className="max-w-3xl mx-auto space-y-8 py-2">
        <section className="rounded-3xl bg-gradient-to-br from-primary via-primary-light to-accent px-8 py-14 text-white">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium">
              {t("privacy.hero.eyebrow")}
            </span>
            <h1 className="text-4xl font-bold font-display md:text-5xl">
              {t("privacy.hero.title")}
            </h1>
            <p className="max-w-2xl text-lg text-white/85">
              {t("privacy.hero.description")}
            </p>
          </div>
        </section>

        {isAuthenticated && (
          <>
            <Card>
              <CardContent className="space-y-4 py-8">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    {t("privacy.exportData")}
                  </h2>
                </div>
                <p className="text-sm text-text-secondary">
                  {t("privacy.exportDataDescription")}
                </p>
                <Button
                  variant="primary"
                  loading={exportLoading}
                  onClick={handleExportData}
                >
                  {t("privacy.requestExport")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 py-8">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    {t("privacy.subjectRequest")}
                  </h2>
                </div>
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <Select
                    label={t("privacy.requestType")}
                    placeholder={t("privacy.selectRequestType")}
                    options={requestTypeOptions}
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    required
                  />
                  <Textarea
                    label={t("privacy.details")}
                    placeholder={t("privacy.detailsPlaceholder")}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                  />
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={!requestType}
                  >
                    {t("privacy.submitRequest")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        {message && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>
    </>
  );
}
