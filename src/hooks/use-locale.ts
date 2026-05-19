import { useLocaleStore } from "@/stores/locale-store";

export function useLocale() {
  const { locale, setLocale } = useLocaleStore();
  return { locale, setLocale };
}
