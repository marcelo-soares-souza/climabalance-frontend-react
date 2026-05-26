import { useCallback, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "./ui/Button";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

const STORAGE_KEY = "cb_cookie_consent";
const EXPIRY_DAYS = 30;

interface CookieConsent {
  accepted: boolean;
  timestamp: string;
}

function loadConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
}

function saveConsent(accepted: boolean): void {
  const consent: CookieConsent = {
    accepted,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
}

function isExpired(consent: CookieConsent): boolean {
  const saved = new Date(consent.timestamp);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - EXPIRY_DAYS);
  return saved < cutoff;
}

function shouldShow(): boolean {
  const consent = loadConsent();
  return !consent || isExpired(consent);
}

export function CookieConsentBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(shouldShow);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const syncConsent = useCallback(
    async (accepted: boolean) => {
      if (!isAuthenticated) return;
      try {
        const consentTypes = ["analytics", "functional", "marketing"];
        await Promise.all(
          consentTypes.map((consentType) =>
            api.post("/privacy/cookie-consent", {
              consent_type: consentType,
              consented: accepted,
            }),
          ),
        );
      } catch {
        // Silently fail - localStorage consent is sufficient
      }
    },
    [isAuthenticated],
  );

  const handleAccept = useCallback(() => {
    saveConsent(true);
    setVisible(false);
    syncConsent(true);
  }, [syncConsent]);

  const handleReject = useCallback(() => {
    saveConsent(false);
    setVisible(false);
    syncConsent(false);
  }, [syncConsent]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary-200 bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          <Trans
            i18nKey="cookieConsent.message"
            components={{
              privacyLink: (
                <Link
                  to="/privacy-policy"
                  className="underline hover:text-primary"
                />
              ),
              termsLink: (
                <Link
                  to="/terms-of-use"
                  className="underline hover:text-primary"
                />
              ),
            }}
          />
        </p>
        <div className="flex shrink-0 gap-3">
          <Button variant="outline" size="sm" onClick={handleReject}>
            {t("cookieConsent.reject")}
          </Button>
          <Button variant="primary" size="sm" onClick={handleAccept}>
            {t("cookieConsent.accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
