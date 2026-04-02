
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Core SDK initialization logic that is safe for both client and server (Route Handlers)
export function initializeFirebase() {
  if (getApps().length > 0) {
    const app = getApp();
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app)
    };
  }

  const isApiKeyMissing = !firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined' || firebaseConfig.apiKey === '';

  try {
    const firebaseApp = initializeApp(firebaseConfig);
    return {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: getFirestore(firebaseApp)
    };
  } catch (e) {
    if (isApiKeyMissing) {
      console.warn('CRITICAL: Firebase API Key is missing. Returning placeholder SDKs.');
    } else {
      console.error('Firebase Initialization Error:', e);
    }
    return {
      firebaseApp: null as any,
      auth: null as any,
      firestore: null as any
    };
  }
}

// Re-export everything from the modular files
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
