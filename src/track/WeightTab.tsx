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
  IonTitle,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { add, calendarOutline, createOutline, trash } from 'ionicons/icons';
import { WeightChart } from '../components/WeightChart';
import { useWeightLog } from '../hooks/useWeightLog';
import type { WeightEntry } from '../hooks/useWeightLog';
import { S, today, formatDate, isToday } from './trackUtils';

export const WeightTab: React.FC = () => {
  const { entries, todayEntries, loading, addEntry, deleteEntry } = useWeightLog();
  const modal = useRef<HTMLIonModalElement>(null);
  const dateModal = useRef<HTMLIonModalElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [date, setDate] = useState<string>(today());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [presentAlert] = useIonAlert();

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

  const todayLatest = todayEntries[0] ?? null;

  return (
    <>
      {/* ── Today stat card ────────────────────────────────────────── */}
      {!loading && (
        <IonCard>
          <IonCardContent>
            <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
              <div style={{
                fontSize: 56,
                fontWeight: 300,
                fontFamily: 'var(--md-font)',
                color: todayLatest ? 'var(--md-on-surface)' : 'var(--md-outline)',
                lineHeight: 1.1,
                letterSpacing: '-0.5px',
              }}>
                {todayLatest ? `${todayLatest.value}` : '—'}
              </div>
              <div style={{
                marginTop: 6,
                fontSize: 'var(--md-body-sm)',
                fontFamily: 'var(--md-font)',
                color: 'var(--md-on-surface-variant)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}>
                {todayLatest
                  ? `${todayLatest.unit} · Today${todayEntries.length > 1 ? ` · ${todayEntries.length} entries` : ''}`
                  : 'No entry today'}
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* ── Trend chart ────────────────────────────────────────────── */}
      {!loading && entries.length > 0 && (
        <IonCard>
          <IonCardContent style={{ paddingTop: 16 }}>
            <WeightChart entries={entries} />
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

      {/* FAB */}
      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton onClick={() => setModalOpen(true)}>
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
    </>
  );
};
