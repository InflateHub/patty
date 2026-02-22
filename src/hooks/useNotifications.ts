/**
 * useNotifications — manages all Patty reminder channels via
 * @capacitor/local-notifications.  Prefs (enabled + time) are
 * persisted in the SQLite `settings` table.
 *
 * Channels:
 *   Health Tracking  — weigh_in, sleep_log (morning)
 *   Water            — frequency-based system (1–8/day, auto-distributed)
 *   Meal Logging     — breakfast_log, lunch_log, dinner_log
 *   Planning         — progress_photo (weekly Sun), meal_plan (weekly Sun),
 *                      weekly_checkin (weekly Mon)
 *   Engagement       — morning_boost, midday_nudge, evening_reflect
 *                      (adapt to linked-channel time + 30 min)
 *
 * Water notification IDs: 120–127 (up to 8 slots).
 * All other channels: 101–114.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getDb } from '../db/database';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotifSection = 'health' | 'meals' | 'planning' | 'engage';

export interface NotifChannel {
  key: string;
  notifId: number;
  label: string;
  emoji: string;
  defaultTime: string; // 'HH:MM' 24-hour
  body: string;
  section: NotifSection;
  channelId: string;
  weekday?: number; // 1=Sun, 2=Mon … 7=Sat; undefined = every day
  /** For engage channels: key of the functional channel this adapts to */
  adaptsTo?: string;
}

export interface ChannelState {
  key: string;
  enabled: boolean;
  time: string; // 'HH:MM' — for engage channels this is derived (adaptsTo + 30 min)
}

/** Water frequency / distribution settings */
export interface WaterFreqSettings {
  enabled: boolean;
  count: number;                    // 1–8 reminders per day
  start: string;                    // 'HH:MM' day window start
  end: string;                      // 'HH:MM' day window end
  slotOverrides: (string | null)[]; // null → use auto-distributed time
}

// ── Channel definitions ───────────────────────────────────────────────────────

export const CHANNELS: NotifChannel[] = [
  // ── Health ──────────────────────────────────────────────────────────
  {
    key: 'weigh_in',
    notifId: 101,
    label: 'Weigh-in reminder',
    emoji: '\u2696\uFE0F',
    defaultTime: '08:00',
    body: 'Good morning \u2014 step on the scale and log your weight in Patty.',
    section: 'health',
    channelId: 'patty-weighin',
  },
  {
    key: 'sleep_log',
    notifId: 105,
    label: 'Sleep log (morning)',
    emoji: '\u2600\uFE0F',
    defaultTime: '08:30',
    body: 'Good morning! How did you sleep? Log last night\u2019s rest in Patty.',
    section: 'health',
    channelId: 'patty-sleep',
  },
  // ── Meal Logging ─────────────────────────────────────────────────────
  {
    key: 'breakfast_log',
    notifId: 106,
    label: 'Breakfast log',
    emoji: '\uD83C\uDF73',
    defaultTime: '08:30',
    body: 'Start the day right \u2014 log your breakfast in Patty.',
    section: 'meals',
    channelId: 'patty-food',
  },
  {
    key: 'lunch_log',
    notifId: 107,
    label: 'Lunch log',
    emoji: '\uD83E\uDD57',
    defaultTime: '13:00',
    body: "Don\u2019t forget to log your lunch!",
    section: 'meals',
    channelId: 'patty-food',
  },
  {
    key: 'dinner_log',
    notifId: 108,
    label: 'Dinner log',
    emoji: '\uD83C\uDF7D\uFE0F',
    defaultTime: '19:00',
    body: 'Time to log dinner \u2014 what did you eat tonight?',
    section: 'meals',
    channelId: 'patty-food',
  },
  // ── Planning (weekly) ─────────────────────────────────────────────────
  {
    key: 'progress_photo',
    notifId: 109,
    label: 'Weekly progress photo',
    emoji: '\uD83D\uDCF8',
    defaultTime: '09:00',
    body: 'It\u2019s Sunday \u2014 take your weekly progress photo and see how far you\u2019ve come.',
    section: 'planning',
    channelId: 'patty-plan',
    weekday: 1, // Sunday
  },
  {
    key: 'meal_plan',
    notifId: 110,
    label: 'Weekly meal plan',
    emoji: '\uD83D\uDCC5',
    defaultTime: '18:00',
    body: 'Plan your meals for the week ahead \u2014 set yourself up for success.',
    section: 'planning',
    channelId: 'patty-plan',
    weekday: 1, // Sunday
  },
  {
    key: 'weekly_checkin',
    notifId: 111,
    label: 'Weekly check-in',
    emoji: '\uD83C\uDFC1',
    defaultTime: '09:00',
    body: 'New week, fresh goals. Check your meal plan and start the week strong!',
    section: 'planning',
    channelId: 'patty-plan',
    weekday: 2, // Monday
  },
  // ── Engagement nudges ─────────────────────────────────────────────────
  {
    key: 'morning_boost',
    notifId: 112,
    label: 'Morning boost',
    emoji: '\u26A1',
    defaultTime: '08:30',
    body: 'You\u2019re already ahead \u2014 you logged your weight! Keep the streak going today.',
    section: 'engage',
    channelId: 'patty-engage',
    adaptsTo: 'weigh_in',
  },
  {
    key: 'midday_nudge',
    notifId: 113,
    label: 'Midday nudge',
    emoji: '\uD83C\uDF1F',
    defaultTime: '13:30',
    body: 'Halfway through the day! Water on track? A quick check keeps big goals on course.',
    section: 'engage',
    channelId: 'patty-engage',
    adaptsTo: 'lunch_log',
  },
  {
    key: 'evening_reflect',
    notifId: 114,
    label: 'Evening reflection',
    emoji: '\uD83C\uDF19',
    defaultTime: '19:30',
    body: 'Almost there! Log your dinner, check your water, and finish today strong.',
    section: 'engage',
    channelId: 'patty-engage',
    adaptsTo: 'dinner_log',
  },
];

/** Water slot notification IDs (120–127) */
const WATER_NOTIF_IDS = [120, 121, 122, 123, 124, 125, 126, 127];

export const WATER_MAX_COUNT = 8;
export const WATER_MIN_COUNT = 1;

const WATER_DEFAULT: WaterFreqSettings = {
  enabled: false,
  count: 4,
  start: '07:00',
  end: '21:00',
  slotOverrides: Array(WATER_MAX_COUNT).fill(null) as null[],
};

export type PermStatus = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unknown';

// ── Android notification channels ─────────────────────────────────────────────

const ANDROID_CHANNELS_DEF: [string, string, string, string][] = [
  ['patty-weighin', 'Weigh-in',   'Daily weigh-in reminder',        'patty_weighin'],
  ['patty-water',   'Hydration',  'Daily water intake reminders',   'patty_water'],
  ['patty-sleep',   'Sleep',      'Daily sleep log reminder',       'patty_sleep'],
  ['patty-food',    'Meals',      'Meal logging reminders',         'patty_food'],
  ['patty-plan',    'Planning',   'Weekly planning reminders',      'patty_plan'],
  ['patty-engage',  'Engagement', 'Motivational nudges',            'patty_engage'],
];

// ── Utility helpers ───────────────────────────────────────────────────────────

function timeToMins(t: string): number {
  const [h = '0', m = '0'] = t.split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function minsToTime(mins: number): string {
  const total = Math.max(0, Math.min(1439, mins));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Evenly distribute `count` slots across [start, end]. */
export function distributeWaterSlots(count: number, start: string, end: string): string[] {
  const s = timeToMins(start);
  const e = timeToMins(end);
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const mins =
      count === 1
        ? Math.round((s + e) / 2)
        : Math.round(s + (i * (e - s)) / (count - 1));
    result.push(minsToTime(mins));
  }
  return result;
}

function addMins(t: string, plusMins: number): string {
  return minsToTime(timeToMins(t) + plusMins);
}

/** Compute the scheduled time for an engage channel. */
function engageTime(ch: NotifChannel, states: ChannelState[]): string {
  if (!ch.adaptsTo) return ch.defaultTime;
  const linked = states.find((s) => s.key === ch.adaptsTo);
  return addMins(linked?.time ?? ch.defaultTime, 30);
}

function parseTime(t: string): { hour: number; minute: number } {
  const [h = '0', m = '0'] = t.split(':');
  return { hour: parseInt(h, 10), minute: parseInt(m, 10) };
}

// ── Scheduling helpers ────────────────────────────────────────────────────────

async function scheduleOne(ch: NotifChannel, time: string): Promise<void> {
  const { hour, minute } = parseTime(time);
  const on: Record<string, number> = { hour, minute };
  if (ch.weekday !== undefined) on.weekday = ch.weekday;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ch.notifId,
          title: `${ch.emoji} ${ch.label}`,
          body: ch.body,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          schedule: { on: on as any, allowWhileIdle: true },
          channelId: ch.channelId,
        },
      ],
    });
  } catch {
    // no-op on web
  }
}

async function cancelOne(notifId: number): Promise<void> {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
  } catch {
    // no-op on web
  }
}

const WATER_BODIES = [
  "Time to drink some water \u2014 stay on top of your daily goal!",
  'Hydration check \u2014 how much have you had so far today?',
  "Don\u2019t forget to sip \u2014 your body will thank you.",
  'Water break! Log your intake in Patty.',
  'Keep it up \u2014 staying hydrated fuels everything you do.',
  'Mid-day hydration check \u2014 nearly at your goal?',
  "Almost there for today! One more glass and you\u2019re golden.",
  'Last water reminder for today \u2014 finish strong!',
];

async function scheduleWaterSlot(index: number, time: string): Promise<void> {
  const { hour, minute } = parseTime(time);
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: WATER_NOTIF_IDS[index]!,
          title: '\uD83D\uDCA7 Hydration check',
          body: WATER_BODIES[index % WATER_BODIES.length]!,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          schedule: { on: { hour, minute } as any, allowWhileIdle: true },
          channelId: 'patty-water',
        },
      ],
    });
  } catch {
    // no-op on web
  }
}

async function ensureChannels(): Promise<void> {
  try {
    for (const [id, name, description, sound] of ANDROID_CHANNELS_DEF) {
      await LocalNotifications.createChannel({
        id,
        name,
        description,
        importance: 3,
        visibility: 1,
        sound,
        vibration: true,
      });
    }
  } catch {
    // Only available on Android; ignore on other platforms
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function readAllSettings(): Promise<Record<string, string>> {
  const db = getDb();
  const result = await db.query(
    "SELECT key, value FROM settings WHERE key LIKE 'notif_%';",
    [],
  );
  const out: Record<string, string> = {};
  for (const row of result.values ?? []) out[row.key as string] = row.value as string;
  return out;
}

async function writeSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  await db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);', [key, value]);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [states, setStates] = useState<ChannelState[]>(
    CHANNELS.map((ch) => ({ key: ch.key, enabled: false, time: ch.defaultTime })),
  );
  const [waterFreq, setWaterFreqState] = useState<WaterFreqSettings>(WATER_DEFAULT);

  const [permStatus, setPermStatus] = useState<PermStatus>('unknown');
  const [loaded, setLoaded] = useState(false);

  // Ref so callbacks always read the latest states without stale closures
  const statesRef = useRef(states);
  useEffect(() => { statesRef.current = states; }, [states]);
  const waterFreqRef = useRef(waterFreq);
  useEffect(() => { waterFreqRef.current = waterFreq; }, [waterFreq]);

  // ── Initial load — re-schedules on every app open (handles Android reboot) ──
  useEffect(() => {
    (async () => {
      try {
        await ensureChannels();
        const settings = await readAllSettings();

        // Non-water channels
        const channelStates = CHANNELS.map((ch) => ({
          key: ch.key,
          enabled: settings[`notif_${ch.key}_enabled`] === 'true',
          time: settings[`notif_${ch.key}_time`] ?? ch.defaultTime,
        }));
        setStates(channelStates);

        // Water frequency settings
        const wCount = parseInt(settings['notif_water_count'] ?? '4', 10);
        const wStart = settings['notif_water_start'] ?? '07:00';
        const wEnd = settings['notif_water_end'] ?? '21:00';
        const wEnabled = settings['notif_water_enabled'] === 'true';
        const slotOverrides: (string | null)[] = Array(WATER_MAX_COUNT).fill(null);
        for (let i = 0; i < WATER_MAX_COUNT; i++) {
          const v = settings[`notif_water_slot_${i}_time`];
          if (v && v.length > 0) slotOverrides[i] = v;
        }
        const wf: WaterFreqSettings = {
          enabled: wEnabled,
          count: Number.isNaN(wCount) ? 4 : wCount,
          start: wStart,
          end: wEnd,
          slotOverrides,
        };
        setWaterFreqState(wf);

        // Permission check
        let granted = false;
        try {
          const perm = await LocalNotifications.checkPermissions();
          setPermStatus(perm.display as PermStatus);
          granted = perm.display === 'granted';
        } catch {
          setPermStatus('unknown');
        }

        if (granted) {
          // Functional channels (non-engage)
          for (const ch of CHANNELS.filter((c) => !c.adaptsTo)) {
            const st = channelStates.find((s) => s.key === ch.key);
            if (st?.enabled) {
              await cancelOne(ch.notifId);
              await scheduleOne(ch, st.time);
            }
          }
          // Engage channels — derive time from linked channel
          for (const ch of CHANNELS.filter((c) => c.adaptsTo)) {
            const st = channelStates.find((s) => s.key === ch.key);
            if (st?.enabled) {
              const t = engageTime(ch, channelStates);
              await cancelOne(ch.notifId);
              await scheduleOne(ch, t);
            }
          }
          // Water slots
          if (wEnabled) {
            const autoTimes = distributeWaterSlots(wf.count, wStart, wEnd);
            for (let i = 0; i < WATER_MAX_COUNT; i++) {
              await cancelOne(WATER_NOTIF_IDS[i]!);
              if (i < wf.count) {
                const t = slotOverrides[i] ?? autoTimes[i]!;
                await scheduleWaterSlot(i, t);
              }
            }
          } else {
            for (const id of WATER_NOTIF_IDS) await cancelOne(id);
          }
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

  // ── Toggle a single non-water channel ─────────────────────────────────
  const toggleChannel = useCallback(
    async (key: string, enabled: boolean) => {
      if (enabled && permStatus !== 'granted') {
        const ok = await requestPermission();
        if (!ok) return;
      }
      const ch = CHANNELS.find((c) => c.key === key);
      if (!ch) return;
      const st = statesRef.current.find((s) => s.key === key);
      if (!st) return;

      await writeSetting(`notif_${key}_enabled`, enabled ? 'true' : 'false');
      setStates((prev) => prev.map((s) => (s.key === key ? { ...s, enabled } : s)));

      if (enabled) {
        const t = ch.adaptsTo ? engageTime(ch, statesRef.current) : st.time;
        await scheduleOne(ch, t);
      } else {
        await cancelOne(ch.notifId);
      }
    },
    [permStatus, requestPermission],
  );

  /**
   * Update time for a non-water channel.
   * Cascades to any engage child that adaptsTo this key.
   */
  const setChannelTime = useCallback(async (key: string, time: string) => {
    const ch = CHANNELS.find((c) => c.key === key);
    if (!ch) return;
    const current = statesRef.current;
    const st = current.find((s) => s.key === key);
    if (!st) return;

    await writeSetting(`notif_${key}_time`, time);
    const next = current.map((s) => (s.key === key ? { ...s, time } : s));
    setStates(next);

    if (st.enabled) {
      await cancelOne(ch.notifId);
      await scheduleOne(ch, time);
    }

    // Cascade: reschedule any engage channel linked to this key
    for (const ech of CHANNELS.filter((c) => c.adaptsTo === key)) {
      const est = next.find((s) => s.key === ech.key);
      if (est?.enabled) {
        const derived = addMins(time, 30);
        await cancelOne(ech.notifId);
        await scheduleOne(ech, derived);
      }
    }
  }, []);

  // ── Water: toggle all slots ────────────────────────────────────────────
  const toggleWater = useCallback(
    async (enabled: boolean) => {
      if (enabled && permStatus !== 'granted') {
        const ok = await requestPermission();
        if (!ok) return;
      }
      await writeSetting('notif_water_enabled', enabled ? 'true' : 'false');
      setWaterFreqState((prev) => ({ ...prev, enabled }));

      const wf = waterFreqRef.current;
      if (enabled) {
        const autoTimes = distributeWaterSlots(wf.count, wf.start, wf.end);
        for (let i = 0; i < wf.count; i++) {
          const t = wf.slotOverrides[i] ?? autoTimes[i]!;
          await scheduleWaterSlot(i, t);
        }
      } else {
        for (const id of WATER_NOTIF_IDS) await cancelOne(id);
      }
    },
    [permStatus, requestPermission],
  );

  // ── Water: change frequency ───────────────────────────────────────────
  const setWaterCount = useCallback(async (count: number) => {
    const clamp = Math.max(WATER_MIN_COUNT, Math.min(WATER_MAX_COUNT, count));
    await writeSetting('notif_water_count', String(clamp));
    setWaterFreqState((prev) => ({ ...prev, count: clamp }));

    const wf = waterFreqRef.current;
    // Cancel slots no longer needed
    for (let i = clamp; i < WATER_MAX_COUNT; i++) await cancelOne(WATER_NOTIF_IDS[i]!);

    if (wf.enabled) {
      const autoTimes = distributeWaterSlots(clamp, wf.start, wf.end);
      for (let i = 0; i < clamp; i++) {
        const t = wf.slotOverrides[i] ?? autoTimes[i]!;
        await cancelOne(WATER_NOTIF_IDS[i]!);
        await scheduleWaterSlot(i, t);
      }
    }
  }, []);

  // ── Water: change day window (clears all overrides to re-distribute) ──
  const setWaterWindow = useCallback(async (start: string, end: string) => {
    await writeSetting('notif_water_start', start);
    await writeSetting('notif_water_end', end);
    const cleared: (string | null)[] = Array(WATER_MAX_COUNT).fill(null);
    for (let i = 0; i < WATER_MAX_COUNT; i++) {
      await writeSetting(`notif_water_slot_${i}_time`, '');
    }
    setWaterFreqState((prev) => ({ ...prev, start, end, slotOverrides: cleared }));

    const wf = waterFreqRef.current;
    if (wf.enabled) {
      const autoTimes = distributeWaterSlots(wf.count, start, end);
      for (let i = 0; i < wf.count; i++) {
        await cancelOne(WATER_NOTIF_IDS[i]!);
        await scheduleWaterSlot(i, autoTimes[i]!);
      }
    }
  }, []);

  // ── Water: override an individual slot ────────────────────────────────
  const setWaterSlotTime = useCallback(async (index: number, time: string) => {
    await writeSetting(`notif_water_slot_${index}_time`, time);
    setWaterFreqState((prev) => {
      const next = [...prev.slotOverrides];
      next[index] = time;
      return { ...prev, slotOverrides: next };
    });
    const wf = waterFreqRef.current;
    if (wf.enabled && index < wf.count) {
      await cancelOne(WATER_NOTIF_IDS[index]!);
      await scheduleWaterSlot(index, time);
    }
  }, []);

  // ── Water: reset to even spacing ──────────────────────────────────────
  const resetWaterSpacing = useCallback(async () => {
    const cleared: (string | null)[] = Array(WATER_MAX_COUNT).fill(null);
    for (let i = 0; i < WATER_MAX_COUNT; i++) {
      await writeSetting(`notif_water_slot_${i}_time`, '');
    }
    setWaterFreqState((prev) => ({ ...prev, slotOverrides: cleared }));

    const wf = waterFreqRef.current;
    if (wf.enabled) {
      const autoTimes = distributeWaterSlots(wf.count, wf.start, wf.end);
      for (let i = 0; i < wf.count; i++) {
        await cancelOne(WATER_NOTIF_IDS[i]!);
        await scheduleWaterSlot(i, autoTimes[i]!);
      }
    }
  }, []);

  // ── Enable / disable all ──────────────────────────────────────────────
  const enableAll = useCallback(async () => {
    if (permStatus !== 'granted') {
      const ok = await requestPermission();
      if (!ok) return;
    }
    const current = statesRef.current;
    for (const ch of CHANNELS.filter((c) => !c.adaptsTo)) {
      const st = current.find((s) => s.key === ch.key);
      await writeSetting(`notif_${ch.key}_enabled`, 'true');
      await scheduleOne(ch, st?.time ?? ch.defaultTime);
    }
    for (const ch of CHANNELS.filter((c) => c.adaptsTo)) {
      await writeSetting(`notif_${ch.key}_enabled`, 'true');
      await scheduleOne(ch, engageTime(ch, current));
    }
    setStates((prev) => prev.map((s) => ({ ...s, enabled: true })));

    const wf = waterFreqRef.current;
    await writeSetting('notif_water_enabled', 'true');
    const autoTimes = distributeWaterSlots(wf.count, wf.start, wf.end);
    for (let i = 0; i < wf.count; i++) {
      const t = wf.slotOverrides[i] ?? autoTimes[i]!;
      await scheduleWaterSlot(i, t);
    }
    setWaterFreqState((prev) => ({ ...prev, enabled: true }));
  }, [permStatus, requestPermission]);

  const disableAll = useCallback(async () => {
    for (const ch of CHANNELS) {
      await writeSetting(`notif_${ch.key}_enabled`, 'false');
      await cancelOne(ch.notifId);
    }
    setStates((prev) => prev.map((s) => ({ ...s, enabled: false })));
    await writeSetting('notif_water_enabled', 'false');
    for (const id of WATER_NOTIF_IDS) await cancelOne(id);
    setWaterFreqState((prev) => ({ ...prev, enabled: false }));
  }, []);

  // ── Derived helpers ────────────────────────────────────────────────────
  const totalEnabled =
    states.filter((s) => s.enabled).length + (waterFreq.enabled ? 1 : 0);
  const totalChannels = CHANNELS.length + 1; // +1 for water group
  const allEnabled = loaded && totalEnabled === totalChannels;
  const anyEnabled = totalEnabled > 0;

  /** Compute the effective scheduled time for an engage channel (for display). */
  const getEngageTime = useCallback((key: string): string => {
    const ch = CHANNELS.find((c) => c.key === key);
    if (!ch?.adaptsTo) return '';
    return engageTime(ch, statesRef.current);
  }, []);

  return {
    states,
    waterFreq,
    permStatus,
    loaded,
    allEnabled,
    anyEnabled,
    requestPermission,
    toggleChannel,
    setChannelTime,
    toggleWater,
    setWaterCount,
    setWaterWindow,
    setWaterSlotTime,
    resetWaterSpacing,
    enableAll,
    disableAll,
    getEngageTime,
  };
}
