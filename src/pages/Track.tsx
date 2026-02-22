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
import { fastFoodOutline, moonOutline, scaleOutline, waterOutline } from 'ionicons/icons';
import { WeightTab } from '../track/WeightTab';
import { WaterTab } from '../track/WaterTab';
import { SleepTab } from '../track/SleepTab';
import { FoodTab } from '../track/FoodTab';

type TabId = 'weight' | 'water' | 'sleep' | 'food';

const FAB_ICONS: Record<TabId, string> = {
  weight: scaleOutline,
  water:  waterOutline,
  sleep:  moonOutline,
  food:   fastFoodOutline,
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
            style={{ maxWidth: 520, margin: '0 auto', '--background': 'transparent' } as React.CSSProperties}
          >
            <IonSegmentButton value="weight">
              <IonLabel>Weight</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="water">
              <IonLabel>Water</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="sleep">
              <IonLabel>Sleep</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="food">
              <IonLabel>Food</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {tab === 'weight' && <WeightTab openTrigger={fabTrigger} />}
        {tab === 'water'  && <WaterTab  openTrigger={fabTrigger} />}
        {tab === 'sleep'  && (
          <SleepTab
            openTrigger={fabTrigger}
            onAlreadyLoggedChange={setSleepAlreadyLogged}
          />
        )}
        {tab === 'food'   && <FoodTab   openTrigger={fabTrigger} />}

        {/* Single contextual FAB — icon and disabled state follow active tab */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton
            disabled={tab === 'sleep' && sleepAlreadyLogged}
            onClick={() => setFabTrigger((n) => n + 1)}
            style={{ '--background': 'var(--md-primary-container)', '--color': 'var(--md-on-primary-container)' } as React.CSSProperties}
          >
            <IonIcon icon={FAB_ICONS[tab]} />
          </IonFabButton>
        </IonFab>

        <div style={{ height: 88 }} />
      </IonContent>
    </IonPage>
  );
};

export default Track;
