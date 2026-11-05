/**
 * Firebase Firestore and Authentication Service
 * Strictly adheres to Zero-Trust security rules and Workspace OAuth specs
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Workspace Calendar OAuth Scopes
export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

const provider = new GoogleAuthProvider();
CALENDAR_SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// In-memory access token storage (Mandatory: never store in localStorage/sessionStorage)
let cachedAccessToken = null;
let isSigningIn = false;

/**
 * Standardized Firestore Error Handler required by Zero-Trust specs
 */
export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(p => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path: path || null,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Connection validator on app boot
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted. Local cache active.');
    }
  }
}

// Execute connection test on import
testConnection();

/**
 * Authentication management
 */
export function initAuthListener(onAuthSuccess, onAuthFailure) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
}

export async function loginWithGoogle() {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken, cancelled: false };
  } catch (error) {
    if (error && (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request')) {
      // User closed the popup window or opened a new request - expected user action
      console.info('Google Sign-In popup closed by user.');
      return { user: null, accessToken: null, cancelled: true };
    }
    console.warn('Google Sign-In notice:', error?.message || error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

export async function logoutUser() {
  await signOut(auth);
  cachedAccessToken = null;
}

export function getCachedAccessToken() {
  return cachedAccessToken;
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function getIdToken() {
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken();
    } catch (err) {
      console.warn('Failed to get Firebase ID token:', err);
      return null;
    }
  }
  return null;
}
