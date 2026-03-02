/* Dashboard — 2.8.0 */
import React, { useCallback, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonListHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';

import { useWeightLog } from '../hooks/useWeightLog';
import { useWaterLog } from '../hooks/useWaterLog';
import { useSleepLog } from '../hooks/useSleepLog';
import { useWorkoutLog, WorkoutEntry } from '../hooks/useWorkoutLog';
import { useProfile } from '../hooks/useProfile';
import { useHabits, HabitWithStats } from '../hooks/useHabits';
import { getDb } from '../db/database';
import { today, formatDuration } from '../track/trackUtils';
import SpeedDial from '../components/SpeedDial';

// ── Helpers ───────────────────────────────────────────────────────────────────
function salutation(name: string): string {
  const h = new Date().getHours();
  const base = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${base}, ${name.split(' ')[0]}` : base;
}

function buildDateRange(days: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const HEATMAP_DAYS = 14;

type HeatEvent = 'done' | 'relapse';
type HeatmapMap = Map<string, Map<string, HeatEvent>>; // habitId → date → event

// ── Component ─────────────────────────────────────────────────────────────────
const Home: React.FC = () => {
  const history = useHistory();
  const { latestEntry, reload: reloadWeight } = useWeightLog();
  const { todayTotal, dailyGoal, loading: waterLoading, reload: reloadWater } = useWaterLog();
  const { lastNightEntry, reload: reloadSleep } = useSleepLog();
  const { todayEntries: todayWorkouts } = useWorkoutLog();
  const { profile, reload: reloadProfile } = useProfile();
  const { habits, reload: reloadHabits } = useHabits();

  const [heatmap, setHeatmap] = useState<HeatmapMap>(new Map());

  const loadHeatmap = useCallback(async () => {
    const oldest = buildDateRange(HEATMAP_DAYS)[0];
    try {
      const db = getDb();
      const compRes = await db.query(
        `SELECT habit_id, date FROM habit_completions WHERE date >= ?;`,
        [oldest]
      );
      const relRes = await db.query(
        `SELECT habit_id, date FROM habit_relapses WHERE date >= ?;`,
        [oldest]
      );
      const map: HeatmapMap = new Map();
      for (const r of compRes.values ?? []) {
        const hId = r.habit_id as string;
        if (!map.has(hId)) map.set(hId, new Map());
        map.get(hId)!.set(r.date as string, 'done');
      }
      for (const r of relRes.values ?? []) {
        const hId = r.habit_id as string;
        if (!map.has(hId)) map.set(hId, new Map());
        map.get(hId)!.set(r.date as string, 'relapse');
      }
      setHeatmap(map);
    } catch { /* silent */ }
  }, []);

  useIonViewWillEnter(() => {
    reloadWeight();
    reloadWater();
    reloadSleep();
    reloadProfile();
    reloadHabits();
    loadHeatmap();
  });

  // ── Derived values ─────────────────────────────────────────────────────────
  const todayDate = today();
  const waterPct = dailyGoal > 0 ? todayTotal / dailyGoal : 0;

  const workoutSessions = todayWorkouts.length;
  const workoutMinutes = useMemo(
    () => Math.round(todayWorkouts.reduce((s, e: WorkoutEntry) => s + (e.duration_sec ?? 0), 0) / 60),
    [todayWorkouts]
  );

  const goodHabits = habits.filter((h: HabitWithStats) => h.type === 'good');
  const habitsDone = goodHabits.filter((h: HabitWithStats) => h.stats.todayActed).length;
  const habitsTotal = goodHabits.length;

  const bestStreak = useMemo(
    () => habits.reduce((acc: number, h: HabitWithStats) => Math.max(acc, h.stats.currentStreak), 0),
    [habits]
  );

  const insightLine = useMemo(() => {
    const daysSinceWeight = latestEntry
      ? Math.round((Date.now() - new Date(latestEntry.date + 'T00:00:00').getTime()) / 86_400_000)
      : 999;
    if (daysSinceWeight >= 4) return `⚖️ Weight not logged in ${daysSinceWeight} days`;
    if (dailyGoal > 0 && todayTotal >= dailyGoal) return `💧 Water goal reached — keep it up!`;
    if (lastNightEntry && lastNightEntry.duration_min >= 7 * 60)
      return `😴 Great sleep last night — ${formatDuration(lastNightEntry.duration_min)}`;
    if (habitsTotal > 0 && habitsDone === habitsTotal) return `✓ All habits done today — you're on a roll!`;
    if (habitsTotal > 0 && habitsDone < habitsTotal)
      return `${habitsTotal - habitsDone} habit${habitsTotal - habitsDone !== 1 ? 's' : ''} left today.`;
    return `Track your day and build your streaks.`;
  }, [latestEntry, dailyGoal, todayTotal, lastNightEntry, habitsTotal, habitsDone]);

  const heatmapDates = useMemo(() => buildDateRange(HEATMAP_DAYS), []);

  // ── Speed dial deep-link handler ───────────────────────────────────────────
  const handleQuickAdd = useCallback((target: 'water' | 'weight' | 'food' | 'workout') => {
    sessionStorage.setItem('patty_track_tab_request', target);
    history.push('/tabs/track');
  }, [history]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Patty</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/tabs/profile')}>
              <IonIcon
                icon={personCircleOutline}
                style={{ fontSize: 26, color: 'var(--md-on-surface-variant)' }}
              />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Patty</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* ── Greeting ────────────────────────────────────────────────── */}
        <div style={{ padding: '20px 20px 4px' }}>
          <p style={{
            margin: 0,
            fontSize: 'var(--md-headline-sm)',
            fontFamily: 'var(--md-font)',
            fontWeight: 600,
            color: 'var(--md-on-surface)',
            lineHeight: 1.25,
          }}>
            {salutation(profile.name)}
          </p>
          <p style={{
            margin: '4px 0 0',
            fontSize: 'var(--md-body-md)',
            fontFamily: 'var(--md-font)',
            color: 'var(--md-on-surface-variant)',
          }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {habitsTotal > 0 && (
            <p style={{
              margin: '10px 0 0',
              fontSize: 'var(--md-label-lg)',
              fontFamily: 'var(--md-font)',
              color: 'var(--md-primary)',
              fontWeight: 500,
            }}>
              {bestStreak > 0 ? `🔥 ${bestStreak}-day streak · ` : ''}{habitsDone}/{habitsTotal} habits done
            </p>
          )}
        </div>

        {/* ── Today's Progress ────────────────────────────────────────── */}
        <IonCard style={{ margin: '16px 16px 0' }}>
          <IonListHeader style={{ paddingTop: 16, paddingBottom: 4 }}>Today</IonListHeader>
          <IonCardContent style={{ padding: '8px 16px 16px' }}>

            {/* Water */}
            <div className="hd-progress-row">
              <span className="hd-progress-icon">💧</span>
              <span className="hd-progress-label">Water</span>
              <div className="hd-progress-bar-wrap">
                <div
                  className="hd-progress-bar-fill"
                  style={{ width: `${Math.min(Math.round(waterPct * 100), 100)}%` }}
                />
              </div>
              <span className="hd-progress-value">
                {waterLoading ? '…' : `${(todayTotal / 1000).toFixed(1)}L`}
              </span>
            </div>

            {/* Sleep */}
            <div className="hd-progress-row">
              <span className="hd-progress-icon">😴</span>
              <span className="hd-progress-label">Sleep</span>
              <div className="hd-progress-bar-wrap hd-progress-bar-wrap--empty" />
              <span className="hd-progress-value">
                {lastNightEntry ? formatDuration(lastNightEntry.duration_min) : '—'}
              </span>
            </div>

            {/* Weight */}
            <div className="hd-progress-row">
              <span className="hd-progress-icon">⚖️</span>
              <span className="hd-progress-label">Weight</span>
              <div className="hd-progress-bar-wrap hd-progress-bar-wrap--empty" />
              <span className="hd-progress-value">
                {latestEntry ? `${latestEntry.value} ${latestEntry.unit}` : '—'}
              </span>
            </div>

            {/* Workout */}
            <div className="hd-progress-row hd-progress-row--last">
              <span className="hd-progress-icon">🏃</span>
              <span className="hd-progress-label">Workout</span>
              <div className="hd-progress-bar-wrap hd-progress-bar-wrap--empty" />
              <span className="hd-progress-value">
                {workoutSessions > 0 ? `${workoutSessions} · ${workoutMinutes}m` : 'Rest day'}
              </span>
            </div>

          </IonCardContent>
        </IonCard>

        {/* ── Habit Heatmap ────────────────────────────────────────────── */}
        <IonCard style={{ margin: '12px 16px 0' }}>
          <IonListHeader style={{ paddingTop: 16, paddingBottom: 4 }}>Habit Activity</IonListHeader>
          <IonCardContent style={{ padding: '8px 12px 16px' }}>

            {habits.length === 0 ? (
              /* Empty state */
              <div
                style={{ textAlign: 'center', padding: '20px 0 8px' }}
                onClick={() => history.push('/tabs/habits')}
              >
                <p style={{ fontSize: 32, margin: '0 0 8px' }}>🔥</p>
                <p style={{
                  margin: '0 0 4px',
                  fontFamily: 'var(--md-font)',
                  fontSize: 'var(--md-body-md)',
                  fontWeight: 500,
                  color: 'var(--md-on-surface)',
                }}>No habits yet</p>
                <p style={{
                  margin: 0,
                  fontFamily: 'var(--md-font)',
                  fontSize: 'var(--md-body-sm)',
                  color: 'var(--md-primary)',
                }}>Tap to add your first habit →</p>
              </div>
            ) : (
              <>
                {/* Day-of-week header row */}
                <div style={{ display: 'flex', marginBottom: 6, paddingLeft: 82 }}>
                  {heatmapDates.map(d => (
                    <div
                      key={d}
                      style={{
                        width: 14,
                        marginRight: 3,
                        textAlign: 'center',
                        fontSize: 9,
                        fontFamily: 'var(--md-font)',
                        fontWeight: d === todayDate ? 700 : 400,
                        color: d === todayDate ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
                      }}
                    >
                      {DAY_LABELS[new Date(d + 'T00:00:00').getDay()]}
                    </div>
                  ))}
                </div>

                {/* One row per habit */}
                {habits.map((habit: HabitWithStats) => {
                  const habitEvents = heatmap.get(habit.id) ?? new Map<string, HeatEvent>();
                  return (
                    <div key={habit.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                      {/* Habit label */}
                      <div style={{
                        width: 82,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        overflow: 'hidden',
                        paddingRight: 4,
                      }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{habit.emoji}</span>
                        <span style={{
                          fontSize: 10,
                          fontFamily: 'var(--md-font)',
                          color: 'var(--md-on-surface-variant)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {habit.name}
                        </span>
                      </div>

                      {/* Date cells */}
                      {heatmapDates.map(d => {
                        const event = habitEvents.get(d);
                        const isToday = d === todayDate;
                        let bg = 'var(--md-surface-variant)';
                        let opacity = 0.45;
                        if (event === 'done') { bg = habit.colour; opacity = 1; }
                        else if (event === 'relapse') { bg = '#CF6679'; opacity = 1; }
                        return (
                          <div
                            key={d}
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 3,
                              background: bg,
                              opacity,
                              marginRight: 3,
                              flexShrink: 0,
                              outline: isToday ? '2px solid var(--md-outline)' : 'none',
                              outlineOffset: 1,
                            }}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </>
            )}

          </IonCardContent>
        </IonCard>

        {/* ── Insight line ─────────────────────────────────────────────── */}
        <p style={{
          margin: '16px 20px 0',
          fontSize: 'var(--md-body-md)',
          fontFamily: 'var(--md-font)',
          color: 'var(--md-on-surface-variant)',
          textAlign: 'center',
          fontStyle: 'italic',
        }}>
          {insightLine}
        </p>

        {/* Bottom space for FAB */}
        <div style={{ height: 100 }} />
      </IonContent>

      {/* ── Animated Speed Dial FAB ─────────────────────────────────────── */}
      <SpeedDial onSelect={handleQuickAdd} />
    </IonPage>
  );
};

export default Home;
