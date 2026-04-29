import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const isRequired = props.required;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-base font-medium text-text-secondary mb-1.5">
            {label}
            {isRequired && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-3 border rounded-[var(--radius-input)] bg-surface text-text-primary min-h-[96px]',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
            'placeholder:text-text-secondary/60',
            error ? 'border-error' : 'border-gray-200',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
