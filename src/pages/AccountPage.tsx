/* AccountPage — 3.0.0 (stub — sign-in + subscription wired in 3.1.0) */
import React from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { ribbonOutline } from 'ionicons/icons';

const AccountPage: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" />
          </IonButtons>
          <IonTitle>Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          padding: '0 32px',
          textAlign: 'center',
          gap: 12,
        }}>
          <IonIcon icon={ribbonOutline} style={{ fontSize: 56, color: 'var(--md-primary)', marginBottom: 4 }} />
          <p style={{
            margin: 0,
            fontSize: 'var(--md-headline-sm)',
            fontFamily: 'var(--md-font)',
            fontWeight: 700,
            color: 'var(--md-on-surface)',
          }}>
            Account
          </p>
          <p style={{
            margin: 0,
            fontSize: 'var(--md-body-md)',
            fontFamily: 'var(--md-font)',
            color: 'var(--md-on-surface-variant)',
            lineHeight: 1.5,
          }}>
            Sign-in and subscription management are coming in the next update.
          </p>
          <IonButton
            fill="clear"
            style={{ '--color': 'var(--md-primary)', marginTop: 8 } as React.CSSProperties}
            onClick={() => history.push('/pro')}
          >
            See Patty Pro plans →
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AccountPage;
