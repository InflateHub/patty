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


const Track: React.FC = () => {
  const [tab, setTab] = useState<'weight' | 'water'>('weight');

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Track</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={tab}
            onIonChange={(e) => setTab(e.detail.value as 'weight' | 'water')}
            style={{ maxWidth: 320, margin: '0 auto', '--background': 'transparent' } as React.CSSProperties}
          >
            <IonSegmentButton value="weight">
              <IonLabel>Weight</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="water">
              <IonLabel>Water</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {tab === 'weight' && <WeightTab />}
        {tab === 'water' && <WaterTab />}
        <div style={{ height: 88 }} />
      </IonContent>
    </IonPage>
  );
};

export default Track;
