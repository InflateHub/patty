# Patty — Roadmap (3.0.0)

All versions prior to 2.0.0 are archived in the [`ROADMAP/`](ROADMAP/) folder.
Current production version: **2.9.0**. This document plans the path to **3.0.0**.

---

## 2.1.0 — UX Fixes & Polish
*Goal: resolve the most visible friction points and interaction gaps found in the 2.0.0 build.*

### Navigation
- [x] **Exit confirmation** — intercept the Android hardware back button on the root tab views; show an `IonAlert` asking "Exit Patty?" with Cancel / Exit actions before closing the app (`App.exitApp()`)

### Track Tab — Interaction
- [x] **Weight stat card clickable** — tapping the "Today" weight stat card on the Track → Weight tab opens the Add Weight modal directly (same as the FAB)
- [x] **Sleep stat card clickable** — tapping the "Last Night" sleep stat card on Track → Sleep opens the Add Sleep entry modal directly
- [x] **Meal section clickable to add** — each meal section heading row (Breakfast / Lunch / Dinner / Brunch / Midnight Meal) is tappable and opens the Add Food modal pre-filled with that meal type
- [x] **Brunch & Midnight Meal** — add `Brunch` and `Midnight Meal` as selectable `MealType` options in the food log modal and food tab groupings (alongside Breakfast / Lunch / Dinner / Snack)

### Track Tab — Segment
- [x] **Active tab segment pill matches theme colour** — the active segment indicator and label use `--md-primary` / `--md-primary-container` tokens so they follow the user's chosen seed colour; remove any hard-coded Ionic `color="primary"` on the segment

### Recipe
- [x] **Deletion confirmation** — deleting any recipe (seed or custom) shows an `IonAlert` "Delete recipe?" with recipe name, Cancel, and Delete (destructive) actions before the delete executes

### UI Defects
- [x] **Curved button focus rectangle** — remove the browser default rectangular `outline` on `IonSegmentButton`, `IonChip`, and pill-shaped `IonButton` elements; replace with a theme-coloured `box-shadow` ring that respects the element's `border-radius`

---

## 2.2.0 — Onboarding Redesign
*Goal: a leaner, more visually immersive onboarding that collects only what matters.*

### Step Changes
- [x] **Remove weight logging step** — the Height & Weight step is replaced by a Height & Sex step; no weight value is collected during onboarding; `weight_entries` table starts empty after onboarding (no seed row written)
- [x] **Height & Sex step — full-screen innovative layout** — full-viewport card; Height input uses a scrollable ruler-style picker (CSS snap scroll, cm / ft+in toggle); Sex uses large illustrated toggle cards (Male / Female / Prefer not to say) with subtle icon art; fills the entire screen with no scroll
- [x] **Custom water goal picker** — the water goal step replaces the plain number input with a styled horizontal drum-roller or arc-slider component built in React (no native `<input type=number>`); shows the current value large and centred with ml / oz unit toggle; custom button increments (+100 ml / +250 ml quick-add chips below the picker)
- [x] **Remove photo prompt** — no progress photo is requested during onboarding; the photo journey begins from the Track → Weight tab on first weigh-in

---

## 2.3.0 — Workout Tab ✅
*Goal: add a fifth Track tab for logging exercise, with a full variety of workout types.*

### Tab Bar
- [x] **Icon + stacked label tabs** — all five Track segment tabs (Weight / Water / Sleep / Food / Workout) show icon above a short label using `layout="icon-top"`; all five visible at once; `aria-label` retains full text

### Workout Logging
- [x] New `workout_entries` table (migration v14): `id`, `date`, `workout_type`, `name`, `duration_sec`, `steps`, `intensity` (1–5), `calories_burnt`, `notes`, `created_at`
- [x] `useWorkoutLog` hook: `addEntry` / `deleteEntry` / `entriesForDate` / `todayEntries` / `allEntries`
- [x] **WorkoutTab.tsx** — today summary card (sessions, total minutes, kcal, steps); grouped log list by type; history modal; FAB to add
- [x] **Add Workout modal** — type grid (Cardio 🏃, Strength 💪, Yoga 🧘, HIIT 🔥, Steps 👣, Custom ✏️); Steps mode: large step-count input + auto-estimated kcal; other modes: stopwatch (Start / Pause / Reset) + manual override, intensity chips (1–5 emoji), auto-estimated calories; notes field
- [x] Workout entries visible in day log grouped by type; swipe-to-delete with confirm alert

---

## 2.4.0 — Theming: Custom Colour Picker ✅
*Goal: replace the browser's native `<input type="color">` with a fully custom, branded picker.*

- [x] **Custom hex colour picker component** (`src/components/ColorPicker.tsx`) — built in React + CSS, no third-party picker library
- [x] Picker layout: large hue/saturation 2-D gradient canvas (pointer drag); separate hue bar; live hex input field with validation; preview swatch (old colour left, new colour right)
- [x] Renders inside a bottom sheet modal (`IonModal` with `initialBreakpoint`); triggered from the "Custom" chip in ProfilePage → Preferences → Colour
- [x] Real-time theme preview: as the user drags, the MD3 palette recalculates live and the preview card updates (debounced 150 ms to avoid jank)
- [x] Maintains backward compatibility: the 8 curated seed colour chips remain; picker only used for the free-form custom option

---

## 2.5.0 — Habits Page (replaces Achievements route) ✅
*Goal: a gamified daily habit system with good/bad habit categories, infinite dynamic milestones, and locked past-day history.*

### Routing & Navigation
- [x] `/tabs/habits` route replaces `/tabs/progress` (Achievements); tab icon is `flameOutline`; tab label is "Habits"
- [x] `Achievements.tsx` is preserved but removed from routing — not deleted

### Habit Types
- [x] **Good habits** — streak grows every day you complete them; tap the row to mark done/undo today
- [x] **Bad habits** — streak grows every clean day you resist; tapping logs a slip (confirm alert, resets streak); no toggle — a slip cannot be un-done
- [x] Past days are **permanently locked** — `toggleGoodHabit` and `logRelapse` only accept `date === today`; past rows render with a padlock visual

### Data Layer
- [x] Migration v15: `habit_definitions` (id, name, emoji, colour, type 'good'|'bad', is_default), `habit_completions` (good habits), `habit_relapses` (bad habits); both event tables enforce `UNIQUE(habit_id, date)`
- [x] `useHabits` hook: `toggleGoodHabit` / `logRelapse` / `addHabit` / `deleteHabit`; `computeStreaks` walks dates set for accurate gap detection
- [x] **Default seeded habits (good):** Log Weight · Log Sleep · Log Water · Log a Meal · Log a Workout — auto-inserted on first load if missing

### Dynamic Milestone System (infinite — never exhausts)
- [x] Era ≤ 30 days: fixed milestones 3, 7, 14, 21, 30
- [x] Era 31–364 days: every 30 days (60, 90, 120 … 360)
- [x] Era 365–999 days: every 100 days (365, 465, 565 …)
- [x] Era 1000+ days: every 365 days (1000, 1365, 1730 …)
- [x] `getNextMilestone(streak)` is a pure function; milestone toast fires with badge tier label + XP bonus

### XP & Level System
- [x] Daily XP = `10 + floor(streak / 7)` — grows by +1 per week of streak; milestone day adds +50 flat bonus
- [x] Relapse penalty: −15 XP for bad habit slip; miss penalty: −5 XP for missed good habit (consumers enforce floor 0)
- [x] Level = `floor(log₂(totalXP / 50) + 1)` — logarithmic, slows down at high XP; names: Beginner → Consistent → Dedicated → Relentless → Legendary → Unstoppable
- [x] Badge tiers: ⭐ Starter (≤ 30), 🔥 Consistent (31–364), 💎 Dedicated (365–999), 🏆 Legend (1000+)

### Page Layout
- [x] **Hero card** — longest active streak + "X / Y on track today" + XP bar + level chip + recent badges shelf (horizontal scroll, last 8)
- [x] **Good Habits section** — each row: emoji avatar · name · streak info · next milestone · checkmark/flame toggle; done = tinted border + colour
- [x] **Bad Habits section** (amber/warning) — each row: emoji · name · clean-days streak · tap to log slip; clean = shield icon; slipped = red tint + warning icon
- [x] **Add Habit FAB** → bottom-sheet modal: name field · emoji grid picker (30 options) · colour chip row (8 MD3-derived colours) · large Good/Bad segment toggle with explanatory copy
- [x] Swipe-to-delete on non-default habits with confirm alert

---

## 2.6.0 — Notifications & Profile Polish
*Goal: clean up Notifications page copy, fix engagement nudge defaults, and add production-grade profile links.*

### Notifications Page
- [x] **Remove footer copy** — delete the "Reminders are delivered by the device OS" explanatory text at the bottom of the page
- ~~**Engagement nudges default OFF**~~ — skipped (not needed)
- ~~**Engagement nudge label update**~~ — skipped (not needed)

### Profile / Settings
- [x] **Developer credit link** — the developer name row in App Info is a tappable `IonItem` that opens `https://saranmahadev.in/#contact` in a new browser tab
- [x] **Version row link** — tapping the version chip opens `https://patty.saranmahadev.in` in a new browser tab
- [x] **Send Feedback** link — tappable row that opens `mailto:hello@saranmahadev.in?subject=Patty%20Feedback`
- [x] **Rate on Play Store** link (placeholder, activates once Play Store listing is live)

### Home Page
- ~~**Habits shortcut**~~ — skipped

---

## 2.7.0 — Achievements Page Complete Redesign ✅
*Goal: replace the old Achievements page with a pure achievement collection: infinite per-category badge shelves + locked shareable cards.*

- [x] **Delete Progress.tsx** — the old dead photo-gallery + trend-charts page removed entirely
- [x] **Delete photo marquee & habit rings** — removed from Achievements page
- [x] **Hero card** — XP · level · progress bar · total badges earned · current + best streak
- [x] **Infinite badge shelves** — one shelf per category (Weight / Water / Sleep / Food / Workout / App Streak); uses same milestone ladder as Habits (3 → 7 → 14 → 21 → 30 → every 30 → every 100 → every 365)
- [x] **Earned badges** coloured + tappable → share modal; **next locked** shows 🔒 + "X more" nudge; **+1 ghost** preview beyond that
- [x] **Shareable cards** — Daily / Weekly / Monthly / Yearly / Lifetime; unearned cards show lock overlay with unlock condition; earned cards show share button
- [x] `useGamification` extended with `counts` (per-category log totals) to drive all badge shelves without a new hook

---

## 2.8.0 — Home Page Redesign & Profile Identity Hero ✅
*Goal: transform Home into a focused daily companion and evolve Profile into an identity-first page.*

- [x] **Greeting + streak summary** — large time-based greeting, live habits done / best streak summary line
- [x] **Today's Progress card** — four slim rows (Water bar, Sleep, Weight, Workout) replacing old bulky cards
- [x] **14-day Habit Activity heatmap** — GitHub-style grid, colour per habit, empty state prompt
- [x] **Dynamic insight line** — single contextual sentence from live data
- [x] **Speed Dial FAB** — animated `+` → 4 spring-staggered sub-FABs with scrim; deep-links to Track sub-tab
- [x] **Profile identity hero** — avatar, name, level chip, XP + streak stats above settings
- [x] **Notifications & Achievements** folded into Profile as nav rows; removed from Home header

---

## 2.9.0 — AI Foundation (User-Provided Key) ✅
*Goal: ship all three AI features using the user's own Gemini Flash API key. No account, no payment, no backend. Validates AI feature demand before investing in Pro infrastructure.*

### Setup
- [x] `src/utils/gemini.ts` — Gemini Flash client: handles both base64 image prompts and text prompts; enforces structured JSON output via response schema; surfaces clear error messages (invalid key, quota exceeded, network failure)
- [x] `src/hooks/useGeminiKey.ts` — reads and writes the Gemini API key from the SQLite `settings` table (`gemini_api_key`)
- [x] **Profile → App Settings** — "Gemini API Key" input field (password-masked); helper text with a tappable link to `aistudio.google.com/app/apikey`; "Test key" button that fires a minimal ping and shows success/failure

### Feature 1 — AI Macro Scan (Food Tab)
- [x] After a food photo is captured in the Add Food modal, a **Macros section** appears below the image thumbnail; this section contains a **"Scan with AI ✨"** button that is enabled only when a photo is present
- [x] Sends the base64 image to Gemini Flash with a strict JSON schema: `{ dish_name, kcal, protein_g, carbs_g, fat_g, fibre_g, confidence }` — confidence is `"high" | "medium" | "low"`
- [x] Loading state: shimmer placeholder on the result panel while the API call is in-flight
- [x] Result panel shows: dish name, all five macros in styled chips (kcal, P, C, F, Fibre), a coloured confidence badge (green/amber/red); every field is editable before saving
- [x] **DB migration v16:** `ALTER TABLE food_entries ADD COLUMN protein_g REAL`, `carbs_g REAL`, `fat_g REAL`, `fibre_g REAL`
- [x] `useFoodLog` — extend `FoodEntry` type and `addEntry` signature to include the four new macro fields (protein, carbs, fat, fibre)
- [x] Food log entry cards show a compact macro row (`P · C · F · Fi`) when any macro value is present
- [x] If no Gemini key is set, the "Scan with AI" button shows a "Set up AI in Profile to use this feature" tooltip instead

### Feature 2 — AI Recipe Generator (Recipes Page)
- [x] The `+` FAB on the Recipes page becomes a **speed-dial** with two arms:
  - ✏️ **Manual** — opens the existing `RecipeFormModal` (unchanged)
  - ✨ **AI Generate** — opens the new `AIRecipeModal`
- [x] `src/recipes/AIRecipeModal.tsx` — free-text description input (e.g. "high-protein low-carb chicken bowl, under 30 min"); optional dietary tags (multi-select chips: vegetarian / vegan / gluten-free / dairy-free / high-protein / low-carb)
- [x] Gemini returns structured JSON matching the `Recipe` type: `{ name, emoji, prepMin, cookMin, tags[], ingredients[], steps[] }`
- [x] Generated recipe is previewed in a layout identical to `RecipeDetailModal` — hero emoji, time chips, ingredient list, numbered steps — so the user sees the exact final result
- [x] "Save to my recipes" calls `useRecipes.addRecipe`; saved recipes are identical in storage to manually created ones
- [x] "Regenerate" button re-fires the same prompt for a different result without closing the modal
- [x] No Gemini key: "Set up AI in Profile" empty state instead of the description input

### Feature 3 — AI Week Planner (Plan Page)
- [x] **"Plan my week ✨"** icon button added to the Plan page header (right side)
- [x] Opens `src/plan/AIPlannerSheet.tsx` — a bottom sheet with preferences:
  - Dietary style: Balanced / High-Protein / Vegetarian / Low-Carb (single-select chips)
  - Days to fill: 3 / 5 / 7 (chip toggle)
  - Avoid repeats this week: toggle (on by default)
- [x] On "Generate", the prompt is assembled from: user `goal` + `activity` from `useProfile` + full recipe list names + already-assigned slots for the current week
- [x] Gemini returns: `{ date, slot, recipe_name }[]` — only slots not yet filled are returned
- [x] App maps `recipe_name` → nearest-matching Recipe object (case-insensitive), batch-calls `assignSlot`; unmatched names are silently skipped
- [x] "AI filled X slots" success toast; existing manual slots are **never overwritten**
- [x] No Gemini key: sheet shows "Set up AI in Profile" with a link instead of preferences

---

## 3.0.0 — Patty Pro: Accounts, Sync & Monetisation
*Goal: introduce Patty Pro — a paid subscription tier gating AI features, unlimited history, import/export, and cloud backup. Backed by Supabase (auth + sync) and RevenueCat (Play Store IAP). Free users can earn AI calls via rewarded ads or by providing their own Gemini key (always free, never removed).*

### Free vs Pro Feature Split

| Feature | Free | Pro |
|---|---|---|
| All tracking (weight, water, sleep, food, workout) | ✓ | ✓ |
| Habits, achievements, gamification, themes | ✓ | ✓ |
| Manual recipe creation | ✓ | ✓ |
| Manual meal planning + grocery list | ✓ | ✓ |
| Log history visible | Last 90 days | Unlimited |
| AI Macro Scan | Own key or rewarded ad | ✓ Unlimited |
| AI Recipe Generator | Own key or rewarded ad | ✓ Unlimited |
| AI Week Planner | Own key or rewarded ad | ✓ Unlimited |
| Import / Export (CSV + JSON) | ✗ | ✓ |
| Cloud backup + restore | ✗ | ✓ |
| Multi-device sync | ✗ | ✓ |
| Ad-free experience | ✗ | ✓ |

**Pricing:** $2.99/month · $19.99/year (~$1.67/mo, ~44% saving)

### Auth (Supabase)
- [ ] Supabase Auth — Google Sign-In (Android primary) + email magic link fallback
- [ ] `src/hooks/useAuth.ts` — session, user object, `signIn`, `signOut`, loading state
- [ ] `src/pages/AccountPage.tsx` — sign-in flow (Google button + email fallback); when signed in: avatar, email, subscription status chip, renewal date, "Manage subscription" link, "Sign out", "Delete account"
- [ ] Profile page gains a **"Patty Pro"** nav row when the user is not signed in; routes to `AccountPage`
- [ ] `src/components/ProGateSheet.tsx` — bottom sheet shown when a Free user taps a Pro feature; lists the three Pro AI features + sync + unlimited history; "Subscribe" CTA + "Use own Gemini key instead" secondary link

### Cloud Sync (Pro)
- [ ] On first Pro sign-in: full local SQLite snapshot pushed to Supabase Postgres
- [ ] Background sync every 30 minutes when signed in (last-write-wins per row by `created_at`)
- [ ] "Restore from cloud" option on fresh install (shown on the Account page when remote data exists but local DB is empty)
- [ ] Sync badge in Account page: last synced time + manual "Sync now" button
- [ ] Supabase schema mirrors local tables: `weight_entries`, `water_log`, `sleep_log`, `food_entries`, `recipes`, `meal_plan`, `settings`, `habit_definitions`, `habit_completions`, `habit_relapses`, `workout_entries`

### Import / Export (Pro)
- [ ] **Export:** full JSON dump of all tables + per-table CSV; delivered via native system share sheet (`Filesystem` + `Share` Capacitor plugins)
- [ ] **Import:** JSON full restore with two modes — Merge (append, skip duplicates by `id`) and Replace (wipe local, restore from file); confirmation alert before Replace
- [ ] Import/Export card in Profile → App Settings, gated behind `useProStatus`

### Logging Limit (Free)
- [ ] Entries older than 90 days are hidden from all list views with a locked banner: "Upgrade to Pro to view full history"
- [ ] Data is **never deleted** — upgrading reveals all history instantly, no data loss
- [ ] Charts and trends use only the last 90 days for Free users; Pro users see all-time data

### Subscription — RevenueCat + Play Store IAP
- [ ] `@revenuecat/purchases-capacitor` integrated (Capacitor plugin)
- [ ] Products: `patty_pro_monthly` ($2.99/mo), `patty_pro_annual` ($19.99/yr)
- [ ] `src/hooks/useRevenueCat.ts` — wraps SDK; `isPro` boolean; `purchaseMonthly` / `purchaseAnnual` / `restorePurchases`
- [ ] Purchase flow triggered from `ProGateSheet` and `AccountPage` — opens native Play Store billing sheet
- [ ] On successful purchase: Supabase `users.tier` updated to `'pro'`; `useProStatus` updates immediately
- [ ] `isPro` is derived from RevenueCat entitlement (source of truth) + local cache for offline use

### Rewarded AI Calls — AdMob (Free Users Without Own Key)
- [ ] `@capacitor-community/admob` integrated; **rewarded video format only** — no banners, no interstitials
- [ ] Free users without a Gemini key get **5 AI calls/month** base quota (counter in SQLite `settings`: `ai_calls_used`, `ai_calls_reset_date`)
- [ ] When quota is exhausted, the AI action button shows: **"Watch a short video to earn 3 AI calls"**; tapping loads an AdMob rewarded ad
- [ ] On successful reward: `ai_calls_used` decremented by 3; ad is user-initiated and never shown automatically
- [ ] Pro users: unlimited AI calls; AdMob SDK initialised but no ads ever requested
- [ ] Own-key users: quota is bypassed entirely; calls go direct to Gemini with their key; no ads shown

### Pro Badge
- [ ] Signed-in Pro users get a small ✦ Pro chip on their Profile identity hero card
- [ ] Level chip gains a gold border tint for Pro users (CSS token override, no separate component)

---

## Post-3.0.0 Backlog

- iOS App Store submission (requires macOS / Xcode build machine)
- Apple Health two-way sync
- Google Health Connect sync (Steps, Sleep, Weight, Workouts, Hydration)
- Barcode scanner for food logging (Open Food Facts API)
- Wearable data import: sleep from Fitbit, Garmin, Wear OS
- Social: optional friend leaderboard (cloud-backed habits)
- Meal prep timers in Plan tab
- Android App Widget for quick water logging
- Referral program: unique code per user, 14-day Pro trial reward
- AI nutrition coach weekly card on Home (trend observations + one actionable suggestion)
- AI meal swap: long-press any plan slot → 3 smart alternatives
- Custom macro targets per meal (protein / carbs / fat goals, not just kcal)
- Updated legal pages covering AI data handling, subscription billing, ads, GDPR deletion
