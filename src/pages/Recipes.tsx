import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Stub.css';

const Recipes: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Recipes</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Recipes</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="stub-empty">
          <p className="stub-label">Browse &amp; save recipes</p>
          <p className="stub-hint">Coming in 0.6.0</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Recipes;
