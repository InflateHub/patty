# Patty — Roadmap (3.5.0)

All versions prior to 2.0.0 are archived in the [`ROADMAP/`](ROADMAP/) folder.
Current production version: **3.0.0**. This document plans the path to **3.5.0**.

---

## Product Philosophy

- **App always feels free and premium at the same time** — no feature is locked, no data is ever hidden, no punitive gates.
- **Free tier** = full app + banner ads on Home & Track + earn AI credits by watching rewarded ads (1 credit per ad). Zero free monthly AI credits — credits must be earned.
- **Pro tier** = zero ads + 300 AI credits per month automatically.
- **Auth is deferred** — no account required to use any part of the app. Authentication is triggered only when the user taps **Buy** on the ProPage. The app must feel fully functional before that moment.
- **No punitive gates** — full log history is always visible, all tracking features always available, no data ever hidden behind a paywall.

---

## Pricing

| Region | Monthly | Annual |
|---|---|---|
| India | ₹99 / month | ₹699 / year (save 41%) |
| Global | $3.49 / month | $25 / year (save 40%) |

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

## 3.0.0 — Pro UI Entry Points ✅
*Goal: plant every visual surface that leads the user to Patty Pro, with no backend dependencies. All UI is real and tappable; the ProPage is a full-fidelity paywall shell that renders correctly whether the user is signed in or not.*

### Free vs Pro Feature Split

| Feature | Free | Pro |
|---|---|---|
| All tracking — weight, water, sleep, food, workout | ✓ | ✓ |
| Full log history — no limits, ever | ✓ | ✓ |
| Habits, achievements, gamification, themes | ✓ | ✓ |
| Manual recipe creation + meal planning + grocery list | ✓ | ✓ |
| AI features | Earn credits by watching rewarded ads (1 cr / ad) | 300 credits / month |
| Banner ads | On Home & Track screens | **None** |
| Rewarded ads | Available to earn credits | Not shown |
| Import / Export (CSV + JSON) | ✗ | ✓ |
| Cloud backup + restore | ✗ | ✓ |

**Pricing:** ₹99/mo · ₹699/yr (India) · $3.49/mo · $25/yr (Global)

### Pro Card — ProfilePage
- [x] New `IonCard` inserted as the **first card** after the identity hero, before the Notifications row
- [x] **Free state:** crown icon · "Patty Pro" title · tagline "Unlimited AI, cloud backup, no ads" · "See plans →" tappable chevron row; routes to `/pro`
- [x] **Pro state:** ❖ Active badge · renewal date · "Manage" button; routes to `/account`
- [x] Styled with `--md-primary-container` background tint and `--md-shape-xl` radius to stand out from the settings rows below

### Animated Pro Badge — Home Toolbar
- [x] Small floating badge chip overlaid on the profile `IonButton` in the top-right toolbar
- [x] Three icons rotate in an infinite CSS keyframe animation: **ban** (no-ads) → **crownOutline** → **diamondOutline** — 1.5 s per icon, opacity cross-dissolve transition
- [x] **Free state:** animation runs continuously; tapping the profile icon navigates to ProfilePage (unchanged)
- [x] **Pro state:** animation stops; badge locks on `crownOutline` with a gold tint (`--md-tertiary` token); no text label needed
- [x] Badge size: 18 × 18 px circle, `position: absolute`, top-right of the profile button; does not obscure the icon

### ProPage (`src/pages/ProPage.tsx`)
- [x] Route: `/pro`; full-screen `IonPage` with back button
- [x] **Hero section:** large animated crown illustration (CSS keyframe spin/pulse), "Patty Pro" headline, tagline
- [x] **Feature comparison list:** 6 rows — Unlimited AI calls · Unlimited log history · Cloud backup & restore · Import / Export · Ad-free · Priority support — each with ✓ Pro / ✗ Free columns
- [x] **Plan selector card:** two chips — "Monthly · $2.99" / "Annual · $19.99 (save 44%)" — selected chip uses `--md-primary-container`; annual chip has a "Best value" badge
- [x] **"Buy" CTA:** primary action button labelled **"Buy"**; tapping triggers Firebase Auth email sign-in (wired in 3.1.0; in 3.0.0 shows a "Coming soon" toast); auth is never shown before this tap — the app is fully usable without an account
- [x] **"Restore purchase" text link** below CTA
- [x] **Logged-in free state** (when Firebase session exists but not Pro): shows user email chip at top; "Subscribe" CTA replaces "Buy"; plan selector still visible
- [x] **Pro state:** page redirects to `/account` immediately

### ProGateSheet (`src/components/ProGateSheet.tsx`)
- [x] Reusable `IonModal` with `initialBreakpoint=0.55`; accepts `featureName` prop that sets the contextual headline (e.g. "Unlock unlimited AI scans")
- [x] Body: icon · headline · 3-bullet feature list · "Subscribe — from ₹99/mo" primary button (routes to `/pro`) · "Use own Gemini key" secondary link (AI gates only) · "Watch ad for 1 credit" tertiary link (AI gates only — visible but disabled in 3.0.0, wired in 3.5.0)

### Routing
- [x] `/pro` and `/account` added to `App.tsx` as top-level `IonRoute`s (outside the tab shell)

---

## 3.1.0 — Firebase Auth (Magic Link)
*Goal: passwordless email sign-in backed by Firebase Auth. Auth is triggered exclusively when the user taps "Buy" on ProPage — never before. The app is 100% functional without an account.*

### Auth Trigger Flow
- [ ] Tapping **"Buy"** on ProPage opens a bottom sheet `IonModal` with a single email input + "Send magic link" button
- [ ] Auth sheet only appears at this moment — never on app launch, never on tab switch, never proactively
- [ ] If user already has a Firebase session, "Buy" skips auth and goes straight to RevenueCat purchase (3.2.0)

### Firebase Setup
- [ ] `@capacitor-firebase/authentication` Capacitor plugin integrated
- [ ] `src/utils/firebase.ts` — Firebase app init with `firebaseConfig`; exports `auth` instance
- [ ] Deep link configured: `patty.saranmahadev.in/auth` registered as the sign-in continuation URL in Firebase Console → Authentication → Sign-in methods → Email link
- [ ] Android `AndroidManifest.xml` — intent filter for `patty.saranmahadev.in` added so the magic link re-opens the app

### `src/hooks/useAuth.ts`
- [ ] `user` — Firebase `User | null`
- [ ] `loading` boolean
- [ ] `sendMagicLink(email: string)` — calls `sendSignInLinkToEmail`; saves `email` to localStorage for the completion step
- [ ] `completeMagicLink(email: string, link: string)` — calls `signInWithEmailLink`; on success writes `firebase_uid` to SQLite `settings`; then immediately proceeds to RevenueCat purchase
- [ ] `signOut()` — Firebase `signOut()` + clears local `firebase_uid` + clears RevenueCat identity (3.2.0)
- [ ] Deep link handler in `App.tsx` — on app resume with a magic link URL, reads saved email from localStorage, calls `completeMagicLink`, routes to `/pro` on success

### Single-Session Enforcement
- [ ] On each successful sign-in, write a `session_token` (UUID v4) to `firestore/users/{uid}/session_token`
- [ ] On app resume (every 30 min background check), compare local token to Firestore — if mismatch, call `signOut()` silently
- [ ] Effect: a second sign-in from another device invalidates the first; no aggressive kick during active use
- [ ] Firebase security rule: `allow write: if request.auth.uid == userId` — only the authenticated user can write their own doc

### AccountPage Basic Shell (`src/pages/AccountPage.tsx`)
- [ ] Route: `/account`; full-screen page with back button
- [ ] **Signed-in free state:** avatar initial circle · email · "Free" chip · plan selector (mirrors ProPage) · "Buy" CTA
- [ ] **Pro state:** avatar · email · ✦ Pro chip · renewal date · "Manage subscription" (Play Store URL) · "Restore purchases" · "Sign out" · "Delete account" (confirm alert → Firebase delete + local UID clear)
- [ ] Import / Export card (gated; shows `ProGateSheet` for free users) — wired in 3.4.0

---

## 3.2.0 — RevenueCat + Play Store IAP
*Goal: wire real payments. RevenueCat is initialised with the Firebase UID as the app user ID so entitlements are tied to the account, not the device.*

### RevenueCat Setup
- [ ] `@revenuecat/purchases-capacitor` Capacitor plugin integrated
- [ ] Four subscription products created in Play Console:
  - `patty_pro_monthly_in` (₹99/mo — India)
  - `patty_pro_annual_in` (₹699/yr — India)
  - `patty_pro_monthly` ($3.49/mo — Global)
  - `patty_pro_annual` ($25/yr — Global)
- [ ] Play Console country-level price overrides set for Tier C/D markets (Brazil, Mexico, Turkey, Indonesia, Philippines, Vietnam)
- [ ] RevenueCat project created; products + entitlement `pro` configured; Firebase extension enabled (auto-writes custom claim on purchase)

### `src/hooks/useRevenueCat.ts`
- [ ] `Purchases.configure({ apiKey: RC_PUBLIC_KEY, appUserID: firebaseUID })` — called on app init after Firebase session resolves
- [ ] `isPro` — derived from `ENTITLEMENT_PRO` active entitlement; cached in SQLite `settings` (`pro_status`, `pro_renewal`) for offline use
- [ ] `purchaseMonthly()` — `Purchases.purchaseStoreProduct` for `patty_pro_monthly`
- [ ] `purchaseAnnual()` — same for `patty_pro_annual`
- [ ] `restorePurchases()` — `Purchases.restorePurchases()`; re-checks entitlement; updates local cache
- [ ] `renewalDate` — ISO string from active subscription `expirationDate`
- [ ] On successful purchase: write `{ tier: 'pro', renewal: date }` to `firestore/users/{uid}` (Firestore write, not a backend call)

### `src/hooks/useProStatus.ts`
- [ ] Single source of truth consumed everywhere in the app
- [ ] Priority: RevenueCat entitlement → Firestore `tier` field → local SQLite cache (offline fallback)
- [ ] Returns: `{ isPro, isSignedIn, user, renewalDate, loading }`

### Purchase Flow
- [ ] ProPage **"Buy"** CTA and AccountPage CTA both call `purchaseMonthly()` / `purchaseAnnual()` based on selected plan chip
- [ ] RevenueCat automatically selects the correct regional product based on Play Store storefront locale — no manual country detection needed
- [ ] On success: `useProStatus.isPro` flips `true` instantly; ProPage redirects to `/account`; success toast "Welcome to Patty Pro ✦"; banner ads removed immediately
- [ ] On error: toast with RevenueCat error message; no crash

### Pro Badge
- [ ] Profile identity hero gains a ✦ Pro chip when `isPro` is `true` (gold tint, `--md-tertiary` token)
- [ ] Level chip gains a gold border using `outline: 2px solid var(--md-tertiary)` for Pro users

---

## 3.3.0 — AI Credit System & Feature Gates
*Goal: enforce the Free vs Pro AI split with a credit-based system. No punitive gates — full history always visible, all tracking always free. The only gate is AI usage.*

### Core Principle
- **No history limits. No feature removal. No data hidden.** The app is identical for free and Pro users except: (1) Pro users have no ads, (2) Pro users get 300 AI credits/month automatically.
- Free users start with **zero AI credits**. Credits are earned exclusively by watching rewarded ads — 1 credit per completed ad.

### `src/hooks/useCreditBalance.ts` (replaces `useAIQuota`)
- [ ] `credits` — reads `ai_credits` from SQLite `settings`; starts at 0 for new users
- [ ] `consumeCredit(cost: number)` — deducts from balance, floor 0, persists to SQLite
- [ ] `earnCredits(n: number)` — adds n credits (called on rewarded ad completion), persists to SQLite
- [ ] `resetMonthlyPro()` — sets credits to 300 on first day of each month for Pro users; called on app resume
- [ ] No monthly reset for free users — credits only come from watching ads
- [ ] DB migration v17: `ai_credits INTEGER DEFAULT 0` in `settings` table

### Credit cost per AI feature
| Feature | Credits | Reasoning |
|---|---|---|
| Macro Scan 📸 | 1 cr | Most frequent, cheapest API call |
| Recipe Generator ✨ | 2 cr | Larger output, less frequent |
| Week Planner 📅 | 3 cr | Heaviest prompt, rarest |

### AI Gate Logic
- [ ] If `isPro`: deduct from 300/month pool; show remaining credit count in AI feature header
- [ ] If own Gemini key set: bypass credit system entirely; calls go direct, no credits consumed
- [ ] If free + credits > 0: allow call, deduct credits
- [ ] If free + credits = 0: show `ProGateSheet` with two options — **"Subscribe ₹99/mo"** (primary) + **"Watch ad for 1 credit"** (secondary, wired in 3.5.0, disabled button in 3.3.0)

### Import / Export (Pro gate)
- [ ] **Export (Pro):** full JSON dump of all tables + per-table CSV; delivered via `@capacitor/share` share sheet
- [ ] **Import (Pro):** JSON full restore — Merge mode (append, skip duplicate `id`s) or Replace mode (wipe local + restore); confirmation alert before Replace
- [ ] Both actions live in AccountPage → "Data" card; tapping while Free shows `ProGateSheet`

---

## 3.4.0 — Cloud Backup + Restore (Pro)
*Goal: let Pro users back up and restore their full local SQLite database to Firebase Storage. No real-time sync — explicit backup/restore only.*

### Backup
- [ ] "Back up now" button in AccountPage → Data card (Pro only)
- [ ] Serialises entire SQLite database to JSON (all tables, all rows)
- [ ] Uploads to Firebase Storage: `users/{uid}/backups/latest.json` (overwrites) + a dated snapshot `users/{uid}/backups/{date}.json`
- [ ] Last backed-up timestamp written to `firestore/users/{uid}/last_backup`
- [ ] AccountPage shows: last backup date · "Back up now" button

### Restore
- [ ] "Restore from backup" button in AccountPage → Data card (Pro only)
- [ ] Downloads `users/{uid}/backups/latest.json` from Firebase Storage
- [ ] Shows confirmation alert: "This will replace all local data. Continue?"
- [ ] On confirm: wipes local SQLite tables, re-inserts all rows from backup JSON, re-runs any missing migrations
- [ ] Success toast; app reloads to Home

### Firebase Storage Rules
- [ ] `allow read, write: if request.auth.uid == uid` — users can only access their own backup files

---

## 3.5.0 — AdMob Integration
*Goal: monetise the free user base with (1) passive banner ads on Home & Track and (2) user-initiated rewarded ads that earn 1 AI credit per view. Pro users see zero ads.*

### AdMob Setup
- [ ] `@capacitor-community/admob` Capacitor plugin integrated
- [ ] Three ad unit IDs created in AdMob console:
  - `patty_banner_home` — banner on Home screen
  - `patty_banner_track` — banner on Track screen
  - `patty_rewarded_ai` — rewarded ad for AI credit earn
- [ ] AdMob Mediation enabled (Meta Audience Network + AppLovin) to maximise fill rate and eCPM
- [ ] SDK initialised on app start; Google test ad IDs used in debug builds (`import.meta.env.DEV`), real IDs in release
- [ ] `AndroidManifest.xml` — AdMob App ID meta-data added

### Banner Ads (Free users only)
- [ ] Small banner (320×50) rendered at the bottom of Home screen for free users — above the FAB
- [ ] Small banner rendered at the bottom of Track screen for free users — above the segment bar
- [ ] `isPro` flag passed to both pages; banner component unmounts immediately when Pro activates
- [ ] No banners on Recipes, Plan, Habits, Profile, or any modal — only Home & Track
- [ ] Banner never overlaps interactive elements; safe-area insets respected

### Rewarded Ads (Free users — earn AI credits)
- [ ] `showRewardedAd()` in `useCreditBalance` — loads `RewardedAd`, shows it; on `onRewarded` callback calls `earnCredits(1)`; resolves `true` on reward, `false` on skip/error
- [ ] Pro users: `showRewardedAd` is a no-op, never called
- [ ] Own-key users: same no-op path

### ProGateSheet — Rewarded CTA Wired
- [ ] "Watch a short video (+1 credit)" button in `ProGateSheet` now active
- [ ] Tapping calls `showRewardedAd()`; on success closes the sheet and re-triggers the original AI action automatically
- [ ] If ad fails to load: toast "Couldn't load ad — try again later"
- [ ] Button hidden entirely for Pro users and own-key users

### Ad Policy
- [ ] **Banners only on Home & Track** — the two highest-traffic screens
- [ ] **No interstitials. Ever.** — never on navigation, never on tab switch
- [ ] **Rewarded ads are always user-initiated** — only from ProGateSheet, never automatic
- [ ] Pro upgrade always the primary CTA alongside the ad option — never hidden behind it

---

## Post-3.5.0 Backlog

### AI Credit Top-up Packs (one-time IAP)
Revenue supplement for power users who need more credits between monthly cycles.

| Pack | Credits | India | Global |
|---|---|---|---|
| Starter | 50 cr | ₹49 | $0.99 |
| Standard | 150 cr | ₹99 | $1.99 |
| Power | 400 cr | ₹199 | $3.99 |

- Credits granted immediately on purchase via RevenueCat non-consumable → consumable product type
- Top-up credits carry over and never expire (unlike monthly Pro grant which resets)
- Offer these only after 3.5.0 when credit system is live and well-tested

---

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
