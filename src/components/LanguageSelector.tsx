import { Globe } from 'lucide-react';
import { useLocale, LOCALE_OPTIONS } from '@/hooks/use-locale';

export function LanguageSelector() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-text-secondary" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
        className="bg-transparent text-sm text-text-secondary border-none focus:outline-none cursor-pointer"
      >
        {LOCALE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
