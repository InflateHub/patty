/* ProfilePage — 3.0.0 */
import React, { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonActionSheet,
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
import { lockClosedOutline, trashOutline, warningOutline, refreshOutline, fingerPrintOutline, brushOutline, checkmarkOutline, chevronForwardOutline, notificationsOutline, trophyOutline, sparkles, cameraOutline, imageOutline, ribbonOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

import {
  useProfile,
  UserProfile,
  UserPrefs,
  ageFromDob,
} from '../hooks/useProfile';
import { useAppLock } from '../hooks/useAppLock';
import { applyTheme, SEED_COLOURS } from '../hooks/useTheme';
import { useGamification, getLevel } from '../hooks/useGamification';
import PinSetupModal from '../components/PinSetupModal';
import ColorPicker from '../components/ColorPicker';
import { getDb } from '../db/database';
import { useGeminiKey } from '../hooks/useGeminiKey';
import { testGeminiKey, geminiErrorMessage } from '../utils/gemini';

// ── Shared minor styles ───────────────────────────────────────────────────────
// Gender emoji helper
function genderEmoji(sex: string): string {
  if (sex === 'male')   return '\ud83d\udc68';
  if (sex === 'female') return '\ud83d\udc69';
  return '\ud83e\uddd1';
}

const hdr: React.CSSProperties = { paddingTop: 20, paddingBottom: 4 };
const transparentItem = { '--background': 'transparent' } as React.CSSProperties;

// ── Component ─────────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const history = useHistory();
  const { profile, prefs, loading, saveProfile, savePrefs } = useProfile();
  const gamification = useGamification();
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
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Profile saved');

  // Profile photo
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);

  // AI Settings
  const { geminiKey, saveKey: saveGeminiKey } = useGeminiKey();
  const [keyInput, setKeyInput] = useState('');
  const [testingKey, setTestingKey] = useState(false);

  // Sync keyInput when hook loads
  useEffect(() => { setKeyInput(geminiKey); }, [geminiKey]);

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
      // Load profile photo from settings
      (async () => {
        try {
          const db = await import('../db/database').then(m => m.getDb());
          const res = await db.query("SELECT value FROM settings WHERE key = 'profile_photo';");
          const val = res.values?.[0]?.value as string | undefined;
          if (val) setProfilePhoto(val);
        } catch { /* ignore */ }
      })();
    }
  }, [loading, profile, prefs]);

  // Save or clear profile photo in settings
  const handleSaveProfilePhoto = useCallback(async (dataUrl: string | null) => {
    try {
      const db = await import('../db/database').then(m => m.getDb());
      if (dataUrl) {
        await db.run(
          "INSERT INTO settings (key, value) VALUES ('profile_photo', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;",
          [dataUrl],
        );
      } else {
        await db.run("DELETE FROM settings WHERE key = 'profile_photo';");
      }
      setProfilePhoto(dataUrl);
    } catch { setToastMsg('Could not save photo'); setToast(true); }
  }, []);

  // Capture profile photo
  const pickProfilePhoto = useCallback(async (source: CameraSource) => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source,
        quality: 70,
        width: 512,
        height: 512,
        correctOrientation: true,
      });
      if (photo.dataUrl) await handleSaveProfilePhoto(photo.dataUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('cancel')) {
        setToastMsg('Could not capture photo');
        setToast(true);
      }
    }
  }, [handleSaveProfilePhoto]);

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
  const handleSwatchPick = (hex: string) => {
    const next = { ...prefForm, themeSeed: hex };
    setPrefForm(next);
    applyTheme(hex, next.themeMode, next.fontSize);
  };

  const handleColorPickerApply = (hex: string) => {
    setColorPickerOpen(false);
    const next = { ...prefForm, themeSeed: hex };
    setPrefForm(next);
    applyTheme(hex, next.themeMode, next.fontSize);
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

        {/* ── Identity Hero ────────────────────────────────────────────── */}
        <div style={{
          margin: '16px 16px 0',
          borderRadius: 'var(--md-shape-xl)',
          overflow: 'hidden',
          position: 'relative',
          animation: 'profile-hero-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          {/* Animated gradient background */}
          <div style={{
            position: 'absolute', inset: 0,
            background: !gamification.loading
              ? `linear-gradient(145deg, color-mix(in srgb, ${gamification.level.color} 28%, var(--md-surface)) 0%, color-mix(in srgb, var(--md-primary-container) 70%, var(--md-surface)) 55%, var(--md-surface-variant) 100%)`
              : 'var(--md-surface-variant)',
            transition: 'background 1.2s ease',
          }} />
          {/* Subtle mesh circles */}
          <div style={{
            position: 'absolute', top: -40, right: -30,
            width: 160, height: 160, borderRadius: '50%',
            background: !gamification.loading ? `radial-gradient(circle, ${gamification.level.color}33 0%, transparent 70%)` : 'transparent',
            animation: 'profile-orb-drift 6s ease-in-out infinite alternate',
          }} />
          <div style={{
            position: 'absolute', bottom: -50, left: -20,
            width: 130, height: 130, borderRadius: '50%',
            background: 'radial-gradient(circle, color-mix(in srgb, var(--md-primary) 18%, transparent) 0%, transparent 70%)',
            animation: 'profile-orb-drift 8s ease-in-out infinite alternate-reverse',
          }} />

          <div style={{ position: 'relative', padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

            {/* Tier badge — top-right */}
            <div
              onClick={() => history.push('/pro')}
              style={{
                position: 'absolute', top: 16, right: 16,
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px',
                borderRadius: 'var(--md-shape-full)',
                background: 'color-mix(in srgb, var(--md-surface) 60%, transparent)',
                border: '1px solid color-mix(in srgb, var(--md-outline) 30%, transparent)',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                animation: 'profile-badge-in 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
              }}
            >
              {/* TODO: swap to "✦ Pro" chip in 3.2.0 when isPro */}
              <span style={{ fontSize: 10, fontFamily: 'var(--md-font)', fontWeight: 800, color: 'var(--md-on-surface-variant)', letterSpacing: 0.8, textTransform: 'uppercase' }}>Free</span>
            </div>

            {/* Avatar with glowing ring */}
            <div
              style={{ position: 'relative', cursor: 'pointer', marginBottom: 14 }}
              onClick={() => setPhotoSheetOpen(true)}
            >
              {/* Pulsing ring */}
              <div style={{
                position: 'absolute', inset: -4,
                borderRadius: '50%',
                border: !gamification.loading ? `2.5px solid ${gamification.level.color}` : '2.5px solid var(--md-primary)',
                animation: 'profile-ring-pulse 2.8s ease-in-out infinite',
              }} />
              {/* Outer glow */}
              <div style={{
                position: 'absolute', inset: -8,
                borderRadius: '50%',
                background: !gamification.loading ? `radial-gradient(circle, ${gamification.level.color}28 0%, transparent 70%)` : 'transparent',
              }} />
              {/* Avatar */}
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                background: 'color-mix(in srgb, var(--md-primary-container) 80%, var(--md-surface))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
              }}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <span style={{ fontSize: 40, lineHeight: 1, userSelect: 'none' }}>
                    {form.sex ? genderEmoji(form.sex) : (profile.name ? profile.name.charAt(0).toUpperCase() : '?')}
                  </span>
                )}
              </div>
              {/* Camera badge */}
              <div style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--md-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2.5px solid var(--md-surface)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}>
                <IonIcon icon={cameraOutline} style={{ fontSize: 12, color: 'var(--md-on-primary)' }} />
              </div>
            </div>

            {/* Name */}
            <p style={{
              margin: '0 0 10px',
              fontSize: 'var(--md-headline-sm)',
              fontFamily: 'var(--md-font)',
              fontWeight: 700,
              color: 'var(--md-on-surface)',
              textAlign: 'center',
              letterSpacing: -0.3,
            }}>
              {profile.name || 'Your Name'}
            </p>

            {/* Level chip — with shimmer */}
            {!gamification.loading && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 16px',
                borderRadius: 'var(--md-shape-full)',
                background: `color-mix(in srgb, ${gamification.level.color} 18%, var(--md-surface))`,
                border: `1.5px solid ${gamification.level.color}66`,
                marginBottom: 16,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Shimmer sweep */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
                  animation: 'profile-shimmer 3.5s ease-in-out infinite',
                }} />
                <span style={{ fontSize: 15 }}>{gamification.level.emoji}</span>
                <span style={{
                  fontSize: 'var(--md-label-lg)',
                  fontFamily: 'var(--md-font)',
                  fontWeight: 700,
                  color: gamification.level.color,
                }}>
                  Level {gamification.xp > 0 ? Math.floor(Math.log2(gamification.xp / 50) + 2) : 1} · {gamification.level.name}
                </span>
              </div>
            )}

            {/* XP progress bar toward next level */}
            {!gamification.loading && (() => {
              const lvl = gamification.xp > 0 ? Math.floor(Math.log2(gamification.xp / 50) + 2) : 1;
              const curThreshold = lvl <= 1 ? 0 : Math.round(50 * Math.pow(2, lvl - 2));
              const nextThreshold = Math.round(50 * Math.pow(2, lvl - 1));
              const pct = Math.min(100, Math.round(((gamification.xp - curThreshold) / (nextThreshold - curThreshold)) * 100));
              return (
                <div style={{ width: '100%', marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>{gamification.xp.toLocaleString()} XP</span>
                    <span style={{ fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>Next: {nextThreshold.toLocaleString()}</span>
                  </div>
                  <div style={{
                    height: 6, borderRadius: 99,
                    background: 'color-mix(in srgb, var(--md-outline-variant) 60%, transparent)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: 99,
                      background: `linear-gradient(90deg, ${gamification.level.color}, color-mix(in srgb, ${gamification.level.color} 70%, var(--md-primary)))`,
                      animation: 'profile-xp-fill 1.1s 0.3s cubic-bezier(0.4,0,0.2,1) both',
                      boxShadow: `0 0 8px ${gamification.level.color}88`,
                    }} />
                  </div>
                </div>
              );
            })()}

            {/* Stats row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1px 1fr',
              width: '100%',
              background: 'color-mix(in srgb, var(--md-surface) 50%, transparent)',
              borderRadius: 'var(--md-shape-lg)',
              border: '1px solid color-mix(in srgb, var(--md-outline-variant) 50%, transparent)',
              backdropFilter: 'blur(6px)',
              overflow: 'hidden',
            }}>
              <div style={{ textAlign: 'center', padding: '12px 8px' }}>
                <p style={{ margin: 0, fontSize: 'var(--md-title-lg)', fontFamily: 'var(--md-font)', fontWeight: 800, color: 'var(--md-on-surface)', letterSpacing: -0.5 }}>
                  {gamification.loading ? '—' : gamification.xp.toLocaleString()}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>Total XP</p>
              </div>
              <div style={{ background: 'var(--md-outline-variant)', opacity: 0.5 }} />
              <div style={{ textAlign: 'center', padding: '12px 8px' }}>
                <p style={{ margin: 0, fontSize: 'var(--md-title-lg)', fontFamily: 'var(--md-font)', fontWeight: 800, color: 'var(--md-on-surface)', letterSpacing: -0.5 }}>
                  {gamification.loading ? '—' : `${gamification.bestStreak}🔥`}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>Best Streak</p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Pro banner ───────────────────────────────────────────────── */}
        <div
          onClick={() => history.push('/pro')}
          style={{
            margin: '10px 16px 0',
            padding: '12px 16px',
            borderRadius: 'var(--md-shape-xl)',
            background: 'linear-gradient(110deg, color-mix(in srgb, var(--md-primary-container) 80%, var(--md-surface)), color-mix(in srgb, var(--md-primary) 22%, var(--md-surface-variant)))',
            border: '1px solid color-mix(in srgb, var(--md-primary) 28%, transparent)',
            display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer',
            position: 'relative', overflow: 'hidden',
            animation: 'profile-hero-in 0.45s 0.1s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          {/* Moving shimmer */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
            animation: 'profile-shimmer 4s 1s ease-in-out infinite',
          }} />
          <div style={{
            width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--md-shape-md)',
            background: 'var(--md-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px color-mix(in srgb, var(--md-primary) 40%, transparent)',
          }}>
            <IonIcon icon={ribbonOutline} style={{ fontSize: 20, color: 'var(--md-on-primary)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 'var(--md-title-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface)' }}>Patty Pro</p>
            <p style={{ margin: '1px 0 0', fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>Unlimited AI · no ads · and more</p>
          </div>
          <IonIcon icon={chevronForwardOutline} style={{ color: 'var(--md-primary)', fontSize: 20, flexShrink: 0 }} />
        </div>

        {/* Keyframes */}
        <style>{`
          @keyframes profile-hero-in {
            from { opacity: 0; transform: translateY(18px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes profile-badge-in {
            from { opacity: 0; transform: scale(0.7); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes profile-ring-pulse {
            0%, 100% { transform: scale(1);    opacity: 1; }
            50%       { transform: scale(1.06); opacity: 0.65; }
          }
          @keyframes profile-orb-drift {
            from { transform: translate(0, 0) scale(1); }
            to   { transform: translate(14px, -10px) scale(1.12); }
          }
          @keyframes profile-shimmer {
            0%   { transform: translateX(-100%); }
            60%, 100% { transform: translateX(200%); }
          }
          @keyframes profile-xp-fill {
            from { width: 0%; }
          }
        `}</style>

        {/* ── Notifications + Achievements nav ─────────────────────────── */}
        <IonCard>
          <IonCardContent style={{ padding: '4px 0 12px' }}>
            <IonList lines="inset" style={{ background: 'transparent' }}>
              <IonItem
                style={{ ...transparentItem, cursor: 'pointer' }}
                button
                detail={false}
                onClick={() => history.push('/tabs/notifications')}
              >
                <IonIcon icon={notificationsOutline} slot="start" style={{ color: 'var(--md-primary)', fontSize: 20 }} />
                <IonLabel style={{ fontFamily: 'var(--md-font)' }}>Notifications</IonLabel>
                <IonIcon icon={chevronForwardOutline} slot="end" style={{ color: 'var(--md-on-surface-variant)', fontSize: 18 }} />
              </IonItem>
              <IonItem
                style={{ ...transparentItem, cursor: 'pointer' }}
                button
                detail={false}
                lines="none"
                onClick={() => history.push('/tabs/achievements')}
              >
                <IonIcon icon={trophyOutline} slot="start" style={{ color: 'var(--md-primary)', fontSize: 20 }} />
                <IonLabel style={{ fontFamily: 'var(--md-font)' }}>Achievements</IonLabel>
                <IonIcon icon={chevronForwardOutline} slot="end" style={{ color: 'var(--md-on-surface-variant)', fontSize: 18 }} />
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

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
                {/* Custom colour picker chip */}
                {(() => {
                  const isCustom = SEED_COLOURS.every(c => c.hex.toUpperCase() !== prefForm.themeSeed.toUpperCase());
                  return (
                    <button
                      title="Custom colour"
                      onClick={() => setColorPickerOpen(true)}
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: isCustom
                          ? prefForm.themeSeed
                          : "conic-gradient(#f00 0deg,#ff0 60deg,#0f0 120deg,#0ff 180deg,#00f 240deg,#f0f 300deg,#f00 360deg)",
                        border: isCustom ? "3px solid var(--md-on-surface)" : "3px solid transparent",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", padding: 0, outline: "none",
                        boxShadow: isCustom ? "0 0 0 2px var(--md-surface), 0 0 0 4px var(--md-on-surface)" : "none",
                        transition: "box-shadow 0.15s",
                      }}
                    >
                      {isCustom && (
                        <IonIcon icon={checkmarkOutline} style={{ color: "#fff", fontSize: 16, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
                      )}
                    </button>
                  );
                })()}
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
        {/* ── AI Settings ─────────────────────────────────────────────── */}
        <IonCard>
          <IonListHeader style={hdr}>
            <IonIcon icon={sparkles} style={{ marginRight: 8, color: 'var(--md-primary)', fontSize: 16 }} />
            AI Settings
          </IonListHeader>
          <IonCardContent style={{ padding: '12px 16px 16px' }}>
            <p style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)', marginTop: 0, marginBottom: 12 }}>
              Patty uses Gemini Flash to scan food photos for macros, generate recipes, and plan your week. Your key is stored locally and never shared.
            </p>

            {/* Key input */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Gemini API Key</div>
              <IonInput
                type="password"
                value={keyInput}
                onIonInput={(e) => setKeyInput(e.detail.value ?? '')}
                placeholder="AIza…"
                style={{ '--background': 'var(--md-surface-container)', '--border-radius': 'var(--md-shape-md)', '--padding-start': '14px', '--padding-end': '14px' } as React.CSSProperties}
              />
              <p style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)', margin: '6px 4px 0' }}>
                Get a free key at{' '}
                <span
                  style={{ color: 'var(--md-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank', 'noopener')}
                >
                  aistudio.google.com
                </span>
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <IonButton
                fill="outline"
                size="small"
                disabled={testingKey || !keyInput.trim()}
                style={{ '--border-radius': 'var(--md-shape-full)', '--border-color': 'var(--md-outline)', '--color': 'var(--md-on-surface)' } as React.CSSProperties}
                onClick={async () => {
                  setTestingKey(true);
                  try {
                    await testGeminiKey(keyInput.trim());
                    setToastMsg('✓ Key is valid!');
                    setToast(true);
                  } catch (err) {
                    setToastMsg(geminiErrorMessage(err));
                    setToast(true);
                  } finally {
                    setTestingKey(false);
                  }
                }}
              >
                {testingKey ? 'Testing…' : 'Test Key'}
              </IonButton>
              <IonButton
                size="small"
                disabled={!keyInput.trim()}
                style={{ '--border-radius': 'var(--md-shape-full)', '--background': 'var(--md-primary)', '--color': 'var(--md-on-primary)' } as React.CSSProperties}
                onClick={async () => {
                  await saveGeminiKey(keyInput);
                  setToastMsg('API key saved');
                  setToast(true);
                }}
              >
                Save Key
              </IonButton>
              {geminiKey && (
                <IonButton
                  fill="clear"
                  size="small"
                  style={{ '--color': 'var(--md-error)' } as React.CSSProperties}
                  onClick={async () => {
                    await saveGeminiKey('');
                    setKeyInput('');
                    setToastMsg('API key removed');
                    setToast(true);
                  }}
                >
                  Remove
                </IonButton>
              )}
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
              <IonItem
                style={{ ...transparentItem, cursor: 'pointer' }}
                button
                detail
                onClick={() => window.open('https://patty.saranmahadev.in', '_blank', 'noopener')}
              >
                <IonLabel>Version</IonLabel>
                <IonNote slot="end">3.1.0</IonNote>
              </IonItem>
              <IonItem
                style={{ ...transparentItem, cursor: 'pointer' }}
                button
                detail
                onClick={() => window.open('https://saranmahadev.in/#contact', '_blank', 'noopener')}
              >
                <IonLabel>Built by</IonLabel>
                <IonNote slot="end">Saran Mahadev</IonNote>
              </IonItem>
              <IonItem
                style={{ ...transparentItem, cursor: 'pointer' }}
                button
                detail
                onClick={() => window.open('mailto:hello@saranmahadev.in?subject=Patty%20Feedback', '_blank', 'noopener')}
              >
                <IonLabel style={{ color: 'var(--md-primary)' }}>Send Feedback</IonLabel>
              </IonItem>
              <IonItem
                style={{ ...transparentItem, cursor: 'pointer' }}
                button
                detail
                onClick={() => window.open('https://play.google.com/store/apps/details?id=com.patty.app', '_blank', 'noopener')}
              >
                <IonLabel style={{ color: 'var(--md-primary)' }}>Rate on Play Store</IonLabel>
              </IonItem>
              <IonItem
                style={{ ...transparentItem, cursor: 'pointer' }}
                button
                detail
                onClick={() => history.push('/privacy-policy')}
              >
                <IonLabel style={{ color: 'var(--md-primary)' }}>Privacy Policy</IonLabel>
              </IonItem>
              <IonItem
                style={{ ...transparentItem, cursor: 'pointer' }}
                button
                detail
                onClick={() => history.push('/terms')}
              >
                <IonLabel style={{ color: 'var(--md-primary)' }}>Terms &amp; Conditions</IonLabel>
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

        {/* ── Custom colour picker */}
        <ColorPicker
          isOpen={colorPickerOpen}
          initialColor={prefForm.themeSeed}
          onClose={() => setColorPickerOpen(false)}
          onApply={handleColorPickerApply}
        />

        <IonToast
          isOpen={toast}
          message={toastMsg}
          duration={1800}
          onDidDismiss={() => setToast(false)}
          style={{ '--background': 'var(--md-inverse-surface)', '--color': 'var(--md-inverse-on-surface)' } as React.CSSProperties}
        />

        {/* ── Profile photo action sheet */}
        <IonActionSheet
          isOpen={photoSheetOpen}
          onDidDismiss={() => setPhotoSheetOpen(false)}
          header="Profile Photo"
          buttons={[
            {
              text: 'Take Photo',
              icon: cameraOutline,
              handler: () => pickProfilePhoto(CameraSource.Camera),
            },
            {
              text: 'Choose from Gallery',
              icon: imageOutline,
              handler: () => pickProfilePhoto(CameraSource.Photos),
            },
            ...(profilePhoto ? [{
              text: 'Remove Photo',
              icon: trashOutline,
              role: 'destructive' as const,
              handler: () => handleSaveProfilePhoto(null),
            }] : []),
            { text: 'Cancel', role: 'cancel' as const },
          ]}
        />

      </IonContent>
    </IonPage>
  );
};

export default ProfilePage;
