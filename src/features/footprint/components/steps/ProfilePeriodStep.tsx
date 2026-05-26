import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/cn";
import { User, BarChart3, ClipboardCheck } from "lucide-react";
import type { ProfileType, DataQuality } from "@/types/footprint";

interface Props {
  profileType: ProfileType;
  periodStart: string;
  periodEnd: string;
  dataQuality: DataQuality;
  onProfileTypeChange: (type: ProfileType) => void;
  onPeriodChange: (start: string, end: string) => void;
  onDataQualityChange: (quality: DataQuality) => void;
}

const QUALITY_ICONS: Record<DataQuality, React.ReactNode> = {
  real: <ClipboardCheck className="h-4 w-4" />,
  estimated: <BarChart3 className="h-4 w-4" />,
};

export function ProfilePeriodStep({
  profileType,
  periodStart,
  periodEnd,
  dataQuality,
  onProfileTypeChange,
  onPeriodChange,
  onDataQualityChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-semibold text-lg">
            {t("footprint.profile.typeLabel")}
          </h3>
          <InfoTooltip
            ariaLabel={t("tooltips.footprint.profileTypeAria")}
            content={<p>{t("tooltips.footprint.profileType")}</p>}
          />
        </div>
        <p className="text-base text-text-secondary mb-3">
          {t("footprint.profile.typeSubtitle")}
        </p>
        <div className="grid gap-3">
          {[
            {
              type: "individual" as ProfileType,
              icon: <User className="h-6 w-6" />,
              subtitleKey: "footprint.profile.individualSubtitle",
            },
            // {
            //   type: "legal_entity" as ProfileType,
            //   icon: <Building2 className="h-6 w-6" />,
            //   subtitleKey: "footprint.profile.legalEntitySubtitle",
            // },
          ].map(({ type, icon, subtitleKey }) => (
            <Card
              key={type}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg",
                profileType === type ? "ring-2 ring-primary" : "",
              )}
              onClick={() => onProfileTypeChange(type)}
            >
              <CardContent className="py-5 text-center space-y-2">
                <div
                  className={cn(
                    "mx-auto w-12 h-12 rounded-full flex items-center justify-center",
                    profileType === type
                      ? "bg-primary text-white"
                      : "bg-primary-50 text-primary",
                  )}
                >
                  {icon}
                </div>
                <p className="font-medium">{t(`footprint.profile.${type}`)}</p>
                <p className="text-sm text-text-secondary">{t(subtitleKey)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-semibold text-lg">
            {t("footprint.period.label")}
          </h3>
          <InfoTooltip
            ariaLabel={t("tooltips.footprint.periodAria")}
            content={<p>{t("tooltips.footprint.period")}</p>}
          />
        </div>
        <p className="text-base text-text-secondary mb-3">
          {t("footprint.period.subtitle")}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="periodStart"
            type="date"
            label={t("footprint.period.start")}
            value={periodStart}
            onChange={(e) => onPeriodChange(e.target.value, periodEnd)}
            required
          />
          <Input
            id="periodEnd"
            type="date"
            label={t("footprint.period.end")}
            value={periodEnd}
            onChange={(e) => onPeriodChange(periodStart, e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-semibold text-lg">
            {t("footprint.dataQuality.label")}
          </h3>
          <InfoTooltip
            ariaLabel={t("tooltips.footprint.dataQualityAria")}
            content={<p>{t("tooltips.footprint.dataQuality")}</p>}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["real", "estimated"] as DataQuality[]).map((q) => (
            <div key={q} className="space-y-2">
              <button
                onClick={() => onDataQualityChange(q)}
                className={cn(
                  "flex items-center gap-2 w-full px-4 py-2.5 rounded-[var(--radius-button)] text-base border transition-all",
                  dataQuality === q
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "border-gray-200 hover:border-primary hover:bg-primary-50",
                )}
              >
                {QUALITY_ICONS[q]}
                {t(`footprint.dataQuality.${q}`)}
              </button>
              <p
                className={cn(
                  "text-xs leading-relaxed px-1",
                  dataQuality === q ? "text-primary" : "text-text-secondary",
                )}
              >
                {t(`footprint.dataQuality.${q}Description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
