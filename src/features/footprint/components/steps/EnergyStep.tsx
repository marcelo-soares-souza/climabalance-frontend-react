import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Zap, Info } from "lucide-react";
import { CategoryInputCard } from "../CategoryInputCard";
import type { FootprintInput } from "@/types/footprint";
import { PeriodMultiplier, PERIOD_MULTIPLIERS } from "../PeriodMultiplier";

export function EnergyStep({
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
  const [period, setPeriod] = useState<string>("year");

  const handleSave = useCallback(
    (inputs: FootprintInput[], category: FootprintInput["category"]) => {
      const multiplier = PERIOD_MULTIPLIERS[period] ?? 1;
      const adjusted = inputs.map((input) => ({
        ...input,
        value: input.value * multiplier,
        metadata: { ...input.metadata, time_period: period },
      }));
      onSave(adjusted, category);
    },
    [onSave, period],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary-50 rounded-xl">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            {t("footprint.energy.title")}
          </h3>
          <p className="text-base text-text-secondary">
            {t("footprint.energy.description")}
          </p>
        </div>
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-[var(--radius-card)] p-4 flex gap-3">
        <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <p className="text-base text-text-secondary">
          {t("footprint.energy.tip")}
        </p>
      </div>

      <PeriodMultiplier period={period} onChange={setPeriod} />

      <CategoryInputCard
        category="energy"
        fields={[
          {
            key: "electricity",
            unit: "kwh",
            displayUnit: "kWh",
            labelKey: "footprint.energy.electricity",
            metadata: {},
          },
        ]}
        onSave={handleSave}
        initialValues={initialValues}
      />
    </div>
  );
}
