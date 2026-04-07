
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
      // Log the detailed error for the developer
      console.warn('[FIRESTORE_PERMISSION_DENIED]', error.message);
      
      // Vaimennetaan toast-ilmoitukset Dashboardin alustusvaiheen hakuviiveiden aikana
      // jotta käyttäjä ei näe turhia virheilmoituksia profiilin luonnin aikana.
      const isInitialSync = 
        error.request.path.includes('/usage/') || 
        error.request.path.endsWith('/digests') ||
        error.request.path.endsWith('/alerts');

      if (!isInitialSync) {
        toast({
          variant: 'destructive',
          title: 'Access Restricted',
          description: 'Your profile is being synchronized. Please standby.',
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
