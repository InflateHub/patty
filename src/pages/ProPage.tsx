/* ProPage — 3.1.0 */
import React, { useState, useRef } from 'react';
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
  const [plan, setPlan]     = useState<'monthly' | 'annual'>('annual');
  const [emailSheet, setEmailSheet] = useState(false);
  const [email, setEmail]           = useState('');
  const [sheetState, setSheetState] = useState<'input' | 'sending' | 'sent'>('input');
  const [errorToast, setErrorToast] = useState('');
  const dotRef  = useRef<HTMLDivElement>(null);
  const { sendMagicLink } = useAuth();

  function openSheet() { setSheetState('input'); setEmail(''); setEmailSheet(true); }
  function closeSheet() { setEmailSheet(false); }

  // Reset state after modal fully dismisses
  function onDismiss() { setEmailSheet(false); setSheetState('input'); setEmail(''); }

  async function handleSend() {
    if (!email.trim()) return;
    setSheetState('sending');
    try {
      await sendMagicLink(email.trim());
      setSheetState('sent');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send link';
      setSheetState('input');
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
            onClick={openSheet}
          >
            Restore purchase
          </p>
        </div>

        <div style={{ height: 40 }} />

        {/* Crown pulse keyframe */}
        <style>{`@keyframes pro-crown-pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.1);opacity:0.85;} }`}</style>
      </IonContent>

      {/* ── Email sign-in bottom sheet ─────────────────────────────────── */}
      <style>{`
        @keyframes pro-orbit {
          from { transform: rotate(0deg) translateX(34px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(34px) rotate(-360deg); }
        }
        @keyframes pro-orbit2 {
          from { transform: rotate(180deg) translateX(34px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(34px) rotate(-540deg); }
        }
        @keyframes pro-orbit3 {
          from { transform: rotate(90deg) translateX(34px) rotate(-90deg); }
          to   { transform: rotate(450deg) translateX(34px) rotate(-450deg); }
        }
        @keyframes pro-pulse-ring {
          0%   { transform: scale(1); opacity: 0.6; }
          50%  { transform: scale(1.18); opacity: 0.15; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        @keyframes pro-check-pop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pro-sent-fade {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pro-email-chip {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        .pro-dot1 { animation: pro-orbit  1.4s linear infinite; }
        .pro-dot2 { animation: pro-orbit2 1.4s linear infinite; }
        .pro-dot3 { animation: pro-orbit3 1.4s linear infinite; }
      `}</style>
      <IonModal
        isOpen={emailSheet}
        onDidDismiss={onDismiss}
        initialBreakpoint={sheetState === 'sent' ? 0.48 : 0.55}
        breakpoints={[0, sheetState === 'sent' ? 0.48 : 0.55]}
        handle
      >
        <div style={{ padding: '28px 24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* ── STATE: input ─────────────────────────────────────── */}
          {sheetState === 'input' && (<>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 58, height: 58, borderRadius: '50%',
              background: 'var(--md-primary-container)', marginBottom: 16,
            }}>
              <IonIcon icon={mailOutline} style={{ fontSize: 26, color: 'var(--md-on-primary-container)' }} />
            </div>
            <p style={{ margin: '0 0 4px', textAlign: 'center', fontSize: 'var(--md-title-md)', fontFamily: 'var(--md-font)', fontWeight: 700, color: 'var(--md-on-surface)' }}>
              Sign in to continue
            </p>
            <p style={{ margin: '0 0 24px', textAlign: 'center', fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
              We'll send a magic link — no password needed.
            </p>
            <IonInput
              type="email"
              placeholder="your@email.com"
              value={email}
              onIonInput={e => setEmail(String(e.detail.value ?? ''))}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              fill="outline"
              style={{
                '--border-radius': 'var(--md-shape-md)',
                '--color': 'var(--md-on-surface)',
                '--placeholder-color': 'var(--md-on-surface-variant)',
                marginBottom: 16, fontFamily: 'var(--md-font)', width: '100%',
              } as React.CSSProperties}
            />
            <IonButton
              expand="block"
              disabled={!email.trim()}
              style={{
                '--border-radius': 'var(--md-shape-xl)',
                '--background': 'var(--md-primary)',
                '--color': 'var(--md-on-primary)',
                fontFamily: 'var(--md-font)', fontWeight: 700, height: 48, width: '100%',
              } as React.CSSProperties}
              onClick={handleSend}
            >
              Send magic link
            </IonButton>
          </>)}

          {/* ── STATE: sending ───────────────────────────────────── */}
          {sheetState === 'sending' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 8px', gap: 24 }}>
              {/* Orbital spinner */}
              <div style={{ position: 'relative', width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Pulse ring */}
                <div style={{
                  position: 'absolute', width: 96, height: 96, borderRadius: '50%',
                  border: '2px solid var(--md-primary)',
                  animation: 'pro-pulse-ring 1.6s ease-in-out infinite',
                }} />
                {/* Center icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'var(--md-primary-container)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 2,
                }}>
                  <IonIcon icon={mailOutline} style={{ fontSize: 24, color: 'var(--md-on-primary-container)' }} />
                </div>
                {/* Orbiting dots */}
                <div ref={dotRef} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="pro-dot1" style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: 'var(--md-primary)' }} />
                  <div className="pro-dot2" style={{ position: 'absolute', width: 7, height: 7, borderRadius: '50%', background: 'var(--md-secondary)' }} />
                  <div className="pro-dot3" style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: 'var(--md-tertiary, var(--md-primary))' }} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 6px', fontSize: 'var(--md-title-sm)', fontFamily: 'var(--md-font)', fontWeight: 700, color: 'var(--md-on-surface)' }}>
                  Sending magic link…
                </p>
                <p style={{ margin: 0, fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
                  {email}
                </p>
              </div>
            </div>
          )}

          {/* ── STATE: sent ──────────────────────────────────────── */}
          {sheetState === 'sent' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, animation: 'pro-sent-fade .4s ease both' }}>
              {/* Animated check */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80 }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'color-mix(in srgb, var(--md-primary) 14%, transparent)',
                  animation: 'pro-pulse-ring 2.5s ease-in-out infinite',
                }} />
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--md-primary-container)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'pro-check-pop .5s cubic-bezier(.34,1.56,.64,1) both',
                }}>
                  <IonIcon icon={checkmarkCircle} style={{ fontSize: 36, color: 'var(--md-primary)' }} />
                </div>
              </div>
              {/* Text */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 6px', fontSize: 'var(--md-title-md)', fontFamily: 'var(--md-font)', fontWeight: 700, color: 'var(--md-on-surface)' }}>
                  Check your inbox ✦
                </p>
                <p style={{ margin: '0 0 16px', fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)', lineHeight: 1.5 }}>
                  A magic link was sent to
                </p>
                {/* Email chip */}
                <div style={{
                  display: 'inline-block', padding: '6px 16px',
                  borderRadius: 'var(--md-shape-full)',
                  background: 'var(--md-secondary-container)',
                  color: 'var(--md-on-secondary-container)',
                  fontSize: 'var(--md-label-lg)', fontFamily: 'var(--md-font)', fontWeight: 600,
                  animation: 'pro-email-chip .4s .15s cubic-bezier(.34,1.56,.64,1) both',
                  marginBottom: 8,
                }}>
                  {email}
                </div>
                <p style={{ margin: 0, fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
                  Tap the link in the email to sign in.
                </p>
              </div>
              {/* Done button */}
              <IonButton
                expand="block"
                fill="outline"
                style={{
                  '--border-radius': 'var(--md-shape-xl)',
                  '--border-color': 'var(--md-outline)',
                  '--color': 'var(--md-on-surface)',
                  fontFamily: 'var(--md-font)', fontWeight: 600, height: 44, width: '100%',
                } as React.CSSProperties}
                onClick={closeSheet}
              >
                Got it
              </IonButton>
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
