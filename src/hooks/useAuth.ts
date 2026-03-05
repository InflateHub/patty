/**
 * useAuth.ts — 3.1.0
 *
 * Passwordless email sign-in via Firebase magic links.
 * Auth is triggered ONLY when the user taps "Buy" on ProPage — never earlier.
 *
 * Exports:
 *   user            – Firebase User | null (null = not signed in)
 *   loading         – true while auth state is resolving on startup
 *   sending         – true while sendMagicLink is in flight
 *   sendMagicLink   – stores email, sends the link; resolves true on success
 *   completeMagicLink – finishes sign-in from a magic link URL; resolves true on success
 *   signOut         – signs out from Firebase + clears local firebase_uid
 */
import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  isSignInWithEmailLink,
  User,
  ActionCodeSettings,
} from 'firebase/auth';
import { auth, EMAIL_KEY, MAGIC_LINK_URL } from '../utils/firebase';
import { getDb } from '../db/database';

const ACTION_CODE_SETTINGS: ActionCodeSettings = {
  url: MAGIC_LINK_URL,
  handleCodeInApp: true,
  android: {
    packageName: 'in.saranmahadev.patty',
    installApp: true,
    minimumVersion: '1',
  },
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Mirror Firebase auth state into local state + persist uid to SQLite
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Persist / clear firebase_uid in settings
      try {
        const db = await getDb();
        if (firebaseUser) {
          await db.run(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('firebase_uid', ?);",
            [firebaseUser.uid],
          );
        } else {
          await db.run("DELETE FROM settings WHERE key = 'firebase_uid';");
        }
      } catch {
        // DB not ready yet — non-fatal
      }
    });

    return unsubscribe;
  }, []);

  /**
   * sendMagicLink — step 1 of the magic-link flow.
   * Stores email in localStorage (needed for the completion step after app restart),
   * then asks Firebase to send the email link.
   * Returns true on success, throws on error.
   */
  async function sendMagicLink(email: string): Promise<true> {
    setSending(true);
    try {
      await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS);
      localStorage.setItem(EMAIL_KEY, email);
      return true;
    } finally {
      setSending(false);
    }
  }

  /**
   * completeMagicLink — step 2, called when the app resumes from a magic link.
   * Pass the full URL received in the appUrlOpen event.
   * Returns the signed-in User on success.
   */
  async function completeMagicLink(link: string): Promise<User> {
    if (!isSignInWithEmailLink(auth, link)) {
      throw new Error('Not a valid sign-in link');
    }
    const email = localStorage.getItem(EMAIL_KEY);
    if (!email) {
      throw new Error('Email not found — please request a new magic link');
    }
    const result = await signInWithEmailLink(auth, email, link);
    localStorage.removeItem(EMAIL_KEY);
    return result.user;
  }

  /**
   * signOut — clears Firebase session + removes local firebase_uid.
   */
  async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
    try {
      const db = await getDb();
      await db.run("DELETE FROM settings WHERE key = 'firebase_uid';");
    } catch {
      // non-fatal
    }
  }

  return { user, loading, sending, sendMagicLink, completeMagicLink, signOut };
}
