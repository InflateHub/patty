import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Stub.css';

const Plan: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Plan</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Plan</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="stub-empty">
          <p className="stub-label">Cooking Planner · Exercise Planner</p>
          <p className="stub-hint">Coming in 0.7.0 – 0.8.0</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Plan;
