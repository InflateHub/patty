/* NotificationsPage — 1.3.0
 * Redesigned notification centre: water frequency system, morning sleep log,
 * weekly check-in, and engagement nudge channels.
 */
import React, { useMemo } from 'react';
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
import { alarmOutline, notificationsOutline, refreshOutline } from 'ionicons/icons';
import {
  useNotifications,
  CHANNELS,
  distributeWaterSlots,
  type NotifSection,
} from '../hooks/useNotifications';

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  margin: '8px 16px',
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

const timeInputStyle: React.CSSProperties = {
  fontFamily: 'var(--md-font)',
  fontSize: 'var(--md-body-md)',
  color: 'var(--md-on-surface)',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  textAlign: 'right',
  cursor: 'pointer',
};

// ── Section metadata ──────────────────────────────────────────────────────────

const SECTION_META: Record<NotifSection, { label: string; emoji: string }> = {
  health:   { label: 'Health Tracking', emoji: '\uD83C\uDFC3' },
  meals:    { label: 'Meal Logging',    emoji: '\uD83C\uDF74' },
  planning: { label: 'Planning',        emoji: '\uD83D\uDCCB' },
  engage:   { label: 'Engagement Nudges', emoji: '\u2728' },
};

const FUNCTIONAL_SECTIONS: NotifSection[] = ['health', 'meals', 'planning'];

// ── Component ─────────────────────────────────────────────────────────────────

const NotificationsPage: React.FC = () => {
  const {
    states,
    waterFreq,
    permStatus,
    loaded,
    allEnabled,
    anyEnabled,
    requestPermission,
    toggleChannel,
    setChannelTime,
    enableAll,
    disableAll,
    toggleWater,
    setWaterCount,
    setWaterWindow,
    setWaterSlotTime,
    resetWaterSpacing,
    getEngageTime,
  } = useNotifications();

  // Compute auto-distributed water times for display
  const autoWaterTimes = useMemo(
    () => distributeWaterSlots(waterFreq.count, waterFreq.start, waterFreq.end),
    [waterFreq.count, waterFreq.start, waterFreq.end],
  );

  // Look up the label of what each engage channel links to
  function engageLinkedLabel(adaptsTo: string): string {
    return CHANNELS.find((c) => c.key === adaptsTo)?.label ?? adaptsTo;
  }

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
              style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}
            >
              <IonIcon
                icon={notificationsOutline}
                style={{ fontSize: 24, color: 'var(--md-on-error-container)', flexShrink: 0, marginTop: 2 }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', fontFamily: 'var(--md-font)', fontWeight: 600, color: 'var(--md-on-error-container)' }}>
                  Permission required
                </p>
                <p style={{ margin: '0 0 10px', fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-error-container)' }}>
                  Allow notifications so Patty can send reminders to your device.
                </p>
                <IonButton
                  size="small"
                  onClick={requestPermission}
                  style={{ '--background': 'var(--md-error)', '--color': 'var(--md-on-error)', '--border-radius': 'var(--md-shape-full)' } as React.CSSProperties}
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
                      ? `${states.filter((s) => s.enabled).length + (waterFreq.enabled ? 1 : 0)} of ${CHANNELS.length + 1} active`
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

        {/* ── Water section (frequency-based) ───────────────────────── */}
        <IonCard style={cardStyle}>
          <IonListHeader style={sectionHeaderStyle}>
            \uD83D\uDCA7&nbsp;&nbsp;Hydration
          </IonListHeader>
          <IonCardContent style={{ padding: '0 0 8px' }}>
            <IonList lines="inset" style={{ background: 'transparent' }}>

              {/* Master water toggle */}
              <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                <span slot="start" style={{ fontSize: 20, width: 28, textAlign: 'center' }}>
                  \uD83D\uDCA7
                </span>
                <IonLabel style={{ fontFamily: 'var(--md-font)' }}>
                  Water reminders
                  <p style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                    Spaced through your day
                  </p>
                </IonLabel>
                <IonToggle
                  slot="end"
                  checked={waterFreq.enabled}
                  onIonChange={(e) => toggleWater(e.detail.checked)}
                  style={toggleStyle}
                />
              </IonItem>

              {waterFreq.enabled && (
                <>
                  {/* Frequency stepper */}
                  <IonItem style={{ '--background': 'var(--md-surface-container)', '--inner-padding-end': '16px' } as React.CSSProperties}>
                    <IonLabel style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                      Reminders per day
                    </IonLabel>
                    <div
                      slot="end"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        fontFamily: 'var(--md-font)',
                      }}
                    >
                      <button
                        onClick={() => setWaterCount(waterFreq.count - 1)}
                        disabled={waterFreq.count <= 1}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--md-shape-full)',
                          border: '1.5px solid var(--md-outline)',
                          background: 'transparent',
                          color: waterFreq.count <= 1 ? 'var(--md-on-surface-variant)' : 'var(--md-primary)',
                          fontSize: 20,
                          cursor: waterFreq.count <= 1 ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        \u2212
                      </button>
                      <span
                        style={{
                          fontFamily: 'var(--md-font)',
                          fontSize: 'var(--md-title-md)',
                          fontWeight: 600,
                          color: 'var(--md-on-surface)',
                          minWidth: 24,
                          textAlign: 'center',
                        }}
                      >
                        {waterFreq.count}
                      </span>
                      <button
                        onClick={() => setWaterCount(waterFreq.count + 1)}
                        disabled={waterFreq.count >= 8}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--md-shape-full)',
                          border: '1.5px solid var(--md-outline)',
                          background: 'transparent',
                          color: waterFreq.count >= 8 ? 'var(--md-on-surface-variant)' : 'var(--md-primary)',
                          fontSize: 20,
                          cursor: waterFreq.count >= 8 ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        +
                      </button>
                    </div>
                  </IonItem>

                  {/* Day window */}
                  <IonItem style={{ '--background': 'var(--md-surface-container)', '--inner-padding-end': '16px' } as React.CSSProperties}>
                    <IonLabel style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                      Active window
                    </IonLabel>
                    <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="time"
                        value={waterFreq.start}
                        onChange={(e) => setWaterWindow(e.target.value, waterFreq.end)}
                        style={timeInputStyle}
                      />
                      <span style={{ color: 'var(--md-on-surface-variant)', fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)' }}>
                        to
                      </span>
                      <input
                        type="time"
                        value={waterFreq.end}
                        onChange={(e) => setWaterWindow(waterFreq.start, e.target.value)}
                        style={timeInputStyle}
                      />
                    </div>
                  </IonItem>

                  {/* Individual slots */}
                  {Array.from({ length: waterFreq.count }, (_, i) => {
                    const slotTime = waterFreq.slotOverrides[i] ?? autoWaterTimes[i] ?? '00:00';
                    const isOverridden = waterFreq.slotOverrides[i] !== null;
                    return (
                      <IonItem
                        key={i}
                        lines={i === waterFreq.count - 1 ? 'none' : 'inset'}
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
                          style={{ color: 'var(--md-on-surface-variant)', fontSize: 16 }}
                        />
                        <IonLabel style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                          Reminder {i + 1}
                          {isOverridden && (
                            <span style={{ color: 'var(--md-tertiary)', marginLeft: 6 }}>edited</span>
                          )}
                        </IonLabel>
                        <input
                          type="time"
                          value={slotTime}
                          onChange={(e) => setWaterSlotTime(i, e.target.value)}
                          style={timeInputStyle}
                        />
                      </IonItem>
                    );
                  })}

                  {/* Reset spacing */}
                  {waterFreq.slotOverrides.some((v) => v !== null) && (
                    <IonItem lines="none" style={{ '--background': 'transparent' } as React.CSSProperties}>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={resetWaterSpacing}
                        style={{ '--color': 'var(--md-primary)', fontFamily: 'var(--md-font)', marginLeft: 4 } as React.CSSProperties}
                      >
                        <IonIcon icon={refreshOutline} slot="start" style={{ fontSize: 14 }} />
                        Reset to even spacing
                      </IonButton>
                    </IonItem>
                  )}
                </>
              )}
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* ── Health / Meals / Planning sections ────────────────────── */}
        {FUNCTIONAL_SECTIONS.map((section) => {
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
                        <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                          <span slot="start" style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>
                            {ch.emoji}
                          </span>
                          <IonLabel style={{ fontFamily: 'var(--md-font)' }}>
                            {ch.label}
                            {ch.weekday !== undefined && (
                              <p style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                                {ch.weekday === 1 ? 'Weekly \u2014 Sundays' : 'Weekly \u2014 Mondays'}
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
                              style={{ color: 'var(--md-on-surface-variant)', fontSize: 16 }}
                            />
                            <IonLabel style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                              Reminder time
                            </IonLabel>
                            <input
                              type="time"
                              value={st.time}
                              onChange={(e) => setChannelTime(ch.key, e.target.value)}
                              style={timeInputStyle}
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

        {/* ── Engagement nudges ──────────────────────────────────────── */}
        <IonCard style={cardStyle}>
          <IonListHeader style={sectionHeaderStyle}>
            \u2728&nbsp;&nbsp;Engagement Nudges
          </IonListHeader>
          <IonCardContent style={{ padding: '0 0 8px' }}>
            <IonItem lines="none" style={{ '--background': 'transparent', '--min-height': '44px' } as React.CSSProperties}>
              <IonLabel style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)', whiteSpace: 'normal' }}>
                Motivational prompts timed to follow your functional reminders \u2014 never sent before you\u2019ve had a chance to act.
              </IonLabel>
            </IonItem>
            <IonList lines="inset" style={{ background: 'transparent' }}>
              {CHANNELS.filter((ch) => ch.section === 'engage').map((ch) => {
                const st = states.find((s) => s.key === ch.key);
                if (!st) return null;
                const derivedTime = getEngageTime(ch.key);

                return (
                  <React.Fragment key={ch.key}>
                    <IonItem style={{ '--background': 'transparent' } as React.CSSProperties}>
                      <span slot="start" style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>
                        {ch.emoji}
                      </span>
                      <IonLabel style={{ fontFamily: 'var(--md-font)' }}>
                        {ch.label}
                        {ch.adaptsTo && (
                          <p style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                            ~{derivedTime} \u2014 30 min after {engageLinkedLabel(ch.adaptsTo)}
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
                  </React.Fragment>
                );
              })}
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* ── Footer note ────────────────────────────────────────────── */}
        <div style={{ padding: '8px 24px 40px', textAlign: 'center' }}>
          <IonNote
            style={{
              fontSize: 'var(--md-body-sm)',
              color: 'var(--md-on-surface-variant)',
              fontFamily: 'var(--md-font)',
              lineHeight: 1.5,
            }}
          >
            Reminders are delivered by the device OS. They require Patty to be installed
            natively (Android&nbsp;/&nbsp;iOS) \u2014 in the browser they are saved but not fired.
          </IonNote>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotificationsPage;
