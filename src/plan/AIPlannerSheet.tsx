import React, { useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonTitle,
  IonToggle,
  IonToolbar,
  IonToast,
  IonSpinner,
} from '@ionic/react';
import { useGeminiKey } from '../hooks/useGeminiKey';
import { useProfile } from '../hooks/useProfile';
import { geminiRequest, geminiErrorMessage } from '../utils/gemini';
import type { WeekPlan, SlotType } from '../hooks/useMealPlan';
import type { Recipe } from '../recipes/recipeData';

const DIETARY_STYLES = ['Balanced', 'High-Protein', 'Vegetarian', 'Low-Carb'] as const;
type DietaryStyle = typeof DIETARY_STYLES[number];

const DAYS_PRESETS = [3, 5, 7] as const;

interface AIPlanSlot {
  date: string;
  slot: SlotType;
  recipe_name: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dates: string[];           // 7 ISO date strings for the current week
  weekPlan: WeekPlan;        // already-assigned slots
  allRecipes: Array<Recipe & { custom?: true }>;
  assignSlot: (date: string, slot: SlotType, recipe: Recipe & { custom?: true }) => Promise<void>;
}

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 18px',
  borderRadius: 'var(--md-shape-full)',
  border: `1.5px solid ${active ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
  background: active ? 'var(--md-primary-container)' : 'transparent',
  color: active ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
  fontSize: 'var(--md-label-lg)',
  fontFamily: 'var(--md-font)',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 150ms',
});

const AIPlannerSheet: React.FC<Props> = ({
  isOpen, onClose, dates, weekPlan, allRecipes, assignSlot,
}) => {
  const { geminiKey } = useGeminiKey();
  const { profile } = useProfile();

  const [dietaryStyle, setDietaryStyle] = useState<DietaryStyle>('Balanced');
  const [daysToFill, setDaysToFill] = useState<number>(7);
  const [customDays, setCustomDays] = useState('');
  const [avoidRepeats, setAvoidRepeats] = useState(true);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [generating, setGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Find empty slots starting from today
  function getEmptySlots(): Array<{ date: string; slot: SlotType }> {
    const slots: SlotType[] = ['breakfast', 'lunch', 'dinner'];
    const empty: Array<{ date: string; slot: SlotType }> = [];
    const targetDays = dates.filter(d => d >= todayStr).slice(0, daysToFill);
    for (const date of targetDays) {
      for (const slot of slots) {
        if (!weekPlan[date]?.[slot]) {
          empty.push({ date, slot });
        }
      }
    }
    return empty;
  }

  // Already-used recipe names this week (for avoidRepeats)
  function assignedRecipeNames(): string[] {
    const names = new Set<string>();
    for (const dayPlan of Object.values(weekPlan)) {
      for (const entry of Object.values(dayPlan ?? {})) {
        if (entry?.recipe_name) names.add(entry.recipe_name.toLowerCase());
      }
    }
    return Array.from(names);
  }

  // Fuzzy-match a generated name to the nearest recipe
  function matchRecipe(name: string): (Recipe & { custom?: true }) | null {
    const lower = name.toLowerCase().trim();
    const exact = allRecipes.find((r) => r.name.toLowerCase() === lower);
    if (exact) return exact;
    const partial = allRecipes.find(
      (r) => r.name.toLowerCase().includes(lower) || lower.includes(r.name.toLowerCase())
    );
    return partial ?? null;
  }

  async function handleGenerate() {
    if (!geminiKey) return;
    setGenerating(true);

    const emptySlots = getEmptySlots();
    if (!emptySlots.length) {
      setToastMsg('No empty slots to fill for the selected days.');
      setGenerating(false);
      return;
    }

    const recipeNames = allRecipes.map((r) => r.name).join(', ');
    const alreadyUsed = avoidRepeats ? assignedRecipeNames() : [];
    const profileHint = [
      profile.goal ? `goal: ${profile.goal}` : '',
      profile.activity ? `activity: ${profile.activity}` : '',
    ].filter(Boolean).join(', ');
    const avoidHint = alreadyUsed.length
      ? `Avoid repeating: ${alreadyUsed.join(', ')}.`
      : '';

    const slotDescriptions = emptySlots.map((s) => `${s.date} ${s.slot}`).join(', ');

    const prompt = [
      `Plan meals for a user with dietary style: ${dietaryStyle}.`,
      profileHint ? `User profile: ${profileHint}.` : '',
      avoidHint,
      `Available recipes: ${recipeNames}.`,
      `Fill ONLY these empty slots: ${slotDescriptions}.`,
      `Return a JSON array of objects with fields: date (ISO string), slot (breakfast|lunch|dinner), recipe_name (exact match from the available recipes list).`,
    ].filter(Boolean).join(' ');

    try {
      const results = await geminiRequest<AIPlanSlot[]>({
        apiKey: geminiKey,
        prompt,
        schema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              date:        { type: 'STRING' },
              slot:        { type: 'STRING' },
              recipe_name: { type: 'STRING' },
            },
            required: ['date', 'slot', 'recipe_name'],
          },
        },
      });

      let filled = 0;
      for (const item of results) {
        const recipe = matchRecipe(item.recipe_name);
        if (!recipe) continue;
        // Never overwrite already-assigned slots
        if (weekPlan[item.date]?.[item.slot as SlotType]) continue;
        try {
          await assignSlot(item.date, item.slot as SlotType, recipe);
          filled++;
        } catch {
          // Skip failures silently
        }
      }

      setToastMsg(filled > 0 ? `\u2713 AI filled ${filled} slot${filled !== 1 ? 's' : ''}!` : 'No matching recipes found. Try with different settings.');
      if (filled > 0) onClose();
    } catch (err) {
      setToastMsg(geminiErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <IonModal
        isOpen={isOpen}
        onDidDismiss={onClose}
        initialBreakpoint={0.7}
        breakpoints={[0, 0.7, 1]}
        style={{ '--border-radius': 'var(--md-shape-xl)' } as React.CSSProperties}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Plan My Week ✨</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>Cancel</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <div style={{ padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {!geminiKey ? (
              /* No key state */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 32, gap: 12, textAlign: 'center' }}>
                <span style={{ fontSize: 48 }}>✨</span>
                <p style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-md)', color: 'var(--md-on-surface)', margin: 0 }}>Set up AI first</p>
                <p style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-md)', color: 'var(--md-on-surface-variant)', margin: 0 }}>
                  Add your Gemini API key in Profile → AI Settings to plan your week automatically.
                </p>
              </div>
            ) : (
              <>
                {/* Dietary style */}
                <div>
                  <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Dietary style
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {DIETARY_STYLES.map((style) => (
                      <button key={style} style={chipStyle(dietaryStyle === style)} onClick={() => setDietaryStyle(style)}>
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Days to fill */}
                <div>
                  <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Days to fill (from today)
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {DAYS_PRESETS.map((d) => (
                      <button key={d} style={chipStyle(daysToFill === d && !customDays)} onClick={() => { setDaysToFill(d); setCustomDays(''); }}>
                        {d} days
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      max="30"
                      placeholder="Custom"
                      value={customDays}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomDays(v);
                        const n = parseInt(v, 10);
                        if (!isNaN(n) && n > 0) setDaysToFill(n);
                      }}
                      style={{
                        width: 80,
                        padding: '7px 12px',
                        borderRadius: 'var(--md-shape-full)',
                        border: `1.5px solid ${customDays ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
                        background: customDays ? 'var(--md-primary-container)' : 'transparent',
                        color: customDays ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                        fontSize: 'var(--md-label-lg)',
                        fontFamily: 'var(--md-font)',
                        fontWeight: 500,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Avoid repeats toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-md)', color: 'var(--md-on-surface)', fontWeight: 500 }}>
                      Avoid repeats this week
                    </div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                      Skip recipes already assigned
                    </div>
                  </div>
                  <IonToggle
                    checked={avoidRepeats}
                    onIonChange={(e) => setAvoidRepeats(e.detail.checked)}
                  />
                </div>

                {/* Generate button */}
                <IonButton
                  expand="block"
                  disabled={generating}
                  onClick={handleGenerate}
                  style={{ '--border-radius': 'var(--md-shape-full)', '--background': 'var(--md-primary)', '--color': 'var(--md-on-primary)', marginTop: 8 } as React.CSSProperties}
                >
                  {generating ? (
                    <><IonSpinner name="crescent" style={{ marginRight: 8 }} />Planning…</>
                  ) : (
                    '✨ Generate Plan'
                  )}
                </IonButton>
              </>
            )}
          </div>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={!!toastMsg}
        message={toastMsg}
        duration={3500}
        onDidDismiss={() => setToastMsg('')}
        style={{ '--background': 'var(--md-inverse-surface)', '--color': 'var(--md-inverse-on-surface)' } as React.CSSProperties}
      />
    </>
  );
};

export default AIPlannerSheet;
