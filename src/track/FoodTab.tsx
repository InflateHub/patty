import React, { useEffect, useState } from 'react';
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
  IonModal,
  IonNote,
  IonSkeletonText,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { addOutline, albumsOutline, cameraOutline, fastFoodOutline, trash } from 'ionicons/icons';
import { useFoodLog } from '../hooks/useFoodLog';
import type { FoodEntry, MealType } from '../hooks/useFoodLog';
import { formatTime, today } from './trackUtils';

/* ── Constants ───────────────────────────────────────────────────────── */

const MEALS: { id: MealType; label: string; emoji: string }[] = [
  { id: 'breakfast',     label: 'Breakfast',     emoji: '🌅' },
  { id: 'brunch',        label: 'Brunch',        emoji: '🥞' },
  { id: 'lunch',         label: 'Lunch',         emoji: '🥗' },
  { id: 'snack',         label: 'Snack',         emoji: '🍎' },
  { id: 'dinner',        label: 'Dinner',        emoji: '🍽️' },
  { id: 'midnight_meal', label: 'Midnight Meal', emoji: '🌙' },
];

/** Meals always shown; optional meals only appear when they have entries */
const OPTIONAL_MEALS: MealType[] = ['brunch', 'midnight_meal'];

/* ── Helpers ─────────────────────────────────────────────────────────── */

function mealEmoji(meal: MealType): string {
  return MEALS.find((m) => m.id === meal)?.emoji ?? '🍴';
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

/* ── Component ───────────────────────────────────────────────────────── */

interface FoodTabProps {
  openTrigger?: number;
}

export const FoodTab: React.FC<FoodTabProps> = ({ openTrigger }) => {
  const { loading, addEntry, deleteEntry, todayEntries, reload } = useFoodLog();

  useIonViewWillEnter(() => {
    reload();
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [kcal, setKcal] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* Open modal when Track's contextual FAB fires */
  useEffect(() => {
    if (!openTrigger) return;
    openModal();
  }, [openTrigger]);

  const todayStr = today();
  const grouped = todayEntries(todayStr);
  const totalToday = Object.values(grouped).reduce((n, arr) => n + arr.length, 0);
  const allTodayEntries = Object.values(grouped).flat();
  const kcalEntries = allTodayEntries.filter((e) => e.kcal != null);
  const totalKcal = kcalEntries.reduce((sum, e) => sum + (e.kcal ?? 0), 0);

  /* ── Handlers ────────────────────────────────────────────────────── */

  function openModal(prefillMeal?: MealType) {
    setSelectedMeal(prefillMeal ?? 'breakfast');
    setPhotoUri(undefined);
    setNote('');
    setKcal('');
    setSaving(false);
    setModalOpen(true);
  }

  async function captureFood(source: CameraSource) {
    try {
      if (source === CameraSource.Camera) {
        const perms = await Camera.checkPermissions();
        if (perms.camera === 'denied') { setErrorMsg('Camera permission denied. Enable it in device settings.'); return; }
        if (perms.camera !== 'granted') {
          const req = await Camera.requestPermissions({ permissions: ['camera'] });
          if (req.camera !== 'granted') { setErrorMsg('Camera permission was not granted.'); return; }
        }
      } else {
        const perms = await Camera.checkPermissions();
        if (perms.photos === 'denied') { setErrorMsg('Photo library permission denied. Enable it in device settings.'); return; }
        if (perms.photos !== 'granted') {
          const req = await Camera.requestPermissions({ permissions: ['photos'] });
          if (req.photos !== 'granted') { setErrorMsg('Photo library permission was not granted.'); return; }
        }
      }
      const photo = await Camera.getPhoto({ resultType: CameraResultType.DataUrl, source, quality: 80 });
      if (photo.dataUrl) setPhotoUri(photo.dataUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('no image')) {
        setErrorMsg('Could not capture photo.');
      }
    }
  }

  async function handleSave() {
    setSaving(true);
    const kcalNum = kcal.trim() ? parseInt(kcal.trim(), 10) : undefined;
    try {
      await addEntry(todayStr, selectedMeal, photoUri, note.trim() || undefined, Number.isFinite(kcalNum) ? kcalNum : undefined);
      setModalOpen(false);
    } catch {
      setErrorMsg('Could not save entry. Please try again.');
      setSaving(false);
    }
  }

  /* ── Render helpers ──────────────────────────────────────────────── */

  function renderEntry(entry: FoodEntry) {
    return (
      <IonItemSliding key={entry.id}>
        <IonItem
          lines="none"
          style={{ '--padding-start': '16px', '--inner-padding-end': '16px', '--background': 'transparent' } as React.CSSProperties}
        >
          {/* Photo or emoji thumb */}
          <div slot="start" style={{ marginRight: 12 }}>
            {entry.photo_uri ? (
              <img
                src={entry.photo_uri}
                alt="meal"
                style={{ width: 48, height: 48, borderRadius: 'var(--md-shape-md)', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--md-shape-md)',
                background: 'var(--md-surface-container-high)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                {mealEmoji(entry.meal)}
              </div>
            )}
          </div>
          <IonLabel>
            {entry.note ? (
              <p style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-md)', color: 'var(--md-on-surface)', margin: '0 0 3px', lineHeight: 1.4 }}>
                {entry.note}
              </p>
            ) : (
              <p style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-md)', color: 'var(--md-on-surface-variant)', margin: '0 0 3px', fontStyle: 'italic' }}>
                No note
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonNote style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                {formatTime(entry.created_at)}
              </IonNote>
              {entry.kcal != null && (
                <span style={{ fontSize: 'var(--md-label-sm)', color: 'var(--md-primary)', fontFamily: 'var(--md-font)', fontWeight: 600 }}>
                  {entry.kcal} kcal
                </span>
              )}
            </div>
          </IonLabel>
        </IonItem>
        <IonItemOptions side="end">
          <IonItemOption
            color="danger"
            onClick={() => deleteEntry(entry.id).catch(() => setErrorMsg('Could not delete entry.'))}
            style={{ borderRadius: 'var(--md-shape-md)' }}
          >
            <IonIcon slot="icon-only" icon={trash} />
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>
    );
  }

  function renderMealCard(meal: { id: MealType; label: string; emoji: string }) {
    const items = grouped[meal.id] ?? [];
    const mealKcal = items.filter(e => e.kcal != null).reduce((s, e) => s + (e.kcal ?? 0), 0);

    return (
      <IonCard
        key={meal.id}
        style={{
          borderRadius: 'var(--md-shape-xl)',
          margin: '0 16px',
          boxShadow: 'none',
          border: '1.5px solid var(--md-outline-variant)',
          overflow: 'hidden',
        }}
      >
        {/* ── Clickable header ── */}
        <div
          onClick={() => openModal(meal.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px 14px 16px',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            background: items.length > 0 ? 'var(--md-surface-container-low)' : 'transparent',
          }}
        >
          {/* Emoji bubble */}
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--md-shape-lg)',
            background: 'var(--md-primary-container)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>
            {meal.emoji}
          </div>

          {/* Label + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--md-font)',
              fontSize: 'var(--md-title-sm)',
              fontWeight: 600,
              color: 'var(--md-on-surface)',
              lineHeight: 1.2,
            }}>
              {meal.label}
            </div>
            {items.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)', fontFamily: 'var(--md-font)' }}>
                  {items.length} {items.length === 1 ? 'entry' : 'entries'}
                </span>
                {mealKcal > 0 && (
                  <>
                    <span style={{ fontSize: 10, color: 'var(--md-outline)' }}>·</span>
                    <span style={{ fontSize: 'var(--md-label-sm)', color: 'var(--md-primary)', fontFamily: 'var(--md-font)', fontWeight: 600 }}>
                      {mealKcal} kcal
                    </span>
                  </>
                )}
              </div>
            )}
            {items.length === 0 && (
              <div style={{ fontSize: 'var(--md-label-sm)', color: 'var(--md-outline)', fontFamily: 'var(--md-font)', marginTop: 2 }}>
                Tap to add
              </div>
            )}
          </div>

          {/* Add icon */}
          <IonIcon
            icon={addOutline}
            style={{ fontSize: 22, color: 'var(--md-primary)', flexShrink: 0 }}
          />
        </div>

        {/* ── Entries (only when present) ── */}
        {items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--md-outline-variant)' }}>
            {items.map(renderEntry)}
          </div>
        )}
      </IonCard>
    );
  }

  /* ── JSX ─────────────────────────────────────────────────────────── */

  return (
    <>
      {/* ── Today summary card ──────────────────────────────────────── */}
      <IonCard style={{ borderRadius: 'var(--md-shape-xl)', margin: '16px 16px 12px', boxShadow: 'none', border: '1.5px solid var(--md-outline-variant)' }}>
        <IonCardContent style={{ padding: '16px 24px' }}>
          <div style={{ fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Today
          </div>
          {loading ? (
            <div>
              <IonSkeletonText animated style={{ width: 80, height: 40, borderRadius: 6 }} />
              <IonSkeletonText animated style={{ width: 120, height: 14, marginTop: 8 }} />
            </div>
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
              {kcalEntries.length > 0 && (
                <span style={{ fontSize: 'var(--md-title-sm)', color: 'var(--md-primary)', marginLeft: 8 }}>
                  {totalKcal} kcal
                </span>
              )}
            </div>
          )}
        </IonCardContent>
      </IonCard>

      {/* ── Per-meal cards ───────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px 16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <IonCard key={i} style={{ borderRadius: 'var(--md-shape-xl)', margin: 0, boxShadow: 'none', border: '1.5px solid var(--md-outline-variant)' }}>
              <IonCardContent style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <IonSkeletonText animated style={{ width: 40, height: 40, borderRadius: 'var(--md-shape-lg)' }} />
                <div style={{ flex: 1 }}>
                  <IonSkeletonText animated style={{ width: '40%', height: 16, marginBottom: 6 }} />
                  <IonSkeletonText animated style={{ width: '25%', height: 12 }} />
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
          {MEALS.filter(m =>
            !OPTIONAL_MEALS.includes(m.id) || (grouped[m.id]?.length ?? 0) > 0
          ).map(renderMealCard)}
        </div>
      )}


      <IonToast
        isOpen={!!errorMsg}
        message={errorMsg ?? ''}
        duration={3000}
        color="danger"
        onDidDismiss={() => setErrorMsg(null)}
      />
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

            {/* Photo */}
            <div>
              <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Photo (optional)
              </div>
              {photoUri && (
                <div style={{ borderRadius: 'var(--md-shape-md)', overflow: 'hidden', marginBottom: 12, border: '1px solid var(--md-outline-variant)' }}>
                  <img src={photoUri} alt="preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <IonButton
                  fill="outline"
                  size="small"
                  style={{ flex: 1, '--border-radius': 'var(--md-shape-full)', '--border-color': 'var(--md-outline)', '--color': 'var(--md-on-surface)' } as React.CSSProperties}
                  onClick={() => captureFood(CameraSource.Camera)}
                >
                  <IonIcon slot="start" icon={cameraOutline} />
                  Take Photo
                </IonButton>
                <IonButton
                  fill="outline"
                  size="small"
                  style={{ flex: 1, '--border-radius': 'var(--md-shape-full)', '--border-color': 'var(--md-outline)', '--color': 'var(--md-on-surface)' } as React.CSSProperties}
                  onClick={() => captureFood(CameraSource.Photos)}
                >
                  <IonIcon slot="start" icon={albumsOutline} />
                  Gallery
                </IonButton>
                {photoUri && (
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => setPhotoUri(undefined)}
                    style={{ '--color': 'var(--md-error)' } as React.CSSProperties}
                  >
                    Remove
                  </IonButton>
                )}
              </div>
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

            {/* Calories */}
            <div>
              <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Calories (optional)
              </div>
              <IonInput
                type="number"
                min="0"
                value={kcal}
                onIonInput={(e) => setKcal(e.detail.value ?? '')}
                placeholder="e.g. 450"
                style={{ '--background': 'var(--md-surface-container)', '--border-radius': 'var(--md-shape-md)', '--padding-start': '14px', '--padding-end': '14px' } as React.CSSProperties}
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
