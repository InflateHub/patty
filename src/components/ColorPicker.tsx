/**
 * ColorPicker — 2.4.0
 * Fully custom HSV colour picker. No third-party libraries.
 *
 * Layout (inside an IonModal bottom sheet):
 *   1. SV canvas  — drag to pick saturation (X) + value (Y) for the current hue
 *   2. Hue bar    — horizontal range slider, full rainbow gradient
 *   3. Preview    — split swatch (old | new) + validated hex text input
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

// ── Colour math ───────────────────────────────────────────────────────────────

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function hsvToHex(h: number, s: number, v: number): string {
  const [r, g, b] = hsvToRgb(h, s, v);
  return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if      (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else                h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : Math.round((d / max) * 100);
  const v2 = Math.round(max * 100);
  return [h, s, v2];
}

function hexToHsv(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(clean)) return [0, 0, 100];
  const n = parseInt(clean, 16);
  return rgbToHsv((n >> 16) & 255, (n >> 8) & 255, n & 255);
}

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface ColorPickerProps {
  isOpen: boolean;
  initialColor: string; // hex  e.g. "#5C7A6E"
  onClose: () => void;
  onApply: (hex: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ isOpen, initialColor, onClose, onApply }) => {
  const svCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);

  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(initialColor));
  const [hexInput, setHexInput] = useState(initialColor.toUpperCase());
  const [hexError, setHexError] = useState(false);

  // Re-initialise when modal opens with (possibly new) initialColor
  useEffect(() => {
    if (isOpen) {
      const parsed = hexToHsv(initialColor);
      setHsv(parsed);
      setHexInput(hsvToHex(...parsed).toUpperCase());
      setHexError(false);
    }
  }, [isOpen, initialColor]);

  // Redraw SV canvas when hue changes
  useEffect(() => {
    const canvas = svCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;

    // Saturation gradient: white → pure hue
    const hueHex = hsvToHex(hsv[0], 100, 100);
    const gradS = ctx.createLinearGradient(0, 0, width, 0);
    gradS.addColorStop(0, '#ffffff');
    gradS.addColorStop(1, hueHex);
    ctx.fillStyle = gradS;
    ctx.fillRect(0, 0, width, height);

    // Value gradient: transparent → black (overlay)
    const gradV = ctx.createLinearGradient(0, 0, 0, height);
    gradV.addColorStop(0, 'rgba(0,0,0,0)');
    gradV.addColorStop(1, '#000000');
    ctx.fillStyle = gradV;
    ctx.fillRect(0, 0, width, height);
  }, [hsv[0]]);

  // Convert pointer position on canvas to [s, v]
  const getSV = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const canvas = svCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return [Math.round(x * 100), Math.round((1 - y) * 100)];
  }, []);

  const applyNewSV = useCallback((s: number, v: number) => {
    setHsv(([h]) => {
      const next: [number, number, number] = [h, s, v];
      setHexInput(hsvToHex(...next).toUpperCase());
      setHexError(false);
      return next;
    });
  }, []);

  const handleSvPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const sv = getSV(e.clientX, e.clientY);
    if (sv) applyNewSV(sv[0], sv[1]);
  };

  const handleSvPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    const sv = getSV(e.clientX, e.clientY);
    if (sv) applyNewSV(sv[0], sv[1]);
  };

  const handleSvPointerUp = () => { dragging.current = false; };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = Number(e.target.value);
    setHsv(([, s, v]) => {
      const next: [number, number, number] = [h, s, v];
      setHexInput(hsvToHex(...next).toUpperCase());
      setHexError(false);
      return next;
    });
  };

  const handleHexInput = (raw: string) => {
    setHexInput(raw.toUpperCase());
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    if (isValidHex(hex)) {
      setHexError(false);
      setHsv(hexToHsv(hex));
    } else {
      setHexError(raw.length > 0);
    }
  };

  const currentHex = hsvToHex(...hsv);
  // Thumb position as percentages
  const thumbLeft = `${hsv[1]}%`;
  const thumbTop  = `${100 - hsv[2]}%`;

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={0.88}
      breakpoints={[0, 0.88, 1]}
    >
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>Cancel</IonButton>
          </IonButtons>
          <IonTitle>Custom Colour</IonTitle>
          <IonButtons slot="end">
            <IonButton strong onClick={() => { onApply(isValidHex(hexInput.startsWith('#') ? hexInput : `#${hexInput}`) ? (hexInput.startsWith('#') ? hexInput : `#${hexInput}`) : currentHex); }}>
              Apply
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div style={{ padding: '20px 20px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ── SV canvas ──────────────────────────────────────────────── */}
          <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', touchAction: 'none', userSelect: 'none', flexShrink: 0 }}>
            <canvas
              ref={svCanvasRef}
              width={600}
              height={240}
              style={{ display: 'block', width: '100%', height: 200, cursor: 'crosshair' }}
              onPointerDown={handleSvPointerDown}
              onPointerMove={handleSvPointerMove}
              onPointerUp={handleSvPointerUp}
              onPointerCancel={handleSvPointerUp}
            />
            {/* Crosshair thumb */}
            <div
              style={{
                position: 'absolute',
                left: thumbLeft,
                top: thumbTop,
                transform: 'translate(-50%, -50%)',
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: '2.5px solid #fff',
                boxShadow: '0 1px 5px rgba(0,0,0,0.55)',
                background: currentHex,
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* ── Hue bar ────────────────────────────────────────────────── */}
          <div>
            <p style={{ margin: '0 0 10px', fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)', fontWeight: 500 }}>Hue</p>
            <input
              className="cp-hue-slider"
              type="range"
              min={0}
              max={359}
              value={hsv[0]}
              onChange={handleHueChange}
            />
          </div>

          {/* ── Preview + hex input ────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Before / after swatch */}
            <div
              style={{
                display: 'flex',
                borderRadius: 8,
                overflow: 'hidden',
                width: 56,
                height: 40,
                flexShrink: 0,
                border: '1.5px solid var(--md-outline-variant)',
              }}
            >
              <div style={{ flex: 1, background: initialColor }} title="Previous colour" />
              <div style={{ flex: 1, background: currentHex }} title="New colour" />
            </div>

            {/* Hex text input */}
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={hexInput}
                maxLength={7}
                placeholder="#RRGGBB"
                spellCheck={false}
                onChange={e => handleHexInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: hexError
                    ? '2px solid var(--md-error)'
                    : '2px solid var(--md-outline-variant)',
                  background: 'var(--md-surface-variant)',
                  color: 'var(--md-on-surface)',
                  fontFamily: 'monospace',
                  fontSize: 16,
                  outline: 'none',
                  boxSizing: 'border-box',
                  letterSpacing: 2,
                }}
              />
              {hexError && (
                <span
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--md-error)',
                    fontSize: 'var(--md-label-sm)',
                    fontFamily: 'var(--md-font)',
                  }}
                >
                  Invalid
                </span>
              )}
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ColorPicker;
