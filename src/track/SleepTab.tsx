import React, { useMemo, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonNote,
  IonSkeletonText,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { add, moonOutline, timeOutline, trash } from 'ionicons/icons';
import { useSleepLog } from '../hooks/useSleepLog';
import type { SleepEntry } from '../hooks/useSleepLog';
import { S, formatDate, formatDuration, formatTime, today } from './trackUtils';

/* ── Local helpers ───────────────────────────────────────────────────── */

function qualityStars(q: number): string {
  return '★'.repeat(q) + '☆'.repeat(5 - q);
}

function getTomorrow(todayStr: string): string {
  const d = new Date(`${todayStr}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Build a full ISO timestamp from a YYYY-MM-DD date and HH:MM time string. */
function buildTs(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00.000`;
}

/** Calculate duration in minutes; returns null if times are invalid. */
function calcDuration(bedDate: string, bedTime: string, wakeDate: string, wakeTime: string): number | null {
  if (!bedTime || !wakeTime) return null;
  const bed = new Date(buildTs(bedDate, bedTime));
  const wake = new Date(buildTs(wakeDate, wakeTime));
  const diff = Math.round((wake.getTime() - bed.getTime()) / 60_000);
  // sanity: 1 min – 16 h window
  return diff > 0 && diff <= 960 ? diff : null;
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

/* ── Component ───────────────────────────────────────────────────────── */

export const SleepTab: React.FC = () => {
  const { entries, lastNightEntry, loading, addEntry, deleteEntry, avgDurationMin } = useSleepLog();
  const [modalOpen, setModalOpen] = useState(false);
  const [bedtimeInput, setBedtimeInput] = useState('22:00');
  const [waketimeInput, setWaketimeInput] = useState('07:00');
  const [quality, setQuality] = useState(3);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [presentAlert] = useIonAlert();

  /* Derive wake date: if wake time ≤ bed time → next day */
  const todayStr = today();
  const wakeDate = useMemo(() => {
    if (!bedtimeInput || !waketimeInput) return todayStr;
    return waketimeInput <= bedtimeInput ? getTomorrow(todayStr) : todayStr;
  }, [bedtimeInput, waketimeInput, todayStr]);

  const liveDuration = useMemo(
    () => calcDuration(todayStr, bedtimeInput, wakeDate, waketimeInput),
    [todayStr, bedtimeInput, wakeDate, waketimeInput]
  );

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  /** FAB is hidden when today or last night already has a logged entry. */
  const alreadyLogged =
    lastNightEntry !== null &&
    (lastNightEntry.date === todayStr || lastNightEntry.date === yesterday);

  function openModal() {
    setBedtimeInput('22:00');
    setWaketimeInput('07:00');
    setQuality(3);
    setNote('');
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
      const bedTs = buildTs(todayStr, bedtimeInput);
      const wakeTs = buildTs(wakeDate, waketimeInput);
      await addEntry(bedTs, wakeTs, quality, note.trim() || undefined);
      setModalOpen(false);
    } catch (err) {
      if (err instanceof Error && err.message === 'DUPLICATE_DATE') {
        await presentAlert({
          header: 'Already logged',
          message: 'Sleep is already recorded for this date. Delete the existing entry to re-log.',
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

  return (
    <>
      {/* ── Loading skeleton ───────────────────────────────────────── */}
      {loading && (
        <IonCard>
          <IonCardContent>
            <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
              <IonSkeletonText animated style={{ width: 100, height: 52, margin: '0 auto 12px', borderRadius: 8 }} />
              <IonSkeletonText animated style={{ width: 80, height: 14, margin: '4px auto' }} />
              <IonSkeletonText animated style={{ width: 140, height: 12, margin: '4px auto' }} />
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* ── Last Night stat card ───────────────────────────────────── */}
      {!loading && (
      <IonCard>
        <IonCardContent>
            <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
            <div style={{
              fontSize: 56,
              fontWeight: 300,
              fontFamily: 'var(--md-font)',
              color: lastNightEntry ? 'var(--md-on-surface)' : 'var(--md-outline)',
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
            }}>
              {lastNightEntry ? formatDuration(lastNightEntry.duration_min) : '—'}
            </div>
            {lastNightEntry ? (
              <>
                <div style={{
                  marginTop: 8,
                  fontSize: 18,
                  letterSpacing: 3,
                  color: 'var(--md-primary)',
                }}>
                  {qualityStars(lastNightEntry.quality)}
                </div>
                <div style={{
                  marginTop: 4,
                  fontSize: 'var(--md-body-sm)',
                  fontFamily: 'var(--md-font)',
                  color: 'var(--md-on-surface-variant)',
                }}>
                  {formatTime(lastNightEntry.bedtime)} → {formatTime(lastNightEntry.waketime)}
                  &nbsp;·&nbsp;{formatDate(lastNightEntry.date)}
                </div>
              </>
            ) : (
              <div style={{
                marginTop: 8,
                fontSize: 'var(--md-body-sm)',
                fontFamily: 'var(--md-font)',
                color: 'var(--md-on-surface-variant)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}>
                No entry yet
              </div>
            )}
            {entries.length > 1 && (
              <div style={{
                marginTop: 8,
                fontSize: 'var(--md-label-sm)',
                fontFamily: 'var(--md-font)',
                color: 'var(--md-on-surface-variant)',
              }}>
                avg {avgDurationMin !== null ? formatDuration(avgDurationMin) : '—'} · {entries.length} nights
              </div>
            )}
          </div>
        </IonCardContent>
      </IonCard>
      )}

      {/* ── History list ───────────────────────────────────────────── */}
      {!loading && entries.length > 0 && (
        <>
          <IonListHeader style={{ paddingInlineStart: 20, marginTop: 8 }}>History</IonListHeader>
          <IonList>
            {entries.map((entry: SleepEntry) => (
              <IonItemSliding key={entry.id}>
                <IonItem>
                  <IonIcon
                    icon={moonOutline}
                    slot="start"
                    style={{ color: 'var(--md-primary)', fontSize: 20 }}
                  />
                  <IonLabel>
                    <h3 style={{ fontWeight: 500 }}>{formatDuration(entry.duration_min)}</h3>
                    <p style={{ color: 'var(--md-on-surface-variant)' }}>
                      {formatDate(entry.date)}&nbsp;&nbsp;·&nbsp;&nbsp;
                      {formatTime(entry.bedtime)} → {formatTime(entry.waketime)}
                    </p>
                    {entry.note && (
                      <p style={{ color: 'var(--md-on-surface-variant)', fontStyle: 'italic' }}>
                        {entry.note}
                      </p>
                    )}
                  </IonLabel>
                  <IonNote slot="end" style={{ fontSize: 16, letterSpacing: 2 }}>
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
        </>
      )}

      {/* ── Empty state ────────────────────────────────────────────── */}
      {!loading && entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 32px', color: 'var(--md-on-surface-variant)' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🌙</div>
          <p style={{ margin: 0, fontSize: 'var(--md-body-lg)', fontWeight: 500, fontFamily: 'var(--md-font)' }}>No sleep logged yet</p>
          <p style={{ margin: '8px 0 0', fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)' }}>Tap + to log last night’s sleep.</p>
        </div>
      )}

      {/* ── FAB (disabled when today/last night already logged) ──────────── */}
      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton onClick={openModal} disabled={alreadyLogged}>
          <IonIcon icon={add} />
        </IonFabButton>
      </IonFab>

      <IonToast
        isOpen={!!errorMsg}
        message={errorMsg ?? ''}
        duration={3000}
        color="danger"
        onDidDismiss={() => setErrorMsg(null)}
      />

      {/* ── Entry modal ────────────────────────────────────────────── */}
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
            <IonTitle>Log Sleep</IonTitle>
            <IonButtons slot="end">
              <IonButton strong onClick={handleSave} disabled={saving || liveDuration === null}>
                Save
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {/* Live duration display */}
          <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
            <span style={{
              fontSize: 48,
              fontWeight: 300,
              fontFamily: 'var(--md-font)',
              color: liveDuration !== null ? 'var(--md-primary)' : 'var(--md-outline)',
            }}>
              {liveDuration !== null ? formatDuration(liveDuration) : '—'}
            </span>
          </div>

          {/* Bedtime row */}
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

          {/* Wake-up row */}
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

          {/* Quality row */}
          <div style={{ ...S.row, gap: 0 }}>
            <span style={{ ...S.rowText }}>Quality</span>
            <div style={{ display: 'flex', gap: 0 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setQuality(n)} style={starBtn(n <= quality)}>
                  {n <= quality ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div style={S.divider} />

          {/* Note row */}
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
