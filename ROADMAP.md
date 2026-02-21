# Patty — Roadmap

Releases progress from a working app shell to a fully featured lifestyle companion.
Each version ships something usable. **Minimal first, complete at 1.0.0.**

---

## 0.1.0 — App Shell ✓
*Goal: navigable app in the browser, nothing broken.*

- [x] Bottom tab bar with four tabs: Track, Recipes, Plan, Progress
- [x] Placeholder page per tab (title + empty state)
- [x] Ionic theme applied (colors, typography, spacing via `variables.css`)
- [x] React Router routes wired to each page
- [x] Home/Dashboard stub (will be fleshed out in 1.0.0)

---

## 0.2.0 — Weight Tracking ✓
*Goal: users can log and review their weight.*

- [x] Weight entry form (value + optional note + date)
- [x] Weight history list (reverse chronological)
- [x] Simple line graph of weight over time
- [x] Local data persistence (SQLite via `@capacitor-community/sqlite`)

---

## 0.3.0 — Water Intake ✓
*Goal: one-tap water logging with a visual daily goal.*

- [x] Quick-add buttons: +150 ml, +250 ml, +500 ml, custom amount
- [x] Daily goal ring (progress toward configurable daily target)
- [x] Log resets at midnight
- [x] Daily history list

---

## 0.4.0 — Sleep Tracking ✓
*Goal: users can log sleep and see their patterns.*

- [x] Sleep entry form (bedtime, wake time, quality slider 1–5)
- [x] Calculated sleep duration display
- [x] Sleep history list with quality indicator
- [x] Average sleep duration stat

---

## 0.4.1 — Daily Alignment + Analytics Foundation ✓
*Goal: align all three trackers to a daily model and lay the data foundation for the Home dashboard.*

- [x] Weight tab gains a "Today" stat card (most recent entry or "No entry today")
- [x] Sleep restricted to one entry per bedtime date; FAB disabled when already logged
- [x] Sleep tab stat card replaced with "Last Night" view (duration, quality stars, time range)
- [x] `useDailySummary` hook aggregates weight / water / sleep for any given date

---

## 0.5.0 — Food Log ✓
*Goal: photo-first meal capture across four categories.*

- [x] Meal categories: Breakfast, Lunch, Dinner, Snacks
- [x] Photo capture / upload per meal entry
- [x] Optional text note per entry
- [x] Daily food log view grouped by category

---

## 0.6.0 — Recipe Library ✓
*Goal: users can browse and view saved recipes.*

- [x] Recipe card list with name, prep time, and thumbnail
- [x] Recipe detail page: ingredients, step-by-step instructions, prep time
- [x] Seed library with 10–15 starter recipes
- [x] Search / filter by name

---

## 0.6.1 — User-Created Recipes ✓
*Goal: users can add, view, and delete their own custom recipes.*

- [x] Create recipe form: name, emoji picker, prep/cook time, tags, dynamic ingredients + steps
- [x] SQLite persistence for user recipes (migration v5)
- [x] Custom recipes appear in the grid alongside seed recipes (tagged "custom")
- [x] Custom recipes deletable from the detail modal; seed recipes are read-only

---

## 0.7.0 — Cooking Planner ✓
*Goal: plan meals for the week and get a grocery list.*

- [x] Weekly meal plan grid (7 days × 3 meal slots)
- [x] Assign recipes to slots by picking from the library
- [x] Auto-generated grocery list aggregated from the weekly plan
- [x] Prev / next week navigation with «This week» badge
- [x] Today's Meals card (shows today's three slots at a glance)

---

## 0.8.0 — Exercise Planner & Logger ~~DEPRECATED~~
*Shipped in commit 8910d83 but subsequently removed from scope. Exercise tracking added complexity without sufficient user value at this stage. All exercise_plan / exercise_log DB tables and associated files are considered inactive.*

- [x] DB migration v7: `exercise_plan` + `exercise_log` tables (committed)
- [x] `useExerciseLog.ts`, `ExerciseTab.tsx`, `ExerciseLogModal.tsx` (committed then deprecated)
- [x] `ExercisePlanWeek.tsx`, `ExercisePlanModal.tsx` (committed then deprecated)
- **Status: deprecated. Files not wired into active UI. Will not be carried forward.**

---

## 0.9.0 — Progress Hub ✓
*Goal: visual history of body changes and trends.*

- [x] Progress photo upload (date-stamped)
- [x] Side-by-side photo comparison (pick two dates)
- [x] Trend charts: weight, average sleep, daily water — all on one screen
- [x] Basic stats summary (current weight, 7-day avg sleep, weekly water avg)

---

## 0.9.1 — Dashboard Home ✓
*Goal: Home tab shows a live at-a-glance summary of today's data.*

- [x] Today's stats row: current weight, water progress, last night's sleep
- [x] Weight mini-chart (last 7 entries, reuses `WeightChart`)
- [x] Water ring widget (reuses `WaterRing`)
- [x] Today's meals preview: breakfast / lunch / dinner / snacks entry count
- [x] Greeting header with current date

---

## 0.9.2 — Quick-Action Shortcuts ~~SKIPPED~~
*Descoped. The dashboard already links directly to the Track tab; a duplicate action grid adds UI noise without meaningful value. Skipped to keep scope lean for 1.0.0.*

---

## 0.9.3 — Profile + Settings Page ✓
*Goal: collect personal data to unlock derived health metrics and personalise the app.*

- [x] DB migration v8: `settings` key-value SQLite table (profile + preferences)
- [x] `src/hooks/useProfile.ts`: `useProfile` hook (read/write profile + prefs); pure utils: `computeBMI`, `computeBMR`, `computeTDEE`, `bmiCategory`, `ageFromDob`
- [x] `src/pages/ProfilePage.tsx`: About Me (name, DOB, sex, height, activity, goal) + Preferences (weight unit, water goal) + Derived Metrics (BMI with category, BMR, TDEE) + App Info
- [x] `src/pages/Home.tsx`: person-icon button in toolbar → pushes ProfilePage; greeting personalised with first name; BMI + category shown under weight stat
- [x] `src/App.tsx`: route `/tabs/profile` wired to `ProfilePage`
- [x] `vite-env.d.ts`: `personCircleOutline` declared

---

## 0.9.4 — Calorie Estimation + Nutrition on Recipes ✓
*Goal: basic nutritional awareness in food log and recipe detail.*

- [x] Food log entry modal gains optional kcal field (stored in `food_entries` via migration v9)
- [x] Today's food summary card shows total kcal logged
- [x] Recipe detail page shows estimated kcal per serving (editable field on recipe form)
- [x] Recipe kcal stored in `recipes` table (migration v9 adds `kcal_per_serving` column)

---

## 0.9.5 — Recipe → Food Log Link ✓
*Goal: users can log a recipe directly as a meal entry.*

- [x] "Log as meal" button in `RecipeDetailModal` footer
- [x] Tapping it opens an inline meal-slot picker (Breakfast / Lunch / Dinner / Snack chips)
- [x] Meal slot selectable before confirming; entry saved to today's food log
- [x] Note pre-filled with `{emoji} {recipe name}`; kcal pre-filled from recipe if set
- [x] Toast confirmation shown on success

---

## 0.9.6 — Push Notification Reminders ✓
*Goal: opt-in reminders to keep daily habits consistent — 10 channels across health, meals, and planning.*

- [x] `@capacitor/local-notifications` installed and Android notification channel created (`patty-reminders`)
- [x] `src/hooks/useNotifications.ts` — 10 `NotifChannel` definitions; prefs persisted to SQLite `settings` table; `toggleChannel` / `setChannelTime` / `enableAll` / `disableAll`; `requestPermission`; `checkPermissions` on load
- [x] `src/pages/NotificationsPage.tsx` — dedicated full-screen page; permission banner; master enable-all toggle; three sections (Health Tracking, Meal Logging, Planning); per-channel toggle + time picker shown when enabled
- [x] `src/pages/ProfilePage.tsx` — "Notifications" nav row (with `notificationsOutline` icon + chevron) pushes `NotificationsPage`
- [x] `src/App.tsx` — `/tabs/notifications` route added
- [x] `vite-env.d.ts` — `notificationsOutline`, `alarmOutline` declared

**10 channels:**
| Channel | Default | Cadence |
|---|---|---|
| ⚖️ Weigh-in | 07:30 | Daily |
| 💧 Hydration check (morning) | 10:00 | Daily |
| 💧 Hydration check (afternoon) | 14:00 | Daily |
| 💧 Hydration check (evening) | 17:00 | Daily |
| 😴 Sleep log reminder | 22:00 | Daily |
| 🍳 Breakfast log | 08:30 | Daily |
| 🥗 Lunch log | 13:00 | Daily |
| 🍽️ Dinner log | 19:00 | Daily |
| 📸 Weekly progress photo | 09:00 | Sundays |
| 📅 Weekly meal plan | 18:00 | Sundays |

---

## 0.9.7 — Data Persistence Audit
*Goal: all features store data consistently and reliably.*

- [ ] Audit every hook — confirm all user data uses SQLite, not in-memory state
- [ ] Daily water goal migrated from `localStorage` to a `settings` table (migration v9)
- [ ] Weight unit preference migrated from `localStorage` to `settings` table
- [ ] Notification preferences stored in `settings` table
- [ ] Verify DB migrations run clean on fresh install and upgrade paths

---

## 0.9.8 — UI Polish Pass
*Goal: the app looks and feels finished.*

- [ ] Consistent loading skeletons on all data-fetching tabs (`IonSkeletonText`)
- [ ] Empty states reviewed and styled on every tab (emoji + two-line message, MD3 tokens)
- [ ] Error handling: failed DB operations surface a dismissible `IonToast`
- [ ] Spacing and alignment audit across all pages (8 dp grid compliance)
- [ ] Transitions: page entry animations use MD3 motion tokens
- [ ] Long lists use `IonVirtualScroll` or windowing where appropriate

---

## 0.9.9 — Capacitor Native Build Prep
*Goal: app is ready to compile as a native Android (and iOS) binary.*

- [ ] App icon designed and exported at all required densities (mipmap-*)
- [ ] Splash screen configured via `@capacitor/splash-screen`
- [ ] `AndroidManifest.xml` permissions audited (camera, notifications, storage)
- [ ] `capacitor.config.ts` finalised: appId `com.patty.app`, appName `Patty`, webDir `dist`
- [ ] `npx cap sync android` runs clean with no warnings
- [ ] App launches correctly on Android emulator (API 34 target)
- [ ] iOS scheme verified (`npx cap sync ios`; no build errors in Xcode)

---

## 1.0.0 — Release Build
*Goal: signed, shippable APK (and IPA) produced from a clean build.*

- [ ] Version bumped to `1.0.0` in `package.json` and `capacitor.config.ts`
- [ ] `npm run build` produces a clean `dist/` with no TypeScript or lint errors
- [ ] `npx cap sync android` applied to final dist
- [ ] Release APK built and signed (`./gradlew assembleRelease`)
- [ ] APK smoke-tested on a physical Android device
- [ ] Git tag `v1.0.0` created
- [ ] CHANGELOG.md finalised with full feature summary

---

## Post-1.0.0 (Backlog)

- Cloud sync / account system
- Barcode scanner for food logging
- AI meal suggestions based on logged data
- Apple Health / Google Fit integration
- Wearable data import (sleep, steps)
