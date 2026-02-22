<div align="center">
  <img src="docs/assets/icon.png" alt="Patty Logo" width="100" />
  <h1>Patty</h1>
  <p><strong>A calm daily health companion — not a hardcore fitness tracker.</strong></p>

  <p>
    <a href="https://github.com/InflateHub/patty/releases/latest">
      <img src="https://img.shields.io/github/v/release/InflateHub/patty?label=latest&color=5C7A6E" alt="Latest Release" />
    </a>
    <a href="https://github.com/InflateHub/patty/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/InflateHub/patty?color=5C7A6E" alt="License" />
    </a>
    <a href="https://patty.saranmahadev.in">
      <img src="https://img.shields.io/badge/website-patty.saranmahadev.in-5C7A6E" alt="Website" />
    </a>
  </p>

  <p>
    <a href="https://patty.saranmahadev.in">🌐 Website</a> ·
    <a href="https://github.com/InflateHub/patty/releases/latest">📦 Download APK</a> ·
    <a href="CHANGELOG.md">📋 Changelog</a> ·
    <a href="ROADMAP.md">🗺️ Roadmap</a>
  </p>
</div>

---

## What is Patty?

Patty is a minimal, open-source iOS/Android lifestyle companion that combines **health tracking** with **practical planning** in one calm, low-friction app.

Most health apps make you log data endlessly without guiding your next action. Patty bridges that gap — it doesn't just track, it helps you **cook, eat, sleep, and move** more consistently.

> **Design principle:** Few taps. Visual progress. Low cognitive load.

---

## Features

### 📊 Health Tracking
| Tab | What you can track |
|---|---|
| **Weight** | Daily entries with mandatory progress photo, chart, history, delta chips |
| **Water** | One-tap logging with presets (250 ml / 500 ml), animated goal ring |
| **Sleep** | Log bedtime + wake time, quality slider, one entry per day |
| **Food** | Photo-first meal logging across Breakfast / Lunch / Dinner / Snacks |

### 🍽️ Recipes & Meal Planning
- **Recipe library** — 12 built-in seed recipes + create your own (name, emoji, ingredients, steps, times, tags)
- **Weekly meal plan grid** — assign recipes to Mon–Sun × 3 meal slots
- **Auto-generated grocery list** — deduplicated ingredients from the week's plan

### 🏆 Achievements & Gamification
- **Shareable cards** — Daily, Weekly, Monthly, Yearly and Lifetime branded cards (400×600), captured and shared natively
- **XP system** — earn XP for every logged habit; progress through 5 levels (Seedling → Legend)
- **Streaks & badges** — current/best streak counters, 8 milestone badges, 7-day habit ring grid
- **Weight photo marquee** — horizontal hero scroll of weigh-in photos with delta chips

### 🔒 Privacy & Security
- **PIN lock** — 4-digit PIN with SHA-256 hashing; no plaintext ever stored
- **Biometric unlock** — Face ID / Fingerprint via device capability (toggle in Profile)
- **100% local** — all data lives on-device in SQLite; no accounts, no cloud, no analytics
- **Data controls** — Clear Logs, Clear Photos, Factory Reset (all behind two-tap confirm dialogs)

### 🎨 Personalisation
- **Dynamic theming** — pick from 8 curated seed colours or enter a custom hex; the full MD3 tonal palette re-generates live
- **Light / Dark / System** mode toggle
- **Font size** — Default / Large / XL
- **Profile** — name, DOB, height, weight, biological sex, goal, activity level, water goal

### 🔔 Smart Reminders
- 10 independent notification channels: Weight, Water (frequency-based, 1–8/day), Sleep, Food (Breakfast/Lunch/Dinner), Weekly check-in, Progress photo, Engagement nudges
- All times individually configurable; water slots auto-distributed with manual override

### 🧭 Onboarding
- 6-step first-launch flow (Welcome → Name/DOB → Metrics → Goal → Activity/Water → Celebration)
- All steps mandatory; "Desire. Commit. Achieve." tagline; CSS confetti celebration screen

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Ionic](https://ionicframework.com/) 8 + [React](https://react.dev/) 19 |
| **Language** | TypeScript 5 |
| **Build tool** | [Vite](https://vitejs.dev/) 5 |
| **Native runtime** | [Capacitor](https://capacitorjs.com/) 8 |
| **Database** | SQLite via `@capacitor-community/sqlite` + `jeep-sqlite` (browser WASM) |
| **Design system** | Material Design 3 (Material Expressive 3 / Material You) |
| **Charts** | [Recharts](https://recharts.org/) 3 |
| **Theming** | `@material/material-color-utilities` — live MD3 palette generation |
| **Unit tests** | [Vitest](https://vitest.dev/) + Testing Library |
| **E2E tests** | [Cypress](https://www.cypress.io/) 13 |
| **Linting** | ESLint 9 |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Ionic CLI** (optional but recommended)

```bash
npm install -g @ionic/cli
```

### Install

```bash
git clone https://github.com/InflateHub/patty.git
cd patty
npm install
```

### Run in the browser

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> **Note:** SQLite runs via `jeep-sqlite` (WebAssembly) in the browser. All features work except native camera and biometrics — use the file-input fallbacks instead.

### Build for production

```bash
npm run build
```

The output lands in `dist/`.

### Run on Android

Requires Android Studio and a connected device or emulator.

```bash
npm run build
npx cap sync android
npx cap open android
```

Then **Run ▶** from Android Studio, or use `npx cap run android` for a direct deploy.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Type-check + build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run test.unit` | Run unit tests with Vitest |
| `npm run test.e2e` | Run end-to-end tests with Cypress |

---

## Project Structure

```
src/
├── pages/          # Route-level page components (Home, Track, Recipes, Plan, Achievements, Profile, Onboarding…)
├── track/          # Self-contained tab modules (WeightTab, WaterTab, SleepTab, FoodTab)
├── recipes/        # Recipe data, detail modal, create modal
├── plan/           # Meal plan grid, grocery list, recipe picker modal
├── progress/       # Shareable card components
├── components/     # Reusable UI (WeightChart, WaterRing, TrendCharts, LockScreen, PinSetupModal)
├── hooks/          # All data + logic hooks (useWeightLog, useWaterLog, useSleepLog, useFoodLog, useRecipes, useMealPlan, useProfile, useTheme, useAppLock, useGamification, useAchievementCards, useNotifications…)
├── db/             # SQLite init + versioned migrations (v1–v12)
├── utils/          # Shared utilities (photoStorage)
├── theme/          # MD3 design tokens (variables.css, md3.css)
├── App.tsx         # Root component — IonTabs + startup gate
└── main.tsx        # Entry point
```

---

## Design System

Patty uses **Material Design 3** as its design language, implemented via CSS custom property overrides on top of Ionic.

- **Seed colour:** `#5C7A6E` (Patty slate-green) — all palette values derive from this seed
- **Tokens:** `--md-primary`, `--md-surface`, `--md-on-surface`, shape scale (`--md-shape-xs` → `--md-shape-full`), type scale (`--md-title-lg`, `--md-body-md`…)
- **Dark mode:** automatic via `@media (prefers-color-scheme: dark)` — no component-level dark logic
- **Dynamic theming:** `@material/material-color-utilities` generates a full tonal palette from any hex seed at runtime

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository and create a feature branch: `git checkout -b feat/your-feature`
2. Follow the **three-phase workflow** documented in [AGENTS.md](AGENTS.md): Plan → Implement → Verify
3. Use **conventional commits**: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `test:`, `chore:`
4. Run tests before opening a PR: `npm run test.unit` and `npm run lint`
5. Open a pull request against `main` with a clear description of the change

### Code style rules
- Use **MD3 tokens only** — never hard-code colours or font sizes
- No `color="primary"` Ionic props in new code — use `var(--md-*)` tokens directly
- Dark mode handled by tokens, not component-level conditionals
- SQLite for all persistence — no `localStorage`

---

## Roadmap

Current version: **1.8.0** — [Landing Page live at patty.saranmahadev.in](https://patty.saranmahadev.in)

Upcoming milestones:

| Version | Goal |
|---|---|
| **1.9.0** | Google Play Store release pipeline |
| **1.9.1** | Crash reporting & analytics (Firebase Crashlytics) |
| **1.9.2** | Open Beta |
| **2.0.0** | Cloud sync & user accounts |

See [ROADMAP.md](ROADMAP.md) for the full plan and [CHANGELOG.md](CHANGELOG.md) for what's already shipped.

---

## License

Distributed under the terms of the [LICENSE](LICENSE) file in this repository.

---

<div align="center">
  <sub>Built with ❤️ using Ionic + React + Capacitor · Material Design 3</sub>
</div>
