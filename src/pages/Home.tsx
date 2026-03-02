/* Dashboard — 2.0.0 */
import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { personCircleOutline, notificationsOutline, trophyOutline } from 'ionicons/icons';

import { useWeightLog } from '../hooks/useWeightLog';
import { useWaterLog } from '../hooks/useWaterLog';
import { useSleepLog } from '../hooks/useSleepLog';
import { useFoodLog } from '../hooks/useFoodLog';
import { useProfile, computeBMI, bmiCategory, computeBMR, computeTDEE, ageFromDob } from '../hooks/useProfile';
import { WaterRing } from '../components/WaterRing';
import { WeightChart } from '../components/WeightChart';
import { today, formatDuration } from '../track/trackUtils';

function salutation(name: string): string {
  const h = new Date().getHours();
  const base = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${base}, ${name.split(' ')[0]}` : base;
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

const secHdr: React.CSSProperties = { paddingTop: 16, paddingBottom: 4 };

const Home: React.FC = () => {
  const history = useHistory();
  const { entries: weightEntries, latestEntry, reload: reloadWeight } = useWeightLog();
  const { todayTotal, dailyGoal, loading: waterLoading, reload: reloadWater } = useWaterLog();
  const { lastNightEntry, reload: reloadSleep } = useSleepLog();
  const { entries: foodEntries, reload: reloadFood } = useFoodLog();
  const { profile, reload: reloadProfile } = useProfile();

  useIonViewWillEnter(() => {
    reloadWeight();
    reloadWater();
    reloadSleep();
    reloadFood();
    reloadProfile();
  });

  const weightKg = latestEntry
    ? latestEntry.unit === 'lbs'
      ? latestEntry.value / 2.20462
      : latestEntry.value
    : 0;
  const bmi = computeBMI(weightKg, profile.heightCm);
  const bmiCat = bmiCategory(bmi);
  const age = ageFromDob(profile.dob);
  const bmr = computeBMR(weightKg, profile.heightCm, age, profile.sex);
  const tdee = computeTDEE(bmr, profile.activity);
  const hasWeight = weightKg > 0;

  const todayDate = today();

  // Last 7 weight entries (already sorted DESC by date), reversed for chart
  const miniChartEntries = useMemo(() => weightEntries.slice(0, 7), [weightEntries]);

  const todayFoodCounts = useMemo(() => {
    const todayFood = foodEntries.filter(e => e.date === todayDate);
    return {
      breakfast: todayFood.filter(e => e.meal === 'breakfast').length,
      lunch: todayFood.filter(e => e.meal === 'lunch').length,
      dinner: todayFood.filter(e => e.meal === 'dinner').length,
      snack: todayFood.filter(e => e.meal === 'snack').length,
    };
  }, [foodEntries, todayDate]);

  const waterPct = dailyGoal > 0 ? Math.round((todayTotal / dailyGoal) * 100) : 0;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Patty</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/tabs/notifications')}>
              <IonIcon icon={notificationsOutline} style={{ fontSize: 24, color: 'var(--md-on-surface-variant)' }} />
            </IonButton>
            <IonButton onClick={() => history.push('/tabs/achievements')}>
              <IonIcon icon={trophyOutline} style={{ fontSize: 22, color: 'var(--md-on-surface-variant)' }} />
            </IonButton>
            <IonButton onClick={() => history.push('/tabs/profile')}>
              <IonIcon icon={personCircleOutline} style={{ fontSize: 26, color: 'var(--md-on-surface-variant)' }} />
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

        {/* ── Greeting ────────────────────────────────── */}
        <div className="md-greeting">
          <p className="md-greeting__title">{salutation(profile.name)}</p>
          <p className="md-greeting__sub">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* ── At-a-glance stats row ───────────────────── */}
        <IonCard>
          <IonCardContent style={{ padding: '16px 4px' }}>
            <IonGrid style={{ padding: 0 }}>
              <IonRow style={{ textAlign: 'center' }}>
                {/* Weight */}
                <IonCol>
                  <p className="md-stat-value">
                    {latestEntry ? `${latestEntry.value} ${latestEntry.unit}` : '\u2014'}
                  </p>
                  <p className="md-stat-label">Weight</p>
                </IonCol>
                {/* Divider */}
                <IonCol style={{ borderLeft: '1px solid var(--md-outline-variant)', borderRight: '1px solid var(--md-outline-variant)' }}>
                  <p className="md-stat-value">{waterLoading ? '\u2026' : `${waterPct}%`}</p>
                  <p className="md-stat-label">Water</p>
                </IonCol>
                {/* Sleep */}
                <IonCol>
                  <p className="md-stat-value">
                    {lastNightEntry ? formatDuration(lastNightEntry.duration_min) : '\u2014'}
                  </p>
                  <p className="md-stat-label">Sleep</p>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* ── Water ring ──────────────────────────────── */}
        <IonCard>
          <IonListHeader style={secHdr}>Water Today</IonListHeader>
          <IonCardContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 16px 20px' }}>
            <WaterRing total={todayTotal} goal={dailyGoal} size={160} />
          </IonCardContent>
        </IonCard>

        {/* ── Weight mini-chart ───────────────────────── */}
        <IonCard>
          <IonListHeader style={secHdr}>Weight Trend</IonListHeader>
          <IonCardContent style={{ padding: '8px 8px 16px' }}>
            <WeightChart entries={miniChartEntries} />
          </IonCardContent>
        </IonCard>

        {/* ── Your Metrics ────────────────────────────── */}
        <IonCard>
          <IonListHeader style={secHdr}>Your Metrics</IonListHeader>
          <IonCardContent style={{ padding: '8px 16px 16px' }}>
            {!hasWeight ? (
              <p style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-md)', color: 'var(--md-on-surface-variant)', margin: 0, textAlign: 'center', padding: '8px 0' }}>
                Log your weight in the Track tab to see your metrics.
              </p>
            ) : (
              <>
                {/* Weight */}
                <div className="md-metric-row">
                  <span className="md-metric-label">Weight</span>
                  <span className="md-metric-value">{latestEntry!.value} {latestEntry!.unit}</span>
                </div>

                {/* BMI — needs height */}
                {bmi > 0 ? (
                  <div className="md-metric-row">
                    <span className="md-metric-label">BMI</span>
                    <span className="md-metric-value">
                      {bmi.toFixed(1)}
                      {bmiCat && (
                        <span style={{
                          display: 'inline-block', marginLeft: 8, padding: '2px 10px',
                          borderRadius: 'var(--md-shape-full)',
                          background: ({ Underweight: '#5bcaff', Normal: 'var(--md-primary)', Overweight: '#f5a623', Obese: '#e74c3c' } as Record<string,string>)[bmiCat] ?? 'var(--md-surface-variant)',
                          color: '#fff', fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', fontWeight: 600, verticalAlign: 'middle',
                        }}>{bmiCat}</span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="md-metric-row">
                    <span className="md-metric-label">BMI</span>
                    <span style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)', fontStyle: 'italic' }}>Add height in profile</span>
                  </div>
                )}

                {/* BMR */}
                {bmr > 0 ? (
                  <div className="md-metric-row">
                    <span className="md-metric-label">BMR</span>
                    <span className="md-metric-value">{bmr.toLocaleString()} kcal</span>
                  </div>
                ) : bmi > 0 ? (
                  <div className="md-metric-row">
                    <span className="md-metric-label">BMR</span>
                    <span style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)', fontStyle: 'italic' }}>Add DOB &amp; sex in profile</span>
                  </div>
                ) : null}

                {/* TDEE */}
                {tdee > 0 ? (
                  <div className="md-metric-row">
                    <span className="md-metric-label">TDEE</span>
                    <span className="md-metric-value">{tdee.toLocaleString()} kcal</span>
                  </div>
                ) : bmr > 0 ? (
                  <div className="md-metric-row">
                    <span className="md-metric-label">TDEE</span>
                    <span style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)', fontStyle: 'italic' }}>Add activity level in profile</span>
                  </div>
                ) : null}
              </>
            )}
          </IonCardContent>
        </IonCard>

        {/* ── Today's meals ───────────────────────────── */}
        <IonCard style={{ margin: '12px 16px 32px' }}>
          <IonListHeader style={secHdr}>Today&apos;s Meals</IonListHeader>
          <IonCardContent style={{ padding: '0 0 8px' }}>
            <IonList lines="inset" style={{ background: 'transparent' }}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(meal => {
                const count = todayFoodCounts[meal];
                return (
                  <IonItem key={meal} style={{ '--background': 'transparent' } as React.CSSProperties}>
                    <IonLabel style={{ fontFamily: 'var(--md-font)' }}>{MEAL_LABELS[meal]}</IonLabel>
                    <IonNote slot="end" style={{
                      fontFamily: 'var(--md-font)',
                      color: count > 0 ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
                    }}>
                      {count > 0 ? `${count} entr${count === 1 ? 'y' : 'ies'}` : 'None logged'}
                    </IonNote>
                  </IonItem>
                );
              })}
            </IonList>
          </IonCardContent>
        </IonCard>

      </IonContent>
    </IonPage>
  );
};

export default Home;
