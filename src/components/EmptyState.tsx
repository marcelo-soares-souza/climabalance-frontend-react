import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className,
      )}
    >
      {icon && <div className="text-text-secondary/50 mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-text-secondary mb-6 max-w-md">{description}</p>
      )}
      {action}
    </div>
  );
}
