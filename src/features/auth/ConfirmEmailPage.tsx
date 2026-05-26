import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { AuthLayout } from "./components/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ErrorBanner";
import { authService } from "@/services/auth";
import { CheckCircle, Mail } from "lucide-react";
import { ApiError } from "@/lib/api-client";

export function ConfirmEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email || "";
  const urlToken = searchParams.get("token") || "";
  const [token, setToken] = useState(urlToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendEmail, setResendEmail] = useState(emailFromState);
  const [resent, setResent] = useState(false);
  const autoConfirmedRef = useRef(false);

  const handleConfirm = useCallback(async (confirmToken: string) => {
    setError(null);
    setLoading(true);
    try {
      await authService.confirmEmail(confirmToken);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.messageKey : "auth.confirmEmail.error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!urlToken || autoConfirmedRef.current) return;
    autoConfirmedRef.current = true;
    handleConfirm(urlToken);
  }, [urlToken, handleConfirm]);

  const handleResend = async () => {
    if (!resendEmail) return;
    try {
      await authService.resendConfirmationEmail(resendEmail);
      setResent(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.messageKey
          : "auth.confirmEmail.resendError",
      );
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {t("auth.confirmEmail.successTitle")}
          </h1>
          <p className="text-text-secondary mb-6">
            {t("auth.confirmEmail.successMessage")}
          </p>
          <Link to="/login">
            <Button className="w-full">{t("auth.login.submit")}</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const hasEmail = emailFromState || resendEmail;

  return (
    <>
      <SEO title={t("seo.confirmEmail.title")} />
      <AuthLayout>
        {urlToken ? (
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-text-secondary">{t("common.loading")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <Mail className="h-14 w-14 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">
                {t("auth.confirmEmail.title")}
              </h1>
              {hasEmail && (
                <p className="text-text-secondary">
                  {t("auth.confirmEmail.sentTo", { email: hasEmail })}
                </p>
              )}
              <p className="text-text-secondary mt-2 max-w-md mx-auto">
                {t("auth.confirmEmail.checkInbox")}
              </p>
            </div>

            {error && (
              <ErrorBanner
                messageKey={error}
                onDismiss={() => setError(null)}
              />
            )}

            <div className="space-y-3">
              {!hasEmail && (
                <div>
                  <Input
                    id="resendEmail"
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder={t("auth.email")}
                  />
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResend}
                disabled={resent || !resendEmail}
              >
                {resent
                  ? t("auth.confirmEmail.resent")
                  : t("auth.confirmEmail.resend")}
              </Button>
            </div>

            <details className="border-t border-gray-100 pt-4">
              <summary className="text-sm text-text-secondary cursor-pointer">
                {t("auth.confirmEmail.haveToken")}
              </summary>
              <div className="mt-3 flex gap-2">
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={t("auth.confirmEmail.tokenPlaceholder")}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => token && handleConfirm(token)}
                  loading={loading}
                  disabled={!token}
                >
                  {t("auth.confirmEmail.submit")}
                </Button>
              </div>
            </details>
          </div>
        )}
      </AuthLayout>
    </>
  );
}
