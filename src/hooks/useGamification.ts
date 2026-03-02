/**
 * useGamification
 *
 * Computes XP, level, streaks, and badges by aggregating all log tables.
 * All queries run directly against SQLite to avoid N+1 round-trips.
 */
import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';

// ── Infinite level system ────────────────────────────────────────────────────
//
// 5 named tiers cycle infinitely across eras. Each era costs 2× XP.
//
//  Era 1: 0 → 1 500 XP   (tier widths ×1)
//  Era 2: 1 500 → 4 500  (tier widths ×2)
//  Era 3: 4 500 → 10 500 (tier widths ×4)  … and so on forever.
//
// Tier names repeat (Seedling → Sprout → Achiever → Champion → Legend).
// Era suffix added from era 2 onward: "Sprout II", "Legend III" …
// Color cycles through 7 era palettes so the same tier looks different each time.

export interface Level {
  name: string;   // e.g. "Sprout" or "Legend III"
  emoji: string;
  minXp: number;
  maxXp: number;  // always finite
  color: string;
  era: number;    // 1-based
  tier: number;   // 0-based index within the 5-tier cycle
}

const TIER_NAMES   = ['Seedling', 'Sprout', 'Achiever', 'Champion', 'Legend'];
const TIER_EMOJIS  = ['\uD83C\uDF31', '\uD83C\uDF3F', '\uD83D\uDCA1', '\uD83C\uDFC6', '\uD83D\uDD25'];
// XP offsets from era start (unscaled — multiply by 2^(era-1))
const TIER_OFFSETS = [0, 100, 300, 700, 1200];
const ERA_BASE     = 1500; // total XP span of era 1

// 7 accent colors — one per era, cycling
const ERA_COLORS = [
  '#9B59B6', // violet   (era 1)
  '#3A6B8A', // ocean    (era 2)
  '#2D6B44', // forest   (era 3)
  '#C0392B', // crimson  (era 4)
  '#B8860B', // gold     (era 5)
  '#1A7A8A', // teal     (era 6)
  '#8A4A2E', // bronze   (era 7)
];

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
function romanNumeral(n: number): string {
  return n <= ROMAN.length ? ROMAN[n - 1] : `E${n}`;
}

/** XP total at which era `n` (1-based) begins. */
function eraStart(n: number): number {
  // Sum of ERA_BASE × 2^0 + … + 2^(n-2) = ERA_BASE × (2^(n-1) - 1)
  return ERA_BASE * (Math.pow(2, n - 1) - 1);
}

export function getLevel(xp: number): Level {
  const safeXp = Math.max(0, xp);
  // Determine era
  let era = 1;
  while (eraStart(era + 1) <= safeXp) era++;

  const scale = Math.pow(2, era - 1);
  const rel   = safeXp - eraStart(era); // XP within this era

  // Determine tier (highest whose scaled offset ≤ rel)
  let tier = 0;
  for (let t = TIER_OFFSETS.length - 1; t >= 0; t--) {
    if (rel >= TIER_OFFSETS[t] * scale) { tier = t; break; }
  }

  const tierMinXp = eraStart(era)  + TIER_OFFSETS[tier] * scale;
  const tierMaxXp = tier < TIER_OFFSETS.length - 1
    ? eraStart(era) + TIER_OFFSETS[tier + 1] * scale
    : eraStart(era + 1);

  return {
    name:  era === 1 ? TIER_NAMES[tier] : `${TIER_NAMES[tier]} ${romanNumeral(era)}`,
    emoji: TIER_EMOJIS[tier],
    minXp: tierMinXp,
    maxXp: tierMaxXp,
    color: ERA_COLORS[(era - 1) % ERA_COLORS.length],
    era,
    tier,
  };
}

/** Returns the Level that immediately follows the one for `xp`. */
export function getNextLevel(xp: number): Level {
  return getLevel(getLevel(Math.max(0, xp)).maxXp);
}

// ── Return shape ──────────────────────────────────────────────────────────────
export interface GamificationData {
  xp: number;
  level: Level;
  xpIntoLevel: number; // xp within current level band
  xpForLevel: number;  // total width of current level band
  currentStreak: number;
  bestStreak: number;
  loading: boolean;
  // per-category counts used by the Achievements badge shelves
  counts: {
    weightDays: number;       // unique dates with a weight entry
    waterGoalDays: number;    // days where water goal was met
    sleepDays: number;        // unique dates with a sleep entry
    foodEntries: number;      // total food log rows
    workoutDays: number;      // unique dates with a workout entry
    appStreakBest: number;    // same as bestStreak (any-log activity)
  };
}

// ── Helper ────────────────────────────────────────────────────────────────────
function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
  );
}

function computeStreak(sortedDatesDesc: string[]): { current: number; best: number } {
  if (sortedDatesDesc.length === 0) return { current: 0, best: 0 };

  const today = isoToday();
  let current = 0;
  let best = 0;
  let streak = 1;

  // current streak: count from today or yesterday backwards
  const newest = sortedDatesDesc[0];
  const gapFromToday = daysBetween(newest, today);
  if (gapFromToday <= 1) {
    current = 1;
    for (let i = 1; i < sortedDatesDesc.length; i++) {
      if (daysBetween(sortedDatesDesc[i], sortedDatesDesc[i - 1]) === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  // best streak across all history
  for (let i = 1; i < sortedDatesDesc.length; i++) {
    if (daysBetween(sortedDatesDesc[i], sortedDatesDesc[i - 1]) === 1) {
      streak++;
    } else {
      if (streak > best) best = streak;
      streak = 1;
    }
  }
  if (streak > best) best = streak;
  if (current > best) best = current;

  return { current, best };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useGamification(): GamificationData & { reload: () => void } {
  const [data, setData] = useState<GamificationData>({
    xp: 0,
    level: getLevel(0),
    xpIntoLevel: 0,
    xpForLevel: 100,
    currentStreak: 0,
    bestStreak: 0,
    loading: true,
    counts: {
      weightDays: 0,
      waterGoalDays: 0,
      sleepDays: 0,
      foodEntries: 0,
      workoutDays: 0,
      appStreakBest: 0,
    },
  });

  const compute = useCallback(async () => {
    try {
      const db = getDb();

      // ── Weight entries ────────────────────────────────────────────────────
      const wRes = await db.query(
        `SELECT date FROM weight_entries ORDER BY date ASC;`
      );
      const weightRows  = wRes.values ?? [];
      const weightDates: string[] = weightRows.map((r: Record<string, unknown>) => r.date as string);

      // ── Water entries + goal ──────────────────────────────────────────────
      const waterGoalRes = await db.query(
        `SELECT value FROM settings WHERE key = 'water_goal_ml';`
      );
      const goalMl = waterGoalRes.values?.[0]?.value
        ? parseInt(waterGoalRes.values[0].value as string, 10)
        : 2000;

      const waterRes = await db.query(
        `SELECT date, SUM(amount_ml) as total FROM water_entries GROUP BY date ORDER BY date ASC;`
      );
      const waterRows = waterRes.values ?? [];
      const waterDates: string[] = waterRows.map((r: Record<string, unknown>) => r.date as string);
      const waterGoalDays = waterRows.filter(
        (r: Record<string, unknown>) => (r.total as number) >= goalMl
      ).length;

      // ── Sleep entries ─────────────────────────────────────────────────────
      const sleepRes = await db.query(
        `SELECT date FROM sleep_entries ORDER BY date ASC;`
      );
      const sleepRows = sleepRes.values ?? [];
      const sleepDates: string[] = sleepRows.map((r: Record<string, unknown>) => r.date as string);

      // ── Food entries ──────────────────────────────────────────────────────
      const foodRes = await db.query(
        `SELECT COUNT(*) as cnt FROM food_entries;`
      );
      const foodCount = (foodRes.values?.[0]?.cnt as number) ?? 0;

      // ── Workout entries ───────────────────────────────────────────────────
      const workoutRes = await db.query(
        `SELECT DISTINCT date FROM workout_entries ORDER BY date ASC;`
      );
      const workoutDates: string[] = (workoutRes.values ?? []).map((r: Record<string, unknown>) => r.date as string);

      // ── XP calculation ────────────────────────────────────────────────────
      let xp = 0;
      xp += weightDates.length * 10;           // weight log: +10 each
      xp += waterGoalDays * 10;                 // water goal hit: +10/day
      xp += sleepDates.length * 5;              // sleep logged: +5 each
      xp += foodCount * 2;                      // food logged: +2 each

      // ── Streak calculation (union all logged dates) ───────────────────────
      const allDatesSet = new Set<string>([
        ...weightDates,
        ...waterDates,
        ...sleepDates,
      ]);
      const sortedDatesDesc = Array.from(allDatesSet).sort((a, b) => b.localeCompare(a));
      const { current: currentStreak, best: bestStreak } = computeStreak(sortedDatesDesc);

      // Streak XP bonuses
      const milestones = [7, 14, 30, 100, 300, 500, 750, 1000, 2000, 5000, 10000];
      for (const m of milestones) {
        if (bestStreak >= m) xp += 50;
      }

      // ── Level ──────────────────────────────────────────────────────────────
      const level       = getLevel(xp);
      const xpIntoLevel = xp - level.minXp;
      const xpForLevel  = level.maxXp - level.minXp;

      setData({
        xp,
        level,
        xpIntoLevel,
        xpForLevel,
        currentStreak,
        bestStreak,
        loading: false,
        counts: {
          weightDays: weightDates.length,
          waterGoalDays,
          sleepDays: sleepDates.length,
          foodEntries: foodCount,
          workoutDays: workoutDates.length,
          appStreakBest: bestStreak,
        },
      });
    } catch (err) {
      console.error('useGamification error:', err);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    compute();
  }, [compute]);

  return { ...data, loading: data.loading, reload: compute };
}

