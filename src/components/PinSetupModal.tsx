/**
 * PinSetupModal — two-step PIN creation/change flow.
 *
 * Step 1: Enter a new 4-digit PIN
 * Step 2: Confirm the PIN
 * On match → calls onSave(pin) then closes
 * On mismatch → returns to step 1 with error
 */

import React, { useState, useCallback } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { backspaceOutline, checkmarkOutline } from 'ionicons/icons';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PinSetupModalProps {
  isOpen: boolean;
  title?: string;
  onSave: (pin: string) => Promise<void>;
  onCancel: () => void;
}

const PAD_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'] as const;
const PIN_LENGTH = 4;

// ── Component ─────────────────────────────────────────────────────────────────
const PinSetupModal: React.FC<PinSetupModalProps> = ({
  isOpen,
  title = 'Set PIN',
  onSave,
  onCancel,
}) => {
  const [step, setStep]       = useState<1 | 2>(1);
  const [first, setFirst]     = useState('');
  const [second, setSecond]   = useState('');
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);

  const currentPin = step === 1 ? first : second;
  const setCurrentPin = step === 1 ? setFirst : setSecond;

  const handleDismiss = () => {
    // Reset state on close
    setStep(1);
    setFirst('');
    setSecond('');
    setError('');
    setSaving(false);
    onCancel();
  };

  const handleKey = useCallback(async (key: string) => {
    if (saving) return;
    if (key === '⌫') {
      setCurrentPin(p => p.slice(0, -1));
      setError('');
      return;
    }
    if (!key) return;
    const next = currentPin + key;
    if (next.length > PIN_LENGTH) return;
    setError('');
    setCurrentPin(next);

    if (next.length === PIN_LENGTH) {
      if (step === 1) {
        // Move to confirm step
        setTimeout(() => {
          setStep(2);
          setSecond('');
        }, 200);
      } else {
        // Confirm
        if (next === first) {
          setSaving(true);
          await onSave(first);
          // Parent closes modal; reset just in case
          setStep(1);
          setFirst('');
          setSecond('');
          setError('');
          setSaving(false);
        } else {
          setError('PINs do not match. Try again.');
          setStep(1);
          setFirst('');
          setSecond('');
          setTimeout(() => setError(''), 3000);
        }
      }
    }
  }, [saving, currentPin, step, first, onSave, setCurrentPin]);

  const displayPin = currentPin;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleDismiss}>Cancel</IonButton>
          </IonButtons>
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '24px',
          gap: 0,
        }}>
          {/* ── Step indicator ─────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 32,
          }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: s <= step ? 'var(--md-primary)' : 'var(--md-outline)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>

          {/* ── Prompt ─────────────────────────────────────────────────── */}
          <p style={{
            margin: '0 0 8px',
            fontSize: 'var(--md-title-md)',
            fontWeight: 600,
            color: 'var(--md-on-surface)',
            fontFamily: 'var(--md-font)',
          }}>
            {step === 1 ? 'Enter a new PIN' : 'Confirm your PIN'}
          </p>
          <p style={{
            margin: '0 0 32px',
            fontSize: 'var(--md-body-sm)',
            color: 'var(--md-on-surface-variant)',
            fontFamily: 'var(--md-font)',
            textAlign: 'center',
          }}>
            {step === 1
              ? 'Choose a 4-digit PIN to protect the app'
              : 'Enter the same PIN again to confirm'}
          </p>

          {/* ── PIN dots ───────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div key={i} style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: i < displayPin.length
                  ? 'var(--md-primary)'
                  : 'var(--md-outline)',
                transition: 'background 0.15s',
              }} />
            ))}
          </div>

          {/* ── Error ──────────────────────────────────────────────────── */}
          <p style={{
            margin: '0 0 24px',
            fontSize: 'var(--md-body-sm)',
            color: 'var(--md-error)',
            fontFamily: 'var(--md-font)',
            minHeight: 18,
            textAlign: 'center',
          }}>
            {error}
          </p>

          {/* ── Keypad ─────────────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 72px)',
            gap: '12px 20px',
          }}>
            {PAD_KEYS.map((key, idx) => {
              const isEmpty = key === '';
              const isBack  = key === '⌫';
              return (
                <button
                  key={idx}
                  onClick={() => !isEmpty && handleKey(key)}
                  disabled={saving || isEmpty}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    border: isEmpty ? 'none' : '1.5px solid var(--md-outline-variant)',
                    background: isEmpty ? 'transparent' : 'var(--md-surface-variant)',
                    cursor: isEmpty ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isBack ? 22 : 26,
                    fontWeight: 500,
                    color: 'var(--md-on-surface)',
                    fontFamily: 'var(--md-font)',
                    transition: 'background 0.1s, transform 0.1s',
                    WebkitTapHighlightColor: 'transparent',
                    opacity: isEmpty ? 0 : 1,
                    outline: 'none',
                  }}
                  onMouseDown={e => {
                    const el = e.currentTarget;
                    el.style.background = 'var(--md-secondary-container)';
                    el.style.transform = 'scale(0.93)';
                  }}
                  onMouseUp={e => {
                    const el = e.currentTarget;
                    el.style.background = 'var(--md-surface-variant)';
                    el.style.transform = 'scale(1)';
                  }}
                  onTouchStart={e => {
                    const el = e.currentTarget;
                    el.style.background = 'var(--md-secondary-container)';
                    el.style.transform = 'scale(0.93)';
                  }}
                  onTouchEnd={e => {
                    const el = e.currentTarget;
                    el.style.background = 'var(--md-surface-variant)';
                    el.style.transform = 'scale(1)';
                  }}
                >
                  {isBack
                    ? <IonIcon icon={backspaceOutline} style={{ fontSize: 22 }} />
                    : key}
                </button>
              );
            })}
          </div>

          {/* ── Confirm indicator when step 2 is complete ─────────────── */}
          {saving && (
            <div style={{
              marginTop: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--md-primary)',
              fontSize: 'var(--md-label-lg)',
              fontFamily: 'var(--md-font)',
            }}>
              <IonIcon icon={checkmarkOutline} />
              PIN set!
            </div>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PinSetupModal;
