import { useTranslation } from "react-i18next";
import { Plane, Info } from "lucide-react";
import { CategoryInputCard } from "../CategoryInputCard";
import type { FootprintInput } from "@/types/footprint";

export function FlightsStep({
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
          <Plane className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            {t("footprint.flights.title")}
          </h3>
          <p className="text-base text-text-secondary">
            {t("footprint.flights.description")}
          </p>
        </div>
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-[var(--radius-card)] p-4 flex gap-3">
        <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <p className="text-base text-text-secondary">
          {t("footprint.flights.tip")}
        </p>
      </div>

      <CategoryInputCard
        category="flights"
        fields={[
          {
            key: "domestic_economy",
            unit: "km",
            labelKey: "footprint.flights.domesticEconomy",
            metadata: { flight_type: "domestic", class: "economy" },
            tooltipKey: "tooltips.footprint.domesticEconomy",
          },
          {
            key: "domestic_business",
            unit: "km",
            labelKey: "footprint.flights.domesticBusiness",
            metadata: { flight_type: "domestic", class: "business" },
            tooltipKey: "tooltips.footprint.domesticBusiness",
          },
          {
            key: "international_economy",
            unit: "km",
            labelKey: "footprint.flights.internationalEconomy",
            metadata: { flight_type: "international", class: "economy" },
            tooltipKey: "tooltips.footprint.internationalEconomy",
          },
          {
            key: "international_business",
            unit: "km",
            labelKey: "footprint.flights.internationalBusiness",
            metadata: { flight_type: "international", class: "business" },
            tooltipKey: "tooltips.footprint.internationalBusiness",
          },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
