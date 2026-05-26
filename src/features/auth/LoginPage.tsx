import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AuthLayout } from "./components/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ApiError } from "@/lib/api-client";
import { getAuthFieldErrors } from "./auth-form-errors";
import { authService } from "@/services/auth";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated, hasRestoredSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const isEmailNotConfirmed = error === "auth.email_not_confirmed";

  const from = (location.state as { from?: string })?.from || "/";

  useEffect(() => {
    if (hasRestoredSession && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [from, hasRestoredSession, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const nextFieldErrors = getAuthFieldErrors(err, t);
        if (Object.keys(nextFieldErrors).length > 0) {
          setFieldErrors(nextFieldErrors);
          return;
        }
        setError(err.messageKey);
      } else {
        setError("auth.login.error");
      }
    }
  };

  const handleResendConfirm = async () => {
    if (!email) return;
    setResending(true);
    setResendSuccess(false);
    try {
      await authService.resendConfirmationEmail(email);
      setResendSuccess(true);
      setError(null);
    } catch {
      setResendSuccess(false);
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <SEO title={t("seo.login.title")} />
      <AuthLayout>
        <h1 className="text-2xl font-bold text-center mb-6">
          {t("auth.login.title")}
        </h1>
        {error && !isEmailNotConfirmed && (
          <ErrorBanner
            messageKey={error}
            onDismiss={() => setError(null)}
            className="mb-4"
          />
        )}
        {isEmailNotConfirmed && (
          <div className="mb-4 rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-4 space-y-3">
            <p className="text-sm text-amber-800 text-center">
              {t("errors.auth.email_not_confirmed")}
            </p>
            {resendSuccess ? (
              <p className="text-sm text-emerald-700 font-medium text-center">
                {t("auth.confirmEmail.resent")}
              </p>
            ) : (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendConfirm}
                  loading={resending}
                  disabled={!email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {t("auth.confirmEmail.resend")}
                </Button>
              </div>
            )}
          </div>
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
            placeholder={t("auth.emailPlaceholder")}
            error={fieldErrors.email}
            required
            autoFocus
          />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            label={t("auth.password")}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((current) => ({ ...current, password: "" }));
            }}
            placeholder={t("auth.passwordPlaceholder")}
            error={fieldErrors.password}
            required
            suffixIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-secondary hover:text-text-primary p-1"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            }
          />
          <Button type="submit" className="w-full" loading={isLoading}>
            {t("auth.login.submit")}
          </Button>
        </form>
        <div className="mt-6 text-center space-y-2">
          <Link
            to="/password-reset"
            className="text-sm text-primary hover:underline block"
          >
            {t("auth.login.forgotPassword")}
          </Link>
          <p className="text-sm text-text-secondary">
            {t("auth.login.noAccount")}{" "}
            <Link to="/register" className="text-primary hover:underline">
              {t("auth.login.register")}
            </Link>
          </p>
        </div>
      </AuthLayout>
    </>
  );
}
