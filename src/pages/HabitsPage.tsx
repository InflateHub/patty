import React, { useState, useMemo, useCallback } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonPage,
  IonSkeletonText,
  IonTitle,
  IonToast,
  IonToolbar,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  useIonAlert,
} from '@ionic/react';
import {
  add,
  checkmarkCircle,
  shieldCheckmark,
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

// ── Milestone helpers ─────────────────────────────────────────────────────────

function earnedMilestones(streak: number): number[] {
  const fixed = [3, 7, 14, 21, 30];
  const all: number[] = [];
  for (const f of fixed) { if (streak >= f) all.push(f); }
  if (streak >= 31)  { for (let m = 60;   m <= Math.min(streak, 364); m += 30)  all.push(m); }
  if (streak >= 365) { for (let m = 365;  m <= Math.min(streak, 999); m += 100) all.push(m); }
  if (streak >= 1000){ for (let m = 1000; m <= streak;                m += 365) all.push(m); }
  return all.slice(-10);
}

// ── Picker options ────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = [
  '✅','💧','😴','⚖️','💪','🏃','🧘','🥗','🍎','🚴',
  '📖','🧠','🎯','🌞','🚶','🏊','🤸','🥤','🛏️','🫀',
  '❌','🚫','🍔','🍟','🍺','🚬','📱','😤','💸','🍰',
];

const COLOUR_OPTIONS = [
  { hex: '#5C7A6E', label: 'Sage'   },
  { hex: '#1976D2', label: 'Blue'   },
  { hex: '#388E3C', label: 'Green'  },
  { hex: '#F57C00', label: 'Amber'  },
  { hex: '#7B1FA2', label: 'Purple' },
  { hex: '#C62828', label: 'Red'    },
  { hex: '#00838F', label: 'Teal'   },
  { hex: '#AD1457', label: 'Pink'   },
];

// ── Add Habit Modal ───────────────────────────────────────────────────────────

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (habit: { name: string; emoji: string; colour: string; type: HabitType }) => Promise<void>;
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName]     = useState('');
  const [emoji, setEmoji]   = useState('✅');
  const [colour, setColour] = useState('#5C7A6E');
  const [type, setType]     = useState<HabitType>('good');
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(''); setEmoji('✅'); setColour('#5C7A6E'); setType('good'); };
  const close = () => { reset(); onClose(); };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try { await onAdd({ name: name.trim(), emoji, colour, type }); close(); }
    finally { setSaving(false); }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={close} initialBreakpoint={0.92} breakpoints={[0, 0.92, 1]}>
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--md-surface)' } as React.CSSProperties}>
          <IonTitle style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-md)', color: 'var(--md-on-surface)' }}>
            New Habit
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={close} style={{ color: 'var(--md-on-surface-variant)' }}>Cancel</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': 'var(--md-surface)' } as React.CSSProperties}>
        <div style={{ padding: '12px 16px 0' }}>

          {/* Type toggle */}
          <div style={{
            display: 'flex', gap: 6, padding: 4,
            background: 'var(--md-surface-variant)',
            borderRadius: 'var(--md-shape-full)', marginBottom: 20,
          }}>
            {(['good', 'bad'] as HabitType[]).map((t) => (
              <button key={t} onClick={() => setType(t)} style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                borderRadius: 'var(--md-shape-full)',
                background: type === t ? (t === 'good' ? 'var(--md-primary)' : '#C62828') : 'transparent',
                color: type === t ? '#fff' : 'var(--md-on-surface-variant)',
                fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-lg)', fontWeight: 600,
                transition: 'background 0.2s, color 0.2s',
              }}>
                {t === 'good' ? '✅  Good Habit' : '🛡️  Break a Habit'}
              </button>
            ))}
          </div>

          {/* Explainer */}
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--md-shape-md)', marginBottom: 20,
            background: type === 'good'
              ? 'color-mix(in srgb, var(--md-primary) 10%, var(--md-surface))'
              : 'color-mix(in srgb, #C62828 10%, var(--md-surface))',
          }}>
            <p style={{ margin: 0, fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
              {type === 'good'
                ? '🔥 Tap the card each day to mark it done and grow your streak.'
                : '🛡️ Your streak counts every clean day. Use "I slipped" only when you break it.'}
            </p>
          </div>

          {/* Name input */}
          <div style={{
            border: '1.5px solid var(--md-outline-variant)',
            borderRadius: 'var(--md-shape-md)', padding: '12px 14px', marginBottom: 20,
            background: 'var(--md-surface)',
          }}>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)', marginBottom: 4, letterSpacing: '0.06em' }}>
              HABIT NAME
            </div>
            <IonInput
              value={name}
              onIonInput={(e) => setName(e.detail.value ?? '')}
              placeholder={type === 'good' ? 'e.g. Morning walk' : 'e.g. No late-night scrolling'}
              style={{ '--padding-start': '0', fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-lg)', color: 'var(--md-on-surface)' } as React.CSSProperties}
              maxlength={40}
            />
          </div>

          {/* Emoji picker */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)', marginBottom: 10, letterSpacing: '0.06em' }}>ICON</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  width: 44, height: 44, fontSize: 22, borderRadius: 'var(--md-shape-sm)',
                  border: emoji === e
                    ? `2.5px solid ${type === 'good' ? 'var(--md-primary)' : '#C62828'}`
                    : '2px solid var(--md-outline-variant)',
                  background: emoji === e
                    ? (type === 'good' ? 'var(--md-primary-container)' : 'color-mix(in srgb,#C62828 15%,var(--md-surface))')
                    : 'var(--md-surface-variant)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border 0.15s, background 0.15s',
                }}>{e}</button>
              ))}
            </div>
          </div>

          {/* Colour picker */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-sm)', color: 'var(--md-on-surface-variant)', marginBottom: 10, letterSpacing: '0.06em' }}>COLOUR</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {COLOUR_OPTIONS.map((c) => (
                <button key={c.hex} onClick={() => setColour(c.hex)} style={{
                  width: 36, height: 36, borderRadius: '50%', background: c.hex, border: 'none',
                  cursor: 'pointer', outline: 'none',
                  boxShadow: colour === c.hex ? `0 0 0 3px var(--md-surface), 0 0 0 5px ${c.hex}` : 'none',
                  transform: colour === c.hex ? 'scale(1.15)' : 'scale(1)',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }} />
              ))}
            </div>
          </div>

          {/* Add button */}
          <button
            disabled={!name.trim() || saving}
            onClick={handleAdd}
            style={{
              width: '100%', padding: '15px 0', border: 'none',
              cursor: name.trim() ? 'pointer' : 'default',
              borderRadius: 'var(--md-shape-full)',
              background: name.trim() ? (type === 'good' ? 'var(--md-primary)' : '#C62828') : 'var(--md-outline-variant)',
              color: name.trim() ? '#fff' : 'var(--md-on-surface-variant)',
              fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-lg)', fontWeight: 700,
              letterSpacing: '0.04em', transition: 'background 0.2s', marginBottom: 16,
            }}
          >
            {saving ? 'Adding…' : 'Add Habit'}
          </button>
        </div>
        <div style={{ height: 40 }} />
      </IonContent>
    </IonModal>
  );
};

// ── Good Habit Card ───────────────────────────────────────────────────────────

interface GoodHabitCardProps {
  habit: HabitWithStats;
  onToggle: (id: string) => void;
  onDelete: (habit: HabitWithStats) => void;
}

const GoodHabitCard: React.FC<GoodHabitCardProps> = ({ habit, onToggle, onDelete }) => {
  const { stats } = habit;
  const done      = stats.todayActed;
  const nextMs    = getNextMilestone(stats.currentStreak);
  const progress  = nextMs > 0 ? Math.min(1, stats.currentStreak / nextMs) : 1;
  const xpEarned  = xpForStreak(stats.currentStreak + 1) + (isMilestone(stats.currentStreak + 1) ? MILESTONE_BONUS_XP : 0);

  return (
    <div style={{ margin: '0 16px 12px', position: 'relative' as const }}>
      <div style={{
        borderRadius: 'var(--md-shape-xl)', padding: '16px 16px 14px',
        background: done ? `color-mix(in srgb, ${habit.colour} 14%, var(--md-surface))` : 'var(--md-surface)',
        border: `1.5px solid ${done ? habit.colour : 'var(--md-outline-variant)'}`,
        boxShadow: done ? `0 2px 12px color-mix(in srgb, ${habit.colour} 22%, transparent)` : '0 1px 4px color-mix(in srgb, var(--md-shadow) 6%, transparent)',
        transition: 'border 0.25s, background 0.25s, box-shadow 0.25s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Emoji bubble */}
          <div style={{
            width: 50, height: 50, borderRadius: 'var(--md-shape-lg)', flexShrink: 0,
            background: `color-mix(in srgb, ${habit.colour} 18%, var(--md-surface))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>
            {habit.emoji}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-sm)', color: 'var(--md-on-surface)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {habit.name}
            </div>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)', marginTop: 3 }}>
              {stats.currentStreak > 0 ? `🔥 ${stats.currentStreak}-day streak` : 'Start your streak today'}
            </div>
          </div>

          {/* Check button */}
          <button
            onClick={() => onToggle(habit.id)}
            style={{
              width: 50, height: 50, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: 'pointer',
              background: done ? habit.colour : 'var(--md-surface-variant)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: done ? `0 0 0 4px color-mix(in srgb, ${habit.colour} 22%, transparent)` : 'none',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
          >
            <IonIcon icon={checkmarkCircle} style={{ fontSize: 30, color: done ? '#fff' : 'var(--md-outline)' }} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontFamily: 'var(--md-font)', fontSize: 11, color: 'var(--md-on-surface-variant)' }}>
              Next milestone: {nextMs} days
            </span>
            {done && (
              <span style={{
                fontFamily: 'var(--md-font)', fontSize: 11, fontWeight: 700, color: habit.colour,
                background: `color-mix(in srgb, ${habit.colour} 15%, var(--md-surface))`,
                padding: '2px 8px', borderRadius: 'var(--md-shape-full)',
              }}>
                +{xpEarned} XP today
              </span>
            )}
          </div>
          <div style={{ height: 5, borderRadius: 'var(--md-shape-full)', background: 'var(--md-outline-variant)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 'var(--md-shape-full)',
              width: `${progress * 100}%`,
              background: done ? habit.colour : 'var(--md-outline)',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>

      {!habit.is_default && (
        <button onClick={() => onDelete(habit)} style={{
          position: 'absolute' as const, top: 10, right: 10,
          width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'var(--md-error-container)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8,
        }}>
          <IonIcon icon={trash} style={{ fontSize: 13, color: 'var(--md-on-error-container)' }} />
        </button>
      )}
    </div>
  );
};

// ── Bad Habit Card ────────────────────────────────────────────────────────────

interface BadHabitCardProps {
  habit: HabitWithStats;
  onLogRelapse: (habit: HabitWithStats) => void;
  onDelete: (habit: HabitWithStats) => void;
}

const BadHabitCard: React.FC<BadHabitCardProps> = ({ habit, onLogRelapse, onDelete }) => {
  const { stats } = habit;
  const slipped  = stats.todayActed;
  const nextMs   = getNextMilestone(stats.currentStreak);
  const progress = nextMs > 0 ? Math.min(1, stats.currentStreak / nextMs) : 1;

  return (
    <div style={{ margin: '0 16px 12px', position: 'relative' as const }}>
      <div style={{
        borderRadius: 'var(--md-shape-xl)', padding: '16px 16px 14px',
        background: slipped ? 'color-mix(in srgb, #C62828 10%, var(--md-surface))' : 'var(--md-surface)',
        border: `1.5px solid ${slipped ? '#C62828' : 'var(--md-outline-variant)'}`,
        boxShadow: slipped ? '0 2px 12px color-mix(in srgb, #C62828 18%, transparent)' : '0 1px 4px color-mix(in srgb, var(--md-shadow) 6%, transparent)',
        transition: 'border 0.25s, background 0.25s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Emoji bubble */}
          <div style={{
            width: 50, height: 50, borderRadius: 'var(--md-shape-lg)', flexShrink: 0,
            background: slipped ? 'color-mix(in srgb,#C62828 15%,var(--md-surface))' : 'color-mix(in srgb,#388E3C 12%,var(--md-surface))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>
            {slipped ? '😔' : habit.emoji}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-sm)', color: 'var(--md-on-surface)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {habit.name}
            </div>
            <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', marginTop: 3, color: slipped ? '#C62828' : 'var(--md-on-surface-variant)' }}>
              {slipped
                ? `Streak reset · best was ${stats.bestStreak} day${stats.bestStreak !== 1 ? 's' : ''}`
                : stats.currentStreak > 0
                  ? `🛡️ ${stats.currentStreak} clean day${stats.currentStreak !== 1 ? 's' : ''}`
                  : 'Day 1 — stay strong!'}
            </div>
          </div>

          {/* Shield / warning icon */}
          <div style={{
            width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
            background: slipped ? 'color-mix(in srgb,#C62828 15%,var(--md-surface))' : 'color-mix(in srgb,#388E3C 15%,var(--md-surface))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IonIcon icon={slipped ? warningOutline : shieldCheckmark} style={{ fontSize: 26, color: slipped ? '#C62828' : '#388E3C' }} />
          </div>
        </div>

        {/* Progress bar — only when clean */}
        {!slipped && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontFamily: 'var(--md-font)', fontSize: 11, color: 'var(--md-on-surface-variant)' }}>Next milestone: {nextMs} days</span>
              <span style={{ fontFamily: 'var(--md-font)', fontSize: 11, color: '#388E3C' }}>Best: {stats.bestStreak} days</span>
            </div>
            <div style={{ height: 5, borderRadius: 'var(--md-shape-full)', background: 'var(--md-outline-variant)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 'var(--md-shape-full)', width: `${progress * 100}%`, background: '#388E3C', transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}

        {/* I slipped button */}
        {!slipped && (
          <button
            onClick={() => onLogRelapse(habit)}
            style={{
              width: '100%', marginTop: 14, padding: '10px 0',
              border: '1.5px solid #C62828', cursor: 'pointer',
              borderRadius: 'var(--md-shape-full)', background: 'transparent', color: '#C62828',
              fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-lg)', fontWeight: 600,
            }}
          >
            ☹️  I slipped today
          </button>
        )}

        {/* Slipped footer */}
        {slipped && (
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: 'color-mix(in srgb, #C62828 8%, var(--md-surface))',
            borderRadius: 'var(--md-shape-md)',
            fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)',
            color: '#C62828', textAlign: 'center' as const,
          }}>
            You've got this — new streak starts tomorrow 💪
          </div>
        )}
      </div>

      {!habit.is_default && (
        <button onClick={() => onDelete(habit)} style={{
          position: 'absolute' as const, top: 10, right: 10,
          width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'var(--md-error-container)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8,
        }}>
          <IonIcon icon={trash} style={{ fontSize: 13, color: 'var(--md-on-error-container)' }} />
        </button>
      )}
    </div>
  );
};

// ── Section header ────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ label: string; accent: string; count: number }> = ({ label, accent, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 10px' }}>
    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-lg)', fontWeight: 700, color: accent, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
      {label}
    </div>
    <div style={{
      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
      background: `color-mix(in srgb, ${accent} 18%, var(--md-surface))`,
      fontFamily: 'var(--md-font)', fontSize: 11, fontWeight: 700, color: accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {count}
    </div>
    <div style={{ flex: 1, height: 1, background: `color-mix(in srgb, ${accent} 20%, transparent)` }} />
  </div>
);

const EmptyState: React.FC<{ emoji: string; title: string; subtitle: string }> = ({ emoji, title, subtitle }) => (
  <div style={{ textAlign: 'center' as const, padding: '24px', fontFamily: 'var(--md-font)' }}>
    <div style={{ fontSize: 40, marginBottom: 8 }}>{emoji}</div>
    <div style={{ fontSize: 'var(--md-body-lg)', color: 'var(--md-on-surface)', fontWeight: 500 }}>{title}</div>
    <div style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)', marginTop: 4, opacity: 0.8 }}>{subtitle}</div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const HabitsPage: React.FC = () => {
  const { habits, totalXP, loading, toggleGoodHabit, logRelapse, addHabit, deleteHabit } = useHabits();
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const [presentAlert]        = useIonAlert();

  const level   = computeLevel(totalXP);
  const lvlName = levelName(level);

  const xpForLevel          = (l: number) => (l <= 1 ? 0 : Math.round(50 * Math.pow(2, l - 2)));
  const xpCurrentLevelStart = xpForLevel(level);
  const xpNextLevelStart    = xpForLevel(level + 1);
  const xpPct = xpNextLevelStart > xpCurrentLevelStart
    ? ((totalXP - xpCurrentLevelStart) / (xpNextLevelStart - xpCurrentLevelStart)) * 100
    : 100;

  const goodHabits = habits.filter((h) => h.type === 'good');
  const badHabits  = habits.filter((h) => h.type === 'bad');

  const longestStreak = useMemo(
    () => (habits.length === 0 ? 0 : Math.max(...habits.map((h) => h.stats.currentStreak))),
    [habits]
  );

  const todayOnTrack = useMemo(
    () => goodHabits.filter((h) => h.stats.todayActed).length + badHabits.filter((h) => !h.stats.todayActed).length,
    [goodHabits, badHabits]
  );

  const allBadges = useMemo(() => {
    const badges: { label: string; emoji: string; colour: string }[] = [];
    for (const h of habits) {
      for (const s of earnedMilestones(h.stats.bestStreak)) {
        const tier = badgeTier(s);
        badges.push({ label: `${s}-Day`, emoji: tier.emoji, colour: tier.colour });
      }
    }
    return badges.slice(-10);
  }, [habits]);

  const handleToggleGood = useCallback(async (id: string) => {
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
        setToast(`✅ Done! +${xpForStreak(newStreak)} XP`);
      }
    }
  }, [habits, toggleGoodHabit]);

  const handleLogRelapse = useCallback((habit: HabitWithStats) => {
    presentAlert({
      header: 'Log a slip?',
      message: `This resets your ${habit.stats.currentStreak}-day streak for "${habit.name}". This cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Log Slip', role: 'destructive', cssClass: 'danger',
          handler: async () => {
            await logRelapse(habit.id);
            setToast(`Streak reset for "${habit.name}". Start fresh tomorrow 💪`);
          },
        },
      ],
    });
  }, [presentAlert, logRelapse]);

  const handleDelete = useCallback((habit: HabitWithStats) => {
    presentAlert({
      header: 'Delete habit?',
      message: `All history for "${habit.name}" will be permanently removed.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete', role: 'destructive', cssClass: 'danger',
          handler: async () => { await deleteHabit(habit.id); setToast(`"${habit.name}" deleted.`); },
        },
      ],
    });
  }, [presentAlert, deleteHabit]);

  return (
    <IonPage style={{ background: 'var(--md-surface)' }}>
      <IonHeader>
        <IonToolbar style={{ '--background': 'var(--md-surface)', '--border-color': 'var(--md-outline-variant)' } as React.CSSProperties}>
          <IonTitle style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-lg)', color: 'var(--md-on-surface)', fontWeight: 700 }}>
            Habits
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ '--background': 'var(--md-surface)' } as React.CSSProperties}>

        {/* ── Hero card ────────────────────────────────────────── */}
        <div style={{ margin: '12px 16px 0' }}>
          <div style={{
            borderRadius: 'var(--md-shape-xl)',
            background: 'linear-gradient(135deg, var(--md-primary) 0%, color-mix(in srgb, var(--md-primary) 70%, var(--md-tertiary)) 100%)',
            padding: '22px 20px 18px', position: 'relative' as const, overflow: 'hidden',
          }}>
            {/* Decorative blob */}
            <div style={{
              position: 'absolute' as const, top: -30, right: -30, width: 140, height: 140,
              borderRadius: '50%', background: 'color-mix(in srgb, var(--md-on-primary) 8%, transparent)',
              pointerEvents: 'none' as const,
            }} />

            {loading ? (
              <>
                <IonSkeletonText animated style={{ width: '55%', height: 32, borderRadius: 10, marginBottom: 10, background: 'rgba(255,255,255,0.2)' }} />
                <IonSkeletonText animated style={{ width: '35%', height: 16, borderRadius: 6, background: 'rgba(255,255,255,0.2)' }} />
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--md-font)', fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{longestStreak}</span>
                      <span style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-title-sm)', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                        day{longestStreak !== 1 ? 's' : ''} 🔥
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                      Longest active streak
                    </div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-body-sm)', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                      {todayOnTrack} / {habits.length} on track today
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.18)', borderRadius: 'var(--md-shape-lg)',
                    padding: '8px 14px', backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.25)', textAlign: 'center' as const,
                  }}>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 18 }}>✨</div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-label-md)', color: '#fff', fontWeight: 700, marginTop: 2 }}>{lvlName}</div>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Level {level}</div>
                  </div>
                </div>

                {/* XP bar */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--md-font)', fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{totalXP} XP</span>
                    <span style={{ fontFamily: 'var(--md-font)', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                      {xpNextLevelStart > totalXP ? `${xpNextLevelStart - totalXP} XP to Level ${level + 1}` : 'Max level!'}
                    </span>
                  </div>
                  <div style={{ height: 7, borderRadius: 'var(--md-shape-full)', background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, xpPct)}%`, borderRadius: 'var(--md-shape-full)', background: '#fff', transition: 'width 0.7s ease' }} />
                  </div>
                </div>

                {/* Badge shelf */}
                {allBadges.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontFamily: 'var(--md-font)', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 7, letterSpacing: '0.06em' }}>EARNED BADGES</div>
                    <div style={{ display: 'flex', gap: 7, overflowX: 'auto' as const, scrollbarWidth: 'none' as const }}>
                      {allBadges.map((b, i) => (
                        <div key={i} style={{
                          background: b.colour, borderRadius: 'var(--md-shape-full)',
                          padding: '4px 10px', whiteSpace: 'nowrap' as const,
                          fontFamily: 'var(--md-font)', fontSize: 11, color: '#fff', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          {b.emoji} {b.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Good Habits ──────────────────────────────────────── */}
        <SectionHeader label="✅  Good Habits" accent="var(--md-primary)" count={goodHabits.length} />

        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} style={{ margin: '0 16px 12px', borderRadius: 'var(--md-shape-xl)', border: '1.5px solid var(--md-outline-variant)', padding: 16 }}>
              <IonSkeletonText animated style={{ width: '60%', height: 20, borderRadius: 8, marginBottom: 8 }} />
              <IonSkeletonText animated style={{ width: '40%', height: 13, borderRadius: 6 }} />
            </div>
          ))
        ) : goodHabits.length === 0 ? (
          <EmptyState emoji="✨" title="No good habits yet" subtitle="Tap + to add your first one" />
        ) : (
          goodHabits.map((h) => (
            <GoodHabitCard key={h.id} habit={h} onToggle={handleToggleGood} onDelete={handleDelete} />
          ))
        )}

        {/* ── Breaking Habits ──────────────────────────────────── */}
        <SectionHeader label="🛡️  Breaking" accent="#C62828" count={badHabits.length} />

        {!loading && badHabits.length === 0 ? (
          <EmptyState emoji="🛡️" title="No habits to break yet" subtitle="Add a bad habit to track your clean days" />
        ) : (
          badHabits.map((h) => (
            <BadHabitCard key={h.id} habit={h} onLogRelapse={handleLogRelapse} onDelete={handleDelete} />
          ))
        )}

        <div style={{ height: 100 }} />
      </IonContent>

      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton onClick={() => setShowAdd(true)} style={{ '--background': 'var(--md-primary)', '--color': 'var(--md-on-primary)' } as React.CSSProperties}>
          <IonIcon icon={add} />
        </IonFabButton>
      </IonFab>

      <AddHabitModal isOpen={showAdd} onClose={() => setShowAdd(false)} onAdd={addHabit} />

      <IonToast
        isOpen={!!toast} message={toast ?? ''} duration={2200}
        onDidDismiss={() => setToast(null)} position="top"
        style={{ '--background': 'var(--md-inverse-surface)', '--color': 'var(--md-inverse-on-surface)', fontFamily: 'var(--md-font)' } as React.CSSProperties}
      />
    </IonPage>
  );
};

export default HabitsPage;
