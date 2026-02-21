import React, { useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { addOutline, closeOutline, removeCircleOutline } from 'ionicons/icons';
import type { Recipe } from './recipeData';

const EMOJI_OPTIONS = [
  '🍳','🥣','🥑','🍜','🥗','🍲','🥞','🐟','🌶️','🫐',
  '🌯','🍝','🍛','🥘','🥩','🍗','🥕','🥦','🍅','🍋',
  '🧆','🥙','🍱','🫕','🍤','🍣','🧇','🥐','🍞','🫔',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: Omit<Recipe, 'id'>) => Promise<void>;
}

const EMPTY = (): Omit<Recipe, 'id'> => ({
  name: '',
  emoji: '🍴',
  prepMin: 0,
  cookMin: 0,
  tags: [],
  ingredients: [''],
  steps: [''],
});

const RecipeFormModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState(EMPTY);
  const [tagsRaw, setTagsRaw] = useState('');
  const [kcalRaw, setKcalRaw] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm(EMPTY());
    setTagsRaw('');
    setKcalRaw('');
    setSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  /* ── Field helpers ─────────────────────────────────────────────────── */

  function setIngredient(i: number, value: string) {
    setForm((f) => {
      const ing = [...f.ingredients];
      ing[i] = value;
      return { ...f, ingredients: ing };
    });
  }

  function addIngredient() {
    setForm((f) => ({ ...f, ingredients: [...f.ingredients, ''] }));
  }

  function removeIngredient(i: number) {
    setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));
  }

  function setStep(i: number, value: string) {
    setForm((f) => {
      const steps = [...f.steps];
      steps[i] = value;
      return { ...f, steps };
    });
  }

  function addStep() {
    setForm((f) => ({ ...f, steps: [...f.steps, ''] }));
  }

  function removeStep(i: number) {
    setForm((f) => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));
  }

  /* ── Save ──────────────────────────────────────────────────────────── */

  async function handleSave() {
    const name = form.name.trim();
    if (!name) return;
    const ingredients = form.ingredients.map((s) => s.trim()).filter(Boolean);
    const steps = form.steps.map((s) => s.trim()).filter(Boolean);
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const kcalNum = kcalRaw.trim() ? parseInt(kcalRaw.trim(), 10) : undefined;
    const kcalPerServing = Number.isFinite(kcalNum) && kcalNum! > 0 ? kcalNum : undefined;

    setSaving(true);
    try {
      await onSave({ ...form, name, ingredients, steps, tags, kcalPerServing });
      reset();
      onClose();
    } catch {
      setSaving(false);
    }
  }

  const canSave = form.name.trim().length > 0;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>New Recipe</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={handleClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton strong onClick={handleSave} disabled={!canSave || saving}>
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Emoji + Name */}
        <IonList lines="inset" style={{ marginBottom: 0 }}>
          <IonListHeader style={S.listHeader}>Name &amp; Emoji</IonListHeader>
          <IonItem>
            <IonInput
              label="Recipe name"
              labelPlacement="floating"
              value={form.name}
              onIonInput={(e) => setForm((f) => ({ ...f, name: e.detail.value ?? '' }))}
              placeholder="e.g. Chicken Stir-Fry"
              maxlength={60}
            />
          </IonItem>
        </IonList>

        <div style={S.emojiSection}>
          <p style={S.emojiLabel}>Choose an emoji</p>
          <div style={S.emojiGrid}>
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                style={{
                  ...S.emojiBtn,
                  background: form.emoji === e ? 'var(--md-primary-container)' : 'transparent',
                  outline: form.emoji === e ? '2px solid var(--md-primary)' : '1px solid var(--md-outline-variant)',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Times */}
        <IonList lines="inset" style={{ marginBottom: 0 }}>
          <IonListHeader style={S.listHeader}>Time &amp; Nutrition</IonListHeader>
          <IonItem>
            <IonInput
              label="Prep time (min)"
              labelPlacement="floating"
              type="number"
              min="0"
              value={form.prepMin}
              onIonInput={(e) =>
                setForm((f) => ({ ...f, prepMin: Math.max(0, parseInt(e.detail.value ?? '0', 10) || 0) }))
              }
            />
          </IonItem>
          <IonItem>
            <IonInput
              label="Cook time (min)"
              labelPlacement="floating"
              type="number"
              min="0"
              value={form.cookMin}
              onIonInput={(e) =>
                setForm((f) => ({ ...f, cookMin: Math.max(0, parseInt(e.detail.value ?? '0', 10) || 0) }))
              }
            />
          </IonItem>
          <IonItem>
            <IonInput
              label="Calories per serving (kcal, optional)"
              labelPlacement="floating"
              type="number"
              min="0"
              value={kcalRaw}
              onIonInput={(e) => setKcalRaw(e.detail.value ?? '')}
              placeholder="e.g. 480"
            />
          </IonItem>
        </IonList>

        {/* Tags */}
        <IonList lines="inset" style={{ marginBottom: 0 }}>
          <IonListHeader style={S.listHeader}>Tags</IonListHeader>
          <IonItem>
            <IonInput
              label="Tags (comma-separated)"
              labelPlacement="floating"
              value={tagsRaw}
              onIonInput={(e) => setTagsRaw(e.detail.value ?? '')}
              placeholder="e.g. dinner, high-protein, meal-prep"
            />
          </IonItem>
        </IonList>

        {/* Ingredients */}
        <IonList lines="inset" style={{ marginBottom: 0 }}>
          <IonListHeader style={S.listHeader}>Ingredients</IonListHeader>
          {form.ingredients.map((ing, i) => (
            <IonItem key={i}>
              <IonTextarea
                value={ing}
                onIonInput={(e) => setIngredient(i, e.detail.value ?? '')}
                placeholder={`Ingredient ${i + 1}`}
                autoGrow
                rows={1}
                style={{ fontSize: 'var(--md-body-md)' }}
              />
              {form.ingredients.length > 1 && (
                <IonButton
                  slot="end"
                  fill="clear"
                  color="danger"
                  onClick={() => removeIngredient(i)}
                  style={{ minWidth: 36 }}
                >
                  <IonIcon icon={removeCircleOutline} />
                </IonButton>
              )}
            </IonItem>
          ))}
          <IonItem button detail={false} onClick={addIngredient} style={S.addRow}>
            <IonIcon icon={addOutline} slot="start" style={{ color: 'var(--md-primary)' }} />
            <IonLabel style={{ color: 'var(--md-primary)', fontFamily: 'var(--md-font)' }}>
              Add ingredient
            </IonLabel>
          </IonItem>
        </IonList>

        {/* Steps */}
        <IonList lines="inset" style={{ marginBottom: 32 }}>
          <IonListHeader style={S.listHeader}>Steps</IonListHeader>
          {form.steps.map((step, i) => (
            <IonItem key={i} style={{ '--padding-top': '8px', '--padding-bottom': '8px' } as React.CSSProperties}>
              <div slot="start" style={S.stepNum}>{i + 1}</div>
              <IonTextarea
                value={step}
                onIonInput={(e) => setStep(i, e.detail.value ?? '')}
                placeholder={`Step ${i + 1}`}
                autoGrow
                rows={2}
                style={{ fontSize: 'var(--md-body-md)' }}
              />
              {form.steps.length > 1 && (
                <IonButton
                  slot="end"
                  fill="clear"
                  color="danger"
                  onClick={() => removeStep(i)}
                  style={{ minWidth: 36 }}
                >
                  <IonIcon icon={removeCircleOutline} />
                </IonButton>
              )}
            </IonItem>
          ))}
          <IonItem button detail={false} onClick={addStep} style={S.addRow}>
            <IonIcon icon={addOutline} slot="start" style={{ color: 'var(--md-primary)' }} />
            <IonLabel style={{ color: 'var(--md-primary)', fontFamily: 'var(--md-font)' }}>
              Add step
            </IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonModal>
  );
};

/* ── Styles ──────────────────────────────────────────────────────────── */
const S = {
  listHeader: {
    color: 'var(--md-primary)',
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-label-lg)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  emojiSection: {
    padding: '12px 16px 8px',
  },
  emojiLabel: {
    margin: '0 0 8px',
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-label-lg)',
    color: 'var(--md-primary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  emojiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
    gap: 6,
  },
  emojiBtn: {
    fontSize: 24,
    width: '100%',
    aspectRatio: '1',
    border: 'none',
    borderRadius: 'var(--md-shape-md)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    transition: 'background 0.15s',
  },
  addRow: {
    '--padding-start': '16px',
    cursor: 'pointer',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'var(--md-primary-container)',
    color: 'var(--md-on-primary-container)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-label-md)',
    fontWeight: 700,
    flexShrink: 0,
  },
};

export default RecipeFormModal;
