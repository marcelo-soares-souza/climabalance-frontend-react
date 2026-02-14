import type { ReactNode } from 'react';
import { Leaf } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary to-primary-light flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-white">
          <Leaf className="h-6 w-6" />
          <span className="font-semibold text-lg">ClimaBalance</span>
        </div>
        <LanguageSelector />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-surface rounded-[var(--radius-card)] shadow-xl w-full max-w-md p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
