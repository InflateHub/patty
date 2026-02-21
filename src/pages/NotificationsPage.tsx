/* NotificationsPage — 0.9.6
 * Dedicated page for managing all Patty reminder channels.
 * Accessible from ProfilePage > Notifications row.
 */
import React from 'react';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/react';
import { alarmOutline, notificationsOutline } from 'ionicons/icons';
import { useNotifications, CHANNELS, type NotifSection } from '../hooks/useNotifications';

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

const toggleStyle: React.CSSProperties = {
  '--track-background': 'var(--md-surface-container-highest)',
  '--track-background-checked': 'var(--md-primary)',
  '--handle-background': 'var(--md-on-surface-variant)',
  '--handle-background-checked': 'var(--md-on-primary)',
} as React.CSSProperties;

// ── Section metadata ──────────────────────────────────────────────────────────

const SECTION_META: Record<NotifSection, { label: string; emoji: string }> = {
  health:   { label: 'Health Tracking', emoji: '\uD83C\uDFC3' },
  meals:    { label: 'Meal Logging',    emoji: '\uD83C\uDF74' },
  planning: { label: 'Planning',        emoji: '\uD83D\uDCCB' },
};

const SECTIONS: NotifSection[] = ['health', 'meals', 'planning'];

// ── Component ─────────────────────────────────────────────────────────────────

const NotificationsPage: React.FC = () => {
  const {
    states,
    permStatus,
    loaded,
    allEnabled,
    anyEnabled,
    requestPermission,
    toggleChannel,
    setChannelTime,
    enableAll,
    disableAll,
  } = useNotifications();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/profile" />
          </IonButtons>
          <IonTitle>Notifications</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Notifications</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* ── Permission banner ──────────────────────────────────────── */}
        {loaded && permStatus !== 'granted' && permStatus !== 'unknown' && (
          <IonCard
            style={{
              ...cardStyle,
              background: 'var(--md-error-container)',
              border: 'none',
            }}
          >
            <IonCardContent
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <IonIcon
                icon={notificationsOutline}
                style={{
                  fontSize: 24,
                  color: 'var(--md-on-error-container)',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: '0 0 4px',
                    fontFamily: 'var(--md-font)',
                    fontWeight: 600,
                    color: 'var(--md-on-error-container)',
                  }}
                >
                  Permission required
                </p>
                <p
                  style={{
                    margin: '0 0 10px',
                    fontFamily: 'var(--md-font)',
                    fontSize: 'var(--md-body-sm)',
                    color: 'var(--md-on-error-container)',
                  }}
                >
                  Allow notifications so Patty can send reminders to your device.
                </p>
                <IonButton
                  size="small"
                  onClick={requestPermission}
                  style={{
                    '--background': 'var(--md-error)',
                    '--color': 'var(--md-on-error)',
                    '--border-radius': 'var(--md-shape-full)',
                  } as React.CSSProperties}
                >
                  Grant permission
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* ── Master toggle ──────────────────────────────────────────── */}
        <IonCard style={cardStyle}>
          <IonCardContent style={{ padding: '4px 0 4px' }}>
            <IonList lines="none" style={{ background: 'transparent' }}>
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                <IonIcon
                  icon={notificationsOutline}
                  slot="start"
                  style={{ color: 'var(--md-primary)', fontSize: 22 }}
                />
                <IonLabel style={{ fontFamily: 'var(--md-font)', fontWeight: 600 }}>
                  Enable all reminders
                  <p style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                    {anyEnabled
                      ? `${states.filter((s) => s.enabled).length} of ${states.length} active`
                      : 'All reminders off'}
                  </p>
                </IonLabel>
                <IonToggle
                  slot="end"
                  checked={allEnabled}
                  onIonChange={(e) => (e.detail.checked ? enableAll() : disableAll())}
                  style={toggleStyle}
                />
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* ── Per-section channel rows ───────────────────────────────── */}
        {SECTIONS.map((section) => {
          const meta = SECTION_META[section];
          const sectionChannels = CHANNELS.filter((ch) => ch.section === section);

          return (
            <IonCard key={section} style={cardStyle}>
              <IonListHeader style={sectionHeaderStyle}>
                {meta.emoji}&nbsp;&nbsp;{meta.label}
              </IonListHeader>
              <IonCardContent style={{ padding: '0 0 8px' }}>
                <IonList lines="inset" style={{ background: 'transparent' }}>
                  {sectionChannels.map((ch) => {
                    const st = states.find((s) => s.key === ch.key);
                    if (!st) return null;

                    return (
                      <React.Fragment key={ch.key}>
                        {/* Channel toggle row */}
                        <IonItem
                          style={{ '--background': 'transparent' } as React.CSSProperties}
                        >
                          <span
                            slot="start"
                            style={{
                              fontSize: 20,
                              width: 28,
                              textAlign: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {ch.emoji}
                          </span>
                          <IonLabel style={{ fontFamily: 'var(--md-font)' }}>
                            {ch.label}
                            {ch.weekday !== undefined && (
                              <p
                                style={{
                                  fontSize: 'var(--md-body-sm)',
                                  color: 'var(--md-on-surface-variant)',
                                }}
                              >
                                Weekly \u2014 Sundays
                              </p>
                            )}
                          </IonLabel>
                          <IonToggle
                            slot="end"
                            checked={st.enabled}
                            onIonChange={(e) => toggleChannel(ch.key, e.detail.checked)}
                            style={toggleStyle}
                          />
                        </IonItem>

                        {/* Time picker row — shown only when enabled */}
                        {st.enabled && (
                          <IonItem
                            lines="none"
                            style={{
                              '--background': 'var(--md-surface-container)',
                              '--padding-start': '60px',
                              '--inner-padding-end': '16px',
                              '--min-height': '44px',
                            } as React.CSSProperties}
                          >
                            <IonIcon
                              icon={alarmOutline}
                              slot="start"
                              style={{
                                color: 'var(--md-on-surface-variant)',
                                fontSize: 16,
                              }}
                            />
                            <IonLabel
                              style={{
                                fontFamily: 'var(--md-font)',
                                fontSize: 'var(--md-body-sm)',
                                color: 'var(--md-on-surface-variant)',
                              }}
                            >
                              Reminder time
                            </IonLabel>
                            <input
                              type="time"
                              value={st.time}
                              onChange={(e) => setChannelTime(ch.key, e.target.value)}
                              style={{
                                fontFamily: 'var(--md-font)',
                                fontSize: 'var(--md-body-md)',
                                color: 'var(--md-on-surface)',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                textAlign: 'right',
                                cursor: 'pointer',
                              }}
                            />
                          </IonItem>
                        )}
                      </React.Fragment>
                    );
                  })}
                </IonList>
              </IonCardContent>
            </IonCard>
          );
        })}

        {/* ── Footer note ────────────────────────────────────────────── */}
        <div
          style={{
            padding: '8px 24px 40px',
            textAlign: 'center',
          }}
        >
          <IonNote
            style={{
              fontSize: 'var(--md-body-sm)',
              color: 'var(--md-on-surface-variant)',
              fontFamily: 'var(--md-font)',
              lineHeight: 1.5,
            }}
          >
            Reminders are delivered by the device OS. They require Patty to be installed
            natively (Android&nbsp;/&nbsp;iOS) \u2014 in the browser they are saved but
            not fired.
          </IonNote>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotificationsPage;
