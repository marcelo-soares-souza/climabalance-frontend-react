import { Menu, Leaf } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-gray-200 sticky top-0 z-30">
      <button onClick={onMenuClick} className="text-text-primary hover:text-primary">
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex items-center gap-2">
        <Leaf className="h-5 w-5 text-primary" />
        <span className="font-semibold text-primary">ClimaBalance</span>
      </div>
    </header>
  );
}
