import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Building2, Leaf, Sprout, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type AccountTab = 'individual' | 'legalEntity' | 'producer';

export function HowToUsePlatformPage() {
  const { t } = useTranslation();

  const tabMeta: Array<{ key: AccountTab; icon: JSX.Element }> = [
    { key: 'individual', icon: <Leaf className="h-5 w-5 text-primary" /> },
    { key: 'legalEntity', icon: <Building2 className="h-5 w-5 text-accent" /> },
    { key: 'producer', icon: <Sprout className="h-5 w-5 text-emerald-700" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-2">
      <section className="rounded-3xl bg-gradient-to-br from-primary via-primary-light to-accent px-8 py-12 text-white">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-medium">
            {t('howToUse.eyebrow')}
          </span>
          <h1 className="text-4xl font-bold font-display md:text-5xl">
            {t('howToUse.title')}
          </h1>
          <p className="max-w-2xl text-lg text-white/85">
            {t('howToUse.description')}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                {t('howToUse.primaryCta')}
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                {t('howToUse.secondaryCta')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 border-b-0">
          {tabMeta.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 data-[active=true]:border-primary"
            >
              {tab.icon}
              {t(`howToUse.tabs.${tab.key}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabMeta.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="pt-0">
            <TabPanel type={tab.key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function TabPanel({ type }: { type: AccountTab }) {
  const { t } = useTranslation();

  const steps = [1, 2, 3, 4, 5].map((index) => ({
    title: t(`howToUse.${type}.steps.step${index}.title`),
    description: t(`howToUse.${type}.steps.step${index}.description`),
  }));

  const features = [1, 2, 3].map((index) =>
    t(`howToUse.${type}.features.item${index}`)
  );

  const possibilities = [1, 2, 3].map((index) =>
    t(`howToUse.${type}.possibilities.item${index}`)
  );

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm ring-1 ring-black/5">
        <CardContent className="space-y-3 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t('howToUse.overviewLabel')}
          </p>
          <h2 className="text-3xl font-bold font-display text-text-primary">
            {t(`howToUse.${type}.title`)}
          </h2>
          <p className="text-base text-text-secondary">
            {t(`howToUse.${type}.summary`)}
          </p>
          <p className="text-base text-text-secondary">
            {t(`howToUse.${type}.forWho`)}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t('howToUse.stepsLabel')}
          </p>
          <h3 className="text-2xl font-bold font-display text-text-primary">
            {t(`howToUse.${type}.steps.title`)}
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {steps.map((step, index) => (
            <Card key={step.title} className="border-0 shadow-sm ring-1 ring-black/5">
              <CardContent className="space-y-3 py-6">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <h4 className="font-semibold text-text-primary">{step.title}</h4>
                <p className="text-sm text-text-secondary">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="border-0 shadow-sm ring-1 ring-black/5">
          <CardContent className="space-y-4 py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t('howToUse.featuresLabel')}
            </p>
            <h3 className="text-xl font-bold text-text-primary">
              {t(`howToUse.${type}.features.title`)}
            </h3>
            <div className="space-y-3">
              {features.map((item) => (
                <p key={item} className="text-base text-text-secondary">
                  {item}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-black/5">
          <CardContent className="space-y-4 py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t('howToUse.possibilitiesLabel')}
            </p>
            <h3 className="text-xl font-bold text-text-primary">
              {t(`howToUse.${type}.possibilities.title`)}
            </h3>
            <div className="space-y-3">
              {possibilities.map((item) => (
                <p key={item} className="text-base text-text-secondary">
                  {item}
                </p>
              ))}
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              {t(`howToUse.${type}.cta`)}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
