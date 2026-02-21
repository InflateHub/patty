/* ProfilePage — 0.9.3 */
import React, { useEffect, useState } from 'react';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  IonToast,
} from '@ionic/react';

import {
  useProfile,
  UserProfile,
  UserPrefs,
  ageFromDob,
} from '../hooks/useProfile';

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  margin: '12px 16px',
  borderRadius: 'var(--md-shape-xl)',
  border: '1px solid var(--md-outline-variant)',
  boxShadow: 'none',
};

const sectionHeaderStyle: React.CSSProperties = {
  paddingTop: 16,
  paddingBottom: 4,
  color: 'var(--md-primary)',
  fontFamily: 'var(--md-font)',
  fontSize: 'var(--md-label-lg)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

// ── Component ─────────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const { profile, prefs, loading, saveProfile, savePrefs } = useProfile();

  // Local form state — initialised from hook once loaded
  const [form, setForm] = useState<UserProfile>({
    name: '',
    dob: '',
    sex: '',
    heightCm: 0,
    activity: '',
    goal: '',
  });
  const [prefForm, setPrefForm] = useState<UserPrefs>({
    weightUnit: 'kg',
    waterGoalMl: 2000,
  });
  const [toast, setToast] = useState(false);

  // Sync form state once profile loads
  useEffect(() => {
    if (!loading) {
      setForm(profile);
      setPrefForm(prefs);
    }
  }, [loading, profile, prefs]);

  // ── Save
  const dobAge = ageFromDob(form.dob);
  const handleSave = async () => {
    await saveProfile(form);
    await savePrefs(prefForm);
    setToast(true);
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/home" />
            </IonButtons>
            <IonTitle>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent />
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home" />
          </IonButtons>
          <IonTitle>Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton
              strong
              onClick={handleSave}
              style={{ color: 'var(--md-primary)', fontFamily: 'var(--md-font)' }}
            >
              Save
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>

        {/* ── About Me ──────────────────────────────────────────────────── */}
        <IonCard style={cardStyle}>
          <IonListHeader style={sectionHeaderStyle}>About Me</IonListHeader>
          <IonCardContent style={{ padding: '0 0 8px' }}>
            <IonList lines="inset" style={{ background: 'transparent' }}>

              {/* Name */}
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                <IonLabel position="stacked" style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)', marginBottom: 4 }}>
                  Display name
                </IonLabel>
                <IonInput
                  value={form.name}
                  placeholder="Your name"
                  onIonInput={e => setForm(f => ({ ...f, name: (e.detail.value ?? '') as string }))}
                  style={{ fontFamily: 'var(--md-font)' }}
                />
              </IonItem>

              {/* Date of birth */}
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                <IonLabel position="stacked" style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)', marginBottom: 4 }}>
                  Date of birth
                </IonLabel>
                <IonInput
                  type="date"
                  value={form.dob}
                  onIonInput={e => setForm(f => ({ ...f, dob: (e.detail.value ?? '') as string }))}
                  style={{ fontFamily: 'var(--md-font)' }}
                />
                {dobAge > 0 && (
                  <IonNote slot="end" style={{ fontFamily: 'var(--md-font)', alignSelf: 'center' }}>
                    {dobAge} yrs
                  </IonNote>
                )}
              </IonItem>

              {/* Sex */}
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                <IonLabel style={{ fontFamily: 'var(--md-font)', marginBottom: 8 }}>Biological sex</IonLabel>
              </IonItem>
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties} lines="none">
                <IonSegment
                  value={form.sex || ''}
                  onIonChange={e => setForm(f => ({ ...f, sex: (e.detail.value ?? '') as UserProfile['sex'] }))}
                  style={{ width: '100%', paddingBottom: 8 }}
                >
                  <IonSegmentButton value="male">
                    <IonLabel style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-md)' }}>Male</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="female">
                    <IonLabel style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-md)' }}>Female</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="other">
                    <IonLabel style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-md)' }}>Other</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </IonItem>

              {/* Height */}
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                <IonLabel position="stacked" style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)', marginBottom: 4 }}>
                  Height (cm)
                </IonLabel>
                <IonInput
                  type="number"
                  value={form.heightCm || ''}
                  placeholder="e.g. 170"
                  min={100}
                  max={250}
                  onIonInput={e => setForm(f => ({ ...f, heightCm: Number(e.detail.value ?? 0) }))}
                  style={{ fontFamily: 'var(--md-font)' }}
                />
                {form.heightCm > 0 && (
                  <IonNote slot="end" style={{ fontFamily: 'var(--md-font)', alignSelf: 'center' }}>
                    {(form.heightCm / 30.48).toFixed(1)} ft
                  </IonNote>
                )}
              </IonItem>

              {/* Activity level */}
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                <IonLabel style={{ fontFamily: 'var(--md-font)' }}>Activity level</IonLabel>
                <IonSelect
                  value={form.activity || ''}
                  placeholder="Select"
                  onIonChange={e => setForm(f => ({ ...f, activity: e.detail.value as UserProfile['activity'] }))}
                  style={{ fontFamily: 'var(--md-font)' }}
                >
                  <IonSelectOption value="sedentary">Sedentary (desk job)</IonSelectOption>
                  <IonSelectOption value="light">Lightly active (1–3 days/wk)</IonSelectOption>
                  <IonSelectOption value="moderate">Moderately active (3–5 days/wk)</IonSelectOption>
                  <IonSelectOption value="very">Very active (6–7 days/wk)</IonSelectOption>
                </IonSelect>
              </IonItem>

              {/* Goal */}
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties} lines="none">
                <IonLabel style={{ fontFamily: 'var(--md-font)' }}>Primary goal</IonLabel>
                <IonSelect
                  value={form.goal || ''}
                  placeholder="Select"
                  onIonChange={e => setForm(f => ({ ...f, goal: e.detail.value as UserProfile['goal'] }))}
                  style={{ fontFamily: 'var(--md-font)' }}
                >
                  <IonSelectOption value="lose_weight">Lose weight</IonSelectOption>
                  <IonSelectOption value="maintain">Maintain weight</IonSelectOption>
                  <IonSelectOption value="build_muscle">Build muscle</IonSelectOption>
                  <IonSelectOption value="improve_sleep">Improve sleep</IonSelectOption>
                  <IonSelectOption value="general_wellness">General wellness</IonSelectOption>
                </IonSelect>
              </IonItem>

            </IonList>
          </IonCardContent>
        </IonCard>

        {/* ── Preferences ───────────────────────────────────────────────── */}
        <IonCard style={cardStyle}>
          <IonListHeader style={sectionHeaderStyle}>Preferences</IonListHeader>
          <IonCardContent style={{ padding: '0 0 8px' }}>
            <IonList lines="inset" style={{ background: 'transparent' }}>

              {/* Weight unit */}
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                <IonLabel style={{ fontFamily: 'var(--md-font)' }}>Weight unit</IonLabel>
              </IonItem>
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                <IonSegment
                  value={prefForm.weightUnit}
                  onIonChange={e =>
                    setPrefForm(p => ({ ...p, weightUnit: e.detail.value as 'kg' | 'lb' }))
                  }
                  style={{ width: '100%', maxWidth: 200, paddingBottom: 8 }}
                >
                  <IonSegmentButton value="kg">
                    <IonLabel style={{ fontFamily: 'var(--md-font)' }}>kg</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="lb">
                    <IonLabel style={{ fontFamily: 'var(--md-font)' }}>lb</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </IonItem>

              {/* Daily water goal */}
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties} lines="none">
                <IonLabel position="stacked" style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)', marginBottom: 4 }}>
                  Daily water goal (ml)
                </IonLabel>
                <IonInput
                  type="number"
                  value={prefForm.waterGoalMl}
                  min={500}
                  max={6000}
                  step="100"
                  onIonInput={e =>
                    setPrefForm(p => ({ ...p, waterGoalMl: Number(e.detail.value ?? 2000) }))
                  }
                  style={{ fontFamily: 'var(--md-font)' }}
                />
                <IonNote slot="end" style={{ fontFamily: 'var(--md-font)', alignSelf: 'center' }}>
                  {(prefForm.waterGoalMl / 1000).toFixed(1)} L
                </IonNote>
              </IonItem>

            </IonList>
          </IonCardContent>
        </IonCard>

        {/* ── App Info ──────────────────────────────────────────────────── */}
        <IonCard style={{ ...cardStyle, margin: '12px 16px 32px' }}>
          <IonListHeader style={sectionHeaderStyle}>App Info</IonListHeader>
          <IonCardContent style={{ padding: '0 0 8px' }}>
            <IonList lines="none" style={{ background: 'transparent' }}>
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                <IonLabel style={{ fontFamily: 'var(--md-font)' }}>Version</IonLabel>
                <IonNote slot="end" style={{ fontFamily: 'var(--md-font)' }}>0.9.3</IonNote>
              </IonItem>
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                <IonLabel style={{ fontFamily: 'var(--md-font)' }}>Built with</IonLabel>
                <IonNote slot="end" style={{ fontFamily: 'var(--md-font)' }}>Ionic + React + SQLite</IonNote>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={toast}
          message="Profile saved"
          duration={1800}
          onDidDismiss={() => setToast(false)}
          style={{ '--background': 'var(--md-inverse-surface)', '--color': 'var(--md-inverse-on-surface)' } as React.CSSProperties}
        />

      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
