import React, { useRef, useState } from 'react';
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
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { add, cameraOutline, fastFoodOutline, trash } from 'ionicons/icons';
import { useFoodLog } from '../hooks/useFoodLog';
import type { FoodEntry, MealType } from '../hooks/useFoodLog';
import { S, formatTime, today } from './trackUtils';

/* ── Constants ───────────────────────────────────────────────────────── */

const MEALS: { id: MealType; label: string; emoji: string }[] = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { id: 'lunch',     label: 'Lunch',     emoji: '🥗' },
  { id: 'dinner',    label: 'Dinner',    emoji: '🍽️' },
  { id: 'snack',     label: 'Snack',     emoji: '🍎' },
];

/* ── Helpers ─────────────────────────────────────────────────────────── */

function mealLabel(meal: MealType): string {
  return MEALS.find((m) => m.id === meal)?.label ?? meal;
}

function mealEmoji(meal: MealType): string {
  return MEALS.find((m) => m.id === meal)?.emoji ?? '🍴';
}

async function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── Styles ──────────────────────────────────────────────────────────── */

const mealChip = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  borderRadius: 'var(--md-shape-full)',
  border: `1.5px solid ${active ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
  background: active ? 'var(--md-primary-container)' : 'transparent',
  color: active ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
  fontSize: 'var(--md-label-lg)',
  fontFamily: 'var(--md-font)',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 150ms',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

const photoThumb: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 'var(--md-shape-md)',
  objectFit: 'cover',
  flexShrink: 0,
};

const photoPlaceholder: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 'var(--md-shape-md)',
  background: 'var(--md-surface-container)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: 24,
};

/* ── Component ───────────────────────────────────────────────────────── */

export const FoodTab: React.FC = () => {
  const { loading, addEntry, deleteEntry, todayEntries } = useFoodLog();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = today();
  const grouped = todayEntries(todayStr);
  const totalToday = Object.values(grouped).reduce((n, arr) => n + arr.length, 0);

  /* ── Handlers ────────────────────────────────────────────────────── */

  function openModal() {
    setSelectedMeal('breakfast');
    setPhotoUri(undefined);
    setNote('');
    setSaving(false);
    setModalOpen(true);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const uri = await fileToDataUri(file);
    setPhotoUri(uri);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await addEntry(todayStr, selectedMeal, photoUri, note.trim() || undefined);
      setModalOpen(false);
    } catch {
      setSaving(false);
    }
  }

  /* ── Render helpers ──────────────────────────────────────────────── */

  function renderEntry(entry: FoodEntry) {
    return (
      <IonItemSliding key={entry.id}>
        <IonItem lines="none" style={{ '--padding-start': '16px', '--inner-padding-end': '16px' } as React.CSSProperties}>
          <div slot="start" style={{ marginRight: 12 }}>
            {entry.photo_uri ? (
              <img src={entry.photo_uri} alt="meal" style={photoThumb} />
            ) : (
              <div style={photoPlaceholder}>
                <span>{mealEmoji(entry.meal)}</span>
              </div>
            )}
          </div>
          <IonLabel>
            {entry.note ? (
              <p style={{ color: 'var(--md-on-surface)', margin: '0 0 2px' }}>{entry.note}</p>
            ) : (
              <p style={{ color: 'var(--md-on-surface-variant)', margin: '0 0 2px', fontStyle: 'italic' }}>No note</p>
            )}
            <IonNote style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
              {formatTime(entry.created_at)}
            </IonNote>
          </IonLabel>
        </IonItem>
        <IonItemOptions side="end">
          <IonItemOption
            color="danger"
            onClick={() => deleteEntry(entry.id)}
            style={{ borderRadius: 'var(--md-shape-md)' }}
          >
            <IonIcon slot="icon-only" icon={trash} />
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>
    );
  }

  function renderCategory(meal: { id: MealType; label: string; emoji: string }) {
    const items = grouped[meal.id];
    return (
      <React.Fragment key={meal.id}>
        <IonListHeader style={{ '--color': 'var(--md-primary)', fontSize: 'var(--md-label-lg)', letterSpacing: '0.08em', textTransform: 'uppercase' } as React.CSSProperties}>
          {meal.emoji} {meal.label}
        </IonListHeader>
        <IonList style={{ background: 'transparent', paddingBottom: 4 }}>
          {items.length === 0 ? (
            <IonItem lines="none" style={{ '--padding-start': '20px' } as React.CSSProperties}>
              <IonNote style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-outline)' }}>
                Nothing logged yet
              </IonNote>
            </IonItem>
          ) : (
            items.map(renderEntry)
          )}
        </IonList>
      </React.Fragment>
    );
  }

  /* ── JSX ─────────────────────────────────────────────────────────── */

  return (
    <>
      {/* ── Today summary card ──────────────────────────────────────── */}
      <IonCard style={{ borderRadius: 'var(--md-shape-xl)', margin: '16px 16px 8px' }}>
        <IonCardContent style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Today
          </div>
          {loading ? (
            <div style={{ fontSize: 'var(--md-title-lg)', color: 'var(--md-on-surface-variant)' }}>—</div>
          ) : totalToday === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon icon={fastFoodOutline} style={{ fontSize: 28, color: 'var(--md-on-surface-variant)' }} />
              <span style={{ fontSize: 'var(--md-title-lg)', color: 'var(--md-on-surface-variant)' }}>No meals logged</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 300, fontFamily: 'var(--md-font)', color: 'var(--md-on-surface)', lineHeight: 1.1 }}>
                {totalToday}
              </span>
              <span style={{ fontSize: 'var(--md-title-sm)', color: 'var(--md-on-surface-variant)' }}>
                {totalToday === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* ── Grouped meal log ────────────────────────────────────────── */}
      <IonCard style={{ borderRadius: 'var(--md-shape-xl)', margin: '8px 16px 16px' }}>
        <IonCardContent style={{ padding: '8px 0 12px' }}>
          {MEALS.map(renderCategory)}
        </IonCardContent>
      </IonCard>

      {/* ── FAB ─────────────────────────────────────────────────────── */}
      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton onClick={openModal} style={{ '--background': 'var(--md-primary-container)', '--color': 'var(--md-on-primary-container)' } as React.CSSProperties}>
          <IonIcon icon={add} />
        </IonFabButton>
      </IonFab>

      {/* ── Add entry modal ──────────────────────────────────────────── */}
      <IonModal
        isOpen={modalOpen}
        onDidDismiss={() => setModalOpen(false)}
        initialBreakpoint={0.85}
        breakpoints={[0, 0.85, 1]}
        style={{ '--border-radius': 'var(--md-shape-xl)' } as React.CSSProperties}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Log Meal</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setModalOpen(false)}>Cancel</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Meal type selector */}
            <div>
              <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Meal
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MEALS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMeal(m.id)}
                    style={mealChip(selectedMeal === m.id)}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Photo (optional)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {photoUri ? (
                  <img src={photoUri} alt="preview" style={{ ...photoThumb, width: 80, height: 80 }} />
                ) : (
                  <div style={{ ...photoPlaceholder, width: 80, height: 80 }}>
                    <IonIcon icon={cameraOutline} style={{ fontSize: 28, color: 'var(--md-on-surface-variant)' }} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <IonButton
                    fill="outline"
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ '--border-radius': 'var(--md-shape-full)' } as React.CSSProperties}
                  >
                    <IonIcon slot="start" icon={cameraOutline} />
                    {photoUri ? 'Change' : 'Add photo'}
                  </IonButton>
                  {photoUri && (
                    <IonButton
                      fill="clear"
                      size="small"
                      color="danger"
                      onClick={() => setPhotoUri(undefined)}
                      style={{ '--border-radius': 'var(--md-shape-full)' } as React.CSSProperties}
                    >
                      Remove
                    </IonButton>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </div>

            {/* Note */}
            <div>
              <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Note (optional)
              </div>
              <IonTextarea
                value={note}
                onIonInput={(e) => setNote(e.detail.value ?? '')}
                placeholder="What did you eat?"
                autoGrow
                rows={3}
                style={{ '--background': 'var(--md-surface-container)', '--border-radius': 'var(--md-shape-md)', '--padding-start': '14px', '--padding-end': '14px', '--padding-top': '12px', '--padding-bottom': '12px' } as React.CSSProperties}
              />
            </div>

            {/* Save */}
            <IonButton
              expand="block"
              disabled={saving}
              onClick={handleSave}
              style={{ '--border-radius': 'var(--md-shape-full)', '--background': 'var(--md-primary)', '--color': 'var(--md-on-primary)', marginTop: 8 } as React.CSSProperties}
            >
              {saving ? 'Saving…' : 'Log Meal'}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};
