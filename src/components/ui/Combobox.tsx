import { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  id?: string;
  label?: string;
  labelAdornment?: ReactNode;
  placeholder?: string;
  value: string;
  options: ComboboxOption[];
  emptyLabel?: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export function Combobox({
  id,
  label,
  labelAdornment,
  placeholder,
  value,
  options,
  emptyLabel,
  onChange,
  error,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleOpen() {
    setOpen((prev) => !prev);
  }

  function selectOption(opt: ComboboxOption) {
    onChange(opt.value);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((i) =>
          i < filtered.length - 1 ? i + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((i) =>
          i > 0 ? i - 1 : filtered.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          selectOption(filtered[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  }

  const filtered = options;

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <div className="mb-1.5 flex items-center gap-2">
          <label htmlFor={id} className="block text-base font-medium text-text-secondary">
            {label}
          </label>
          {labelAdornment}
        </div>
      )}
      <div className="relative">
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={toggleOpen}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full px-4 py-3 pr-10 border rounded-[var(--radius-input)] bg-surface text-left',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
            error ? 'border-error' : 'border-gray-200',
            value ? 'text-text-primary' : 'text-text-secondary',
            className,
          )}
        >
          {selectedLabel || placeholder || ''}
        </button>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />

        {open && (
          <div
            ref={listRef}
            role="listbox"
            className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-[var(--radius-input)] border border-gray-200 bg-surface shadow-lg"
          >
            {emptyLabel !== undefined && (
              <button
                type="button"
                role="option"
                aria-selected={value === ''}
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100',
                  value === '' ? 'bg-primary-50 font-medium' : 'text-text-secondary',
                )}
              >
                {emptyLabel}
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-text-secondary">No results</div>
            ) : (
              filtered.map((opt, idx) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={value === opt.value}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => selectOption(opt)}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100',
                    highlightedIndex === idx && 'bg-gray-100',
                    value === opt.value && 'bg-primary-50 font-medium text-primary',
                  )}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
