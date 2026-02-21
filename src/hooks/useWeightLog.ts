import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';

export interface WeightEntry {
  id: string;
  date: string;   // ISO date string, e.g. "2026-02-21"
  value: number;
  unit: 'kg' | 'lbs';
  note?: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useWeightLog() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const result = await db.query(
        'SELECT * FROM weight_entries ORDER BY date DESC, id DESC;'
      );
      const rows: WeightEntry[] = (result.values ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        date: r.date as string,
        value: r.value as number,
        unit: r.unit as 'kg' | 'lbs',
        note: r.note as string | undefined,
      }));
      setEntries(rows);
    } catch (err) {
      console.error('Failed to load weight entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addEntry = useCallback(
    async (entry: Omit<WeightEntry, 'id'>) => {
      const id = generateId();
      try {
        const db = getDb();
        await db.run(
          'INSERT INTO weight_entries (id, date, value, unit, note) VALUES (?, ?, ?, ?, ?);',
          [id, entry.date, entry.value, entry.unit, entry.note ?? null]
        );
        await load();
      } catch (err) {
        console.error('Failed to add weight entry:', err);
        throw err;
      }
    },
    [load]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        const db = getDb();
        await db.run('DELETE FROM weight_entries WHERE id = ?;', [id]);
        await load();
      } catch (err) {
        console.error('Failed to delete weight entry:', err);
        throw err;
      }
    },
    [load]
  );

  return { entries, todayEntries: entries.filter(e => e.date === todayStr()), latestEntry: entries[0] ?? null, loading, addEntry, deleteEntry, reload: load };
}
