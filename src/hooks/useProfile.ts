/**
 * useProfile — reads and writes user profile + app preferences
 * from the `settings` SQLite key-value table (migration v8).
 *
 * Profile keys:   profile_name, profile_dob, profile_sex,
 *                 profile_height_cm, profile_activity, profile_goal
 * Preference keys: pref_weight_unit, pref_water_goal_ml
 */

import { useEffect, useState, useCallback } from 'react';
import { getDb } from '../db/database';

// ── Types ────────────────────────────────────────────────────────────────────

export type Sex = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very';
export type Goal =
  | 'lose_weight'
  | 'maintain'
  | 'build_muscle'
  | 'improve_sleep'
  | 'general_wellness';
export type WeightUnit = 'kg' | 'lb';

export interface UserProfile {
  name: string;          // display name
  dob: string;           // ISO date string YYYY-MM-DD or ''
  sex: Sex | '';
  heightCm: number;      // 0 = not set
  activity: ActivityLevel | '';
  goal: Goal | '';
}

export interface UserPrefs {
  weightUnit: WeightUnit;
  waterGoalMl: number;
}

// ── Metric helpers (pure, exported for use in components) ────────────────────

export function ageFromDob(dob: string): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : 0;
}

export function computeBMI(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

export function bmiCategory(bmi: number): string {
  if (bmi <= 0) return '';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/** Mifflin-St Jeor BMR in kcal/day */
export function computeBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex | '',
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') return Math.round(base + 5);
  if (sex === 'female') return Math.round(base - 161);
  return Math.round(base - 78); // midpoint for 'other'
}

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

export function computeTDEE(bmr: number, activity: ActivityLevel | ''): number {
  if (bmr <= 0 || !activity) return 0;
  return Math.round(bmr * ACTIVITY_MULTIPLIER[activity]);
}

export function lbToKg(lb: number): number {
  return Math.round(lb * 45.359237) / 100;
}

export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

// ── DB helpers ────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: UserPrefs = {
  weightUnit: 'kg',
  waterGoalMl: 2000,
};

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  dob: '',
  sex: '',
  heightCm: 0,
  activity: '',
  goal: '',
};

async function readAll(): Promise<Record<string, string>> {
  const db = await getDb();
  const result = await db.query('SELECT key, value FROM settings;');
  const rows: Record<string, string> = {};
  for (const row of result.values ?? []) {
    rows[row.key] = row.value;
  }
  return rows;
}

async function upsert(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.run(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
    [key, value],
  );
}

function rowsToProfile(rows: Record<string, string>): UserProfile {
  return {
    name: rows['profile_name'] ?? '',
    dob: rows['profile_dob'] ?? '',
    sex: (rows['profile_sex'] as Sex) ?? '',
    heightCm: rows['profile_height_cm'] ? Number(rows['profile_height_cm']) : 0,
    activity: (rows['profile_activity'] as ActivityLevel) ?? '',
    goal: (rows['profile_goal'] as Goal) ?? '',
  };
}

function rowsToPrefs(rows: Record<string, string>): UserPrefs {
  return {
    weightUnit: (rows['pref_weight_unit'] as WeightUnit) ?? 'kg',
    waterGoalMl: rows['pref_water_goal_ml']
      ? Number(rows['pref_water_goal_ml'])
      : 2000,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await readAll();
        if (!cancelled) {
          setProfile(rowsToProfile(rows));
          setPrefs(rowsToPrefs(rows));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveProfile = useCallback(async (next: UserProfile) => {
    await upsert('profile_name', next.name);
    await upsert('profile_dob', next.dob);
    await upsert('profile_sex', next.sex);
    await upsert('profile_height_cm', String(next.heightCm));
    await upsert('profile_activity', next.activity);
    await upsert('profile_goal', next.goal);
    setProfile(next);
  }, []);

  const savePrefs = useCallback(async (next: UserPrefs) => {
    await upsert('pref_weight_unit', next.weightUnit);
    await upsert('pref_water_goal_ml', String(next.waterGoalMl));
    setPrefs(next);
  }, []);

  return { profile, prefs, loading, saveProfile, savePrefs };
}
