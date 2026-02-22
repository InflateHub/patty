import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';
import { savePhotoFile, loadPhotoFile, deletePhotoFile } from '../utils/photoStorage';

export interface WeightEntry {
  id: string;
  date: string;   // ISO date string, e.g. "2026-02-21"
  value: number;
  unit: 'kg' | 'lbs';
  note?: string;
  /** Relative path stored in app filesystem, loaded into photo_uri as data URL */
  photo_path?: string;
  /** Resolved data URL — populated after loading from filesystem (not in DB) */
  photo_uri?: string;
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
      const rows: WeightEntry[] = await Promise.all(
        (result.values ?? []).map(async (r: Record<string, unknown>) => {
          const entry: WeightEntry = {
            id: r.id as string,
            date: r.date as string,
            value: r.value as number,
            unit: r.unit as 'kg' | 'lbs',
            note: r.note as string | undefined,
            photo_path: (r.photo_path as string | null) ?? undefined,
          };
          if (entry.photo_path) {
            try {
              entry.photo_uri = await loadPhotoFile(entry.photo_path);
            } catch {
              entry.photo_uri = undefined;
            }
          }
          return entry;
        })
      );
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
    async (entry: Omit<WeightEntry, 'id' | 'photo_uri'>) => {
      const id = generateId();
      try {
        let photoPath: string | null = null;
        if (entry.photo_path) {
          // photo_path here is a data URL passed in — save to FS and get the path back
          photoPath = await savePhotoFile('weight_photos', id, entry.photo_path);
        }
        const db = getDb();
        await db.run(
          'INSERT INTO weight_entries (id, date, value, unit, note, photo_path) VALUES (?, ?, ?, ?, ?, ?);',
          [id, entry.date, entry.value, entry.unit, entry.note ?? null, photoPath]
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
        // Fetch photo path before deleting
        const res = await db.query('SELECT photo_path FROM weight_entries WHERE id = ?;', [id]);
        const photoPath = res.values?.[0]?.photo_path as string | undefined;
        await db.run('DELETE FROM weight_entries WHERE id = ?;', [id]);
        if (photoPath) await deletePhotoFile(photoPath);
        await load();
      } catch (err) {
        console.error('Failed to delete weight entry:', err);
        throw err;
      }
    },
    [load]
  );

  // Earliest entry ever (for journeys / starting weight)
  const startingEntry = entries.length > 0
    ? entries.reduce((earliest, e) => e.date < earliest.date ? e : earliest)
    : null;

  return {
    entries,
    todayEntries: entries.filter(e => e.date === todayStr()),
    latestEntry: entries[0] ?? null,
    startingEntry,
    loading,
    addEntry,
    deleteEntry,
    reload: load,
  };
}
