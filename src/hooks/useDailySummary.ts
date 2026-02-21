import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';
import type { WeightEntry } from './useWeightLog';
import type { SleepEntry } from './useSleepLog';

export interface DailySummary {
  date: string;
  /** Most recent weight entry for this date, or null. */
  weight: WeightEntry | null;
  /** Total water intake in ml for this date. */
  waterTotalMl: number;
  /** User's daily water goal in ml (from localStorage). */
  waterGoalMl: number;
  /** Sleep entry whose bedtime date matches, or null. */
  sleep: SleepEntry | null;
}

const GOAL_KEY = 'patty_water_goal_ml';
const DEFAULT_GOAL = 2000;

/**
 * Returns a per-day summary across all three trackers for a given date string.
 * Used by the Home dashboard and analytics.
 *
 * @param date ISO date string, e.g. "2026-02-22"
 */
export function useDailySummary(date: string) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = getDb();

      // Weight: most recent entry for this date
      const wRes = await db.query(
        'SELECT * FROM weight_entries WHERE date = ? ORDER BY id DESC LIMIT 1;',
        [date]
      );
      const wRow = wRes.values?.[0] ?? null;
      const weight: WeightEntry | null = wRow
        ? {
            id: wRow.id as string,
            date: wRow.date as string,
            value: wRow.value as number,
            unit: wRow.unit as 'kg' | 'lbs',
            note: wRow.note as string | undefined,
          }
        : null;

      // Water: sum for this date
      const watRes = await db.query(
        'SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_entries WHERE date = ?;',
        [date]
      );
      const waterTotalMl = (watRes.values?.[0]?.total as number) ?? 0;
      const waterGoalMl = parseInt(
        localStorage.getItem(GOAL_KEY) ?? String(DEFAULT_GOAL),
        10
      );

      // Sleep: entry where bedtime date matches
      const sRes = await db.query(
        'SELECT * FROM sleep_entries WHERE date = ? LIMIT 1;',
        [date]
      );
      const sRow = sRes.values?.[0] ?? null;
      const sleep: SleepEntry | null = sRow
        ? {
            id: sRow.id as string,
            date: sRow.date as string,
            bedtime: sRow.bedtime as string,
            waketime: sRow.waketime as string,
            duration_min: sRow.duration_min as number,
            quality: sRow.quality as number,
            note: sRow.note as string | null,
          }
        : null;

      setSummary({ date, weight, waterTotalMl, waterGoalMl, sleep });
    } catch (err) {
      console.error('Failed to load daily summary:', err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, loading, reload: load };
}
