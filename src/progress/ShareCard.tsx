/**
 * ShareCard — off-screen renderable cards for Daily / Weekly / Monthly / Yearly sharing.
 *
 * Each card is exactly 400 × 600 px with Patty branding, designed for social sharing.
 * Rendered inside a hidden absolute div off-screen; captured via html-to-image.
 */
import React from 'react';
import type { DailyCard, WeeklyCard, MonthlyCard, YearlyCard, LifetimeCard } from '../hooks/useAchievementCards';

// ── Shared styles ─────────────────────────────────────────────────────────────

const BASE: React.CSSProperties = {
  width: 400,
  height: 600,
  fontFamily: 'Roboto, system-ui, sans-serif',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '32px 28px 24px',
  boxSizing: 'border-box',
  borderRadius: 28,
  overflow: 'hidden',
  position: 'relative',
};

const BRAND_ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  alignSelf: 'flex-start',
};

const BRAND_LOGO: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  objectFit: 'cover',
};

const BRAND_LABEL: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  opacity: 0.85,
};

const CARD_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  opacity: 0.7,
  alignSelf: 'flex-start',
  marginTop: -4,
};

const BIG_STAT: React.CSSProperties = {
  fontSize: 64,
  fontWeight: 300,
  lineHeight: 1,
  textAlign: 'center',
  letterSpacing: '-1px',
};

const SUBSTAT: React.CSSProperties = {
  fontSize: 15,
  opacity: 0.75,
  textAlign: 'center',
  marginTop: 4,
};

const HEADLINE: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  textAlign: 'center',
  lineHeight: 1.35,
};

const RING_ROW: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'center',
  justifyContent: 'center',
};

const HABIT_DOT = (filled: boolean, color: string): React.CSSProperties => ({
  width: 14,
  height: 14,
  borderRadius: '50%',
  background: filled ? color : 'rgba(255,255,255,0.25)',
  border: `2px solid ${filled ? color : 'rgba(255,255,255,0.4)'}`,
  flexShrink: 0,
});

const STAT_GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px 24px',
  width: '100%',
};

const STAT_BLOCK: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const STAT_VAL: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 300,
  lineHeight: 1,
};

const STAT_LBL: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.65,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const BAR_TRACK: React.CSSProperties = {
  height: 6,
  borderRadius: 3,
  background: 'rgba(255,255,255,0.2)',
  width: '100%',
  overflow: 'hidden',
};

const barFill = (pct: number): React.CSSProperties => ({
  height: '100%',
  width: `${Math.min(100, Math.round(pct * 100))}%`,
  borderRadius: 3,
  background: 'rgba(255,255,255,0.85)',
});

// ── Gradient presets ──────────────────────────────────────────────────────────
const GRADIENTS = {
  daily:   'linear-gradient(145deg, #3D6659 0%, #5C7A6E 50%, #7B9990 100%)',
  weekly:  'linear-gradient(145deg, #2E4F66 0%, #3A6B8A 50%, #5A89A8 100%)',
  monthly: 'linear-gradient(145deg, #5A3A6B 0%, #7B5295 50%, #9B72B5 100%)',
  yearly:  'linear-gradient(145deg, #6B3A3A 0%, #954B3A 50%, #B56A52 100%)',
};

// ── Watermark noise (optional decorative circles) ─────────────────────────────
const WatermarkCircles: React.FC = () => (
  <>
    <div style={{
      position: 'absolute', width: 260, height: 260,
      borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)',
      top: -80, right: -80, pointerEvents: 'none',
    }} />
    <div style={{
      position: 'absolute', width: 180, height: 180,
      borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)',
      bottom: -40, left: -60, pointerEvents: 'none',
    }} />
  </>
);

const Brand: React.FC<{ variant: string }> = ({ variant }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
    <div style={BRAND_ROW}>
      <img src="/assets/icon/icon.png" alt="Patty" style={BRAND_LOGO} />
      <span style={{ ...BRAND_LABEL, color: '#fff' }}>Patty</span>
    </div>
    <span style={{ ...CARD_LABEL, color: '#fff', alignSelf: 'auto', marginTop: 0 }}>{variant}</span>
  </div>
);

// ── Habit pips row ────────────────────────────────────────────────────────────
const HabitPips: React.FC<{ weight: boolean; water: boolean; sleep: boolean; food: boolean }> = (p) => (
  <div style={RING_ROW}>
    {[
      { label: '\u2696\uFE0F', filled: p.weight },
      { label: '\uD83D\uDCA7', filled: p.water },
      { label: '\uD83D\uDE34', filled: p.sleep },
      { label: '\uD83C\uDF7D\uFE0F', filled: p.food },
    ].map(({ label, filled }) => (
      <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 16 }}>{label}</span>
        <div style={HABIT_DOT(filled, '#fff')} />
      </div>
    ))}
  </div>
);

// ── DAILY CARD ────────────────────────────────────────────────────────────────
export const DailyShareCard = React.forwardRef<HTMLDivElement, { data: DailyCard }>(
  ({ data }, ref) => (
    <div ref={ref} style={{ ...BASE, background: GRADIENTS.daily, color: '#fff' }}>
      <WatermarkCircles />
      <Brand variant="Today" />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={BIG_STAT}>{data.streak}</div>
        <div style={SUBSTAT}>day streak 🔥</div>
      </div>

      <HabitPips weight={data.weight} water={data.water} sleep={data.sleep} food={data.food} />

      {data.weightValue !== null && (
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 32, fontWeight: 300 }}>{data.weightValue}</span>
          <span style={{ fontSize: 16, opacity: 0.7, marginLeft: 4 }}>{data.weightUnit}</span>
          <div style={{ ...SUBSTAT, marginTop: 2 }}>today’s weight</div>
        </div>
      )}

      <div style={{ ...HEADLINE, color: '#fff' }}>{data.headline}</div>

      <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: '0.04em' }}>{data.dateLabel}</div>
    </div>
  )
);
DailyShareCard.displayName = 'DailyShareCard';

// ── WEEKLY CARD ───────────────────────────────────────────────────────────────
export const WeeklyShareCard = React.forwardRef<HTMLDivElement, { data: WeeklyCard }>(
  ({ data }, ref) => {
    const habits = [
      { emoji: '\u2696\uFE0F', label: 'Weight', of7: data.weightOf7 },
      { emoji: '\uD83D\uDCA7', label: 'Water',  of7: data.waterOf7  },
      { emoji: '\uD83D\uDE34', label: 'Sleep',  of7: data.sleepOf7  },
      { emoji: '\uD83C\uDF7D\uFE0F', label: 'Food', of7: data.foodOf7 },
    ];
    return (
      <div ref={ref} style={{ ...BASE, background: GRADIENTS.weekly, color: '#fff' }}>
        <WatermarkCircles />
        <Brand variant="This Week" />

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {habits.map(h => (
            <div key={h.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{h.emoji} {h.label}</span>
                <span style={{ opacity: 0.75 }}>{h.of7}/7</span>
              </div>
              <div style={BAR_TRACK}><div style={barFill(h.of7 / 7)} /></div>
            </div>
          ))}
        </div>

        {data.weightDeltaKg !== null && (
          <div style={{ textAlign: 'center' }}>
            <span style={{
              ...BIG_STAT,
              fontSize: 44,
              color: data.weightDeltaKg < 0 ? '#9ECA7F' : '#F5A623',
            }}>
              {data.weightDeltaKg > 0 ? '+' : ''}{data.weightDeltaKg.toFixed(1)} {data.weightDeltaUnit}
            </span>
            <div style={SUBSTAT}>this week</div>
          </div>
        )}

        <div style={{ ...HEADLINE, color: '#fff' }}>{data.headline}</div>
        <div style={{ fontSize: 11, opacity: 0.5 }}>{data.weekLabel}</div>
      </div>
    );
  }
);
WeeklyShareCard.displayName = 'WeeklyShareCard';

// ── MONTHLY CARD ───────────────────────────────────────────────────────────────
export const MonthlyShareCard = React.forwardRef<HTMLDivElement, { data: MonthlyCard }>(
  ({ data }, ref) => (
    <div ref={ref} style={{ ...BASE, background: GRADIENTS.monthly, color: '#fff' }}>
      <WatermarkCircles />
      <Brand variant="This Month" />

      <div style={STAT_GRID}>
        {[
          { val: data.weightLogs,    label: 'Weigh-ins',    emoji: '\u2696\uFE0F' },
          { val: data.waterGoalDays, label: 'Water goals',  emoji: '\uD83D\uDCA7' },
          { val: data.sleepLogs,     label: 'Sleep logs',   emoji: '\uD83D\uDE34' },
          { val: data.foodLogs,      label: 'Food entries', emoji: '\uD83C\uDF7D\uFE0F' },
        ].map(s => (
          <div key={s.label} style={STAT_BLOCK}>
            <span style={{ ...STAT_VAL, color: '#fff' }}>{s.emoji} {s.val}</span>
            <span style={{ ...STAT_LBL, color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 2 }}>Best streak</div>
        <div style={{ fontSize: 44, fontWeight: 300 }}>{data.bestStreak} days 🔥</div>
      </div>

      {data.weightDeltaKg !== null && (
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontSize: 32, fontWeight: 300,
            color: data.weightDeltaKg < 0 ? '#B5E8A0' : '#F5C842',
          }}>
            {data.weightDeltaKg > 0 ? '+' : ''}{data.weightDeltaKg.toFixed(1)} {data.weightDeltaUnit}
          </span>
        </div>
      )}

      <div style={{ ...HEADLINE, color: '#fff' }}>{data.headline}</div>
      <div style={{ fontSize: 11, opacity: 0.5 }}>{data.monthLabel}</div>
    </div>
  )
);
MonthlyShareCard.displayName = 'MonthlyShareCard';

// ── YEARLY CARD ────────────────────────────────────────────────────────────────
export const YearlyShareCard = React.forwardRef<HTMLDivElement, { data: YearlyCard }>(
  ({ data }, ref) => (
    <div ref={ref} style={{ ...BASE, background: GRADIENTS.yearly, color: '#fff' }}>
      <WatermarkCircles />
      <Brand variant={data.yearLabel} />

      <div style={STAT_GRID}>
        {[
          { val: data.totalWeighIns,     label: 'Weigh-ins',     emoji: '\u2696\uFE0F' },
          { val: `${data.totalWaterL}L`, label: 'Water drank',   emoji: '\uD83D\uDCA7' },
          { val: data.totalSleepNights,  label: 'Nights logged', emoji: '\uD83D\uDE34' },
          { val: data.totalMeals,        label: 'Meals logged',  emoji: '\uD83C\uDF7D\uFE0F' },
        ].map(s => (
          <div key={s.label} style={STAT_BLOCK}>
            <span style={{ ...STAT_VAL, color: '#fff' }}>{s.emoji} {s.val}</span>
            <span style={{ ...STAT_LBL, color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{data.levelName}</div>
          <div style={{ fontSize: 13, opacity: 0.65 }}>{data.xpEarned.toLocaleString()} XP earned ⭐</div>
        {data.badgesEarned > 0 && (
          <div style={{ fontSize: 13, opacity: 0.65, marginTop: 2 }}>{data.badgesEarned} badges unlocked 🎖️</div>
        )}
      </div>

      {data.weightDelta !== null && (
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontSize: 36, fontWeight: 300,
            color: data.weightDelta < 0 ? '#F4C38A' : '#F5C842',
          }}>
            {data.weightDelta > 0 ? '+' : ''}{data.weightDelta.toFixed(1)} {data.weightDeltaUnit}
          </span>
          <div style={{ ...SUBSTAT }}>since Jan 1</div>
        </div>
      )}

      <div style={{ ...HEADLINE, color: '#fff' }}>{data.headline}</div>
      <div style={{ fontSize: 11, opacity: 0.5 }}>My {data.yearLabel} on Patty</div>
    </div>
  )
);
YearlyShareCard.displayName = 'YearlyShareCard';

// ── LIFETIME CARD ──────────────────────────────────────────────────────
export const LifetimeShareCard = React.forwardRef<HTMLDivElement, { data: LifetimeCard }>(
  ({ data }, ref) => (
    <div ref={ref} style={{ ...BASE, background: 'linear-gradient(145deg, #1A1A2E 0%, #2D3561 55%, #7C4F1A 100%)', color: '#fff' }}>
      <WatermarkCircles />
      <Brand variant="All Time" />

      {/* Level badge */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{data.levelEmoji}</div>
        <div style={{ ...HEADLINE, fontSize: 22 }}>{data.levelName}</div>
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
          {data.totalXP.toLocaleString()} XP
          {data.joinDate ? ` • Since ${data.joinDate}` : ''}
        </div>
      </div>

      {/* Stats grid */}
      <div style={STAT_GRID}>
        {([
          { val: data.totalWeighIns,              label: 'Weigh-ins',    emoji: '⚖️' },
          { val: `${data.totalWaterL}L`,           label: 'Water drank',  emoji: '💧' },
          { val: data.totalSleepNights,            label: 'Nights logged',emoji: '😴' },
          { val: data.totalMeals,                  label: 'Meals logged', emoji: '🍽️' },
        ] as { val: number | string; label: string; emoji: string }[]).map(s => (
          <div key={s.label} style={STAT_BLOCK}>
            <span style={{ ...STAT_VAL, color: '#fff' }}>{s.emoji} {s.val}</span>
            <span style={{ ...STAT_LBL, color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Streak + days side by side */}
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 300 }}>{data.allTimeBestStreak}</div>
          <div style={{ fontSize: 11, opacity: 0.65 }}>Best streak 🔥</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 300 }}>{data.daysSince}</div>
          <div style={{ fontSize: 11, opacity: 0.65 }}>Days on journey</div>
        </div>
      </div>

      {/* Total weight change */}
      {data.totalWeightChange !== null && (
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontSize: 36, fontWeight: 300,
            color: data.totalWeightChange < 0 ? '#A8E6CF' : '#F5C842',
          }}>
            {data.totalWeightChange > 0 ? '+' : ''}{data.totalWeightChange.toFixed(1)} {data.weightUnit}
          </span>
          <div style={{ ...SUBSTAT }}>total change</div>
        </div>
      )}

      <div style={{ ...HEADLINE, color: '#fff' }}>{data.headline}</div>
      <div style={{ fontSize: 11, opacity: 0.5 }}>My journey on Patty</div>
    </div>
  )
);
LifetimeShareCard.displayName = 'LifetimeShareCard';
