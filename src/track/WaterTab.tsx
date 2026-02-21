import React, { useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonNote,
  IonSkeletonText,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { add, settingsOutline, trash, waterOutline } from 'ionicons/icons';
import { WaterRing } from '../components/WaterRing';
import { useWaterLog } from '../hooks/useWaterLog';
import type { WaterEntry } from '../hooks/useWaterLog';
import { S, QUICK_AMOUNTS, formatTime } from './trackUtils';

export const WaterTab: React.FC = () => {
  const {
    todayEntries: waterEntries,
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

  const [presentAlert] = useIonAlert();

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

  return (
    <>
      {/* Ring + quick-add + goal in one card */}
      <IonCard>
        <IonCardContent style={{ padding: 0 }}>
          <div style={S.ringWrap}>
            <WaterRing total={todayTotal} goal={dailyGoal} size={192} />
          </div>

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

          <div style={S.goalRow} onClick={() => { setGoalInput(String(dailyGoal)); setGoalModalOpen(true); }}>
            <IonIcon icon={settingsOutline} style={S.rowIcon} />
            <span style={S.rowText}>Daily goal</span>
            <span style={S.rowHint}>{dailyGoal} ml</span>
          </div>
        </IonCardContent>
      </IonCard>

      {waterLoading && (
        <IonList style={{ marginTop: 8 }}>
          {[1, 2, 3].map((i) => (
            <IonItem key={i}>
              <IonLabel><IonSkeletonText animated style={{ width: '30%' }} /></IonLabel>
              <IonNote slot="end"><IonSkeletonText animated style={{ width: 50 }} /></IonNote>
            </IonItem>
          ))}
        </IonList>
      )}

      {!waterLoading && waterEntries.length > 0 && (
        <>
          <IonListHeader style={{ paddingInlineStart: 20, marginTop: 8 }}>Today</IonListHeader>
          <IonList>
            {[...waterEntries].reverse().map((entry: WaterEntry) => (
              <IonItemSliding key={entry.id}>
                <IonItem>
                  <IonIcon icon={waterOutline} slot="start" style={{ color: 'var(--md-primary)', fontSize: 20 }} />
                  <IonLabel>
                    <h3>{entry.amount_ml} ml</h3>
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
        </>
      )}

      {!waterLoading && waterEntries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 32px', color: 'var(--md-on-surface-variant)' }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>💧</div>
          <p style={{ margin: 0, fontSize: 'var(--md-body-md)', fontFamily: 'var(--md-font)' }}>Tap a chip above to log water.</p>
        </div>
      )}

      {/* FAB */}
      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton onClick={() => setCustomModalOpen(true)}>
          <IonIcon icon={add} />
        </IonFabButton>
      </IonFab>

      <IonToast
        isOpen={!!errorMsg}
        message={errorMsg ?? ''}
        duration={3000}
        color="danger"
        onDidDismiss={() => setErrorMsg(null)}
      />

      {/* ── Water custom amount modal ───────────────────────────────────── */}
      <IonModal
        isOpen={customModalOpen}
        onDidDismiss={() => { setCustomModalOpen(false); setCustomAmount(''); }}
        initialBreakpoint={0.5}
        breakpoints={[0, 0.5]}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setCustomModalOpen(false)}>Cancel</IonButton>
            </IonButtons>
            <IonTitle>Custom Amount</IonTitle>
            <IonButtons slot="end">
              <IonButton strong onClick={handleCustomSave} disabled={waterSaving}>Add</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ ...S.valueArea, paddingBottom: 12 }}>
            <input
              autoFocus
              type="number"
              inputMode="numeric"
              placeholder="250"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              style={S.customInput}
            />
            <span style={{ fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)', fontSize: 'var(--md-title-md)', marginTop: 8 }}>
              ml
            </span>
          </div>
        </IonContent>
      </IonModal>

      {/* ── Daily goal modal ────────────────────────────────────────────── */}
      <IonModal
        isOpen={goalModalOpen}
        onDidDismiss={() => { setGoalModalOpen(false); setGoalInput(''); }}
        initialBreakpoint={0.5}
        breakpoints={[0, 0.5]}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setGoalModalOpen(false)}>Cancel</IonButton>
            </IonButtons>
            <IonTitle>Daily Goal</IonTitle>
            <IonButtons slot="end">
              <IonButton strong onClick={handleGoalSave}>Save</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ ...S.valueArea, paddingBottom: 12 }}>
            <input
              autoFocus
              type="number"
              inputMode="numeric"
              placeholder="2000"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              style={S.customInput}
            />
            <span style={{ fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)', fontSize: 'var(--md-title-md)', marginTop: 8 }}>
              ml / day
            </span>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};
