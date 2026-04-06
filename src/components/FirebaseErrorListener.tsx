'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * A component that listens for globally emitted 'permission-error' events.
 * It logs the error and shows a toast instead of crashing the entire app.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Log the detailed error for the developer/agent to see in the console
      console.warn('[FIRESTORE_PERMISSION_DENIED]', error.message);
      console.dir(error.request);

      // Show a non-fatal toast to the user
      toast({
        variant: 'destructive',
        title: 'Access Restricted',
        description: 'You do not have permission to view or modify some data in this section.',
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  // This component no longer throws errors, preventing the app from crashing.
  return null;
}
