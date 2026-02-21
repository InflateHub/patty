import React, { useMemo, useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { timeOutline } from 'ionicons/icons';
import { RECIPES } from '../recipes/recipeData';
import type { Recipe } from '../recipes/recipeData';
import RecipeDetailModal from '../recipes/RecipeDetailModal';

const Recipes: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Recipe | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RECIPES;
    return RECIPES.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.includes(q))
    );
  }, [query]);

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
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>

      <RecipeDetailModal recipe={selected} onClose={() => setSelected(null)} />
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
};

export default Recipes;
