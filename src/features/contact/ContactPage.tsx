import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
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
    <div className="max-w-lg mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">{t('contact.title')}</h1>
      </div>
      <p className="text-text-secondary mb-6">{t('contact.description')}</p>

      {success && (
        <div className="mb-6 p-4 bg-success-50 border border-success/20 rounded-lg text-success text-sm">
          {t('contact.success')}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error/20 rounded-lg text-error text-sm">
          {t(error)}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-1">
            {t('contact.messageLabel')}
          </label>
          <textarea
            id="message"
            rows={6}
            value={message}
            onChange={(e) => { setMessage(e.target.value); setError(null); setSuccess(false); }}
            placeholder={t('contact.messagePlaceholder')}
            required
            className="w-full rounded-lg border border-input-border bg-background px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          {loading ? t('contact.sending') : t('contact.send')}
        </Button>
      </form>
    </div>
  );
}
