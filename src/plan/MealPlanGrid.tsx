import React, { useState, useEffect, useRef } from 'react';
import { SLOTS, type SlotType, type WeekPlan } from '../hooks/useMealPlan';

const DAY_ABBR  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOT_META: Record<SlotType, { label: string; emoji: string }> = {
  breakfast: { label: 'Breakfast', emoji: 'â˜€ï¸' },
  lunch:     { label: 'Lunch',     emoji: 'ðŸŒ¤ï¸' },
  dinner:    { label: 'Dinner',    emoji: 'ðŸŒ™' },
};

interface Props {
  dates: string[];
  weekPlan: WeekPlan;
  onAddSlot: (date: string, slot: SlotType) => void;
  onClearSlot: (date: string, slot: SlotType) => void;
  today: string;
}

const MealPlanGrid: React.FC<Props> = ({ dates, weekPlan, onAddSlot, onClearSlot, today }) => {
  const defaultDate = dates.includes(today) ? today : dates[0];
  const [selected, setSelected] = useState(defaultDate);
  const stripRef = useRef<HTMLDivElement>(null);

  // When week changes, reset selection to today-or-first
  useEffect(() => {
    const next = dates.includes(today) ? today : dates[0];
    setSelected(next);
  }, [dates[0]]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll selected pill into view
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const idx = dates.indexOf(selected);
    const pill = strip.children[idx] as HTMLElement | undefined;
    pill?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [selected]);

  const slotEntries = SLOTS.map(slot => ({
    slot,
    entry: weekPlan[selected]?.[slot],
  }));

  return (
    <div style={{ fontFamily: 'var(--md-font)' }}>

      {/* â”€â”€ Day strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        ref={stripRef}
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          padding: '0 4px 12px',
          scrollbarWidth: 'none',
        }}
      >
        {dates.map((date, i) => {
          const isSelected = date === selected;
          const isToday    = date === today;
          const dayNum     = new Date(date + 'T00:00:00').getDate();
          const hasMeals   = SLOTS.some(s => !!weekPlan[date]?.[s]);

          return (
            <button
              key={date}
              onClick={() => setSelected(date)}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 64,
                gap: 2,
                borderRadius: 'var(--md-shape-md)',
                border: isToday && !isSelected
                  ? '2px solid var(--md-primary)'
                  : '2px solid transparent',
                background: isSelected
                  ? 'var(--md-primary)'
                  : 'var(--md-surface-container)',
                cursor: 'pointer',
                padding: 0,
                transition: 'background 150ms',
              }}
              aria-label={`${DAY_ABBR[i]} ${dayNum}`}
              aria-pressed={isSelected}
            >
              <span
                style={{
                  fontSize: 'var(--md-label-sm)',
                  fontWeight: 600,
                  color: isSelected ? 'var(--md-on-primary)' : 'var(--md-on-surface-variant)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {DAY_ABBR[i]}
              </span>
              <span
                style={{
                  fontSize: 'var(--md-title-sm)',
                  fontWeight: 700,
                  color: isSelected ? 'var(--md-on-primary)' : 'var(--md-on-surface)',
                  lineHeight: 1,
                }}
              >
                {dayNum}
              </span>
              {/* Filled-meal dot */}
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  marginTop: 2,
                  background: hasMeals
                    ? (isSelected ? 'var(--md-on-primary)' : 'var(--md-primary)')
                    : 'transparent',
                  transition: 'background 150ms',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* â”€â”€ Slot cards for selected day â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slotEntries.map(({ slot, entry }) => {
          const meta = SLOT_META[slot];
          return entry ? (
            /* Filled slot */
            <div
              key={slot}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'var(--md-secondary-container)',
                borderRadius: 'var(--md-shape-lg)',
                padding: '14px 16px',
              }}
            >
              {/* Slot indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, width: 44 }}>
                <span style={{ fontSize: 22 }}>{meta.emoji}</span>
                <span style={{ fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {meta.label.slice(0, 3)}
                </span>
              </div>
              {/* Recipe */}
              <span style={{ fontSize: 24, flexShrink: 0 }}>{entry.recipe_emoji}</span>
              <span
                style={{
                  flex: 1,
                  fontSize: 'var(--md-body-lg)',
                  fontWeight: 600,
                  color: 'var(--md-on-secondary-container)',
                  lineHeight: 1.3,
                }}
              >
                {entry.recipe_name}
              </span>
              <button
                onClick={() => onClearSlot(selected, slot)}
                aria-label="Remove"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 20,
                  color: 'var(--md-on-surface-variant)',
                  padding: 4,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                Ã—
              </button>
            </div>
          ) : (
            /* Empty slot */
            <button
              key={slot}
              onClick={() => onAddSlot(selected, slot)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'var(--md-surface-container)',
                border: '1.5px dashed var(--md-outline-variant)',
                borderRadius: 'var(--md-shape-lg)',
                padding: '14px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0, width: 44 }}>
                <span style={{ fontSize: 22 }}>{meta.emoji}</span>
                <span style={{ fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {meta.label.slice(0, 3)}
                </span>
              </div>
              <span
                style={{
                  flex: 1,
                  fontSize: 'var(--md-body-md)',
                  color: 'var(--md-on-surface-variant)',
                }}
              >
                {meta.label} â€” tap to add
              </span>
              <span
                style={{
                  fontSize: 24,
                  color: 'var(--md-on-surface-variant)',
                  opacity: 0.5,
                  flexShrink: 0,
                }}
              >
                +
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MealPlanGrid;
