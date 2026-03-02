import React, { useState } from 'react';
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
  const [sleepAlreadyLogged, setSleepAlreadyLogged] = useState(false);

  function handleTabChange(next: TabId) {
    setTab(next);
    setFabTrigger(0); // reset so the new tab doesn't open its modal on mount
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Track</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={tab}
            onIonChange={(e) => handleTabChange(e.detail.value as TabId)}
            style={{ maxWidth: 560, margin: '0 auto', '--background': 'transparent' } as React.CSSProperties}
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
        {tab === 'sleep'   && (
          <SleepTab
            openTrigger={fabTrigger}
            onAlreadyLoggedChange={setSleepAlreadyLogged}
          />
        )}
        {tab === 'food'    && <FoodTab    openTrigger={fabTrigger} />}
        {tab === 'workout' && <WorkoutTab openTrigger={fabTrigger} />}

        {/* Single contextual FAB — icon and disabled state follow active tab */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton
            disabled={tab === 'sleep' && sleepAlreadyLogged}
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
