import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/Card";
import { FileText, Gavel, UserCircle, CreditCard, ShieldCheck, AlertTriangle, Ban, RefreshCw, Mail } from "lucide-react";

export function TermsOfUsePage() {
  const { t } = useTranslation();

  const sections = [
    {
      icon: <Gavel className="h-5 w-5 text-primary" />,
      title: t("termsOfUse.sections.acceptance.title"),
      paragraphs: [t("termsOfUse.sections.acceptance.body")],
    },
    {
      icon: <FileText className="h-5 w-5 text-accent" />,
      title: t("termsOfUse.sections.services.title"),
      paragraphs: [t("termsOfUse.sections.services.body")],
    },
    {
      icon: <UserCircle className="h-5 w-5 text-emerald-700" />,
      title: t("termsOfUse.sections.account.title"),
      paragraphs: [t("termsOfUse.sections.account.body")],
    },
    {
      icon: <CreditCard className="h-5 w-5 text-amber-700" />,
      title: t("termsOfUse.sections.payments.title"),
      paragraphs: [t("termsOfUse.sections.payments.body")],
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-sky-700" />,
      title: t("termsOfUse.sections.content.title"),
      paragraphs: [t("termsOfUse.sections.content.body")],
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-rose-700" />,
      title: t("termsOfUse.sections.liability.title"),
      paragraphs: [t("termsOfUse.sections.liability.body")],
    },
    {
      icon: <Ban className="h-5 w-5 text-purple-700" />,
      title: t("termsOfUse.sections.termination.title"),
      paragraphs: [t("termsOfUse.sections.termination.body")],
    },
    {
      icon: <RefreshCw className="h-5 w-5 text-indigo-700" />,
      title: t("termsOfUse.sections.changes.title"),
      paragraphs: [t("termsOfUse.sections.changes.body")],
    },
    {
      icon: <Mail className="h-5 w-5 text-teal-700" />,
      title: t("termsOfUse.sections.contact.title"),
      paragraphs: [t("termsOfUse.sections.contact.body")],
    },
  ];

  return (
    <>
      <SEO title={t('seo.termsOfUse.title')} />
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
            {t("termsOfUse.hero.lastUpdatedLabel")}: {t("termsOfUse.hero.lastUpdated")}
          </p>
        </div>
      </section>

      <Card className="border border-primary/10 bg-primary-50/50 shadow-sm">
        <CardContent className="space-y-4 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("termsOfUse.summary.label")}
          </p>
          <h2 className="text-2xl font-bold font-display text-text-primary">
            {t("termsOfUse.summary.title")}
          </h2>
          <p className="text-base leading-7 text-text-secondary">
            {t("termsOfUse.summary.paragraph")}
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-5 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title} className="border-0 shadow-sm ring-1 ring-black/5">
            <CardContent className="space-y-4 py-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold text-text-primary">{section.title}</h2>
              </div>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-base leading-7 text-text-secondary">
                  {paragraph}
                </p>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="pb-6 text-sm text-text-secondary">
        {t("termsOfUse.footer.lastUpdatedLabel")}: {t("termsOfUse.hero.lastUpdated")}
      </div>
    </div>
    </>
  );
}