/* Dashboard — 0.9.3 */
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
} from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';

import { useWeightLog } from '../hooks/useWeightLog';
import { useWaterLog } from '../hooks/useWaterLog';
import { useSleepLog } from '../hooks/useSleepLog';
import { useFoodLog } from '../hooks/useFoodLog';
import { useProfile, computeBMI, bmiCategory } from '../hooks/useProfile';
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

const cardStyle: React.CSSProperties = {
  margin: '12px 16px',
  borderRadius: 'var(--md-shape-xl)',
  border: '1px solid var(--md-outline-variant)',
  boxShadow: 'none',
};

const sectionHeaderStyle: React.CSSProperties = {
  paddingTop: 16,
  paddingBottom: 4,
  color: 'var(--md-primary)',
  fontFamily: 'var(--md-font)',
  fontSize: 'var(--md-label-lg)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const Home: React.FC = () => {
  const history = useHistory();
  const { entries: weightEntries, latestEntry } = useWeightLog();
  const { todayTotal, dailyGoal, loading: waterLoading } = useWaterLog();
  const { lastNightEntry } = useSleepLog();
  const { entries: foodEntries } = useFoodLog();
  const { profile } = useProfile();

  const weightKg = latestEntry
    ? latestEntry.unit === 'lbs'
      ? latestEntry.value / 2.20462
      : latestEntry.value
    : 0;
  const bmi = computeBMI(weightKg, profile.heightCm);
  const bmiCat = bmiCategory(bmi);

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
        <div style={{ padding: '16px 20px 4px' }}>
          <p style={{
            margin: 0,
            fontSize: 'var(--md-title-lg)',
            fontWeight: 500,
            fontFamily: 'var(--md-font)',
            color: 'var(--md-on-surface)',
          }}>
            {salutation(profile.name)}
          </p>
          <p style={{
            margin: '2px 0 0',
            fontSize: 'var(--md-body-sm)',
            fontFamily: 'var(--md-font)',
            color: 'var(--md-on-surface-variant)',
          }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* ── At-a-glance stats row ───────────────────── */}
        <IonCard style={cardStyle}>
          <IonCardContent style={{ padding: '16px 4px' }}>
            <IonGrid style={{ padding: 0 }}>
              <IonRow style={{ textAlign: 'center' }}>
                {/* Weight + BMI */}
                <IonCol>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 600, fontFamily: 'var(--md-font)', color: 'var(--md-on-surface)' }}>
                    {latestEntry ? `${latestEntry.value} ${latestEntry.unit}` : '\u2014'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
                    Weight
                  </p>
                  {bmi > 0 && (
                    <p style={{ margin: '3px 0 0', fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-primary)', fontWeight: 600 }}>
                      BMI {bmi.toFixed(1)}
                    </p>
                  )}
                  {bmiCat && (
                    <p style={{ margin: '1px 0 0', fontSize: 10, fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
                      {bmiCat}
                    </p>
                  )}
                </IonCol>
                {/* Divider */}
                <IonCol style={{ borderLeft: '1px solid var(--md-outline-variant)', borderRight: '1px solid var(--md-outline-variant)' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 600, fontFamily: 'var(--md-font)', color: 'var(--md-on-surface)' }}>
                    {waterLoading ? '\u2026' : `${waterPct}%`}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
                    Water
                  </p>
                </IonCol>
                {/* Sleep */}
                <IonCol>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 600, fontFamily: 'var(--md-font)', color: 'var(--md-on-surface)' }}>
                    {lastNightEntry ? formatDuration(lastNightEntry.duration_min) : '\u2014'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
                    Sleep
                  </p>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* ── Water ring ──────────────────────────────── */}
        <IonCard style={cardStyle}>
          <IonListHeader style={sectionHeaderStyle}>Water Today</IonListHeader>
          <IonCardContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 16px 20px' }}>
            <WaterRing total={todayTotal} goal={dailyGoal} size={160} />
          </IonCardContent>
        </IonCard>

        {/* ── Weight mini-chart ───────────────────────── */}
        <IonCard style={cardStyle}>
          <IonListHeader style={sectionHeaderStyle}>Weight Trend</IonListHeader>
          <IonCardContent style={{ padding: '8px 8px 16px' }}>
            <WeightChart entries={miniChartEntries} />
          </IonCardContent>
        </IonCard>

        {/* ── Today's meals ───────────────────────────── */}
        <IonCard style={{ ...cardStyle, margin: '12px 16px 32px' }}>
          <IonListHeader style={sectionHeaderStyle}>Today&apos;s Meals</IonListHeader>
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
