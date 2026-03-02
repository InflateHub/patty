import React, { useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonSkeletonText,
  IonTitle,
  IonToast,
  IonToolbar,
  IonBadge,
  IonIcon,
  IonTextarea,
} from '@ionic/react';
import { timeOutline, refreshOutline, sparkles } from 'ionicons/icons';
import { useGeminiKey } from '../hooks/useGeminiKey';
import { geminiRequest, geminiErrorMessage } from '../utils/gemini';
import type { Recipe } from './recipeData';

const DIETARY_TAGS = [
  '🥦 Vegetarian',
  '🌱 Vegan',
  '🌾 Gluten-Free',
  '🥛 Dairy-Free',
  '💪 High-Protein',
  '🥩 Low-Carb',
];

interface GeneratedRecipe {
  name: string;
  emoji: string;
  prepMin: number;
  cookMin: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
}

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  borderRadius: 'var(--md-shape-full)',
  border: `1.5px solid ${active ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
  background: active ? 'var(--md-primary-container)' : 'transparent',
  color: active ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
  fontSize: 'var(--md-label-md)',
  fontFamily: 'var(--md-font)',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 150ms',
});

const AIRecipeModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const { geminiKey } = useGeminiKey();
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedRecipe | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  function reset() {
    setDescription('');
    setSelectedTags([]);
    setGenerating(false);
    setGenerated(null);
    setSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function generate() {
    if (!geminiKey || !description.trim()) return;
    setGenerating(true);
    setGenerated(null);
    try {
      const tagPart = selectedTags.length
        ? ` Dietary constraints: ${selectedTags.map((t) => t.replace(/^.*? /, '')).join(', ')}.`
        : '';
      const prompt = `Create a recipe for: "${description.trim()}".${tagPart} Return a JSON object with the recipe details.`;
      const result = await geminiRequest<GeneratedRecipe>({
        apiKey: geminiKey,
        prompt,
        schema: {
          type: 'OBJECT',
          properties: {
            name:        { type: 'STRING' },
            emoji:       { type: 'STRING' },
            prepMin:     { type: 'INTEGER' },
            cookMin:     { type: 'INTEGER' },
            tags:        { type: 'ARRAY', items: { type: 'STRING' } },
            ingredients: { type: 'ARRAY', items: { type: 'STRING' } },
            steps:       { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ['name', 'emoji', 'prepMin', 'cookMin', 'tags', 'ingredients', 'steps'],
        },
      });
      setGenerated(result);
    } catch (err) {
      setToastMsg(geminiErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!generated) return;
    setSaving(true);
    try {
      await onSave({
        name: generated.name,
        emoji: generated.emoji || '🍴',
        prepMin: generated.prepMin ?? 0,
        cookMin: generated.cookMin ?? 0,
        tags: generated.tags ?? [],
        ingredients: generated.ingredients ?? [],
        steps: generated.steps ?? [],
      });
      setToastMsg(`"${generated.name}" saved to your recipes!`);
      handleClose();
    } catch {
      setToastMsg('Could not save recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>AI Recipe ✨</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose}>Cancel</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div style={{ padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* No API key state */}
          {!geminiKey ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 12, textAlign: 'center' }}>
              <span style={{ fontSize: 48 }}>✨</span>
              <p style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-md)', color: 'var(--md-on-surface)', margin: 0 }}>Set up AI first</p>
              <p style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-md)', color: 'var(--md-on-surface-variant)', margin: 0 }}>
                Add your Gemini API key in Profile → AI Settings to generate recipes.
              </p>
            </div>
          ) : !generated ? (
            <>
              {/* Description input */}
              <div>
                <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  Describe your recipe
                </div>
                <IonTextarea
                  value={description}
                  onIonInput={(e) => setDescription(e.detail.value ?? '')}
                  placeholder="e.g. high-protein chicken bowl, under 30 min"
                  autoGrow
                  rows={3}
                  style={{ '--background': 'var(--md-surface-container)', '--border-radius': 'var(--md-shape-md)', '--padding-start': '14px', '--padding-end': '14px', '--padding-top': '12px', '--padding-bottom': '12px' } as React.CSSProperties}
                />
              </div>

              {/* Dietary tags */}
              <div>
                <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Dietary preferences (optional)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DIETARY_TAGS.map((tag) => (
                    <button key={tag} style={chipStyle(selectedTags.includes(tag))} onClick={() => toggleTag(tag)}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              {generating ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <IonSkeletonText animated style={{ width: '50%', height: 28, borderRadius: 8 }} />
                  <IonSkeletonText animated style={{ width: '100%', height: 16, borderRadius: 6 }} />
                  <IonSkeletonText animated style={{ width: '80%', height: 16, borderRadius: 6 }} />
                  <IonSkeletonText animated style={{ width: '90%', height: 16, borderRadius: 6 }} />
                </div>
              ) : (
                <IonButton
                  expand="block"
                  disabled={!description.trim()}
                  onClick={generate}
                  style={{ '--border-radius': 'var(--md-shape-full)', '--background': 'var(--md-primary)', '--color': 'var(--md-on-primary)', marginTop: 8 } as React.CSSProperties}
                >
                  <IonIcon slot="start" icon={sparkles} />
                  Generate Recipe
                </IonButton>
              )}
            </>
          ) : (
            <>
              {/* Recipe preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 72, lineHeight: 1 }}>{generated.emoji}</div>
                <h2 style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-headline-sm)', fontWeight: 700, color: 'var(--md-on-surface)', margin: 0, textAlign: 'center' }}>
                  {generated.name}
                </h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)', fontFamily: 'var(--md-font)' }}>
                    <IonIcon icon={timeOutline} style={{ fontSize: 14 }} />
                    {(generated.prepMin + generated.cookMin) > 0 ? `${generated.prepMin + generated.cookMin} min` : 'No cook'}
                  </span>
                  {generated.tags.slice(0, 4).map((t) => (
                    <IonBadge key={t} style={{ background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)', borderRadius: 'var(--md-shape-full)', fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', textTransform: 'lowercase', fontWeight: 500 }}>
                      {t}
                    </IonBadge>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--md-font)', fontWeight: 700, marginBottom: 10 }}>
                  Ingredients
                </div>
                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {generated.ingredients.map((ing, i) => (
                    <li key={i} style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-md)', color: 'var(--md-on-surface)' }}>{ing}</li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div>
                <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--md-font)', fontWeight: 700, marginBottom: 10 }}>
                  Steps
                </div>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {generated.steps.map((step, i) => (
                    <li key={i} style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-md)', color: 'var(--md-on-surface)', lineHeight: 1.5 }}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <IonButton
                  expand="block"
                  disabled={saving}
                  onClick={handleSave}
                  style={{ '--border-radius': 'var(--md-shape-full)', '--background': 'var(--md-primary)', '--color': 'var(--md-on-primary)' } as React.CSSProperties}
                >
                  {saving ? 'Saving…' : 'Save to My Recipes'}
                </IonButton>
                <IonButton
                  expand="block"
                  fill="outline"
                  disabled={generating}
                  onClick={generate}
                  style={{ '--border-radius': 'var(--md-shape-full)', '--border-color': 'var(--md-outline)', '--color': 'var(--md-on-surface)' } as React.CSSProperties}
                >
                  <IonIcon slot="start" icon={refreshOutline} />
                  {generating ? 'Regenerating…' : 'Regenerate'}
                </IonButton>
              </div>
            </>
          )}
        </div>
      </IonContent>

      <IonToast
        isOpen={!!toastMsg}
        message={toastMsg}
        duration={3000}
        onDidDismiss={() => setToastMsg('')}
        style={{ '--background': 'var(--md-inverse-surface)', '--color': 'var(--md-inverse-on-surface)' } as React.CSSProperties}
      />
    </IonModal>
  );
};

export default AIRecipeModal;
