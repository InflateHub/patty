import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';

export interface ProgressPhoto {
  id: string;
  date: string;
  photo_uri: string;
  created_at: string;
}

export function useProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = getDb();
      const res = await db.query(
        'SELECT * FROM progress_photos ORDER BY date DESC, created_at DESC;'
      );
      setPhotos(
        (res.values ?? []).map((r) => ({
          id: r.id as string,
          date: r.date as string,
          photo_uri: r.photo_uri as string,
          created_at: r.created_at as string,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addPhoto = useCallback(
    async (date: string, photo_uri: string) => {
      const db = getDb();
      const id = `pp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const now = new Date().toISOString();
      await db.run(
        'INSERT INTO progress_photos (id, date, photo_uri, created_at) VALUES (?, ?, ?, ?);',
        [id, date, photo_uri, now]
      );
      await load();
    },
    [load]
  );

  const deletePhoto = useCallback(
    async (id: string) => {
      const db = getDb();
      await db.run('DELETE FROM progress_photos WHERE id = ?;', [id]);
      await load();
    },
    [load]
  );

  return { photos, loading, addPhoto, deletePhoto, refresh: load };
}
