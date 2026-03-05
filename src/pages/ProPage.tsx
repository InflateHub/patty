/* ProPage — 3.1.0 */
import React, { useState } from 'react';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { checkmarkCircle, closeCircleOutline, ribbonOutline, mailOutline } from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';

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
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [emailSheet, setEmailSheet] = useState(false);
  const [email, setEmail]           = useState('');
  const [sentToast, setSentToast]   = useState(false);
  const [errorToast, setErrorToast] = useState('');
  const { sendMagicLink, sending }  = useAuth();

  async function handleSend() {
    if (!email.trim()) return;
    try {
      await sendMagicLink(email.trim());
      setEmailSheet(false);
      setEmail('');
      setSentToast(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send link';
      setErrorToast(msg);
    }
  }

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
            <p style={{ margin: 0, fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: plan === 'monthly' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)' }}>₹99 / month</p>
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
            <p style={{ margin: 0, fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: plan === 'annual' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)' }}>$25 / year · save 40%</p>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '0 16px 8px' }}>
          <IonButton
            expand="block"
            style={{
              '--border-radius': 'var(--md-shape-xl)',
              '--background': 'var(--md-primary)',
              '--color': 'var(--md-on-primary)',
              height: 52,
              fontSize: 'var(--md-label-lg)',
              fontFamily: 'var(--md-font)',
              fontWeight: 700,
            } as React.CSSProperties}
            onClick={() => setEmailSheet(true)}
          >
            Buy
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
            onClick={() => setEmailSheet(true)}
          >
            Restore purchase
          </p>
        </div>

        <div style={{ height: 40 }} />

        {/* Crown pulse keyframe */}
        <style>{`@keyframes pro-crown-pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.1);opacity:0.85;} }`}</style>
      </IonContent>

      {/* ── Email sign-in bottom sheet ─────────────────────────────────── */}
      <IonModal
        isOpen={emailSheet}
        onDidDismiss={() => setEmailSheet(false)}
        initialBreakpoint={0.55}
        breakpoints={[0, 0.55]}
        handle
      >
        <div style={{ padding: '28px 24px 40px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--md-primary-container)',
            }}>
              <IonIcon icon={mailOutline} style={{ fontSize: 26, color: 'var(--md-on-primary-container)' }} />
            </div>
          </div>

          {/* Copy */}
          <p style={{ margin: '0 0 4px', textAlign: 'center', fontSize: 'var(--md-title-md)', fontFamily: 'var(--md-font)', fontWeight: 700, color: 'var(--md-on-surface)' }}>
            Sign in to continue
          </p>
          <p style={{ margin: '0 0 24px', textAlign: 'center', fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
            We'll send a magic link to your email — no password needed.
          </p>

          {/* Email input */}
          <IonInput
            type="email"
            placeholder="your@email.com"
            value={email}
            onIonInput={e => setEmail(String(e.detail.value ?? ''))}
            fill="outline"
            style={{
              '--border-radius': 'var(--md-shape-md)',
              '--color': 'var(--md-on-surface)',
              '--placeholder-color': 'var(--md-on-surface-variant)',
              marginBottom: 16,
              fontFamily: 'var(--md-font)',
            } as React.CSSProperties}
          />

          {/* Send button */}
          <IonButton
            expand="block"
            disabled={!email.trim() || sending}
            style={{
              '--border-radius': 'var(--md-shape-xl)',
              '--background': 'var(--md-primary)',
              '--color': 'var(--md-on-primary)',
              fontFamily: 'var(--md-font)',
              fontWeight: 700,
              height: 48,
            } as React.CSSProperties}
            onClick={handleSend}
          >
            {sending ? <IonSpinner name="crescent" style={{ color: 'var(--md-on-primary)' }} /> : 'Send magic link'}
          </IonButton>
        </div>
      </IonModal>

      {/* Sent confirmation */}
      <IonToast
        isOpen={sentToast}
        message="Check your inbox — magic link sent! ✨"
        duration={3200}
        onDidDismiss={() => setSentToast(false)}
        position="bottom"
      />

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
