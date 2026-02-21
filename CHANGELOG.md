# Changelog

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
