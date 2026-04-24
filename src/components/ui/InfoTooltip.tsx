import type { ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { cn } from '@/lib/cn';

interface InfoTooltipProps {
  content: ReactNode;
  ariaLabel: string;
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
}

export function InfoTooltip({
  content,
  ariaLabel,
  className,
  buttonClassName,
  panelClassName,
}: InfoTooltipProps) {
  return (
    <div className={cn('group relative inline-flex', className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        className={cn(
          'inline-flex h-5 w-5 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-primary-50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40',
          buttonClassName,
        )}
      >
        <CircleHelp className="h-4 w-4" />
      </button>
      <div className={cn(
        'pointer-events-none invisible absolute left-0 top-7 z-20 w-72 rounded-[var(--radius-card)] border border-gray-200 bg-white p-3 text-sm text-text-secondary shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100',
        panelClassName,
      )}>
        {content}
      </div>
    </div>
  );
}
