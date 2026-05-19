import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Plane, TreePine, ArrowRight, Leaf } from "lucide-react";
import { formatTCO2e, formatKgCO2e } from "@/lib/format";

const MAJOR_CITIES = [
  { name: "São Paulo", state: "SP", lat: -23.5505, lng: -46.6333 },
  { name: "Rio de Janeiro", state: "RJ", lat: -22.9068, lng: -43.1729 },
  { name: "Belo Horizonte", state: "MG", lat: -19.9167, lng: -43.9345 },
  { name: "Brasília", state: "DF", lat: -15.7975, lng: -47.8919 },
  { name: "Salvador", state: "BA", lat: -12.9714, lng: -38.5014 },
  { name: "Fortaleza", state: "CE", lat: -3.7172, lng: -38.5433 },
  { name: "Curitiba", state: "PR", lat: -25.429, lng: -49.2671 },
  { name: "Recife", state: "PE", lat: -8.0476, lng: -34.877 },
  { name: "Porto Alegre", state: "RS", lat: -30.0346, lng: -51.2177 },
  { name: "Manaus", state: "AM", lat: -3.119, lng: -60.0217 },
  { name: "Belém", state: "PA", lat: -1.4558, lng: -48.4902 },
  { name: "Goiânia", state: "GO", lat: -16.6869, lng: -49.2648 },
  { name: "Florianópolis", state: "SC", lat: -27.5954, lng: -48.5482 },
  { name: "Vitória", state: "ES", lat: -20.3155, lng: -40.3128 },
  { name: "Campo Grande", state: "MS", lat: -20.4697, lng: -54.6201 },
  { name: "Natal", state: "RN", lat: -5.7793, lng: -35.2009 },
  { name: "João Pessoa", state: "PB", lat: -7.115, lng: -34.8631 },
  { name: "São Luís", state: "MA", lat: -2.5307, lng: -44.3068 },
  { name: "Maceió", state: "AL", lat: -9.6663, lng: -35.735 },
  { name: "Cuiabá", state: "MT", lat: -15.601, lng: -56.0979 },
  { name: "Aracaju", state: "SE", lat: -10.9472, lng: -37.0731 },
  { name: "Palmas", state: "TO", lat: -10.2491, lng: -48.3243 },
  { name: "Teresina", state: "PI", lat: -5.0892, lng: -42.8019 },
  { name: "Rio Branco", state: "AC", lat: -9.974, lng: -67.8076 },
  { name: "Porto Velho", state: "RO", lat: -8.7619, lng: -63.9039 },
  { name: "Boa Vista", state: "RR", lat: 2.8235, lng: -60.6753 },
  { name: "Macapá", state: "AP", lat: 0.0356, lng: -51.0705 },
];

const EMISSION_FACTOR = 0.255;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function calcDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function cityLabel(c: { name: string; state: string }) {
  return `${c.name} (${c.state})`;
}

export function TripCalculatorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [originIdx, setOriginIdx] = useState<number | null>(null);
  const [destIdx, setDestIdx] = useState<number | null>(null);
  const [flightClass, setFlightClass] = useState<"economy" | "business">(
    "economy",
  );

  const result = useMemo(() => {
    if (originIdx === null || destIdx === null || originIdx === destIdx)
      return null;
    const origin = MAJOR_CITIES[originIdx];
    const dest = MAJOR_CITIES[destIdx];
    const distance = calcDistance(origin.lat, origin.lng, dest.lat, dest.lng);
    const multiplier = flightClass === "business" ? 1.5 : 1;
    const kgCO2e = distance * EMISSION_FACTOR * multiplier * 2;
    return {
      distance: Math.round(distance),
      kgCO2e: Math.round(kgCO2e * 100) / 100,
      origin,
      dest,
    };
  }, [originIdx, destIdx, flightClass]);

  const cityOptions = MAJOR_CITIES.map((c, i) => ({
    value: String(i),
    label: cityLabel(c),
  }));

  return (
    <>
      <SEO title={t("seo.tripCalculator.title")} />
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 rounded-xl">
            <Plane className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">
              {t("footprint.tripCalculator.title")}
            </h1>
            <p className="text-base text-text-secondary">
              {t("footprint.tripCalculator.description")}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4 py-6">
            <Select
              label={t("footprint.tripCalculator.origin")}
              placeholder={t("footprint.tripCalculator.selectCity")}
              options={cityOptions}
              value={originIdx !== null ? String(originIdx) : ""}
              onChange={(e) =>
                setOriginIdx(e.target.value ? Number(e.target.value) : null)
              }
            />
            <Select
              label={t("footprint.tripCalculator.destination")}
              placeholder={t("footprint.tripCalculator.selectCity")}
              options={cityOptions}
              value={destIdx !== null ? String(destIdx) : ""}
              onChange={(e) =>
                setDestIdx(e.target.value ? Number(e.target.value) : null)
              }
            />

            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">
                {t("footprint.tripCalculator.class")}
              </p>
              <div className="flex gap-2">
                {(["economy", "business"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFlightClass(c)}
                    className={`px-4 py-2 rounded-[var(--radius-button)] text-sm border transition-all ${
                      flightClass === c
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "border-gray-200 hover:border-primary hover:bg-primary-50"
                    }`}
                  >
                    {t(`footprint.tripCalculator.${c}`)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className="bg-gradient-to-br from-primary via-primary-light to-accent text-white overflow-hidden">
            <CardContent className="py-8 text-center relative">
              <Leaf className="absolute top-4 right-4 h-16 w-16 text-white/10" />
              <p className="text-base opacity-80 mb-1">
                {t("footprint.tripCalculator.resultLabel")}
              </p>
              <p className="text-2xl font-bold mb-1">
                {result.origin.name} → {result.dest.name}
              </p>
              <p className="text-sm opacity-70 mb-4">
                {t("footprint.tripCalculator.distance")}: {result.distance} km
              </p>
              <p className="text-4xl font-bold mb-1">
                {formatKgCO2e(result.kgCO2e)}
              </p>
              <p className="text-base opacity-70">
                {formatTCO2e(result.kgCO2e / 1000)}
              </p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Button
            className="w-full"
            size="lg"
            onClick={() =>
              navigate(
                `/map?tCO2e=${encodeURIComponent((result.kgCO2e / 1000).toFixed(4))}`,
              )
            }
          >
            <TreePine className="h-5 w-5 mr-2" />
            {t("footprint.tripCalculator.compensate")}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        )}
      </div>
    </>
  );
}
