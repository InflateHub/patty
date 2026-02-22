import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';
import { savePhotoFile, loadPhotoFile, deletePhotoFile } from '../utils/photoStorage';

export interface ProgressPhoto {
  id: string;
  date: string;
  /** Resolved data URL, loaded from the device filesystem. */
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
      const rows = res.values ?? [];
      const loaded = await Promise.all(
        rows.map(async (r) => {
          let photo_uri = '';
          try {
            photo_uri = await loadPhotoFile(r.photo_path as string);
          } catch {
            // file missing — display as blank
          }
          return {
            id: r.id as string,
            date: r.date as string,
            photo_uri,
            created_at: r.created_at as string,
          };
        })
      );
      setPhotos(loaded);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addPhoto = useCallback(
    async (date: string, dataUrl: string) => {
      const id = `pp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const now = new Date().toISOString();
      const path = await savePhotoFile('progress_photos', id, dataUrl);
      const db = getDb();
      await db.run(
        'INSERT INTO progress_photos (id, date, photo_path, created_at) VALUES (?, ?, ?, ?);',
        [id, date, path, now]
      );
      await load();
    },
    [load]
  );

  const deletePhoto = useCallback(
    async (id: string) => {
      const db = getDb();
      const res = await db.query(
        'SELECT photo_path FROM progress_photos WHERE id = ?;',
        [id]
      );
      const path = res.values?.[0]?.photo_path as string | undefined;
      await db.run('DELETE FROM progress_photos WHERE id = ?;', [id]);
      if (path) await deletePhotoFile(path);
      await load();
    },
    [load]
  );

  return { photos, loading, addPhoto, deletePhoto, refresh: load };
}
