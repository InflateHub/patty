/* ProGateSheet — 3.0.0
 * Reusable bottom-sheet paywall gate.
 * Props:
 *   isOpen       – controls visibility
 *   onClose      – called on dismiss
 *   featureName  – contextual headline, e.g. "Unlock unlimited AI scans"
 *   isAIGate     – shows "Use own Gemini key" + disabled ad option (default false)
 */
import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButton,
  IonIcon,
  IonModal,
} from '@ionic/react';
import { ribbonOutline, keyOutline, videocamOutline } from 'ionicons/icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  isAIGate?: boolean;
}

const BULLETS = [
  'Unlimited AI — no token budget, ever',
  'Ad-free experience, always',
  'P2P QR device transfer + Import / Export',
];

const ProGateSheet: React.FC<Props> = ({ isOpen, onClose, featureName, isAIGate = false }) => {
  const history = useHistory();

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={isAIGate ? 0.65 : 0.55}
      breakpoints={[0, isAIGate ? 0.65 : 0.55]}
      handle
    >
      <div style={{
        padding: '24px 24px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}>
        {/* Crown icon */}
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'var(--md-primary-container)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          flexShrink: 0,
        }}>
          <IonIcon icon={ribbonOutline} style={{ fontSize: 28, color: 'var(--md-on-primary-container)' }} />
        </div>

        {/* Headline */}
        <p style={{
          margin: '0 0 16px',
          fontSize: 'var(--md-title-lg)',
          fontFamily: 'var(--md-font)',
          fontWeight: 700,
          color: 'var(--md-on-surface)',
          textAlign: 'center',
        }}>
          {featureName}
        </p>

        {/* Bullet list */}
        <div style={{ width: '100%', marginBottom: 20 }}>
          {BULLETS.map((b, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: i < BULLETS.length - 1 ? 10 : 0,
            }}>
              <span style={{
                color: 'var(--md-primary)',
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0,
                lineHeight: 1.4,
              }}>✓</span>
              <span style={{
                fontSize: 'var(--md-body-sm)',
                fontFamily: 'var(--md-font)',
                color: 'var(--md-on-surface-variant)',
                lineHeight: 1.4,
              }}>
                {b}
              </span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <IonButton
          expand="block"
          style={{
            width: '100%',
            '--border-radius': 'var(--md-shape-xl)',
            '--background': 'var(--md-primary)',
            '--color': 'var(--md-on-primary)',
            fontFamily: 'var(--md-font)',
            fontWeight: 700,
          } as React.CSSProperties}
          onClick={() => { onClose(); history.push('/pro'); }}
        >
          Subscribe — from ₹99/mo
        </IonButton>

        {/* AI-gate secondary options */}
        {isAIGate && (
          <>
            <IonButton
              fill="clear"
              style={{
                '--color': 'var(--md-primary)',
                fontFamily: 'var(--md-font)',
                marginTop: 4,
              } as React.CSSProperties}
              onClick={onClose}
            >
              <IonIcon icon={keyOutline} slot="start" />
              Use own Gemini key
            </IonButton>

            <IonButton
              fill="clear"
              disabled
              style={{
                '--color': 'var(--md-on-surface-variant)',
                fontFamily: 'var(--md-font)',
                opacity: 0.5,
              } as React.CSSProperties}
            >
              <IonIcon icon={videocamOutline} slot="start" />
              Watch ad (+20k tokens)
            </IonButton>
          </>
        )}
      </div>
    </IonModal>
  );
};

export default ProGateSheet;
