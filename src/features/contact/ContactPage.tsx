import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { contactService } from '@/services/contact';
import { ApiError } from '@/lib/api-client';
import { MessageSquare } from 'lucide-react';

export function ContactPage() {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!message.trim()) return;

    setLoading(true);
    try {
      await contactService.send(message.trim());
      setSuccess(true);
      setMessage('');
    } catch (err) {
      setError(err instanceof ApiError ? err.messageKey : 'request.failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t('contact.title')}</h1>
      </div>

      <Card>
        <CardContent className="space-y-6 py-8">
          <p className="text-sm text-text-secondary">
            {t('contact.description')}
          </p>

          {success && (
            <div className="p-4 bg-success-50 border border-success/20 rounded-lg text-success text-sm">
              {t('contact.success')}
            </div>
          )}

          {error && <ErrorBanner messageKey={error} onDismiss={() => setError(null)} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-base font-medium text-text-secondary mb-1.5">
                {t('contact.messageLabel')} <span className="text-error ml-0.5">*</span>
              </label>
              <textarea
                id="message"
                rows={6}
                value={message}
                onChange={(e) => { setMessage(e.target.value); setError(null); setSuccess(false); }}
                placeholder={t('contact.messagePlaceholder')}
                required
                className="w-full px-4 py-3 border rounded-[var(--radius-input)] bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-text-secondary/60 resize-none"
              />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              {loading ? t('contact.sending') : t('contact.send')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
