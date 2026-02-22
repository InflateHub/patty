import React, { useEffect, useState } from 'react';

/**
 * SplashOverlay — web-layer splash shown right after the native splash fades.
 * Displays "Patty" + "Desire. Commit. Achieve." for ~1.8 s, then fades out.
 */
const SplashOverlay: React.FC = () => {
  // 'visible' → fully opaque, 'fading' → transitioning out, 'gone' → unmounted
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase('fading'), 1800);
    const hideTimer = setTimeout(() => setPhase('gone'), 2400); // 600ms fade
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        background: '#0F1A17',
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 600ms ease',
        pointerEvents: phase === 'fading' ? 'none' : 'all',
      }}
    >
      {/* App icon */}
      <img
        src="/assets/icon/icon.png"
        alt="Patty"
        style={{
          width: 100,
          height: 100,
          borderRadius: 28,
          marginBottom: 28,
          boxShadow: '0 0 40px rgba(92,122,110,0.45)',
          objectFit: 'cover',
        }}
      />

      {/* App name */}
      <div
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontSize: 42,
          fontWeight: 700,
          letterSpacing: '-0.5px',
          color: '#E8F1EE',
          lineHeight: 1,
          marginBottom: 12,
        }}
      >
        Patty
      </div>

      {/* Tagline */}
      <div
        style={{
          fontFamily: "'Roboto', sans-serif",
          fontSize: 13,
          fontWeight: 400,
          letterSpacing: '0.18em',
          color: '#5C7A6E',
          textTransform: 'uppercase',
        }}
      >
        Desire. Commit. Achieve.
      </div>

      {/* Subtle bottom dot */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#5C7A6E',
          opacity: 0.6,
        }}
      />
    </div>
  );
};

export default SplashOverlay;
