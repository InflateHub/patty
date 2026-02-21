import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon,
  IonButton,
  IonListHeader,
} from '@ionic/react';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import {
  useMealPlan,
  weekStart,
  weekDates,
  formatWeekRange,
  type SlotType,
} from '../hooks/useMealPlan';
import MealPlanGrid from '../plan/MealPlanGrid';
import GroceryList from '../plan/GroceryList';
import RecipePickerModal from '../plan/RecipePickerModal';
import type { Recipe } from '../recipes/recipeData';

const todayStr = (): string => new Date().toISOString().slice(0, 10);

const Plan: React.FC = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const monday = weekStart(weekOffset);
  const dates = weekDates(monday);
  const { weekPlan, assignSlot, clearSlot, groceryList } = useMealPlan(monday);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<string>('');
  const [pendingSlot, setPendingSlot] = useState<SlotType>('breakfast');

  const today = todayStr();
  const weekContainsToday = dates.includes(today);

  const openPicker = (date: string, slot: SlotType) => {
    setPendingDate(date);
    setPendingSlot(slot);
    setPickerOpen(true);
  };

  const handleSelect = async (recipe: Recipe & { custom?: true }) => {
    await assignSlot(pendingDate, pendingSlot, recipe);
  };

  const items = groceryList();

  return (
    <IonPage>
      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--md-surface-container)' }}>
          <IonTitle style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-lg)' }}>
            Cook Plan
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{ '--background': 'var(--md-surface)', '--padding-bottom': '32px' }}
      >
        {/* Condensed large title */}
        <IonHeader collapse="condense">
          <IonToolbar style={{ '--background': 'var(--md-surface)' }}>
            <IonTitle size="large" style={{ fontFamily: 'var(--md-font)' }}>
              Cook Plan
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* â”€â”€ Week navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px 0',
            fontFamily: 'var(--md-font)',
          }}
        >
          <IonButton
            fill="clear"
            onClick={() => setWeekOffset(o => o - 1)}
            style={{ '--color': 'var(--md-on-surface-variant)', margin: 0 }}
          >
            <IonIcon icon={chevronBackOutline} slot="icon-only" />
          </IonButton>
          <span
            style={{
              fontSize: 'var(--md-title-sm)',
              fontWeight: 600,
              color: weekContainsToday ? 'var(--md-primary)' : 'var(--md-on-surface)',
            }}
          >
            {formatWeekRange(monday)}
            {weekContainsToday && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 'var(--md-label-sm)',
                  background: 'var(--md-primary-container)',
                  color: 'var(--md-on-primary-container)',
                  borderRadius: 'var(--md-shape-full)',
                  padding: '2px 8px',
                  fontWeight: 600,
                  verticalAlign: 'middle',
                }}
              >
                This week
              </span>
            )}
          </span>
          <IonButton
            fill="clear"
            onClick={() => setWeekOffset(o => o + 1)}
            style={{ '--color': 'var(--md-on-surface-variant)', margin: 0 }}
          >
            <IonIcon icon={chevronForwardOutline} slot="icon-only" />
          </IonButton>
        </div>

        {/* â”€â”€ Day picker + slot cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <IonCard
          style={{
            margin: '12px 16px 0',
            borderRadius: 'var(--md-shape-xl)',
            '--background': 'var(--md-surface-container-high)',
            boxShadow: 'none',
            border: `1px solid var(--md-outline-variant)`,
          }}
        >
          <IonCardContent style={{ padding: '16px 16px 20px' }}>
            <IonListHeader style={{ padding: '0 0 4px', marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 'var(--md-label-lg)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--md-primary)',
                }}
              >
                Week Plan
              </span>
            </IonListHeader>
            <MealPlanGrid
              dates={dates}
              weekPlan={weekPlan}
              onAddSlot={openPicker}
              onClearSlot={clearSlot}
              today={today}
            />
          </IonCardContent>
        </IonCard>

        {/* â”€â”€ Grocery list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <IonCard
          style={{
            margin: '12px 16px 24px',
            borderRadius: 'var(--md-shape-xl)',
            '--background': 'var(--md-surface-container-high)',
            boxShadow: 'none',
            border: `1px solid var(--md-outline-variant)`,
          }}
        >
          <IonCardContent style={{ padding: '16px 20px 20px' }}>
            <GroceryList items={items} />
          </IonCardContent>
        </IonCard>

        {/* â”€â”€ Recipe picker modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <RecipePickerModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handleSelect}
        />
      </IonContent>
    </IonPage>
  );
};

export default Plan;
