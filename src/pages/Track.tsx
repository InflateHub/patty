import React, { useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { add, trash } from 'ionicons/icons';
import { WeightChart } from '../components/WeightChart';
import { useWeightLog } from '../hooks/useWeightLog';
import type { WeightEntry } from '../hooks/useWeightLog';

const today = (): string => new Date().toISOString().slice(0, 10);

const Track: React.FC = () => {
  const { entries, loading, addEntry, deleteEntry } = useWeightLog();

  // Modal state
  const modal = useRef<HTMLIonModalElement>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
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

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

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

        {/* Chart */}
        <div style={{ padding: '16px 8px 8px' }}>
          {!loading && <WeightChart entries={entries} />}
        </div>

        {/* History list */}
        {!loading && entries.length > 0 && (
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
        )}

        {!loading && entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', opacity: 0.5 }}>
            <p>Tap + to log your first weight entry.</p>
          </div>
        )}

        {/* FAB */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setModalOpen(true)} color="primary">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Entry modal */}
        <IonModal
          ref={modal}
          isOpen={modalOpen}
          onDidDismiss={() => { setModalOpen(false); resetForm(); }}
          initialBreakpoint={0.75}
          breakpoints={[0, 0.75, 1]}
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setModalOpen(false)}>Cancel</IonButton>
              </IonButtons>
              <IonTitle>Log Weight</IonTitle>
              <IonButtons slot="end">
                <IonButton strong onClick={handleSave} disabled={saving}>
                  Save
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            {/* Weight value + unit */}
            <IonItem>
              <IonLabel position="stacked">Weight</IonLabel>
              <IonInput
                type="number"
                inputmode="decimal"
                placeholder="0.0"
                value={value}
                onIonInput={(e) => setValue(e.detail.value ?? '')}
              />
            </IonItem>

            <IonSegment
              value={unit}
              onIonChange={(e) => setUnit(e.detail.value as 'kg' | 'lbs')}
              style={{ margin: '12px 16px' }}
            >
              <IonSegmentButton value="kg">
                <IonLabel>kg</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="lbs">
                <IonLabel>lbs</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* Date */}
            <IonItem>
              <IonLabel position="stacked">Date</IonLabel>
              <IonDatetime
                presentation="date"
                value={date}
                onIonChange={(e) => {
                  const val = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
                  setDate((val ?? today()).slice(0, 10));
                }}
              />
            </IonItem>

            {/* Note */}
            <IonItem>
              <IonLabel position="stacked">Note (optional)</IonLabel>
              <IonTextarea
                placeholder="e.g. morning, after workout…"
                value={note}
                onIonInput={(e) => setNote(e.detail.value ?? '')}
                autoGrow
              />
            </IonItem>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Track;
