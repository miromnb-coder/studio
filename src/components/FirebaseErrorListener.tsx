
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * A component that listens for globally emitted 'permission-error' events.
 * It handles the logic for displaying meaningful synchronization messages.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Log for developer
      console.warn('[FIRESTORE_SYNC_SIGNAL]', error.message);
      
      const path = error.request.path;
      const isInitialSyncPath = 
        path.includes('/usage/') || 
        path.endsWith('/digests') ||
        path.endsWith('/alerts') ||
        path.includes('/memory/');

      // If it's a known initial sync path, we use a more helpful message
      if (isInitialSyncPath) {
        toast({
          variant: 'default',
          title: 'Syncing Environment',
          description: 'Your neural profile is being initialized. This usually takes 2-3 seconds.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Access Restricted',
          description: 'Permission denied for this operation. Please verify your clearance level.',
        });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
