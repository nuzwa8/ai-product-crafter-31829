import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({ message, className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}
