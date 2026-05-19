import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { AuthLayout } from "./components/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ErrorBanner";
import { authService } from "@/services/auth";
import { useLocale } from "@/hooks/use-locale";
import { Mail } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { getAuthFieldErrors } from "./auth-form-errors";

export function PasswordResetRequestPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      await authService.requestPasswordReset(email, locale);
      setSent(true);
    } catch (err) {
      const nextFieldErrors = getAuthFieldErrors(err, t);
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
      } else {
        setError(
          err instanceof ApiError
            ? err.messageKey
            : "auth.passwordReset.requestError",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout>
        <div className="text-center">
          <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {t("auth.passwordReset.sentTitle")}
          </h1>
          <p className="text-text-secondary mb-6">
            {t("auth.passwordReset.sentMessage")}
          </p>
          <Link to="/password-reset/confirm">
            <Button variant="outline" className="w-full">
              {t("auth.passwordReset.haveToken")}
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <>
      <SEO title={t("seo.passwordReset.title")} />
      <AuthLayout>
        <h1 className="text-2xl font-bold text-center mb-2">
          {t("auth.passwordReset.title")}
        </h1>
        <p className="text-text-secondary text-center mb-6">
          {t("auth.passwordReset.description")}
        </p>
        {error && (
          <ErrorBanner
            messageKey={error}
            onDismiss={() => setError(null)}
            className="mb-4"
          />
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            type="email"
            label={t("auth.email")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((current) => ({ ...current, email: "" }));
            }}
            error={fieldErrors.email}
            required
            autoFocus
          />
          <Button type="submit" className="w-full" loading={loading}>
            {t("auth.passwordReset.submit")}
          </Button>
        </form>
        <Link
          to="/login"
          className="block text-center mt-4 text-sm text-primary hover:underline"
        >
          {t("auth.passwordReset.backToLogin")}
        </Link>
      </AuthLayout>
    </>
  );
}
