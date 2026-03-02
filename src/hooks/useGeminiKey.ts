import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';

const SETTING_KEY = 'gemini_api_key';

export function useGeminiKey() {
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const db = getDb();
      const res = await db.query('SELECT value FROM settings WHERE key = ?;', [SETTING_KEY]);
      setGeminiKey((res.values?.[0]?.value as string | undefined) ?? '');
    } catch {
      setGeminiKey('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveKey = useCallback(async (key: string) => {
    const trimmed = key.trim();
    try {
      const db = getDb();
      await db.run(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
        [SETTING_KEY, trimmed]
      );
      setGeminiKey(trimmed);
    } catch (err) {
      console.error('Failed to save Gemini key:', err);
      throw err;
    }
  }, []);

  return { geminiKey, loading, saveKey };
}
