/* TermsPage — 2.0.0 */
import React from 'react';
import {
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonListHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

const hdr: React.CSSProperties = { paddingTop: 20, paddingBottom: 4 };
const transparentItem = { '--background': 'transparent' } as React.CSSProperties;

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{
    margin: '0 0 8px',
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-title-sm)',
    fontWeight: 700,
    color: 'var(--md-on-surface)',
  }}>
    {children}
  </p>
);

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{
    margin: '0 0 12px',
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-body-md)',
    color: 'var(--md-on-surface-variant)',
    lineHeight: 1.6,
  }}>
    {children}
  </p>
);

const TermsPage: React.FC = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/tabs/profile" />
        </IonButtons>
        <IonTitle>Terms &amp; Conditions</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>

      {/* ── About ───────────────────────────────────────────────────── */}
      <IonCard style={{ margin: '16px 16px 8px' }}>
        <IonListHeader style={hdr}>About These Terms</IonListHeader>
        <IonCardContent style={{ padding: '4px 0 12px' }}>
          <IonList lines="none" style={{ background: 'transparent' }}>
            <IonItem style={transparentItem}>
              <IonLabel>Application</IonLabel>
              <IonNote slot="end">Patty</IonNote>
            </IonItem>
            <IonItem style={transparentItem}>
              <IonLabel>Service Provider</IonLabel>
              <IonNote slot="end">Saran Mahadev</IonNote>
            </IonItem>
            <IonItem style={transparentItem}>
              <IonLabel>Effective date</IonLabel>
              <IonNote slot="end">2026-02-22</IonNote>
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>

      {/* ── Agreement ───────────────────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <Body>
            These terms and conditions apply to the Patty app (hereby referred to as "Application") for mobile devices that was created by Saran Mahadev (hereby referred to as "Service Provider") as an Open Source service.
          </Body>
          <Body>
            Upon downloading or utilizing the Application, you are automatically agreeing to the following terms. It is strongly advised that you thoroughly read and understand these terms prior to using the Application.
          </Body>
          <Body>
            The Service Provider is dedicated to ensuring that the Application is as beneficial and efficient as possible. As such, they reserve the right to modify the Application or charge for their services at any time and for any reason. The Service Provider assures you that any charges for the Application or its services will be clearly communicated to you.
          </Body>
          <Body>
            The Application stores and processes personal data that you have provided to the Service Provider in order to provide the Service. It is your responsibility to maintain the security of your phone and access to the Application. The Service Provider strongly advises against jailbreaking or rooting your phone, which involves removing software restrictions and limitations imposed by the official operating system of your device. Such actions could expose your phone to malware, viruses, malicious programs, compromise your phone's security features, and may result in the Application not functioning correctly or at all.
          </Body>
        </IonCardContent>
      </IonCard>

      {/* ── Connectivity & Charges ──────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Connectivity &amp; Charges</SectionTitle>
          <Body>
            Please be aware that the Service Provider does not assume responsibility for certain aspects. Some functions of the Application require an active internet connection, which can be Wi-Fi or provided by your mobile network provider. The Service Provider cannot be held responsible if the Application does not function at full capacity due to lack of access to Wi-Fi or if you have exhausted your data allowance.
          </Body>
          <Body>
            If you are using the application outside of a Wi-Fi area, please be aware that your mobile network provider's agreement terms still apply. Consequently, you may incur charges from your mobile provider for data usage during the connection to the application, or other third-party charges. By using the application, you accept responsibility for any such charges, including roaming data charges if you use the application outside of your home territory without disabling data roaming. If you are not the bill payer for the device on which you are using the application, they assume that you have obtained permission from the bill payer.
          </Body>
          <Body>
            Similarly, the Service Provider cannot always assume responsibility for your usage of the application. For instance, it is your responsibility to ensure that your device remains charged. If your device runs out of battery and you are unable to access the Service, the Service Provider cannot be held responsible.
          </Body>
        </IonCardContent>
      </IonCard>

      {/* ── Liability ───────────────────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Liability</SectionTitle>
          <Body>
            In terms of the Service Provider's responsibility for your use of the application, it is important to note that while they strive to ensure that it is updated and accurate at all times, they do rely on third parties to provide information to them so that they can make it available to you. The Service Provider accepts no liability for any loss, direct or indirect, that you experience as a result of relying entirely on this functionality of the application.
          </Body>
        </IonCardContent>
      </IonCard>

      {/* ── Updates & Termination ───────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Updates &amp; Termination</SectionTitle>
          <Body>
            The Service Provider may wish to update the application at some point. The application is currently available as per the requirements for the operating system and any additional systems they decide to extend availability to. These requirements may change, and you will need to download updates if you want to continue using the application.
          </Body>
          <Body>
            The Service Provider does not guarantee that it will always update the application so that it is relevant to you and/or compatible with the particular operating system version installed on your device. However, you agree to always accept updates to the application when offered to you.
          </Body>
          <Body>
            The Service Provider may also wish to cease providing the application and may terminate its use at any time without providing termination notice to you. Unless they inform you otherwise, upon any termination: (a) the rights and licenses granted to you in these terms will end; (b) you must cease using the application, and (if necessary) delete it from your device.
          </Body>
        </IonCardContent>
      </IonCard>

      {/* ── Changes to Terms ────────────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Changes to These Terms</SectionTitle>
          <Body>
            The Service Provider may periodically update their Terms and Conditions. Therefore, you are advised to review this page regularly for any changes. The Service Provider will notify you of any changes by posting the new Terms and Conditions on this page.
          </Body>
        </IonCardContent>
      </IonCard>

      {/* ── Contact ─────────────────────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 32px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Contact Us</SectionTitle>
          <Body>
            If you have any questions or suggestions about the Terms and Conditions, please do not hesitate to contact the Service Provider at{' '}
            <a href="mailto:sarandevnet@gmail.com" style={{ color: 'var(--md-primary)' }}>sarandevnet@gmail.com</a>.
          </Body>
        </IonCardContent>
      </IonCard>

    </IonContent>
  </IonPage>
);

export default TermsPage;
