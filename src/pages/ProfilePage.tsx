/* ProfilePage — 1.8.0 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  IonAlert,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
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
  IonToggle,
  IonToolbar,
  IonToast,
} from '@ionic/react';
import { lockClosedOutline, trashOutline, warningOutline, refreshOutline, fingerPrintOutline, brushOutline, checkmarkOutline } from 'ionicons/icons';
import { Filesystem, Directory } from '@capacitor/filesystem';

import {
  useProfile,
  UserProfile,
  UserPrefs,
  ageFromDob,
} from '../hooks/useProfile';
import { useAppLock } from '../hooks/useAppLock';
import { applyTheme, SEED_COLOURS } from '../hooks/useTheme';
import PinSetupModal from '../components/PinSetupModal';
import { getDb } from '../db/database';

// ── Shared minor styles ───────────────────────────────────────────────────────
const hdr: React.CSSProperties = { paddingTop: 20, paddingBottom: 4 };
const transparentItem = { '--background': 'transparent' } as React.CSSProperties;

// ── Component ─────────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const { profile, prefs, loading, saveProfile, savePrefs } = useProfile();
  const {
    lockEnabled, biometricEnabled, biometricAvailable,
    enableLock, disableLock, changePIN, setBiometricEnabled,
  } = useAppLock();

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
    themeSeed: '#5C7A6E',
    themeMode: 'system',
    fontSize: 'default',
  });
  // Custom hex input state (separate from swatch selection)
  const [customHex, setCustomHex] = useState<string>('');
  const [customHexError, setCustomHexError] = useState<boolean>(false);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Profile saved');

  // Privacy & Security modal state
  const [pinSetupOpen, setPinSetupOpen]     = useState(false);
  const [changePinOpen, setChangePinOpen]   = useState(false);

  // Danger Zone alert state
  type DangerAction = 'logs' | 'photos' | 'reset' | null;
  const [dangerAction, setDangerAction]     = useState<DangerAction>(null);

  // Sync form state once profile loads
  useEffect(() => {
    if (!loading) {
      setForm(profile);
      setPrefForm(prefs);
      // Pre-fill custom hex if the saved seed is not one of the curated swatches
      const isCurated = SEED_COLOURS.some(c => c.hex.toUpperCase() === prefs.themeSeed.toUpperCase());
      if (!isCurated) setCustomHex(prefs.themeSeed);
    }
  }, [loading, profile, prefs]);

  // ── Save profile
  const dobAge = ageFromDob(form.dob);
  const handleSave = async () => {
    await saveProfile(form);
    await savePrefs(prefForm);
    // Apply theme immediately so changes are visible without restart
    applyTheme(prefForm.themeSeed, prefForm.themeMode, prefForm.fontSize);
    setToastMsg('Profile saved');
    setToast(true);
  };

  // ── Theme helpers
  const isHexValid = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex);

  const handleSwatchPick = (hex: string) => {
    setCustomHex('');
    setCustomHexError(false);
    const next = { ...prefForm, themeSeed: hex };
    setPrefForm(next);
    applyTheme(hex, next.themeMode, next.fontSize);
  };

  const handleCustomHexChange = (raw: string) => {
    setCustomHex(raw);
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    if (isHexValid(hex)) {
      setCustomHexError(false);
      const next = { ...prefForm, themeSeed: hex };
      setPrefForm(next);
      applyTheme(hex, next.themeMode, next.fontSize);
    } else {
      setCustomHexError(raw.length > 0);
    }
  };

  const handleModeChange = (mode: UserPrefs['themeMode']) => {
    const next = { ...prefForm, themeMode: mode };
    setPrefForm(next);
    applyTheme(next.themeSeed, mode, next.fontSize);
  };

  const handleFontChange = (size: UserPrefs['fontSize']) => {
    const next = { ...prefForm, fontSize: size };
    setPrefForm(next);
    applyTheme(next.themeSeed, next.themeMode, size);
  };

  // ── Lock toggle
  const handleLockToggle = useCallback(async (checked: boolean) => {
    if (checked) {
      setPinSetupOpen(true);
    } else {
      await disableLock();
      setToastMsg('App lock disabled');
      setToast(true);
    }
  }, [disableLock]);

  const handlePinSave = useCallback(async (pin: string) => {
    await enableLock(pin, false);
    setPinSetupOpen(false);
    setToastMsg('App lock enabled');
    setToast(true);
  }, [enableLock]);

  const handleChangePinSave = useCallback(async (pin: string) => {
    await changePIN(pin);
    setChangePinOpen(false);
    setToastMsg('PIN updated');
    setToast(true);
  }, [changePIN]);

  const handleBiometricToggle = useCallback(async (checked: boolean) => {
    await setBiometricEnabled(checked);
    setToastMsg(checked ? 'Biometric unlock enabled' : 'Biometric unlock disabled');
    setToast(true);
  }, [setBiometricEnabled]);

  // ── Data clear
  const handleClearLogs = useCallback(async () => {
    const db = await getDb();
    await db.run('DELETE FROM weight_entries;');
    await db.run('DELETE FROM water_entries;');
    await db.run('DELETE FROM sleep_entries;');
    await db.run('DELETE FROM food_entries;');
    setToastMsg('All logs cleared');
    setToast(true);
    setDangerAction(null);
  }, []);

  const handleClearPhotos = useCallback(async () => {
    const db = await getDb();
    const res = await db.query('SELECT photo_path FROM weight_entries WHERE photo_path IS NOT NULL;');
    for (const row of res.values ?? []) {
      if (row.photo_path) {
        try {
          await Filesystem.deleteFile({ path: row.photo_path, directory: Directory.Data });
        } catch { /* ignore if already gone */ }
      }
    }
    await db.run('UPDATE weight_entries SET photo_path = NULL;');
    setToastMsg('Progress photos cleared');
    setToast(true);
    setDangerAction(null);
  }, []);

  const handleFactoryReset = useCallback(async () => {
    // 1. Delete all photos from filesystem
    const db = await getDb();
    const res = await db.query('SELECT photo_path FROM weight_entries WHERE photo_path IS NOT NULL;');
    for (const row of res.values ?? []) {
      if (row.photo_path) {
        try {
          await Filesystem.deleteFile({ path: row.photo_path, directory: Directory.Data });
        } catch { /* ignore */ }
      }
    }
    // 2. Wipe all data tables
    await db.run('DELETE FROM weight_entries;');
    await db.run('DELETE FROM water_entries;');
    await db.run('DELETE FROM sleep_entries;');
    await db.run('DELETE FROM food_entries;');
    await db.run('DELETE FROM user_recipes;');
    await db.run('DELETE FROM deleted_seed_recipes;');
    await db.run('DELETE FROM meal_plan_slots;');
    await db.run('DELETE FROM settings;');
    setDangerAction(null);
    // 3. Reload the page — StartupGate will route to /onboarding
    window.location.href = '/';
  }, []);

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

        {/* ── Theme ─────────────────────────────────────────────────────── */}
        <IonCard>
          <IonListHeader style={hdr}>
            <IonIcon icon={brushOutline} style={{ marginRight: 8, color: 'var(--md-primary)', fontSize: 16 }} />
            Appearance
          </IonListHeader>
          <IonCardContent style={{ padding: '4px 0 20px' }}>

            {/* ── Live preview card ──────────────────────────────────── */}
            <div style={{
              margin: '8px 16px 20px',
              borderRadius: 'var(--md-shape-xl)',
              padding: '16px',
              background: 'var(--md-primary-container)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}>
              {/* FAB preview circle */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--md-primary)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>🌿</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: '0 0 4px',
                  fontSize: 'var(--md-title-sm)',
                  fontWeight: 600,
                  color: 'var(--md-on-primary-container)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  Theme Preview
                </p>
                <p style={{
                  margin: 0,
                  fontSize: 'var(--md-body-sm)',
                  color: 'var(--md-on-primary-container)',
                  opacity: 0.8,
                }}>Live — changes are applied instantly</p>
              </div>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: prefForm.themeSeed,
                border: '2px solid var(--md-outline)',
                flexShrink: 0,
              }} />
            </div>

            {/* ── Seed colour swatches ───────────────────────────────── */}
            <div style={{ padding: '0 16px 4px' }}>
              <p style={{
                margin: '0 0 12px',
                fontSize: 'var(--md-label-lg)',
                color: 'var(--md-on-surface-variant)',
                fontWeight: 500,
              }}>Accent colour</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {SEED_COLOURS.map(({ hex, label }) => {
                  const isActive = prefForm.themeSeed.toUpperCase() === hex.toUpperCase();
                  return (
                    <button
                      key={hex}
                      title={label}
                      onClick={() => handleSwatchPick(hex)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: hex,
                        border: isActive ? `3px solid var(--md-on-surface)` : '3px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        outline: 'none',
                        boxShadow: isActive ? '0 0 0 2px var(--md-surface), 0 0 0 4px var(--md-on-surface)' : 'none',
                        transition: 'box-shadow 0.15s',
                      }}
                    >
                      {isActive && (
                        <IonIcon
                          icon={checkmarkOutline}
                          style={{ color: '#fff', fontSize: 16, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom hex input */}
              <div style={{ marginTop: 14 }}>
                <p style={{
                  margin: '0 0 8px',
                  fontSize: 'var(--md-label-lg)',
                  color: 'var(--md-on-surface-variant)',
                  fontWeight: 500,
                }}>Custom hex</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

                  {/* Clickable circle — opens native colour picker */}
                  <button
                    title="Open colour picker"
                    onClick={() => colorPickerRef.current?.click()}
                    style={{
                      position: 'relative',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isHexValid(customHex.startsWith('#') ? customHex : `#${customHex}`)
                        ? (customHex.startsWith('#') ? customHex : `#${customHex}`)
                        : 'var(--md-surface-variant)',
                      border: '2px solid var(--md-outline-variant)',
                      flexShrink: 0,
                      cursor: 'pointer',
                      padding: 0,
                      outline: 'none',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Pencil overlay hint */}
                    <span style={{
                      fontSize: 13,
                      lineHeight: 1,
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
                      pointerEvents: 'none',
                    }}>✏️</span>

                    {/* Hidden native colour picker */}
                    <input
                      ref={colorPickerRef}
                      type="color"
                      value={
                        isHexValid(customHex.startsWith('#') ? customHex : `#${customHex}`)
                          ? (customHex.startsWith('#') ? customHex : `#${customHex}`)
                          : '#5C7A6E'
                      }
                      onChange={e => handleCustomHexChange(e.target.value)}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        padding: 0,
                        border: 'none',
                        top: 0,
                        left: 0,
                      }}
                    />
                  </button>

                  <IonInput
                    value={customHex}
                    placeholder="#RRGGBB"
                    maxlength={7}
                    style={{
                      '--background': 'var(--md-surface-variant)',
                      '--color': 'var(--md-on-surface)',
                      '--border-radius': 'var(--md-shape-sm)',
                      '--padding-start': '10px',
                      '--padding-end': '10px',
                      fontSize: 'var(--md-body-md)',
                      flex: 1,
                    } as React.CSSProperties}
                    onIonInput={e => handleCustomHexChange((e.detail.value ?? '') as string)}
                  />
                  {customHexError && (
                    <IonNote style={{ color: 'var(--md-error)', fontSize: 'var(--md-body-sm)' }}>
                      Invalid
                    </IonNote>
                  )}
                </div>
              </div>
            </div>

            {/* ── Appearance mode ───────────────────────────────────── */}
            <div style={{ padding: '20px 16px 0' }}>
              <p style={{
                margin: '0 0 10px',
                fontSize: 'var(--md-label-lg)',
                color: 'var(--md-on-surface-variant)',
                fontWeight: 500,
              }}>Mode</p>
              <IonSegment
                value={prefForm.themeMode}
                onIonChange={e => handleModeChange(e.detail.value as UserPrefs['themeMode'])}
                style={{ width: '100%' }}
              >
                <IonSegmentButton value="system"><IonLabel>System</IonLabel></IonSegmentButton>
                <IonSegmentButton value="light"><IonLabel>Light</IonLabel></IonSegmentButton>
                <IonSegmentButton value="dark"><IonLabel>Dark</IonLabel></IonSegmentButton>
              </IonSegment>
            </div>

            {/* ── Text size ─────────────────────────────────────────── */}
            <div style={{ padding: '20px 16px 4px' }}>
              <p style={{
                margin: '0 0 10px',
                fontSize: 'var(--md-label-lg)',
                color: 'var(--md-on-surface-variant)',
                fontWeight: 500,
              }}>Text size</p>
              <IonSegment
                value={prefForm.fontSize}
                onIonChange={e => handleFontChange(e.detail.value as UserPrefs['fontSize'])}
                style={{ width: '100%' }}
              >
                <IonSegmentButton value="default"><IonLabel>Default</IonLabel></IonSegmentButton>
                <IonSegmentButton value="large"><IonLabel>Large</IonLabel></IonSegmentButton>
                <IonSegmentButton value="xl"><IonLabel>XL</IonLabel></IonSegmentButton>
              </IonSegment>
            </div>

          </IonCardContent>
        </IonCard>

        {/* ── Privacy & Security ────────────────────────────────────────── */}
        <IonCard>
          <IonListHeader style={hdr}>
            <IonIcon icon={lockClosedOutline} style={{ marginRight: 8, color: 'var(--md-primary)', fontSize: 16 }} />
            Privacy &amp; Security
          </IonListHeader>
          <IonCardContent style={{ padding: '4px 0 12px' }}>
            <IonList lines="inset" style={{ background: 'transparent' }}>

              {/* App Lock toggle */}
              <IonItem style={transparentItem}>
                <IonLabel>
                  <h3>App Lock</h3>
                  <p style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                    {lockEnabled ? 'Lock with PIN on background' : 'Disabled'}
                  </p>
                </IonLabel>
                <IonToggle
                  slot="end"
                  checked={lockEnabled}
                  onIonChange={e => handleLockToggle(e.detail.checked)}
                />
              </IonItem>

              {/* Biometric toggle — only when lock enabled */}
              {lockEnabled && (
                <IonItem style={transparentItem}>
                  <IonIcon icon={fingerPrintOutline} slot="start" style={{ color: biometricAvailable ? 'var(--md-primary)' : 'var(--md-on-surface-variant)', fontSize: 20 }} />
                  <IonLabel>
                    <h3>Biometric Unlock</h3>
                    <p style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                      {biometricAvailable ? 'Face ID / Fingerprint' : 'Not available on this device'}
                    </p>
                  </IonLabel>
                  <IonToggle
                    slot="end"
                    checked={biometricEnabled}
                    disabled={!biometricAvailable}
                    onIonChange={e => handleBiometricToggle(e.detail.checked)}
                  />
                </IonItem>
              )}

              {/* Change PIN — only when lock enabled */}
              {lockEnabled && (
                <IonItem style={transparentItem} lines="none" button onClick={() => setChangePinOpen(true)}>
                  <IonLabel style={{ color: 'var(--md-primary)' }}>Change PIN</IonLabel>
                </IonItem>
              )}

            </IonList>
          </IonCardContent>
        </IonCard>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <IonCard>
          <IonListHeader style={{ ...hdr, color: 'var(--md-error)' }}>
            <IonIcon icon={warningOutline} style={{ marginRight: 8, fontSize: 16 }} />
            Danger Zone
          </IonListHeader>
          <IonCardContent style={{ padding: '4px 0 12px' }}>
            <IonList lines="none" style={{ background: 'transparent' }}>

              <IonItem style={transparentItem} button onClick={() => setDangerAction('logs')}>
                <IonIcon icon={trashOutline} slot="start" style={{ color: 'var(--md-error)', fontSize: 20 }} />
                <IonLabel>
                  <h3 style={{ color: 'var(--md-error)' }}>Clear Logs</h3>
                  <p style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                    Delete all weight, water, sleep &amp; food entries
                  </p>
                </IonLabel>
              </IonItem>

              <IonItem style={transparentItem} button onClick={() => setDangerAction('photos')}>
                <IonIcon icon={trashOutline} slot="start" style={{ color: 'var(--md-error)', fontSize: 20 }} />
                <IonLabel>
                  <h3 style={{ color: 'var(--md-error)' }}>Clear Photos</h3>
                  <p style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                    Delete all progress photos from storage
                  </p>
                </IonLabel>
              </IonItem>

              <IonItem style={transparentItem} button onClick={() => setDangerAction('reset')}>
                <IonIcon icon={refreshOutline} slot="start" style={{ color: 'var(--md-error)', fontSize: 20 }} />
                <IonLabel>
                  <h3 style={{ color: 'var(--md-error)' }}>Factory Reset</h3>
                  <p style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                    Erase all data and restart onboarding
                  </p>
                </IonLabel>
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
                <IonNote slot="end">1.8.0</IonNote>
              </IonItem>
              <IonItem style={transparentItem}>
                <IonLabel>Built by</IonLabel>
                <IonNote slot="end">Saran Mahadev</IonNote>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* ── PIN Setup modal (enable) */}
        <PinSetupModal
          isOpen={pinSetupOpen}
          title="Set App PIN"
          onSave={handlePinSave}
          onCancel={() => setPinSetupOpen(false)}
        />

        {/* ── Change PIN modal */}
        <PinSetupModal
          isOpen={changePinOpen}
          title="Change PIN"
          onSave={handleChangePinSave}
          onCancel={() => setChangePinOpen(false)}
        />

        {/* ── Danger Zone — Clear Logs alert */}
        <IonAlert
          isOpen={dangerAction === 'logs'}
          header="Clear All Logs?"
          message="This will permanently delete all weight, water, sleep and food entries. This cannot be undone."
          buttons={[
            { text: 'Cancel', role: 'cancel', handler: () => setDangerAction(null) },
            { text: 'Delete', role: 'destructive', cssClass: 'alert-button-danger', handler: handleClearLogs },
          ]}
          onDidDismiss={() => setDangerAction(null)}
        />

        {/* ── Danger Zone — Clear Photos alert */}
        <IonAlert
          isOpen={dangerAction === 'photos'}
          header="Delete All Photos?"
          message="All progress photos will be permanently removed from your device. This cannot be undone."
          buttons={[
            { text: 'Cancel', role: 'cancel', handler: () => setDangerAction(null) },
            { text: 'Delete', role: 'destructive', cssClass: 'alert-button-danger', handler: handleClearPhotos },
          ]}
          onDidDismiss={() => setDangerAction(null)}
        />

        {/* ── Danger Zone — Factory Reset alert */}
        <IonAlert
          isOpen={dangerAction === 'reset'}
          header="Factory Reset?"
          message="ALL data will be wiped — logs, photos, recipes, meal plans, settings and your profile. The app will restart. This cannot be undone."
          buttons={[
            { text: 'Cancel', role: 'cancel', handler: () => setDangerAction(null) },
            { text: 'Reset Everything', role: 'destructive', cssClass: 'alert-button-danger', handler: handleFactoryReset },
          ]}
          onDidDismiss={() => setDangerAction(null)}
        />

        <IonToast
          isOpen={toast}
          message={toastMsg}
          duration={1800}
          onDidDismiss={() => setToast(false)}
          style={{ '--background': 'var(--md-inverse-surface)', '--color': 'var(--md-inverse-on-surface)' } as React.CSSProperties}
        />

      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
