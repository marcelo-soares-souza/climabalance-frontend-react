import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { ResultBreakdownChart } from "./ResultBreakdownChart";
import {
  RegisteredInputsCard,
  type RegisteredInputItem,
} from "./RegisteredInputsCard";
import { formatTCO2e, formatKgCO2e } from "@/lib/format";
import type { CalculationResult } from "@/types/footprint";
import {
  TreePine,
  BarChart3,
  Leaf,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface Props {
  result: CalculationResult;
  inputs?: RegisteredInputItem[];
  onSaveDraft?: () => void;
  onFinalize?: () => void;
  saving?: boolean;
  showCompensateAction?: boolean;
}

export function ResultStep({
  result,
  inputs,
  onSaveDraft,
  onFinalize,
  saving,
  showCompensateAction = true,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canFinalize = result.status === "draft" && !!onFinalize;

  const brazilAvg = 2.0;
  const globalAvg = 4.0;
  const isBelowAvg = result.totalTCO2e <= brazilAvg;

  return (
    <div className="space-y-6">
      {/* Total Card */}
      <Card className="bg-gradient-to-br from-primary via-primary-light to-accent text-white overflow-hidden">
        <CardContent className="py-10 text-center relative">
          <Leaf className="absolute top-4 right-4 h-16 w-16 text-white/10" />
          <div className="inline-flex items-center gap-2 text-base opacity-80 mb-2">
            {t("footprint.result.totalEmissions")}{" "}
            <InfoTooltip
              ariaLabel={t("tooltips.footprint.totalEmissionsAria")}
              content={<p>{t("tooltips.footprint.totalEmissions")}</p>}
            />
          </div>
          <p className="text-5xl font-bold mb-2">
            {formatTCO2e(result.totalTCO2e)}
          </p>
          <p className="text-base opacity-70">
            {formatKgCO2e(result.totalKgCO2e)}
          </p>
          {isBelowAvg && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-base">
              <TrendingDown className="h-4 w-4" />
              {t("footprint.result.belowAverage")}
            </div>
          )}
          {!isBelowAvg && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-base">
              <TrendingUp className="h-4 w-4" />
              {t("footprint.result.aboveAverage")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison */}
      <Card>
        <CardContent>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />{" "}
            {t("footprint.result.comparison")}
          </h3>
          <div className="space-y-4">
            <ComparisonBar
              label={t("footprint.result.you")}
              value={result.totalTCO2e}
              max={Math.max(result.totalTCO2e, brazilAvg, globalAvg) * 1.2}
              color="bg-primary"
            />
            <ComparisonBar
              label={t("footprint.result.brazilAvg")}
              value={brazilAvg}
              max={Math.max(result.totalTCO2e, brazilAvg, globalAvg) * 1.2}
              color="bg-amber-500"
            />
            <ComparisonBar
              label={t("footprint.result.globalAvg")}
              value={globalAvg}
              max={Math.max(result.totalTCO2e, brazilAvg, globalAvg) * 1.2}
              color="bg-red-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Chart */}
      {result.breakdown && result.breakdown.length > 0 && (
        <Card>
          <CardContent className="px-0">
            <h3 className="font-semibold text-lg mb-4 px-6">
              {t("footprint.result.breakdown")}
            </h3>
            <ResultBreakdownChart breakdown={result.breakdown} />
          </CardContent>
        </Card>
      )}

      {/* Registered Inputs */}
      {inputs && inputs.length > 0 && <RegisteredInputsCard inputs={inputs} />}

      {/* Compensate CTA */}
      <Card className="bg-accent/5 border border-accent/20">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent/15 rounded-xl">
              <TreePine className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {t("footprint.result.compensateTitle")}
                </h3>
                <InfoTooltip
                  ariaLabel={t("tooltips.footprint.compensateAria")}
                  content={<p>{t("tooltips.footprint.compensate")}</p>}
                />
              </div>
              <p className="text-base text-text-secondary mt-1">
                {t("footprint.result.compensateDescription")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onSaveDraft && (
          <Button
            variant="outline"
            onClick={onSaveDraft}
            loading={saving}
            className="flex-1"
          >
            {t("footprint.result.saveDraft")}
          </Button>
        )}
        {canFinalize && (
          <Button
            variant="secondary"
            onClick={onFinalize}
            loading={saving}
            className="flex-1"
          >
            {t("footprint.result.finalize")}
          </Button>
        )}
        {showCompensateAction && (
          <Button
            onClick={() =>
              navigate(
                `/map?calculationId=${encodeURIComponent(result.id)}&tCO2e=${encodeURIComponent(result.totalTCO2e)}`,
              )
            }
            className="flex-1"
          >
            <TreePine className="h-4 w-4 mr-2" />
            {t("footprint.result.compensate")}
          </Button>
        )}
      </div>
    </div>
  );
}

function ComparisonBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-base mb-1.5">
        <span className="font-medium">{label}</span>
        <span className="font-semibold">{formatTCO2e(value)}</span>
      </div>
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
