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
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? 'REPLACE_WITH_YOUR_API_KEY',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? 'REPLACE_WITH_YOUR_AUTH_DOMAIN',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? 'REPLACE_WITH_YOUR_PROJECT_ID',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? 'REPLACE_WITH_YOUR_STORAGE_BUCKET',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? 'REPLACE_WITH_YOUR_MESSAGING_SENDER_ID',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             ?? 'REPLACE_WITH_YOUR_APP_ID',
};

// Avoid duplicate app initialisation during hot-reload
const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const auth: Auth = getAuth(app);

/** Continuation URL sent inside the magic link email.
 *  Must match an authorised domain in Firebase Console. */
export const MAGIC_LINK_URL = 'https://patty.saranmahadev.in/auth';

/** LocalStorage key used to persist the email across app restart. */
export const EMAIL_KEY = 'patty_auth_email';
