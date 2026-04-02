'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // Check for existing app instance first to prevent double initialization
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  // Check if we have a valid API key before attempting initialization to prevent crashes
  const isApiKeyMissing = !firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined' || firebaseConfig.apiKey === '';

  try {
    // Attempt to initialize via Firebase App Hosting environment variables or config
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  } catch (e) {
    if (isApiKeyMissing) {
      console.warn('CRITICAL: Firebase API Key is missing (NEXT_PUBLIC_FIREBASE_API_KEY). Returning placeholder SDKs.');
    } else {
      console.error('Firebase Initialization Error:', e);
    }
    // Return a dummy object if initialization fails completely to prevent root crashes
    return {
      firebaseApp: null as any,
      auth: null as any,
      firestore: null as any
    };
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  if (!firebaseApp) {
    return { firebaseApp: null as any, auth: null as any, firestore: null as any };
  }
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
