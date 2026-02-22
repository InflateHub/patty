/**
 * useTheme — 1.6.0 Personalisation Theming
 *
 * Reads pref_theme_seed, pref_theme_mode, pref_font_size from SQLite on mount
 * and applies a full MD3 tonal palette to the document.
 *
 * Strategy:
 *   'system'  — injects a <style id="patty-theme"> with both light +
 *               @media dark variants so the custom seed works in either appearance.
 *   'light'   — writes light tokens as inline styles on <html> (beats @media).
 *   'dark'    — writes dark tokens as inline styles on <html> (beats @media).
 *
 * Exports `applyTheme` for live-preview usage in ProfilePage (no DB write).
 */

import { useEffect } from 'react';
import {
  themeFromSourceColor,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities';
import { getDb } from '../db/database';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ThemeMode = 'system' | 'light' | 'dark';
export type FontSize  = 'default' | 'large' | 'xl';

export const SEED_COLOURS: { label: string; hex: string }[] = [
  { label: 'Slate Green', hex: '#5C7A6E' },   // default — Patty brand
  { label: 'Violet',      hex: '#6750A4' },
  { label: 'Ocean Blue',  hex: '#1B6CA8' },
  { label: 'Forest',      hex: '#5B8C5A' },
  { label: 'Terracotta',  hex: '#B5501B' },
  { label: 'Mauve',       hex: '#8B4C8B' },
  { label: 'Amber',       hex: '#C4791A' },
  { label: 'Rose',        hex: '#9C2D2D' },
];

export const DEFAULT_SEED: string    = '#5C7A6E';
export const DEFAULT_MODE: ThemeMode = 'system';
export const DEFAULT_FONT: FontSize  = 'default';

const STYLE_TAG_ID = 'patty-theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '');
  const full  = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** Build a complete MD3 + Ionic token map for one scheme. */
function buildTokens(seed: string, dark: boolean): Record<string, string> {
  let argb: number;
  try { argb = argbFromHex(seed); } catch { argb = argbFromHex(DEFAULT_SEED); }
  const theme = themeFromSourceColor(argb);

  const p  = theme.palettes.primary;
  const s  = theme.palettes.secondary;
  const t  = theme.palettes.tertiary;
  const n  = theme.palettes.neutral;
  const nv = theme.palettes.neutralVariant;
  const e  = theme.palettes.error;
  const h  = (pal: typeof p, tone: number) => hexFromArgb(pal.tone(tone));

  const md: Record<string, string> = dark
    ? {
        '--md-primary':              h(p, 80),
        '--md-on-primary':           h(p, 20),
        '--md-primary-container':    h(p, 30),
        '--md-on-primary-container': h(p, 90),
        '--md-secondary':              h(s, 80),
        '--md-on-secondary':           h(s, 20),
        '--md-secondary-container':    h(s, 30),
        '--md-on-secondary-container': h(s, 90),
        '--md-tertiary':              h(t, 80),
        '--md-on-tertiary':           h(t, 20),
        '--md-tertiary-container':    h(t, 30),
        '--md-on-tertiary-container': h(t, 90),
        '--md-error':              h(e, 80),
        '--md-on-error':           h(e, 20),
        '--md-error-container':    h(e, 30),
        '--md-on-error-container': h(e, 90),
        '--md-background':         h(n, 6),
        '--md-on-background':      h(n, 90),
        '--md-surface':            h(n, 6),
        '--md-on-surface':         h(n, 90),
        '--md-surface-variant':    h(nv, 30),
        '--md-on-surface-variant': h(nv, 80),
        '--md-surface-container-lowest':  h(n, 4),
        '--md-surface-container-low':     h(n, 10),
        '--md-surface-container':         h(n, 12),
        '--md-surface-container-high':    h(n, 17),
        '--md-surface-container-highest': h(n, 22),
        '--md-outline':         h(nv, 60),
        '--md-outline-variant': h(nv, 30),
        '--md-inverse-surface':    h(n, 90),
        '--md-inverse-on-surface': h(n, 20),
        '--md-inverse-primary':    h(p, 40),
      }
    : {
        '--md-primary':              h(p, 40),
        '--md-on-primary':           h(p, 100),
        '--md-primary-container':    h(p, 90),
        '--md-on-primary-container': h(p, 10),
        '--md-secondary':              h(s, 40),
        '--md-on-secondary':           h(s, 100),
        '--md-secondary-container':    h(s, 90),
        '--md-on-secondary-container': h(s, 10),
        '--md-tertiary':              h(t, 40),
        '--md-on-tertiary':           h(t, 100),
        '--md-tertiary-container':    h(t, 90),
        '--md-on-tertiary-container': h(t, 10),
        '--md-error':              h(e, 40),
        '--md-on-error':           h(e, 100),
        '--md-error-container':    h(e, 90),
        '--md-on-error-container': h(e, 10),
        '--md-background':         h(n, 99),
        '--md-on-background':      h(n, 10),
        '--md-surface':            h(n, 99),
        '--md-on-surface':         h(n, 10),
        '--md-surface-variant':    h(nv, 90),
        '--md-on-surface-variant': h(nv, 30),
        '--md-surface-container-lowest':  h(n, 100),
        '--md-surface-container-low':     h(n, 96),
        '--md-surface-container':         h(n, 94),
        '--md-surface-container-high':    h(n, 92),
        '--md-surface-container-highest': h(n, 90),
        '--md-outline':         h(nv, 50),
        '--md-outline-variant': h(nv, 80),
        '--md-inverse-surface':    h(n, 20),
        '--md-inverse-on-surface': h(n, 95),
        '--md-inverse-primary':    h(p, 80),
      };

  const pri = md['--md-primary'];
  const bg  = md['--md-background'];
  const fg  = md['--md-on-background'];
  const scl = md['--md-surface-container-low'];
  const sc  = md['--md-surface-container'];
  const osv = md['--md-on-surface-variant'];
  const onS = md['--md-on-surface'];

  return {
    ...md,
    '--ion-background-color':               bg,
    '--ion-background-color-rgb':           hexToRgbString(bg),
    '--ion-text-color':                     fg,
    '--ion-text-color-rgb':                 hexToRgbString(fg),
    '--ion-toolbar-background':             scl,
    '--ion-toolbar-color':                  onS,
    '--ion-tab-bar-background':             sc,
    '--ion-tab-bar-color':                  osv,
    '--ion-tab-bar-color-selected':         pri,
    '--ion-card-background':                dark ? sc : md['--md-surface-container-lowest'],
    '--ion-border-color':                   md['--md-outline-variant'],
    '--ion-color-primary':                  pri,
    '--ion-color-primary-rgb':              hexToRgbString(pri),
    '--ion-color-primary-contrast':         md['--md-on-primary'],
    '--ion-color-primary-contrast-rgb':     hexToRgbString(md['--md-on-primary']),
    '--ion-color-primary-shade':            h(p, dark ? 70 : 30),
    '--ion-color-primary-tint':             h(p, dark ? 85 : 50),
  };
}

function tokensToBlock(tokens: Record<string, string>): string {
  return Object.entries(tokens).map(([k, v]) => `  ${k}: ${v};`).join('\n');
}

// ── All inline keys that need clearing when switching to 'system' ─────────────
const ALL_FORCED_KEYS = [
  '--md-primary','--md-on-primary','--md-primary-container','--md-on-primary-container',
  '--md-secondary','--md-on-secondary','--md-secondary-container','--md-on-secondary-container',
  '--md-tertiary','--md-on-tertiary','--md-tertiary-container','--md-on-tertiary-container',
  '--md-error','--md-on-error','--md-error-container','--md-on-error-container',
  '--md-background','--md-on-background','--md-surface','--md-on-surface',
  '--md-surface-variant','--md-on-surface-variant',
  '--md-surface-container-lowest','--md-surface-container-low',
  '--md-surface-container','--md-surface-container-high','--md-surface-container-highest',
  '--md-outline','--md-outline-variant',
  '--md-inverse-surface','--md-inverse-on-surface','--md-inverse-primary',
  '--ion-background-color','--ion-background-color-rgb',
  '--ion-text-color','--ion-text-color-rgb',
  '--ion-toolbar-background','--ion-toolbar-color',
  '--ion-tab-bar-background','--ion-tab-bar-color','--ion-tab-bar-color-selected',
  '--ion-card-background','--ion-border-color',
  '--ion-color-primary','--ion-color-primary-rgb',
  '--ion-color-primary-contrast','--ion-color-primary-contrast-rgb',
  '--ion-color-primary-shade','--ion-color-primary-tint',
];

// ── Public applyTheme ─────────────────────────────────────────────────────────

/**
 * Apply the theme to the document immediately (synchronous).
 * Call this from ProfilePage for live preview, and after saving prefs.
 */
export function applyTheme(
  seed: string       = DEFAULT_SEED,
  mode: ThemeMode    = DEFAULT_MODE,
  fontSize: FontSize = DEFAULT_FONT,
): void {
  const el = document.documentElement;

  // Font size — always applied regardless of mode
  const bodyBase =
    fontSize === 'xl'    ? '1.125rem'  :
    fontSize === 'large' ? '1.0625rem' : '1rem';
  el.style.setProperty('--md-body-lg', bodyBase);

  if (mode === 'system') {
    // ── System: clear forced inline styles, inject <style> for custom seed ──
    for (const k of ALL_FORCED_KEYS) el.style.removeProperty(k);
    el.removeAttribute('data-theme');
    _injectStyleTag(seed);
    return;
  }

  // ── Light / Dark: remove injected style tag; write inline ────────────────
  document.getElementById(STYLE_TAG_ID)?.remove();
  const dark   = mode === 'dark';
  const tokens = buildTokens(seed, dark);
  el.setAttribute('data-theme', dark ? 'dark' : 'light');
  for (const [k, v] of Object.entries(tokens)) {
    el.style.setProperty(k, v);
  }
}

/**
 * Inject (or update) a <style id="patty-theme"> element so a custom seed
 * colour is correctly reflected in both OS light and OS dark in 'system' mode.
 */
function _injectStyleTag(seed: string): void {
  const existing = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (existing?.dataset['seed'] === seed) return;   // no-op if unchanged
  existing?.remove();

  const lightCSS = tokensToBlock(buildTokens(seed, false));
  const darkCSS  = tokensToBlock(buildTokens(seed, true));
  const css =
    `:root {\n${lightCSS}\n}\n` +
    `@media (prefers-color-scheme: dark) {\n  :root {\n${darkCSS}\n  }\n}`;

  const tag = document.createElement('style');
  tag.id = STYLE_TAG_ID;
  tag.dataset['seed'] = seed;
  tag.textContent = css;
  document.head.appendChild(tag);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/** Mount at app root (AppContent). Reads saved prefs from DB once on startup. */
export function useTheme(): void {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getDb();
        const res = await db.query(
          "SELECT key, value FROM settings " +
          "WHERE key IN ('pref_theme_seed','pref_theme_mode','pref_font_size');",
        );
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const row of res.values ?? []) map[row.key] = row.value;
        applyTheme(
          map['pref_theme_seed'] ?? DEFAULT_SEED,
          (map['pref_theme_mode'] as ThemeMode) ?? DEFAULT_MODE,
          (map['pref_font_size']  as FontSize)  ?? DEFAULT_FONT,
        );
      } catch {
        // DB not ready — CSS-file defaults remain active; no crash
      }
    })();
    return () => { cancelled = true; };
  }, []);
}
