/* ProPage — 3.2.0 */
import React, { useState } from 'react';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { checkmarkCircle, closeCircleOutline, ribbonOutline, personCircleOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';
import { useAuth } from '../hooks/useAuth';
import { useRevenueCat } from '../hooks/useRevenueCat';

// ── Feature comparison data ───────────────────────────────────────────────────
const FEATURES: { label: string; free: boolean; pro: boolean }[] = [
  { label: 'Unlimited AI — no token limits', free: false, pro: true },
  { label: 'No ads — ever',                  free: false, pro: true },
  { label: 'Import / Export data',           free: false, pro: true },
  { label: 'P2P device transfer (QR)',       free: false, pro: true },
  { label: 'Priority support',              free: false, pro: true },
];

// ── Component ─────────────────────────────────────────────────────────────────
const ProPage: React.FC = () => {
  const [plan, setPlan]               = useState<'monthly' | 'annual'>('annual');
  const [googleSheet, setGoogleSheet] = useState(false);
  const [signingIn, setSigningIn]     = useState(false);
  const [paywallBusy, setPaywallBusy] = useState(false);
  const [errorToast, setErrorToast]   = useState('');

  const { user, signInWithGoogle }             = useAuth();
  const { isPro, isLoading: rcLoading,
          refreshCustomerInfo }                = useRevenueCat(user?.uid ?? null);
  const isNative = Capacitor.isNativePlatform();

  // ── Present RC paywall ────────────────────────────────────────────────────
  async function openPaywall() {
    if (!isNative) { setErrorToast('Purchases are only available in the app.'); return; }
    setPaywallBusy(true);
    try {
      const { result } = await RevenueCatUI.presentPaywall();
      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        await refreshCustomerInfo();
      }
    } catch (e: unknown) {
      setErrorToast(e instanceof Error ? e.message : 'Could not open paywall');
    } finally {
      setPaywallBusy(false);
    }
  }

  // ── Open Customer Center ──────────────────────────────────────────────────
  async function openCustomerCenter() {
    if (!isNative) { setErrorToast('Subscription management is only available in the app.'); return; }
    try {
      await RevenueCatUI.presentCustomerCenter();
      await refreshCustomerInfo();
    } catch (e: unknown) {
      setErrorToast(e instanceof Error ? e.message : 'Could not open customer center');
    }
  }

  // ── Buy / Restore: sign in if needed, then show paywall ──────────────────
  async function handleBuy() {
    if (!user) { setGoogleSheet(true); } else { await openPaywall(); }
  }

  // ── Google sign-in then paywall ───────────────────────────────────────────
  async function handleGoogleSignIn() {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      setGoogleSheet(false);
      setSigningIn(false);
      setTimeout(openPaywall, 400); // let sheet dismiss before RC paywall opens
    } catch (e: unknown) {
      setSigningIn(false);
      setErrorToast(e instanceof Error ? e.message : 'Google sign-in failed');
    }
  }

  function onDismiss() { setGoogleSheet(false); setSigningIn(false); }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" />
          </IonButtons>
          <IonTitle>Patty Pro</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>

        {/* ── Crown hero ──────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '36px 24px 24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: 'var(--md-primary-container)',
            marginBottom: 16,
            animation: 'pro-crown-pulse 2.4s ease-in-out infinite',
          }}>
            <IonIcon
              icon={ribbonOutline}
              style={{ fontSize: 48, color: 'var(--md-on-primary-container)' }}
            />
          </div>
          <p style={{
            margin: '0 0 8px',
            fontSize: 'var(--md-headline-md)',
            fontFamily: 'var(--md-font)',
            fontWeight: 700,
            color: 'var(--md-on-surface)',
          }}>
            Patty Pro
          </p>
          <p style={{
            margin: 0,
            fontSize: 'var(--md-body-lg)',
            fontFamily: 'var(--md-font)',
            color: 'var(--md-on-surface-variant)',
          }}>
            Unlimited AI · no ads & more
          </p>
        </div>

        {/* ── Feature comparison table ─────────────────────────────────── */}
        <div style={{ margin: '0 16px 20px' }}>
          <div style={{
            borderRadius: 'var(--md-shape-xl)',
            border: '1px solid var(--md-outline-variant)',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 64px 64px',
              padding: '10px 16px',
              background: 'var(--md-primary-container)',
              borderBottom: '1px solid var(--md-outline-variant)',
            }}>
              <span style={{ fontSize: 'var(--md-label-md)', fontFamily: 'var(--md-font)', fontWeight: 600, color: 'var(--md-on-primary-container)' }}>Feature</span>
              <span style={{ fontSize: 'var(--md-label-md)', fontFamily: 'var(--md-font)', fontWeight: 600, color: 'var(--md-on-primary-container)', textAlign: 'center' }}>Free</span>
              <span style={{ fontSize: 'var(--md-label-md)', fontFamily: 'var(--md-font)', fontWeight: 600, color: 'var(--md-on-primary-container)', textAlign: 'center' }}>Pro ✦</span>
            </div>
            {/* Rows */}
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 64px 64px',
                  padding: '12px 16px',
                  background: i % 2 === 0 ? 'var(--md-surface)' : 'color-mix(in srgb, var(--md-surface-variant) 40%, transparent)',
                  borderBottom: i < FEATURES.length - 1 ? '1px solid var(--md-outline-variant)' : 'none',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface)' }}>{f.label}</span>
                <div style={{ textAlign: 'center' }}>
                  <IonIcon
                    icon={f.free ? checkmarkCircle : closeCircleOutline}
                    style={{ fontSize: 20, color: f.free ? 'var(--md-primary)' : 'var(--md-outline)' }}
                  />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <IonIcon
                    icon={f.pro ? checkmarkCircle : closeCircleOutline}
                    style={{ fontSize: 20, color: f.pro ? 'var(--md-primary)' : 'var(--md-outline)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Plan selector ───────────────────────────────────────────── */}
        <div style={{ margin: '0 16px 24px', display: 'flex', gap: 12 }}>
          {/* Monthly */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setPlan('monthly')}
            style={{
              flex: 1,
              padding: '14px 12px',
              borderRadius: 'var(--md-shape-lg)',
              border: `2px solid ${plan === 'monthly' ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
              background: plan === 'monthly' ? 'var(--md-primary-container)' : 'var(--md-surface)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <p style={{ margin: '0 0 2px', fontSize: 'var(--md-label-lg)', fontFamily: 'var(--md-font)', fontWeight: 700, color: plan === 'monthly' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface)' }}>Monthly</p>
            <p style={{ margin: 0, fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: plan === 'monthly' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)' }}>
              <s style={{ opacity: 0.55 }}>₹149</s>{' '}₹99 / month
            </p>
          </div>

          {/* Annual */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setPlan('annual')}
            style={{
              flex: 1,
              padding: '14px 12px',
              borderRadius: 'var(--md-shape-lg)',
              border: `2px solid ${plan === 'annual' ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
              background: plan === 'annual' ? 'var(--md-primary-container)' : 'var(--md-surface)',
              cursor: 'pointer',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            {/* Best value badge */}
            <div style={{
              position: 'absolute',
              top: 6,
              right: 8,
              padding: '2px 7px',
              borderRadius: 'var(--md-shape-full)',
              background: 'var(--md-primary)',
              fontSize: 9,
              fontFamily: 'var(--md-font)',
              fontWeight: 700,
              color: 'var(--md-on-primary)',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}>
              Best value
            </div>
            <p style={{ margin: '0 0 2px', fontSize: 'var(--md-label-lg)', fontFamily: 'var(--md-font)', fontWeight: 700, color: plan === 'annual' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface)' }}>Annual</p>
            <p style={{ margin: 0, fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: plan === 'annual' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)' }}>
              <s style={{ opacity: 0.55 }}>₹1499</s>{' '}₹999 / year
            </p>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '0 16px 8px' }}>
          {rcLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
              <IonSpinner name="crescent" style={{ color: 'var(--md-primary)' }} />
            </div>
          ) : isPro ? (
            /* ── Already Pro ── */
            <>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'var(--md-primary-container)',
                borderRadius: 'var(--md-shape-xl)',
                padding: '14px 20px', marginBottom: 12,
              }}>
                <IonIcon icon={checkmarkCircle} style={{ fontSize: 20, color: 'var(--md-primary)' }} />
                <span style={{ fontSize: 'var(--md-label-lg)', fontFamily: 'var(--md-font)', fontWeight: 700, color: 'var(--md-on-primary-container)' }}>
                  You're a Pro member ✦
                </span>
              </div>
              <IonButton
                expand="block"
                fill="outline"
                style={{
                  '--border-radius': 'var(--md-shape-xl)',
                  '--border-color': 'var(--md-outline)',
                  '--color': 'var(--md-on-surface)',
                  height: 52,
                  fontSize: 'var(--md-label-lg)',
                  fontFamily: 'var(--md-font)',
                  fontWeight: 700,
                } as React.CSSProperties}
                onClick={openCustomerCenter}
              >
                Manage Subscription
              </IonButton>
            </>
          ) : (
            /* ── Not Pro ── */
            <>
              <IonButton
                expand="block"
                disabled={paywallBusy}
                style={{
                  '--border-radius': 'var(--md-shape-xl)',
                  '--background': 'var(--md-primary)',
                  '--color': 'var(--md-on-primary)',
                  height: 52,
                  fontSize: 'var(--md-label-lg)',
                  fontFamily: 'var(--md-font)',
                  fontWeight: 700,
                } as React.CSSProperties}
                onClick={handleBuy}
              >
                {paywallBusy ? <IonSpinner name="crescent" /> : 'Get Pro'}
              </IonButton>
              <p
                style={{
                  textAlign: 'center',
                  margin: '12px 0 0',
                  fontSize: 'var(--md-label-md)',
                  fontFamily: 'var(--md-font)',
                  color: 'var(--md-primary)',
                  cursor: 'pointer',
                }}
                onClick={handleBuy}
              >
                Restore purchase
              </p>
            </>
          )}
        </div>

        <div style={{ height: 40 }} />

        {/* Keyframes */}
        <style>{`
          @keyframes pro-crown-pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.1);opacity:0.85;} }
          @keyframes pro-pulse-ring {
            0%   { transform: scale(1); opacity: 0.6; }
            50%  { transform: scale(1.18); opacity: 0.15; }
            100% { transform: scale(1); opacity: 0.6; }
          }
        `}</style>
      </IonContent>

      {/* ── Google sign-in bottom sheet ───────────────────────────────── */}
      <IonModal
        isOpen={googleSheet}
        onDidDismiss={onDismiss}
        initialBreakpoint={0.44}
        breakpoints={[0, 0.44]}
        handle
      >
        <div style={{ padding: '32px 24px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {!signingIn ? (<>
            {/* Icon */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 60, height: 60, borderRadius: '50%',
              background: 'var(--md-primary-container)', marginBottom: 4,
            }}>
              <IonIcon icon={ribbonOutline} style={{ fontSize: 28, color: 'var(--md-on-primary-container)' }} />
            </div>
            <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--md-title-md)', fontFamily: 'var(--md-font)', fontWeight: 700, color: 'var(--md-on-surface)' }}>
              Sign in to continue
            </p>
            <p style={{ margin: '0 0 8px', textAlign: 'center', fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
              We'll link your Pro access to your Google account.
            </p>
            <IonButton
              expand="block"
              style={{
                '--border-radius': 'var(--md-shape-xl)',
                '--background': 'var(--md-surface-variant)',
                '--color': 'var(--md-on-surface)',
                '--box-shadow': 'none',
                fontFamily: 'var(--md-font)', fontWeight: 700, height: 52, width: '100%',
              } as React.CSSProperties}
              onClick={handleGoogleSignIn}
            >
              <IonIcon slot="start" icon={personCircleOutline} style={{ fontSize: 20 }} />
              Continue with Google
            </IonButton>
          </>) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '8px 0' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72 }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '2px solid var(--md-primary)',
                  animation: 'pro-pulse-ring 1.6s ease-in-out infinite',
                }} />
                <IonIcon icon={personCircleOutline} style={{ fontSize: 32, color: 'var(--md-primary)' }} />
              </div>
              <p style={{ margin: 0, fontSize: 'var(--md-title-sm)', fontFamily: 'var(--md-font)', fontWeight: 700, color: 'var(--md-on-surface)' }}>
                Signing in…
              </p>
            </div>
          )}
        </div>
      </IonModal>

      {/* Error */}
      <IonToast
        isOpen={!!errorToast}
        message={errorToast}
        duration={3200}
        color="danger"
        onDidDismiss={() => setErrorToast('')}
        position="bottom"
      />
    </IonPage>
  );
};

export default ProPage;
