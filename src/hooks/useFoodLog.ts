import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';
import { savePhotoFile, loadPhotoFile, deletePhotoFile } from '../utils/photoStorage';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  id: string;
  date: string;          // ISO date, e.g. "2026-02-22"
  meal: MealType;
  photo_uri: string | null;
  note: string | null;
  kcal: number | null;
  created_at: string;    // ISO timestamp
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useFoodLog() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      const db = getDb();
      const result = await db.query(
        'SELECT * FROM food_entries ORDER BY created_at DESC;',
        []
      );
      const rows: FoodEntry[] = await Promise.all(
        (result.values ?? []).map(async (r: Record<string, unknown>) => {
          let photo_uri: string | null = r.photo_uri as string | null;
          if (r.photo_path) {
            try {
              photo_uri = await loadPhotoFile(r.photo_path as string);
            } catch {
              photo_uri = null;
            }
          }
          return {
            id: r.id as string,
            date: r.date as string,
            meal: r.meal as MealType,
            photo_uri,
            note: r.note as string | null,
            kcal: r.kcal != null ? (r.kcal as number) : null,
            created_at: r.created_at as string,
          };
        })
      );
      setEntries(rows);
    } catch (err) {
      console.error('Failed to load food entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /**
   * Add a new food entry.
   * @param date      ISO date string, e.g. "2026-02-22"
   * @param meal      'breakfast' | 'lunch' | 'dinner' | 'snack'
   * @param photo_uri Optional data URI of the photo
   * @param note      Optional free-text note
   * @param kcal      Optional calorie count
   */
  const addEntry = useCallback(
    async (date: string, meal: MealType, photo_uri?: string, note?: string, kcal?: number) => {
      const id = generateId();
      const created_at = new Date().toISOString();
      try {
        const db = getDb();
        // If a photo was provided, save it to the filesystem and store only its path.
        const storedPhotoUri: string | null = null;
        let storedPhotoPath: string | null = null;
        if (photo_uri) {
          storedPhotoPath = await savePhotoFile('food_photos', id, photo_uri);
        }
        await db.run(
          'INSERT INTO food_entries (id, date, meal, photo_uri, photo_path, note, kcal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
          [id, date, meal, storedPhotoUri, storedPhotoPath, note ?? null, kcal ?? null, created_at]
        );
        await loadAll();
      } catch (err) {
        console.error('Failed to add food entry:', err);
        throw err;
      }
    },
    [loadAll]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        const db = getDb();
        const res = await db.query(
          'SELECT photo_path FROM food_entries WHERE id = ?;',
          [id]
        );
        const photoPath = res.values?.[0]?.photo_path as string | undefined;
        await db.run('DELETE FROM food_entries WHERE id = ?;', [id]);
        if (photoPath) await deletePhotoFile(photoPath);
        await loadAll();
      } catch (err) {
        console.error('Failed to delete food entry:', err);
        throw err;
      }
    },
    [loadAll]
  );

  /** All entries for a specific date, in created_at order. */
  const entriesForDate = useCallback(
    (date: string): FoodEntry[] =>
      entries.filter((e) => e.date === date),
    [entries]
  );

  /** Today's entries grouped by meal type. */
  const todayEntries = useCallback(
    (date: string): Record<MealType, FoodEntry[]> => {
      const all = entriesForDate(date);
      return {
        breakfast: all.filter((e) => e.meal === 'breakfast'),
        lunch: all.filter((e) => e.meal === 'lunch'),
        dinner: all.filter((e) => e.meal === 'dinner'),
        snack: all.filter((e) => e.meal === 'snack'),
      };
    },
    [entriesForDate]
  );

  return { entries, loading, addEntry, deleteEntry, entriesForDate, todayEntries, reload: loadAll };
}
