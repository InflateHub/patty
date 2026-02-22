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

// ── Shared minor styles ───────────────────────────────────────────────────────
const hdr: React.CSSProperties = { paddingTop: 20, paddingBottom: 4 };
const transparentItem = { '--background': 'transparent' } as React.CSSProperties;

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
            <IonButton strong onClick={handleSave}>Save</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>

        {/* ── About Me ──────────────────────────────────────────────────── */}
        <IonCard>
          <IonListHeader style={hdr}>About Me</IonListHeader>
          <IonCardContent style={{ padding: '4px 0 12px' }}>
            <IonList lines="inset" style={{ background: 'transparent' }}>

              {/* Name */}
              <IonItem style={transparentItem}>
                <IonLabel position="stacked">Display name</IonLabel>
                <IonInput
                  value={form.name}
                  placeholder="Your name"
                  onIonInput={e => setForm(f => ({ ...f, name: (e.detail.value ?? '') as string }))}
                />
              </IonItem>

              {/* Date of birth */}
              <IonItem style={transparentItem}>
                <IonLabel position="stacked">Date of birth</IonLabel>
                <IonInput
                  type="date"
                  value={form.dob}
                  onIonInput={e => setForm(f => ({ ...f, dob: (e.detail.value ?? '') as string }))}
                />
                {dobAge > 0 && (
                  <IonNote slot="end" style={{ alignSelf: 'center' }}>{dobAge} yrs</IonNote>
                )}
              </IonItem>

              {/* Biological sex */}
              <IonItem style={transparentItem} lines="none">
                <div style={{ width: '100%', padding: '10px 0 4px' }}>
                  <p style={{
                    margin: '0 0 10px',
                    fontSize: 'var(--md-label-lg)',
                    color: 'var(--md-on-surface-variant)',
                    fontWeight: 500,
                  }}>
                    Biological sex
                  </p>
                  <IonSegment
                    value={form.sex || ''}
                    onIonChange={e => setForm(f => ({ ...f, sex: (e.detail.value ?? '') as UserProfile['sex'] }))}
                    style={{ width: '100%' }}
                  >
                    <IonSegmentButton value="male"><IonLabel>Male</IonLabel></IonSegmentButton>
                    <IonSegmentButton value="female"><IonLabel>Female</IonLabel></IonSegmentButton>
                    <IonSegmentButton value="other"><IonLabel>Other</IonLabel></IonSegmentButton>
                  </IonSegment>
                </div>
              </IonItem>

            </IonList>
          </IonCardContent>
        </IonCard>

        {/* ── Body Metrics ──────────────────────────────────────────────── */}
        <IonCard>
          <IonListHeader style={hdr}>Body Metrics</IonListHeader>
          <IonCardContent style={{ padding: '4px 0 12px' }}>
            <IonList lines="inset" style={{ background: 'transparent' }}>

              {/* Height */}
              <IonItem style={transparentItem}>
                <IonLabel position="stacked">Height (cm)</IonLabel>
                <IonInput
                  type="number"
                  value={form.heightCm || ''}
                  placeholder="e.g. 170"
                  min={100}
                  max={250}
                  onIonInput={e => setForm(f => ({ ...f, heightCm: Number(e.detail.value ?? 0) }))}
                />
                {form.heightCm > 0 && (
                  <IonNote slot="end" style={{ alignSelf: 'center' }}>
                    {(form.heightCm / 30.48).toFixed(1)} ft
                  </IonNote>
                )}
              </IonItem>

              {/* Activity level */}
              <IonItem style={transparentItem}>
                <IonLabel>Activity level</IonLabel>
                <IonSelect
                  value={form.activity || ''}
                  placeholder="Select"
                  onIonChange={e => setForm(f => ({ ...f, activity: e.detail.value as UserProfile['activity'] }))}
                >
                  <IonSelectOption value="sedentary">Sedentary (desk job)</IonSelectOption>
                  <IonSelectOption value="light">Lightly active (1–3 days/wk)</IonSelectOption>
                  <IonSelectOption value="moderate">Moderately active (3–5 days/wk)</IonSelectOption>
                  <IonSelectOption value="very">Very active (6–7 days/wk)</IonSelectOption>
                </IonSelect>
              </IonItem>

              {/* Goal */}
              <IonItem style={transparentItem} lines="none">
                <IonLabel>Primary goal</IonLabel>
                <IonSelect
                  value={form.goal || ''}
                  placeholder="Select"
                  onIonChange={e => setForm(f => ({ ...f, goal: e.detail.value as UserProfile['goal'] }))}
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
        <IonCard>
          <IonListHeader style={hdr}>Preferences</IonListHeader>
          <IonCardContent style={{ padding: '4px 0 12px' }}>
            <IonList lines="inset" style={{ background: 'transparent' }}>

              {/* Weight unit */}
              <IonItem style={transparentItem} lines="none">
                <div style={{ width: '100%', padding: '10px 0 4px' }}>
                  <p style={{
                    margin: '0 0 10px',
                    fontSize: 'var(--md-label-lg)',
                    color: 'var(--md-on-surface-variant)',
                    fontWeight: 500,
                  }}>
                    Weight unit
                  </p>
                  <IonSegment
                    value={prefForm.weightUnit}
                    onIonChange={e =>
                      setPrefForm(p => ({ ...p, weightUnit: e.detail.value as 'kg' | 'lb' }))
                    }
                    style={{ width: '100%', maxWidth: 220 }}
                  >
                    <IonSegmentButton value="kg"><IonLabel>kg</IonLabel></IonSegmentButton>
                    <IonSegmentButton value="lb"><IonLabel>lb</IonLabel></IonSegmentButton>
                  </IonSegment>
                </div>
              </IonItem>

              {/* Daily water goal */}
              <IonItem style={transparentItem} lines="none">
                <IonLabel position="stacked">Daily water goal (ml)</IonLabel>
                <IonInput
                  type="number"
                  value={prefForm.waterGoalMl}
                  min={500}
                  max={6000}
                  step="100"
                  onIonInput={e =>
                    setPrefForm(p => ({ ...p, waterGoalMl: Number(e.detail.value ?? 2000) }))
                  }
                />
                <IonNote slot="end" style={{ alignSelf: 'center' }}>
                  {(prefForm.waterGoalMl / 1000).toFixed(1)} L
                </IonNote>
              </IonItem>

            </IonList>
          </IonCardContent>
        </IonCard>

        {/* ── App Info ──────────────────────────────────────────────────── */}
        <IonCard style={{ margin: '12px 16px 32px' }}>
          <IonListHeader style={hdr}>App Info</IonListHeader>
          <IonCardContent style={{ padding: '4px 0 12px' }}>
            <IonList lines="none" style={{ background: 'transparent' }}>
              <IonItem style={transparentItem}>
                <IonLabel>Version</IonLabel>
                <IonNote slot="end">1.3.0</IonNote>
              </IonItem>
              <IonItem style={transparentItem}>
                <IonLabel>Built by</IonLabel>
                <IonNote slot="end">Saran Mahadev</IonNote>
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
