import { Badge } from "@/components/ui/Badge";
import { useTranslation } from "react-i18next";

interface StatusBadgeProps {
  status: string;
  className?: string;
  tooltip?: string;
}

const statusVariants: Record<
  string,
  "default" | "success" | "warning" | "error" | "info"
> = {
  draft: "default",
  pending: "warning",
  pending_audit: "warning",
  approved: "info",
  active: "success",
  inactive: "default",
  rejected: "error",
  suspended: "error",
  paid: "success",
  canceled: "error",
  failed: "error",
  refunded: "warning",
  finalized: "success",
  issued: "success",
  revoked: "error",
};

export function StatusBadge({ status, className, tooltip }: StatusBadgeProps) {
  const { t } = useTranslation();
  const variant = statusVariants[status] || "default";
  return (
    <Badge variant={variant} className={className} title={tooltip}>
      {t(`common.status.${status}`, status)}
    </Badge>
  );
}
