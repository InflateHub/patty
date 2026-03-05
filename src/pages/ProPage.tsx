/* ProPage — 3.0.0 */
import React, { useState } from 'react';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { checkmarkCircle, closeCircleOutline, ribbonOutline } from 'ionicons/icons';

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
  const [toast, setToast] = useState(false);

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
            onClick={() => setToast(true)}
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
            onClick={() => setToast(true)}
          >
            Restore purchase
          </p>
        </div>

        <div style={{ height: 40 }} />

        {/* Crown pulse keyframe */}
        <style>{`@keyframes pro-crown-pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.1);opacity:0.85;} }`}</style>
      </IonContent>

      <IonToast
        isOpen={toast}
        message="Payments are coming soon — stay tuned! ✦"
        duration={2800}
        onDidDismiss={() => setToast(false)}
        position="bottom"
      />
    </IonPage>
  );
};

export default ProPage;
