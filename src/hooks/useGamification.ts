/**
 * useGamification
 *
 * Computes XP, level, streaks, and badges by aggregating all log tables.
 * All queries run directly against SQLite to avoid N+1 round-trips.
 */
import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';

// ── Level thresholds ─────────────────────────────────────────────────────────
export interface Level {
  name: string;
  emoji: string;
  minXp: number;
  maxXp: number; // exclusive; Infinity for Legend
  color: string; // CSS color for badge accent
}

export const LEVELS: Level[] = [
  { name: 'Seedling',  emoji: '\uD83C\uDF31', minXp: 0,    maxXp: 100,  color: '#9ECA7F' },
  { name: 'Sprout',    emoji: '\uD83C\uDF3F', minXp: 100,  maxXp: 300,  color: '#5C7A6E' },
  { name: 'Achiever',  emoji: '\uD83D\uDCA1', minXp: 300,  maxXp: 700,  color: '#F5A623' },
  { name: 'Champion',  emoji: '\uD83C\uDFC6', minXp: 700,  maxXp: 1500, color: '#E8584F' },
  { name: 'Legend',    emoji: '\uD83D\uDD25', minXp: 1500, maxXp: Infinity, color: '#9B59B6' },
];

export function getLevel(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

// ── Badge definitions ─────────────────────────────────────────────────────────
export interface Badge {
  id: string;
  label: string;
  emoji: string;
  description: string;
  earned: boolean;
}

// ── Return shape ──────────────────────────────────────────────────────────────
export interface GamificationData {
  xp: number;
  level: Level;
  xpIntoLevel: number; // xp within current level band
  xpForLevel: number;  // total width of current level band (Infinity for Legend)
  currentStreak: number;
  bestStreak: number;
  badges: Badge[];
  loading: boolean;
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
    level: LEVELS[0],
    xpIntoLevel: 0,
    xpForLevel: 100,
    currentStreak: 0,
    bestStreak: 0,
    badges: [],
    loading: true,
  });

  const compute = useCallback(async () => {
    try {
      const db = getDb();

      // ── Weight entries ────────────────────────────────────────────────────
      const wRes = await db.query(
        `SELECT date, photo_path FROM weight_entries ORDER BY date ASC;`
      );
      const weightRows = wRes.values ?? [];
      const weightDates: string[] = weightRows.map((r: Record<string, unknown>) => r.date as string);
      const weightPhotos = weightRows.filter((r: Record<string, unknown>) => !!r.photo_path).length;

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

      // Streak XP bonuses (7-day milestones)
      const milestones = [7, 14, 21, 30, 60, 100];
      for (const m of milestones) {
        if (bestStreak >= m) xp += 25;
      }

      // ── Level ──────────────────────────────────────────────────────────────
      const level = getLevel(xp);
      const xpIntoLevel = xp - level.minXp;
      const xpForLevel = level.maxXp === Infinity ? 500 : level.maxXp - level.minXp;

      // ── Badges ────────────────────────────────────────────────────────────
      const badges: Badge[] = [
        {
          id: 'first_step',
          label: 'First Step',
          emoji: '\uD83D\uDC63',
          description: 'Log your first weight entry',
          earned: weightDates.length >= 1,
        },
        {
          id: 'photo_journalist',
          label: 'Photo Journalist',
          emoji: '\uD83D\uDCF8',
          description: 'Log 10 weight entries with photos',
          earned: weightPhotos >= 10,
        },
        {
          id: 'hydration_hero',
          label: 'Hydration Hero',
          emoji: '\uD83D\uDCA7',
          description: 'Hit your water goal 7 days',
          earned: waterGoalDays >= 7,
        },
        {
          id: 'night_owl',
          label: 'Night Owl',
          emoji: '\uD83C\uDF19',
          description: 'Log sleep 7 times',
          earned: sleepDates.length >= 7,
        },
        {
          id: 'on_a_roll',
          label: 'On a Roll',
          emoji: '\uD83D\uDD25',
          description: '14-day logging streak',
          earned: bestStreak >= 14,
        },
        {
          id: 'month_strong',
          label: 'Month Strong',
          emoji: '\uD83D\uDCAA',
          description: '30-day logging streak',
          earned: bestStreak >= 30,
        },
        {
          id: 'centurion',
          label: 'Centurion',
          emoji: '\uD83C\uDFC6',
          description: '100-day logging streak',
          earned: bestStreak >= 100,
        },
        {
          id: 'consistent',
          label: 'Consistent',
          emoji: '\u2B50',
          description: '7-day logging streak',
          earned: bestStreak >= 7,
        },
      ];

      setData({
        xp,
        level,
        xpIntoLevel,
        xpForLevel,
        currentStreak,
        bestStreak,
        badges,
        loading: false,
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
