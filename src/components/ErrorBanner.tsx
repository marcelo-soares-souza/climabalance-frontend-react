import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTranslation } from 'react-i18next';

interface ErrorBannerProps {
  message?: string;
  messageKey?: string;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorBanner({ message, messageKey, onDismiss, className }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useTranslation();

  if (dismissed) return null;

  const displayMessage = messageKey ? t(`errors.${messageKey}`, messageKey) : message;

  return (
    <div className={cn('bg-red-50 border border-red-200 rounded-[var(--radius-card)] p-4 flex items-start gap-3', className)}>
      <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-700 flex-1">{displayMessage}</p>
      <button
        onClick={() => { setDismissed(true); onDismiss?.(); }}
        className="text-red-400 hover:text-red-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
