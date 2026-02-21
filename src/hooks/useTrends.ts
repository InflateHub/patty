import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';

export interface TrendDay {
  /** ISO date string, e.g. "2026-02-22" */
  date: string;
  /** Most recent weight value for this day, or null if no entry. */
  weight: number | null;
  /** Total water in ml for this day (0 if no entries). */
  waterMl: number;
  /** Sleep duration in minutes for this day, or null if no entry. */
  sleepMin: number | null;
}

export interface TrendStats {
  currentWeight: number | null;
  currentWeightUnit: string;
  /** 7-day average sleep in minutes, or null if no sleep data. */
  avg7SleepMin: number | null;
  /** 7-day average daily water in ml (days with zero excluded), or null if no water data. */
  avg7WaterMl: number | null;
}

/**
 * Aggregates the last `n` days of weight, water, and sleep data for trend charts
 * and summary stats. Queries the DB directly to avoid N+1 per-day calls.
 */
export function useTrends(n = 30) {
  const [trendDays, setTrendDays] = useState<TrendDay[]>([]);
  const [stats, setStats] = useState<TrendStats>({
    currentWeight: null,
    currentWeightUnit: 'kg',
    avg7SleepMin: null,
    avg7WaterMl: null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const dates: string[] = [];
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().slice(0, 10));
      }
      const oldest = dates[0];

      const db = getDb();

      // Weight: one row per day (most recent)
      const weightRes = await db.query(
        `SELECT date, value, unit FROM weight_entries
         WHERE date >= ? ORDER BY date ASC, id DESC;`,
        [oldest]
      );
      const weightByDate = new Map<string, { value: number; unit: string }>();
      for (const r of weightRes.values ?? []) {
        if (!weightByDate.has(r.date as string)) {
          weightByDate.set(r.date as string, {
            value: r.value as number,
            unit: r.unit as string,
          });
        }
      }

      // Water: sum per day
      const waterRes = await db.query(
        `SELECT date, SUM(amount_ml) as total
         FROM water_entries WHERE date >= ? GROUP BY date;`,
        [oldest]
      );
      const waterByDate = new Map<string, number>();
      for (const r of waterRes.values ?? []) {
        waterByDate.set(r.date as string, r.total as number);
      }

      // Sleep: one entry per day
      const sleepRes = await db.query(
        `SELECT date, duration_min FROM sleep_entries WHERE date >= ? ORDER BY date ASC;`,
        [oldest]
      );
      const sleepByDate = new Map<string, number>();
      for (const r of sleepRes.values ?? []) {
        sleepByDate.set(r.date as string, r.duration_min as number);
      }

      const days: TrendDay[] = dates.map((date) => ({
        date,
        weight: weightByDate.get(date)?.value ?? null,
        waterMl: waterByDate.get(date) ?? 0,
        sleepMin: sleepByDate.get(date) ?? null,
      }));

      setTrendDays(days);

      // ── Stats ─────────────────────────────────────────────────────────
      // Current weight (global latest)
      const latestW = await db.query(
        `SELECT value, unit FROM weight_entries ORDER BY date DESC, id DESC LIMIT 1;`
      );
      const wRow = latestW.values?.[0];
      const currentWeight = wRow ? (wRow.value as number) : null;
      const currentWeightUnit = wRow ? (wRow.unit as string) : 'kg';

      // 7-day averages
      const last7 = dates.slice(-7);
      const sleep7 = last7
        .map((d) => sleepByDate.get(d))
        .filter((v): v is number => v !== undefined);
      const avg7SleepMin =
        sleep7.length > 0
          ? Math.round(sleep7.reduce((a, b) => a + b, 0) / sleep7.length)
          : null;

      const water7 = last7
        .map((d) => waterByDate.get(d) ?? 0)
        .filter((v) => v > 0);
      const avg7WaterMl =
        water7.length > 0
          ? Math.round(water7.reduce((a, b) => a + b, 0) / water7.length)
          : null;

      setStats({ currentWeight, currentWeightUnit, avg7SleepMin, avg7WaterMl });
    } finally {
      setLoading(false);
    }
  }, [n]);

  useEffect(() => {
    load();
  }, [load]);

  return { trendDays, stats, loading, refresh: load };
}
