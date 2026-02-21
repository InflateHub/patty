import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Stub.css';

const Progress: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Progress</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Progress</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="stub-empty">
          <p className="stub-label">Photos · Trends · Stats</p>
          <p className="stub-hint">Coming in 0.9.0</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Progress;
