import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/Card";
import { formatKgCO2e } from "@/lib/format";
import type { InputCategory } from "@/types/footprint";

export interface RegisteredInputItem {
  category: InputCategory;
  activityType: string;
  quantity: number;
  unit: string;
  kgCO2e?: number;
}

function formatActivityType(raw: string): string {
  return raw
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface Props {
  inputs: RegisteredInputItem[];
}

export function RegisteredInputsCard({ inputs }: Props) {
  const { t } = useTranslation();

  if (inputs.length === 0) return null;

  const hasKgCO2e = inputs.some((i) => i.kgCO2e != null && i.kgCO2e > 0);

  return (
    <Card>
      <CardContent>
        <h3 className="font-medium mb-4">{t("footprint.detail.inputs")}</h3>
        <div className="space-y-2">
          {inputs.map((input, idx) => (
            <div
              key={idx}
              className="flex justify-between gap-3 py-2 border-b border-gray-50 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {t(
                    `footprint.categories.${input.category}`,
                    formatActivityType(input.category),
                  )}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {formatActivityType(input.activityType)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">
                  {input.quantity} {input.unit}
                </p>
                {hasKgCO2e && input.kgCO2e != null && (
                  <p className="text-xs text-text-secondary">
                    {formatKgCO2e(input.kgCO2e)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
