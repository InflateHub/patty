import React from 'react';

export const today = (): string => new Date().toISOString().slice(0, 10);

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function isToday(iso: string): boolean {
  return iso === today();
}

export function formatTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit',
  });
}

export const QUICK_AMOUNTS = [150, 250, 500] as const;

/** Format a duration in minutes as "X h Y m" (or "Y min" if < 1 h). */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} m`;
}

/* ── Shared inline style tokens ─────────────────────────────────────── */
export const S = {
  /* Weight entry form */
  valueArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '32px 24px 20px',
  },
  valueInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    textAlign: 'center' as const,
    fontSize: 72,
    fontWeight: 300,
    fontFamily: 'var(--md-font)',
    color: 'var(--md-on-surface)',
    width: '100%',
    caretColor: 'var(--md-primary)',
    lineHeight: 1.1,
    MozAppearance: 'textfield',
  } as React.CSSProperties,
  unitRow: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
  },
  unitChip: (active: boolean) => ({
    padding: '6px 18px',
    borderRadius: 'var(--md-shape-full)',
    border: `1.5px solid ${active ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
    background: active ? 'var(--md-primary-container)' : 'transparent',
    color: active ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
    fontSize: 'var(--md-label-lg)',
    fontFamily: 'var(--md-font)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 150ms',
  }),
  divider: {
    height: 1,
    background: 'var(--md-outline-variant)',
    margin: '0 20px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    gap: 12,
    cursor: 'pointer',
  },
  rowIcon: {
    fontSize: 20,
    color: 'var(--md-on-surface-variant)',
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    fontSize: 'var(--md-body-lg)',
    color: 'var(--md-on-surface)',
    fontFamily: 'var(--md-font)',
  },
  rowHint: {
    fontSize: 'var(--md-body-sm)',
    color: 'var(--md-on-surface-variant)',
    fontFamily: 'var(--md-font)',
  },
  noteInput: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none' as const,
    fontSize: 'var(--md-body-lg)',
    fontFamily: 'var(--md-font)',
    color: 'var(--md-on-surface)',
    caretColor: 'var(--md-primary)',
    lineHeight: 1.5,
    minHeight: 24,
  },
  saveBtn: {
    display: 'block',
    width: 'calc(100% - 40px)',
    margin: '20px auto 0',
    height: 52,
    borderRadius: 'var(--md-shape-full)',
    border: 'none',
    background: 'var(--md-primary)',
    color: 'var(--md-on-primary)',
    fontSize: 'var(--md-label-lg)',
    fontFamily: 'var(--md-font)',
    fontWeight: 500,
    letterSpacing: '.00625em',
    cursor: 'pointer',
  },

  /* Water section */
  ringWrap: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px 0 8px',
  },
  quickAddRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    padding: '12px 16px 20px',
  },
  quickChip: {
    padding: '8px 18px',
    borderRadius: 'var(--md-shape-full)',
    border: '1.5px solid var(--md-outline-variant)',
    background: 'var(--md-surface-container-lowest)',
    color: 'var(--md-on-surface)',
    fontSize: 'var(--md-label-lg)',
    fontFamily: 'var(--md-font)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 120ms, border-color 120ms',
  } as React.CSSProperties,
  goalRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    gap: 12,
    cursor: 'pointer',
    borderTop: '1px solid var(--md-outline-variant)',
  },
  customInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    textAlign: 'center' as const,
    fontSize: 64,
    fontWeight: 300,
    fontFamily: 'var(--md-font)',
    color: 'var(--md-on-surface)',
    width: '100%',
    caretColor: 'var(--md-primary)',
    MozAppearance: 'textfield',
  } as React.CSSProperties,
};
