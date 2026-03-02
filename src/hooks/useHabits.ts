import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';

// ── Types ─────────────────────────────────────────────────────────────────────

export type HabitType = 'good' | 'bad';

export interface HabitDefinition {
  id: string;
  name: string;
  emoji: string;
  colour: string;
  type: HabitType;
  is_default: boolean;
  created_at: string;
}

export interface HabitStats {
  /** Current active streak (consecutive days). For good: completion days. For bad: clean days. */
  currentStreak: number;
  /** Best streak ever recorded. */
  bestStreak: number;
  /** Total completions (good) or total clean days tracked (bad, approximate). */
  totalCount: number;
  /** Whether this habit has been acted on today. Good = completed. Bad = relapsed. */
  todayActed: boolean;
}

export interface HabitWithStats extends HabitDefinition {
  stats: HabitStats;
}

// ── Milestone / XP helpers ────────────────────────────────────────────────────

/**
 * Returns the next milestone streak value after `streak`.
 * Infinite formula: never runs out.
 *
 * Era            | Rule                      | Examples
 * ≤ 30 days      | Fixed: 3, 7, 14, 21, 30   | instant early rewards
 * 31–364 days    | Every 30 days             | 60, 90, 120 … 360
 * 365–999 days   | Every 100 days            | 365, 465, 565 …
 * 1000+ days     | Every 365 days            | 1000, 1365, 1730 …
 */
export function getNextMilestone(streak: number): number {
  const earlyFixed = [3, 7, 14, 21, 30];
  for (const m of earlyFixed) {
    if (streak < m) return m;
  }
  if (streak < 365) {
    const next = Math.ceil((streak + 1) / 30) * 30;
    return next;
  }
  if (streak < 1000) {
    const next = Math.ceil((streak + 1) / 100) * 100;
    return Math.max(next, 365);
  }
  const next = Math.ceil((streak + 1) / 365) * 365;
  return Math.max(next, 1000);
}

/** Returns true if `streak` is exactly a milestone value. */
export function isMilestone(streak: number): boolean {
  return getNextMilestone(streak - 1) === streak;
}

/**
 * XP earned for completing a good habit or a clean day on a bad habit.
 * Grows by +1 XP per 7 days of streak to stay motivating indefinitely.
 */
export function xpForStreak(streak: number): number {
  return 10 + Math.floor(streak / 7);
}

/** Extra XP bonus on milestone days. */
export const MILESTONE_BONUS_XP = 50;

/** XP penalty for a bad-habit relapse (minimum 0 enforced by consumer). */
export const RELAPSE_PENALTY_XP = 15;

/** XP penalty for missing a good habit (minimum 0 enforced by consumer). */
export const MISS_PENALTY_XP = 5;

/**
 * Level computed from total XP — logarithmic so early levels come fast,
 * later ones slow down naturally.
 * Level = floor(log₂(totalXP / 50) + 1), minimum 1.
 */
export function computeLevel(totalXP: number): number {
  if (totalXP <= 0) return 1;
  return Math.max(1, Math.floor(Math.log2(totalXP / 50) + 1));
}

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Beginner',
  2: 'Consistent',
  3: 'Dedicated',
  4: 'Relentless',
  5: 'Legendary',
};

export function levelName(level: number): string {
  if (level <= 1) return 'Beginner';
  if (level <= 2) return 'Consistent';
  if (level <= 3) return 'Dedicated';
  if (level <= 4) return 'Relentless';
  if (level <= 5) return 'Legendary';
  return 'Unstoppable';
}

/**
 * Badge tier based on the milestone streak value.
 */
export function badgeTier(streak: number): { label: string; emoji: string; colour: string } {
  if (streak <= 30) return { label: 'Starter',    emoji: '⭐', colour: 'var(--md-tertiary)' };
  if (streak < 365) return { label: 'Consistent', emoji: '🔥', colour: 'var(--md-primary)' };
  if (streak < 1000) return { label: 'Dedicated', emoji: '💎', colour: '#B8860B' };
  return               { label: 'Legend',     emoji: '🏆', colour: '#7B2FBE' };
}

// ── Default seeds ─────────────────────────────────────────────────────────────

const DEFAULT_HABITS: Omit<HabitDefinition, 'created_at'>[] = [
  { id: 'default-weight',  name: 'Log Weight',   emoji: '⚖️',  colour: '#5C7A6E', type: 'good', is_default: true },
  { id: 'default-sleep',   name: 'Log Sleep',    emoji: '😴',  colour: '#5C7A6E', type: 'good', is_default: true },
  { id: 'default-water',   name: 'Log Water',    emoji: '💧',  colour: '#5C7A6E', type: 'good', is_default: true },
  { id: 'default-meal',    name: 'Log a Meal',   emoji: '🍽️', colour: '#5C7A6E', type: 'good', is_default: true },
  { id: 'default-workout', name: 'Log a Workout',emoji: '💪',  colour: '#5C7A6E', type: 'good', is_default: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Computes the current streak and best streak from a sorted list of ISO date strings.
 * `dates` must be sorted ascending (oldest first).
 * Streak = consecutive days ending at `today`.
 */
function computeStreaks(dates: string[], today: string): { current: number; best: number } {
  if (dates.length === 0) return { current: 0, best: 0 };

  const dateSet = new Set(dates);

  // Current streak: walk backwards from today
  let current = 0;
  const d = new Date(today);
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (dateSet.has(key)) {
      current++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  // Best streak: walk the full sorted list
  let best = 0;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
    if (diff === 1) {
      run++;
    } else {
      best = Math.max(best, run);
      run = 1;
    }
  }
  best = Math.max(best, run, current);

  return { current, best };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useHabits() {
  const [habits, setHabits] = useState<HabitWithStats[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const today = todayStr();

      // 1. Ensure default habits are seeded
      for (const h of DEFAULT_HABITS) {
        const exists = await db.query(
          'SELECT id FROM habit_definitions WHERE id = ?;',
          [h.id]
        );
        if (!exists.values || exists.values.length === 0) {
          await db.run(
            `INSERT INTO habit_definitions (id, name, emoji, colour, type, is_default, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [h.id, h.name, h.emoji, h.colour, h.type, h.is_default ? 1 : 0, new Date().toISOString()]
          );
        }
      }

      // 2. Load all habit definitions
      const defResult = await db.query(
        'SELECT * FROM habit_definitions ORDER BY is_default DESC, created_at ASC;'
      );
      const defs: HabitDefinition[] = (defResult.values ?? []).map((r: Record<string, unknown>) => ({
        id:         r.id as string,
        name:       r.name as string,
        emoji:      r.emoji as string,
        colour:     r.colour as string,
        type:       r.type as HabitType,
        is_default: (r.is_default as number) === 1,
        created_at: r.created_at as string,
      }));

      // 3. For each habit, compute stats
      let xpAccumulator = 0;
      const withStats: HabitWithStats[] = await Promise.all(
        defs.map(async (h) => {
          if (h.type === 'good') {
            // completions = positive events
            const compResult = await db.query(
              'SELECT date FROM habit_completions WHERE habit_id = ? ORDER BY date ASC;',
              [h.id]
            );
            const dates: string[] = (compResult.values ?? []).map((r: Record<string, unknown>) => r.date as string);
            const { current, best } = computeStreaks(dates, today);
            const todayActed = dates.includes(today);

            // XP: sum of xpForStreak at each day's cumulative streak
            // Approximate using current streak for performance
            const approxXP = dates.length > 0 ? dates.length * 10 + Math.floor(current * (current - 1) / 2 / 7) : 0;
            xpAccumulator += approxXP;

            return {
              ...h,
              stats: {
                currentStreak: current,
                bestStreak: best,
                totalCount: dates.length,
                todayActed,
              },
            };
          } else {
            // bad habit — track relapses; streak = clean days since last relapse (or creation)
            const relResult = await db.query(
              'SELECT date FROM habit_relapses WHERE habit_id = ? ORDER BY date DESC LIMIT 1;',
              [h.id]
            );
            const lastRelapse: string | null =
              relResult.values && relResult.values.length > 0
                ? (relResult.values[0].date as string)
                : null;

            const todayActed = lastRelapse === today;

            // Current streak = days from (lastRelapse+1 or created_at) to today
            const startDate = lastRelapse
              ? (() => {
                  const d = new Date(lastRelapse);
                  d.setDate(d.getDate() + 1);
                  return d.toISOString().slice(0, 10);
                })()
              : h.created_at.slice(0, 10);

            const msPerDay = 86_400_000;
            const start = new Date(startDate).getTime();
            const end   = new Date(today).getTime();
            const current = Math.max(0, Math.round((end - start) / msPerDay) + (todayActed ? 0 : 1));

            // Best streak: compute from all relapses
            const allRelResult = await db.query(
              'SELECT date FROM habit_relapses WHERE habit_id = ? ORDER BY date ASC;',
              [h.id]
            );
            const relapseDates: string[] = (allRelResult.values ?? []).map((r: Record<string, unknown>) => r.date as string);

            let best = current;
            const createdDate = h.created_at.slice(0, 10);
            const allBoundaries = [createdDate, ...relapseDates, today];
            for (let i = 0; i < allBoundaries.length - 1; i++) {
              const from = new Date(allBoundaries[i]).getTime();
              const to   = new Date(allBoundaries[i + 1]).getTime();
              const gap  = Math.round((to - from) / msPerDay);
              if (gap > best) best = gap;
            }

            const totalRelapses = relapseDates.length;
            const approxXP = current * 10;
            xpAccumulator += approxXP;

            return {
              ...h,
              stats: {
                currentStreak: todayActed ? 0 : current,
                bestStreak: best,
                totalCount: totalRelapses,
                todayActed,
              },
            };
          }
        })
      );

      setHabits(withStats);
      setTotalXP(xpAccumulator);
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Mark a good habit as done today, or un-mark it (toggle).
   * Rejects silently if date !== today (past days are locked).
   */
  const toggleGoodHabit = useCallback(
    async (habitId: string) => {
      const today = todayStr();
      try {
        const db = getDb();
        const existing = await db.query(
          'SELECT id FROM habit_completions WHERE habit_id = ? AND date = ?;',
          [habitId, today]
        );
        if (existing.values && existing.values.length > 0) {
          await db.run(
            'DELETE FROM habit_completions WHERE habit_id = ? AND date = ?;',
            [habitId, today]
          );
        } else {
          await db.run(
            `INSERT INTO habit_completions (id, habit_id, date, created_at)
             VALUES (?, ?, ?, ?);`,
            [generateId(), habitId, today, new Date().toISOString()]
          );
        }
        await load();
      } catch (err) {
        console.error('Failed to toggle habit completion:', err);
        throw err;
      }
    },
    [load]
  );

  /**
   * Log a relapse for a bad habit today.
   * This resets the streak. Cannot be un-done (no toggle — intentional).
   * Rejects silently if already relapsed today.
   */
  const logRelapse = useCallback(
    async (habitId: string) => {
      const today = todayStr();
      try {
        const db = getDb();
        await db.run(
          `INSERT OR IGNORE INTO habit_relapses (id, habit_id, date, created_at)
           VALUES (?, ?, ?, ?);`,
          [generateId(), habitId, today, new Date().toISOString()]
        );
        await load();
      } catch (err) {
        console.error('Failed to log relapse:', err);
        throw err;
      }
    },
    [load]
  );

  const addHabit = useCallback(
    async (habit: { name: string; emoji: string; colour: string; type: HabitType }) => {
      const id = generateId();
      const created_at = new Date().toISOString();
      try {
        const db = getDb();
        await db.run(
          `INSERT INTO habit_definitions (id, name, emoji, colour, type, is_default, created_at)
           VALUES (?, ?, ?, ?, ?, 0, ?);`,
          [id, habit.name, habit.emoji, habit.colour, habit.type, created_at]
        );
        await load();
      } catch (err) {
        console.error('Failed to add habit:', err);
        throw err;
      }
    },
    [load]
  );

  const deleteHabit = useCallback(
    async (id: string) => {
      try {
        const db = getDb();
        await db.run('DELETE FROM habit_completions WHERE habit_id = ?;', [id]);
        await db.run('DELETE FROM habit_relapses WHERE habit_id = ?;', [id]);
        await db.run('DELETE FROM habit_definitions WHERE id = ?;', [id]);
        await load();
      } catch (err) {
        console.error('Failed to delete habit:', err);
        throw err;
      }
    },
    [load]
  );

  return {
    habits,
    totalXP,
    loading,
    toggleGoodHabit,
    logRelapse,
    addHabit,
    deleteHabit,
    reload: load,
  };
}
