import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonNote,
  IonButtons,
} from '@ionic/react';
import { useRecipes } from '../hooks/useRecipes';
import type { Recipe } from '../recipes/recipeData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recipe: Recipe & { custom?: true }) => void;
}

const RecipePickerModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  const { allRecipes } = useRecipes();
  const [query, setQuery] = useState('');

  const filtered = allRecipes.filter(r =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--md-surface-container-high)' }}>
          <IonTitle style={{ fontSize: 'var(--md-title-md)', fontFamily: 'var(--md-font)' }}>
            Pick a Recipe
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} style={{ color: 'var(--md-on-surface-variant)' }}>
              Cancel
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': 'var(--md-surface)' }}>
        <IonSearchbar
          value={query}
          onIonInput={e => setQuery(e.detail.value ?? '')}
          placeholder="Search recipes…"
          style={{ '--background': 'var(--md-surface-container)', '--border-radius': 'var(--md-shape-full)', margin: '12px 16px 4px' }}
        />
        <IonList style={{ background: 'transparent', padding: '0 12px 80px' }}>
          {filtered.map(recipe => (
            <IonItem
              key={recipe.id}
              button
              detail={false}
              onClick={() => { onSelect(recipe); onClose(); setQuery(''); }}
              style={{
                '--background': 'var(--md-surface-container)',
                '--border-radius': 'var(--md-shape-md)',
                marginBottom: 8,
                '--inner-border-width': 0,
              }}
            >
              <span
                slot="start"
                style={{ fontSize: 32, lineHeight: 1, padding: '8px 4px 8px 0' }}
              >
                {recipe.emoji}
              </span>
              <IonLabel>
                <h3 style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-lg)', color: 'var(--md-on-surface)', margin: 0 }}>
                  {recipe.name}
                </h3>
                <p style={{ margin: '2px 0 4px', color: 'var(--md-on-surface-variant)', fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)' }}>
                  {recipe.prepMin + recipe.cookMin} min total
                  {recipe.tags.length > 0 ? ` · ${recipe.tags.slice(0, 2).join(', ')}` : ''}
                </p>
              </IonLabel>
              {'custom' in recipe && recipe.custom && (
                <IonNote slot="end" style={{ fontSize: 'var(--md-label-sm)', color: 'var(--md-secondary)', fontFamily: 'var(--md-font)' }}>
                  custom
                </IonNote>
              )}
            </IonItem>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--md-on-surface-variant)', fontFamily: 'var(--md-font)' }}>
              <div style={{ fontSize: 40 }}>🔍</div>
              <p style={{ margin: '12px 0 0', fontSize: 'var(--md-body-md)' }}>No recipes found</p>
            </div>
          )}
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default RecipePickerModal;
