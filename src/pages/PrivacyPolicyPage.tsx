/* PrivacyPolicyPage — 2.0.0 */
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
  IonListHeader,
  IonNote,
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

const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>
    {items.map((item, i) => (
      <li key={i} style={{
        fontFamily: 'var(--md-font)',
        fontSize: 'var(--md-body-md)',
        color: 'var(--md-on-surface-variant)',
        lineHeight: 1.6,
        marginBottom: 4,
      }}>
        {item}
      </li>
    ))}
  </ul>
);

const PrivacyPolicyPage: React.FC = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/tabs/profile" />
        </IonButtons>
        <IonTitle>Privacy Policy</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent fullscreen>

      {/* ── Effective date ──────────────────────────────────────────── */}
      <IonCard style={{ margin: '16px 16px 8px' }}>
        <IonListHeader style={hdr}>About This Policy</IonListHeader>
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

      {/* ── Information Collection ───────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Information Collection and Use</SectionTitle>
          <Body>
            The Application collects information when you download and use it. This information may include:
          </Body>
          <BulletList items={[
            "Your device's Internet Protocol address (e.g. IP address)",
            'The pages of the Application that you visit, the time and date of your visit, the time spent on those pages',
            'The time spent on the Application',
            'The operating system you use on your mobile device',
          ]} />
          <Body>
            The Application does not gather precise information about the location of your mobile device.
          </Body>
          <Body>
            The Application does not use Artificial Intelligence (AI) technologies to process your data or provide features.
          </Body>
          <Body>
            The Service Provider may use the information you provided to contact you from time to time to provide you with important information, required notices and marketing promotions.
          </Body>
          <Body>
            For a better experience, while using the Application, the Service Provider may require you to provide us with certain personally identifiable information. The information that the Service Provider requests will be retained by them and used as described in this privacy policy.
          </Body>
        </IonCardContent>
      </IonCard>

      {/* ── Third Party Access ──────────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Third Party Access</SectionTitle>
          <Body>
            Only aggregated, anonymized data is periodically transmitted to external services to aid the Service Provider in improving the Application and their service. The Service Provider may share your information with third parties in the ways that are described in this privacy statement.
          </Body>
          <Body>The Service Provider may disclose User Provided and Automatically Collected Information:</Body>
          <BulletList items={[
            'As required by law, such as to comply with a subpoena, or similar legal process.',
            'When they believe in good faith that disclosure is necessary to protect their rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.',
            'With their trusted service providers who work on their behalf, do not have an independent use of the information we disclose to them, and have agreed to adhere to the rules set forth in this privacy statement.',
          ]} />
        </IonCardContent>
      </IonCard>

      {/* ── Opt-Out Rights ──────────────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Opt-Out Rights</SectionTitle>
          <Body>
            You can stop all collection of information by the Application easily by uninstalling it. You may use the standard uninstall processes as may be available as part of your mobile device or via the mobile application marketplace or network.
          </Body>
        </IonCardContent>
      </IonCard>

      {/* ── Data Retention ──────────────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Data Retention Policy</SectionTitle>
          <Body>
            The Service Provider will retain User Provided data for as long as you use the Application and for a reasonable time thereafter. If you'd like them to delete User Provided Data that you have provided via the Application, please contact them at{' '}
            <a href="mailto:sarandevnet@gmail.com" style={{ color: 'var(--md-primary)' }}>sarandevnet@gmail.com</a>
            {' '}and they will respond in a reasonable time.
          </Body>
        </IonCardContent>
      </IonCard>

      {/* ── Children ────────────────────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Children</SectionTitle>
          <Body>
            The Service Provider does not use the Application to knowingly solicit data from or market to children under the age of 13.
          </Body>
          <Body>
            The Service Provider does not knowingly collect personally identifiable information from children. The Service Provider encourages all children to never submit any personally identifiable information through the Application and/or Services. Parents and legal guardians are encouraged to monitor their children's Internet usage and to help enforce this Policy by instructing their children never to provide personally identifiable information without their permission.
          </Body>
          <Body>
            If you have reason to believe that a child has provided personally identifiable information to the Service Provider, please contact{' '}
            <a href="mailto:sarandevnet@gmail.com" style={{ color: 'var(--md-primary)' }}>sarandevnet@gmail.com</a>
            {' '}so that the necessary actions can be taken. You must also be at least 16 years of age to consent to the processing of your personally identifiable information in your country.
          </Body>
        </IonCardContent>
      </IonCard>

      {/* ── Security ────────────────────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Security</SectionTitle>
          <Body>
            The Service Provider is concerned about safeguarding the confidentiality of your information. The Service Provider provides physical, electronic, and procedural safeguards to protect information the Service Provider processes and maintains.
          </Body>
        </IonCardContent>
      </IonCard>

      {/* ── Changes ─────────────────────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Changes</SectionTitle>
          <Body>
            This Privacy Policy may be updated from time to time for any reason. The Service Provider will notify you of any changes to the Privacy Policy by updating this page with the new Privacy Policy. You are advised to consult this Privacy Policy regularly for any changes, as continued use is deemed approval of all changes.
          </Body>
        </IonCardContent>
      </IonCard>

      {/* ── Your Consent ────────────────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 8px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Your Consent</SectionTitle>
          <Body>
            By using the Application, you are consenting to the processing of your information as set forth in this Privacy Policy now and as amended by us.
          </Body>
        </IonCardContent>
      </IonCard>

      {/* ── Contact ─────────────────────────────────────────────────── */}
      <IonCard style={{ margin: '0 16px 32px' }}>
        <IonCardContent style={{ padding: '16px 16px 12px' }}>
          <SectionTitle>Contact Us</SectionTitle>
          <Body>
            If you have any questions regarding privacy while using the Application, or have questions about our practices, please contact the Service Provider via email at{' '}
            <a href="mailto:sarandevnet@gmail.com" style={{ color: 'var(--md-primary)' }}>sarandevnet@gmail.com</a>.
          </Body>
        </IonCardContent>
      </IonCard>

    </IonContent>
  </IonPage>
);

export default PrivacyPolicyPage;
