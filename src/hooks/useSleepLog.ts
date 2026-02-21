import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';

export interface SleepEntry {
  id: string;
  date: string;          // ISO date (bedtime date), e.g. "2026-02-21"
  bedtime: string;       // ISO timestamp
  waketime: string;      // ISO timestamp
  duration_min: number;  // calculated on insert
  quality: number;       // 1–5
  note: string | null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useSleepLog() {
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const db = getDb();
      const result = await db.query(
        'SELECT * FROM sleep_entries ORDER BY bedtime DESC;',
        []
      );
      const rows: SleepEntry[] = (result.values ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        date: r.date as string,
        bedtime: r.bedtime as string,
        waketime: r.waketime as string,
        duration_min: r.duration_min as number,
        quality: r.quality as number,
        note: r.note as string | null,
      }));
      setEntries(rows);
    } catch (err) {
      console.error('Failed to load sleep entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /**
   * Add a new sleep entry.
   * @param bedtime  Full ISO timestamp string, e.g. "2026-02-21T22:30:00.000"
   * @param waketime Full ISO timestamp string, e.g. "2026-02-22T07:00:00.000"
   * @param quality  1–5
   * @param note     Optional free-text note
   */
  const addEntry = useCallback(
    async (bedtime: string, waketime: string, quality: number, note?: string) => {
      const id = generateId();
      const date = bedtime.slice(0, 10);
      const durationMin = Math.round(
        (new Date(waketime).getTime() - new Date(bedtime).getTime()) / 60_000
      );
      try {
        const db = getDb();
        await db.run(
          'INSERT INTO sleep_entries (id, date, bedtime, waketime, duration_min, quality, note) VALUES (?, ?, ?, ?, ?, ?, ?);',
          [id, date, bedtime, waketime, durationMin, quality, note ?? null]
        );
        await loadAll();
      } catch (err) {
        console.error('Failed to add sleep entry:', err);
        throw err;
      }
    },
    [loadAll]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        const db = getDb();
        await db.run('DELETE FROM sleep_entries WHERE id = ?;', [id]);
        await loadAll();
      } catch (err) {
        console.error('Failed to delete sleep entry:', err);
        throw err;
      }
    },
    [loadAll]
  );

  const avgDurationMin =
    entries.length > 0
      ? Math.round(entries.reduce((sum, e) => sum + e.duration_min, 0) / entries.length)
      : null;

  return { entries, loading, addEntry, deleteEntry, avgDurationMin };
}
