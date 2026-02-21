# Changelog

---

## [0.9.9] — Capacitor Native Build Prep
*Goal: app is ready to compile as a native Android binary.*

- [x] `capacitor.config.ts` created: `appId: com.patty.app`, `appName: Patty`, `webDir: dist`; `SplashScreen` plugin config (2 s launch, `#5C7A6E` background, immersive)
- [x] `@capacitor/android`, `@capacitor/ios`, `@capacitor/splash-screen` installed
- [x] `@capacitor/assets` installed (dev); `resources/icon.png` + `resources/splash.png` populated from 1024×1024 source image
- [x] `npx @capacitor/assets generate --android` — all mipmap densities (ldpi → xxxhdpi) + adaptive-icon XMLs + splash all densities generated
- [x] `android/app/src/main/AndroidManifest.xml` — added `CAMERA`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `VIBRATE`; `READ_EXTERNAL_STORAGE` gated to `maxSdkVersion="32"`, `WRITE_EXTERNAL_STORAGE` gated to `maxSdkVersion="28"`
- [x] `npx cap add android` — Android project scaffolded; 3 Capacitor plugins detected
- [x] `npx cap sync android` — clean sync, no warnings
- [ ] iOS deferred — requires macOS/Xcode; will run `npx cap sync ios` on build machine

---

## [0.9.8-pass-b] — UI Polish: Spacing, Transitions & Infinite Scroll
*Goal: 8 dp grid compliance, MD3 page entry animation, paginated weight history.*

- [x] `src/theme/md3.css` — `ion-router-outlet > .ion-page` fade-in entry animation (`md-fade-in`, `--md-duration-sm`, `--md-easing-decelerate`)
- [x] `src/theme/md3.css` — `ion-card` margin corrected from 12px to 8px (8 dp grid)
- [x] `src/theme/md3.css` — `.md-section-header` padding-top corrected from 20px to 16px
- [x] `src/track/WeightTab.tsx` — stat card padding `20px 0 12px` → `24px 0 16px`; `marginTop 6` → `8`; `IonInfiniteScroll` added to history list (page size 30)
- [x] `src/track/SleepTab.tsx` — stat card padding and `marginTop 6` → `8` (quality stars row)
- [x] `src/track/FoodTab.tsx` — today summary card padding `20px 24px` → `16px 24px`
- [x] ROADMAP.md: all six 0.9.8 items checked off

---

## [0.9.8-pass-a] — UI Polish: Skeletons, Empty States & Error Toasts
*Goal: eliminate blank flash on load, improve empty-state copy, and surface DB errors as dismissible toasts.*

- [x] `src/track/WeightTab.tsx` — skeleton stat card + history rows while `loading`; `IonToast` on save/delete failure
- [x] `src/track/WaterTab.tsx` — skeleton history rows while `waterLoading`; `IonToast` on add/delete failure; quick-add error no longer silently swallowed
- [x] `src/track/SleepTab.tsx` — skeleton stat card while `loading`; two-line empty state; `IonToast` on delete failure
- [x] `src/track/FoodTab.tsx` — skeleton summary + grouped meal sections while `loading`; `IonToast` on save/delete failure
- [x] `src/pages/Progress.tsx` — skeleton photo strip (3 placeholder tiles) while `photosLoading`; `IonToast` on photo save failure

---

## [0.9.7] — Data Persistence Audit
*Goal: all features store data consistently and reliably.*

- [x] Hook audit — all data hooks (weight, water, sleep, food, recipes, meal plan, progress photos, notifications) confirmed fully SQLite-backed; zero in-memory-only persistence
- [x] `src/hooks/useWaterLog.ts` — daily goal migrated from `localStorage` (`patty_water_goal_ml`) to `settings` table (`pref_water_goal_ml`); `setDailyGoal` now async; `loadGoal` reads from SQLite on mount
- [x] `src/hooks/useDailySummary.ts` — `waterGoalMl` now read from `settings` table instead of `localStorage`; no new migration needed (`settings` table exists from v8)
- [x] Weight unit preference (`pref_weight_unit`) and notification prefs already in `settings` table from 0.9.3 / 0.9.6 respectively — confirmed
- [x] `localStorage` fully eliminated from all source files

---


*Goal: opt-in reminders for every tracked habit — 10 independent channels across health, meals, and planning.*

- [x] `@capacitor/local-notifications` installed; Android channel `patty-reminders` created on init
- [x] `src/hooks/useNotifications.ts` — 10 `NotifChannel` definitions (5 health, 3 meals, 2 weekly planning); per-channel `enabled` + `time` persisted to SQLite `settings` table; `toggleChannel` / `setChannelTime` / `enableAll` / `disableAll` / `requestPermission`; `scheduleOne` / `cancelOne` helpers
- [x] `src/pages/NotificationsPage.tsx` — full-screen page; permission banner; master toggle with active count; three `IonCard` sections (Health Tracking, Meal Logging, Planning); per-channel `IonToggle` + collapsible `<input type="time">` when enabled
- [x] `src/pages/ProfilePage.tsx` — "Notifications" nav row with `notificationsOutline` icon pushes `/tabs/notifications`
- [x] `src/App.tsx` — `/tabs/notifications` route added
- [x] `src/vite-env.d.ts` — `notificationsOutline`, `alarmOutline` declared

---

## [0.9.5] — Recipe → Food Log Link
*Goal: users can log a recipe directly as a meal entry.*

- [x] `src/recipes/RecipeDetailModal.tsx` — `onLogMeal?: (meal, kcal?) => Promise<void>` prop; `IonFooter` with "Log as meal" button; inline meal-slot chip picker (Breakfast/Lunch/Dinner/Snack); `IonToast` on success; `nutritionOutline` icon; resets on modal dismiss
- [x] `src/pages/Recipes.tsx` — imports `useFoodLog` + `today`; `handleLogMeal` calls `addEntry(today(), meal, undefined, '\u{emoji} {name}', kcal)`; `onLogMeal` wired to `RecipeDetailModal`
- [x] `src/vite-env.d.ts` — `nutritionOutline` declared

---

## [0.9.4] — Calorie Estimation + Nutrition on Recipes
*Goal: basic nutritional awareness in food log and recipe detail.*

- [x] DB migration v9: `ALTER TABLE food_entries ADD COLUMN kcal INTEGER`; `ALTER TABLE recipes ADD COLUMN kcal_per_serving INTEGER`
- [x] `src/recipes/recipeData.ts` — `kcalPerServing?: number` added to `Recipe` interface
- [x] `src/hooks/useRecipes.ts` — `rowToUserRecipe` maps `kcal_per_serving`; `addRecipe` persists `kcalPerServing`
- [x] `src/hooks/useFoodLog.ts` — `FoodEntry.kcal: number | null`; `addEntry` accepts optional `kcal` param
- [x] `src/track/FoodTab.tsx` — optional kcal number input in Log Meal modal; total kcal shown in today's summary card when at least one entry has kcal
- [x] `src/recipes/RecipeFormModal.tsx` — optional kcal-per-serving input in Time & Nutrition section
- [x] `src/recipes/RecipeDetailModal.tsx` — kcal chip in hero when `kcalPerServing` is set (tertiary container colour)

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
