import { useTranslation } from "react-i18next";
import { Building, Info } from "lucide-react";
import { CategoryInputCard } from "../CategoryInputCard";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import type { FootprintInput } from "@/types/footprint";

export function Scope2Step({
  onSave,
  initialValues,
}: {
  onSave: (
    inputs: FootprintInput[],
    category: FootprintInput["category"],
  ) => void;
  initialValues?: Record<string, number>;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary-50 rounded-xl">
          <Building className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">
              {t("footprint.scope2.title")}
            </h3>
            <InfoTooltip
              ariaLabel={t("tooltips.footprint.scope2Aria")}
              content={<p>{t("tooltips.footprint.scope2")}</p>}
            />
          </div>
          <p className="text-base text-text-secondary">
            {t("footprint.scope2.description")}
          </p>
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-[var(--radius-card)] p-4 flex gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-base font-medium text-primary">
            {t("footprint.scope2.whatIsTitle")}
          </p>
          <p className="text-base text-text-secondary mt-1">
            {t("footprint.scope2.whatIsDescription")}
          </p>
        </div>
      </div>

      <CategoryInputCard
        category="scope2"
        fields={[
          {
            key: "purchased_electricity",
            unit: "kwh",
            displayUnit: "kWh",
            labelKey: "footprint.scope2.purchasedElectricity",
            metadata: { activity_subtype: "scope2_purchased_electricity" },
          },
          {
            key: "purchased_heat",
            unit: "kwh",
            displayUnit: "kWh",
            labelKey: "footprint.scope2.purchasedHeat",
            metadata: { activity_subtype: "scope2_purchased_heat" },
          },
          {
            key: "purchased_steam",
            unit: "kwh",
            displayUnit: "kWh",
            labelKey: "footprint.scope2.purchasedSteam",
            metadata: { activity_subtype: "scope2_purchased_steam" },
          },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
