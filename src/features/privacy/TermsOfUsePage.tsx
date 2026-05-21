import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/Card";
import {
  FileText,
  Gavel,
  UserCircle,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Ban,
  Scale,
  RefreshCw,
  Mail,
} from "lucide-react";
import type { ReactNode } from "react";

type SectionConfig = {
  key: string;
  icon: ReactNode;
};

const sectionConfig: SectionConfig[] = [
  {
    key: "electronicAcceptance",
    icon: <Gavel className="h-5 w-5 text-primary" />,
  },
  { key: "acceptance", icon: <Gavel className="h-5 w-5 text-primary" /> },
  { key: "definitions", icon: <FileText className="h-5 w-5 text-accent" /> },
  { key: "platformRole", icon: <FileText className="h-5 w-5 text-accent" /> },
  { key: "estimates", icon: <FileText className="h-5 w-5 text-emerald-700" /> },
  {
    key: "noGuarantee",
    icon: <AlertTriangle className="h-5 w-5 text-amber-700" />,
  },
  {
    key: "certificates",
    icon: <ShieldCheck className="h-5 w-5 text-sky-700" />,
  },
  {
    key: "userAccounts",
    icon: <UserCircle className="h-5 w-5 text-emerald-700" />,
  },
  { key: "aml", icon: <ShieldCheck className="h-5 w-5 text-rose-700" /> },
  {
    key: "partnerAccounts",
    icon: <UserCircle className="h-5 w-5 text-purple-700" />,
  },
  {
    key: "projectInfo",
    icon: <FileText className="h-5 w-5 text-indigo-700" />,
  },
  { key: "risks", icon: <AlertTriangle className="h-5 w-5 text-rose-700" /> },
  { key: "payments", icon: <CreditCard className="h-5 w-5 text-amber-700" /> },
  { key: "taxes", icon: <CreditCard className="h-5 w-5 text-cyan-700" /> },
  { key: "refunds", icon: <RefreshCw className="h-5 w-5 text-teal-700" /> },
  {
    key: "intellectualProperty",
    icon: <ShieldCheck className="h-5 w-5 text-sky-700" />,
  },
  { key: "privacy", icon: <ShieldCheck className="h-5 w-5 text-primary" /> },
  {
    key: "disclaimer",
    icon: <AlertTriangle className="h-5 w-5 text-rose-700" />,
  },
  {
    key: "liability",
    icon: <AlertTriangle className="h-5 w-5 text-rose-700" />,
  },
  {
    key: "indemnification",
    icon: <ShieldCheck className="h-5 w-5 text-purple-700" />,
  },
  { key: "classAction", icon: <Gavel className="h-5 w-5 text-indigo-700" /> },
  {
    key: "compliance",
    icon: <ShieldCheck className="h-5 w-5 text-cyan-700" />,
  },
  { key: "termination", icon: <Ban className="h-5 w-5 text-purple-700" /> },
  { key: "governingLaw", icon: <Scale className="h-5 w-5 text-cyan-700" /> },
  { key: "changes", icon: <RefreshCw className="h-5 w-5 text-indigo-700" /> },
  { key: "contact", icon: <Mail className="h-5 w-5 text-teal-700" /> },
];

export function TermsOfUsePage() {
  const { t } = useTranslation();

  return (
    <>
      <SEO title={t("seo.termsOfUse.title")} />
      <div className="max-w-5xl mx-auto space-y-8 py-2">
        <section className="rounded-3xl bg-gradient-to-br from-primary via-primary-light to-accent px-8 py-14 text-white">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium">
              {t("termsOfUse.hero.eyebrow")}
            </span>
            <h1 className="text-4xl font-bold font-display md:text-5xl">
              {t("termsOfUse.hero.title")}
            </h1>
            <p className="max-w-2xl text-lg text-white/85">
              {t("termsOfUse.hero.description")}
            </p>
            <p className="text-sm text-white/75">
              {t("termsOfUse.hero.lastUpdatedLabel")}:{" "}
              {t("termsOfUse.hero.lastUpdated")}
            </p>
          </div>
        </section>

        <Card className="border border-primary/10 bg-primary-50/50 shadow-sm">
          <CardContent className="space-y-4 py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t("termsOfUse.summary.label")}
            </p>
            <p className="text-base leading-7 text-text-secondary">
              {t("termsOfUse.summary.paragraph")}
            </p>
          </CardContent>
        </Card>

        <section className="grid gap-5 md:grid-cols-2">
          {sectionConfig.map(({ key, icon }) => (
            <Card key={key} className="border-0 shadow-sm ring-1 ring-black/5">
              <CardContent className="space-y-4 py-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                    {icon}
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary">
                    {t(`termsOfUse.sections.${key}.title`)}
                  </h2>
                </div>
                <p className="text-base leading-7 text-text-secondary">
                  {t(`termsOfUse.sections.${key}.body`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="pb-6 text-sm text-text-secondary">
          {t("termsOfUse.footer.lastUpdatedLabel")}:{" "}
          {t("termsOfUse.hero.lastUpdated")}
        </div>
      </div>
    </>
  );
}
