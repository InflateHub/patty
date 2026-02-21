import React from 'react';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { closeOutline, timeOutline, restaurantOutline, trash } from 'ionicons/icons';
import type { Recipe } from './recipeData';

interface Props {
  recipe: Recipe | null;
  onClose: () => void;
  onDelete?: () => void;
}

const RecipeDetailModal: React.FC<Props> = ({ recipe, onClose, onDelete }) => {
  return (
    <IonModal isOpen={recipe !== null} onDidDismiss={onClose}>
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
