import React, { useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonDatetime,
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
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import {
  add,
  calendarOutline,
  createOutline,
  settingsOutline,
  trash,
  waterOutline,
} from 'ionicons/icons';
import { WeightChart } from '../components/WeightChart';
import { WaterRing } from '../components/WaterRing';
import { useWeightLog } from '../hooks/useWeightLog';
import { useWaterLog } from '../hooks/useWaterLog';
import type { WeightEntry } from '../hooks/useWeightLog';
import type { WaterEntry } from '../hooks/useWaterLog';

const today = (): string => new Date().toISOString().slice(0, 10);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function isToday(iso: string): boolean {
  return iso === today();
}

function formatTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit',
  });
}

/* ── Inline styles ─────────────────────────────────────────────────────── */
const S = {
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

  /* ── Water section ── */
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

const QUICK_AMOUNTS = [150, 250, 500] as const;

const Track: React.FC = () => {
  /* ── Tab ── */
  const [tab, setTab] = useState<'weight' | 'water'>('weight');

  /* ── Weight ── */
  const { entries, loading, addEntry, deleteEntry } = useWeightLog();
  const modal = useRef<HTMLIonModalElement>(null);
  const dateModal = useRef<HTMLIonModalElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [date, setDate] = useState<string>(today());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  /* ── Water ── */
  const {
    todayEntries: waterEntries,
    todayTotal,
    dailyGoal,
    loading: waterLoading,
    addEntry: addWater,
    deleteEntry: deleteWater,
    setDailyGoal,
  } = useWaterLog();
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [waterSaving, setWaterSaving] = useState(false);

  const [presentAlert] = useIonAlert();

  /* ── Weight helpers ── */
  function resetWeightForm() {
    setValue('');
    setUnit('kg');
    setDate(today());
    setNote('');
  }

  async function handleWeightSave() {
    const num = parseFloat(value);
    if (!value || isNaN(num) || num <= 0) {
      await presentAlert({ header: 'Invalid value', message: 'Please enter a positive number.', buttons: ['OK'] });
      return;
    }
    setSaving(true);
    try {
      await addEntry({ date, value: num, unit, note: note.trim() || undefined });
      resetWeightForm();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function handleWeightDelete(id: string) {
    presentAlert({
      header: 'Delete entry',
      message: 'Remove this weight entry?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => deleteEntry(id) },
      ],
    });
  }

  /* ── Water helpers ── */
  async function handleQuickAdd(ml: number) {
    try { await addWater(ml); } catch { /* ignore */ }
  }

  async function handleCustomSave() {
    const ml = parseInt(customAmount, 10);
    if (!customAmount || isNaN(ml) || ml <= 0) {
      await presentAlert({ header: 'Invalid amount', message: 'Enter a positive whole number.', buttons: ['OK'] });
      return;
    }
    setWaterSaving(true);
    try {
      await addWater(ml);
      setCustomAmount('');
      setCustomModalOpen(false);
    } finally {
      setWaterSaving(false);
    }
  }

  function handleGoalSave() {
    const ml = parseInt(goalInput, 10);
    if (!goalInput || isNaN(ml) || ml < 100) {
      presentAlert({ header: 'Invalid goal', message: 'Please enter at least 100 ml.', buttons: ['OK'] });
      return;
    }
    setDailyGoal(ml);
    setGoalModalOpen(false);
    setGoalInput('');
  }

  function handleWaterDelete(id: string) {
    presentAlert({
      header: 'Delete entry',
      message: 'Remove this water entry?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => deleteWater(id) },
      ],
    });
  }

  const latest = entries[0];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Track</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={tab}
            onIonChange={(e) => setTab(e.detail.value as 'weight' | 'water')}
            style={{ maxWidth: 320, margin: '0 auto', '--background': 'transparent' } as React.CSSProperties}
          >
            <IonSegmentButton value="weight">
              <IonLabel>Weight</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="water">
              <IonLabel>Water</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>

        {/* ══════════════════ WEIGHT TAB ══════════════════ */}
        {tab === 'weight' && (
          <>
            {!loading && (
              <IonCard>
                <IonCardContent style={{ paddingTop: 16 }}>
                  {latest && (
                    <div style={{
                      fontSize: 'var(--md-title-sm)',
                      color: 'var(--md-on-surface-variant)',
                      marginBottom: 8,
                      fontFamily: 'var(--md-font)',
                    }}>
                      {latest.value} {latest.unit} · {formatDate(latest.date)}
                    </div>
                  )}
                  <WeightChart entries={entries} />
                  {!latest && (
                    <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--md-on-surface-variant)', fontSize: 'var(--md-body-md)', fontFamily: 'var(--md-font)' }}>
                      No entries yet
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            )}

            {!loading && entries.length > 0 && (
              <>
                <IonListHeader style={{ paddingInlineStart: 20, marginTop: 8 }}>History</IonListHeader>
                <IonList>
                  {entries.map((entry: WeightEntry) => (
                    <IonItemSliding key={entry.id}>
                      <IonItem>
                        <IonLabel>
                          <h3>{entry.value} {entry.unit}</h3>
                          {entry.note && <p>{entry.note}</p>}
                        </IonLabel>
                        <IonNote slot="end">{formatDate(entry.date)}</IonNote>
                      </IonItem>
                      <IonItemOptions side="end">
                        <IonItemOption color="danger" onClick={() => handleWeightDelete(entry.id)}>
                          <IonIcon slot="icon-only" icon={trash} />
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  ))}
                </IonList>
              </>
            )}

            {!loading && entries.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 32px', color: 'var(--md-on-surface-variant)' }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>⚖️</div>
                <p style={{ margin: 0, fontSize: 'var(--md-body-lg)', fontWeight: 500, fontFamily: 'var(--md-font)' }}>No entries yet</p>
                <p style={{ margin: '8px 0 0', fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)' }}>Tap + to log your first weight entry.</p>
              </div>
            )}
          </>
        )}

        {/* ══════════════════ WATER TAB ══════════════════ */}
        {tab === 'water' && (
          <>
            {/* Ring + quick-add + goal in one card */}
            <IonCard>
              <IonCardContent style={{ padding: 0 }}>
                <div style={S.ringWrap}>
                  <WaterRing total={todayTotal} goal={dailyGoal} size={192} />
                </div>

                <div style={S.quickAddRow}>
                  {QUICK_AMOUNTS.map((ml) => (
                    <button key={ml} style={S.quickChip} onClick={() => handleQuickAdd(ml)}>
                      +{ml} ml
                    </button>
                  ))}
                  <button
                    style={{ ...S.quickChip, borderColor: 'var(--md-primary)', color: 'var(--md-primary)' }}
                    onClick={() => setCustomModalOpen(true)}
                  >
                    Custom
                  </button>
                </div>

                <div style={S.goalRow} onClick={() => { setGoalInput(String(dailyGoal)); setGoalModalOpen(true); }}>
                  <IonIcon icon={settingsOutline} style={S.rowIcon} />
                  <span style={S.rowText}>Daily goal</span>
                  <span style={S.rowHint}>{dailyGoal} ml</span>
                </div>
              </IonCardContent>
            </IonCard>

            {!waterLoading && waterEntries.length > 0 && (
              <>
                <IonListHeader style={{ paddingInlineStart: 20, marginTop: 8 }}>Today</IonListHeader>
                <IonList>
                  {[...waterEntries].reverse().map((entry: WaterEntry) => (
                    <IonItemSliding key={entry.id}>
                      <IonItem>
                        <IonIcon icon={waterOutline} slot="start" style={{ color: 'var(--md-primary)', fontSize: 20 }} />
                        <IonLabel>
                          <h3>{entry.amount_ml} ml</h3>
                        </IonLabel>
                        <IonNote slot="end">{formatTime(entry.created_at)}</IonNote>
                      </IonItem>
                      <IonItemOptions side="end">
                        <IonItemOption color="danger" onClick={() => handleWaterDelete(entry.id)}>
                          <IonIcon slot="icon-only" icon={trash} />
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  ))}
                </IonList>
              </>
            )}

            {!waterLoading && waterEntries.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 32px', color: 'var(--md-on-surface-variant)' }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>💧</div>
                <p style={{ margin: 0, fontSize: 'var(--md-body-md)', fontFamily: 'var(--md-font)' }}>Tap a chip above to log water.</p>
              </div>
            )}
          </>
        )}

        <div style={{ height: 88 }} />

        {/* FAB — adds weight or custom water depending on active tab */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => tab === 'weight' ? setModalOpen(true) : setCustomModalOpen(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* ── Weight entry modal ──────────────────────────────────────────── */}
        <IonModal
          ref={modal}
          isOpen={modalOpen}
          onDidDismiss={() => { setModalOpen(false); resetWeightForm(); }}
          initialBreakpoint={0.72}
          breakpoints={[0, 0.72, 1]}
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setModalOpen(false)}>Cancel</IonButton>
              </IonButtons>
              <IonTitle>Log Weight</IonTitle>
              <IonButtons slot="end">
                <IonButton strong onClick={handleWeightSave} disabled={saving}>Save</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={S.valueArea}>
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                placeholder="0.0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={S.valueInput}
              />
              <div style={S.unitRow}>
                {(['kg', 'lbs'] as const).map((u) => (
                  <button key={u} style={S.unitChip(unit === u)} onClick={() => setUnit(u)}>
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.divider} />

            <div style={S.row} onClick={() => setDateModalOpen(true)}>
              <IonIcon icon={calendarOutline} style={S.rowIcon} />
              <span style={S.rowText}>{isToday(date) ? 'Today' : formatDate(date)}</span>
              <span style={S.rowHint}>{isToday(date) ? formatDate(date) : ''}</span>
            </div>

            <div style={S.divider} />

            <div style={{ ...S.row, cursor: 'text', alignItems: 'flex-start' }}>
              <IonIcon icon={createOutline} style={{ ...S.rowIcon, marginTop: 2 }} />
              <textarea
                rows={1}
                placeholder="Add a note…"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                style={S.noteInput}
              />
            </div>

            <div style={S.divider} />
          </IonContent>
        </IonModal>

        {/* ── Date picker sub-modal ───────────────────────────────────────── */}
        <IonModal
          ref={dateModal}
          isOpen={dateModalOpen}
          onDidDismiss={() => setDateModalOpen(false)}
          initialBreakpoint={0.55}
          breakpoints={[0, 0.55]}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Pick Date</IonTitle>
              <IonButtons slot="end">
                <IonButton strong onClick={() => setDateModalOpen(false)}>Done</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonDatetime
              presentation="date"
              value={date}
              onIonChange={(e) => {
                const val = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
                setDate((val ?? today()).slice(0, 10));
              }}
              style={{ width: '100%', '--background': 'transparent' } as React.CSSProperties}
            />
          </IonContent>
        </IonModal>

        {/* ── Water custom amount modal ───────────────────────────────────── */}
        <IonModal
          isOpen={customModalOpen}
          onDidDismiss={() => { setCustomModalOpen(false); setCustomAmount(''); }}
          initialBreakpoint={0.5}
          breakpoints={[0, 0.5]}
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setCustomModalOpen(false)}>Cancel</IonButton>
              </IonButtons>
              <IonTitle>Custom Amount</IonTitle>
              <IonButtons slot="end">
                <IonButton strong onClick={handleCustomSave} disabled={waterSaving}>Add</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ ...S.valueArea, paddingBottom: 12 }}>
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                placeholder="250"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                style={S.customInput}
              />
              <span style={{ fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)', fontSize: 'var(--md-title-md)', marginTop: 8 }}>
                ml
              </span>
            </div>
          </IonContent>
        </IonModal>

        {/* ── Daily goal modal ────────────────────────────────────────────── */}
        <IonModal
          isOpen={goalModalOpen}
          onDidDismiss={() => { setGoalModalOpen(false); setGoalInput(''); }}
          initialBreakpoint={0.5}
          breakpoints={[0, 0.5]}
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setGoalModalOpen(false)}>Cancel</IonButton>
              </IonButtons>
              <IonTitle>Daily Goal</IonTitle>
              <IonButtons slot="end">
                <IonButton strong onClick={handleGoalSave}>Save</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ ...S.valueArea, paddingBottom: 12 }}>
              <input
                autoFocus
                type="number"
                inputMode="numeric"
                placeholder="2000"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                style={S.customInput}
              />
              <span style={{ fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)', fontSize: 'var(--md-title-md)', marginTop: 8 }}>
                ml / day
              </span>
            </div>
          </IonContent>
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default Track;

