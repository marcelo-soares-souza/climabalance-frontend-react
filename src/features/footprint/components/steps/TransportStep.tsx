import { useTranslation } from "react-i18next";
import { Car, Info } from "lucide-react";
import { CategoryInputCard } from "../CategoryInputCard";
import type { FootprintInput } from "@/types/footprint";

export function TransportStep({
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
          <Car className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            {t("footprint.transport.title")}
          </h3>
          <p className="text-base text-text-secondary">
            {t("footprint.transport.description")}
          </p>
        </div>
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-[var(--radius-card)] p-4 flex gap-3">
        <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <p className="text-base text-text-secondary">
          {t("footprint.transport.tip")}
        </p>
      </div>

      <CategoryInputCard
        category="transport"
        fields={[
          {
            key: "car_medium",
            unit: "km",
            labelKey: "footprint.transport.car",
            metadata: { vehicle_type: "car_medium" },
          },
          {
            key: "motorcycle",
            unit: "km",
            labelKey: "footprint.transport.motorcycle",
            metadata: { vehicle_type: "motorcycle" },
          },
          {
            key: "bus",
            unit: "km",
            labelKey: "footprint.transport.bus",
            metadata: { vehicle_type: "bus" },
          },
          {
            key: "metro",
            unit: "km",
            labelKey: "footprint.transport.metro",
            metadata: { vehicle_type: "metro" },
          },
          {
            key: "train",
            unit: "km",
            labelKey: "footprint.transport.train",
            metadata: { vehicle_type: "train" },
          },
        ]}
        onSave={onSave}
        initialValues={initialValues}
      />
    </div>
  );
}
