import { forwardRef, type ReactNode, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelAdornment?: ReactNode;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      labelAdornment,
      error,
      options,
      placeholder,
      id,
      ...props
    },
    ref,
  ) => {
    const isRequired = props.required;
    return (
      <div className="w-full">
        {label && (
          <div className="mb-1.5 flex items-center gap-2">
            <label
              htmlFor={id}
              className="block text-base font-medium text-text-secondary"
            >
              {label}
              {isRequired && <span className="text-error ml-0.5">*</span>}
            </label>
            {labelAdornment}
          </div>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              "w-full px-4 py-3 pr-10 border rounded-[var(--radius-input)] bg-surface text-text-primary",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
              "appearance-none",
              error ? "border-error" : "border-gray-200",
              className,
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        </div>
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
