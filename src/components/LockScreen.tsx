/**
 * LockScreen — full-viewport PIN pad overlay shown when the app is locked.
 *
 * Features:
 *  - 4-digit PIN with dot indicator
 *  - Number pad (0-9 + backspace)
 *  - "Use Biometrics" button when biometricAvailable + biometricEnabled
 *  - Error shake animation on wrong PIN
 *  - Attempts to trigger biometric automatically on mount if enabled
 */

import React, { useState, useEffect, useCallback } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { fingerPrintOutline, backspaceOutline } from 'ionicons/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LockScreenProps {
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  onUnlockPin: (pin: string) => Promise<boolean>;
  onUnlockBiometric: () => Promise<boolean>;
}

// ── PAD layout ────────────────────────────────────────────────────────────────
const PAD_KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'] as const;
const PIN_LENGTH = 4;

// ── Styles ────────────────────────────────────────────────────────────────────
const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 99999,
  background: 'var(--md-surface)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px 24px 48px',
  gap: 0,
};

// ── Component ─────────────────────────────────────────────────────────────────

const LockScreen: React.FC<LockScreenProps> = ({
  biometricAvailable,
  biometricEnabled,
  onUnlockPin,
  onUnlockBiometric,
}) => {
  const [pin, setPin]         = useState('');
  const [error, setError]     = useState('');
  const [shake, setShake]     = useState(false);
  const [checking, setChecking] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  const useBio = biometricAvailable && biometricEnabled;

  // ── Trigger biometric automatically on mount ──────────────────────────────
  useEffect(() => {
    if (!useBio) return;
    let cancelled = false;
    (async () => {
      setBioLoading(true);
      const ok = await onUnlockBiometric();
      if (!cancelled && !ok) setBioLoading(false);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount

  // ── Auto-submit when PIN is full ──────────────────────────────────────────
  const submitPin = useCallback(async (candidate: string) => {
    setChecking(true);
    const ok = await onUnlockPin(candidate);
    if (!ok) {
      setShake(true);
      setError('Incorrect PIN. Try again.');
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
    setChecking(false);
  }, [onUnlockPin]);

  const handleKey = useCallback((key: string) => {
    if (checking || bioLoading) return;
    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
      setError('');
      return;
    }
    if (!key) return; // empty spacer cell
    const next = pin + key;
    if (next.length > PIN_LENGTH) return;
    setError('');
    setPin(next);
    if (next.length === PIN_LENGTH) {
      submitPin(next);
    }
  }, [pin, checking, bioLoading, submitPin]);

  const handleBiometric = useCallback(async () => {
    if (bioLoading) return;
    setBioLoading(true);
    const ok = await onUnlockBiometric();
    if (!ok) setBioLoading(false);
  }, [bioLoading, onUnlockBiometric]);

  return (
    <div style={overlay}>
      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <img
        src="/assets/icon/icon.png"
        alt="Patty"
        style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginBottom: 20 }}
      />

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <p style={{
        margin: '0 0 8px',
        fontSize: 'var(--md-title-lg)',
        fontWeight: 600,
        color: 'var(--md-on-surface)',
        fontFamily: 'var(--md-font)',
      }}>
        Unlock Patty
      </p>
      <p style={{
        margin: '0 0 32px',
        fontSize: 'var(--md-body-md)',
        color: 'var(--md-on-surface-variant)',
        fontFamily: 'var(--md-font)',
      }}>
        Enter your PIN to continue
      </p>

      {/* ── PIN dots ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          marginBottom: 12,
          animation: shake ? 'lock-shake 0.45s ease' : undefined,
        }}
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: i < pin.length
                ? 'var(--md-primary)'
                : 'var(--md-outline)',
              transition: 'background 0.15s',
            }}
          />
        ))}
      </div>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      <p style={{
        margin: '0 0 24px',
        fontSize: 'var(--md-body-sm)',
        color: 'var(--md-error)',
        fontFamily: 'var(--md-font)',
        minHeight: 18,
      }}>
        {error}
      </p>

      {/* ── Keypad ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 72px)',
        gap: '12px 20px',
        marginBottom: useBio ? 24 : 0,
      }}>
        {PAD_KEYS.map((key, idx) => {
          const isEmpty = key === '';
          const isBack  = key === '⌫';
          return (
            <button
              key={idx}
              onClick={() => !isEmpty && handleKey(key)}
              disabled={checking || bioLoading || isEmpty}
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

      {/* ── Biometric button ──────────────────────────────────────────── */}
      {useBio && (
        <button
          onClick={handleBiometric}
          disabled={bioLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 24px',
            borderRadius: 'var(--md-shape-full)',
            border: '1.5px solid var(--md-outline)',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 'var(--md-label-lg)',
            color: 'var(--md-primary)',
            fontFamily: 'var(--md-font)',
            fontWeight: 500,
          }}
        >
          {bioLoading
            ? <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
            : <IonIcon icon={fingerPrintOutline} style={{ fontSize: 20 }} />
          }
          Use Biometrics
        </button>
      )}

      {/* ── Keypad loading overlay ────────────────────────────────────── */}
      {checking && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(var(--md-surface-rgb, 255,255,255), 0.4)',
        }}>
          <IonSpinner name="crescent" />
        </div>
      )}

      {/* ── Shake keyframe ────────────────────────────────────────────── */}
      <style>{`
        @keyframes lock-shake {
          0%   { transform: translateX(0); }
          15%  { transform: translateX(-8px); }
          30%  { transform: translateX(8px); }
          45%  { transform: translateX(-6px); }
          60%  { transform: translateX(6px); }
          75%  { transform: translateX(-3px); }
          90%  { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
      `}</style>

      {/* ── Icon hint for keypad ──────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: 'var(--md-on-surface-variant)',
        fontSize: 'var(--md-body-sm)',
        fontFamily: 'var(--md-font)',
        opacity: 0.6,
      }}>
        4-digit PIN
      </div>
    </div>
  );
};

export default LockScreen;
