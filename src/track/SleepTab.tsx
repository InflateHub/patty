import React, { useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSkeletonText,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { createOutline, moonOutline, timeOutline, trash } from 'ionicons/icons';
import { useSleepLog } from '../hooks/useSleepLog';
import type { SleepEntry } from '../hooks/useSleepLog';
import { S, formatDate, formatDuration, formatTime, today } from './trackUtils';

/* ── Constants ───────────────────────────────────────────────────────── */

const GOAL_MIN = 480; // 8-hour default sleep goal
const SVG_CX = 110;
const SVG_CY = 110;
const SVG_R  = 86;

/* ── Helpers ─────────────────────────────────────────────────────────── */

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Polar → SVG coordinate. Midnight (0 min) is at the top. */
function polarPoint(cx: number, cy: number, r: number, minutesFromMidnight: number) {
  const angleDeg = (minutesFromMidnight / 1440) * 360 - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

/** SVG arc path from startMin to endMin (handles overnight crossing midnight). */
function buildArcPath(
  cx: number, cy: number, r: number,
  startMin: number, endMin: number
): string {
  const duration = endMin > startMin ? endMin - startMin : 1440 - startMin + endMin;
  const largeArc = duration > 720 ? 1 : 0;
  const start = polarPoint(cx, cy, r, startMin);
  const end   = polarPoint(cx, cy, r, endMin);
  if (Math.abs(start.x - end.x) < 0.5 && Math.abs(start.y - end.y) < 0.5) {
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 1 1 ${(end.x + 0.1).toFixed(2)} ${end.y.toFixed(2)}`;
  }
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function getTomorrow(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function buildTs(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00.000`;
}

function calcDuration(
  bedDate: string, bedTime: string,
  wakeDate: string, wakeTime: string
): number | null {
  if (!bedTime || !wakeTime) return null;
  const bed  = new Date(buildTs(bedDate, bedTime));
  const wake = new Date(buildTs(wakeDate, wakeTime));
  const diff = Math.round((wake.getTime() - bed.getTime()) / 60_000);
  return diff > 0 && diff <= 960 ? diff : null;
}

function sleepScore(durationMin: number, quality: number): { label: string; color: string } {
  const h = durationMin / 60;
  if (h >= 7 && quality >= 4) return { label: 'Great', color: 'var(--md-primary)' };
  if (h >= 6.5 && quality >= 3) return { label: 'Good',  color: 'var(--md-secondary)' };
  if (h >= 5.5 && quality >= 2) return { label: 'Fair',  color: 'var(--md-outline)' };
  return { label: 'Short', color: 'var(--md-error)' };
}

function qualityStars(q: number): string {
  return '★'.repeat(q) + '☆'.repeat(5 - q);
}

const timeInputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: 'var(--md-title-sm)',
  fontFamily: 'var(--md-font)',
  color: 'var(--md-on-surface)',
  cursor: 'pointer',
  WebkitAppearance: 'none',
} as React.CSSProperties;

const starBtn = (active: boolean): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  padding: '4px 2px',
  fontSize: 28,
  cursor: 'pointer',
  color: active ? 'var(--md-primary)' : 'var(--md-outline)',
  transition: 'color 120ms',
});

/* ── SleepArc ────────────────────────────────────────────────────────── */

interface SleepArcProps {
  bedMinutes: number;
  wakeMinutes: number;
  durationMin: number;
  score: { label: string; color: string };
}

const SleepArc: React.FC<SleepArcProps> = ({ bedMinutes, wakeMinutes, durationMin, score }) => {
  const arcPath = buildArcPath(SVG_CX, SVG_CY, SVG_R, bedMinutes, wakeMinutes);
  const bedPt   = polarPoint(SVG_CX, SVG_CY, SVG_R, bedMinutes);
  const wakePt  = polarPoint(SVG_CX, SVG_CY, SVG_R, wakeMinutes);

  const TICKS: { min: number; label: string }[] = [
    { min: 0,    label: '12a' },
    { min: 360,  label: '6a'  },
    { min: 720,  label: '12p' },
    { min: 1080, label: '6p'  },
  ];

  return (
    <svg viewBox="0 0 220 220" style={{ width: '100%', maxWidth: 220, display: 'block', margin: '0 auto' }}>
      {/* Background track */}
      <circle cx={SVG_CX} cy={SVG_CY} r={SVG_R} fill="none" stroke="var(--md-surface-variant)" strokeWidth={10} />
      {/* Sleep arc */}
      <path d={arcPath} fill="none" stroke={score.color} strokeWidth={10} strokeLinecap="round" />
      {/* Tick marks + labels */}
      {TICKS.map((t) => {
        const inner = polarPoint(SVG_CX, SVG_CY, SVG_R - 7, t.min);
        const outer = polarPoint(SVG_CX, SVG_CY, SVG_R + 7, t.min);
        const lbl   = polarPoint(SVG_CX, SVG_CY, SVG_R + 20, t.min);
        return (
          <g key={t.min}>
            <line
              x1={inner.x.toFixed(2)} y1={inner.y.toFixed(2)}
              x2={outer.x.toFixed(2)} y2={outer.y.toFixed(2)}
              stroke="var(--md-outline-variant)" strokeWidth={1.5}
            />
            <text
              x={lbl.x.toFixed(2)} y={lbl.y.toFixed(2)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fill="var(--md-on-surface-variant)" fontFamily="var(--md-font)"
            >
              {t.label}
            </text>
          </g>
        );
      })}
      {/* Bedtime dot (filled) */}
      <circle cx={bedPt.x.toFixed(2)} cy={bedPt.y.toFixed(2)} r={7} fill={score.color} stroke="var(--md-surface)" strokeWidth={2} />
      {/* Wake dot (hollow) */}
      <circle cx={wakePt.x.toFixed(2)} cy={wakePt.y.toFixed(2)} r={7} fill="var(--md-surface)" stroke={score.color} strokeWidth={2.5} />
      {/* Center: duration */}
      <text x={SVG_CX} y={SVG_CY - 10} textAnchor="middle" fontSize="30" fontWeight="300" fill="var(--md-on-surface)" fontFamily="var(--md-font)">
        {formatDuration(durationMin)}
      </text>
      <text x={SVG_CX} y={SVG_CY + 14} textAnchor="middle" fontSize="11" fill={score.color} fontFamily="var(--md-font)" fontWeight="600">
        {score.label}
      </text>
    </svg>
  );
};

/* ── WeekBars ────────────────────────────────────────────────────────── */

const WeekBars: React.FC<{
  entries: SleepEntry[];
  onBarTap: (entry: SleepEntry) => void;
}> = ({ entries, onBarTap }) => {
  const todayStr = today();

  const days = useMemo(() => {
    const result: { date: string; label: string; entry: SleepEntry | null }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry   = entries.find((e) => e.date === dateStr) ?? null;
      const label   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()];
      result.push({ date: dateStr, label, entry });
    }
    return result;
  }, [entries]);

  const MAX_H = 64;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, padding: '4px 0 0', justifyContent: 'space-between' }}>
      {days.map(({ date, label, entry }) => {
        const isToday = date === todayStr;
        const barH    = entry ? Math.min((entry.duration_min / GOAL_MIN) * MAX_H, MAX_H + 8) : 4;
        const color   = entry ? sleepScore(entry.duration_min, entry.quality).color : 'var(--md-surface-variant)';
        return (
          <div
            key={date}
            title={entry ? `${formatDuration(entry.duration_min)} · ${qualityStars(entry.quality)}` : label}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: entry ? 'pointer' : 'default' }}
            onClick={() => entry && onBarTap(entry)}
          >
            <div style={{
              width: '100%',
              height: barH,
              background: color,
              borderRadius: 4,
              opacity: entry ? (isToday ? 1 : 0.6) : 0.35,
              outline: isToday ? `2px solid ${color}` : 'none',
              outlineOffset: 2,
              transition: 'height 300ms ease',
            }} />
            <span style={{
              fontSize: 10,
              marginTop: 5,
              fontFamily: 'var(--md-font)',
              color: isToday ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
              fontWeight: isToday ? 700 : 400,
            }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ── Component ───────────────────────────────────────────────────────── */

interface SleepTabProps {
  openTrigger?: number;
}

export const SleepTab: React.FC<SleepTabProps> = ({ openTrigger }) => {
  const { entries, lastNightEntry, loading, addEntry, updateEntry, deleteEntry, avgDurationMin } = useSleepLog();

  const [modalOpen, setModalOpen]         = useState(false);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [bedtimeInput, setBedtimeInput]   = useState('22:00');
  const [waketimeInput, setWaketimeInput] = useState('07:00');
  const [quality, setQuality]             = useState(3);
  const [note, setNote]                   = useState('');
  const [saving, setSaving]               = useState(false);
  const [errorMsg, setErrorMsg]           = useState<string | null>(null);
  const [showHistory, setShowHistory]     = useState(false);

  const [presentAlert] = useIonAlert();

  const todayStr = today();

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  /** Entry for today or last night — drives edit mode. */
  const existingTodayEntry = useMemo(() => {
    if (!lastNightEntry) return null;
    if (lastNightEntry.date === todayStr || lastNightEntry.date === yesterday) return lastNightEntry;
    return null;
  }, [lastNightEntry, todayStr, yesterday]);

  /** Wake date: if wake time ≤ bed time the wake is next day. */
  const wakeDate = useMemo(() => {
    if (!bedtimeInput || !waketimeInput) return todayStr;
    return waketimeInput <= bedtimeInput ? getTomorrow(todayStr) : todayStr;
  }, [bedtimeInput, waketimeInput, todayStr]);

  const liveDuration = useMemo(
    () => calcDuration(todayStr, bedtimeInput, wakeDate, waketimeInput),
    [todayStr, bedtimeInput, wakeDate, waketimeInput]
  );

  /* FAB trigger from Track.tsx — always opens, edit or add */
  useEffect(() => {
    if (!openTrigger) return;
    openModal(existingTodayEntry);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTrigger]);

  function openModal(existing: SleepEntry | null = null) {
    if (existing) {
      setBedtimeInput(existing.bedtime.slice(11, 16));
      setWaketimeInput(existing.waketime.slice(11, 16));
      setQuality(existing.quality);
      setNote(existing.note ?? '');
      setEditingId(existing.id);
    } else {
      setBedtimeInput('22:00');
      setWaketimeInput('07:00');
      setQuality(3);
      setNote('');
      setEditingId(null);
    }
    setModalOpen(true);
  }

  async function handleSave() {
    if (liveDuration === null) {
      await presentAlert({
        header: 'Invalid times',
        message: 'Wake-up must be after bedtime (max 16 h).',
        buttons: ['OK'],
      });
      return;
    }
    setSaving(true);
    try {
      const bedTs  = buildTs(todayStr, bedtimeInput);
      const wakeTs = buildTs(wakeDate, waketimeInput);
      if (editingId) {
        await updateEntry(editingId, bedTs, wakeTs, quality, note.trim() || undefined);
      } else {
        await addEntry(bedTs, wakeTs, quality, note.trim() || undefined);
      }
      setModalOpen(false);
    } catch (err) {
      if (err instanceof Error && err.message === 'DUPLICATE_DATE') {
        await presentAlert({
          header: 'Already logged',
          message: 'A sleep entry already exists for this date. Tap Edit to update it.',
          buttons: ['OK'],
        });
      } else {
        await presentAlert({ header: 'Error', message: 'Could not save entry.', buttons: ['OK'] });
      }
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string) {
    presentAlert({
      header: 'Delete entry',
      message: 'Remove this sleep record?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try { await deleteEntry(id); }
            catch { setErrorMsg('Could not delete entry.'); }
          },
        },
      ],
    });
  }

  const arcData = useMemo(() => {
    if (!lastNightEntry) return null;
    return {
      bedMin:  timeToMinutes(lastNightEntry.bedtime.slice(11, 16)),
      wakeMin: timeToMinutes(lastNightEntry.waketime.slice(11, 16)),
    };
  }, [lastNightEntry]);

  const score = useMemo(() => {
    if (!lastNightEntry) return null;
    return sleepScore(lastNightEntry.duration_min, lastNightEntry.quality);
  }, [lastNightEntry]);

  const goalPct = lastNightEntry ? Math.min(lastNightEntry.duration_min / GOAL_MIN, 1) : 0;

  return (
    <>
      {/* ── Loading skeleton ───────────────────────────────────────── */}
      {loading && (
        <IonCard>
          <IonCardContent>
            <IonSkeletonText animated style={{ width: 200, height: 200, margin: '16px auto', borderRadius: '50%' }} />
          </IonCardContent>
        </IonCard>
      )}


      {/* ── Main Arc Card ─────────────────────────────────────────── */}
      {!loading && (
        <IonCard>
          <IonCardContent>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{
                fontSize: 'var(--md-label-lg)',
                fontFamily: 'var(--md-font)',
                color: 'var(--md-on-surface-variant)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}>
                Last Night
              </span>
              <button
                onClick={() => openModal(existingTodayEntry)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'var(--md-surface-variant)',
                  border: 'none',
                  borderRadius: 'var(--md-shape-full)',
                  padding: '6px 14px',
                  fontSize: 'var(--md-label-md)',
                  fontFamily: 'var(--md-font)',
                  color: 'var(--md-on-surface-variant)',
                  cursor: 'pointer',
                }}
              >
                <IonIcon icon={existingTodayEntry ? createOutline : moonOutline} style={{ fontSize: 14 }} />
                {existingTodayEntry ? 'Edit' : 'Log sleep'}
              </button>
            </div>

            {lastNightEntry && arcData && score ? (
              <>
                <SleepArc
                  bedMinutes={arcData.bedMin}
                  wakeMinutes={arcData.wakeMin}
                  durationMin={lastNightEntry.duration_min}
                  score={score}
                />

                {/* Time range + stars */}
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <div style={{ fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
                    {formatTime(lastNightEntry.bedtime)}
                    <span style={{ margin: '0 6px', opacity: 0.5 }}>&rarr;</span>
                    {formatTime(lastNightEntry.waketime)}
                    <span style={{ margin: '0 6px', opacity: 0.4 }}>&middot;</span>
                    {formatDate(lastNightEntry.date)}
                  </div>
                  <div style={{ fontSize: 17, letterSpacing: 3, marginTop: 6, color: score.color }}>
                    {qualityStars(lastNightEntry.quality)}
                  </div>
                  {lastNightEntry.note && (
                    <div style={{
                      marginTop: 6,
                      fontSize: 'var(--md-body-sm)',
                      fontFamily: 'var(--md-font)',
                      color: 'var(--md-on-surface-variant)',
                      fontStyle: 'italic',
                    }}>
                      {lastNightEntry.note}
                    </div>
                  )}
                </div>

                {/* Goal progress bar */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
                      Goal &middot; 8 h
                    </span>
                    <span style={{ fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', color: score.color, fontWeight: 600 }}>
                      {Math.round(goalPct * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--md-surface-variant)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${goalPct * 100}%`,
                      background: score.color,
                      borderRadius: 3,
                      transition: 'width 500ms ease',
                    }} />
                  </div>
                  {avgDurationMin !== null && entries.length > 1 && (
                    <div style={{
                      marginTop: 6,
                      fontSize: 'var(--md-label-sm)',
                      fontFamily: 'var(--md-font)',
                      color: 'var(--md-on-surface-variant)',
                      textAlign: 'right',
                    }}>
                      avg {formatDuration(avgDurationMin)} &middot; {entries.length} nights
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 0 28px' }}>
                <div style={{ fontSize: 64, opacity: 0.2, marginBottom: 16, lineHeight: 1 }}>{'\uD83C\uDF19'}</div>
                <p style={{ margin: 0, fontSize: 'var(--md-body-lg)', fontWeight: 500, fontFamily: 'var(--md-font)', color: 'var(--md-on-surface)' }}>
                  No sleep logged yet
                </p>
                <p style={{ margin: '8px 0 0', fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
                  Tap <strong>Log sleep</strong> to record last night.
                </p>
              </div>
            )}
          </IonCardContent>
        </IonCard>
      )}

      {/* ── 7-night chart ──────────────────────────────────────── */}
      {entries.length > 0 && (
        <IonCard>
          <IonCardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{
                fontSize: 'var(--md-label-lg)',
                fontFamily: 'var(--md-font)',
                color: 'var(--md-on-surface-variant)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}>
                7 Nights
              </span>
            </div>
            <WeekBars entries={entries} onBarTap={(entry) => openModal(entry)} />
          </IonCardContent>
        </IonCard>
      )}

      {/* ── History ───────────────────────────────────────────────── */}
      {entries.length > 0 && (
        <IonCard style={{ marginBottom: 80 }}>
          <IonCardContent style={{ padding: '0 0 4px' }}>
            <button
              onClick={() => setShowHistory((h) => !h)}
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                padding: '14px 16px',
                fontSize: 'var(--md-label-lg)',
                fontFamily: 'var(--md-font)',
                color: 'var(--md-on-surface-variant)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                cursor: 'pointer',
              }}
            >
              All History ({entries.length})
              <span style={{ fontSize: 18, transition: 'transform 200ms', display: 'inline-block', transform: showHistory ? 'rotate(180deg)' : 'none' }}>
                &#8964;
              </span>
            </button>
            {showHistory && (
              <IonList lines="inset" style={{ margin: 0, padding: 0 }}>
                {entries.map((entry: SleepEntry) => (
                  <IonItemSliding key={entry.id}>
                    <IonItem button onClick={() => openModal(entry)}>
                      <IonIcon icon={moonOutline} slot="start" style={{ color: 'var(--md-primary)', fontSize: 20 }} />
                      <IonLabel>
                        <h3 style={{ fontWeight: 500, fontFamily: 'var(--md-font)' }}>{formatDuration(entry.duration_min)}</h3>
                        <p style={{ color: 'var(--md-on-surface-variant)', fontFamily: 'var(--md-font)' }}>
                          {formatDate(entry.date)}&nbsp;&nbsp;&middot;&nbsp;&nbsp;
                          {formatTime(entry.bedtime)} &rarr; {formatTime(entry.waketime)}
                        </p>
                        {entry.note && (
                          <p style={{ color: 'var(--md-on-surface-variant)', fontStyle: 'italic', fontFamily: 'var(--md-font)' }}>
                            {entry.note}
                          </p>
                        )}
                      </IonLabel>
                      <IonNote slot="end" style={{ fontSize: 14, letterSpacing: 2, color: sleepScore(entry.duration_min, entry.quality).color }}>
                        {qualityStars(entry.quality)}
                      </IonNote>
                    </IonItem>
                    <IonItemOptions side="end">
                      <IonItemOption color="danger" onClick={() => handleDelete(entry.id)}>
                        <IonIcon slot="icon-only" icon={trash} />
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      )}

      <IonToast
        isOpen={!!errorMsg}
        message={errorMsg ?? ''}
        duration={3000}
        color="danger"
        onDidDismiss={() => setErrorMsg(null)}
      />

      {/* ── Log / Edit modal ──────────────────────────────────────── */}
      <IonModal
        isOpen={modalOpen}
        onDidDismiss={() => setModalOpen(false)}
        initialBreakpoint={0.85}
        breakpoints={[0, 0.85]}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setModalOpen(false)}>Cancel</IonButton>
            </IonButtons>
            <IonTitle>{editingId ? 'Edit Sleep' : 'Log Sleep'}</IonTitle>
            <IonButtons slot="end">
              <IonButton strong onClick={handleSave} disabled={saving || liveDuration === null}>
                Save
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {/* Live duration + goal % */}
          <div style={{ textAlign: 'center', padding: '24px 0 4px' }}>
            <span style={{
              fontSize: 52,
              fontWeight: 300,
              fontFamily: 'var(--md-font)',
              color: liveDuration !== null ? 'var(--md-primary)' : 'var(--md-outline)',
              display: 'block',
              lineHeight: 1.1,
            }}>
              {liveDuration !== null ? formatDuration(liveDuration) : '—'}
            </span>
            {liveDuration !== null && (
              <span style={{
                fontSize: 'var(--md-label-sm)',
                fontFamily: 'var(--md-font)',
                color: sleepScore(liveDuration, quality).color,
                fontWeight: 600,
              }}>
                {sleepScore(liveDuration, quality).label}
                &nbsp;&middot;&nbsp;{Math.round((liveDuration / GOAL_MIN) * 100)}% of goal
              </span>
            )}
          </div>

          {/* Bedtime */}
          <div style={S.row}>
            <IonIcon icon={moonOutline} style={S.rowIcon} />
            <span style={S.rowText}>Bedtime</span>
            <input
              type="time"
              value={bedtimeInput}
              onChange={(e) => setBedtimeInput(e.target.value)}
              style={timeInputStyle}
            />
          </div>
          <div style={S.divider} />

          {/* Wake up */}
          <div style={S.row}>
            <IonIcon icon={timeOutline} style={S.rowIcon} />
            <span style={S.rowText}>Wake up</span>
            <input
              type="time"
              value={waketimeInput}
              onChange={(e) => setWaketimeInput(e.target.value)}
              style={timeInputStyle}
            />
          </div>
          <div style={S.divider} />

          {/* Quality */}
          <div style={{ ...S.row, gap: 0 }}>
            <span style={S.rowText}>Quality</span>
            <div style={{ display: 'flex' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setQuality(n)} style={starBtn(n <= quality)}>
                  {n <= quality ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>
          <div style={S.divider} />

          {/* Note */}
          <div style={{ ...S.row, alignItems: 'flex-start', paddingTop: 16, paddingBottom: 16 }}>
            <textarea
              rows={2}
              placeholder="Optional note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ ...S.noteInput, paddingTop: 2 }}
            />
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};



