import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Leaf } from 'lucide-react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] py-8 relative">
      <Leaf className="absolute top-8 -left-4 h-32 w-32 text-primary/5 rotate-45 pointer-events-none" />
      <Leaf className="absolute bottom-8 -right-4 h-40 w-40 text-primary/5 -rotate-12 pointer-events-none" />
      <Card className="w-full max-w-md relative z-10">
        <CardContent className="p-8">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="ClimaBalance" className="h-14 w-14" />
          </div>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
