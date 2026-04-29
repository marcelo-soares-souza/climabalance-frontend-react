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
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  const filtered = query
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()),
      )
    : options;

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.parentElement?.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (!val) onChange('');
  }

  function selectOption(opt: ComboboxOption) {
    onChange(opt.value);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
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
        setQuery('');
        break;
    }
  }

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-center gap-2">
          <label htmlFor={id} className="block text-base font-medium text-text-secondary">
            {label}
          </label>
          {labelAdornment}
        </div>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          autoComplete="off"
          placeholder={selectedLabel || placeholder || ''}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full px-4 py-3 pr-10 border rounded-[var(--radius-input)] bg-surface text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
            error ? 'border-error' : 'border-gray-200',
            className,
          )}
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
        />
      </div>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="mt-1 max-h-60 overflow-auto rounded-[var(--radius-input)] border border-gray-200 bg-surface shadow-lg z-50"
        >
          {emptyLabel !== undefined && (
            <button
              type="button"
              role="option"
              aria-selected={value === ''}
              onClick={() => {
                onChange('');
                setQuery('');
                setOpen(false);
                inputRef.current?.focus();
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

      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
