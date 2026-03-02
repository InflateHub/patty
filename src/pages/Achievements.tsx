/**
 * Achievements — 2.7.0
 *
 * Pure achievement collection page. Sections:
 *  1. Hero card — XP · level progress bar · total badges earned
 *  2. Badge shelves — one horizontal shelf per logging category
 *     Each shelf uses the same infinite milestone ladder as Habits.
 *     Earned = full colour. Next locked = 🔒 + "X more" nudge. +1 ghost.
 *  3. Shareable cards — Daily / Weekly / Monthly / Yearly
 *     Not-yet-unlocked cards show a lock overlay.
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
  IonSpinner,
  IonToast,
  IonModal,
  IonButtons,
  IonButton,
  useIonViewWillEnter,
} from '@ionic/react';
import { IonIcon } from '@ionic/react';
import { lockClosedOutline, shareOutline } from 'ionicons/icons';
import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

import { useGamification, getNextLevel } from '../hooks/useGamification';
import { useAchievementCards } from '../hooks/useAchievementCards';
import {
  DailyShareCard,
  WeeklyShareCard,
  MonthlyShareCard,
  YearlyShareCard,
  LifetimeShareCard,
} from '../progress/ShareCard';

// ─────────────────────────────────────────────────────────────────────────────
// Infinite milestone ladder — identical logic to Habits page
// ─────────────────────────────────────────────────────────────────────────────

function milestonesUpTo(value: number): number[] {
  const fixed = [3, 7, 14, 21, 30];
  const all: number[] = [...fixed];
  if (value >= 31) for (let m = 60; m <= Math.min(value + 60, 9999); m += 30) all.push(m);
  if (value >= 365) for (let m = 365; m <= Math.min(value + 100, 9999); m += 100) all.push(m);
  if (value >= 1000) for (let m = 1000; m <= value + 365; m += 365) all.push(m);
  return all;
}

/** Returns the next milestone strictly above `value`, or null if very high. */
function nextMilestone(value: number): number | null {
  const all = milestonesUpTo(value + 400);
  return all.find(m => m > value) ?? null;
}

/** Returns all milestones <= value */
function earnedMilestones(value: number): number[] {
  return milestonesUpTo(value).filter(m => m <= value);
}

// ─────────────────────────────────────────────────────────────────────────────
// Category definitions
// ─────────────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  emoji: string;
  label: string;
  value: (counts: ReturnType<typeof useGamification>['counts']) => number;
  unit: string;           // e.g. "days"
  color: string;
  badgeNames: (n: number) => string;
}

const CATEGORIES: Category[] = [
  {
    id: 'weight',
    emoji: '⚖️',
    label: 'Weight Logger',
    value: c => c.weightDays,
    unit: 'days',
    color: '#5C7A6E',
    badgeNames: n => `${n}-Day Weigh-In`,
  },
  {
    id: 'water',
    emoji: '💧',
    label: 'Hydration Hero',
    value: c => c.waterGoalDays,
    unit: 'goal days',
    color: '#3A6B8A',
    badgeNames: n => `${n}-Day Hydration`,
  },
  {
    id: 'sleep',
    emoji: '😴',
    label: 'Sleep Tracker',
    value: c => c.sleepDays,
    unit: 'days',
    color: '#7B5295',
    badgeNames: n => `${n}-Day Sleep`,
  },
  {
    id: 'food',
    emoji: '🍽️',
    label: 'Food Journal',
    value: c => c.foodEntries,
    unit: 'entries',
    color: '#8A5A2E',
    badgeNames: n => `${n} Meals Logged`,
  },
  {
    id: 'workout',
    emoji: '💪',
    label: 'Workout Warrior',
    value: c => c.workoutDays,
    unit: 'days',
    color: '#8A3A3A',
    badgeNames: n => `${n}-Day Workout`,
  },
  {
    id: 'streak',
    emoji: '🌟',
    label: 'App Streak',
    value: c => c.appStreakBest,
    unit: 'day best streak',
    color: '#4A6A2E',
    badgeNames: n => `${n}-Day Streak`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Badge chip
// ─────────────────────────────────────────────────────────────────────────────

interface BadgeChipProps {
  emoji: string;
  label: string;
  color: string;
  earned: boolean;
  locked: boolean;      // true = ghost (future)
  nudge?: string;       // "7 more days" shown on next-locked badge
  onTap?: () => void;
}

const BadgeChip: React.FC<BadgeChipProps> = ({ emoji, label, color, earned, locked, nudge, onTap }) => {
  const opacity = locked ? 0.28 : 1;

  return (
    <div
      onClick={earned ? onTap : undefined}
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        width: 68,
        cursor: earned ? 'pointer' : 'default',
        opacity,
      }}
    >
      {/* Circle */}
      <div style={{
        position: 'relative',
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: earned
          ? `radial-gradient(circle at 35% 30%, ${color}66, ${color}22)`
          : 'var(--md-surface-container-high)',
        border: earned
          ? `2.5px solid ${color}`
          : nudge
            ? `2px dashed ${color}88`
            : '2px solid var(--md-outline-variant)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        boxShadow: earned ? `0 0 12px ${color}44` : 'none',
        filter: locked ? 'grayscale(1)' : 'none',
        transition: 'all 0.2s ease',
      }}>
        {/* Lock overlay for next-locked */}
        {nudge && !earned && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.36)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IonIcon icon={lockClosedOutline} style={{ fontSize: 18, color: '#fff' }} />
          </div>
        )}
        <span style={{ fontSize: nudge && !earned ? 20 : 24, opacity: nudge && !earned ? 0.4 : 1 }}>
          {emoji}
        </span>
      </div>

      {/* Label */}
      <span style={{
        fontFamily: 'var(--md-font)',
        fontSize: 9,
        color: earned ? 'var(--md-on-surface)' : 'var(--md-on-surface-variant)',
        textAlign: 'center',
        lineHeight: 1.2,
        maxWidth: 68,
      }}>
        {nudge && !earned ? nudge : label}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Badge detail modal (tapping an earned badge)
// ─────────────────────────────────────────────────────────────────────────────

interface BadgeDetail {
  emoji: string;
  label: string;
  description: string;
  color: string;
}

const BadgeDetailModal: React.FC<{
  badge: BadgeDetail | null;
  levelEmoji: string;
  levelName: string;
  onClose: () => void;
}> = ({ badge, levelEmoji, levelName, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleShare = async () => {
    if (!ref.current || !badge) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2 });
      const base64 = dataUrl.split(',')[1];
      const fileName = `patty-badge-${Date.now()}.png`;
      let shared = false;
      try {
        const { uri } = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
        await Share.share({ title: `I earned the ${badge.label} badge on Patty!`, files: [uri] });
        shared = true;
        try { await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }); } catch { /* ok */ }
      } catch {
        if (navigator.share && navigator.canShare) {
          try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], fileName, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ title: `I earned the ${badge.label} badge on Patty!`, files: [file] });
              shared = true;
            }
          } catch { /* fall through */ }
        }
        if (!shared) {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = fileName;
          a.click();
          setToast('Image downloaded!');
        }
      }
    } catch { setToast('Could not generate badge image'); }
    finally { setSharing(false); }
  };

  if (!badge) return null;

  return (
    <IonModal isOpen={!!badge} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--md-surface-container)' } as React.CSSProperties}>
          <IonTitle style={{ fontFamily: 'var(--md-font)', fontWeight: 700 }}>{badge.label}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} style={{ '--color': 'var(--md-on-surface-variant)' } as React.CSSProperties}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ '--background': 'var(--md-surface)' } as React.CSSProperties}>
        <div style={{ padding: '28px 24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Shareable capture area */}
          <div
            ref={ref}
            style={{
              width: '100%',
              borderRadius: 'var(--md-shape-xl)',
              background: `linear-gradient(160deg, ${badge.color}22 0%, var(--md-surface-container) 100%)`,
              border: `1.5px solid ${badge.color}55`,
              padding: '32px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              boxShadow: `0 4px 24px ${badge.color}22`,
              marginBottom: 24,
            }}
          >
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, ${badge.color}66, ${badge.color}22)`,
              border: `3px solid ${badge.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 46, boxShadow: `0 0 28px ${badge.color}55`, marginBottom: 4,
            }}>
              {badge.emoji}
            </div>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-lg)', fontWeight: 700, color: 'var(--md-on-surface)', textAlign: 'center', lineHeight: 1.2 }}>
              {badge.label}
            </div>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)', textAlign: 'center', maxWidth: 240, lineHeight: 1.4 }}>
              {badge.description}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${badge.color}22`, border: `1px solid ${badge.color}55`,
              borderRadius: 'var(--md-shape-full)', padding: '4px 14px', marginTop: 4,
            }}>
              <span style={{ fontSize: 14 }}>{levelEmoji}</span>
              <span style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', fontWeight: 600, color: badge.color }}>
                {levelName} · Patty
              </span>
            </div>
          </div>

          <IonButton
            expand="block"
            onClick={handleShare}
            disabled={sharing}
            style={{
              width: '100%',
              '--border-radius': 'var(--md-shape-full)',
              '--background': badge.color,
              '--color': '#fff',
            } as React.CSSProperties}
          >
            {sharing
              ? <IonSpinner name="crescent" style={{ width: 20, height: 20 }} />
              : <><IonIcon icon={shareOutline} slot="start" />Share This Badge</>
            }
          </IonButton>
        </div>
        <IonToast isOpen={!!toast} message={toast ?? ''} duration={2500} onDidDismiss={() => setToast(null)} position="top" />
      </IonContent>
    </IonModal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Badge shelf — one per category
// ─────────────────────────────────────────────────────────────────────────────

interface BadgeShelfProps {
  cat: Category;
  value: number;
  levelEmoji: string;
  levelName: string;
}

const BadgeShelf: React.FC<BadgeShelfProps> = ({ cat, value, levelEmoji, levelName }) => {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDetail | null>(null);

  const earned = earnedMilestones(value);
  const next = nextMilestone(value);
  const afterNext = next !== null ? nextMilestone(next) : null;

  const earnedCount = earned.length;

  // Determine a badge emoji by milestone tier (mirrors Habits badgeTier)
  const badgeEmoji = (n: number): string => {
    if (n <= 30)  return '⭐';
    if (n < 365)  return '🔥';
    if (n < 1000) return '💎';
    return '🏆';
  };

  return (
    <>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 0' }}>
        <IonListHeader style={{ padding: 0 }}>
          <IonLabel style={{
            color: 'var(--md-primary)',
            fontFamily: 'var(--md-font)',
            fontSize: 'var(--md-label-lg)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {cat.emoji} {cat.label}
          </IonLabel>
        </IonListHeader>
        {earnedCount > 0 && (
          <span style={{
            fontFamily: 'var(--md-font)',
            fontSize: 'var(--md-label-sm)',
            color: cat.color,
            fontWeight: 700,
          }}>
            {earnedCount} earned
          </span>
        )}
      </div>

      {/* Progress line */}
      <div style={{ padding: '3px 16px 0', fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)' }}>
        {value} {cat.unit}
        {next !== null && (
          <span style={{ color: cat.color, fontWeight: 600 }}>
            {' '}· {next - value} to go
          </span>
        )}
      </div>

      {/* Horizontal badge scroll */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: '10px 16px 16px',
          scrollbarWidth: 'none',
        } as React.CSSProperties}
      >
        {/* Earned badges */}
        {earned.map(n => (
          <BadgeChip
            key={n}
            emoji={badgeEmoji(n)}
            label={cat.badgeNames(n)}
            color={cat.color}
            earned={true}
            locked={false}
            onTap={() => setSelectedBadge({
              emoji: badgeEmoji(n),
              label: cat.badgeNames(n),
              description: `${value} ${cat.unit} logged in Patty`,
              color: cat.color,
            })}
          />
        ))}

        {/* Next locked badge */}
        {next !== null && (
          <BadgeChip
            key={`next-${next}`}
            emoji={badgeEmoji(next)}
            label={cat.badgeNames(next)}
            color={cat.color}
            earned={false}
            locked={false}
            nudge={`${next - value} more`}
          />
        )}

        {/* Ghost — one step beyond next */}
        {afterNext !== null && (
          <BadgeChip
            key={`ghost-${afterNext}`}
            emoji={badgeEmoji(afterNext)}
            label={cat.badgeNames(afterNext)}
            color={cat.color}
            earned={false}
            locked={true}
          />
        )}

        {/* Empty state — value = 0, show the first badge as next */}
        {earnedCount === 0 && next === null && (
          <div style={{
            padding: '12px 0',
            fontFamily: 'var(--md-font)',
            fontSize: 'var(--md-body-sm)',
            color: 'var(--md-on-surface-variant)',
            opacity: 0.7,
          }}>
            Start logging to earn your first badge
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ margin: '0 16px 4px', height: 1, background: 'var(--md-outline-variant)', opacity: 0.35 }} />

      <BadgeDetailModal
        badge={selectedBadge}
        levelEmoji={levelEmoji}
        levelName={levelName}
        onClose={() => setSelectedBadge(null)}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Shareable cards section (with lock overlay for unearned cards)
// ─────────────────────────────────────────────────────────────────────────────

const CARD_META = [
  { key: 'daily',    label: 'Daily',    unlock: 'Log anything today to unlock', color: '#3D6659' },
  { key: 'weekly',   label: 'This Week',unlock: 'Log for 3+ days this week',    color: '#2E4F66' },
  { key: 'monthly',  label: 'Monthly',  unlock: 'Log for 7+ days this month',   color: '#5A3A6B' },
  { key: 'yearly',   label: 'Yearly',   unlock: 'Log for 30+ days this year',   color: '#6B3A3A' },
  { key: 'lifetime', label: 'Lifetime', unlock: 'Log for 7+ days total',        color: '#2D3561' },
];

interface ShareSectionProps {
  cards: ReturnType<typeof useAchievementCards>;
  counts: ReturnType<typeof useGamification>['counts'];
}

const ShareSection: React.FC<ShareSectionProps> = ({ cards, counts }) => {
  const dailyRef    = useRef<HTMLDivElement>(null);
  const weeklyRef   = useRef<HTMLDivElement>(null);
  const monthlyRef  = useRef<HTMLDivElement>(null);
  const yearlyRef   = useRef<HTMLDivElement>(null);
  const lifetimeRef = useRef<HTMLDivElement>(null);
  const refs        = [dailyRef, weeklyRef, monthlyRef, yearlyRef, lifetimeRef];

  const [sharing, setSharing] = useState<number | null>(null);
  const [toast, setToast]     = useState<string | null>(null);

  // Determine whether each card is "unlocked" based on actual log counts
  const totalDays = counts.weightDays + counts.waterGoalDays + counts.sleepDays;
  const unlocked = [
    totalDays >= 1,                         // daily: logged anything
    cards.weekly.weightOf7 + cards.weekly.waterOf7 + cards.weekly.sleepOf7 >= 3,  // weekly: 3+ days
    cards.monthly.weightLogs + cards.monthly.sleepLogs >= 7,                       // monthly: 7+ days
    cards.yearly.totalWeighIns + cards.yearly.totalSleepNights >= 30,              // yearly: 30+ days
    totalDays >= 7,                         // lifetime: 7+ days
  ];

  const handleShare = useCallback(async (idx: number) => {
    const ref = refs[idx];
    if (!ref.current || !unlocked[idx]) return;
    setSharing(idx);
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true });
      const base64 = dataUrl.split(',')[1];
      const fileName = `patty-${CARD_META[idx].key}-${Date.now()}.png`;
      let shared = false;
      try {
        const { uri } = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
        await Share.share({ title: `My ${CARD_META[idx].label} Achievements on Patty`, files: [uri] });
        shared = true;
        try { await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache }); } catch { /* ok */ }
      } catch {
        if (navigator.share && navigator.canShare) {
          try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], fileName, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ title: `My ${CARD_META[idx].label} Achievements on Patty`, files: [file] });
              shared = true;
            }
          } catch { /* fall through */ }
        }
        if (!shared) {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = fileName;
          a.click();
          setToast('Image downloaded!');
        }
      }
    } catch { setToast('Could not generate share image'); }
    finally { setSharing(null); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, counts, unlocked]);

  if (cards.loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><IonSpinner name="crescent" /></div>;
  }

  const SCALE = Math.min(1, (window.innerWidth - 32) / 400);
  const cardEls = [
    <DailyShareCard    key="d" ref={dailyRef}    data={cards.daily}    />,
    <WeeklyShareCard   key="w" ref={weeklyRef}   data={cards.weekly}   />,
    <MonthlyShareCard  key="m" ref={monthlyRef}  data={cards.monthly}  />,
    <YearlyShareCard   key="y" ref={yearlyRef}   data={cards.yearly}   />,
    <LifetimeShareCard key="l" ref={lifetimeRef} data={cards.lifetime} />,
  ];

  // Also render off-screen for capture
  const captureEls = [
    <DailyShareCard    key="cd" ref={dailyRef}    data={cards.daily}    />,
    <WeeklyShareCard   key="cw" ref={weeklyRef}   data={cards.weekly}   />,
    <MonthlyShareCard  key="cm" ref={monthlyRef}  data={cards.monthly}  />,
    <YearlyShareCard   key="cy" ref={yearlyRef}   data={cards.yearly}   />,
    <LifetimeShareCard key="cl" ref={lifetimeRef} data={cards.lifetime} />,
  ];

  return (
    <>
      {/* Off-screen capture targets */}
      <div style={{ position: 'absolute', left: -9999, top: 0, zIndex: -1, pointerEvents: 'none' }}>
        {captureEls}
      </div>

      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          gap: 12,
          padding: '8px 16px 20px',
          scrollbarWidth: 'none',
        } as React.CSSProperties}
      >
        {cardEls.map((CardEl, idx) => {
          const isUnlocked = unlocked[idx];
          return (
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

              {/* Lock overlay */}
              {!isUnlocked && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 28 * SCALE,
                  background: 'rgba(0,0,0,0.62)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backdropFilter: 'blur(2px)',
                }}>
                  <IonIcon icon={lockClosedOutline} style={{ fontSize: 32, color: '#fff', opacity: 0.85 }} />
                  <span style={{
                    fontFamily: 'var(--md-font)',
                    fontSize: 12,
                    color: '#fff',
                    opacity: 0.75,
                    textAlign: 'center',
                    maxWidth: '75%',
                    lineHeight: 1.4,
                  }}>
                    {CARD_META[idx].unlock}
                  </span>
                </div>
              )}

              {/* Share button — only when unlocked */}
              {isUnlocked && (
                <button
                  onClick={() => handleShare(idx)}
                  disabled={sharing !== null}
                  style={{
                    position: 'absolute',
                    bottom: 10 * SCALE,
                    right: 10 * SCALE,
                    width: 36, height: 36,
                    borderRadius: '50%',
                    border: 'none',
                    background: CARD_META[idx].color,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: 2,
                  }}
                >
                  {sharing === idx
                    ? <IonSpinner name="crescent" style={{ width: 18, height: 18, color: '#fff' }} />
                    : <IonIcon icon={shareOutline} style={{ color: '#fff', fontSize: 18 }} />
                  }
                </button>
              )}
            </div>
          );
        })}
      </div>

      <IonToast isOpen={!!toast} message={toast ?? ''} duration={2500} onDidDismiss={() => setToast(null)} position="top" />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const AchievementsPage: React.FC = () => {
  const gam   = useGamification();
  const cards = useAchievementCards();

  useIonViewWillEnter(() => {
    gam.reload?.();
    cards.reload?.();
  });

  const totalBadges = CATEGORIES.reduce((sum, cat) => sum + earnedMilestones(cat.value(gam.counts)).length, 0);
  const pct = gam.xpIntoLevel / gam.xpForLevel;
  const nextLevel = getNextLevel(gam.xp);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle style={{ fontFamily: 'var(--md-font)', fontWeight: 600 }}>Achievements</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--padding-bottom': '40px' } as React.CSSProperties}>

        {/* ── Hero card ──────────────────────────────────────────────────── */}
        <IonCard style={{
          margin: '16px 16px 8px',
          borderRadius: 'var(--md-shape-xl)',
          border: `2px solid ${gam.level.color}`,
          boxShadow: 'none',
          background: 'var(--md-surface-container-low)',
        }}>
          <IonCardContent style={{ padding: '16px 20px 20px' }}>
            {gam.loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><IonSpinner name="crescent" /></div>
            ) : (
              <>
                {/* Level row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 36 }}>{gam.level.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-sm)', fontWeight: 600, color: 'var(--md-on-surface)' }}>
                        {gam.level.name}
                      </span>
                      <span style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                        {gam.xp.toLocaleString()} XP
                      </span>
                    </div>
                    {/* XP bar */}
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--md-surface-container-high)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, Math.round(pct * 100))}%`,
                        borderRadius: 4,
                        background: gam.level.color,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 10, color: 'var(--md-on-surface-variant)', marginTop: 2 }}>
                      {gam.xpIntoLevel} / {gam.xpForLevel} to {nextLevel.name}
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{
                  display: 'flex',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'var(--md-surface-container)',
                  borderRadius: 'var(--md-shape-md)',
                }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-lg)', fontWeight: 300, color: 'var(--md-on-surface)' }}>
                      {totalBadges}
                    </div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)' }}>
                      Badges
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'var(--md-outline-variant)' }} />
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-lg)', fontWeight: 300, color: 'var(--md-on-surface)' }}>
                      {gam.currentStreak}
                    </div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)' }}>
                      Current Streak
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'var(--md-outline-variant)' }} />
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-lg)', fontWeight: 300, color: 'var(--md-on-surface)' }}>
                      {gam.bestStreak}
                    </div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)' }}>
                      Best Streak
                    </div>
                  </div>
                </div>
              </>
            )}
          </IonCardContent>
        </IonCard>

        {/* ── Badge shelves ─────────────────────────────────────────────── */}
        <div style={{ marginTop: 16 }}>
          {gam.loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><IonSpinner name="crescent" /></div>
          ) : (
            CATEGORIES.map(cat => (
              <BadgeShelf
                key={cat.id}
                cat={cat}
                value={cat.value(gam.counts)}
                levelEmoji={gam.level.emoji}
                levelName={gam.level.name}
              />
            ))
          )}
        </div>

        {/* ── Shareable cards ────────────────────────────────────────────── */}
        <IonListHeader style={{ paddingTop: 16 }}>
          <IonLabel style={{
            color: 'var(--md-primary)',
            fontFamily: 'var(--md-font)',
            fontSize: 'var(--md-label-lg)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            <IonIcon icon={shareOutline} style={{ marginRight: 6, verticalAlign: 'middle', fontSize: 16 }} />
            Share Achievements
          </IonLabel>
        </IonListHeader>

        <ShareSection cards={cards} counts={gam.counts} />

      </IonContent>
    </IonPage>
  );
};

export default AchievementsPage;
