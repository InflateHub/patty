/**
 * useRevenueCat.ts
 *
 * Central RevenueCat hook for Patty.
 *
 * Responsibilities:
 *   - Configure the RC SDK once on native platforms (web is a no-op)
 *   - Identify the user with their firebase_uid so purchases are tied to their account
 *   - Expose isPro entitlement state reactively
 *   - Expose helpers: refreshCustomerInfo, restorePurchases
 *
 * Usage:
 *   const { isPro, isLoading } = useRevenueCat();
 *
 * Note: presentPaywall and presentCustomerCenter are called directly via
 *   RevenueCatUI in the pages that need them — no need to go through this hook.
 */
import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  LOG_LEVEL,
  CustomerInfo,
} from '@revenuecat/purchases-capacitor';

// ── Constants ────────────────────────────────────────────────────────────────
export const RC_API_KEY       = 'test_ghgaWOOxPdNYCXLDxWOVvrYijii';
export const PRO_ENTITLEMENT  = 'Patty Pro';

// ── Module-level state (shared across hook instances) ─────────────────────────
let configured = false;

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useRevenueCat(firebaseUid?: string | null) {
  const [isPro,        setIsPro]        = useState(false);
  const [isLoading,    setIsLoading]    = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  // ── Configure + identify ────────────────────────────────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // RC Capacitor SDK is native-only; skip silently on web
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function setup() {
      try {
        if (!configured) {
          await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
          await Purchases.configure({
            apiKey: RC_API_KEY,
            appUserID: firebaseUid ?? undefined,
          });
          configured = true;
        } else if (firebaseUid) {
          // SDK already configured; identify user if uid changed
          await Purchases.logIn({ appUserID: firebaseUid });
        }

        const { customerInfo: info } = await Purchases.getCustomerInfo();
        if (!cancelled) {
          setCustomerInfo(info);
          setIsPro(PRO_ENTITLEMENT in info.entitlements.active);
        }
      } catch (e) {
        console.warn('[useRevenueCat] setup error:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    setup();
    return () => { cancelled = true; };
  }, [firebaseUid]);

  // ── Add listener for real-time entitlement updates ────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeListener: (() => void) | undefined;

    Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
      setCustomerInfo(info);
      setIsPro(PRO_ENTITLEMENT in info.entitlements.active);
    }).then((listenerId: string) => {
      removeListener = () => Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: listenerId });
    }).catch(() => {/* non-fatal */});

    return () => { removeListener?.(); };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const refreshCustomerInfo = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const { customerInfo: info } = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setIsPro(PRO_ENTITLEMENT in info.entitlements.active);
    } catch (e) {
      console.warn('[useRevenueCat] refresh error:', e);
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const { customerInfo: info } = await Purchases.restorePurchases();
      setCustomerInfo(info);
      const hasPro = PRO_ENTITLEMENT in info.entitlements.active;
      setIsPro(hasPro);
      return hasPro;
    } catch (e) {
      console.warn('[useRevenueCat] restore error:', e);
      return false;
    }
  }, []);

  return { isPro, isLoading, customerInfo, refreshCustomerInfo, restorePurchases };
}
