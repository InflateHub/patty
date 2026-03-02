import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { barbellOutline, fastFoodOutline, moonOutline, scaleOutline, waterOutline } from 'ionicons/icons';
import { WeightTab } from '../track/WeightTab';
import { WaterTab } from '../track/WaterTab';
import { SleepTab } from '../track/SleepTab';
import { FoodTab } from '../track/FoodTab';
import { WorkoutTab } from '../track/WorkoutTab';

type TabId = 'weight' | 'water' | 'sleep' | 'food' | 'workout';

const TAB_META: Record<TabId, { icon: string; label: string }> = {
  weight:  { icon: scaleOutline,    label: 'Weight'  },
  water:   { icon: waterOutline,    label: 'Water'   },
  sleep:   { icon: moonOutline,     label: 'Sleep'   },
  food:    { icon: fastFoodOutline, label: 'Food'    },
  workout: { icon: barbellOutline,  label: 'Workout' },
};

const Track: React.FC = () => {
  const [tab, setTab] = useState<TabId>('weight');
  const [fabTrigger, setFabTrigger] = useState(0);

  // Deep-link from Home SpeedDial: sessionStorage key set before navigating
  useIonViewWillEnter(() => {
    const requested = sessionStorage.getItem('patty_track_tab_request') as TabId | null;
    if (requested && Object.keys(TAB_META).includes(requested)) {
      setTab(requested);
      sessionStorage.removeItem('patty_track_tab_request');
    }
  });

  function handleTabChange(next: TabId) {
    setTab(next);
    setFabTrigger(0);
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Track</IonTitle>
        </IonToolbar>
        <IonToolbar class="segment-toolbar">
          <IonSegment
            value={tab}
            onIonChange={(e) => handleTabChange(e.detail.value as TabId)}
          >
            {(Object.entries(TAB_META) as [TabId, { icon: string; label: string }][]).map(([id, meta]) => (
              <IonSegmentButton key={id} value={id} aria-label={meta.label} layout="icon-top">
                <IonIcon icon={meta.icon} />
                <IonLabel style={{ fontSize: '10px', marginTop: 2 }}>{meta.label}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {tab === 'weight'  && <WeightTab  openTrigger={fabTrigger} />}
        {tab === 'water'   && <WaterTab   openTrigger={fabTrigger} />}
        {tab === 'sleep'   && <SleepTab openTrigger={fabTrigger} />}
        {tab === 'food'    && <FoodTab    openTrigger={fabTrigger} />}
        {tab === 'workout' && <WorkoutTab openTrigger={fabTrigger} />}

        {/* Single contextual FAB — icon and disabled state follow active tab */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton
            onClick={() => setFabTrigger((n) => n + 1)}
            style={{ '--background': 'var(--md-primary-container)', '--color': 'var(--md-on-primary-container)' } as React.CSSProperties}
          >
            <IonIcon icon={TAB_META[tab].icon} />
          </IonFabButton>
        </IonFab>

        <div style={{ height: 88 }} />
      </IonContent>
    </IonPage>
  );
};

export default Track;
