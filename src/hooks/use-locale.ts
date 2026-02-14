import { useLocaleStore, type SupportedLocale } from '@/stores/locale-store';

export function useLocale() {
  const { locale, setLocale } = useLocaleStore();
  return { locale, setLocale };
}

export const LOCALE_OPTIONS: { value: SupportedLocale; label: string }[] = [
  { value: 'pt-BR', label: 'Portugues (BR)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espanol' },
  { value: 'fr', label: 'Francais' },
];
