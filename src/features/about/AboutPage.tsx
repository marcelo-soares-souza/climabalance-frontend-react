import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  ArrowRight,
  BadgeCheck,
  Globe,
  Heart,
  Leaf,
  MapPinned,
  Target,
  Trees,
} from "lucide-react";

export function AboutPage() {
  const { t } = useTranslation();

  const howItWorks = [
    {
      icon: <Leaf className="h-6 w-6 text-primary" />,
      title: t("about.howItWorks.step1Title"),
      description: t("about.howItWorks.step1Description"),
    },
    {
      icon: <MapPinned className="h-6 w-6 text-accent" />,
      title: t("about.howItWorks.step2Title"),
      description: t("about.howItWorks.step2Description"),
    },
    {
      icon: <BadgeCheck className="h-6 w-6 text-amber-600" />,
      title: t("about.howItWorks.step3Title"),
      description: t("about.howItWorks.step3Description"),
    },
  ];

  const objectives = [
    {
      icon: <Target className="h-5 w-5 text-primary" />,
      title: t("about.objectives.card1Title"),
      description: t("about.objectives.card1Description"),
    },
    {
      icon: <Trees className="h-5 w-5 text-accent" />,
      title: t("about.objectives.card2Title"),
      description: t("about.objectives.card2Description"),
    },
    {
      icon: <Globe className="h-5 w-5 text-emerald-700" />,
      title: t("about.objectives.card3Title"),
      description: t("about.objectives.card3Description"),
    },
  ];

  return (
    <>
      <SEO title={t('seo.about.title')} description={t('seo.about.description')} />
      <div className="max-w-6xl mx-auto space-y-10 py-2">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-light to-accent px-8 py-14 text-white">
        <Leaf className="absolute -right-5 -top-5 h-36 w-36 rotate-12 text-white/10" />
        <Leaf className="absolute -bottom-6 -left-6 h-24 w-24 -rotate-45 text-white/10" />
        <div className="relative max-w-3xl space-y-5">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium">
            {t("about.hero.eyebrow")}
          </span>
          <h1 className="text-4xl font-bold font-display md:text-5xl">
            {t("about.hero.title")}
          </h1>
          <p className="max-w-2xl text-lg text-white/85">
            {t("about.hero.description")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/map">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
              >
                {t("about.hero.primaryCta")}
              </Button>
            </Link>
            <Link to="/register">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10"
              >
                {t("about.hero.secondaryCta")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-4 py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t("about.whatIs.label")}
            </p>
            <h2 className="text-3xl font-bold font-display text-text-primary">
              {t("about.whatIs.title")}
            </h2>
            <p className="text-base leading-7 text-text-secondary">
              {t("about.whatIs.paragraph1")}
            </p>
            <p className="text-base leading-7 text-text-secondary">
              {t("about.whatIs.paragraph2")}
            </p>
            <p className="text-base leading-7 text-text-secondary">
              {t("about.whatIs.paragraph3")}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-primary/10 bg-primary-50/60 shadow-sm">
          <CardContent className="space-y-4 py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t("about.partnerCall.label")}
            </p>
            <h2 className="text-2xl font-bold font-display text-text-primary">
              {t("about.partnerCall.title")}
            </h2>
            <p className="text-base leading-7 text-text-secondary">
              {t("about.partnerCall.description")}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              {t("about.partnerCall.link")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("about.howItWorks.label")}
          </p>
          <h2 className="text-3xl font-bold font-display text-text-primary">
            {t("about.howItWorks.title")}
          </h2>
          <p className="max-w-3xl text-base text-text-secondary">
            {t("about.howItWorks.description")}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {howItWorks.map((item) => (
            <Card
              key={item.title}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="space-y-4 py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-text-primary">
                  {item.title}
                </h3>
                <p className="text-base leading-7 text-text-secondary">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t("about.objectives.label")}
          </p>
          <h2 className="text-3xl font-bold font-display text-text-primary">
            {t("about.objectives.title")}
          </h2>
          <p className="max-w-3xl text-base text-text-secondary">
            {t("about.objectives.description")}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {objectives.map((item) => (
            <Card
              key={item.title}
              className="border-0 bg-surface shadow-sm ring-1 ring-black/5"
            >
              <CardContent className="space-y-4 py-8">
                <div className="flex items-center gap-3">
                  {item.icon}
                  <h3 className="text-lg font-semibold text-text-primary">
                    {item.title}
                  </h3>
                </div>
                <p className="text-base leading-7 text-text-secondary">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-primary/10 bg-primary-50/40 px-8 py-6 text-center">
        <Heart className="mx-auto mb-2 h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-text-primary mb-1">
          {t("support.title")}
        </h3>
        <p className="text-sm text-text-secondary">
          {t("support.description")}{" "}
          <a
            href="https://ko-fi.com/agroecologymap"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {t("support.action")}
          </a>
        </p>
      </section>
    </div>
    </>
  );
}
