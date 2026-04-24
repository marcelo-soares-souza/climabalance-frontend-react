import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/Card";
import { Database, FileText, Lock, ShieldCheck, Trash2, UserRound } from "lucide-react";

export function PrivacyPolicyPage() {
  const { t } = useTranslation();

  const sections = [
    {
      icon: <UserRound className="h-5 w-5 text-primary" />,
      title: t("privacy.sections.dataCollected.title"),
      paragraphs: [
        t("privacy.sections.dataCollected.paragraph1"),
        t("privacy.sections.dataCollected.paragraph2"),
      ],
    },
    {
      icon: <Database className="h-5 w-5 text-accent" />,
      title: t("privacy.sections.howUsed.title"),
      paragraphs: [
        t("privacy.sections.howUsed.paragraph1"),
        t("privacy.sections.howUsed.paragraph2"),
      ],
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-emerald-700" />,
      title: t("privacy.sections.sharing.title"),
      paragraphs: [
        t("privacy.sections.sharing.paragraph1"),
        t("privacy.sections.sharing.paragraph2"),
      ],
    },
    {
      icon: <Lock className="h-5 w-5 text-amber-700" />,
      title: t("privacy.sections.security.title"),
      paragraphs: [
        t("privacy.sections.security.paragraph1"),
        t("privacy.sections.security.paragraph2"),
      ],
    },
    {
      icon: <Trash2 className="h-5 w-5 text-rose-700" />,
      title: t("privacy.sections.deletion.title"),
      paragraphs: [
        t("privacy.sections.deletion.paragraph1"),
        t("privacy.sections.deletion.paragraph2"),
      ],
    },
    {
      icon: <FileText className="h-5 w-5 text-sky-700" />,
      title: t("privacy.sections.rights.title"),
      paragraphs: [
        t("privacy.sections.rights.paragraph1"),
        t("privacy.sections.rights.paragraph2"),
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-2">
      <section className="rounded-3xl bg-gradient-to-br from-primary via-primary-light to-accent px-8 py-14 text-white">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium">
            {t("privacy.hero.eyebrow")}
          </span>
          <h1 className="text-4xl font-bold font-display md:text-5xl">
            {t("privacy.hero.title")}
          </h1>
          <p className="max-w-2xl text-lg text-white/85">
            {t("privacy.hero.description")}
          </p>
          <p className="text-sm text-white/75">
            {t("privacy.hero.versionDateLabel")}: {t("privacy.hero.versionDate")}
          </p>
          <p className="text-sm text-white/75">{t("privacy.hero.effectiveDate")}</p>
        </div>
      </section>

      <Card className="border border-primary/10 bg-primary-50/50 shadow-sm">
        <CardContent className="space-y-4 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("privacy.summary.label")}
          </p>
          <h2 className="text-2xl font-bold font-display text-text-primary">
            {t("privacy.summary.title")}
          </h2>
          <p className="text-base leading-7 text-text-secondary">
            {t("privacy.summary.paragraph1")}
          </p>
          <p className="text-base leading-7 text-text-secondary">
            {t("privacy.summary.paragraph2")}
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
        {t("privacy.footer.lastUpdatedLabel")}: {t("privacy.hero.versionDate")}
      </div>
    </div>
  );
}
