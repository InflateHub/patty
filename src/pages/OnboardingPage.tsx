/**
 * OnboardingPage — shown on first launch only.
 * All steps are mandatory; no skip.
 * Data written directly to the `settings` SQLite table.
 *
 * Step 0  Welcome         — Logo, "Desire. Commit. Achieve.", feature cards fly in
 * Step 1  Name & DOB      — name, date of birth
 * Step 2  Metrics         — height (cm), starting weight, unit (kg/lb), sex
 * Step 3  Goal            — 5-option card picker
 * Step 4  Activity & Water — activity level + daily water goal
 * Step 5  Celebration     — confetti + "Let's go"
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonButton, IonSpinner } from '@ionic/react';
import { getDb } from '../db/database';
import type { Goal, ActivityLevel, Sex } from '../hooks/useProfile';
import './OnboardingPage.css';

// ─── Data ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { emoji: '⚡', title: 'Track Everything',   desc: 'Weight, water, sleep & meals in one place' },
  { emoji: '🍳', title: 'Plan Your Meals',    desc: 'Weekly meal plans with grocery lists'       },
  { emoji: '📈', title: 'See Your Progress',  desc: 'Charts, photos & 30-day trends'             },
  { emoji: '🔔', title: 'Stay Consistent',    desc: 'Smart reminders that adapt to you'          },
];

const GOALS: { id: Goal; emoji: string; label: string }[] = [
  { id: 'lose_weight',      emoji: '⚖️', label: 'Lose Weight'       },
  { id: 'maintain',         emoji: '🎯', label: 'Maintain Weight'   },
  { id: 'build_muscle',     emoji: '💪', label: 'Build Muscle'      },
  { id: 'improve_sleep',    emoji: '😴', label: 'Better Sleep'      },
  { id: 'general_wellness', emoji: '🌿', label: 'General Wellness'  },
];

const ACTIVITIES: { id: ActivityLevel; emoji: string; label: string; desc: string }[] = [
  { id: 'sedentary', emoji: '💼', label: 'Sedentary',         desc: 'Desk job, little exercise'     },
  { id: 'light',     emoji: '🚶', label: 'Lightly Active',    desc: '1–3 exercise days / week'      },
  { id: 'moderate',  emoji: '🏃', label: 'Moderately Active', desc: '3–5 exercise days / week'      },
  { id: 'very',      emoji: '🏋️', label: 'Very Active',       desc: '6–7 exercise days / week'      },
];

const SEX_OPTIONS: { id: Sex; emoji: string; label: string }[] = [
  { id: 'male',   emoji: '👨', label: 'Male'   },
  { id: 'female', emoji: '👩', label: 'Female'  },
  { id: 'other',  emoji: '🙂', label: 'Prefer\nnot to say' },
];

/** 500 ml → 4000 ml in 100 ml steps (36 values) */
const WATER_VALS: number[] = Array.from({ length: 36 }, (_, i) => 500 + i * 100);

const CONFETTI_COLORS = [
  '#5C7A6E', '#FFAB40', '#80DEEA', '#F48FB1',
  '#C8E6C9', '#FFF176', '#CE93D8', '#EF9A9A',
];
const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  id:       i,
  color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  left:     `${4 + (i * 4.3) % 88}%`,
  delay:    `${(i * 0.12) % 1.8}s`,
  duration: `${2.0 + (i * 0.25) % 2.0}s`,
  size:     `${7 + (i * 3) % 9}px`,
  width:    `${5 + (i * 2) % 8}px`,
}));

// ─── Style helpers ────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '15px 16px',
  border: '1.5px solid var(--md-outline)',
  borderRadius: 'var(--md-shape-md)',
  fontFamily: 'var(--md-font)',
  fontSize: 'var(--md-body-lg)',
  color: 'var(--md-on-surface)',
  background: 'var(--md-surface-container)',
  boxSizing: 'border-box',
  outline: 'none',
  WebkitAppearance: 'none',
  appearance: 'none',
};

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--md-font)',
  fontSize: 'var(--md-label-md)',
  fontWeight: 600,
  color: 'var(--md-on-surface-variant)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 8,
  marginTop: 20,
};

// ─── Component ────────────────────────────────────────────────────────────

const OnboardingPage: React.FC = () => {
  const history = useHistory();

  // step: 0=welcome, 1-4=forms, 5=celebration
  const [step, setStep] = useState(0);

  // Step 1
  const [name, setName] = useState('');
  const [dob,  setDob]  = useState('');
  // Step 2
  const [heightCm,   setHeightCm]   = useState('170');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ftin'>('cm');
  const [sex,        setSex]        = useState<Sex | ''>('');
  // Step 3
  const [goal, setGoal] = useState<Goal | ''>('');
  // Step 4
  const [activity,  setActivity]  = useState<ActivityLevel | ''>('');
  const [waterGoal, setWaterGoal] = useState(2000);
  const [waterUnit, setWaterUnit] = useState<'ml' | 'oz'>('ml');

  const [saving, setSaving] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────
  const rulerRef     = useRef<HTMLDivElement>(null);
  const waterDrumRef = useRef<HTMLDivElement>(null);
  const waterScrollT = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Validation ──────────────────────────────────────────────────────────

  const canProceed = (): boolean => {
    if (step === 1) return name.trim().length > 0 && dob !== '';
    if (step === 2) return parseFloat(heightCm) > 0 && sex !== '';
    if (step === 3) return goal !== '';
    if (step === 4) return activity !== '';
    return true;
  };

  // ── Scroll handlers ──────────────────────────────────────────────────────

  /** Read ruler scroll position → update heightCm */
  const handleRulerScroll = useCallback(() => {
    if (!rulerRef.current) return;
    const cm = Math.round(rulerRef.current.scrollLeft / 16) + 100;
    setHeightCm(String(Math.min(250, Math.max(100, cm))));
  }, []);

  /** Read drum scroll position → update waterGoal (debounced 150 ms) */
  const handleWaterScroll = useCallback(() => {
    if (!waterDrumRef.current) return;
    if (waterScrollT.current) clearTimeout(waterScrollT.current);
    waterScrollT.current = setTimeout(() => {
      if (!waterDrumRef.current) return;
      const idx = Math.round(waterDrumRef.current.scrollTop / 56);
      setWaterGoal(WATER_VALS[Math.max(0, Math.min(WATER_VALS.length - 1, idx))]);
    }, 150);
  }, []);

  /** Initialise scroll position when the step with a picker becomes active */
  useEffect(() => {
    if (step === 2 && rulerRef.current) {
      rulerRef.current.scrollLeft = (parseFloat(heightCm) || 170 - 100) * 16;
    }
    if (step === 4 && waterDrumRef.current) {
      const idx = WATER_VALS.indexOf(waterGoal);
      waterDrumRef.current.scrollTop = Math.max(0, idx) * 56;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Navigation ──────────────────────────────────────────────────────────

  const goBack = () => setStep(s => s - 1);

  const goNext = async () => {
    if (step < 4) { setStep(s => s + 1); return; }

    // Step 4 → save everything
    setSaving(true);
    try {
      const db = await getDb();

      const pairs: [string, string][] = [
        ['profile_name',       name.trim()        ],
        ['profile_dob',        dob                ],
        ['profile_sex',        sex                ],
        ['profile_height_cm',  heightCm           ],
        ['profile_activity',   activity           ],
        ['profile_goal',       goal               ],
        ['pref_water_goal_ml', String(waterGoal)  ],
        ['onboarding_complete', '1'               ],
      ];

      for (const [key, value] of pairs) {
        await db.run(
          'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
          [key, value],
        );
      }
    } finally {
      setSaving(false);
    }

    setStep(5);
  };

  const goToApp = () => history.replace('/tabs/home');

  // ── Chip helper ─────────────────────────────────────────────────────────

  const chipStyle = (selected: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 18px',
    borderRadius: 'var(--md-shape-full)',
    border: selected
      ? '2px solid var(--md-primary)'
      : '1.5px solid var(--md-outline-variant)',
    background: selected
      ? 'var(--md-primary-container)'
      : 'var(--md-surface-container-low)',
    color: selected ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
    fontFamily: 'var(--md-font)',
    fontSize: 'var(--md-body-md)',
    fontWeight: selected ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  });

  const selectionCardStyle = (selected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 16px',
    borderRadius: 'var(--md-shape-lg)',
    border: selected
      ? '2px solid var(--md-primary)'
      : '1.5px solid var(--md-outline-variant)',
    background: selected
      ? 'var(--md-primary-container)'
      : 'var(--md-surface-container-low)',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    WebkitTapHighlightColor: 'transparent',
  });

  // ── Progress dots ────────────────────────────────────────────────────────

  const renderDots = () => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 16, paddingBottom: 28 }}>
      {[1, 2, 3, 4].map(s => (
        <div
          key={s}
          style={{
            height: 8,
            width: s === step ? 24 : 8,
            borderRadius: 4,
            background:
              s === step     ? 'var(--md-primary)'
              : s < step     ? 'var(--md-primary-container)'
              :                'var(--md-outline-variant)',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  );

  // ── Nav buttons ──────────────────────────────────────────────────────────

  const renderNavButtons = () => (
    <div style={{ display: 'flex', gap: 12, paddingTop: 28 }}>
      <IonButton
        fill="outline"
        onClick={goBack}
        style={{
          flex: 1,
          height: 52,
          '--border-radius': 'var(--md-shape-full)',
          '--color': 'var(--md-on-surface-variant)',
          '--border-color': 'var(--md-outline)',
          '--box-shadow': 'none',
          fontFamily: 'var(--md-font)',
        } as React.CSSProperties}
      >
        Back
      </IonButton>
      <IonButton
        expand="block"
        disabled={!canProceed() || saving}
        onClick={goNext}
        style={{
          flex: 2,
          height: 52,
          '--background': 'var(--md-primary)',
          '--background-activated': 'var(--md-primary)',
          '--color': 'var(--md-on-primary)',
          '--border-radius': 'var(--md-shape-full)',
          '--box-shadow': 'none',
          fontFamily: 'var(--md-font)',
          fontWeight: 600,
        } as React.CSSProperties}
      >
        {saving ? <IonSpinner name="crescent" style={{ color: 'var(--md-on-primary)' }} /> : step === 4 ? 'Save & Continue' : 'Next'}
      </IonButton>
    </div>
  );

  // ── Step renderers ───────────────────────────────────────────────────────

  const renderWelcome = () => (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--md-primary-container)',
        padding: '48px 24px 32px',
      }}
    >
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div className="ob-hero-logo" style={{ lineHeight: 1, marginBottom: 16 }}>
          <img
            src="/assets/icon/icon.png"
            alt="Patty"
            style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto' }}
          />
        </div>
        <h1
          className="ob-hero-name"
          style={{
            fontFamily: 'var(--md-font)',
            fontSize: 'var(--md-display-size)',
            fontWeight: 700,
            color: 'var(--md-on-primary-container)',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
          }}
        >
          Patty
        </h1>
        <p
          className="ob-hero-tagline"
          style={{
            fontFamily: 'var(--md-font)',
            fontSize: 'var(--md-title-md)',
            fontWeight: 500,
            color: 'var(--md-on-primary-container)',
            opacity: 0.72,
            margin: 0,
            letterSpacing: '0.06em',
          }}
        >
          Desire. Commit. Achieve.
        </p>
      </div>

      {/* Feature cards */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="ob-feature-card"
            style={{
              animationDelay: `${0.40 + i * 0.18}s`,
              background: 'var(--md-surface)',
              borderRadius: 'var(--md-shape-xl)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 2px 10px color-mix(in srgb, var(--md-shadow) 14%, transparent)',
            }}
          >
            <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>{f.emoji}</span>
            <div>
              <div
                style={{
                  fontFamily: 'var(--md-font)',
                  fontSize: 'var(--md-title-sm)',
                  fontWeight: 600,
                  color: 'var(--md-on-surface)',
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontFamily: 'var(--md-font)',
                  fontSize: 'var(--md-body-sm)',
                  color: 'var(--md-on-surface-variant)',
                  marginTop: 2,
                }}
              >
                {f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Get Started */}
      <div className="ob-hero-btn" style={{ paddingTop: 24 }}>
        <IonButton
          expand="block"
          onClick={() => setStep(1)}
          style={{
            height: 58,
            '--background': 'var(--md-primary)',
            '--background-activated': 'var(--md-primary)',
            '--color': 'var(--md-on-primary)',
            '--border-radius': 'var(--md-shape-full)',
            '--box-shadow': 'none',
            fontFamily: 'var(--md-font)',
            fontSize: 'var(--md-title-sm)',
            fontWeight: 700,
          } as React.CSSProperties}
        >
          Get Started →
        </IonButton>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      <p
        style={{
          fontFamily: 'var(--md-font)',
          fontSize: 'var(--md-body-md)',
          color: 'var(--md-on-surface-variant)',
          marginBottom: 28,
          marginTop: 0,
        }}
      >
        Your name and date of birth help us personalise your experience.
      </p>

      <div style={sectionLabel}>First Name</div>
      <input
        type="text"
        placeholder="e.g. Alex"
        value={name}
        onChange={e => setName(e.target.value)}
        style={inputBase}
        autoFocus
      />

      <div style={{ ...sectionLabel, marginTop: 20 }}>Date of Birth</div>
      <input
        type="date"
        className="ob-date-input"
        value={dob}
        max={new Date().toISOString().slice(0, 10)}
        onChange={e => setDob(e.target.value)}
        style={{ ...inputBase, colorScheme: 'light dark' }}
      />
    </div>
  );

  const renderStep2 = () => (
    <div>
      <p
        style={{
          fontFamily: 'var(--md-font)',
          fontSize: 'var(--md-body-md)',
          color: 'var(--md-on-surface-variant)',
          marginBottom: 24,
          marginTop: 0,
        }}
      >
        Used to calculate BMI, BMR and your daily calorie target.
      </p>

      {/* ── HEIGHT ──────────────────────────────────────────────────────── */}
      <div style={sectionLabel}>Height</div>

      {/* Unit toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['cm', 'ftin'] as const).map(u => (
          <div key={u} onClick={() => setHeightUnit(u)} style={chipStyle(heightUnit === u)}>
            {u === 'cm' ? 'cm' : 'ft / in'}
          </div>
        ))}
      </div>

      {/* Large display value */}
      {(() => {
        const cm = parseFloat(heightCm) || 170;
        const totalIn = Math.round(cm / 2.54);
        const ftPart  = Math.floor(totalIn / 12);
        const inPart  = totalIn % 12;
        return (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-headline-lg)', fontWeight: 700, color: 'var(--md-primary)' }}>
              {heightUnit === 'cm' ? `${cm} cm` : `${ftPart}' ${inPart}"`}
            </span>
          </div>
        );
      })()}

      {/* Scrollable ruler */}
      <div className="ob-ruler-wrap" style={{ marginBottom: 28 }}>
        <div className="ob-ruler-needle" />
        <div ref={rulerRef} onScroll={handleRulerScroll} className="ob-ruler-track">
          <div style={{ minWidth: 'calc(50%)', flexShrink: 0 }} />
          {Array.from({ length: 151 }, (_, i) => 100 + i).map(c => {
            const cm   = parseFloat(heightCm) || 170;
            const dist = Math.abs(c - cm);
            return (
              <div key={c} className="ob-ruler-tick">
                <div
                  className="ob-tick-bar"
                  style={{
                    height:     c % 10 === 0 ? 34 : c % 5 === 0 ? 22 : 12,
                    background: c === cm ? 'var(--md-primary)' : 'var(--md-outline-variant)',
                    opacity:    dist > 20 ? 0.25 : dist > 10 ? 0.55 : 1,
                  }}
                />
                {c % 10 === 0 && (
                  <span className="ob-tick-label" style={{ color: c === cm ? 'var(--md-primary)' : 'var(--md-on-surface-variant)' }}>
                    {c}
                  </span>
                )}
              </div>
            );
          })}
          <div style={{ minWidth: 'calc(50%)', flexShrink: 0 }} />
        </div>
        <div className="ob-ruler-fade ob-ruler-fade-l" />
        <div className="ob-ruler-fade ob-ruler-fade-r" />
      </div>

      {/* ── SEX ─────────────────────────────────────────────────────────── */}
      <div style={{ ...sectionLabel, marginTop: 20 }}>Biological Sex</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {SEX_OPTIONS.map(s => (
          <div
            key={s.id}
            onClick={() => setSex(s.id)}
            className="ob-sex-card"
            style={{
              border: sex === s.id
                ? '2px solid var(--md-primary)'
                : '1.5px solid var(--md-outline-variant)',
              background: sex === s.id
                ? 'var(--md-primary-container)'
                : 'var(--md-surface-container-low)',
            }}
          >
            <span className="ob-sex-icon">{s.emoji}</span>
            <span
              className="ob-sex-label"
              style={{
                fontWeight: sex === s.id ? 600 : 400,
                color: sex === s.id
                  ? 'var(--md-on-primary-container)'
                  : 'var(--md-on-surface-variant)',
              }}
            >
              {s.label}
            </span>
            {sex === s.id && <span className="ob-sex-check">✓</span>}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <p
        style={{
          fontFamily: 'var(--md-font)',
          fontSize: 'var(--md-body-md)',
          color: 'var(--md-on-surface-variant)',
          marginBottom: 24,
          marginTop: 0,
        }}
      >
        This shapes your dashboard and recommendations.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {GOALS.map(g => (
          <div
            key={g.id}
            onClick={() => setGoal(g.id)}
            style={selectionCardStyle(goal === g.id)}
          >
            <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{g.emoji}</span>
            <span
              style={{
                fontFamily: 'var(--md-font)',
                fontSize: 'var(--md-title-sm)',
                fontWeight: goal === g.id ? 600 : 400,
                color: goal === g.id ? 'var(--md-on-primary-container)' : 'var(--md-on-surface)',
              }}
            >
              {g.label}
            </span>
            {goal === g.id && (
              <span style={{ marginLeft: 'auto', fontSize: 18 }}>✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <p
        style={{
          fontFamily: 'var(--md-font)',
          fontSize: 'var(--md-body-md)',
          color: 'var(--md-on-surface-variant)',
          marginBottom: 24,
          marginTop: 0,
        }}
      >
        Helps calculate your TDEE and set a realistic water goal.
      </p>

      {/* Activity level */}
      <div style={sectionLabel}>Activity Level</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ACTIVITIES.map(a => (
          <div
            key={a.id}
            onClick={() => setActivity(a.id)}
            style={selectionCardStyle(activity === a.id)}
          >
            <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{a.emoji}</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'var(--md-font)',
                  fontSize: 'var(--md-body-lg)',
                  fontWeight: activity === a.id ? 600 : 400,
                  color: activity === a.id ? 'var(--md-on-primary-container)' : 'var(--md-on-surface)',
                }}
              >
                {a.label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--md-font)',
                  fontSize: 'var(--md-body-sm)',
                  color: activity === a.id ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                  opacity: 0.8,
                  marginTop: 2,
                }}
              >
                {a.desc}
              </div>
            </div>
            {activity === a.id && (
              <span style={{ flexShrink: 0, fontSize: 18, color: 'var(--md-primary)' }}>✓</span>
            )}
          </div>
        ))}
      </div>

      {/* Daily water goal — drum picker */}
      <div style={{ ...sectionLabel, marginTop: 24 }}>Daily Water Goal</div>

      {/* Unit toggle + live big value */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--md-font)', fontSize: 'var(--md-headline-md)', fontWeight: 700, color: 'var(--md-primary)' }}>
          {waterUnit === 'ml'
            ? `${waterGoal} ml`
            : `${Math.round(waterGoal / 29.574)} oz`}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['ml', 'oz'] as const).map(u => (
            <div key={u} onClick={() => setWaterUnit(u)} style={chipStyle(waterUnit === u)}>{u}</div>
          ))}
        </div>
      </div>

      {/* Drum roller */}
      <div className="ob-drum-wrap" style={{ marginBottom: 12 }}>
        <div className="ob-drum-selector" />
        <div className="ob-drum-fade ob-drum-fade-t" />
        <div className="ob-drum-fade ob-drum-fade-b" />
        <div ref={waterDrumRef} onScroll={handleWaterScroll} className="ob-drum-scroll">
          <div style={{ height: 56 }} />
          {WATER_VALS.map((v, i) => {
            const selIdx = WATER_VALS.indexOf(waterGoal);
            const dist   = Math.abs(i - selIdx);
            return (
              <div
                key={v}
                className="ob-drum-item"
                style={{
                  fontWeight: v === waterGoal ? 700 : 400,
                  fontSize:   v === waterGoal ? 'var(--md-title-lg)' : 'var(--md-body-lg)',
                  color:      v === waterGoal ? 'var(--md-on-surface)' : 'var(--md-on-surface-variant)',
                  opacity:    dist > 3 ? 0.2 : dist > 1 ? 0.5 : 1,
                }}
              >
                {waterUnit === 'ml' ? `${v} ml` : `${Math.round(v / 29.574)} oz`}
              </div>
            );
          })}
          <div style={{ height: 56 }} />
        </div>
      </div>

      {/* Quick-add chips */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[100, 250, 500].map(amt => (
          <div
            key={amt}
            onClick={() => {
              setWaterGoal(prev => {
                const next = Math.min(4000, prev + amt);
                setTimeout(() => {
                  if (waterDrumRef.current) {
                    waterDrumRef.current.scrollTop = WATER_VALS.indexOf(next) * 56;
                  }
                }, 0);
                return next;
              });
            }}
            style={{ ...chipStyle(false), cursor: 'pointer', userSelect: 'none' } as React.CSSProperties}
          >
            +{waterUnit === 'ml' ? `${amt} ml` : `${Math.round(amt / 29.574)} oz`}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCelebration = () => (
    <div
      key="celebration"
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--md-surface)',
        padding: '40px 32px',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      {/* Confetti */}
      {CONFETTI.map(c => (
        <div
          key={c.id}
          className="ob-confetti"
          style={{
            top: 0,
            left: c.left,
            width: c.width,
            height: c.size,
            background: c.color,
            animationDelay: c.delay,
            animationDuration: c.duration,
          }}
        />
      ))}

      {/* Check circle */}
      <div
        className="ob-celebration-check"
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: 'var(--md-primary-container)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 52,
          marginBottom: 28,
          boxShadow: '0 4px 24px color-mix(in srgb, var(--md-primary) 30%, transparent)',
        }}
      >
        🎉
      </div>

      <h2
        className="ob-celebration-title"
        style={{
          fontFamily: 'var(--md-font)',
          fontSize: 'var(--md-headline-md)',
          fontWeight: 700,
          color: 'var(--md-on-surface)',
          margin: '0 0 12px',
        }}
      >
        You're all set{name ? `, ${name}` : ''}!
      </h2>

      <p
        className="ob-celebration-sub"
        style={{
          fontFamily: 'var(--md-font)',
          fontSize: 'var(--md-body-lg)',
          color: 'var(--md-on-surface-variant)',
          margin: '0 0 48px',
          maxWidth: 300,
        }}
      >
        Your journey to a healthier you starts right now.
      </p>

      <div className="ob-celebration-btn" style={{ width: '100%', maxWidth: 320 }}>
        <IonButton
          expand="block"
          onClick={goToApp}
          style={{
            height: 58,
            '--background': 'var(--md-primary)',
            '--background-activated': 'var(--md-primary)',
            '--color': 'var(--md-on-primary)',
            '--border-radius': 'var(--md-shape-full)',
            '--box-shadow': 'none',
            fontFamily: 'var(--md-font)',
            fontSize: 'var(--md-title-sm)',
            fontWeight: 700,
          } as React.CSSProperties}
        >
          Let's Go →
        </IonButton>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  const STEP_TITLES = ['', 'Tell us about you', 'Height & Sex', "What's your main goal?", 'Your lifestyle'];

  return (
    <IonPage>
      <IonContent>
        {/* Welcome */}
        {step === 0 && renderWelcome()}

        {/* Form steps 1–4 */}
        {step >= 1 && step <= 4 && (
          <div
            key={step}
            className="ob-step-content"
            style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '0 24px 40px', background: 'var(--md-surface)' }}
          >
            {renderDots()}

            {/* Step heading */}
            <h2
              style={{
                fontFamily: 'var(--md-font)',
                fontSize: 'var(--md-headline-sm)',
                fontWeight: 700,
                color: 'var(--md-on-surface)',
                margin: '0 0 4px',
              }}
            >
              {STEP_TITLES[step]}
            </h2>

            {/* Step body */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </div>

            {renderNavButtons()}
          </div>
        )}

        {/* Celebration */}
        {step === 5 && renderCelebration()}
      </IonContent>
    </IonPage>
  );
};

export default OnboardingPage;
