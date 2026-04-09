export * from './config';
export * from './error-emitter';
export * from './errors';

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let cachedApp: FirebaseApp | null = null;
let cachedFirestore: Firestore | null = null;

export function initializeFirebase(): { app: FirebaseApp | null; firestore: Firestore | null } {
  try {
    if (!cachedApp) {
      cachedApp = getApps()[0] ?? initializeApp(firebaseConfig);
      cachedFirestore = getFirestore(cachedApp);
    }

    return { app: cachedApp, firestore: cachedFirestore };
  } catch (error) {
    console.warn('[FIREBASE_INIT_WARNING]', error);
    return { app: null, firestore: null };
  }
}
