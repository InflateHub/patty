import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../pages/OnboardingPage.css';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSkeletonText,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { settingsOutline, trash, waterOutline } from 'ionicons/icons';
import { WaterRing } from '../components/WaterRing';
import { useWaterLog } from '../hooks/useWaterLog';
import type { WaterEntry } from '../hooks/useWaterLog';
import { S, QUICK_AMOUNTS, formatTime } from './trackUtils';

const WC_COLORS = ['#5C7A6E','#80DEEA','#4FC3F7','#B2EBF2','#00BCD4','#26C6DA','#FFF176','#F48FB1'];
const WATER_CONFETTI = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  color: WC_COLORS[i % WC_COLORS.length],
  left: `${4 + (i * 4.8) % 88}%`,
  delay: `${(i * 0.11) % 1.4}s`,
  duration: `${2.0 + (i * 0.22) % 1.8}s`,
  size: `${7 + (i * 3) % 9}px`,
  width: `${5 + (i * 2) % 8}px`,
}));

/* ── WeekRings ───────────────────────────────────────────────────────── */
const WeekRings: React.FC<{
  weekEntries: WaterEntry[];
  dailyGoal: number;
  onDayTap: (date: string) => void;
}> = ({ weekEntries, dailyGoal, onDayTap }) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const days = useMemo(() => {
    const result: { date: string; label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][d.getDay()];
      const total = weekEntries.filter((e) => e.date === dateStr).reduce((s, e) => s + e.amount_ml, 0);
      result.push({ date: dateStr, label, total });
    }
    return result;
  }, [weekEntries]);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '4px 0 0' }}>
      {days.map(({ date, label, total }) => {
        const isToday = date === todayStr;
        const size = isToday ? 52 : 42;
        const STROKE = 5;
        const r = (size - STROKE) / 2;
        const cx = size / 2;
        const cy = size / 2;
        const circ = 2 * Math.PI * r;
        const frac = dailyGoal > 0 ? Math.min(total / dailyGoal, 1) : 0;
        const offset = circ * (1 - frac);
        const reached = total >= dailyGoal && dailyGoal > 0;
        const color = reached
          ? 'var(--md-tertiary)'
          : isToday ? 'var(--md-primary)' : 'var(--md-secondary)';
        const displayMl = total >= 1000
          ? `${(total / 1000).toFixed(1)}L`
          : total > 0 ? `${total}` : '0';
        return (
          <div
            key={date}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flex: 1 }}
            onClick={() => onDayTap(date)}
          >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--md-surface-variant)" strokeWidth={STROKE} />
              {total > 0 && (
                <circle
                  cx={cx} cy={cy} r={r} fill="none"
                  stroke={color} strokeWidth={STROKE} strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={offset}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{ transition: 'stroke-dashoffset 400ms ease' }}
                />
              )}
              <text
                x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                fontSize={isToday ? 11 : 9} fontFamily="var(--md-font)"
                fill={total > 0 ? color : 'var(--md-outline)'}
                fontWeight={isToday ? 700 : 400}
              >
                {reached ? '\u2713' : displayMl}
              </text>
            </svg>
            <span style={{
              fontSize: 10, marginTop: 4, fontFamily: 'var(--md-font)',
              color: isToday ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
              fontWeight: isToday ? 700 : 400,
            }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

interface WaterTabProps {
  openTrigger?: number;
}

export const WaterTab: React.FC<WaterTabProps> = ({ openTrigger }) => {
  const {
    todayEntries: waterEntries,
    weekEntries,
    todayTotal,
    dailyGoal,
    loading: waterLoading,
    addEntry: addWater,
    deleteEntry: deleteWater,
    setDailyGoal,
  } = useWaterLog();
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [goalInput, setGoalInput] = useState('');
  const [waterSaving, setWaterSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [goalToastOpen, setGoalToastOpen] = useState(false);
  const [goalCelebOpen, setGoalCelebOpen] = useState(false);
  const [showTodayLog, setShowTodayLog] = useState(false);
  const [dayDetailDate, setDayDetailDate] = useState<string | null>(null);
  const prevReachedRef = useRef(false);

  const [presentAlert] = useIonAlert();

  /* Fire confetti + toast when goal is newly crossed */
  useEffect(() => {
    const nowReached = !waterLoading && dailyGoal > 0 && todayTotal >= dailyGoal;
    if (nowReached && !prevReachedRef.current) {
      setGoalToastOpen(true);
      setGoalCelebOpen(true);
      const t = setTimeout(() => setGoalCelebOpen(false), 3200);
      return () => clearTimeout(t);
    }
    prevReachedRef.current = nowReached;
  }, [todayTotal, dailyGoal, waterLoading]);

  /* Open custom-amount modal when Track's contextual FAB fires */
  useEffect(() => {
    if (!openTrigger) return;
    setCustomModalOpen(true);
  }, [openTrigger]);

  async function handleQuickAdd(ml: number) {
    try { await addWater(ml); } catch { setErrorMsg('Could not log water.'); }
  }

  async function handleCustomSave() {
    const ml = parseInt(customAmount, 10);
    if (!customAmount || isNaN(ml) || ml <= 0) {
      await presentAlert({ header: 'Invalid amount', message: 'Enter a positive whole number.', buttons: ['OK'] });
      return;
    }
    setWaterSaving(true);
    try {
      await addWater(ml);
      setCustomAmount('');
      setCustomModalOpen(false);
    } catch {
      setErrorMsg('Could not log water.');
    } finally {
      setWaterSaving(false);
    }
  }

  function handleGoalSave() {
    const ml = parseInt(goalInput, 10);
    if (!goalInput || isNaN(ml) || ml < 100) {
      presentAlert({ header: 'Invalid goal', message: 'Please enter at least 100 ml.', buttons: ['OK'] });
      return;
    }
    setDailyGoal(ml);
    setGoalModalOpen(false);
    setGoalInput('');
  }

  function handleWaterDelete(id: string) {
    presentAlert({
      header: 'Delete entry',
      message: 'Remove this water entry?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try { await deleteWater(id); }
            catch { setErrorMsg('Could not delete entry.'); }
          },
        },
      ],
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  const dayDetailEntries = useMemo(
    () => (!dayDetailDate ? [] : weekEntries.filter((e) => e.date === dayDetailDate)),
    [dayDetailDate, weekEntries]
  );
  const dayDetailTotal = dayDetailEntries.reduce((s, e) => s + e.amount_ml, 0);

  return (
    <>
      {/* Confetti overlay */}
      {goalCelebOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
          {WATER_CONFETTI.map(c => (
            <div key={c.id} className="ob-confetti"
              style={{ top: 0, left: c.left, width: c.width, height: c.size, background: c.color, animationDelay: c.delay, animationDuration: c.duration }}
            />
          ))}
        </div>
      )}

      {/* ── Today card: ring + goal chip + quick-add ─────────────────── */}
      <IonCard>
        <IonCardContent style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 0' }}>
            <span style={{
              fontSize: 'var(--md-label-lg)', fontFamily: 'var(--md-font)',
              color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '.08em',
            }}>
              Today
            </span>
            <button
              onClick={() => { setGoalInput(String(dailyGoal)); setGoalModalOpen(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'var(--md-surface-variant)', border: 'none',
                borderRadius: 'var(--md-shape-full)', padding: '6px 14px',
                fontSize: 'var(--md-label-md)', fontFamily: 'var(--md-font)',
                color: 'var(--md-on-surface-variant)', cursor: 'pointer',
              }}
            >
              <IonIcon icon={settingsOutline} style={{ fontSize: 14 }} />
              Goal: {dailyGoal >= 1000 ? `${(dailyGoal / 1000).toFixed(dailyGoal % 1000 === 0 ? 0 : 1)} L` : `${dailyGoal} ml`}
            </button>
          </div>

          {waterLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <IonSkeletonText animated style={{ width: 160, height: 160, borderRadius: '50%' }} />
            </div>
          ) : (
            <div style={S.ringWrap}>
              <WaterRing total={todayTotal} goal={dailyGoal} size={192} />
            </div>
          )}

          <div style={S.quickAddRow}>
            {QUICK_AMOUNTS.map((ml) => (
              <button key={ml} style={S.quickChip} onClick={() => handleQuickAdd(ml)}>
                +{ml} ml
              </button>
            ))}
            <button
              style={{ ...S.quickChip, borderColor: 'var(--md-primary)', color: 'var(--md-primary)' }}
              onClick={() => setCustomModalOpen(true)}
            >
              Custom
            </button>
          </div>
        </IonCardContent>
      </IonCard>

      {/* ── 7-day rings card ─────────────────────────────────────────── */}
      {!waterLoading && (
        <IonCard>
          <IonCardContent>
            <div style={{ marginBottom: 12 }}>
              <span style={{
                fontSize: 'var(--md-label-lg)', fontFamily: 'var(--md-font)',
                color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '.08em',
              }}>
                7 Days
              </span>
            </div>
            <WeekRings weekEntries={weekEntries} dailyGoal={dailyGoal} onDayTap={(d) => setDayDetailDate(d)} />
          </IonCardContent>
        </IonCard>
      )}

      {/* ── Today's log collapsible ───────────────────────────────────── */}
      {!waterLoading && waterEntries.length > 0 && (
        <IonCard style={{ marginBottom: 80 }}>
          <IonCardContent style={{ padding: '0 0 4px' }}>
            <button
              onClick={() => setShowTodayLog((h) => !h)}
              style={{
                display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center',
                background: 'none', border: 'none', padding: '14px 16px',
                fontSize: 'var(--md-label-lg)', fontFamily: 'var(--md-font)',
                color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '.08em', cursor: 'pointer',
              }}
            >
              Today&apos;s Log ({waterEntries.length})
              <span style={{ fontSize: 18, display: 'inline-block', transition: 'transform 200ms', transform: showTodayLog ? 'rotate(180deg)' : 'none' }}>
                &#8964;
              </span>
            </button>
            {showTodayLog && (
              <IonList lines="inset" style={{ margin: 0, padding: 0 }}>
                {[...waterEntries].reverse().map((entry: WaterEntry) => (
                  <IonItemSliding key={entry.id}>
                    <IonItem>
                      <IonIcon icon={waterOutline} slot="start" style={{ color: 'var(--md-primary)', fontSize: 20 }} />
                      <IonLabel>
                        <h3 style={{ fontFamily: 'var(--md-font)' }}>{entry.amount_ml} ml</h3>
                      </IonLabel>
                      <IonNote slot="end">{formatTime(entry.created_at)}</IonNote>
                    </IonItem>
                    <IonItemOptions side="end">
                      <IonItemOption color="danger" onClick={() => handleWaterDelete(entry.id)}>
                        <IonIcon slot="icon-only" icon={trash} />
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>
      )}

      {!waterLoading && waterEntries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 32px', color: 'var(--md-on-surface-variant)' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>&#128167;</div>
          <p style={{ margin: 0, fontSize: 'var(--md-body-md)', fontFamily: 'var(--md-font)' }}>Tap a chip above to log water.</p>
        </div>
      )}

      <IonToast isOpen={goalToastOpen} message="&#127881; Daily water goal reached!" duration={3500} color="success" position="top" onDidDismiss={() => setGoalToastOpen(false)} />
      <IonToast isOpen={!!errorMsg} message={errorMsg ?? ''} duration={3000} color="danger" onDidDismiss={() => setErrorMsg(null)} />

      {/* ── Day detail bottom sheet ───────────────────────────────────── */}
      <IonModal
        isOpen={!!dayDetailDate}
        onDidDismiss={() => setDayDetailDate(null)}
        initialBreakpoint={0.5}
        breakpoints={[0, 0.5, 0.85]}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {dayDetailDate === todayStr ? 'Today' : dayDetailDate ?? ''}
              {dayDetailDate && (
                <span style={{ marginLeft: 8, fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)' }}>
                  &nbsp;&middot;&nbsp;{dayDetailTotal >= 1000 ? `${(dayDetailTotal / 1000).toFixed(1)} L` : `${dayDetailTotal} ml`}
                </span>
              )}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setDayDetailDate(null)}>Done</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {dayDetailEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--md-on-surface-variant)', fontFamily: 'var(--md-font)' }}>
              No entries for this day.
            </div>
          ) : (
            <IonList lines="inset">
              {[...dayDetailEntries].reverse().map((entry) => (
                <IonItem key={entry.id}>
                  <IonIcon icon={waterOutline} slot="start" style={{ color: 'var(--md-primary)', fontSize: 20 }} />
                  <IonLabel><h3 style={{ fontFamily: 'var(--md-font)' }}>{entry.amount_ml} ml</h3></IonLabel>
                  <IonNote slot="end">{formatTime(entry.created_at)}</IonNote>
                </IonItem>
              ))}
            </IonList>
          )}
        </IonContent>
      </IonModal>

      {/* ── Custom amount modal ───────────────────────────────────────── */}
      <IonModal
        isOpen={customModalOpen}
        onDidDismiss={() => { setCustomModalOpen(false); setCustomAmount(''); }}
        initialBreakpoint={0.5}
        breakpoints={[0, 0.5]}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start"><IonButton onClick={() => setCustomModalOpen(false)}>Cancel</IonButton></IonButtons>
            <IonTitle>Custom Amount</IonTitle>
            <IonButtons slot="end"><IonButton strong onClick={handleCustomSave} disabled={waterSaving}>Add</IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ ...S.valueArea, paddingBottom: 12 }}>
            <input
              autoFocus type="number" inputMode="numeric" placeholder="250" value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)} style={S.customInput}
            />
            <span style={{ fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)', fontSize: 'var(--md-title-md)', marginTop: 8 }}>ml</span>
          </div>
        </IonContent>
      </IonModal>

      {/* ── Daily goal modal ──────────────────────────────────────────── */}
      <IonModal
        isOpen={goalModalOpen}
        onDidDismiss={() => { setGoalModalOpen(false); setGoalInput(''); }}
        initialBreakpoint={0.5}
        breakpoints={[0, 0.5]}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start"><IonButton onClick={() => setGoalModalOpen(false)}>Cancel</IonButton></IonButtons>
            <IonTitle>Daily Goal</IonTitle>
            <IonButtons slot="end"><IonButton strong onClick={handleGoalSave}>Save</IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ ...S.valueArea, paddingBottom: 12 }}>
            <input
              autoFocus type="number" inputMode="numeric" placeholder="2000" value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)} style={S.customInput}
            />
            <span style={{ fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)', fontSize: 'var(--md-title-md)', marginTop: 8 }}>ml / day</span>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};
