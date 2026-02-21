import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Stub.css';

const Track: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Track</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Track</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="stub-empty">
          <p className="stub-label">Weight · Water · Sleep · Food</p>
          <p className="stub-hint">Coming in 0.2.0 – 0.5.0</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Track;
