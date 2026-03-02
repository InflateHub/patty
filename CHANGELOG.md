# Changelog

---

## [2.3.2] — Water & Weight Tab Redesign
*Goal: redesign Water and Weight tabs to match the Sleep tab's rich, card-based pattern with week visualisations.*

- [x] **Water — 7-day mini rings row** — `WeekRings` sub-component renders 7 small SVG progress rings (one per day); today ring is larger and uses `--md-primary`; past days use `--md-secondary`; goal-reached days show a checkmark; tapping any ring opens a day-detail bottom sheet
- [x] **Water — collapsible today's log** — "Today's Log" section is hidden by default behind a toggle chevron
- [x] **Water — day detail modal** — bottom sheet shows all entries for a tapped past day with per-entry values and a total
- [x] **Water — `useWaterLog` weekEntries** — new `weekEntries` state + `loadWeek` callback queries the last 7 days; called on mount and after every mutation
- [x] **Weight — photo marquee strip** — `PhotoMarquee` sub-component shows up to 7 most-recent entries as 72×72 px tiles (oldest → newest); today's tile has a `--md-primary` outline; placeholder scale emoji for entries without a photo; tapping a photo tile opens full-screen viewer
- [x] **Weight — hero stat card** — replaces old minimal card; shows latest weight + unit, trend delta badge (red if gained, primary if lost), date + note, and the photo marquee
- [x] **Weight — collapsible history** — "All History (n)" toggle card with chevron; rows include 40 px photo thumbnail (or placeholder) and swipe-to-delete
- [x] **Weight — full-screen photo viewer modal** — tapping any photo (marquee or history row) opens it in a full-screen `IonModal` with a "Done" button

---

## [2.3.1] — Sleep Tab Redesign
*Goal: replace the minimal single-log sleep tab with a rich, always-editable experience.*

- [x] **24 h SVG arc card** — circular clock face (midnight at top) showing the sleep window as a coloured arc with filled bedtime dot and hollow wake dot; duration + score label centred inside
- [x] **Sleep score** — composite label (Great / Good / Fair / Poor) derived from duration vs 8-hour goal and star quality rating; shown inside the arc and as bar colour in the 7-night chart
- [x] **Goal progress bar** — thin bar below the arc showing proportion of the 8-hour goal met; animated fill
- [x] **7-night bar chart** — `WeekBars` sub-component; Mon–Sun bars coloured by sleep score; today highlighted with an outline ring; empty days shown in muted surface-variant colour
- [x] **Edit mode** — FAB always enabled; tapping it opens the modal pre-filled with today's entry if one exists (edit) or blank (log new); `updateEntry` SQL UPDATE added to `useSleepLog`
- [x] **Collapsible history** — "All history" section hidden by default; toggle button reveals the full swipe-to-delete IonItemSliding list
- [x] **`useSleepLog` — `updateEntry`** — new callback performs SQL UPDATE on `sleep_entries` and reloads the list
- [x] **`Track.tsx` cleanup** — removed `sleepAlreadyLogged` state and `disabled` prop on FAB; removed `onAlreadyLoggedChange` prop from `SleepTab`

---

## [2.3.0] — Workout Tab
*Goal: add a fifth Track tab for logging exercise, with a full variety of workout types.*

- [x] **Migration v14** — `workout_entries` table: `id`, `date`, `workout_type`, `name`, `duration_sec`, `steps`, `intensity` (1–5), `calories_burnt`, `notes`, `created_at`
- [x] **`useWorkoutLog` hook** — `addEntry` / `deleteEntry` / `todayEntries` / `allEntries` / `entriesForDate`
- [x] **WorkoutTab.tsx** — today summary card (sessions, total minutes, total kcal, total steps); log grouped by type; swipe-to-delete with confirm; history modal (last 30 days)
- [x] **Add Workout modal** — 2-step: type grid (Cardio 🏃 / Strength 💪 / Yoga 🧘 / HIIT 🔥 / Steps 👣 / Custom ✏️) → entry form; Steps mode shows large step-count input; other modes show stopwatch (Start / Pause / Reset) + manual override, intensity chips (1–5 with emoji), auto-estimated calories
- [x] **Icon + stacked label tabs** — all five Track segment tabs show icon above a short label (10 px) using `layout="icon-top"`; all five always visible in one row; `aria-label` retains full text for accessibility

---

## [2.2.0] — Onboarding Redesign
*Goal: a leaner, more visually immersive onboarding that collects only what matters.*

- [x] **Remove weight logging step** — Height & Weight step replaced by Height & Sex; no weight entry created during onboarding; `weight_entries` starts empty
- [x] **Scrollable ruler height picker** — CSS snap-scroll horizontal ruler (100–250 cm); cm / ft+in unit toggle; large live display value above the ruler; fade masks and centre-needle indicator
- [x] **Illustrated sex cards** — three full-height cards (Male 👨 / Female 👩 / Prefer not to say 🙂) with emoji icon, label, and selected check mark; replace plain chips
- [x] **Custom water goal drum picker** — vertical snap-scroll drum roller (500–4000 ml in 100 ml steps); selected value shown large above in primary colour; ml / oz unit toggle; +100 ml / +250 ml / +500 ml quick-add chips
- [x] **Remove photo prompt** — no progress photo requested during onboarding; photo journey starts from Track → Weight on first weigh-in
- [x] **Step 2 renamed** — title changed from "Your body metrics" to "Height & Sex"

---

## [2.1.0] — UX Fixes & Polish
*Goal: resolve the most visible friction points and interaction gaps found in the 2.0.0 build.*

- [x] **Exit confirmation** — Android hardware back button on root tab views now shows an `IonAlert` ("Exit Patty?" / Cancel / Exit) via `useIonAlert` in `BackButtonHandler`
- [x] **Weight stat card clickable** — tapping the "Today" stat card on the Weight tab opens the Add Weight modal directly
- [x] **Sleep stat card clickable** — tapping the "Last Night" stat card on the Sleep tab opens the Add Sleep modal directly
- [x] **Meal section headers clickable** — each meal section heading (Breakfast / Lunch / Dinner / Snack / Brunch / Midnight Meal) opens the Add Food modal pre-filled with that meal type
- [x] **Brunch & Midnight Meal** — `MealType` extended with `'brunch'` and `'midnight_meal'`; both appear in the food log modal chip row, the food tab grouped list (`FoodTab.tsx`), and the recipe log-meal picker (`RecipeDetailModal.tsx`)
- [x] **Segment pill theme colour** — active segment indicator and label now use `--md-primary-container` / `--md-on-primary-container` tokens; follows the user's chosen seed colour automatically
- [x] **Recipe deletion confirmation** — deleting a recipe (seed or custom) shows an `IonAlert` with the recipe name and a destructive Delete button before the delete executes
- [x] **Curved button focus ring** — rectangular browser `outline` removed from `IonSegmentButton`, `IonChip`, and `IonButton`/`IonFabButton`; replaced with a 2 px `box-shadow` ring in `--md-primary` that respects `border-radius`

---

## [2.0.0] — Stable Release & Codebase Cleanup
*Goal: mark the app as stable 2.0.0, eliminate all lint errors/warnings, and bump all version strings.*

- [x] **ESLint clean** — 8 errors and 5 warnings resolved across `useAchievementCards`, `useFoodLog`, `useNotifications`, `Achievements`, `MealPlanGrid`, `FoodTab`
- [x] **Unused imports removed** — `IonChip`, `ellipseOutline` in `Achievements.tsx`; `S` import in `FoodTab.tsx`
- [x] **Dead code removed** — unused `mealLabel` function in `FoodTab.tsx`; unread `waterMonthRes` variable in `useAchievementCards.ts`
- [x] **Type fixes** — `let` → `const` for `storedPhotoUri` in `useFoodLog.ts`; `eslint-disable` comments moved to the correct lines in `useNotifications.ts`
- [x] **Hook deps corrected** — `dates` added to `useEffect` deps in `MealPlanGrid.tsx`; `gam` added to `openBadgeDetail` useCallback deps
- [x] **Version bumped to 2.0.0** — `package.json`, `android/app/build.gradle` (versionCode 3, versionName 2.0.0), `ProfilePage.tsx` App Info card, all page-level version comments

---

## [1.8.1] — Achievements Reorder, Badge Modal & Week Plan Fix
*Goal: rearrange the Achievements page for a better flow, give badges their own shareable modal, and remove the visible scrollbar in the Week Plan.*

- [x] **Section order**: Habit Rings → Weight Journey → Share Achievements → Gamification
- [x] **Habit Rings**: removed external "7-Day Habits" section title (card's own header retained)
- [x] **Weight Journey**: first (newest) photo card shows no delta; delta (± change) only appears from the second entry onward
- [x] **Share Achievements**: removed the label row (Daily / Weekly / Monthly / Yearly / Lifetime) below the card carousel
- [x] **Gamification**: removed "Gamification" card title; badges moved into a dedicated full-screen modal with a Share Badges button (captures badge grid as image)
- [x] **Fix – Week Plan scrollbar**: day-strip horizontal scrollbar hidden on all platforms via `.scroll-no-bar` CSS utility class (webkit + Firefox)

---

## [1.8.0] — Landing Page Deployed to GitHub Pages
*Goal: `https://inflatehub.github.io/patty` is live and auto-deployed on every push to `main`.*

- [x] **GitHub Actions workflow** (`pages.yml`): on push to `main` (when `docs/**` changes), deploys `docs/` to GitHub Pages via `actions/deploy-pages@v4`; also supports manual `workflow_dispatch`
- [x] **`CNAME`** — custom domain `patty.saranmahadev.in`; all OG/sitemap URLs updated to match
- [x] **`sitemap.xml`** added to `docs/` with canonical URL `https://patty.saranmahadev.in/`
- [x] **`robots.txt`** added — allows all crawlers, references sitemap
- [x] **Download button** links to `github.com/InflateHub/patty/releases/latest` — always points to the newest APK
- [x] **Open Graph + Twitter Card** meta tags for social sharing

---

## [1.7.0] — App Landing Page
*Goal: a polished marketing webpage for Patty exists as a static site in the repo.*

- [x] **`docs/`** folder created as GitHub Pages source
- [x] **`docs/index.html`** — single-page, self-contained HTML + CSS landing page:
  - Sticky **nav bar** with logo, anchor links, and Download CTA
  - **Hero section**: large title, "Desire. Commit. Achieve." tagline, CSS phone mockup with animated floating stat cards, feature badge chips
  - **Stats banner**: 5 app highlights (10+ habits, 12 recipes, 8 notification channels, 5 levels, 100% local)
  - **Features grid**: 9 feature cards — Health Tracking, Recipes & Meal Planning, Achievements & Gamification, Privacy & Security, Personalisation, Smart Reminders, Progress Photos, Health Metrics, Onboarding
  - **How it works**: 4-step sequence (Download → Track → Plan → Celebrate)
  - **Screenshots section**: 6 CSS phone screen mockups (Home, Weight, Water, Recipes, Achievements, Profile)
  - **Privacy callout**: 4 privacy pillars with shield visual
  - **Theming callout**: 8 palette swatches
  - **Download CTA** section
  - **Footer**: brand, app links, project links, legal, copyright
- [x] **MD3 Patty palette** implemented via CSS custom properties (`:root` tokens + `@media prefers-color-scheme: dark` overrides)
- [x] **Mobile-responsive** layout — flexbox + CSS grid, 375 px → 1440 px
- [x] **Dark mode** support via `prefers-color-scheme`
- [x] **Favicon** and **Open Graph** meta tags matching app brand
- [x] **Roboto font** loaded via Google Fonts (matches app typography)
- [x] **Scroll animations** via `IntersectionObserver` — feature, step and screenshot cards fade up on enter
- [x] **`docs/assets/icon.png`** and **`docs/assets/favicon.png`** copied from `public/assets/icon/`

---

## [1.6.0] — Personalisation Theming
*Goal: users pick their own accent colour and the entire MD3 palette re-seeds dynamically; light/dark/system mode toggle; font size control.*

- [x] **`useTheme.ts`** (new hook): `applyTheme(seed, mode, fontSize)` generates a full MD3 tonal palette via `@material/material-color-utilities` and writes all `--md-*` + Ionic tokens inline to `document.documentElement`
- [x] **`SEED_COLOURS`**: 8 curated swatches (Slate Green, Violet, Ocean Blue, Forest, Terracotta, Mauve, Amber, Rose) + freeform custom hex input with live colour preview dot
- [x] **System mode**: injects a `<style id="patty-theme">` with both `:root` light and `@media (prefers-color-scheme: dark)` dark variants — custom seed works correctly in either OS appearance
- [x] **Light / Dark mode**: writes inline styles on `<html>` that beat any `@media` rule — instant forced mode without OS change
- [x] **Font size**: Default (1 rem) / Large (1.0625 rem) / XL (1.125 rem) — scales `--md-body-lg`; all type tokens inherit
- [x] **ProfilePage → Appearance card**: replaces the old single Preferences card with a split Preferences + Appearance card; contains live preview banner, 8 swatches, custom hex input, Mode segment, Text size segment
- [x] **Live preview**: all picker interactions call `applyTheme` immediately without saving; Save button persists to DB
- [x] **`useProfile`** extended: `UserPrefs` gains `themeSeed`, `themeMode`, `fontSize`; `savePrefs` persists all three to `settings` KV
- [x] **App root**: `useTheme()` called in `AppContent` to restore saved theme on every cold start

---

## [1.5.0] — Privacy & Security
*Goal: protect personal health data with PIN / biometric app lock and give users full control over their stored data.*

**App Lock**
- [x] `@aparajita/capacitor-biometric-auth` installed; `useAppLock` hook manages lock state, PIN hash (SHA-256 via Web Crypto API), biometric availability, and Capacitor `App` resume listener
- [x] `LockScreen.tsx`: full-viewport fixed overlay — Patty logo, 4-dot PIN indicator, numeric pad, backspace, shake animation on wrong PIN; no tab content visible underneath
- [x] `PinSetupModal.tsx`: two-step create-and-confirm PIN flow (IonModal); reused for both initial enable and Change PIN
- [x] Lock triggers automatically on app foreground resume when lock is enabled
- [x] Biometric unlock (Face ID / Fingerprint): toggle in ProfilePage; auto-prompts on lock screen mount; only shown when device has biometrics enrolled
- [x] PIN stored as SHA-256 hex in `settings` KV table — never plaintext

**Data Clear (Danger Zone)**
- [x] ProfilePage → **Privacy & Security** card: App Lock toggle, Biometric Unlock toggle (conditional), Change PIN button
- [x] ProfilePage → **Danger Zone** card with three `IonAlert`-confirmed destructive actions:
  - **Clear Logs** — deletes all weight, water, sleep & food entries
  - **Clear Photos** — removes all progress photo files from device storage + nulls `photo_path`
  - **Factory Reset** — wipes all tables + settings, reloads app → Onboarding

---

## [1.4.1] — Bug Fixes + Lifetime Achievement Card
*Goal: fix broken emoji/unicode rendering across Notifications, WeightTab and ShareCards; add Lifetime shareable card; update Achievements tab icon.*

- [x] **Unicode fixes**: replaced literal `\uXXXX` escape sequences in JSX text nodes (NotificationsPage, ShareCard) with actual UTF-8 emoji/punctuation — fixes `\UD83D\UDCA7 HYDRATION` and `0 days \uD83D\uDD25` display bugs
- [x] **WeightTab mojibake**: fixed `â€"`, `Â·`, `â€¦` garbled characters (UTF-8 bytes mis-read as Latin-1) — em-dash, middle-dot and ellipsis now render correctly
- [x] **Lifetime Card**: 5th shareable card (`LifetimeShareCard`) added to the achievements page-snap scroll — shows all-time totals, best streak, days on journey, level, and total weight change since day one
- [x] **Tab icon**: Achievements tab now uses `trophyOutline` instead of `trendingUpOutline`

---

## [1.4.0] — Achievements Page Redesign
*Goal: transform the Progress tab into a social-ready achievements screen.*

- [x] Tab renamed Progress → Achievements
- [x] Weight Photo Marquee: mandatory photo on weigh-in (two-step modal in WeightTab), horizontal hero scroll (newest first), delta chips (green = lost, amber = gained), fullscreen tap to expand
- [x] Shareable Cards: four 400×600 gradient cards (Daily / Weekly / Monthly / Yearly); page-snap horizontal scroll; per-card share button captures image via `html-to-image`, writes to cache, shares via `@capacitor/share`; web fallback: `navigator.share` or download
- [x] Gamification Card: XP bar (earns XP for each habit logged), 5 levels (Seedling→Legend), current/best streak counters, 6 milestone dots, badge shelf (8 badges)
- [x] Habit Rings: 7-day × 4-habit dot grid (Weight / Water / Sleep / Food); today highlighted
- [x] Trend Charts removed
- [x] DB migration v12: `ALTER TABLE weight_entries ADD COLUMN photo_path TEXT`
- [x] `useWeightLog`: two-step photo save (FS) + `startingEntry` exposed; `useGamification` and `useAchievementCards` hooks created
- [x] `src/progress/ShareCard.tsx`: `DailyShareCard`, `WeeklyShareCard`, `MonthlyShareCard`, `YearlyShareCard` (all `React.forwardRef`)
- [x] `src/pages/Achievements.tsx` created; `Progress.tsx` retained but no longer routed
- [x] `html-to-image` + `@capacitor/share` installed

---

## [1.3.0] — Notification System Redesigned
*Goal: smarter, more actionable notification experience that spans the whole day without being annoying.*

- [x] **Weight** — default reminder time changed to 08:00 (was 07:30); label updated to "Weigh-in reminder"
- [x] **Water** — replaced 3 hardcoded slots (morning/afternoon/evening) with a frequency-based system: user picks 1–8 reminders/day + day-window start/end; slots auto-distributed evenly; each slot individually editable; "Reset to even spacing" chip clears overrides; IDs 120–127
- [x] **Sleep log** — changed from bedtime nag at 22:00 to morning prompt at 08:30: "Good morning! How did you sleep?" uses ☀️ emoji
- [x] **Weekly check-in** — new channel `weekly_checkin` (notifId 111, Mondays 09:00): "New week, fresh goals. Check your meal plan and start the week strong!"
- [x] **Engagement nudges** (new `engage` section, notifIds 112–114):
  - `morning_boost` (⚡ 08:30) — 30 min after weigh-in; cascades when weigh-in time changes
  - `midday_nudge` (🌟 13:30) — 30 min after lunch_log; cascades when lunch time changes
  - `evening_reflect` (🌙 19:30) — 30 min after dinner_log; cascades when dinner time changes
- [x] **`useNotifications.ts`** — full rewrite: `WaterFreqSettings` type; `distributeWaterSlots()` exported; `toggleWater / setWaterCount / setWaterWindow / setWaterSlotTime / resetWaterSpacing` actions; `getEngageTime()` helper; `waterFreqRef` + `statesRef` prevent stale closures; `patty-engage` Android channel added
- [x] **`NotificationsPage.tsx`** — full redesign: Water card with stepper (−/+), dual time-pickers for window, per-slot time inputs with "edited" badge and Reset chip; Engagement card shows derived time and linked-reminder label; Health/Meals/Planning cards retain toggle + time-picker pattern; master toggle count updated to include water group
- [x] `vite-env.d.ts` — `refreshOutline` declared
- [x] `src/pages/ProfilePage.tsx` — version bumped to 1.3.0

---

## [1.2.0] — Onboarding
*Goal: first-launch flow that collects profile data so the app is immediately personalised.*

- [x] **Startup gate** — `StartupGate` component in `App.tsx` reads `onboarding_complete` from SQLite on mount; routes to `/onboarding` (first launch) or `/tabs/home` (returning user); shows Patty logo spinner while resolving
- [x] **Welcome screen** — full-screen `--md-primary-container` hero; 🥗 logo + **"Patty"** wordmark + **"Desire. Commit. Achieve."** tagline; four feature cards fly in with staggered `ob-slide-up` animation (Track Everything / Plan Your Meals / See Your Progress / Stay Consistent); **Get Started →** pill button fades in last
- [x] **Step 1 — Tell us about you** — First Name (required) + Date of Birth (required) text/date inputs
- [x] **Step 2 — Your body metrics** — Height (cm), Starting Weight with kg/lb chip picker, Biological Sex chip group; all three required
- [x] **Step 3 — Main goal** — 5-option card picker (Lose Weight / Maintain / Build Muscle / Better Sleep / General Wellness); selection required
- [x] **Step 4 — Your lifestyle** — Activity level 4-option card picker + daily water goal 4-preset chip row; both required
- [x] **All mandatory** — Next button disabled until every field on the step is filled; no skip
- [x] **4-dot progress indicator** — active dot expands to pill (24px); completed dots tinted `--md-primary-container`
- [x] **Save on Step 4** — writes all 9 profile/pref keys + `onboarding_complete = '1'` to `settings` table; inserts starting weight into `weight_entries`
- [x] **Celebration screen** — CSS confetti (`ob-confetti` / `confetti-fall` keyframes, 22 pieces, 8 MD3-palette colours); 🎉 check circle pop-in; personalised headline; **Let's Go →** routes to `/tabs/home`
- [x] `src/pages/OnboardingPage.tsx` — new file (~784 lines)
- [x] `src/pages/OnboardingPage.css` — keyframes: `ob-fade-in`, `ob-slide-up`, `ob-pop-in`, `confetti-fall`; class hooks for all animated elements
- [x] `src/App.tsx` — `StartupGate` + `/onboarding` route + outer `IonRouterOutlet#main-outlet` wrapping `TabShell`

---

## [1.1.0] — UI Polish & Core Fixes
*Goal: resolve the most visible UX friction points in the shipped 1.0.5 build.*

- [x] **Fancy bottom bar** — `ion-tab-bar` height 60 → 80px; hard `border-top` replaced with MD3 tonal box-shadow elevation; active indicator `top` adjusted to 10px; `--color-selected` updated to `--md-on-primary-container` (matches indicator fill); label scale set to `--md-label-sm` weight 500
- [x] **Smooth splash transition** — `capacitor.config.ts`: `SplashScreen.fadeOutDuration: 300` so the native splash cross-fades out over 300 ms instead of cutting abruptly; pairs with the existing `md-fade-in` CSS entry animation on `ion-router-outlet > .ion-page`
- [x] **Track page contextual FAB** — single `<IonFab>` lives in `Track.tsx`; icon changes per sub-tab (`scaleOutline` / `waterOutline` / `moonOutline` / `fastFoodOutline`); clicking increments `fabTrigger` which each tab listens to via `useEffect`; tab switch resets `fabTrigger` to 0 so the new tab never auto-opens; Sleep FAB disabled when `alreadyLogged` (communicated back via `onAlreadyLoggedChange` prop)
- [x] **Delete seed recipes** — migration v11: `deleted_seed_recipes (id TEXT PK)` table; `useRecipes` fetches deleted IDs and filters `RECIPES` on load; `deleteSeedRecipe(id)` inserts to the table; `Recipes.tsx` `handleDelete` dispatches to `deleteRecipe` or `deleteSeedRecipe` based on `recipe.custom`; `RecipeDetailModal` `onDelete` now always supplied (trash icon visible for all recipes)

---

## [1.0.5] — Photo filesystem storage
*Goal: stop storing image data as base64 blobs in SQLite; write each photo to the device filesystem and store only a path string in the database.*

- [x] `@capacitor/filesystem@8.1.2` installed
- [x] `src/utils/photoStorage.ts`: new shared utility — `savePhotoFile` (writes raw base64 to `Directory.Data`), `loadPhotoFile` (reads back as data URL; handles both native base64 string and browser Blob), `deletePhotoFile` (silent if absent)
- [x] Migration v10: `DROP + recreate progress_photos` with `photo_path TEXT NOT NULL` (pre-production wipe of base64 blobs); `ALTER TABLE food_entries ADD COLUMN photo_path TEXT`
- [x] `useProgressPhotos.ts`: `addPhoto` writes to `progress_photos/` folder; `load` reads each file via FS; `deletePhoto` removes the file before the DB row
- [x] `useFoodLog.ts`: `addEntry` writes photo to `food_photos/` folder, stores `photo_path`, leaves `photo_uri` null in DB; `loadAll` reads FS for entries with `photo_path`; `deleteEntry` also deletes the photo file
- [x] `FoodTab.tsx`: replace `<input type="file">` + `handlePhotoChange` with Capacitor Camera API — same **Take Photo** / **Gallery** two-button pattern as Progress.tsx; removes `fileInputRef`, `fileToDataUri`, `useRef`
- [x] No display-layer changes — both hooks still return `photo_uri` as a data URL to consumers

---

## [1.0.4] — Progress Photo: Take Photo / Select From Gallery
*Goal: replace the single file-input tap area with explicit camera and gallery actions, backed by the Capacitor Camera API with permission handling.*

- [x] Install `@capacitor/camera@8.0.1`
- [x] `AndroidManifest.xml`: add `READ_MEDIA_IMAGES` permission (`android:minSdkVersion="33"`) for gallery access on Android 13+
- [x] `Progress.tsx`: replace `fileRef` / `handleFileChange` / single tap zone with `capturePhoto(source)` using `CameraResultType.DataUrl`
- [x] Add-photo modal now shows a preview area + two explicit buttons: **Take Photo** (`CameraSource.Camera`) and **Gallery** (`CameraSource.Photos`)
- [x] Permission flow: `Camera.checkPermissions()` before each action; if `'denied'` show toast; if `'prompt'` call `Camera.requestPermissions()` and re-check before proceeding
- [x] `vite-env.d.ts`: declare `albumsOutline` (gallery icon) + `cameraOutline` was already declared

---

## [1.0.3] — Sync audit: two bugs fixed
*Goal: close two bugs found during deep sync analysis.*

- [x] `Home.tsx`: move `useProfile()` call above `useIonViewWillEnter` — fixes `reloadProfile` being referenced before declaration (const TDZ violation)
- [x] `FoodTab.tsx`: add `useIonViewWillEnter` + `reload` — fixes stale food entries when a recipe is logged from the Recipes tab while FoodTab is the active sub-tab

**Full sync status post-1.0.3:**
- Home: all 5 data hooks reload on tab entry ✅
- Progress: photos + trends reload on tab entry ✅
- Track sub-tabs: Weight/Water/Sleep — only mutated from their own tab, no cross-page stale risk ✅
- Track FoodTab: reloads on tab entry ✅ (food can also be logged from Recipes)
- Plan: useMealPlan reloads after every assign/clear, only mutated from Plan ✅
- Recipes: useRecipes only mutated from Recipes; useFoodLog write-only (no display) ✅
- ProfilePage / NotificationsPage: push routes — fresh mount every visit ✅

---

## [1.0.2] — Full live-refresh coverage
*Goal: every tab refreshes its data on entry — no stale reads anywhere in the app.*

- [x] `useProfile.ts`: extract load into `useCallback loadAll`; expose `reload: loadAll`
- [x] `useProgressPhotos.ts` / `useTrends.ts`: already exposed `refresh` — no change needed
- [x] `Progress.tsx`: import `useIonViewWillEnter`; call `refreshPhotos` + `refreshTrends` on tab entry
- [x] `Home.tsx`: add `reloadProfile` to existing `useIonViewWillEnter` block

---

## [1.0.1] — Live Home Refresh
*Goal: Home dashboard reflects the latest data immediately when switching back to the tab — no restart required.*

- [x] `useSleepLog.ts`: expose `reload` in return value
- [x] `useFoodLog.ts`: expose `reload` in return value
- [x] `Home.tsx`: import `useIonViewWillEnter`; call `reloadWeight`, `reloadWater`, `reloadSleep`, `reloadFood` on every tab entry

---

## [1.0.0] — Release Build
*Goal: signed, shippable APK produced from a clean build.*

- [x] `package.json` version bumped to `1.0.0`
- [x] `android/app/build.gradle`: `versionCode 1`, `versionName "1.0.0"`, `signingConfigs.release` wired from `keystore.properties`
- [x] `android/.gitignore` updated: `*.jks`, `*.keystore`, `keystore.properties` excluded from version control
- [x] Release keystore generated: `patty-release.jks` (alias `patty`, 2048-bit RSA, SHA256withRSA, valid 10000 days)
- [x] `npm run build` — TypeScript clean, 984 modules, `dist/` produced at `patty@1.0.0`
- [x] `npx cap sync android` — clean sync, 3 plugins, no warnings
- [x] `./gradlew assembleRelease` (Java 21 / Temurin 21.0.10) — BUILD SUCCESSFUL in ~7 min
- [x] Output: `android/app/build/outputs/apk/release/app-release.apk` (25.6 MB, signed)
- [x] Git tag `v1.0.0`

**Full feature summary (0.1.0 → 1.0.0):**
| Version | Feature |
|---|---|
| 0.1.0 | App shell, four-tab layout, MD3 Patty theme |
| 0.2.0 | Weight tracking (SQLite, chart, history) |
| 0.3.0 | Water intake (ring, quick-add, daily goal) |
| 0.4.0 | Sleep tracking (log, quality, history) |
| 0.4.1 | Daily alignment, useDailySummary foundation |
| 0.5.0 | Food log (photo-first, four meal categories) |
| 0.6.0 | Recipe library (12 seed recipes, search) |
| 0.6.1 | User-created recipes (SQLite, CRUD) |
| 0.7.0 | Cooking planner (week grid, grocery list) |
| 0.9.0 | Progress hub (photos, compare, trend charts) |
| 0.9.1 | Dashboard Home (live stats, greeting, BMI) |
| 0.9.3 | Profile + Settings (BMI/BMR/TDEE, prefs) |
| 0.9.4 | Calorie estimation + recipe kcal |
| 0.9.5 | Recipe → food log shortcut |
| 0.9.6 | Push notification reminders (10 channels) |
| 0.9.7 | Data persistence audit (SQLite-only) |
| 0.9.8 | UI polish (skeletons, toasts, spacing, transitions) |
| 0.9.9 | Capacitor native build prep (icons, manifest, sync) |
| 1.0.0 | Release build — signed APK |

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
