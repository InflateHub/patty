/**
 * useAchievementCards
 *
 * Computes the content data for Daily / Weekly / Monthly / Yearly shareable cards.
 * All queries run directly against SQLite.
 */
import { useCallback, useEffect, useState } from 'react';
import { getDb } from '../db/database';

// ── Types ───────────────────────────────────────────────────────────────────

export interface HabitRingDay {
  dateLabel: string;  // 'Mon', 'Tue', etc.
  date: string;       // ISO
  isToday: boolean;
  weight: boolean;
  water: boolean;
  sleep: boolean;
  food: boolean;
}

export interface DailyCard {
  dateLabel: string;         // 'Sunday, Feb 22'
  streak: number;
  weight: boolean;
  water: boolean;
  sleep: boolean;
  food: boolean;
  waterMl: number;
  waterGoalMl: number;
  weightValue: number | null;
  weightUnit: string;
  headline: string;          // e.g. "Nailed your water goal today! 💧"
}

export interface WeeklyCard {
  weekLabel: string;         // 'Feb 16 – Feb 22'
  weightOf7: number;         // days logged
  waterOf7: number;
  sleepOf7: number;
  foodOf7: number;
  weightDeltaKg: number | null;
  weightDeltaUnit: string;
  perfectWater: boolean;
  headline: string;
}

export interface MonthlyCard {
  monthLabel: string;        // 'February 2026'
  weightLogs: number;
  waterGoalDays: number;
  sleepLogs: number;
  foodLogs: number;
  weightDeltaKg: number | null;
  weightDeltaUnit: string;
  bestStreak: number;
  headline: string;
}

export interface YearlyCard {
  yearLabel: string;         // '2026'
  totalWeighIns: number;
  totalWaterL: number;
  totalSleepNights: number;
  totalMeals: number;
  weightDelta: number | null;
  weightDeltaUnit: string;
  levelName: string;
  xpEarned: number;
  badgesEarned: number;
  headline: string;
}

export interface AchievementCardsData {
  habitRing: HabitRingDay[];    // last 7 days
  daily: DailyCard;
  weekly: WeeklyCard;
  monthly: MonthlyCard;
  yearly: YearlyCard;
  loading: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function isoYear(): string {
  return new Date().getFullYear().toString();
}

function isoMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function isoWeekStart(): string {
  return isoDate(-6);
}

function fmtMonthLabel(): string {
  return new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function fmtWeekLabel(): string {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const end = new Date();
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(start)} \u2013 ${fmt(end)}`;
}

function fmtDayLabel(): string {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAchievementCards(): AchievementCardsData & { reload: () => void } {
  const empty: AchievementCardsData = {
    habitRing: [],
    daily: {
      dateLabel: fmtDayLabel(),
      streak: 0,
      weight: false,
      water: false,
      sleep: false,
      food: false,
      waterMl: 0,
      waterGoalMl: 2000,
      weightValue: null,
      weightUnit: 'kg',
      headline: '',
    },
    weekly: {
      weekLabel: fmtWeekLabel(),
      weightOf7: 0,
      waterOf7: 0,
      sleepOf7: 0,
      foodOf7: 0,
      weightDeltaKg: null,
      weightDeltaUnit: 'kg',
      perfectWater: false,
      headline: '',
    },
    monthly: {
      monthLabel: fmtMonthLabel(),
      weightLogs: 0,
      waterGoalDays: 0,
      sleepLogs: 0,
      foodLogs: 0,
      weightDeltaKg: null,
      weightDeltaUnit: 'kg',
      bestStreak: 0,
      headline: '',
    },
    yearly: {
      yearLabel: isoYear(),
      totalWeighIns: 0,
      totalWaterL: 0,
      totalSleepNights: 0,
      totalMeals: 0,
      weightDelta: null,
      weightDeltaUnit: 'kg',
      levelName: 'Seedling',
      xpEarned: 0,
      badgesEarned: 0,
      headline: '',
    },
    loading: true,
  };

  const [data, setData] = useState<AchievementCardsData>(empty);

  const compute = useCallback(async () => {
    try {
      const db = getDb();
      const today = isoDate(0);
      const weekStart = isoWeekStart();
      const monthStart = isoMonthStart();
      const yearStart = `${isoYear()}-01-01`;

      // ── Water goal ──────────────────────────────────────────────────────────
      const goalRes = await db.query(`SELECT value FROM settings WHERE key = 'water_goal_ml';`);
      const waterGoalMl = goalRes.values?.[0]?.value
        ? parseInt(goalRes.values[0].value as string, 10)
        : 2000;

      // ── 7-day dates ─────────────────────────────────────────────────────────
      const last7: string[] = [];
      for (let i = 6; i >= 0; i--) last7.push(isoDate(-i));

      // ── Weight (last 7 / month / year) ──────────────────────────────────────
      const wRes = await db.query(
        `SELECT date, value, unit FROM weight_entries
         WHERE date >= ? ORDER BY date ASC, id ASC;`,
        [weekStart]
      );
      const wRows7 = wRes.values ?? [];

      const wMonthRes = await db.query(
        `SELECT date, value, unit FROM weight_entries
         WHERE date >= ? ORDER BY date ASC, id ASC;`,
        [monthStart]
      );
      const wMonth = wMonthRes.values ?? [];

      const wYearRes = await db.query(
        `SELECT date, value, unit FROM weight_entries
         WHERE date >= ? ORDER BY date ASC, id ASC;`,
        [yearStart]
      );
      const wYear = wYearRes.values ?? [];

      // Today weight
      const wToday = wRows7.filter((r: Record<string, unknown>) => r.date === today);
      const todayWeightValue = wToday.length > 0 ? (wToday[wToday.length - 1].value as number) : null;
      const weightUnit = wToday.length > 0 ? (wToday[wToday.length - 1].unit as string) : 'kg';

      // Days logged in last 7
      const wDates7 = new Set(wRows7.map((r: Record<string, unknown>) => r.date as string));
      const weightOf7 = last7.filter(d => wDates7.has(d)).length;

      // Month delta
      const wMonthDelta =
        wMonth.length >= 2
          ? (wMonth[wMonth.length - 1].value as number) - (wMonth[0].value as number)
          : null;
      const wMonthUnit = wMonth.length > 0 ? (wMonth[0].unit as string) : 'kg';

      // Year delta
      const wYearDelta =
        wYear.length >= 2
          ? (wYear[wYear.length - 1].value as number) - (wYear[0].value as number)
          : null;
      const wYearUnit = wYear.length > 0 ? (wYear[0].unit as string) : 'kg';

      // Week delta
      const wWeekDelta =
        wRows7.length >= 2
          ? (wRows7[wRows7.length - 1].value as number) - (wRows7[0].value as number)
          : null;
      const wWeekUnit = wRows7.length > 0 ? (wRows7[0].unit as string) : 'kg';

      // ── Water (last 7 / month / year) ───────────────────────────────────────
      const waterRes = await db.query(
        `SELECT date, SUM(amount_ml) as total FROM water_entries
         WHERE date >= ? GROUP BY date;`,
        [weekStart]
      );
      const waterRows7 = waterRes.values ?? [];
      const waterByDate = new Map<string, number>(
        waterRows7.map((r: Record<string, unknown>) => [r.date as string, r.total as number])
      );
      const waterOf7 = last7.filter(d => (waterByDate.get(d) ?? 0) > 0).length;
      const todayWaterMl = waterByDate.get(today) ?? 0;
      const waterGoalDays7 = last7.filter(d => (waterByDate.get(d) ?? 0) >= waterGoalMl).length;

      const waterMonthRes = await db.query(
        `SELECT SUM(amount_ml) as total FROM water_entries WHERE date >= ?;`,
        [monthStart]
      );
      const waterMonthGoalRes = await db.query(
        `SELECT COUNT(*) as cnt FROM (
          SELECT date FROM water_entries WHERE date >= ?
          GROUP BY date HAVING SUM(amount_ml) >= ?
         );`,
        [monthStart, waterGoalMl]
      );
      const waterMonthGoalDays = (waterMonthGoalRes.values?.[0]?.cnt as number) ?? 0;

      const waterYearRes = await db.query(
        `SELECT SUM(amount_ml) as total FROM water_entries WHERE date >= ?;`,
        [yearStart]
      );
      const totalWaterL = Math.round(((waterYearRes.values?.[0]?.total as number) ?? 0) / 1000);

      // ── Sleep (last 7 / month / year) ───────────────────────────────────────
      const sleepRes = await db.query(
        `SELECT date FROM sleep_entries WHERE date >= ?;`, [weekStart]
      );
      const sleepDates7 = new Set((sleepRes.values ?? []).map((r: Record<string, unknown>) => r.date as string));
      const sleepOf7 = last7.filter(d => sleepDates7.has(d)).length;

      const sleepMonthRes = await db.query(
        `SELECT COUNT(*) as cnt FROM sleep_entries WHERE date >= ?;`, [monthStart]
      );
      const sleepMonthLogs = (sleepMonthRes.values?.[0]?.cnt as number) ?? 0;

      const sleepYearRes = await db.query(
        `SELECT COUNT(*) as cnt FROM sleep_entries WHERE date >= ?;`, [yearStart]
      );
      const totalSleepNights = (sleepYearRes.values?.[0]?.cnt as number) ?? 0;

      // ── Food (last 7 / month / year) ────────────────────────────────────────
      const foodRes = await db.query(
        `SELECT date FROM food_entries WHERE date >= ?;`, [weekStart]
      );
      const foodDates7 = new Set((foodRes.values ?? []).map((r: Record<string, unknown>) => r.date as string));
      const foodOf7 = last7.filter(d => foodDates7.has(d)).length;
      const todayFood = foodDates7.has(today);

      const foodMonthRes = await db.query(
        `SELECT COUNT(*) as cnt FROM food_entries WHERE date >= ?;`, [monthStart]
      );
      const foodMonthLogs = (foodMonthRes.values?.[0]?.cnt as number) ?? 0;

      const foodYearRes = await db.query(
        `SELECT COUNT(*) as cnt FROM food_entries WHERE date >= ?;`, [yearStart]
      );
      const totalMeals = (foodYearRes.values?.[0]?.cnt as number) ?? 0;

      // ── Streak (all tables union) ────────────────────────────────────────────
      const allWeightDates = (await db.query(
        `SELECT DISTINCT date FROM weight_entries;`
      )).values?.map((r: Record<string, unknown>) => r.date as string) ?? [];
      const allWaterDates = (await db.query(
        `SELECT DISTINCT date FROM water_entries;`
      )).values?.map((r: Record<string, unknown>) => r.date as string) ?? [];
      const allSleepDates = (await db.query(
        `SELECT DISTINCT date FROM sleep_entries;`
      )).values?.map((r: Record<string, unknown>) => r.date as string) ?? [];

      const allDates = Array.from(new Set([...allWeightDates, ...allWaterDates, ...allSleepDates])).sort();
      // Best streak in month
      const monthDates = allDates.filter(d => d >= monthStart);
      let bestMonthStreak = 0;
      let run = 0;
      for (let i = 0; i < monthDates.length; i++) {
        if (i === 0) { run = 1; continue; }
        const gap = (new Date(monthDates[i]).getTime() - new Date(monthDates[i - 1]).getTime()) / 86_400_000;
        if (gap === 1) { run++; } else { if (run > bestMonthStreak) bestMonthStreak = run; run = 1; }
      }
      if (run > bestMonthStreak) bestMonthStreak = run;

      // Overall current streak
      const sortedDesc = [...allDates].sort((a, b) => b.localeCompare(a));
      let currentStreak = 0;
      const newest = sortedDesc[0];
      if (newest) {
        const gapDays = Math.round((new Date(today).getTime() - new Date(newest).getTime()) / 86_400_000);
        if (gapDays <= 1) {
          currentStreak = 1;
          for (let i = 1; i < sortedDesc.length; i++) {
            const gap = Math.round((new Date(sortedDesc[i - 1]).getTime() - new Date(sortedDesc[i]).getTime()) / 86_400_000);
            if (gap === 1) currentStreak++;
            else break;
          }
        }
      }

      // ── Weight year logs ─────────────────────────────────────────────────────
      const totalWeighIns = wYear.length;

      // ── XP year estimate ─────────────────────────────────────────────────────
      const xpYear = totalWeighIns * 10 +
        (Number((waterMonthGoalRes.values?.[0]?.cnt ?? 0)) * 10) +
        totalSleepNights * 5 +
        totalMeals * 2;

      // ── Habit ring ───────────────────────────────────────────────────────────
      const habitRing: HabitRingDay[] = last7.map(date => {
        const jsDate = new Date(date);
        return {
          dateLabel: DAY_SHORT[jsDate.getDay()],
          date,
          isToday: date === today,
          weight: wDates7.has(date),
          water: (waterByDate.get(date) ?? 0) > 0,
          sleep: sleepDates7.has(date),
          food: foodDates7.has(date),
        };
      });

      // ── Headlines ────────────────────────────────────────────────────────────
      const dailyDone = [wDates7.has(today), todayWaterMl > 0, sleepDates7.has(today), todayFood].filter(Boolean).length;
      let dailyHeadline = '';
      if (todayWaterMl >= waterGoalMl) dailyHeadline = 'Nailed your water goal today! \uD83D\uDCA7';
      else if (dailyDone === 4) dailyHeadline = 'Perfect day — all 4 habits logged! \uD83C\uDF1F';
      else if (dailyDone === 0) dailyHeadline = 'Your streak is waiting — start today \uD83D\uDCAA';
      else dailyHeadline = `${dailyDone}/4 habits logged today`;

      let weeklyHeadline = '';
      if (waterGoalDays7 === 7) weeklyHeadline = 'Perfect water week! \uD83D\uDCA7';
      else if (wWeekDelta !== null && wWeekDelta < 0) weeklyHeadline = `Down ${Math.abs(wWeekDelta).toFixed(1)} ${wWeekUnit} this week \uD83D\uDCC9`;
      else if (wWeekDelta !== null && wWeekDelta > 0) weeklyHeadline = `Up ${wWeekDelta.toFixed(1)} ${wWeekUnit} this week`;
      else weeklyHeadline = `${weightOf7 + waterOf7 + sleepOf7 + foodOf7} habit entries this week`;

      let monthlyHeadline = '';
      if (wMonthDelta !== null && wMonthDelta < 0) monthlyHeadline = `Down ${Math.abs(wMonthDelta).toFixed(1)} ${wMonthUnit} this month! \uD83C\uDF89`;
      else monthlyHeadline = `${bestMonthStreak}-day best streak in ${fmtMonthLabel()}`;

      let yearlyHeadline = '';
      if (wYearDelta !== null && wYearDelta < 0) yearlyHeadline = `Lost ${Math.abs(wYearDelta).toFixed(1)} ${wYearUnit} this year! \uD83D\uDD25`;
      else yearlyHeadline = `${totalWeighIns} weigh-ins logged in ${isoYear()}`;

      // ── Level name (simple recompute) ────────────────────────────────────────
      const allXp = totalWeighIns * 10;
      const levelName =
        allXp >= 1500 ? 'Legend' :
        allXp >= 700  ? 'Champion' :
        allXp >= 300  ? 'Achiever' :
        allXp >= 100  ? 'Sprout' : 'Seedling';

      setData({
        habitRing,
        daily: {
          dateLabel: fmtDayLabel(),
          streak: currentStreak,
          weight: wDates7.has(today),
          water: todayWaterMl > 0,
          sleep: sleepDates7.has(today),
          food: todayFood,
          waterMl: todayWaterMl,
          waterGoalMl,
          weightValue: todayWeightValue,
          weightUnit,
          headline: dailyHeadline,
        },
        weekly: {
          weekLabel: fmtWeekLabel(),
          weightOf7,
          waterOf7,
          sleepOf7,
          foodOf7,
          weightDeltaKg: wWeekDelta,
          weightDeltaUnit: wWeekUnit,
          perfectWater: waterGoalDays7 === 7,
          headline: weeklyHeadline,
        },
        monthly: {
          monthLabel: fmtMonthLabel(),
          weightLogs: wMonth.length,
          waterGoalDays: waterMonthGoalDays,
          sleepLogs: sleepMonthLogs,
          foodLogs: foodMonthLogs,
          weightDeltaKg: wMonthDelta,
          weightDeltaUnit: wMonthUnit,
          bestStreak: bestMonthStreak,
          headline: monthlyHeadline,
        },
        yearly: {
          yearLabel: isoYear(),
          totalWeighIns,
          totalWaterL,
          totalSleepNights,
          totalMeals,
          weightDelta: wYearDelta,
          weightDeltaUnit: wYearUnit,
          levelName,
          xpEarned: xpYear,
          badgesEarned: 0, // filled by Progress component from gamification hook
          headline: yearlyHeadline,
        },
        loading: false,
      });
    } catch (err) {
      console.error('useAchievementCards error:', err);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    compute();
  }, [compute]);

  return { ...data, loading: data.loading, reload: compute };
}
