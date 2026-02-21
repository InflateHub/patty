import React, { useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
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
  IonTitle,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { add, calendarOutline, createOutline, trash } from 'ionicons/icons';
import { WeightChart } from '../components/WeightChart';
import { useWeightLog } from '../hooks/useWeightLog';
import type { WeightEntry } from '../hooks/useWeightLog';

const today = (): string => new Date().toISOString().slice(0, 10);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function isToday(iso: string): boolean {
  return iso === today();
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
};

const Track: React.FC = () => {
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

  const [presentAlert] = useIonAlert();

  function resetForm() {
    setValue('');
    setUnit('kg');
    setDate(today());
    setNote('');
  }

  async function handleSave() {
    const num = parseFloat(value);
    if (!value || isNaN(num) || num <= 0) {
      await presentAlert({ header: 'Invalid value', message: 'Please enter a positive number.', buttons: ['OK'] });
      return;
    }
    setSaving(true);
    try {
      await addEntry({ date, value: num, unit, note: note.trim() || undefined });
      resetForm();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string) {
    presentAlert({
      header: 'Delete entry',
      message: 'Remove this weight entry?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', handler: () => deleteEntry(id) },
      ],
    });
  }

  const latest = entries[0];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Weight</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Weight</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Chart card */}
        {!loading && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                {latest
                  ? `${latest.value} ${latest.unit} · ${formatDate(latest.date)}`
                  : 'No entries yet'}
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <WeightChart entries={entries} />
            </IonCardContent>
          </IonCard>
        )}

        {/* History */}
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
                    <IonItemOption color="danger" onClick={() => handleDelete(entry.id)}>
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
            <p style={{ margin: 0, fontSize: 'var(--md-body-lg)', fontWeight: 500 }}>No entries yet</p>
            <p style={{ margin: '8px 0 0', fontSize: 'var(--md-body-sm)' }}>Tap + to log your first weight entry.</p>
          </div>
        )}

        <div style={{ height: 88 }} />

        {/* FAB */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setModalOpen(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* ── Entry modal ────────────────────────────────────────────────── */}
        <IonModal
          ref={modal}
          isOpen={modalOpen}
          onDidDismiss={() => { setModalOpen(false); resetForm(); }}
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
                <IonButton strong onClick={handleSave} disabled={saving}>Save</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            {/* Large value input */}
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
              {/* Unit chips */}
              <div style={S.unitRow}>
                {(['kg', 'lbs'] as const).map((u) => (
                  <button key={u} style={S.unitChip(unit === u)} onClick={() => setUnit(u)}>
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.divider} />

            {/* Date row */}
            <div style={S.row} onClick={() => setDateModalOpen(true)}>
              <IonIcon icon={calendarOutline} style={S.rowIcon} />
              <span style={S.rowText}>
                {isToday(date) ? 'Today' : formatDate(date)}
              </span>
              <span style={S.rowHint}>{isToday(date) ? formatDate(date) : ''}</span>
            </div>

            <div style={S.divider} />

            {/* Note row */}
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
      </IonContent>
    </IonPage>
  );
};

export default Track;

