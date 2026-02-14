import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';

export function EmbedDemoPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">{t('embed.demo.title')}</h1>
      <p className="text-text-secondary">{t('embed.demo.description')}</p>
      <Card>
        <CardContent className="p-0">
          <iframe
            src="/embed/calculator"
            className="w-full border-0"
            style={{ height: '600px' }}
            title="ClimaBalance Calculator"
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h3 className="font-medium mb-2">{t('embed.demo.codeTitle')}</h3>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
            {`<iframe src="${window.location.origin}/embed/calculator" width="100%" height="600" frameborder="0"></iframe>`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
