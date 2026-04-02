
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8">
      <div className="w-20 h-20 rounded-3xl bg-danger/10 flex items-center justify-center text-danger border border-danger/20">
        <AlertCircle className="w-10 h-10" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-4xl font-bold font-headline tracking-tighter">Protocol Interruption</h1>
        <p className="text-muted-foreground max-w-sm mx-auto font-medium leading-relaxed">
          The operator encountered a critical logic exception. Please reset the environment or refresh the protocol.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button 
          onClick={() => reset()} 
          className="h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Environment
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()} 
          className="h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] border-white/5"
        >
          Hard Reload
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground/30 font-mono">
        DIGEST: {error.digest || 'unknown'}
      </p>
    </div>
  );
}
