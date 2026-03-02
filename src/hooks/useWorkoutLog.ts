import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';

export type WorkoutType = 'cardio' | 'strength' | 'yoga' | 'hiit' | 'steps' | 'custom';

export interface WorkoutEntry {
  id: string;
  date: string;
  workout_type: WorkoutType;
  name: string;
  duration_sec: number;
  steps: number | null;
  intensity: number | null; // 1–5, null for steps-only entries
  calories_burnt: number | null;
  notes: string | null;
  created_at: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useWorkoutLog() {
  const [allEntries, setAllEntries] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const result = await db.query(
        'SELECT * FROM workout_entries ORDER BY date DESC, created_at DESC;'
      );
      const rows: WorkoutEntry[] = (result.values ?? []).map((r: Record<string, unknown>) => ({
        id:             r.id as string,
        date:           r.date as string,
        workout_type:   r.workout_type as WorkoutType,
        name:           r.name as string,
        duration_sec:   (r.duration_sec as number) ?? 0,
        steps:          (r.steps as number | null) ?? null,
        intensity:      (r.intensity as number | null) ?? null,
        calories_burnt: (r.calories_burnt as number | null) ?? null,
        notes:          (r.notes as string | null) ?? null,
        created_at:     r.created_at as string,
      }));
      setAllEntries(rows);
    } catch (err) {
      console.error('Failed to load workout entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addEntry = useCallback(
    async (entry: Omit<WorkoutEntry, 'id' | 'created_at'>) => {
      const id = generateId();
      const created_at = new Date().toISOString();
      try {
        const db = getDb();
        await db.run(
          `INSERT INTO workout_entries
           (id, date, workout_type, name, duration_sec, steps, intensity, calories_burnt, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            id,
            entry.date,
            entry.workout_type,
            entry.name,
            entry.duration_sec,
            entry.steps ?? null,
            entry.intensity ?? null,
            entry.calories_burnt ?? null,
            entry.notes ?? null,
            created_at,
          ]
        );
        await load();
      } catch (err) {
        console.error('Failed to add workout entry:', err);
        throw err;
      }
    },
    [load]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        const db = getDb();
        await db.run('DELETE FROM workout_entries WHERE id = ?;', [id]);
        await load();
      } catch (err) {
        console.error('Failed to delete workout entry:', err);
        throw err;
      }
    },
    [load]
  );

  const todayEntries = allEntries.filter((e) => e.date === todayStr());

  const entriesForDate = useCallback(
    (date: string) => allEntries.filter((e) => e.date === date),
    [allEntries]
  );

  return { allEntries, todayEntries, entriesForDate, loading, addEntry, deleteEntry };
}
