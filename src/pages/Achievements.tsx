/**
 * Achievements — the redesigned Progress tab (v1.4.0)
 *
 * Sections:
 *  1. Weight Photo Marquee   — horizontal hero, newest→oldest, delta chips
 *  2. Shareable Cards        — page-snap: Daily / Weekly / Monthly / Yearly
 *  3. Gamification           — XP bar, level, current/best streaks, badge shelf
 *  4. Habit Rings            — 7-day dot grid (Weight · Water · Sleep · Food)
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonListHeader,
  IonLabel,
  IonChip,
  IonSpinner,
  IonToast,
  useIonViewWillEnter,
} from '@ionic/react';
import { IonIcon } from '@ionic/react';
import {
  shareOutline,
  trophyOutline,
  flameOutline,
  ellipseOutline,
  checkmarkCircle,
} from 'ionicons/icons';
import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

import { useWeightLog } from '../hooks/useWeightLog';
import { useGamification, LEVELS } from '../hooks/useGamification';
import { useAchievementCards } from '../hooks/useAchievementCards';
import {
  DailyShareCard,
  WeeklyShareCard,
  MonthlyShareCard,
  YearlyShareCard,
  LifetimeShareCard,
} from '../progress/ShareCard';

// ── Shared style tokens ───────────────────────────────────────────────────────

const S = {
  sectionHeader: {
    color: 'var(--md-primary)',
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-label-lg)',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  card: {
    margin: '0 8px 4px',
    borderRadius: 'var(--md-shape-xl)',
    border: '1px solid var(--md-outline-variant)',
    boxShadow: 'none',
    background: 'var(--md-surface-container-low)',
  } as React.CSSProperties,
};

// ── Marquee card dimensions ───────────────────────────────────────────────────

const MARQUEE_W = 140;
const MARQUEE_H = 190;

// ── Section: Weight Photo Marquee ─────────────────────────────────────────────

interface MarqueeCardProps {
  uri?: string;
  value: number;
  unit: string;
  date: string;
  delta: number | null; // kg / lbs vs previous entry (positive = gained)
}

const MarqueeCard: React.FC<MarqueeCardProps> = ({ uri, value, unit, date, delta }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        onClick={() => uri && setExpanded(true)}
        style={{
          width: MARQUEE_W,
          height: MARQUEE_H,
          borderRadius: 'var(--md-shape-lg)',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
          background: uri ? 'transparent' : 'var(--md-surface-container)',
          border: uri ? 'none' : '2px dashed var(--md-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: uri ? 'flex-end' : 'center',
          cursor: uri ? 'pointer' : 'default',
        }}
      >
        {uri ? (
          <>
            <img
              src={uri}
              alt={date}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Scrim */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '55%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
              }}
            />
            {/* Weight + delta */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                padding: '8px 10px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <span style={{ color: '#fff', fontFamily: 'var(--md-font)', fontSize: 22, fontWeight: 300, lineHeight: 1 }}>
                {value} <span style={{ fontSize: 13, opacity: 0.8 }}>{unit}</span>
              </span>
              {delta !== null && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: delta <= 0 ? '#9ECA7F' : '#F5A623',
                    letterSpacing: '0.02em',
                  }}
                >
                  {delta > 0 ? '+' : ''}{delta.toFixed(1)} {unit}
                </span>
              )}
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>
                {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 8 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📷</div>
            <span style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
              No photo
            </span>
            <br />
            <span style={{ fontFamily: 'var(--md-font)', fontSize: 22, fontWeight: 300, color: 'var(--md-on-surface)' }}>
              {value} <span style={{ fontSize: 13 }}>{unit}</span>
            </span>
          </div>
        )}
      </div>

      {/* Fullscreen overlay */}
      {expanded && uri && (
        <div
          onClick={() => setExpanded(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <img
            src={uri}
            alt={date}
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              borderRadius: 16,
              objectFit: 'contain',
            }}
          />
          <span style={{ color: '#fff', opacity: 0.7, fontSize: 13 }}>
            {value} {unit} · {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      )}
    </>
  );
};

// ── Section: Shareable Cards ──────────────────────────────────────────────────

const CARD_LABELS = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Lifetime'];
const CARD_COLORS = ['#3D6659', '#2E4F66', '#5A3A6B', '#6B3A3A', '#2D3561'];

interface ShareableSectionProps {
  cards: ReturnType<typeof useAchievementCards>;
}

const ShareableSection: React.FC<ShareableSectionProps> = ({ cards }) => {
  const dailyRef    = useRef<HTMLDivElement>(null);
  const weeklyRef   = useRef<HTMLDivElement>(null);
  const monthlyRef  = useRef<HTMLDivElement>(null);
  const yearlyRef   = useRef<HTMLDivElement>(null);
  const lifetimeRef = useRef<HTMLDivElement>(null);

  const refs = [dailyRef, weeklyRef, monthlyRef, yearlyRef, lifetimeRef];

  const [sharing, setSharing] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleShare = useCallback(async (idx: number) => {
    const ref = refs[idx];
    if (!ref.current) return;
    setSharing(idx);
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true });
      const base64 = dataUrl.split(',')[1];
      const fileName = `patty-achievement-${CARD_LABELS[idx].toLowerCase()}-${Date.now()}.png`;

      let shared = false;

      // Try Capacitor native share
      try {
        const { uri } = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        });
        await Share.share({
          title: `My ${CARD_LABELS[idx]} Achievements on Patty`,
          files: [uri],
        });
        shared = true;
        // Clean up
        try { await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }); } catch { /* ok */ }
      } catch {
        // Fallback: web native share with Blob
        if (navigator.share && navigator.canShare) {
          try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], fileName, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: `My ${CARD_LABELS[idx]} Achievements on Patty`,
                files: [file],
              });
              shared = true;
            }
          } catch { /* fall through */ }
        }
        // Final fallback: download
        if (!shared) {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = fileName;
          a.click();
          setToast('Image downloaded!');
        }
      }
    } catch (err) {
      console.error('Share failed:', err);
      setToast('Could not generate share image');
    } finally {
      setSharing(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  if (cards.loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
        <IonSpinner name="crescent" />
      </div>
    );
  }

  // Scale factor: fit within ~(screenWidth - 32px) ≈ 340px
  const SCALE = Math.min(1, (window.innerWidth - 32) / 400);

  return (
    <>
      {/* Hidden off-screen full-size cards for capture */}
      <div style={{ position: 'absolute', left: -9999, top: 0, zIndex: -1, pointerEvents: 'none' }}>
        <DailyShareCard    ref={dailyRef}    data={cards.daily}    />
        <WeeklyShareCard   ref={weeklyRef}   data={cards.weekly}   />
        <MonthlyShareCard  ref={monthlyRef}  data={cards.monthly}  />
        <YearlyShareCard   ref={yearlyRef}   data={cards.yearly}   />
        <LifetimeShareCard ref={lifetimeRef} data={cards.lifetime} />
      </div>

      {/* Visible page-snap scroll */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          gap: 12,
          padding: '4px 16px 12px',
          scrollbarWidth: 'none',
        }}
      >
        {[
          <DailyShareCard    key="d" data={cards.daily}    />,
          <WeeklyShareCard   key="w" data={cards.weekly}   />,
          <MonthlyShareCard  key="m" data={cards.monthly}  />,
          <YearlyShareCard   key="y" data={cards.yearly}   />,
          <LifetimeShareCard key="l" data={cards.lifetime} />,
        ].map((CardEl, idx) => (
          <div
            key={idx}
            style={{
              scrollSnapAlign: 'start',
              flexShrink: 0,
              width: 400 * SCALE,
              height: 600 * SCALE,
              position: 'relative',
              borderRadius: 28 * SCALE,
              overflow: 'hidden',
            }}
          >
            {/* Scaled visual preview */}
            <div style={{ transform: `scale(${SCALE})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
              {CardEl}
            </div>

            {/* Share button overlay */}
            <button
              onClick={() => handleShare(idx)}
              disabled={sharing !== null}
              style={{
                position: 'absolute',
                bottom: 10 * SCALE,
                right: 10 * SCALE,
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: CARD_COLORS[idx],
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 2,
              }}
            >
              {sharing === idx
                ? <IonSpinner name="crescent" style={{ width: 18, height: 18, color: '#fff' }} />
                : <IonIcon icon={shareOutline} style={{ color: '#fff', fontSize: 18 }} />
              }
            </button>
          </div>
        ))}
      </div>

      {/* Dot indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
        {CARD_LABELS.map((lbl, i) => (
          <span key={lbl} style={{ fontSize: 10, color: 'var(--md-on-surface-variant)', letterSpacing: '0.04em' }}>
            {lbl}
          </span>
        ))}
      </div>

      <IonToast
        isOpen={!!toast}
        message={toast ?? ''}
        duration={2500}
        onDidDismiss={() => setToast(null)}
        position="top"
      />
    </>
  );
};

// ── Section: Gamification ─────────────────────────────────────────────────────

const GamificationSection: React.FC<{ gam: ReturnType<typeof useGamification> }> = ({ gam }) => {
  if (gam.loading) {
    return (
      <IonCard style={S.card}>
        <IonCardContent style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <IonSpinner name="crescent" />
        </IonCardContent>
      </IonCard>
    );
  }

  const pct = gam.xpForLevel === Infinity ? 1 : gam.xpIntoLevel / gam.xpForLevel;
  const milestones = [3, 7, 14, 30, 60, 100];

  return (
    <IonCard style={S.card}>
      <IonListHeader>
        <IonLabel style={S.sectionHeader}>
          <IonIcon icon={trophyOutline} style={{ marginRight: 6, verticalAlign: 'middle', fontSize: 16 }} />
          Gamification
        </IonLabel>
      </IonListHeader>
      <IonCardContent style={{ padding: '8px 16px 20px' }}>

        {/* Level + XP bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 32 }}>{gam.level.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-sm)', fontWeight: 600, color: 'var(--md-on-surface)' }}>
                {gam.level.name}
              </span>
              <span style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                {gam.xp.toLocaleString()} XP
              </span>
            </div>
            {/* XP bar track */}
            <div style={{
              height: 8,
              borderRadius: 4,
              background: 'var(--md-surface-container-high)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, Math.round(pct * 100))}%`,
                borderRadius: 4,
                background: gam.level.color,
                transition: 'width 0.6s ease',
              }} />
            </div>
            {gam.xpForLevel !== Infinity && (
              <div style={{ fontFamily: 'var(--md-font)', fontSize: 10, color: 'var(--md-on-surface-variant)', marginTop: 2 }}>
                {gam.xpIntoLevel} / {gam.xpForLevel} to {LEVELS[Math.min(LEVELS.length - 1, LEVELS.indexOf(gam.level) + 1)].name}
              </div>
            )}
          </div>
        </div>

        {/* Streaks */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          padding: '10px 12px',
          background: 'var(--md-surface-container)',
          borderRadius: 'var(--md-shape-md)',
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <IonIcon icon={flameOutline} style={{ fontSize: 20, color: '#F5A623', display: 'block', margin: '0 auto 2px' }} />
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-lg)', fontWeight: 300, color: 'var(--md-on-surface)' }}>
              {gam.currentStreak}
            </div>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)' }}>
              Current
            </div>
          </div>
          <div style={{ width: 1, background: 'var(--md-outline-variant)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <IonIcon icon={trophyOutline} style={{ fontSize: 20, color: gam.level.color, display: 'block', margin: '0 auto 2px' }} />
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-lg)', fontWeight: 300, color: 'var(--md-on-surface)' }}>
              {gam.bestStreak}
            </div>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)' }}>
              Best
            </div>
          </div>
        </div>

        {/* Milestone dots */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {milestones.map(m => {
            const reached = gam.bestStreak >= m;
            return (
              <div key={m} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                flex: '0 0 auto',
              }}>
                <IonIcon
                  icon={reached ? checkmarkCircle : ellipseOutline}
                  style={{
                    fontSize: 20,
                    color: reached ? gam.level.color : 'var(--md-outline)',
                  }}
                />
                <span style={{ fontSize: 10, color: 'var(--md-on-surface-variant)', fontFamily: 'var(--md-font)' }}>
                  {m}d
                </span>
              </div>
            );
          })}
        </div>

        {/* Badge shelf */}
        <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-md)', color: 'var(--md-on-surface-variant)', marginBottom: 8 }}>
          Badges
        </div>
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 8,
          paddingBottom: 4,
          scrollbarWidth: 'none',
        }}>
          {gam.badges.map(badge => (
            <IonChip
              key={badge.id}
              style={{
                flexShrink: 0,
                opacity: badge.earned ? 1 : 0.4,
                background: badge.earned ? 'var(--md-secondary-container)' : 'var(--md-surface-container)',
                color: badge.earned ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                border: badge.earned ? 'none' : '1px solid var(--md-outline-variant)',
                fontSize: 'var(--md-label-sm)',
                height: 32,
              }}
            >
              <span style={{ marginRight: 4 }}>{badge.emoji}</span>
              <IonLabel style={{ fontSize: 'inherit' }}>{badge.label}</IonLabel>
            </IonChip>
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

// ── Section: Habit Rings ──────────────────────────────────────────────────────

interface HabitRingsProps {
  ring: ReturnType<typeof useAchievementCards>['habitRing'];
  loading: boolean;
}

const HabitRings: React.FC<HabitRingsProps> = ({ ring, loading }) => {
  const habits: Array<{ key: 'weight' | 'water' | 'sleep' | 'food'; label: string; emoji: string; color: string }> = [
    { key: 'weight', label: 'Weight', emoji: '\u2696\uFE0F', color: '#5C7A6E' },
    { key: 'water',  label: 'Water',  emoji: '\uD83D\uDCA7', color: '#3A6B8A' },
    { key: 'sleep',  label: 'Sleep',  emoji: '\uD83D\uDE34', color: '#7B5295' },
    { key: 'food',   label: 'Food',   emoji: '\uD83C\uDF7D\uFE0F',  color: '#954B3A' },
  ];

  return (
    <IonCard style={{ ...S.card, marginBottom: 16 }}>
      <IonListHeader>
        <IonLabel style={S.sectionHeader}>
          Habit Rings
        </IonLabel>
      </IonListHeader>
      <IonCardContent style={{ padding: '8px 16px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 280 }}>
              {/* Day labels row */}
              <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: 0, marginBottom: 8 }}>
                <div />
                {ring.map((day, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: 'center',
                      fontFamily: 'var(--md-font)',
                      fontSize: 11,
                      color: day.isToday ? 'var(--md-primary)' : 'var(--md-on-surface-variant)',
                      fontWeight: day.isToday ? 700 : 400,
                    }}
                  >
                    {day.dateLabel}
                  </div>
                ))}
              </div>

              {/* Habit rows */}
              {habits.map(h => (
                <div
                  key={h.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px repeat(7, 1fr)',
                    gap: 0,
                    marginBottom: 10,
                    alignItems: 'center',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--md-font)',
                    fontSize: 12,
                    color: 'var(--md-on-surface-variant)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    paddingRight: 4,
                  }}>
                    <span>{h.emoji}</span>
                    <span style={{ fontSize: 10 }}>{h.label}</span>
                  </div>

                  {ring.map((day, i) => {
                    const filled = day[h.key];
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: filled
                            ? h.color
                            : day.isToday
                              ? 'var(--md-primary-container)'
                              : 'var(--md-surface-container)',
                          border: filled
                            ? `2px solid ${h.color}`
                            : day.isToday
                              ? '2px solid var(--md-primary)'
                              : '2px solid var(--md-outline-variant)',
                          transition: 'background 0.2s ease',
                        }} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const Achievements: React.FC = () => {
  const { entries, loading: weightLoading, reload: reloadWeight } = useWeightLog();
  const gam = useGamification();
  const cards = useAchievementCards();

  useIonViewWillEnter(() => {
    reloadWeight();
    gam.reload?.();
    cards.reload?.();
  });

  // Entries with computed deltas (entries are newest-first from hook)
  const marqueeEntries = entries.map((e, i) => {
    const prev = entries[i + 1] ?? null;
    const delta = prev !== null ? +(e.value - prev.value).toFixed(2) : null;
    return { ...e, delta };
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--md-font)', fontWeight: 600 }}>
            Achievements
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>

        {/* ── 1. Weight Photo Marquee ─────────────────────────────────────── */}
        <IonListHeader style={{ paddingTop: 12 }}>
          <IonLabel style={S.sectionHeader}>Weight Journey</IonLabel>
        </IonListHeader>

        {weightLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
            <IonSpinner name="crescent" />
          </div>
        ) : marqueeEntries.length === 0 ? (
          <div style={{
            margin: '8px 16px 4px',
            padding: 24,
            borderRadius: 'var(--md-shape-xl)',
            border: '2px dashed var(--md-outline-variant)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-lg)', color: 'var(--md-on-surface)' }}>
              No weigh-ins yet
            </div>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)', marginTop: 4 }}>
              Log your first weight entry with a photo
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            padding: '8px 16px 12px',
            scrollbarWidth: 'none',
          }}>
            {marqueeEntries.map(entry => (
              <MarqueeCard
                key={entry.id}
                uri={entry.photo_uri}
                value={entry.value}
                unit={entry.unit}
                date={entry.date}
                delta={entry.delta}
              />
            ))}
          </div>
        )}

        {/* ── 2. Shareable Achievement Cards ─────────────────────────────── */}
        <IonListHeader style={{ paddingTop: 4 }}>
          <IonLabel style={S.sectionHeader}>
            <IonIcon icon={shareOutline} style={{ marginRight: 6, verticalAlign: 'middle', fontSize: 16 }} />
            Share Achievements
          </IonLabel>
        </IonListHeader>

        <ShareableSection cards={cards} />

        {/* ── 3. Gamification ─────────────────────────────────────────────── */}
        <GamificationSection gam={gam} />

        {/* ── 4. Habit Rings ──────────────────────────────────────────────── */}
        <IonListHeader>
          <IonLabel style={S.sectionHeader}>7-Day Habits</IonLabel>
        </IonListHeader>

        <HabitRings ring={cards.habitRing} loading={cards.loading} />

      </IonContent>
    </IonPage>
  );
};

export default Achievements;
