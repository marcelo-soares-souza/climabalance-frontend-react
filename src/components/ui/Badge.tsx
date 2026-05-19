import { cn } from "@/lib/cn";

interface BadgeProps {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "accent"
    | "earth";
  children: React.ReactNode;
  className?: string;
}

const variants = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  accent: "bg-accent/15 text-accent",
  earth: "bg-earth/20 text-amber-800",
};

export function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
