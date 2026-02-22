/**
 * useAppLock — manages app lock state (PIN + biometric).
 *
 * Settings KV keys (no new migration needed — reuses existing settings table):
 *   app_lock_enabled   = '1' | '0'
 *   app_lock_pin_hash  = sha256 hex string of the 4-digit PIN
 *   app_lock_biometric = '1' | '0'  (user wants biometric, not just has it)
 *
 * Lock behaviour:
 *  - On app mount:  if lock enabled → isLocked = true
 *  - On background: wasInBackground flag set
 *  - On foreground: if wasInBackground + lock enabled → isLocked = true
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { getDb } from '../db/database';

// ── Crypto helper ─────────────────────────────────────────────────────────────

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getSetting(key: string): Promise<string> {
  const db = await getDb();
  const res = await db.query('SELECT value FROM settings WHERE key = ?;', [key]);
  return res.values?.[0]?.value ?? '';
}

async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.run(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
    [key, value],
  );
}

async function deleteSetting(key: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM settings WHERE key = ?;', [key]);
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface AppLockState {
  /** True when the lock screen should be shown */
  isLocked: boolean;
  /** Whether lock is enabled in settings */
  lockEnabled: boolean;
  /** Whether biometric unlock is enabled (user opted in) */
  biometricEnabled: boolean;
  /** Whether the device supports and has biometrics enrolled */
  biometricAvailable: boolean;
  /** True while loading settings from DB */
  loading: boolean;
  /** Unlock with PIN — resolves true if correct, false if wrong */
  unlock: (pin: string) => Promise<boolean>;
  /** Unlock via biometric — resolves true on success */
  unlockBiometric: () => Promise<boolean>;
  /** Enable lock with a PIN (and optionally biometric) */
  enableLock: (pin: string, useBiometric: boolean) => Promise<void>;
  /** Disable lock (no auth check here — caller must verify first) */
  disableLock: () => Promise<void>;
  /** Replace stored PIN */
  changePIN: (newPin: string) => Promise<void>;
  /** Toggle biometric preference (lock must already be enabled) */
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

export function useAppLock(): AppLockState {
  const [isLocked, setIsLocked]               = useState(false);
  const [lockEnabled, setLockEnabled]         = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable]  = useState(false);
  const [loading, setLoading]                 = useState(true);
  const wasInBackground = useRef(false);

  // ── Check device biometric capability ────────────────────────────────────
  const checkBiometricCapability = useCallback(async () => {
    try {
      const result = await BiometricAuth.checkBiometry();
      setBiometricAvailable(result.isAvailable);
    } catch {
      setBiometricAvailable(false);
    }
  }, []);

  // ── Load settings from DB ─────────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    try {
      const enabled  = await getSetting('app_lock_enabled');
      const bioEnabled = await getSetting('app_lock_biometric');
      setLockEnabled(enabled === '1');
      setBiometricEnabledState(bioEnabled === '1');
      // Lock immediately on load if enabled
      if (enabled === '1') setIsLocked(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── App state change listener ─────────────────────────────────────────────
  useEffect(() => {
    checkBiometricCapability();
    loadSettings();

    const sub = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        wasInBackground.current = true;
      } else if (wasInBackground.current) {
        wasInBackground.current = false;
        // Re-lock on foreground if lock is enabled
        setLockEnabled(prev => {
          if (prev) setIsLocked(true);
          return prev;
        });
      }
    });

    return () => {
      sub.then(handle => handle.remove());
    };
  }, [checkBiometricCapability, loadSettings]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const storedHash = await getSetting('app_lock_pin_hash');
      const inputHash  = await sha256(pin);
      if (inputHash === storedHash) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const unlockBiometric = useCallback(async (): Promise<boolean> => {
    try {
      await BiometricAuth.authenticate({
        reason: 'Unlock Patty',
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Use PIN',
      });
      setIsLocked(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const enableLock = useCallback(async (pin: string, useBiometric: boolean): Promise<void> => {
    const hash = await sha256(pin);
    await setSetting('app_lock_enabled', '1');
    await setSetting('app_lock_pin_hash', hash);
    await setSetting('app_lock_biometric', useBiometric ? '1' : '0');
    setLockEnabled(true);
    setBiometricEnabledState(useBiometric);
  }, []);

  const disableLock = useCallback(async (): Promise<void> => {
    await setSetting('app_lock_enabled', '0');
    await deleteSetting('app_lock_pin_hash');
    await setSetting('app_lock_biometric', '0');
    setLockEnabled(false);
    setBiometricEnabledState(false);
    setIsLocked(false);
  }, []);

  const changePIN = useCallback(async (newPin: string): Promise<void> => {
    const hash = await sha256(newPin);
    await setSetting('app_lock_pin_hash', hash);
  }, []);

  const setBiometricEnabled = useCallback(async (enabled: boolean): Promise<void> => {
    await setSetting('app_lock_biometric', enabled ? '1' : '0');
    setBiometricEnabledState(enabled);
  }, []);

  return {
    isLocked,
    lockEnabled,
    biometricEnabled,
    biometricAvailable,
    loading,
    unlock,
    unlockBiometric,
    enableLock,
    disableLock,
    changePIN,
    setBiometricEnabled,
  };
}
