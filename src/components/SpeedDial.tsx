/* SpeedDial — animated FAB that expands into 4 quick-log sub-actions */
import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  addOutline,
  barbellOutline,
  fastFoodOutline,
  scaleOutline,
  waterOutline,
} from 'ionicons/icons';

export type SpeedDialTarget = 'water' | 'weight' | 'food' | 'workout';

interface Action {
  target: SpeedDialTarget;
  emoji: string;
  label: string;
  icon: string;
}

// Ordered bottom-to-top (first in array = closest to main FAB)
const ACTIONS: Action[] = [
  { target: 'workout', emoji: '🏃', label: 'Workout', icon: barbellOutline },
  { target: 'food',    emoji: '🍽️', label: 'Food',    icon: fastFoodOutline },
  { target: 'weight',  emoji: '⚖️', label: 'Weight',  icon: scaleOutline },
  { target: 'water',   emoji: '💧', label: 'Water',   icon: waterOutline },
];

interface SpeedDialProps {
  onSelect: (target: SpeedDialTarget) => void;
}

const SpeedDial: React.FC<SpeedDialProps> = ({ onSelect }) => {
  const [open, setOpen] = useState(false);

  function handleSelect(target: SpeedDialTarget) {
    setOpen(false);
    onSelect(target);
  }

  return (
    <>
      {/* Semi-transparent scrim */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.32)',
          zIndex: 999,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms ease',
        }}
      />

      {/* Speed dial container — fixed, bottom-right */}
      <div
        style={{
          position: 'fixed',
          bottom: 72,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        {/* Sub-FABs — staggered spring animation */}
        {ACTIONS.map((action, i) => {
          // Stagger: bottom action (i=0) appears first
          const delay = `${i * 50}ms`;
          return (
            <div
              key={action.target}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: open ? 1 : 0,
                transform: open
                  ? 'translateY(0) scale(1)'
                  : `translateY(${(ACTIONS.length - i) * 14}px) scale(0.72)`,
                transition: open
                  ? `opacity 240ms ${delay} var(--md-easing-decelerate), transform 300ms ${delay} var(--md-easing-spring)`
                  : `opacity 160ms ease, transform 200ms ease`,
                pointerEvents: open ? 'auto' : 'none',
              }}
            >
              {/* Label chip */}
              <div
                style={{
                  background: 'var(--md-surface)',
                  color: 'var(--md-on-surface)',
                  fontSize: 'var(--md-label-lg)',
                  fontFamily: 'var(--md-font)',
                  fontWeight: 500,
                  padding: '6px 14px',
                  borderRadius: 'var(--md-shape-full)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.16)',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                }}
              >
                {action.emoji} {action.label}
              </div>

              {/* Sub-FAB button */}
              <button
                onClick={() => handleSelect(action.target)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--md-secondary-container)',
                  color: 'var(--md-on-secondary-container)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 12px rgba(0,0,0,0.20)',
                  flexShrink: 0,
                  outline: 'none',
                }}
              >
                <IonIcon icon={action.icon} style={{ fontSize: 22 }} />
              </button>
            </div>
          );
        })}

        {/* Main FAB — rotates 45° when open */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Close quick add' : 'Quick add'}
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--md-shape-xl)',
            background: 'var(--md-primary-container)',
            color: 'var(--md-on-primary-container)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 300ms var(--md-easing-spring)',
            flexShrink: 0,
            outline: 'none',
          }}
        >
          <IonIcon icon={addOutline} style={{ fontSize: 28 }} />
        </button>
      </div>
    </>
  );
};

export default SpeedDial;
