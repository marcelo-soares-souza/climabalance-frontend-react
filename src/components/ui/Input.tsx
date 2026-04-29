import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelAdornment?: ReactNode;
  error?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, labelAdornment, error, suffix, id, ...props }, ref) => {
    const isRequired = props.required;
    return (
      <div className="w-full">
        {label && (
          <div className="mb-1.5 flex items-center gap-2">
            <label htmlFor={id} className="block text-base font-medium text-text-secondary">
              {label}
              {isRequired && <span className="text-error ml-0.5">*</span>}
            </label>
            {labelAdornment}
          </div>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full px-4 py-3 border rounded-[var(--radius-input)] bg-surface text-text-primary',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
              'placeholder:text-text-secondary/60',
              error ? 'border-error' : 'border-gray-200',
              suffix && 'pr-14',
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-text-secondary pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
