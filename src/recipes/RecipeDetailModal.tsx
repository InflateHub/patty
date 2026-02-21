import React, { useState } from 'react';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { closeOutline, timeOutline, restaurantOutline, trash, nutritionOutline } from 'ionicons/icons';
import type { Recipe } from './recipeData';
import type { MealType } from '../hooks/useFoodLog';

const LOG_MEALS: { id: MealType; label: string; emoji: string }[] = [
  { id: 'breakfast', label: 'Breakfast', emoji: '\uD83C\uDF05' },
  { id: 'lunch',     label: 'Lunch',     emoji: '\uD83E\uDD57' },
  { id: 'dinner',    label: 'Dinner',    emoji: '\uD83C\uDF7D\uFE0F' },
  { id: 'snack',     label: 'Snack',     emoji: '\uD83C\uDF4E' },
];

interface Props {
  recipe: Recipe | null;
  onClose: () => void;
  onDelete?: () => void;
  onLogMeal?: (meal: MealType, kcal?: number) => Promise<void>;
}

const RecipeDetailModal: React.FC<Props> = ({ recipe, onClose, onDelete, onLogMeal }) => {
  const [logPickerOpen, setLogPickerOpen] = useState(false);
  const [logMeal, setLogMeal] = useState<MealType>('breakfast');
  const [logging, setLogging] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  function handleDismiss() {
    setLogPickerOpen(false);
    setLogMeal('breakfast');
    onClose();
  }

  async function handleLog() {
    if (!recipe || !onLogMeal) return;
    setLogging(true);
    try {
      await onLogMeal(logMeal, recipe.kcalPerServing);
      setLogPickerOpen(false);
      const label = LOG_MEALS.find((m) => m.id === logMeal)?.label ?? logMeal;
      setToastMsg(`Logged as ${label}`);
    } catch {
      /* noop */
    } finally {
      setLogging(false);
    }
  }

  return (
    <IonModal isOpen={recipe !== null} onDidDismiss={handleDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{recipe?.name ?? ''}</IonTitle>
          <IonButtons slot="end">
            {onDelete && (
              <IonButton color="danger" onClick={onDelete}>
                <IonIcon icon={trash} />
              </IonButton>
            )}
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {recipe && (
        <IonContent>
          {/* Hero */}
          <div style={S.hero}>
            <div style={S.heroEmoji}>{recipe.emoji}</div>
            <div style={S.heroMeta}>
              {recipe.prepMin > 0 && (
                <span style={S.chip}>
                  <IonIcon icon={timeOutline} style={{ marginRight: 4 }} />
                  Prep {recipe.prepMin} min
                </span>
              )}
              {recipe.cookMin > 0 && (
                <span style={S.chip}>
                  <IonIcon icon={restaurantOutline} style={{ marginRight: 4 }} />
                  Cook {recipe.cookMin} min
                </span>
              )}
              {recipe.prepMin === 0 && recipe.cookMin === 0 && (
                <span style={S.chip}>No cooking needed</span>
              )}
              {recipe.kcalPerServing != null && (
                <span style={{ ...S.chip, background: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' }}>
                  ~{recipe.kcalPerServing} kcal / serving
                </span>
              )}
            </div>
            <div style={S.tagRow}>
              {recipe.tags.map((tag) => (
                <IonBadge key={tag} style={S.tag}>{tag}</IonBadge>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <IonList lines="inset" style={{ marginBottom: 8 }}>
            <IonListHeader style={S.listHeader}>Ingredients</IonListHeader>
            {recipe.ingredients.map((ing, i) => (
              <IonItem key={i}>
                <IonLabel style={{ whiteSpace: 'normal', fontSize: 'var(--md-body-md)' }}>
                  {ing}
                </IonLabel>
              </IonItem>
            ))}
          </IonList>

          {/* Steps */}
          <IonList lines="none" style={{ marginBottom: 32 }}>
            <IonListHeader style={S.listHeader}>Instructions</IonListHeader>
            {recipe.steps.map((step, i) => (
              <IonItem key={i} style={{ '--padding-top': '12px', '--padding-bottom': '12px' } as React.CSSProperties}>
                <div slot="start" style={S.stepNumber}>{i + 1}</div>
                <IonLabel style={{ whiteSpace: 'normal', fontSize: 'var(--md-body-md)', lineHeight: 1.5 }}>
                  {step}
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </IonContent>
      )}

      {/* ── Log as meal footer ─────────────────────────────────────── */}
      {onLogMeal && recipe && (
        <IonFooter style={{ background: 'var(--md-surface-container-low)', borderTop: '1px solid var(--md-outline-variant)', padding: '12px 16px' }}>
          {!logPickerOpen ? (
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => setLogPickerOpen(true)}
              style={{ '--border-radius': 'var(--md-shape-full)', '--color': 'var(--md-primary)', '--border-color': 'var(--md-primary)' } as React.CSSProperties}
            >
              <IonIcon slot="start" icon={nutritionOutline} />
              Log as meal
            </IonButton>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Which meal?
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {LOG_MEALS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setLogMeal(m.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--md-shape-full)',
                      border: `1.5px solid ${logMeal === m.id ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
                      background: logMeal === m.id ? 'var(--md-primary-container)' : 'transparent',
                      color: logMeal === m.id ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                      fontSize: 'var(--md-label-lg)',
                      fontFamily: 'var(--md-font)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => setLogPickerOpen(false)}
                  style={{ flex: 1, '--color': 'var(--md-on-surface-variant)' } as React.CSSProperties}
                >
                  Cancel
                </IonButton>
                <IonButton
                  expand="block"
                  disabled={logging}
                  onClick={handleLog}
                  style={{ flex: 2, '--border-radius': 'var(--md-shape-full)', '--background': 'var(--md-primary)', '--color': 'var(--md-on-primary)' } as React.CSSProperties}
                >
                  {logging ? 'Saving…' : 'Confirm'}
                </IonButton>
              </div>
            </div>
          )}
        </IonFooter>
      )}

      <IonToast
        isOpen={toastMsg !== ''}
        message={toastMsg}
        duration={2000}
        onDidDismiss={() => setToastMsg('')}
        position="bottom"
        style={{ '--border-radius': 'var(--md-shape-md)' } as React.CSSProperties}
      />
    </IonModal>
  );
};

/* ── Styles ──────────────────────────────────────────────────────────── */
const S = {
  hero: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '32px 24px 24px',
    gap: 12,
    background: 'var(--md-surface-container-low)',
    borderBottom: '1px solid var(--md-outline-variant)',
  },
  heroEmoji: {
    fontSize: 72,
    lineHeight: 1,
  },
  heroMeta: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'var(--md-secondary-container)',
    color: 'var(--md-on-secondary-container)',
    borderRadius: 'var(--md-shape-full)',
    padding: '4px 12px',
    fontSize: 'var(--md-label-lg)',
    fontFamily: 'var(--md-font)',
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    justifyContent: 'center',
  },
  tag: {
    background: 'var(--md-surface-container-high)',
    color: 'var(--md-on-surface-variant)',
    borderRadius: 'var(--md-shape-full)',
    fontSize: 'var(--md-label-sm)',
    fontFamily: 'var(--md-font)',
    textTransform: 'lowercase' as const,
  },
  listHeader: {
    color: 'var(--md-primary)',
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-label-lg)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--md-primary-container)',
    color: 'var(--md-on-primary-container)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-label-lg)',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: 2,
  },
};

export default RecipeDetailModal;
