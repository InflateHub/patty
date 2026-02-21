# Changelog

---

## [0.3.0] — Water Intake
*Goal: one-tap water logging with an animated daily goal ring.*

- [x] `water_entries` SQLite table added via migration v2
- [x] `useWaterLog` hook — `addEntry`, `deleteEntry`, today's entries, running total, configurable daily goal (localStorage)
- [x] `WaterRing` component — SVG animated progress ring, transitions colour to `--md-tertiary` when goal is reached
- [x] Track tab gains Weight / Water segment switcher in the header toolbar
- [x] Water view: ring card + quick-add chips (+150 ml, +250 ml, +500 ml, Custom) + goal row
- [x] Custom amount and daily goal bottom-sheet modals
- [x] Today's log list with swipe-to-delete and per-entry timestamps
- [x] FAB on water tab opens custom-amount modal; chips handle one-tap adds
- [x] TypeScript clean

---

## [0.2.1] — Material Expressive 3 Design System
*Goal: replace ad-hoc styles with a coherent MD3 tonal design language.*

- [x] Full MD3 tonal palette derived from Patty seed `#5C7A6E` — light + dark mode
- [x] `src/theme/variables.css` rewritten with MD3 tokens (`--md-primary`, `--md-surface`, `--md-shape-*`, `--md-title-lg`, etc.)
- [x] `src/theme/md3.css` created — component-level overrides: toolbar, tab bar active indicator, cards (28px radius), FAB (tonal container), modal sheet, inputs, segments, lists
- [x] Roboto font loaded via Google Fonts CDN
- [x] Track.tsx restyled: chart wrapped in `IonCard`, history under `IonListHeader`, MD3 empty state with emoji illustration
- [x] `AGENTS.md` updated with mandatory design system rules

---

## [0.2.0] — Weight Tracking
*Goal: users can log and review their weight, persisted to SQLite.*

- [x] SQLite database layer (`src/db/database.ts`, `src/db/migrations.ts`) — versioned migrations, shared by all future features
- [x] `@capacitor-community/sqlite` + `jeep-sqlite` (browser WASM fallback) + `sql.js` installed
- [x] `useWeightLog` hook — `addEntry`, `deleteEntry`, `getAll` backed by SQLite
- [x] `WeightChart` component — Recharts `LineChart` in Patty slate-green, responsive
- [x] Track tab fully replaced: chart + reverse-chronological list + swipe-to-delete
- [x] FAB → sheet modal entry form (value, kg/lbs toggle, date picker, optional note)
- [x] `main.tsx` bootstraps DB before mounting React
- [x] TypeScript clean; unit tests passing

---

## [0.1.0] — App Shell
*Goal: navigable app in the browser with Patty's theme applied.*

- [x] Four-tab layout (Track, Recipes, Plan, Progress) via `IonTabs`
- [x] Placeholder page per tab with title and "coming soon" message
- [x] Patty slate-green palette (`#5C7A6E`) applied via `variables.css`
- [x] Light mode (warm off-white) and dark mode (OS-preference) supported
- [x] `Home.tsx` kept as Dashboard stub for 1.0.0
- [x] `ExploreContainer` removed; shared `Stub.css` added
- [x] `tsconfig.json` updated to `moduleResolution: Bundler` (correct for Vite)
- [x] Ambient `ionicons/icons` declaration added to `vite-env.d.ts`
- [x] Unit tests passing; TypeScript clean
