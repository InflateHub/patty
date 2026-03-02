import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';

export interface WaterEntry {
  id: string;
  date: string;       // ISO date, e.g. "2026-02-21"
  amount_ml: number;
  created_at: string; // ISO timestamp
}

const SETTINGS_KEY = 'pref_water_goal_ml';
const DEFAULT_GOAL = 2000;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useWaterLog() {
  const [todayEntries, setTodayEntries] = useState<WaterEntry[]>([]);
  const [weekEntries, setWeekEntries] = useState<WaterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyGoal, setDailyGoalState] = useState<number>(DEFAULT_GOAL);

  const loadGoal = useCallback(async () => {
    try {
      const db = getDb();
      const res = await db.query(
        'SELECT value FROM settings WHERE key = ?;',
        [SETTINGS_KEY]
      );
      const val = res.values?.[0]?.value;
      if (val !== undefined && val !== null) {
        setDailyGoalState(parseInt(String(val), 10));
      }
    } catch (err) {
      console.error('Failed to load water goal:', err);
    }
  }, []);

  const loadToday = useCallback(async () => {
    try {
      const db = getDb();
      const result = await db.query(
        'SELECT * FROM water_entries WHERE date = ? ORDER BY created_at ASC;',
        [todayStr()]
      );
      const rows: WaterEntry[] = (result.values ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        date: r.date as string,
        amount_ml: r.amount_ml as number,
        created_at: r.created_at as string,
      }));
      setTodayEntries(rows);
    } catch (err) {
      console.error('Failed to load water entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWeek = useCallback(async () => {
    try {
      const db = getDb();
      const d = new Date();
      d.setDate(d.getDate() - 6);
      const since = d.toISOString().slice(0, 10);
      const result = await db.query(
        'SELECT * FROM water_entries WHERE date >= ? ORDER BY date ASC, created_at ASC;',
        [since]
      );
      const rows: WaterEntry[] = (result.values ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        date: r.date as string,
        amount_ml: r.amount_ml as number,
        created_at: r.created_at as string,
      }));
      setWeekEntries(rows);
    } catch (err) {
      console.error('Failed to load week water entries:', err);
    }
  }, []);

  useEffect(() => {
    loadGoal();
    loadToday();
    loadWeek();
  }, [loadGoal, loadToday, loadWeek]);

  const addEntry = useCallback(
    async (amountMl: number, date?: string) => {
      const id = generateId();
      const entryDate = date ?? todayStr();
      const createdAt = new Date().toISOString();
      try {
        const db = getDb();
        await db.run(
          'INSERT INTO water_entries (id, date, amount_ml, created_at) VALUES (?, ?, ?, ?);',
          [id, entryDate, amountMl, createdAt]
        );
        await loadToday();
        await loadWeek();
      } catch (err) {
        console.error('Failed to add water entry:', err);
        throw err;
      }
    },
    [loadToday, loadWeek]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        const db = getDb();
        await db.run('DELETE FROM water_entries WHERE id = ?;', [id]);
        await loadToday();
        await loadWeek();
      } catch (err) {
        console.error('Failed to delete water entry:', err);
        throw err;
      }
    },
    [loadToday, loadWeek]
  );

  const setDailyGoal = useCallback(async (ml: number) => {
    try {
      const db = getDb();
      await db.run(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
        [SETTINGS_KEY, String(ml)]
      );
      setDailyGoalState(ml);
    } catch (err) {
      console.error('Failed to save water goal:', err);
      throw err;
    }
  }, []);

  const todayTotal = todayEntries.reduce((sum, e) => sum + e.amount_ml, 0);

  return {
    todayEntries,
    weekEntries,
    todayTotal,
    dailyGoal,
    loading,
    addEntry,
    deleteEntry,
    setDailyGoal,
    reload: loadToday,
  };
}
