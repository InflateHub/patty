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
  SLOTS,
  type SlotType,
} from '../hooks/useMealPlan';
import MealPlanGrid from '../plan/MealPlanGrid';
import GroceryList from '../plan/GroceryList';
import RecipePickerModal from '../plan/RecipePickerModal';
import type { Recipe } from '../recipes/recipeData';

const SLOT_LABEL: Record<SlotType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

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
      {/* ── Header ──────────────────────────────────────────────────────────── */}
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

        {/* ── Week navigation ─────────────────────────────────────────────── */}
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

        {/* ── Today's Meals (only when viewing current week) ──────────────── */}
        {weekContainsToday && (
          <IonCard
            style={{
              margin: '12px 16px 0',
              borderRadius: 'var(--md-shape-xl)',
              '--background': 'var(--md-surface-container-high)',
              boxShadow: 'none',
              border: `1px solid var(--md-outline-variant)`,
            }}
          >
            <IonCardContent style={{ padding: '16px 20px 20px' }}>
              <IonListHeader style={{ padding: 0, marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: 'var(--md-label-lg)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--md-primary)',
                  }}
                >
                  Today's Meals
                </span>
              </IonListHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SLOTS.map(slot => {
                  const entry = weekPlan[today]?.[slot];
                  return (
                    <div
                      key={slot}
                      style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <span
                        style={{
                          width: 80,
                          flexShrink: 0,
                          fontSize: 'var(--md-label-md)',
                          color: 'var(--md-on-surface-variant)',
                          fontFamily: 'var(--md-font)',
                          fontWeight: 600,
                        }}
                      >
                        {SLOT_LABEL[slot]}
                      </span>
                      {entry ? (
                        <div
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'var(--md-secondary-container)',
                            borderRadius: 'var(--md-shape-md)',
                            padding: '8px 12px',
                            fontFamily: 'var(--md-font)',
                          }}
                        >
                          <span style={{ fontSize: 22 }}>{entry.recipe_emoji}</span>
                          <span
                            style={{
                              flex: 1,
                              fontSize: 'var(--md-body-md)',
                              color: 'var(--md-on-secondary-container)',
                              fontWeight: 500,
                            }}
                          >
                            {entry.recipe_name}
                          </span>
                          <button
                            onClick={() => clearSlot(today, slot)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 18,
                              color: 'var(--md-on-surface-variant)',
                              padding: 0,
                              lineHeight: 1,
                            }}
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openPicker(today, slot)}
                          style={{
                            flex: 1,
                            background: 'var(--md-surface-container)',
                            border: `1.5px dashed var(--md-outline-variant)`,
                            borderRadius: 'var(--md-shape-md)',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            color: 'var(--md-on-surface-variant)',
                            fontSize: 'var(--md-body-sm)',
                            fontFamily: 'var(--md-font)',
                            textAlign: 'left',
                          }}
                        >
                          + Add recipe
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* ── Weekly grid ─────────────────────────────────────────────────── */}
        <IonCard
          style={{
            margin: '12px 16px 0',
            borderRadius: 'var(--md-shape-xl)',
            '--background': 'var(--md-surface-container-high)',
            boxShadow: 'none',
            border: `1px solid var(--md-outline-variant)`,
          }}
        >
          <IonCardContent style={{ padding: '16px 12px 20px' }}>
            <IonListHeader style={{ padding: '0 8px', marginBottom: 12 }}>
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

        {/* ── Grocery list ─────────────────────────────────────────────────── */}
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

        {/* ── Recipe picker modal ──────────────────────────────────────────── */}
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
