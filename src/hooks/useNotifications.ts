/**
 * useNotifications — manages all Patty reminder channels via
 * @capacitor/local-notifications.  Prefs (enabled + time) are
 * persisted in the SQLite `settings` table (no new migration needed).
 *
 * Channels (10 total):
 *   Health Tracking  — weigh_in, water_morning/afternoon/evening, sleep_log
 *   Meal Logging     — breakfast_log, lunch_log, dinner_log
 *   Planning         — progress_photo (weekly), meal_plan (weekly)
 *
 * On web / browser the Capacitor plugin silently no-ops for schedule/cancel
 * but permission checks return 'denied', which we surface as a banner.
 */

import { useCallback, useEffect, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getDb } from '../db/database';

// ── Channel definitions ───────────────────────────────────────────────────────

export type NotifSection = 'health' | 'meals' | 'planning';

export interface NotifChannel {
  key: string;         // settings key prefix, e.g. 'weigh_in'
  notifId: number;     // unique numeric notification ID (100-series)
  label: string;
  emoji: string;
  defaultTime: string; // 'HH:MM' 24-hour
  body: string;
  section: NotifSection;
  weekday?: number;    // 1 = Sunday … 7 = Saturday; undefined = every day
}

export const CHANNELS: NotifChannel[] = [
  // ── Health Tracking ──────────────────────────────────────────────────
  {
    key: 'weigh_in',
    notifId: 101,
    label: 'Weigh-in',
    emoji: '\u2696\uFE0F',
    defaultTime: '07:30',
    body: 'Time to step on the scale \u2014 log your weight in Patty.',
    section: 'health',
  },
  {
    key: 'water_morning',
    notifId: 102,
    label: 'Hydration check (morning)',
    emoji: '\uD83D\uDCA7',
    defaultTime: '10:00',
    body: "Don\u2019t forget to drink water this morning!",
    section: 'health',
  },
  {
    key: 'water_afternoon',
    notifId: 103,
    label: 'Hydration check (afternoon)',
    emoji: '\uD83D\uDCA7',
    defaultTime: '14:00',
    body: 'Feeling good? Top up your water intake.',
    section: 'health',
  },
  {
    key: 'water_evening',
    notifId: 104,
    label: 'Hydration check (evening)',
    emoji: '\uD83D\uDCA7',
    defaultTime: '17:00',
    body: 'Evening water check \u2014 nearly at your daily goal?',
    section: 'health',
  },
  {
    key: 'sleep_log',
    notifId: 105,
    label: 'Sleep log reminder',
    emoji: '\uD83D\uDE34',
    defaultTime: '22:00',
    body: 'Time for bed soon \u2014 log last night\u2019s sleep first.',
    section: 'health',
  },
  // ── Meal Logging ─────────────────────────────────────────────────────
  {
    key: 'breakfast_log',
    notifId: 106,
    label: 'Breakfast log',
    emoji: '\uD83C\uDF73',
    defaultTime: '08:30',
    body: 'Log your breakfast in Patty.',
    section: 'meals',
  },
  {
    key: 'lunch_log',
    notifId: 107,
    label: 'Lunch log',
    emoji: '\uD83E\uDD57',
    defaultTime: '13:00',
    body: "Don\u2019t forget to log your lunch!",
    section: 'meals',
  },
  {
    key: 'dinner_log',
    notifId: 108,
    label: 'Dinner log',
    emoji: '\uD83C\uDF7D\uFE0F',
    defaultTime: '19:00',
    body: 'Time to log dinner \u2014 what did you eat tonight?',
    section: 'meals',
  },
  // ── Planning (weekly, Sundays) ────────────────────────────────────────
  {
    key: 'progress_photo',
    notifId: 109,
    label: 'Weekly progress photo',
    emoji: '\uD83D\uDCF8',
    defaultTime: '09:00',
    body: 'Take your weekly progress photo in Patty.',
    section: 'planning',
    weekday: 1, // Sunday
  },
  {
    key: 'meal_plan',
    notifId: 110,
    label: 'Weekly meal plan',
    emoji: '\uD83D\uDCC5',
    defaultTime: '18:00',
    body: 'Plan your meals for the week ahead.',
    section: 'planning',
    weekday: 1, // Sunday
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChannelState {
  key: string;
  enabled: boolean;
  time: string; // 'HH:MM'
}

export type PermStatus = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unknown';

// ── DB helpers ────────────────────────────────────────────────────────────────

async function readNotifSettings(): Promise<Record<string, string>> {
  const db = getDb();
  const result = await db.query("SELECT key, value FROM settings WHERE key LIKE 'notif_%';", []);
  const out: Record<string, string> = {};
  for (const row of result.values ?? []) out[row.key as string] = row.value as string;
  return out;
}

async function writeSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);', [key, value]);
}

// ── Scheduling helpers ────────────────────────────────────────────────────────

function parseTime(t: string): { hour: number; minute: number } {
  const parts = t.split(':');
  return { hour: parseInt(parts[0] ?? '0', 10), minute: parseInt(parts[1] ?? '0', 10) };
}

async function scheduleOne(ch: NotifChannel, time: string): Promise<void> {
  const { hour, minute } = parseTime(time);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const on: Record<string, number> = { hour, minute };
  if (ch.weekday !== undefined) on.weekday = ch.weekday;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ch.notifId,
          title: `${ch.emoji} ${ch.label}`,
          body: ch.body,
          schedule: { on: on as any },
          channelId: 'patty-reminders',
        },
      ],
    });
  } catch {
    // Silently no-op on web
  }
}

async function cancelOne(notifId: number): Promise<void> {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
  } catch {
    // Silently no-op on web
  }
}

async function ensureChannel(): Promise<void> {
  try {
    await LocalNotifications.createChannel({
      id: 'patty-reminders',
      name: 'Patty Reminders',
      description: 'Daily and weekly habit reminders from Patty',
      importance: 3, // IMPORTANCE_DEFAULT
      visibility: 1,
      sound: 'default',
      vibration: true,
    });
  } catch {
    // Only available on Android; ignore on other platforms
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [states, setStates] = useState<ChannelState[]>(
    CHANNELS.map((ch) => ({ key: ch.key, enabled: false, time: ch.defaultTime }))
  );
  const [permStatus, setPermStatus] = useState<PermStatus>('unknown');
  const [loaded, setLoaded] = useState(false);

  // ── Load prefs from DB on mount ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        await ensureChannel();
        const settings = await readNotifSettings();
        setStates(
          CHANNELS.map((ch) => ({
            key: ch.key,
            enabled: settings[`notif_${ch.key}_enabled`] === 'true',
            time: settings[`notif_${ch.key}_time`] ?? ch.defaultTime,
          }))
        );
        try {
          const perm = await LocalNotifications.checkPermissions();
          setPermStatus(perm.display as PermStatus);
        } catch {
          setPermStatus('unknown');
        }
      } catch (err) {
        console.error('useNotifications: load error', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // ── Permission ────────────────────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalNotifications.requestPermissions();
      setPermStatus(result.display as PermStatus);
      return result.display === 'granted';
    } catch {
      return false;
    }
  }, []);

  // ── Toggle a single channel ───────────────────────────────────────────
  const toggleChannel = useCallback(
    async (key: string, enabled: boolean) => {
      if (enabled && permStatus !== 'granted') {
        const ok = await requestPermission();
        if (!ok) return;
      }
      const ch = CHANNELS.find((c) => c.key === key);
      if (!ch) return;
      const st = states.find((s) => s.key === key);
      if (!st) return;

      await writeSetting(`notif_${key}_enabled`, enabled ? 'true' : 'false');
      setStates((prev) => prev.map((s) => (s.key === key ? { ...s, enabled } : s)));

      if (enabled) {
        await scheduleOne(ch, st.time);
      } else {
        await cancelOne(ch.notifId);
      }
    },
    [states, permStatus, requestPermission]
  );

  // ── Change the time for a single channel ─────────────────────────────
  const setChannelTime = useCallback(
    async (key: string, time: string) => {
      const ch = CHANNELS.find((c) => c.key === key);
      if (!ch) return;
      const st = states.find((s) => s.key === key);
      if (!st) return;

      await writeSetting(`notif_${key}_time`, time);
      setStates((prev) => prev.map((s) => (s.key === key ? { ...s, time } : s)));

      if (st.enabled) {
        await cancelOne(ch.notifId);
        await scheduleOne(ch, time);
      }
    },
    [states]
  );

  // ── Enable all channels ───────────────────────────────────────────────
  const enableAll = useCallback(async () => {
    if (permStatus !== 'granted') {
      const ok = await requestPermission();
      if (!ok) return;
    }
    for (const ch of CHANNELS) {
      const st = states.find((s) => s.key === ch.key);
      if (!st?.enabled) {
        await writeSetting(`notif_${ch.key}_enabled`, 'true');
        await scheduleOne(ch, st?.time ?? ch.defaultTime);
      }
    }
    setStates((prev) => prev.map((s) => ({ ...s, enabled: true })));
  }, [states, permStatus, requestPermission]);

  // ── Disable all channels ──────────────────────────────────────────────
  const disableAll = useCallback(async () => {
    for (const ch of CHANNELS) {
      await writeSetting(`notif_${ch.key}_enabled`, 'false');
      await cancelOne(ch.notifId);
    }
    setStates((prev) => prev.map((s) => ({ ...s, enabled: false })));
  }, []);

  const allEnabled = loaded && states.length > 0 && states.every((s) => s.enabled);
  const anyEnabled = states.some((s) => s.enabled);

  return {
    states,
    permStatus,
    loaded,
    allEnabled,
    anyEnabled,
    requestPermission,
    toggleChannel,
    setChannelTime,
    enableAll,
    disableAll,
  };
}
