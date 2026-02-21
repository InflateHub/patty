import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { WeightTab } from '../track/WeightTab';
import { WaterTab } from '../track/WaterTab';
import { SleepTab } from '../track/SleepTab';
import { FoodTab } from '../track/FoodTab';

type TabId = 'weight' | 'water' | 'sleep' | 'food';

const Track: React.FC = () => {
  const [tab, setTab] = useState<TabId>('weight');

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Track</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={tab}
            onIonChange={(e) => setTab(e.detail.value as TabId)}
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
        {tab === 'weight' && <WeightTab />}
        {tab === 'water' && <WaterTab />}
        {tab === 'sleep' && <SleepTab />}
        {tab === 'food' && <FoodTab />}
        <div style={{ height: 88 }} />
      </IonContent>
    </IonPage>
  );
};

export default Track;
