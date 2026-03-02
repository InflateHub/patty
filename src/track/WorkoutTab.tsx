import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
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
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { trash } from 'ionicons/icons';
import { useWorkoutLog } from '../hooks/useWorkoutLog';
import type { WorkoutEntry, WorkoutType } from '../hooks/useWorkoutLog';
import { S, today, formatDate, formatTime } from './trackUtils';

/* ── Constants ───────────────────────────────────────────────────────── */

const WORKOUT_TYPES: {
  id: WorkoutType;
  label: string;
  emoji: string;
  kcalPerMin: number | null;
}[] = [
  { id: 'cardio',   label: 'Cardio',   emoji: '🏃', kcalPerMin: 8  },
  { id: 'strength', label: 'Strength', emoji: '💪', kcalPerMin: 5  },
  { id: 'yoga',     label: 'Yoga',     emoji: '🧘', kcalPerMin: 3  },
  { id: 'hiit',     label: 'HIIT',     emoji: '🔥', kcalPerMin: 10 },
  { id: 'steps',    label: 'Steps',    emoji: '👣', kcalPerMin: null },
  { id: 'custom',   label: 'Custom',   emoji: '✏️', kcalPerMin: null },
];

const INTENSITY_LABELS: Record<number, string> = {
  1: '😴', 2: '🚶', 3: '💪', 4: '🔥', 5: '⚡',
};

const INTENSITY_NAMES: Record<number, string> = {
  1: 'Very light', 2: 'Light', 3: 'Moderate', 4: 'Hard', 5: 'Max',
};

/* ── Helpers (outside component to avoid stale refs) ─────────────────── */

function formatStopwatch(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${String(h).padStart(2, '0')}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

/** Accepts "45" (= 45 min) or "1:30" (= 1 h 30 min). Returns seconds. */
function parseDurationInput(val: string): number {
  const parts = val.split(':').map((p) => parseInt(p.trim(), 10));
  if (parts.length === 1 && !isNaN(parts[0]) && parts[0] > 0) return parts[0] * 60;
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]))
    return parts[0] * 3600 + parts[1] * 60;
  return 0;
}

/* ── Styles ──────────────────────────────────────────────────────────── */

const typeCardStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '16px 8px',
  borderRadius: 'var(--md-shape-lg)',
  border: `2px solid ${active ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
  background: active ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
  cursor: 'pointer',
  transition: 'background 0.15s, border-color 0.15s',
});

const intensityChipStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px 4px',
  borderRadius: 'var(--md-shape-full)',
  border: `1.5px solid ${active ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
  background: active ? 'var(--md-primary-container)' : 'transparent',
  color: active ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
  fontSize: 18,
  textAlign: 'center',
  cursor: 'pointer',
  fontFamily: 'var(--md-font)',
  lineHeight: 1,
});

const manualInput: React.CSSProperties = {
  width: 72,
  background: 'transparent',
  border: '1px solid var(--md-outline)',
  borderRadius: 'var(--md-shape-sm)',
  padding: '4px 8px',
  color: 'var(--md-on-surface)',
  fontFamily: 'var(--md-font)',
  fontSize: 'var(--md-body-md)',
  textAlign: 'center',
  outline: 'none',
};

const formItem: React.CSSProperties = {
  '--background': 'var(--md-surface-variant)',
  '--border-radius': 'var(--md-shape-md)',
  marginBottom: 10,
} as React.CSSProperties;

const sectionLabel: React.CSSProperties = {
  fontSize: 'var(--md-label-md)',
  color: 'var(--md-on-surface-variant)',
  marginBottom: 8,
  paddingLeft: 4,
};

/* ── Component ───────────────────────────────────────────────────────── */

interface WorkoutTabProps {
  openTrigger?: number;
}

export const WorkoutTab: React.FC<WorkoutTabProps> = ({ openTrigger }) => {
  const { todayEntries, allEntries, loading, addEntry, deleteEntry } = useWorkoutLog();
  const modal = useRef<HTMLIonModalElement>(null);

  /* ── Modal & form state ───────────────────────────────────────────── */
  const [modalOpen, setModalOpen]         = useState(false);
  const [selectedType, setSelectedType]   = useState<WorkoutType | null>(null);
  const [name, setName]                   = useState('');
  const [durationSec, setDurationSec]     = useState(0);
  const [durationInput, setDurationInput] = useState('');
  const [steps, setSteps]                 = useState('');
  const [intensity, setIntensity]         = useState(3);
  const [calories, setCalories]           = useState('');
  const [notes, setNotes]                 = useState('');
  const [saving, setSaving]               = useState(false);
  const [toastMsg, setToastMsg]           = useState<string | null>(null);
  const [historyOpen, setHistoryOpen]     = useState(false);

  /* ── Stopwatch state ──────────────────────────────────────────────── */
  const [swRunning, setSwRunning] = useState(false);
  const [swElapsed, setSwElapsed] = useState(0);
  const swRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [presentAlert] = useIonAlert();

  /* ── Cleanup stopwatch on unmount ─────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (swRef.current) clearInterval(swRef.current);
    };
  }, []);

  /* ── Open modal when FAB fires ────────────────────────────────────── */
  useEffect(() => {
    if (!openTrigger) return;
    resetForm();
    setModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTrigger]);

  /* ── Stopwatch controls ───────────────────────────────────────────── */
  function stopSw() {
    if (swRef.current) clearInterval(swRef.current);
    setSwRunning(false);
  }

  function startSw() {
    setSwRunning(true);
    swRef.current = setInterval(() => {
      setSwElapsed((prev) => {
        const next = prev + 1;
        setDurationSec(next);
        return next;
      });
    }, 1000);
  }

  function pauseSw() { stopSw(); }

  function resetSw() {
    stopSw();
    setSwElapsed(0);
    setDurationSec(0);
    setDurationInput('');
  }

  /* ── Auto-suggest calories from duration (non-steps, non-custom) ─── */
  useEffect(() => {
    if (!selectedType || selectedType === 'steps' || selectedType === 'custom') return;
    const def = WORKOUT_TYPES.find((w) => w.id === selectedType);
    if (!def?.kcalPerMin) return;
    const mins = Math.floor(durationSec / 60);
    if (mins > 0) setCalories(String(Math.round(mins * def.kcalPerMin)));
  }, [durationSec, selectedType]);

  /* ── Form helpers ─────────────────────────────────────────────────── */
  function resetForm() {
    stopSw();
    setSelectedType(null);
    setName('');
    setDurationSec(0);
    setDurationInput('');
    setSteps('');
    setIntensity(3);
    setCalories('');
    setNotes('');
    setSaving(false);
    setSwElapsed(0);
  }

  function selectType(t: WorkoutType) {
    setSelectedType(t);
    const def = WORKOUT_TYPES.find((w) => w.id === t)!;
    setName(t !== 'custom' ? def.label : '');
    setCalories('');
    setDurationSec(0);
    setDurationInput('');
    setSwElapsed(0);
    stopSw();
  }

  /* ── Save ─────────────────────────────────────────────────────────── */
  async function handleSave() {
    if (!selectedType) return;
    if (!name.trim()) { setToastMsg('Please enter a workout name'); return; }

    let effectiveDuration = durationSec > 0 ? durationSec : parseDurationInput(durationInput);

    if (selectedType === 'steps') {
      const stepsNum = parseInt(steps, 10);
      if (isNaN(stepsNum) || stepsNum <= 0) { setToastMsg('Please enter a valid step count'); return; }
    } else {
      if (effectiveDuration <= 0) { setToastMsg('Please set a duration (stopwatch or manual)'); return; }
    }

    setSaving(true);
    try {
      await addEntry({
        date:           today(),
        workout_type:   selectedType,
        name:           name.trim(),
        duration_sec:   selectedType === 'steps' ? 0 : effectiveDuration,
        steps:          selectedType === 'steps' ? (parseInt(steps, 10) || null) : null,
        intensity:      selectedType !== 'steps' ? intensity : null,
        calories_burnt: calories ? (parseInt(calories, 10) || null) : null,
        notes:          notes.trim() || null,
      });
      modal.current?.dismiss();
      setModalOpen(false);
      setToastMsg('Workout logged! 💪');
    } catch {
      setToastMsg('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete ───────────────────────────────────────────────────────── */
  function handleDelete(entry: WorkoutEntry) {
    presentAlert({
      header: 'Delete workout?',
      message: `"${entry.name}" will be removed.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => deleteEntry(entry.id) },
      ],
    });
  }

  /* ── Today stats ──────────────────────────────────────────────────── */
  const totalDurationSec = todayEntries.reduce((acc, e) => acc + e.duration_sec, 0);
  const totalCalories    = todayEntries.reduce((acc, e) => acc + (e.calories_burnt ?? 0), 0);
  const totalSteps       = todayEntries.reduce((acc, e) => acc + (e.steps ?? 0), 0);

  /* ── Group today entries by type ──────────────────────────────────── */
  const grouped = WORKOUT_TYPES.reduce<Record<WorkoutType, WorkoutEntry[]>>(
    (acc, t) => { acc[t.id] = []; return acc; },
    {} as Record<WorkoutType, WorkoutEntry[]>
  );
  for (const e of todayEntries) grouped[e.workout_type].push(e);

  /* ── Group all entries by date (for history) ──────────────────────── */
  const historyDates = Array.from(new Set(allEntries.map((e) => e.date))).slice(0, 30);

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Today summary card ──────────────────────────────────────── */}
      <IonCard style={{
        margin: '16px 16px 8px',
        borderRadius: 'var(--md-shape-xl)',
        border: '1px solid var(--md-outline-variant)',
        boxShadow: 'none',
      }}>
        <IonCardContent>
          {loading ? (
            <IonSkeletonText animated style={{ height: 56, borderRadius: 'var(--md-shape-md)' }} />
          ) : todayEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--md-on-surface-variant)' }}>
              <div style={{ fontSize: 40 }}>🏋️</div>
              <div style={{ fontSize: 'var(--md-body-md)', marginTop: 8, fontFamily: 'var(--md-font)' }}>
                No workouts logged today
              </div>
              <div style={{ fontSize: 'var(--md-body-sm)', marginTop: 4, opacity: 0.7 }}>
                Tap + to log your first session
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--md-primary)', fontFamily: 'var(--md-font)' }}>
                  {todayEntries.length}
                </div>
                <div style={{ fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)' }}>
                  {todayEntries.length === 1 ? 'Session' : 'Sessions'}
                </div>
              </div>
              {totalDurationSec > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--md-primary)', fontFamily: 'var(--md-font)' }}>
                    {Math.floor(totalDurationSec / 60)}
                  </div>
                  <div style={{ fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)' }}>min</div>
                </div>
              )}
              {totalCalories > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--md-primary)', fontFamily: 'var(--md-font)' }}>
                    {totalCalories}
                  </div>
                  <div style={{ fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)' }}>kcal</div>
                </div>
              )}
              {totalSteps > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--md-primary)', fontFamily: 'var(--md-font)' }}>
                    {totalSteps.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)' }}>steps</div>
                </div>
              )}
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* ── Today log grouped by type ────────────────────────────────── */}
      {todayEntries.length > 0 && (
        <IonList style={{ background: 'transparent', padding: '0 8px' }}>
          {(Object.entries(grouped) as [WorkoutType, WorkoutEntry[]][])
            .filter(([, entries]) => entries.length > 0)
            .map(([type, entries]) => {
              const def = WORKOUT_TYPES.find((w) => w.id === type)!;
              return (
                <React.Fragment key={type}>
                  <IonListHeader style={{
                    color: 'var(--md-primary)',
                    textTransform: 'uppercase',
                    fontSize: 'var(--md-label-sm)',
                    letterSpacing: '0.5px',
                  }}>
                    {def.emoji} {def.label}
                  </IonListHeader>
                  {entries.map((entry) => (
                    <IonItemSliding key={entry.id}>
                      <IonItem style={{
                        '--background': 'var(--md-surface-variant)',
                        '--border-radius': 'var(--md-shape-md)',
                        marginBottom: 6,
                      } as React.CSSProperties}>
                        <IonLabel>
                          <div style={{ fontWeight: 500, fontSize: 'var(--md-body-md)', fontFamily: 'var(--md-font)' }}>
                            {entry.name}
                          </div>
                          <div style={{ fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)', marginTop: 2 }}>
                            {entry.steps != null
                              ? `${entry.steps.toLocaleString()} steps`
                              : `${Math.floor(entry.duration_sec / 60)} min`}
                            {entry.intensity != null ? ` · ${INTENSITY_LABELS[entry.intensity]} ${INTENSITY_NAMES[entry.intensity]}` : ''}
                            {entry.calories_burnt != null ? ` · ${entry.calories_burnt} kcal` : ''}
                          </div>
                          {entry.notes ? (
                            <div style={{
                              fontSize: 'var(--md-label-sm)',
                              color: 'var(--md-on-surface-variant)',
                              marginTop: 2,
                              fontStyle: 'italic',
                            }}>
                              {entry.notes}
                            </div>
                          ) : null}
                        </IonLabel>
                        <IonNote slot="end" style={{ fontSize: 'var(--md-label-sm)' }}>
                          {formatTime(entry.created_at)}
                        </IonNote>
                      </IonItem>
                      <IonItemOptions side="end" onIonSwipe={() => handleDelete(entry)}>
                        <IonItemOption color="danger" expandable onClick={() => handleDelete(entry)}>
                          <IonIcon slot="icon-only" icon={trash} />
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  ))}
                </React.Fragment>
              );
            })}
        </IonList>
      )}

      {/* ── History button ────────────────────────────────────────────── */}
      {allEntries.length > 0 && (
        <div style={{ padding: '8px 16px 0' }}>
          <IonButton
            expand="block"
            fill="outline"
            size="small"
            onClick={() => setHistoryOpen(true)}
            style={{ '--border-radius': 'var(--md-shape-full)' } as React.CSSProperties}
          >
            View History
          </IonButton>
        </div>
      )}

      <div style={{ height: 88 }} />

      {/* ── Add Workout Modal ─────────────────────────────────────────── */}
      <IonModal
        ref={modal}
        isOpen={modalOpen}
        onDidDismiss={() => { setModalOpen(false); resetForm(); }}
        initialBreakpoint={0.92}
        breakpoints={[0, 0.92, 1]}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => { modal.current?.dismiss(); setModalOpen(false); }}>
                Cancel
              </IonButton>
            </IonButtons>
            <IonTitle>{selectedType ? 'Log Workout' : 'Select Type'}</IonTitle>
            {selectedType && (
              <IonButtons slot="end">
                <IonButton strong onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </IonButton>
              </IonButtons>
            )}
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': 'var(--md-surface)' } as React.CSSProperties}>
          {/* ── Step 1: Type grid ──────────────────────────────────── */}
          {!selectedType && (
            <div style={{ padding: '12px 16px 0' }}>
              <div style={{
                fontSize: 'var(--md-body-md)',
                color: 'var(--md-on-surface-variant)',
                textAlign: 'center',
                marginBottom: 12,
                fontFamily: 'var(--md-font)',
              }}>
                What kind of workout?
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
              }}>
                {WORKOUT_TYPES.map((t) => (
                  <div key={t.id} style={typeCardStyle(false)} onClick={() => selectType(t.id)}>
                    <span style={{ fontSize: 36 }}>{t.emoji}</span>
                    <span style={{
                      fontSize: 'var(--md-label-lg)',
                      fontFamily: 'var(--md-font)',
                      color: 'var(--md-on-surface)',
                      fontWeight: 500,
                    }}>
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2a: Steps form ────────────────────────────────── */}
          {selectedType === 'steps' && (
            <div style={{ padding: '8px 16px' }}>
              <div style={{ textAlign: 'center', padding: '16px 0 4px' }}>
                <span style={{ fontSize: 52 }}>👣</span>
              </div>

              {/* Big step count input */}
              <div style={{ ...S.valueArea, paddingTop: 4, paddingBottom: 16 }}>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={steps}
                  onChange={(e) => {
                    setSteps(e.target.value);
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n) && n > 0) setCalories(String(Math.round(n * 0.04)));
                    else setCalories('');
                  }}
                  style={{ ...S.valueInput, fontSize: 64 }}
                />
                <div style={{
                  fontSize: 'var(--md-title-md)',
                  color: 'var(--md-on-surface-variant)',
                  marginTop: 4,
                  fontFamily: 'var(--md-font)',
                }}>
                  steps
                </div>
              </div>

              <IonItem style={formItem}>
                <IonLabel position="stacked" style={{ fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)' }}>
                  Name
                </IonLabel>
                <IonInput
                  value={name}
                  onIonInput={(e) => setName(e.detail.value ?? '')}
                  placeholder="e.g. Morning walk"
                />
              </IonItem>
              <IonItem style={formItem}>
                <IonLabel position="stacked" style={{ fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)' }}>
                  Calories burned (optional — auto-estimated)
                </IonLabel>
                <IonInput
                  type="number"
                  inputMode="numeric"
                  value={calories}
                  onIonInput={(e) => setCalories(e.detail.value ?? '')}
                  placeholder="auto"
                />
              </IonItem>
              <IonItem style={formItem}>
                <IonLabel position="stacked" style={{ fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)' }}>
                  Notes (optional)
                </IonLabel>
                <IonTextarea
                  value={notes}
                  onIonInput={(e) => setNotes(e.detail.value ?? '')}
                  rows={2}
                  placeholder="How did it go?"
                />
              </IonItem>

              <IonButton
                expand="block"
                onClick={handleSave}
                disabled={saving}
                style={{
                  '--background': 'var(--md-primary)',
                  '--color': 'var(--md-on-primary)',
                  '--border-radius': 'var(--md-shape-full)',
                  marginTop: 8,
                } as React.CSSProperties}
              >
                {saving ? 'Saving…' : 'Log Steps'}
              </IonButton>
            </div>
          )}

          {/* ── Step 2b: Regular workout form ──────────────────────── */}
          {selectedType && selectedType !== 'steps' && (
            <div style={{ padding: '8px 16px' }}>
              <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
                <span style={{ fontSize: 52 }}>
                  {WORKOUT_TYPES.find((w) => w.id === selectedType)?.emoji}
                </span>
              </div>

              {/* Name */}
              <IonItem style={formItem}>
                <IonLabel position="stacked" style={{ fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)' }}>
                  Workout name
                </IonLabel>
                <IonInput
                  value={name}
                  onIonInput={(e) => setName(e.detail.value ?? '')}
                  placeholder="e.g. Morning run"
                />
              </IonItem>

              {/* Stopwatch */}
              <div style={{
                background: 'var(--md-surface-variant)',
                borderRadius: 'var(--md-shape-lg)',
                padding: '16px',
                marginBottom: 10,
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 'var(--md-label-sm)',
                  color: 'var(--md-on-surface-variant)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 8,
                }}>
                  Duration
                </div>
                <div style={{
                  fontSize: 48,
                  fontWeight: 200,
                  fontFamily: 'var(--md-font)',
                  color: swRunning ? 'var(--md-primary)' : 'var(--md-on-surface)',
                  letterSpacing: 2,
                  marginBottom: 12,
                  transition: 'color 0.2s',
                }}>
                  {formatStopwatch(swElapsed)}
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
                  {!swRunning ? (
                    <IonButton
                      size="small"
                      onClick={startSw}
                      style={{ '--background': 'var(--md-primary)', '--color': 'var(--md-on-primary)', '--border-radius': 'var(--md-shape-full)' } as React.CSSProperties}
                    >
                      {swElapsed > 0 ? 'Resume' : 'Start'}
                    </IonButton>
                  ) : (
                    <IonButton
                      size="small"
                      fill="outline"
                      onClick={pauseSw}
                      style={{ '--border-radius': 'var(--md-shape-full)' } as React.CSSProperties}
                    >
                      Pause
                    </IonButton>
                  )}
                  {swElapsed > 0 && !swRunning && (
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={resetSw}
                      style={{ color: 'var(--md-error)' }}
                    >
                      Reset
                    </IonButton>
                  )}
                </div>
                {/* Manual duration override */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span style={{ fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)' }}>
                    or type manually (min or h:mm):
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="45"
                    value={durationInput}
                    onChange={(e) => {
                      setDurationInput(e.target.value);
                      const sec = parseDurationInput(e.target.value);
                      if (sec > 0) { setDurationSec(sec); setSwElapsed(sec); }
                    }}
                    style={manualInput}
                  />
                </div>
              </div>

              {/* Intensity */}
              <div style={{ marginBottom: 10 }}>
                <div style={sectionLabel}>Intensity</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} style={intensityChipStyle(intensity === n)} onClick={() => setIntensity(n)}>
                      {INTENSITY_LABELS[n]}
                    </button>
                  ))}
                </div>
                <div style={{
                  fontSize: 'var(--md-label-sm)',
                  color: 'var(--md-on-surface-variant)',
                  textAlign: 'center',
                  marginTop: 6,
                }}>
                  {INTENSITY_NAMES[intensity]}
                </div>
              </div>

              {/* Calories */}
              <IonItem style={formItem}>
                <IonLabel position="stacked" style={{ fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)' }}>
                  Calories burned (auto-estimated from duration)
                </IonLabel>
                <IonInput
                  type="number"
                  inputMode="numeric"
                  value={calories}
                  onIonInput={(e) => setCalories(e.detail.value ?? '')}
                  placeholder="auto"
                />
              </IonItem>

              {/* Notes */}
              <IonItem style={formItem}>
                <IonLabel position="stacked" style={{ fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)' }}>
                  Notes (optional)
                </IonLabel>
                <IonTextarea
                  value={notes}
                  onIonInput={(e) => setNotes(e.detail.value ?? '')}
                  rows={2}
                  placeholder="How did it go?"
                />
              </IonItem>

              <IonButton
                expand="block"
                onClick={handleSave}
                disabled={saving}
                style={{
                  '--background': 'var(--md-primary)',
                  '--color': 'var(--md-on-primary)',
                  '--border-radius': 'var(--md-shape-full)',
                  marginTop: 4,
                } as React.CSSProperties}
              >
                {saving ? 'Saving…' : 'Log Workout'}
              </IonButton>
            </div>
          )}

          <div style={{ height: 40 }} />
        </IonContent>
      </IonModal>

      {/* ── History Modal ─────────────────────────────────────────────── */}
      <IonModal
        isOpen={historyOpen}
        onDidDismiss={() => setHistoryOpen(false)}
        initialBreakpoint={0.92}
        breakpoints={[0, 0.92, 1]}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setHistoryOpen(false)}>Close</IonButton>
            </IonButtons>
            <IonTitle>Workout History</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': 'var(--md-surface)' } as React.CSSProperties}>
          {historyDates.map((date) => {
            const dayEntries = allEntries.filter((e) => e.date === date);
            return (
              <div key={date} style={{ padding: '4px 16px' }}>
                <IonListHeader style={{
                  color: 'var(--md-primary)',
                  fontSize: 'var(--md-label-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {formatDate(date)}
                </IonListHeader>
                {dayEntries.map((entry) => {
                  const def = WORKOUT_TYPES.find((w) => w.id === entry.workout_type)!;
                  return (
                    <IonItemSliding key={entry.id}>
                      <IonItem style={{
                        '--background': 'var(--md-surface-variant)',
                        '--border-radius': 'var(--md-shape-md)',
                        marginBottom: 6,
                      } as React.CSSProperties}>
                        <IonNote slot="start" style={{ fontSize: 20, marginRight: 8 }}>
                          {def.emoji}
                        </IonNote>
                        <IonLabel>
                          <div style={{ fontWeight: 500, fontSize: 'var(--md-body-md)', fontFamily: 'var(--md-font)' }}>
                            {entry.name}
                          </div>
                          <div style={{ fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)', marginTop: 2 }}>
                            {entry.steps != null
                              ? `${entry.steps.toLocaleString()} steps`
                              : `${Math.floor(entry.duration_sec / 60)} min`}
                            {entry.intensity != null ? ` · ${INTENSITY_LABELS[entry.intensity]}` : ''}
                            {entry.calories_burnt != null ? ` · ${entry.calories_burnt} kcal` : ''}
                          </div>
                        </IonLabel>
                      </IonItem>
                      <IonItemOptions side="end" onIonSwipe={() => handleDelete(entry)}>
                        <IonItemOption color="danger" expandable onClick={() => handleDelete(entry)}>
                          <IonIcon slot="icon-only" icon={trash} />
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  );
                })}
              </div>
            );
          })}
          <div style={{ height: 40 }} />
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={!!toastMsg}
        message={toastMsg ?? ''}
        duration={2000}
        onDidDismiss={() => setToastMsg(null)}
      />
    </>
  );
};
