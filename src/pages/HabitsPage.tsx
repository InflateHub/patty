import React, { useState, useMemo } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import {
  add,
  checkmarkCircle,
  flameOutline,
  shieldCheckmark,
  sparkles,
  trash,
  warningOutline,
} from 'ionicons/icons';
import {
  useHabits,
  computeLevel,
  levelName,
  getNextMilestone,
  isMilestone,
  badgeTier,
  xpForStreak,
  MILESTONE_BONUS_XP,
} from '../hooks/useHabits';
import type { HabitType, HabitWithStats } from '../hooks/useHabits';

// ── Style helpers ──────────────────────────────────────────────────────────────

const S = {
  page: {
    background: 'var(--md-surface)',
  } as React.CSSProperties,

  heroCard: {
    borderRadius: 'var(--md-shape-xl)',
    background: 'var(--md-primary-container)',
    margin: '12px 16px 0',
    boxShadow: 'none',
    border: 'none',
  } as React.CSSProperties,

  heroContent: {
    padding: '20px 20px 16px',
  } as React.CSSProperties,

  badgeRow: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto' as const,
    paddingBottom: 4,
    scrollbarWidth: 'none' as const,
  } as React.CSSProperties,

  badgePill: (colour: string): React.CSSProperties => ({
    background: colour,
    color: '#fff',
    borderRadius: 'var(--md-shape-full)',
    padding: '4px 10px',
    fontSize: 'var(--md-label-sm)',
    fontFamily: 'var(--md-font)',
    whiteSpace: 'nowrap' as const,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    opacity: 0.92,
  }),

  xpBarTrack: {
    height: 6,
    borderRadius: 'var(--md-shape-full)',
    background: 'color-mix(in srgb, var(--md-on-primary-container) 20%, transparent)',
    margin: '8px 0 4px',
    overflow: 'hidden',
  } as React.CSSProperties,

  xpBarFill: (pct: number): React.CSSProperties => ({
    height: '100%',
    width: `${Math.min(100, pct)}%`,
    background: 'var(--md-on-primary-container)',
    borderRadius: 'var(--md-shape-full)',
    transition: 'width 0.5s ease',
  }),

  habitCard: (colour: string, done: boolean): React.CSSProperties => ({
    borderRadius: 'var(--md-shape-lg)',
    margin: '6px 16px',
    boxShadow: 'none',
    border: `1.5px solid ${done ? colour : 'var(--md-outline-variant)'}`,
    background: done
      ? `color-mix(in srgb, ${colour} 12%, var(--md-surface))`
      : 'var(--md-surface)',
    transition: 'border 0.2s, background 0.2s',
  }),

  relapseCard: (done: boolean): React.CSSProperties => ({
    borderRadius: 'var(--md-shape-lg)',
    margin: '6px 16px',
    boxShadow: 'none',
    border: `1.5px solid ${done ? '#D32F2F' : 'var(--md-outline-variant)'}`,
    background: done
      ? 'color-mix(in srgb, #D32F2F 10%, var(--md-surface))'
      : 'var(--md-surface)',
    transition: 'border 0.2s, background 0.2s',
  }),
};

// ── Milestone history helper ──────────────────────────────────────────────────

function earnedMilestones(streak: number): number[] {
  const fixed = [3, 7, 14, 21, 30];
  const all: number[] = [];
  for (const f of fixed) {
    if (streak >= f) all.push(f);
  }
  if (streak >= 31) {
    for (let m = 60; m <= Math.min(streak, 364); m += 30) all.push(m);
  }
  if (streak >= 365) {
    for (let m = 365; m <= Math.min(streak, 999); m += 100) all.push(m);
  }
  if (streak >= 1000) {
    for (let m = 1000; m <= streak; m += 365) all.push(m);
  }
  return all.slice(-8); // show last 8
}

// ── Emoji picker options ──────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
  '✅','💧','😴','⚖️','💪','🏃','🧘','🥗','🍎','🚴',
  '📖','🧠','🎯','🌞','🚶','🏊','🤸','🥤','🛏️','🫀',
  '❌','🚫','🍔','🍟','🍺','🚬','📱','😤','💸','🍰',
];

const COLOUR_OPTIONS = [
  '#5C7A6E','#1976D2','#388E3C','#F57C00','#7B1FA2',
  '#C62828','#00838F','#AD1457',
];

// ── Add Habit Modal ───────────────────────────────────────────────────────────

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (habit: { name: string; emoji: string; colour: string; type: HabitType }) => Promise<void>;
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✅');
  const [colour, setColour] = useState('#5C7A6E');
  const [type, setType] = useState<HabitType>('good');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setEmoji('✅');
    setColour('#5C7A6E');
    setType('good');
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onAdd({ name: name.trim(), emoji, colour, type });
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={() => { reset(); onClose(); }}
      initialBreakpoint={0.85}
      breakpoints={[0, 0.85, 1]}
    >
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--md-surface)' } as React.CSSProperties}>
          <IonTitle style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-md)', color: 'var(--md-on-surface)' }}>
            New Habit
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => { reset(); onClose(); }} style={{ color: 'var(--md-on-surface-variant)' }}>
              Cancel
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': 'var(--md-surface)' } as React.CSSProperties}>
        {/* Good / Bad toggle */}
        <div style={{ padding: '16px 16px 0' }}>
          <IonSegment
            value={type}
            onIonChange={(e) => setType(e.detail.value as HabitType)}
            style={{ '--background': 'var(--md-surface-variant)', borderRadius: 'var(--md-shape-full)' } as React.CSSProperties}
          >
            <IonSegmentButton value="good" style={{ '--border-radius': 'var(--md-shape-full)' } as React.CSSProperties}>
              <IonLabel style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-lg)' }}>✅ Good Habit</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="bad" style={{ '--border-radius': 'var(--md-shape-full)' } as React.CSSProperties}>
              <IonLabel style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-lg)' }}>❌ Bad Habit</IonLabel>
            </IonSegmentButton>
          </IonSegment>
          <p style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)', marginTop: 8, marginBottom: 0, fontFamily: 'var(--md-font)' }}>
            {type === 'good'
              ? 'Rewarded for doing it every day. Streak grows with each completion.'
              : 'Rewarded for every clean day you resist. Logging a slip resets your streak.'}
          </p>
        </div>

        {/* Name */}
        <IonList style={{ '--background': 'var(--md-surface)', marginTop: 8 } as React.CSSProperties}>
          <IonItem style={{ '--background': 'var(--md-surface)', '--border-color': 'var(--md-outline-variant)' } as React.CSSProperties}>
            <IonLabel position="stacked" style={{ fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)', fontSize: 'var(--md-label-lg)' }}>
              Habit Name
            </IonLabel>
            <IonInput
              value={name}
              onIonInput={(e) => setName(e.detail.value ?? '')}
              placeholder={type === 'good' ? 'e.g. Morning walk' : 'e.g. Doom-scrolled before bed'}
              style={{ fontFamily: 'var(--md-font)', color: 'var(--md-on-surface)' } as React.CSSProperties}
              maxlength={40}
            />
          </IonItem>
        </IonList>

        {/* Emoji picker */}
        <div style={{ padding: '12px 16px 0' }}>
          <p style={{ margin: '0 0 8px', fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)' }}>Icon</p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                style={{
                  width: 40, height: 40, fontSize: 20, borderRadius: 'var(--md-shape-sm)',
                  border: `2px solid ${emoji === e ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
                  background: emoji === e ? 'var(--md-primary-container)' : 'var(--md-surface-variant)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Colour picker */}
        <div style={{ padding: '12px 16px 0' }}>
          <p style={{ margin: '0 0 8px', fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-lg)', color: 'var(--md-on-surface-variant)' }}>Colour</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
            {COLOUR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setColour(c)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', background: c,
                  border: `3px solid ${colour === c ? 'var(--md-on-surface)' : 'transparent'}`,
                  cursor: 'pointer', outline: 'none',
                  boxShadow: colour === c ? '0 0 0 2px var(--md-primary)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 16px 40px' }}>
          <IonButton
            expand="block"
            disabled={!name.trim() || saving}
            onClick={handleAdd}
            style={{
              '--background': 'var(--md-primary)',
              '--color': 'var(--md-on-primary)',
              '--border-radius': 'var(--md-shape-full)',
              fontFamily: 'var(--md-font)',
            } as React.CSSProperties}
          >
            Add Habit
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

// ── Habit row ──────────────────────────────────────────────────────────────────

interface HabitRowProps {
  habit: HabitWithStats;
  onToggleGood: (id: string) => void;
  onLogRelapse: (habit: HabitWithStats) => void;
  onDelete: (habit: HabitWithStats) => void;
}

const HabitRow: React.FC<HabitRowProps> = ({ habit, onToggleGood, onLogRelapse, onDelete }) => {
  const { stats } = habit;
  const isGood = habit.type === 'good';
  const nextMs = getNextMilestone(stats.currentStreak);
  const xpToday = xpForStreak(stats.currentStreak) + (isMilestone(stats.currentStreak) ? MILESTONE_BONUS_XP : 0);

  const cardStyle = isGood
    ? S.habitCard(habit.colour, stats.todayActed)
    : S.relapseCard(stats.todayActed);

  const handleAction = () => {
    if (isGood) {
      onToggleGood(habit.id);
    } else {
      if (!stats.todayActed) {
        onLogRelapse(habit);
      }
    }
  };

  return (
    <IonItemSliding>
      <IonItem
        button={!stats.todayActed || isGood}
        detail={false}
        onClick={handleAction}
        style={{ '--background': 'transparent', '--border-color': 'transparent' } as React.CSSProperties}
      >
        <IonCard style={cardStyle}>
          <IonCardContent style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Emoji avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--md-shape-md)',
              background: isGood
                ? `color-mix(in srgb, ${habit.colour} 18%, var(--md-surface))`
                : 'color-mix(in srgb, #D32F2F 10%, var(--md-surface))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {habit.emoji}
            </div>

            {/* Name + streak */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-lg)', color: 'var(--md-on-surface)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {habit.name}
              </div>
              <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)', marginTop: 2 }}>
                {isGood ? (
                  stats.currentStreak > 0
                    ? `🔥 ${stats.currentStreak}-day streak · next milestone: ${nextMs}`
                    : `Next milestone: ${nextMs} days`
                ) : (
                  stats.todayActed
                    ? `❌ Slipped today · streak reset`
                    : stats.currentStreak > 0
                      ? `🛡️ ${stats.currentStreak} clean days · tap to log a slip`
                      : 'Start today — no slips yet'
                )}
              </div>
            </div>

            {/* Status indicator */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }}>
              {isGood ? (
                <IonIcon
                  icon={stats.todayActed ? checkmarkCircle : flameOutline}
                  style={{ fontSize: 26, color: stats.todayActed ? habit.colour : 'var(--md-outline)' }}
                />
              ) : (
                <IonIcon
                  icon={stats.todayActed ? warningOutline : shieldCheckmark}
                  style={{ fontSize: 26, color: stats.todayActed ? '#D32F2F' : '#388E3C' }}
                />
              )}
              {stats.todayActed && isGood && (
                <span style={{ fontSize: 10, fontFamily: 'var(--md-font)', color: habit.colour, fontWeight: 600 }}>
                  +{xpToday} XP
                </span>
              )}
            </div>
          </IonCardContent>
        </IonCard>
      </IonItem>

      {!habit.is_default && (
        <IonItemOptions side="end">
          <IonItemOption color="danger" onClick={() => onDelete(habit)}>
            <IonIcon slot="icon-only" icon={trash} />
          </IonItemOption>
        </IonItemOptions>
      )}
    </IonItemSliding>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const HabitsPage: React.FC = () => {
  const { habits, totalXP, loading, toggleGoodHabit, logRelapse, addHabit, deleteHabit } = useHabits();
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [presentAlert] = useIonAlert();

  const level = computeLevel(totalXP);
  const lvlName = levelName(level);

  // XP progress to next level: level boundary is at 50 * 2^(level-1)
  const xpForLevel = (l: number) => (l <= 1 ? 0 : Math.round(50 * Math.pow(2, l - 2)));
  const xpCurrentLevelStart = xpForLevel(level);
  const xpNextLevelStart    = xpForLevel(level + 1);
  const xpPct = xpNextLevelStart > xpCurrentLevelStart
    ? ((totalXP - xpCurrentLevelStart) / (xpNextLevelStart - xpCurrentLevelStart)) * 100
    : 100;

  const goodHabits = habits.filter((h) => h.type === 'good');
  const badHabits  = habits.filter((h) => h.type === 'bad');

  const longestStreak = useMemo(
    () => Math.max(0, ...habits.map((h) => h.stats.currentStreak)),
    [habits]
  );

  const todayDoneCount = useMemo(
    () =>
      goodHabits.filter((h) => h.stats.todayActed).length +
      badHabits.filter((h) => !h.stats.todayActed).length,
    [goodHabits, badHabits]
  );

  const totalCount = habits.length;

  // Earned badges from all habits
  const allBadges = useMemo(() => {
    const badges: { label: string; emoji: string; colour: string }[] = [];
    for (const h of habits) {
      for (const streak of earnedMilestones(h.stats.bestStreak)) {
        const tier = badgeTier(streak);
        badges.push({ label: `${streak}-Day ${tier.label}`, emoji: tier.emoji, colour: tier.colour });
      }
    }
    return badges.slice(-8);
  }, [habits]);

  const handleToggleGood = async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const wasActed = habit.stats.todayActed;
    await toggleGoodHabit(id);

    if (!wasActed) {
      const newStreak = habit.stats.currentStreak + 1;
      if (isMilestone(newStreak)) {
        const tier = badgeTier(newStreak);
        setToast(`${tier.emoji} ${newStreak}-Day milestone! +${xpForStreak(newStreak) + MILESTONE_BONUS_XP} XP`);
      } else {
        setToast(`+${xpForStreak(habit.stats.currentStreak + 1)} XP`);
      }
    }
  };

  const handleLogRelapse = (habit: HabitWithStats) => {
    presentAlert({
      header: 'Log a slip?',
      message: `This will reset your ${habit.stats.currentStreak}-day clean streak for "${habit.name}". Past days cannot be edited.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Log Slip',
          role: 'destructive',
          cssClass: 'danger',
          handler: async () => {
            await logRelapse(habit.id);
            setToast(`Streak reset for "${habit.name}". You've got this — start fresh today.`);
          },
        },
      ],
    });
  };

  const handleDelete = (habit: HabitWithStats) => {
    presentAlert({
      header: 'Delete habit?',
      message: `All history for "${habit.name}" will be permanently removed.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          cssClass: 'danger',
          handler: async () => {
            await deleteHabit(habit.id);
            setToast(`"${habit.name}" deleted.`);
          },
        },
      ],
    });
  };

  return (
    <IonPage style={S.page}>
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--md-surface)', '--border-color': 'var(--md-outline-variant)' } as React.CSSProperties}>
          <IonTitle style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-lg)', color: 'var(--md-on-surface)' }}>
            Habits
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ '--background': 'var(--md-surface)' } as React.CSSProperties}>

        {/* ── Hero card ── */}
        <IonCard style={S.heroCard}>
          <IonCardContent style={S.heroContent}>
            {loading ? (
              <>
                <IonSkeletonText animated style={{ width: '60%', height: 28, borderRadius: 8, marginBottom: 8 }} />
                <IonSkeletonText animated style={{ width: '40%', height: 16, borderRadius: 8 }} />
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-headline-md)', color: 'var(--md-on-primary-container)', fontWeight: 700, lineHeight: 1.1 }}>
                      🔥 {longestStreak} day{longestStreak !== 1 ? 's' : ''}
                    </div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-md)', color: 'var(--md-on-primary-container)', opacity: 0.8, marginTop: 4 }}>
                      Longest active streak
                    </div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-primary-container)', opacity: 0.7, marginTop: 2 }}>
                      {todayDoneCount} / {totalCount} on track today
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <IonChip style={{ '--background': 'color-mix(in srgb, var(--md-on-primary-container) 20%, transparent)', '--color': 'var(--md-on-primary-container)', fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-md)' } as React.CSSProperties}>
                      <IonIcon icon={sparkles} style={{ marginRight: 4 }} />
                      {lvlName}
                    </IonChip>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', color: 'var(--md-on-primary-container)', opacity: 0.7, marginTop: 2 }}>
                      Lv {level} · {totalXP} XP
                    </div>
                  </div>
                </div>

                {/* XP bar */}
                <div style={S.xpBarTrack}>
                  <div style={S.xpBarFill(xpPct)} />
                </div>
                <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', color: 'var(--md-on-primary-container)', opacity: 0.6, textAlign: 'right' as const }}>
                  {xpNextLevelStart > xpCurrentLevelStart ? `${xpNextLevelStart - totalXP} XP to Lv ${level + 1}` : 'Max level unlocked!'}
                </div>

                {/* Badges shelf */}
                {allBadges.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', color: 'var(--md-on-primary-container)', opacity: 0.7, marginBottom: 6 }}>
                      Recent badges
                    </div>
                    <div style={S.badgeRow}>
                      {allBadges.map((b, i) => (
                        <div key={i} style={S.badgePill(b.colour)}>
                          {b.emoji} {b.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </IonCardContent>
        </IonCard>

        {/* ── Good Habits ── */}
        <IonListHeader style={{ paddingTop: 16, paddingBottom: 4 }}>
          <IonLabel style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-lg)', color: 'var(--md-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ✅ Good Habits
          </IonLabel>
        </IonListHeader>

        {loading ? (
          [1, 2, 3].map((i) => (
            <IonCard key={i} style={{ ...S.habitCard('#5C7A6E', false), margin: '6px 16px' }}>
              <IonCardContent style={{ padding: 12 }}>
                <IonSkeletonText animated style={{ width: '70%', height: 18, borderRadius: 6 }} />
                <IonSkeletonText animated style={{ width: '45%', height: 13, borderRadius: 6, marginTop: 6 }} />
              </IonCardContent>
            </IonCard>
          ))
        ) : goodHabits.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: '24px 24px', color: 'var(--md-on-surface-variant)', fontFamily: 'var(--md-font)' }}>
            <div style={{ fontSize: 36 }}>✨</div>
            <div style={{ fontSize: 'var(--md-body-md)', marginTop: 8 }}>No good habits yet</div>
            <div style={{ fontSize: 'var(--md-body-sm)', opacity: 0.7, marginTop: 4 }}>Add one to start your streak</div>
          </div>
        ) : (
          goodHabits.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              onToggleGood={handleToggleGood}
              onLogRelapse={handleLogRelapse}
              onDelete={handleDelete}
            />
          ))
        )}

        {/* ── Bad Habits ── */}
        <IonListHeader style={{ paddingTop: 12, paddingBottom: 4 }}>
          <IonLabel style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-lg)', color: '#C62828', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            🛡️ Bad Habits to Break
          </IonLabel>
        </IonListHeader>

        {loading ? null : badHabits.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: '16px 24px 24px', color: 'var(--md-on-surface-variant)', fontFamily: 'var(--md-font)' }}>
            <div style={{ fontSize: 36 }}>🛡️</div>
            <div style={{ fontSize: 'var(--md-body-md)', marginTop: 8 }}>Nothing to resist yet</div>
            <div style={{ fontSize: 'var(--md-body-sm)', opacity: 0.7, marginTop: 4 }}>Add a bad habit to track clean days</div>
          </div>
        ) : (
          <>
            <div style={{ padding: '4px 16px 8px' }}>
              <IonNote style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                Every clean day grows your streak. Tap a row only if you slipped today — past days are permanently locked.
              </IonNote>
            </div>
            {badHabits.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                onToggleGood={handleToggleGood}
                onLogRelapse={handleLogRelapse}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}

        {/* Bottom padding for FAB */}
        <div style={{ height: 96 }} />
      </IonContent>

      {/* ── FAB ── */}
      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton
          onClick={() => setShowAdd(true)}
          style={{
            '--background': 'var(--md-primary-container)',
            '--color': 'var(--md-on-primary-container)',
          } as React.CSSProperties}
        >
          <IonIcon icon={add} />
        </IonFabButton>
      </IonFab>

      {/* ── Add modal ── */}
      <AddHabitModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addHabit}
      />

      <IonToast
        isOpen={!!toast}
        message={toast ?? ''}
        duration={2500}
        onDidDismiss={() => setToast(null)}
        position="top"
        style={{ '--background': 'var(--md-inverse-surface)', '--color': 'var(--md-inverse-on-surface)', fontFamily: 'var(--md-font)' } as React.CSSProperties}
      />
    </IonPage>
  );
};

export default HabitsPage;
