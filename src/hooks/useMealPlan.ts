import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';
import type { Recipe } from '../recipes/recipeData';

// ── Types ────────────────────────────────────────────────────────────────────

export type SlotType = 'breakfast' | 'lunch' | 'dinner';
export const SLOTS: SlotType[] = ['breakfast', 'lunch', 'dinner'];

export interface MealSlotEntry {
  id: string;
  date: string;
  slot: SlotType;
  recipe_id: string;
  recipe_name: string;
  recipe_emoji: string;
  ingredients: string[];
}

/** { "2026-02-23": { breakfast: MealSlotEntry, lunch: undefined, dinner: MealSlotEntry } } */
export type WeekPlan = Record<string, Partial<Record<SlotType, MealSlotEntry>>>;

// ── Week helpers ─────────────────────────────────────────────────────────────

/** Returns the Monday of the week that contains `date` as a YYYY-MM-DD string. */
export function getMondayOf(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Returns the Monday of the current week offset by `offsetWeeks`. */
export function weekStart(offsetWeeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetWeeks * 7);
  return getMondayOf(d);
}

/** Returns the 7 dates (Mon–Sun) for a week given the Monday ISO string. */
export function weekDates(monday: string): string[] {
  const base = new Date(monday + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

/** Format a week range, e.g. "Feb 16 – Feb 22". */
export function formatWeekRange(monday: string): string {
  const start = new Date(monday + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

function generateId(): string {
  return `mp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function rowToEntry(r: Record<string, unknown>): MealSlotEntry {
  return {
    id: r.id as string,
    date: r.date as string,
    slot: r.slot as SlotType,
    recipe_id: r.recipe_id as string,
    recipe_name: r.recipe_name as string,
    recipe_emoji: r.recipe_emoji as string,
    ingredients: JSON.parse((r.ingredients as string) || '[]') as string[],
  };
}

export function useMealPlan(monday: string) {
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({});
  const [loading, setLoading] = useState(true);

  const dates = weekDates(monday);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const result = await db.query(
        `SELECT * FROM meal_plan WHERE date >= ? AND date <= ? ORDER BY date, slot;`,
        [dates[0], dates[6]]
      );
      const plan: WeekPlan = {};
      for (const date of dates) plan[date] = {};
      for (const row of (result.values ?? []) as Record<string, unknown>[]) {
        const entry = rowToEntry(row);
        if (!plan[entry.date]) plan[entry.date] = {};
        plan[entry.date][entry.slot] = entry;
      }
      setWeekPlan(plan);
    } catch (err) {
      console.error('Failed to load meal plan:', err);
    } finally {
      setLoading(false);
    }
  }, [monday]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const assignSlot = useCallback(
    async (date: string, slot: SlotType, recipe: Pick<Recipe, 'id' | 'name' | 'emoji' | 'ingredients'>) => {
      const id = generateId();
      const created_at = new Date().toISOString();
      try {
        const db = getDb();
        // REPLACE handles the UNIQUE(date, slot) constraint
        await db.run(
          `INSERT OR REPLACE INTO meal_plan
             (id, date, slot, recipe_id, recipe_name, recipe_emoji, ingredients, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [id, date, slot, recipe.id, recipe.name, recipe.emoji, JSON.stringify(recipe.ingredients), created_at]
        );
        await load();
      } catch (err) {
        console.error('Failed to assign slot:', err);
      }
    },
    [load]
  );

  const clearSlot = useCallback(
    async (date: string, slot: SlotType) => {
      try {
        const db = getDb();
        await db.run(`DELETE FROM meal_plan WHERE date = ? AND slot = ?;`, [date, slot]);
        await load();
      } catch (err) {
        console.error('Failed to clear slot:', err);
      }
    },
    [load]
  );

  /** Flat list of all ingredients from assigned recipes this week (deduplicated). */
  const groceryList = (): string[] => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const date of dates) {
      for (const slot of SLOTS) {
        const entry = weekPlan[date]?.[slot];
        if (entry) {
          for (const ing of entry.ingredients) {
            const key = ing.toLowerCase().trim();
            if (!seen.has(key)) {
              seen.add(key);
              list.push(ing);
            }
          }
        }
      }
    }
    return list;
  };

  return { weekPlan, loading, assignSlot, clearSlot, groceryList };
}
