import React from 'react';

interface WaterRingProps {
  total: number;   // ml drunk today
  goal: number;    // daily goal in ml
  size?: number;   // diameter in px, default 200
}

const STROKE = 14;

export const WaterRing: React.FC<WaterRingProps> = ({ total, goal, size = 200 }) => {
  const radius = (size - STROKE) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = goal > 0 ? Math.min(total / goal, 1) : 0;
  const offset = circumference * (1 - fraction);
  const reached = total >= goal;

  const displayTotal = total >= 1000
    ? `${(total / 1000).toFixed(total % 1000 === 0 ? 0 : 1)} L`
    : `${total}`;
  const unitLabel = total >= 1000 ? '' : 'ml';
  const goalLabel = goal >= 1000
    ? `of ${(goal / 1000).toFixed(goal % 1000 === 0 ? 0 : 1)} L`
    : `of ${goal} ml`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Water intake: ${total} ml of ${goal} ml goal`}
      style={{ display: 'block' }}
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--md-surface-variant)"
        strokeWidth={STROKE}
      />
      {/* Progress */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={reached ? 'var(--md-tertiary)' : 'var(--md-primary)'}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.4,0,.2,1), stroke 300ms' }}
      />
      {/* Centre text — total */}
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={reached ? 'var(--md-tertiary)' : 'var(--md-on-surface)'}
        style={{
          fontSize: size * 0.2,
          fontWeight: 300,
          fontFamily: 'var(--md-font)',
          transition: 'fill 300ms',
        }}
      >
        {displayTotal}
      </text>
      {/* Unit */}
      {unitLabel && (
        <text
          x={cx}
          y={cy + size * 0.13}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--md-on-surface-variant)"
          style={{ fontSize: size * 0.1, fontFamily: 'var(--md-font)' }}
        >
          {unitLabel}
        </text>
      )}
      {/* Goal label */}
      <text
        x={cx}
        y={cy + size * 0.26}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--md-on-surface-variant)"
        style={{ fontSize: size * 0.085, fontFamily: 'var(--md-font)' }}
      >
        {reached ? '🎉 goal reached' : goalLabel}
      </text>
    </svg>
  );
};
