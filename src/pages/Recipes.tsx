import React, { useMemo, useState } from 'react';
import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { add, closeOutline, createOutline, sparkles, timeOutline } from 'ionicons/icons';
import type { Recipe } from '../recipes/recipeData';
import { useRecipes } from '../hooks/useRecipes';
import { useFoodLog } from '../hooks/useFoodLog';
import type { MealType } from '../hooks/useFoodLog';
import { today } from '../track/trackUtils';
import RecipeDetailModal from '../recipes/RecipeDetailModal';
import RecipeFormModal from '../recipes/RecipeFormModal';
import AIRecipeModal from '../recipes/AIRecipeModal';

type AnyRecipe = Recipe & { custom?: true };

const Recipes: React.FC = () => {
  const { allRecipes, addRecipe, deleteRecipe, deleteSeedRecipe } = useRecipes();
  const { addEntry } = useFoodLog();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AnyRecipe | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [dialOpen, setDialOpen] = useState(false);
  const [presentAlert] = useIonAlert();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRecipes;
    return allRecipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.includes(q))
    );
  }, [query, allRecipes]);

  function handleDelete() {
    if (!selected) return;
    const name = selected.name;
    const id = selected.id;
    const isCustom = selected.custom;
    presentAlert({
      header: 'Delete recipe?',
      message: name,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            if (isCustom) {
              await deleteRecipe(id);
            } else {
              await deleteSeedRecipe(id);
            }
            setSelected(null);
          },
        },
      ],
    });
  }

  async function handleLogMeal(meal: MealType, kcal?: number) {
    if (!selected) return;
    await addEntry(
      today(),
      meal,
      undefined,
      `${selected.emoji}\u00A0${selected.name}`,
      kcal
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Recipes</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Recipes</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonSearchbar
          value={query}
          onIonInput={(e) => setQuery(e.detail.value ?? '')}
          placeholder="Search recipes or tags…"
          style={{ padding: '8px 8px 0' }}
        />

        {filtered.length === 0 ? (
          <div style={S.empty}>
            <span style={S.emptyEmoji}>🔍</span>
            <p style={S.emptyLabel}>No recipes found</p>
            <p style={S.emptyHint}>Try a different name or tag</p>
          </div>
        ) : (
          <div style={S.grid}>
            {filtered.map((recipe) => (
              <IonCard
                key={recipe.id}
                button
                onClick={() => setSelected(recipe)}
                style={S.card}
              >
                <IonCardContent style={S.cardContent}>
                  <div style={S.cardEmoji}>{recipe.emoji}</div>
                  <p style={S.cardName}>{recipe.name}</p>
                  <p style={S.cardMeta}>
                    <IonIcon icon={timeOutline} style={{ marginRight: 3, verticalAlign: 'middle', fontSize: 13 }} />
                    {recipe.prepMin + recipe.cookMin > 0
                      ? `${recipe.prepMin + recipe.cookMin} min`
                      : 'No cook'}
                  </p>
                  {recipe.custom && (
                    <IonBadge style={S.customBadge}>custom</IonBadge>
                  )}
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>

      <RecipeDetailModal
        recipe={selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
        onLogMeal={handleLogMeal}
      />

      <RecipeFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={addRecipe}
      />

      <AIRecipeModal
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        onSave={addRecipe}
      />

      {/* Speed-dial scrim */}
      {dialOpen && (
        <div
          onClick={() => setDialOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.32)', zIndex: 999 }}
        />
      )}

      {/* Speed-dial container */}
      <div style={{ position: 'fixed', bottom: 96, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
        {/* Manual arm */}
        {dialOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface)', borderRadius: 'var(--md-shape-full)', padding: '4px 12px', fontSize: 'var(--md-label-lg)', fontFamily: 'var(--md-font)', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.18)', whiteSpace: 'nowrap' }}>Manual</span>
            <button
              onClick={() => { setDialOpen(false); setShowForm(true); }}
              style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
            >
              <IonIcon icon={createOutline} style={{ fontSize: 22 }} />
            </button>
          </div>
        )}
        {/* AI Generate arm */}
        {dialOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface)', borderRadius: 'var(--md-shape-full)', padding: '4px 12px', fontSize: 'var(--md-label-lg)', fontFamily: 'var(--md-font)', fontWeight: 600, boxShadow: '0 2px 8px rgba(0,0,0,0.18)', whiteSpace: 'nowrap' }}>AI Generate ✨</span>
            <button
              onClick={() => { setDialOpen(false); setShowAI(true); }}
              style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
            >
              <IonIcon icon={sparkles} style={{ fontSize: 22 }} />
            </button>
          </div>
        )}
        {/* Main FAB */}
        <IonFab>
          <IonFabButton onClick={() => setDialOpen((o) => !o)} style={S.fab}>
            <IonIcon icon={dialOpen ? closeOutline : add} />
          </IonFabButton>
        </IonFab>
      </div>
    </IonPage>
  );
};

/* ── Styles ──────────────────────────────────────────────────────────── */
const S = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
    gap: 12,
    padding: '12px 16px 32px',
  },
  card: {
    margin: 0,
    borderRadius: 'var(--md-shape-xl)',
    border: '1px solid var(--md-outline-variant)',
    boxShadow: 'none',
    cursor: 'pointer',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 6,
    padding: '16px 12px',
    textAlign: 'center' as const,
  },
  cardEmoji: {
    fontSize: 40,
    lineHeight: 1,
  },
  cardName: {
    margin: 0,
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-body-md)',
    fontWeight: 600,
    color: 'var(--md-on-surface)',
    lineHeight: 1.3,
  },
  cardMeta: {
    margin: 0,
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-label-md)',
    color: 'var(--md-on-surface-variant)',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyLabel: {
    margin: 0,
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-title-md)',
    color: 'var(--md-on-surface)',
  },
  emptyHint: {
    margin: 0,
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-body-md)',
    color: 'var(--md-on-surface-variant)',
  },
  customBadge: {
    background: 'var(--md-tertiary-container)',
    color: 'var(--md-on-tertiary-container)',
    borderRadius: 'var(--md-shape-full)',
    fontSize: 'var(--md-label-sm)',
    fontFamily: 'var(--md-font)',
    textTransform: 'lowercase' as const,
    marginTop: 2,
  },
  fab: {
    '--background': 'var(--md-primary-container)',
    '--color': 'var(--md-on-primary-container)',
  },
};

export default Recipes;
