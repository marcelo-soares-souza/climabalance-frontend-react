import { useTranslation } from "react-i18next";
import { useOnline } from "@/hooks/use-online";

export function OfflineBanner() {
  const online = useOnline();
  const { t } = useTranslation();

  if (online) return null;

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
      {t("common.offline")}
    </div>
  );
}
