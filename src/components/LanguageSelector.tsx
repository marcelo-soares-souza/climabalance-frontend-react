import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/cn';
import { getLocaleOptions } from '@/lib/options';

interface LanguageSelectorProps {
  dark?: boolean;
}

export function LanguageSelector({ dark }: LanguageSelectorProps) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const localeOptions = getLocaleOptions(t);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-gray-200">
      <Globe className={cn('h-4 w-4', dark ? 'text-white/50' : 'text-text-secondary')} />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
        className={cn(
          'bg-transparent text-base border-none focus:outline-none cursor-pointer pr-1',
          dark ? 'text-white/70' : 'text-text-secondary',
        )}
      >
        {localeOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-text-primary bg-surface">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
