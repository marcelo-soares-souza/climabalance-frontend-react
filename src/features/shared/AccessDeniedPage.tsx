import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/Button";
import { ShieldX } from "lucide-react";

export function AccessDeniedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <SEO title={t("seo.accessDenied.title")} />
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldX className="h-20 w-20 text-error mb-6" />
        <h1 className="text-3xl font-bold mb-2">{t("errors.accessDenied")}</h1>
        <p className="text-text-secondary mb-8">
          {t("errors.accessDeniedDescription")}
        </p>
        <Button onClick={() => navigate("/")}>{t("common.backToHome")}</Button>
      </div>
    </>
  );
}
