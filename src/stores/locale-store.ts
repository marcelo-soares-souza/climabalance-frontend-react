import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "@/config/i18n";

export type SupportedLocale = "pt-BR" | "en" | "es" | "fr";

interface LocaleState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: (localStorage.getItem("cb_locale") as SupportedLocale) || "pt-BR",
      setLocale: (locale: SupportedLocale) => {
        i18n.changeLanguage(locale);
        set({ locale });
      },
    }),
    {
      name: "cb_locale_store",
    },
  ),
);
