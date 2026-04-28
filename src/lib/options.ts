import type { TFunction } from 'i18next';
import type { SupportedLocale } from '@/stores/locale-store';

const localeLabelKeys: Record<SupportedLocale, string> = {
  'pt-BR': 'ptBR',
  en: 'en',
  es: 'es',
  fr: 'fr',
};

const userStatuses = ['active', 'pending', 'suspended'] as const;

export function getLocaleLabel(locale: SupportedLocale, t: TFunction): string {
  return t(`common.locales.${localeLabelKeys[locale]}`);
}

export function getLocaleOptions(t: TFunction): Array<{ value: SupportedLocale; label: string }> {
  return (Object.keys(localeLabelKeys) as SupportedLocale[]).map((locale) => ({
    value: locale,
    label: getLocaleLabel(locale, t),
  }));
}

export function getUserStatusOptions(
  t: TFunction,
  options?: { includeAll?: boolean },
): Array<{ value: string; label: string }> {
  const entries = userStatuses.map((status) => ({
    value: status,
    label: t(`common.status.${status}`),
  }));

  if (options?.includeAll) {
    return [{ value: '', label: t('common.allStatuses') }, ...entries];
  }

  return entries;
}
