/**
 * firebase.ts — Firebase app initialisation
 *
 * ⚠️  REPLACE all "REPLACE_WITH_..." values with your real Firebase project
 *     config before release. Find them in Firebase Console →
 *     Project Settings → Your apps → SDK setup and configuration.
 *
 * The magic link continuation URL (actionCodeSettings.url) must be added to
 * Firebase Console → Authentication → Settings → Authorised domains.
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? 'AIzaSyAZOxf45NPATEbgmDi_CDsBarvearQunfo',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? 'stride-11129.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? 'stride-11129',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? 'stride-11129.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '39988707420',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             ?? '1:39988707420:web:8d2ac03ec82340a7072699',
};

// Avoid duplicate app initialisation during hot-reload
const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const auth: Auth = getAuth(app);

/**
 * signInWithGoogleCredential — takes the idToken from capacitor-google-auth
 * and signs into Firebase with a Google credential.
 */
export async function signInWithGoogleCredential(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

/** Continuation URL sent inside the magic link email.
 *  Must match an authorised domain in Firebase Console. */
export const MAGIC_LINK_URL = 'https://patty.saranmahadev.in/auth';

/** LocalStorage key used to persist the email across app restart. */
export const EMAIL_KEY = 'patty_auth_email';
