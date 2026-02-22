# AGENTS.md — Patty

This file defines how AI agents (and contributors) should work within this project.
It establishes the workflow protocol, explains the codebase, and documents the
three-phase iterative process used to plan, build, and verify every feature.

---

## Project Overview

**Patty** is a minimal iOS/Android lifestyle companion built with **Ionic + React**.
It combines health tracking (weight, water, sleep, food) with practical planning
(cooking planner, meal prep, exercise routines) in a single calm, low-friction app.

The guiding principle is: **reduce the gap between tracking and doing**.

---

## Design System — Material Expressive 3

Patty uses **Material Design 3 (Material Expressive 3 / Material You)** as its
design language, implemented via CSS custom property overrides on top of Ionic.

### Core files
| File | Purpose |
|---|---|
| `src/theme/variables.css` | Full MD3 tonal palette tokens, Ionic token mapping, light + dark |
| `src/theme/md3.css` | Component-level overrides: shape, typography, elevation, motion |

### Rules for all UI work

**1. Always use MD3 tokens — never hard-code colours or sizes.**
```css
/* ✓ */  color: var(--md-on-surface);
/* ✗ */  color: #1A1C1B;
```

**2. Seed colour: `#5C7A6E` (Patty slate-green).**
All palette values must derive from this seed. Do not introduce unrelated hues.

**3. Shape scale — use the correct token for the component type.**
| Token | Value | Used for |
|---|---|---|
| `--md-shape-xs` | 4px | Badges, small chips |
| `--md-shape-sm` | 8px | Small buttons, small cards |
| `--md-shape-md` | 12px | Cards, list containers |
| `--md-shape-lg` | 16px | Large cards, nav rail |
| `--md-shape-xl` | 28px | Dialogs, bottom sheets, FAB |
| `--md-shape-full` | 9999px | Pill buttons, chips, tab indicator |

**4. Typography — Roboto only, via MD3 type-scale tokens.**
```css
/* ✓ */  font-size: var(--md-title-lg);  font-family: var(--md-font);
/* ✗ */  font-size: 20px;  font-family: Arial;
```
Type scale tokens: `--md-display-size`, `--md-headline-lg/md/sm`,
`--md-title-lg/md/sm`, `--md-body-lg/md/sm`, `--md-label-lg/md/sm`.

**5. Elevation — tonal, not shadow-based.**
Use `color-mix(in srgb, var(--md-shadow) X%, transparent)` for subtle shadows only
on FABs and modals. Cards use a border (`var(--md-outline-variant)`), not shadows.

**6. Dark mode is automatic.**
All tokens have dark-mode overrides in `variables.css` via
`@media (prefers-color-scheme: dark)`. Never write separate dark-mode logic in
component files.

**7. New pages must follow this structure:**
- `IonCard` for primary content sections (with `--md-shape-xl` radius)
- `IonListHeader` for section labels (uppercase, `--md-primary` colour)
- `IonFab` FAB for the primary action (uses `--md-primary-container`)
- Empty states: centred, emoji illustration, two-line message, muted colour

**8. No Ionic colour names in new code.**
Prefer MD3 tokens directly over `color="primary"` / `color="danger"` props
unless the Ionic prop maps correctly and you have verified the token mapping.

---

## Current File Map

```
Patty/
│
├── src/
│   ├── main.tsx               # App entry point — mounts React root, imports Ionic CSS
│   ├── App.tsx                # Root component — IonTabs with four tab routes
│   ├── App.test.tsx           # Smoke test for the root component
│   ├── setupTests.ts          # Vitest/Testing Library global setup
│   ├── vite-env.d.ts          # Vite environment types + ionicons ambient declaration
│   │
│   ├── pages/
│   │   ├── Track.tsx          # Track tab shell — 51-line host: header + segment + active tab (0.5.0)
│   │   ├── Recipes.tsx        # Recipes tab — recipe library (stub → 0.6)
│   │   ├── Plan.tsx           # Plan tab — cooking + exercise planners (stub → 0.7–0.8)
│   │   ├── Progress.tsx       # Progress tab — stats card, photo gallery, compare modal, trend charts (0.9.0)
│   │   ├── Home.tsx           # Dashboard — live stats, greeting, BMI, profile icon button (0.9.3)
│   │   ├── ProfilePage.tsx    # Profile + Settings page: About Me, Preferences, Derived Metrics (BMI/BMR/TDEE), App Info (0.9.3)
│   │   └── Stub.css           # Shared empty-state styles for stub pages
│   │
│   ├── track/
│   │   ├── trackUtils.ts      # Shared utils: today/formatDate/formatTime/isToday/formatDuration + style tokens S
│   │   ├── WeightTab.tsx      # Self-contained weight tab: Today stat card, chart, history, modals, FAB
│   │   ├── WaterTab.tsx       # Self-contained water tab: state, ring, chips, modals, FAB
│   │   ├── SleepTab.tsx       # Self-contained sleep tab: Last Night stat card, history, entry modal (1/day), FAB
│   │   └── FoodTab.tsx        # Self-contained food tab: today summary, grouped meal sections, photo+note modal, FAB
│   │
│   ├── recipes/
│   │   ├── recipeData.ts      # Recipe type + 12 seed recipes (name, emoji, prep/cook time, tags, ingredients, steps)
│   │   ├── RecipeDetailModal.tsx # Full-screen modal: hero emoji, time chips, tag badges, ingredients list, numbered steps
│   │   └── RecipeFormModal.tsx   # Create-recipe modal: name, emoji picker, times, tags, dynamic ingredient + step rows
│   │
│   ├── plan/
│   │   ├── RecipePickerModal.tsx # Searchable full-screen modal to assign a recipe to a meal slot
│   │   ├── MealPlanGrid.tsx      # Mon–Sun × Breakfast/Lunch/Dinner table; tappable empty slots, removable filled slots
│   │   └── GroceryList.tsx       # Flat deduplicated ingredient list with native checkboxes (local state)
│   │
│   ├── components/
│   │   ├── WeightChart.tsx    # Recharts line chart for weight over time
│   │   ├── WaterRing.tsx      # Animated SVG progress ring for water daily goal
│   │   └── TrendCharts.tsx    # Three stacked Recharts charts: weight / water / sleep (30-day window)
│   │
│   ├── hooks/
│   │   ├── useWeightLog.ts       # SQLite-backed weight log: addEntry / deleteEntry / getAll; todayEntries / latestEntry
│   │   ├── useWaterLog.ts        # SQLite-backed water log + SQLite daily goal (settings table)
│   │   ├── useSleepLog.ts        # SQLite-backed sleep log: addEntry (1/day enforced) / deleteEntry / getAll / lastNightEntry / avgDurationMin
│   │   ├── useFoodLog.ts         # SQLite-backed food log: addEntry / deleteEntry / entriesForDate / todayEntries (grouped by MealType)
│   │   ├── useRecipes.ts         # SQLite-backed user recipes: addRecipe / deleteRecipe; allRecipes merges seed + user recipes
│   │   ├── useMealPlan.ts        # SQLite-backed meal plan: assignSlot / clearSlot / weekPlan / groceryList; week helpers
│   │   ├── useDailySummary.ts    # Per-day aggregate hook: weight + waterTotalMl + waterGoalMl + sleep for any date
│   │   ├── useProgressPhotos.ts  # SQLite-backed progress photos: addPhoto / deletePhoto / allPhotos (date desc)
│   │   ├── useTrends.ts          # Last-30-day aggregation of weight/water/sleep; 7-day stats for Progress Hub
│   │   └── useProfile.ts         # SQLite-backed profile + preferences (settings KV table); metric utils: computeBMI/BMR/TDEE
│   │
│   ├── db/
│   │   ├── database.ts        # SQLite init (Capacitor native + jeep-sqlite WASM browser)
│   │   └── migrations.ts      # Versioned SQL migrations (v1–v6: weight, water, sleep, food, recipes, meal_plan)
│       ├── variables.css      # MD3 tonal palette tokens + Ionic mapping, light + dark mode
│       └── md3.css            # MD3 component overrides: shape, type, elevation, motion
│
├── public/
│   └── assets/
│       └── sql-wasm.wasm      # sql.js 1.11.0 WASM binary (served for jeep-sqlite browser)
├── cypress/                   # End-to-end test specs (Cypress 13)
│
├── index.html                 # Vite HTML entry — loads src/main.tsx
├── vite.config.ts             # Vite + Ionic plugin configuration
├── tsconfig.json              # TypeScript project config (moduleResolution: Bundler)
├── tsconfig.node.json         # TypeScript config for Vite config file
├── eslint.config.js           # ESLint 9 flat config
├── cypress.config.ts          # Cypress base URL and spec config
├── ionic.config.json          # Ionic CLI project config (type: react-vite)
├── ionic.starter.json         # Starter metadata (safe to ignore after init)
├── .browserslistrc            # Target browser list for legacy builds
├── .gitignore                 # Git ignore rules (node_modules, dist, etc.)
│
├── ROADMAP.md                 # Feature roadmap 0.1.0 → 1.0.0
├── README.md                  # Full project documentation
└── AGENTS.md                  # This file — workflow protocol for agents
```

---

## Three-Phase Workflow

Every piece of work — feature, fix, or refactor — follows this cycle.
An agent must never skip a phase or combine phases without explicit confirmation.

---

### Phase 1 — Plan (Status + Proposal)

**Goal:** Agree on exactly what will be built before touching any code.

**Steps:**

1. **Summarise status** — State clearly what currently exists and what is missing.
   Keep it short. No jargon. One sentence per point.

2. **Propose the next step** — Describe the single next logical increment:
   - What files will be created or changed
   - What the user will see/experience after the change
   - Any decisions the user needs to make (e.g. naming, layout choice)

3. **Wait for confirmation** — Do not proceed to Phase 2 until the user explicitly
   confirms the plan (e.g. "yes", "go ahead", "looks good", or equivalent).

4. **Iterate** — If the user suggests changes, revise the proposal and repeat
   steps 1–3 until the plan is agreed.

**Format for Phase 1 responses:**

```
## Status
- [what exists]
- [what is missing / what this step addresses]

## Proposed Next Step
[concise description of the change]

**Files affected:** list them
**User will see:** what changes visually or functionally

Ready to proceed?
```

---

### Phase 2 — Implement

**Goal:** Execute exactly what was agreed in Phase 1. Nothing more.

**Rules:**
- Implement only what was confirmed. No scope creep.
- Make small, focused commits — one logical change per commit.
- If a blocker is discovered mid-implementation, pause and return to Phase 1
  with the new information. Do not improvise silently.
- After implementation, briefly describe what was done (files created/changed,
  key decisions made) and hand off to Phase 3.

---

### Phase 3 — Verify

**Goal:** Confirm the implementation works correctly before marking it done.

**Steps:**

1. **Run relevant tests** — unit tests (`npm run test.unit`) and/or E2E tests
   (`npm run test.e2e`) depending on the scope of the change.

2. **Manual check** — if the change is visual or interactive, run the dev server
   (`npm run dev`) and verify the expected behaviour in the browser.

3. **Update Files**:
   - ROADMAP.md — if the feature is complete and matches the description in the roadmap, check off the item.
   - CHANGELOG.md — add a brief entry describing the change, following the format:
     ```
     ## [Version] — [Feature Name]
     *Goal: one-sentence description of the feature.*

     - [ ] Key point or sub-feature 1
     - [ ] Key point or sub-feature 2
     ```
   - `src/pages/ProfilePage.tsx` — update the hardcoded version string in the **App Info** card (`<IonNote slot="end">`) to match the new version added to CHANGELOG.md.
   - Make git commit with a clear message following the conventional commits format (e.g. `feat: add weight entry form`).

4. **Report outcome** — state clearly:
   - Tests passed / failed (with details if failed)
   - Any visual discrepancies noticed
   - Whether the implementation matches the Phase 1 agreement

5. **Iterate or close:**
   - If verification passes → mark the step complete, commit, then return to
     Phase 1 for the next increment.
   - If verification fails → return to Phase 2 with a clear description of
     what needs fixing. Do not start a new feature until the current one passes.

---

## Commit Convention

Use conventional commits for all git messages:

```
feat:     a new feature
fix:      a bug fix
refactor: code change with no functional effect
style:    formatting, CSS only
test:     adding or updating tests
chore:    tooling, config, deps
docs:     documentation only
```

Examples:
```
feat: add water intake one-tap logging component
fix: correct daily goal ring calculation
docs: update AGENTS.md with file map
```

---

## Key Constraints

- **No scope creep** — implement only what Phase 1 confirmed.
- **No silent decisions** — if something is ambiguous, ask in Phase 1.
- **No skipping tests** — Phase 3 is not optional.
- **One increment at a time** — finish and verify before starting the next.

---

## Android Release Build Procedure

This section documents the exact procedure used to produce the signed release APK for Patty 1.0.0 on Windows.
Reproduce these steps for every subsequent release.

---

### Prerequisites

| Tool | Version | Installed path |
|---|---|---|
| Node.js | 20+ | in PATH |
| Eclipse Temurin JDK | **21** (21.0.10+7) | `C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot` |
| Android SDK | API 36, Build-Tools 35 | `%LOCALAPPDATA%\Android\Sdk` |
| Android Studio (optional) | Ladybug or newer | Only needed for emulator / device debug |

> **Critical:** Android Studio ships with a bundled JBR (Java 17). That JBR is **not** sufficient —
> Capacitor Android requires Java 21 at compile time. Always set `JAVA_HOME` to the Temurin 21 path
> before running Gradle. If you skip this, Gradle will fail with:
> `error: invalid source release: 21`

Install Temurin 21 (one-time, already done):
```powershell
winget install --id EclipseAdoptium.Temurin.21.JDK
```

Set JAVA_HOME permanently for the current Windows user (one-time, already done):
```powershell
[System.Environment]::SetEnvironmentVariable(
  "JAVA_HOME",
  "C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot",
  "User"
)
```

---

### One-Time Keystore Setup

The release keystore lives at `android/app/patty-release.jks` and is **gitignored**.
If you are on a new machine, regenerate it (or copy it from secure storage).

Generate the keystore (run once; keep the file safe):
```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" `
  -genkeypair `
  -v `
  -keystore android\app\patty-release.jks `
  -alias patty `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

Create `android/app/keystore.properties` (also gitignored) with exactly this content:
```properties
storeFile=patty-release.jks
storePassword=PattyRelease1
keyAlias=patty
keyPassword=PattyRelease1
```

`android/app/build.gradle` reads this file automatically via:
```groovy
def keystorePropertiesFile = rootProject.file("app/keystore.properties")
```
No further changes to `build.gradle` are needed for signing.

---

### Release Build — Step by Step

Run all commands from the project root (`c:\Users\USER\Desktop\Projects\Patty`).

**Step 1 — Build the web bundle**
```powershell
npm run build
```
Expected output: `dist/` populated, `✓ built in X.XXs`, ~984 modules.

**Step 2 — Sync web assets to Android**
```powershell
npx cap sync android
```
Expected output: `✔ Copying web assets` + plugin sync lines, no errors.

**Step 3 — Set environment variables for Gradle**
```powershell
$env:JAVA_HOME  = "C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```
(If JAVA_HOME is already set permanently for your user, this is optional but harmless.)

**Step 4 — Assemble the signed release APK**
```powershell
cd android
.\gradlew.bat assembleRelease
cd ..
```
First run downloads Gradle 8.14.3 (~170 MB) — this is normal and takes several minutes.
Subsequent runs take ~1–2 minutes.

Expected final lines:
```
BUILD SUCCESSFUL in Xm Xs
248 actionable tasks: Y executed, Z up-to-date
```

**Step 5 — Locate the output APK**
```
android\app\build\outputs\apk\release\app-release.apk
```
Size for 1.0.0: **25.6 MB** (25,606,016 bytes).

---

### Icon & Splash Asset Generation (one-time per asset change)

Source images must be placed before running the generator:
```
resources/icon.png    — 1024×1024 px, no transparency
resources/splash.png  — 1024×1024 px (or larger)
```
The source file used for Patty 1.0.0: `C:\Users\USER\Downloads\Patty Logo\1.png`
(copied to both `resources/icon.png` and `resources/splash.png`).

Generate all Android densities (mipmap-* + adaptive icons + splash variants):
```powershell
npx @capacitor/assets generate --android
```
This writes directly into `android/app/src/main/res/`.

---

### Version Bumping Checklist

Before each release, update these three places to keep versions in sync:

| File | Field | Example |
|---|---|---|
| `package.json` | `"version"` | `"1.0.1"` |
| `android/app/build.gradle` | `versionName` | `"1.0.1"` |
| `android/app/build.gradle` | `versionCode` | `2` (increment by 1 each release) |

---

### Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `error: invalid source release: 21` | JAVA_HOME points to Android Studio JBR (Java 17) | Set JAVA_HOME to Temurin 21 path (see Prerequisites) |
| `keytool not found` | Android Studio JBR not in PATH | Use full path: `C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe` |
| `Keystore file not found` | `keystore.properties` missing or wrong path | Verify `android/app/keystore.properties` exists and `storeFile` is relative to `android/app/` |
| `ANDROID_HOME not set` | SDK not found by Gradle | Set `$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"` |
| Gradle downloads take very long | First run fetches Gradle distribution | Normal — subsequent runs use `~/.gradle/wrapper/dists` cache |
