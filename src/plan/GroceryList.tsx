import React, { useState } from 'react';
import { IonListHeader } from '@ionic/react';

interface Props {
  items: string[];
}

const GroceryList: React.FC<Props> = ({ items }) => {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (item: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '32px 24px',
          color: 'var(--md-on-surface-variant)',
          fontFamily: 'var(--md-font)',
        }}
      >
        <div style={{ fontSize: 36 }}>🛒</div>
        <p style={{ margin: '10px 0 0', fontSize: 'var(--md-body-md)' }}>
          Assign recipes to the plan to build your grocery list
        </p>
      </div>
    );
  }

  const unchecked = items.filter(i => !checked.has(i));
  const checkedItems = items.filter(i => checked.has(i));

  return (
    <div style={{ fontFamily: 'var(--md-font)' }}>
      <IonListHeader style={{ paddingLeft: 0, marginBottom: 4 }}>
        <span
          style={{
            fontSize: 'var(--md-label-lg)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--md-primary)',
          }}
        >
          Grocery List · {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </IonListHeader>

      {[...unchecked, ...checkedItems].map(item => {
        const done = checked.has(item);
        return (
          <label
            key={item}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 4px',
              cursor: 'pointer',
              borderBottom: `1px solid var(--md-outline-variant)`,
            }}
          >
            <input
              type="checkbox"
              checked={done}
              onChange={() => toggle(item)}
              style={{
                accentColor: 'var(--md-primary)',
                width: 18,
                height: 18,
                flexShrink: 0,
                cursor: 'pointer',
              }}
            />
            <span
              style={{
                fontSize: 'var(--md-body-md)',
                color: done ? 'var(--md-on-surface-variant)' : 'var(--md-on-surface)',
                textDecoration: done ? 'line-through' : 'none',
                transition: 'color 150ms',
              }}
            >
              {item}
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default GroceryList;
