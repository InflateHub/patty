# Changelog

---

## [0.9.3] — Profile + Settings Page
*Goal: collect personal data to unlock derived health metrics and personalise the app.*

- [x] DB migration v8: `settings` key-value table (stores profile + preference keys)
- [x] `src/hooks/useProfile.ts` — `useProfile` hook; pure metric utils: `computeBMI`, `computeBMR`, `computeTDEE`, `bmiCategory`, `ageFromDob`; type exports: `UserProfile`, `UserPrefs`, `Sex`, `ActivityLevel`, `Goal`, `WeightUnit`
- [x] `src/pages/ProfilePage.tsx` — two-section page (About Me + Preferences) with inline save; Derived Metrics card (BMI with colour pill, BMR, TDEE); App Info footer; accessible from Home toolbar
- [x] `src/pages/Home.tsx` — `personCircleOutline` toolbar button navigates to ProfilePage; greeting personalised with first name; BMI value + category label shown beneath weight stat in stats row
- [x] `src/App.tsx` — `/tabs/profile` route added
- [x] `vite-env.d.ts` — `personCircleOutline` declared
- [x] TypeScript clean

---

## [0.9.1] — Dashboard Home
*Goal: Home tab shows a live at-a-glance summary of today's data.*

- [x] `src/pages/Home.tsx` — rewritten as a full live dashboard (replaces stub)
- [x] Greeting header with time-of-day salutation and today's date
- [x] Stats row card: latest weight, water % of goal, last night's sleep duration
- [x] Water Today card: reuses `WaterRing` (size 160)
- [x] Weight Trend card: reuses `WeightChart` with the most recent 7 entries
- [x] Today's Meals card: per-meal-slot entry count (Breakfast / Lunch / Dinner / Snacks)
- [x] Home tab added to `App.tsx` tab bar (first position, `homeOutline` icon)
- [x] Default route redirected from `/tabs/track` to `/tabs/home`
- [x] `vite-env.d.ts` — `homeOutline`, `scaleOutline`, `bedOutline` declared
- [x] TypeScript clean

---

## [0.9.2] — Quick-Action Shortcuts *(SKIPPED)*
*Descoped. Dashboard already surfaces all key data; a duplicate action grid would add UI noise without meaningful value. Removed from scope to keep the 1.0.0 increment lean.*

---

## [0.8.0] — Exercise Planner & Logger *(DEPRECATED)*
*Shipped in commit `8910d83` but subsequently deprecated. Exercise tracking introduced significant complexity (two new DB tables, five new source files, a new Track segment) without sufficient user value at this stage of the product. The feature is inactive — files are committed but not wired into current navigation.*

- [x] DB migration v7: `exercise_plan` (time-block schedule) + `exercise_log` (completed sessions) tables
- [x] `src/hooks/useExerciseLog.ts` — `addPlan` / `removePlan` / `addSession` / `removeSession`; `useExerciseWeekPlans` for weekly counts
- [x] `src/track/ExerciseTab.tsx` — day navigator, planned blocks, logged sessions, FAB
- [x] `src/track/ExerciseLogModal.tsx` — log a session against a planned block
- [x] `src/plan/ExercisePlanWeek.tsx` + `ExercisePlanModal.tsx` — week grid and block creation modal
- **All above deprecated. Will not be carried forward into 1.0.0.**

---

## [0.9.0] — Progress Hub
*Goal: visual history of body changes and trends.*

- [x] DB migration v7: `progress_photos` table (`id`, `date`, `photo_uri`, `created_at`)
- [x] `src/hooks/useProgressPhotos.ts` — `addPhoto` / `deletePhoto` / `allPhotos` (sorted date desc)
- [x] `src/hooks/useTrends.ts` — last-N-days aggregation of weight, water, sleep; 7-day stats (current weight, avg sleep, avg water)
- [x] `src/components/TrendCharts.tsx` — three stacked Recharts line charts (weight, daily water in L, sleep in hours)
- [x] `src/pages/Progress.tsx` — rewritten: stats summary card, date-stamped photo gallery, FAB to add photo, side-by-side comparison modal, trend charts
- [x] `vite-env.d.ts` — `imageOutline`, `swapHorizontalOutline` declared
- [x] TypeScript clean

---

## [0.7.0] — Cooking Planner
*Goal: plan meals for the week and get a grocery list.*

- [x] DB migration v6: `meal_plan` table (`id`, `date`, `slot`, `recipe_id`, `recipe_name`, `recipe_emoji`, `ingredients`, `created_at`) with `UNIQUE(date, slot)`
- [x] `src/hooks/useMealPlan.ts` — `assignSlot` / `clearSlot` / `groceryList`; week helpers: `getMondayOf`, `weekStart`, `weekDates`, `formatWeekRange`
- [x] `src/plan/RecipePickerModal.tsx` — searchable full-screen modal listing all recipes (seed + user); tap to assign
- [x] `src/plan/MealPlanGrid.tsx` — Mon–Sun × Breakfast/Lunch/Dinner table; filled cells show emoji + name + remove button; empty cells are tappable dashed buttons
- [x] `src/plan/GroceryList.tsx` — flat deduplicated ingredient list from the viewed week; native checkboxes with strikethrough (local state)
- [x] `src/pages/Plan.tsx` — rewritten: `< week >` navigation bar, «Today's Meals» card (current week only), week plan grid card, grocery list card
- [x] `vite-env.d.ts` — `chevronBackOutline`, `chevronForwardOutline` declared
- [x] TypeScript clean

---

## [0.6.1] — User-Created Recipes
*Goal: users can add, view, and delete their own custom recipes.*

- [x] DB migration v5: `recipes` table (`id`, `name`, `emoji`, `prep_min`, `cook_min`, `tags`, `ingredients`, `steps`, `created_at`)
- [x] `src/hooks/useRecipes.ts` — `addRecipe` / `deleteRecipe` / `getAllRecipes`; returns user recipes merged with seed `RECIPES` (seed-first order)
- [x] `src/recipes/RecipeFormModal.tsx` — full form modal: name input, 30-emoji picker, prep/cook time, tags (comma-separated), dynamic ingredient rows, dynamic step rows with numbered circles
- [x] `src/recipes/RecipeDetailModal.tsx` — optional `onDelete` prop; trash icon button appears in header for custom recipes only
- [x] `src/pages/Recipes.tsx` — `IonFab` opens form modal; custom recipes show a "custom" badge; delete routed through detail modal
- [x] `vite-env.d.ts` — `addOutline`, `removeCircleOutline` declared
- [x] TypeScript clean

---

## [0.6.0] — Recipe Library
*Goal: users can browse and view saved recipes.*

- [x] `src/recipes/recipeData.ts` — `Recipe` type + 12 seed recipes (name, emoji, prep/cook time, tags, ingredients, steps)
- [x] `src/recipes/RecipeDetailModal.tsx` — full-screen modal: hero emoji, prep/cook time chips, tag badges, ingredients list, numbered step-by-step instructions
- [x] `src/pages/Recipes.tsx` — rewritten: `IonSearchbar` filters by name or tag in real time; responsive card grid (emoji + name + total time)
- [x] Empty state when search returns no results
- [x] `vite-env.d.ts` — `closeOutline` declared
- [x] TypeScript clean

---

## [0.5.0] — Food Log
*Goal: photo-first meal capture across four categories.*

- [x] DB migration v4: `food_entries` table (`id`, `date`, `meal`, `photo_uri`, `note`, `created_at`)
- [x] `src/hooks/useFoodLog.ts` — `addEntry` / `deleteEntry` / `entriesForDate` / `todayEntries` (grouped by meal)
- [x] `src/track/FoodTab.tsx` — self-contained tab: today summary card, four grouped category sections, swipe-to-delete, FAB
- [x] Entry modal: meal type chip picker, photo upload (file input → data URI), optional note textarea
- [x] `src/pages/Track.tsx` — fourth segment "Food" added; segment max-width widened to 520 px
- [x] `vite-env.d.ts` — `cameraOutline`, `fastFoodOutline` declared
- [x] TypeScript clean

---

## [0.4.1] — Daily Alignment + Analytics Foundation
*Goal: align all three trackers to a daily model and lay the data foundation for the Home dashboard.*

- [x] `useWeightLog` — adds `todayEntries` (today-filtered list) and `latestEntry` to return value
- [x] `useSleepLog` — adds `lastNightEntry`; `addEntry` enforces one entry per bedtime date (throws `DUPLICATE_DATE`)
- [x] `src/hooks/useDailySummary.ts` — new hook: given a date, queries all three tables and returns `{ weight, waterTotalMl, waterGoalMl, sleep }`
- [x] `WeightTab` — replaces combined chart card with a prominent "Today" stat card (big number or "No entry today") + separate chart card below
- [x] `SleepTab` — stat card now shows "Last Night": duration, quality stars, bed→wake time range; FAB disabled when today/yesterday already logged; `DUPLICATE_DATE` error presented as a user-friendly alert
- [x] TypeScript clean

---

## [0.4.0] — Sleep Tracking
*Goal: users can log sleep and see their patterns.*

- [x] DB migration v3: `sleep_entries` table (`id`, `date`, `bedtime`, `waketime`, `duration_min`, `quality`, `note`)
- [x] `src/hooks/useSleepLog.ts` — `addEntry` / `deleteEntry` / `getAll`; `avgDurationMin` derived stat
- [x] `src/track/SleepTab.tsx` — self-contained tab: summary stat card, history list, FAB, entry modal
- [x] Entry modal: bedtime + wake-up time pickers, live duration display, 1–5 star quality picker, optional note
- [x] Wake-up midnight crossing handled automatically (wake date = next day if wake time ≤ bed time)
- [x] `src/pages/Track.tsx` — third segment "Sleep" added; segment max-width widened to 400 px
- [x] `trackUtils.ts` — `formatDuration(minutes)` utility added
- [x] `vite-env.d.ts` — `moonOutline`, `timeOutline` declared
- [x] TypeScript clean

---

## [0.3.1] — Track Refactor
*Goal: decompose the 656-line Track monolith into self-contained tab components for faster feature iteration.*

- [x] `src/track/trackUtils.ts` — shared utility functions (`today`, `formatDate`, `isToday`, `formatTime`) and all inline style tokens (`S`, `QUICK_AMOUNTS`)
- [x] `src/track/WeightTab.tsx` — fully self-contained: weight state, hooks, modals, FAB, JSX
- [x] `src/track/WaterTab.tsx` — fully self-contained: water state, hooks, modals, FAB, JSX
- [x] `src/pages/Track.tsx` rewritten as 51-line shell: header + segment switcher + renders active tab
- [x] Zero behaviour change — identical UI and functionality
- [x] TypeScript clean

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
