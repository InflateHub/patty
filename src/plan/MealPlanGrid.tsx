import React from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { SLOTS, type SlotType, type WeekPlan, type MealSlotEntry } from '../hooks/useMealPlan';

// ── Slot display labels ───────────────────────────────────────────────────────
const SLOT_LABEL: Record<SlotType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

interface Props {
  dates: string[];
  weekPlan: WeekPlan;
  onAddSlot: (date: string, slot: SlotType) => void;
  onClearSlot: (date: string, slot: SlotType) => void;
  /** Optional: highlight this date as "today" */
  today: string;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SlotCell: React.FC<{
  entry: MealSlotEntry | undefined;
  onAdd: () => void;
  onClear: () => void;
}> = ({ entry, onAdd, onClear }) => {
  if (entry) {
    return (
      <div
        style={{
          background: 'var(--md-primary-container)',
          borderRadius: 'var(--md-shape-sm)',
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          minHeight: 44,
          cursor: 'default',
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>{entry.recipe_emoji}</span>
        <span
          style={{
            flex: 1,
            fontSize: 'var(--md-label-sm)',
            fontFamily: 'var(--md-font)',
            color: 'var(--md-on-primary-container)',
            fontWeight: 500,
            lineHeight: 1.3,
            wordBreak: 'break-word',
          }}
        >
          {entry.recipe_name}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onClear(); }}
          aria-label="Remove"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            color: 'var(--md-on-primary-container)',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <IonIcon icon={closeOutline} style={{ fontSize: 16 }} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onAdd}
      style={{
        background: 'var(--md-surface-container)',
        border: `1.5px dashed var(--md-outline-variant)`,
        borderRadius: 'var(--md-shape-sm)',
        width: '100%',
        minHeight: 44,
        cursor: 'pointer',
        color: 'var(--md-on-surface-variant)',
        fontSize: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="Add recipe"
    >
      +
    </button>
  );
};

const MealPlanGrid: React.FC<Props> = ({ dates, weekPlan, onAddSlot, onClearSlot, today }) => {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '4px 4px',
          tableLayout: 'fixed',
          fontFamily: 'var(--md-font)',
        }}
      >
        {/* Header row: day labels */}
        <thead>
          <tr>
            {/* Slot label column */}
            <th style={{ width: 72 }} />
            {dates.map((date, i) => {
              const isToday = date === today;
              return (
                <th
                  key={date}
                  style={{
                    textAlign: 'center',
                    paddingBottom: 6,
                    fontSize: 'var(--md-label-md)',
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
                  }}
                >
                  {DAY_LABELS[i]}
                  <br />
                  <span style={{ fontSize: 'var(--md-label-sm)', fontWeight: 400 }}>
                    {new Date(date + 'T00:00:00').getDate()}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {SLOTS.map(slot => (
            <tr key={slot}>
              {/* Slot label */}
              <td
                style={{
                  fontSize: 'var(--md-label-sm)',
                  color: 'var(--md-on-surface-variant)',
                  fontWeight: 600,
                  verticalAlign: 'top',
                  paddingTop: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {SLOT_LABEL[slot].slice(0, 5)}
              </td>
              {dates.map(date => (
                <td key={date} style={{ verticalAlign: 'top' }}>
                  <SlotCell
                    entry={weekPlan[date]?.[slot]}
                    onAdd={() => onAddSlot(date, slot)}
                    onClear={() => onClearSlot(date, slot)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MealPlanGrid;
