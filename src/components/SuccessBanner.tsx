import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTranslation } from "react-i18next";

interface SuccessBannerProps {
  message?: string;
  messageKey?: string;
  onDismiss?: () => void;
  className?: string;
}

export function SuccessBanner({
  message,
  messageKey,
  onDismiss,
  className,
}: SuccessBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useTranslation();

  if (dismissed) return null;

  const displayMessage = messageKey
    ? t(`errors.${messageKey}`, {
        defaultValue: t(messageKey, { defaultValue: messageKey }),
      })
    : message;

  return (
    <div
      className={cn(
        "bg-emerald-50 border border-emerald-200 rounded-[var(--radius-card)] p-4 flex items-start gap-3",
        className,
      )}
    >
      <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-emerald-700 flex-1">{displayMessage}</p>
      <button
        onClick={() => {
          setDismissed(true);
          onDismiss?.();
        }}
        className="text-emerald-400 hover:text-emerald-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
