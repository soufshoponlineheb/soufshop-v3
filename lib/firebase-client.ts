'use client';

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import {
  deleteDoc,
  doc,
  getFirestore,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import {
  getDatabase,
  ref as dbRef,
  remove as dbRemove,
  set as dbSet,
  type Database,
} from 'firebase/database';

export const SOUFSHOP_FIREBASE_CONFIG = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyA6GmXFUppNL1M-_pUeeQwInThYKyOGpmA',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'soufshopstore.firebaseapp.com',
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    'https://soufshopstore-default-rtdb.firebaseio.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'soufshopstore',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'soufshopstore.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    '832102909148',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    '1:832102909148:web:cc59c4fd1c179e7d79a019',
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    'G-P6WMQQXCWM',
};

export function isFirebaseClientConfigured(): boolean {
  return Boolean(
    SOUFSHOP_FIREBASE_CONFIG.apiKey &&
      SOUFSHOP_FIREBASE_CONFIG.authDomain &&
      SOUFSHOP_FIREBASE_CONFIG.projectId &&
      SOUFSHOP_FIREBASE_CONFIG.appId
  );
}

let clientApp: FirebaseApp | null = null;
let clientAnalytics: Analytics | null = null;
let clientFirestore: Firestore | null = null;
let clientDatabase: Database | null = null;

export function getFirebaseClientApp(): FirebaseApp | null {
  if (!isFirebaseClientConfigured()) {
    return null;
  }

  if (!clientApp) {
    const existing = getApps();
    clientApp = existing.length > 0 ? existing[0] : initializeApp(SOUFSHOP_FIREBASE_CONFIG);
  }

  return clientApp;
}

export function getFirebaseClientAuth(): Auth | null {
  const app = getFirebaseClientApp();
  if (!app) return null;
  return getAuth(app);
}

export function getFirebaseClientFirestore(): Firestore | null {
  const app = getFirebaseClientApp();
  if (!app) return null;
  if (!clientFirestore) {
    clientFirestore = getFirestore(app);
  }
  return clientFirestore;
}

export function getFirebaseClientDatabase(): Database | null {
  const app = getFirebaseClientApp();
  if (!app) return null;
  if (!clientDatabase) {
    clientDatabase = getDatabase(app);
  }
  return clientDatabase;
}

/**
 * Returns a fresh Firebase ID token for the currently signed-in user so server
 * routes in stateless serverless environments (Netlify / Vercel) can authenticate
 * writes against Firebase Realtime Database and Cloud Firestore.
 */
export async function getFreshFirebaseIdToken(): Promise<string | null> {
  try {
    const auth = getFirebaseClientAuth();
    const currentUser = auth?.currentUser;
    if (!currentUser) return null;
    return await Promise.race([
      currentUser.getIdToken(),
      new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 1200)),
    ]);
  } catch {
    return null;
  }
}

/**
 * Synchronizes a document directly from the authenticated admin browser session
 * to both Cloud Firestore and Firebase Realtime Database (`soufshopstore`).
 */
export async function syncAdminDocumentToFirebaseClient(
  collectionName: string,
  docId: string,
  data: object
): Promise<void> {
  if (!docId) return;
  const cleanPayload = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;

  const tasks: Promise<unknown>[] = [];

  try {
    const firestore = getFirebaseClientFirestore();
    if (firestore) {
      tasks.push(
        setDoc(doc(firestore, collectionName, docId), cleanPayload, { merge: true }).catch(
          () => undefined
        )
      );
    }
  } catch {
    // Ignore client Firestore init error
  }

  try {
    const rtdb = getFirebaseClientDatabase();
    if (rtdb) {
      tasks.push(
        dbSet(dbRef(rtdb, `${collectionName}/${docId}`), cleanPayload).catch(() => undefined)
      );
    }
  } catch {
    // Ignore client RTDB init error
  }

  await Promise.race([
    Promise.all(tasks),
    new Promise<void>((resolve) => setTimeout(resolve, 1200)),
  ]);
}

/**
 * Deletes a document directly from both Cloud Firestore and Firebase Realtime Database.
 */
export async function deleteAdminDocumentFromFirebaseClient(
  collectionName: string,
  docId: string
): Promise<void> {
  if (!docId) return;
  const tasks: Promise<unknown>[] = [];

  try {
    const firestore = getFirebaseClientFirestore();
    if (firestore) {
      tasks.push(deleteDoc(doc(firestore, collectionName, docId)).catch(() => undefined));
    }
  } catch {
    // Ignore
  }

  try {
    const rtdb = getFirebaseClientDatabase();
    if (rtdb) {
      tasks.push(dbRemove(dbRef(rtdb, `${collectionName}/${docId}`)).catch(() => undefined));
    }
  } catch {
    // Ignore
  }

  await Promise.race([
    Promise.all(tasks),
    new Promise<void>((resolve) => setTimeout(resolve, 1200)),
  ]);
}

export async function getFirebaseClientAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  const app = getFirebaseClientApp();
  if (!app) return null;

  if (clientAnalytics) return clientAnalytics;

  try {
    const supported = await isAnalyticsSupported();
    if (supported) {
      clientAnalytics = getAnalytics(app);
      return clientAnalytics;
    }
  } catch {
    // Ignore analytics initialization errors in restricted browsers
  }
  return null;
}

export function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}
