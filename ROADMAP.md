# Patty — Roadmap (3.0.0)

All versions prior to 2.0.0 are archived in the [`ROADMAP/`](ROADMAP/) folder.
Current production version: **2.2.0**. This document plans the path to **3.0.0**.

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
- [ ] **Remove footer copy** — delete the "Reminders are delivered by the device OS" explanatory text at the bottom of the page
- [ ] **Engagement nudges default OFF** — `pref_engage_morning`, `pref_engage_midday`, `pref_engage_evening` default to `0` instead of `1` in `migrations.ts` and `useNotifications`
- [ ] **Engagement nudge label update** — section subtitle reads "Motivational messages sent by the app (not the OS)" instead of the previous copy

### Profile / Settings
- [ ] **Developer credit link** — the developer name row in App Info is a tappable `IonItem` that opens `https://saranmahadev.in/#contact` in the in-app browser (`@capacitor/browser`)
- [ ] **Version row link** — tapping the version chip opens `https://patty.saranmahadev.in` in the in-app browser
- [ ] **Send Feedback** link — tappable row that opens `mailto:hello@saranmahadev.in?subject=Patty%20Feedback`
- [ ] **Rate on Play Store** link (placeholder, activates once Play Store listing is live)

### Home Page
- [ ] **Habits shortcut** — a compact "Habits" summary chip or card placed near the notifications bell on the Home header or as a home dashboard card section, showing today's completion count and current longest streak at a glance

---

## 2.7.0 — Progress Page Redesign
*Goal: strip the Achievements/progress page to its most valuable content and give it a fresh layout.*

- [ ] **Remove Habit Rings** — the 7-day × 4-habit dot grid is removed entirely
- [ ] **Remove badge shelf** from this page (badges live on the Habits page)
- [ ] **Retained:** Weight Journey photo marquee (hero); Gamification XP/level card
- [ ] **New layout:** full-bleed photo marquee at top → XP/level card → shareable card carousel → empty state if no data
- [ ] Weight Journey empty state: illustrated prompt "Log your first weigh-in to start your journey"
- [ ] Shareable cards: Daily / Weekly / Monthly / Yearly — tapping opens a preview modal with a Share and Download button

---

## 2.8.0 — Post-Onboarding Tutorial Walkthrough
*Goal: guide new users through the app with a lightweight spotlight tour after onboarding completes.*

- [ ] After the celebration screen routes to Home, a tooltip-based walkthrough launches automatically on first run
- [ ] **5 steps:** Home dashboard → Track tab → Recipes → Plan tab → Profile
- [ ] Each step: full-screen semi-transparent backdrop with spotlight cutout on the target element; bottom sheet tooltip card (title + one-sentence description + "Next" button)
- [ ] **Skip button** always visible in the top-right corner; skipping or completing stores `tutorial_complete = 1` in the `settings` table so it never re-runs
- [ ] Final step reads "You're all set — let's go!" and dismisses the overlay
- [ ] `TutorialOverlay.tsx` — self-contained component, no external library; mounted in `Home.tsx` behind the `tutorial_complete` flag

---

## 3.0.0 — Advanced Features (Requires Discussion Before Implementation)

> Each item below needs a separate Phase 1 planning session before any code is written.
> They are listed here to reserve scope and establish intent.

### A01 — Google Health Connect Sync
- Connect to Health Connect to read/write: Steps, Sleep, Weight, Workouts, Hydration
- Permissions flow on Android 14+; graceful degradation on older versions
- Sync settings card in Profile → Integrations

### A02 — AI Insights (Gemini Flash)
- Integrate Google Gemini Flash API (on-device prompt construction; data never leaves the device schema)
- Weekly AI summary card on Home: trend observations, goal gap analysis, one actionable suggestion
- AI chat modal: user can ask questions about their logs ("How has my sleep been this month?")
- All prompts constructed locally from SQLite data; only the prompt text is sent to the API — no raw row data

### A03 — Subscription (In-App Purchases)
- Define feature split: Free tier vs. Patty Pro
- Candidates for Pro: AI insights, unlimited custom habits, cloud sync, advanced shareable cards, custom workout templates
- Implement via Google Play Billing (Capacitor plugin); receipt validation server-side
- Paywall modal: shown when a Pro feature is tapped; shows feature highlights + price

### A04 — Ads (Free Tier)
- Integrate Google AdMob (`@capacitor-community/admob`)
- Ad placements: banner at bottom of Home tab (hidden for Pro users); interstitial between Recipes (max 1/session)
- Ad-free is a Pro perk

### A05 — Referral Program
- Unique referral code generated per user (stored locally + cloud)
- Share via native share sheet: deep link to Play Store + referral code in UTM
- Reward: 14-day Pro trial for the referrer when a referee completes onboarding
- Referral history card in Profile

### A06 — Updated Legal Pages
- Rewrite `docs/privacy-policy.html` and `docs/terms-and-conditions.html` to cover: Health Connect data usage, AI data handling, subscription billing, ads, referral program
- In-app links in Profile → App Info updated to point to the new pages
- GDPR / data deletion section

### A07 — Website: Google Play Store Link
- Replace the GitHub Releases download button on `docs/index.html` with the official Google Play badge
- Update OG description to mention Play Store availability
- Add Play Store badge to the hero section alongside the phone mockup

---

## Post-3.0.0 Backlog

- iOS App Store submission (requires macOS / Xcode build machine)
- Apple Health two-way sync
- Barcode scanner for food logging (Open Food Facts API)
- Wearable data import: sleep (Fitbit, Garmin, Wear OS)
- Social: optional friend leaderboard (cloud-backed habits leaderboard)
- Meal prep timers integrated with the Plan tab
- Widget support (Android App Widgets for quick water logging)
