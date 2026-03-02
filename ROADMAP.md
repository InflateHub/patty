# Patty — Roadmap (3.0.0)

All versions prior to 2.0.0 are archived in the [`ROADMAP/`](ROADMAP/) folder.
Current production version: **2.0.0**. This document plans the path to **3.0.0**.

---

## 2.1.0 — UX Fixes & Polish
*Goal: resolve the most visible friction points and interaction gaps found in the 2.0.0 build.*

### Navigation
- [ ] **Exit confirmation** — intercept the Android hardware back button on the root tab views; show an `IonAlert` asking "Exit Patty?" with Cancel / Exit actions before closing the app (`App.exitApp()`)

### Track Tab — Interaction
- [ ] **Weight stat card clickable** — tapping the "Today" weight stat card on the Track → Weight tab opens the Add Weight modal directly (same as the FAB)
- [ ] **Sleep stat card clickable** — tapping the "Last Night" sleep stat card on Track → Sleep opens the Add Sleep entry modal directly
- [ ] **Meal section clickable to add** — each meal section heading row (Breakfast / Lunch / Dinner / Brunch / Midnight Meal) is tappable and opens the Add Food modal pre-filled with that meal type
- [ ] **Brunch & Midnight Meal** — add `Brunch` and `Midnight Meal` as selectable `MealType` options in the food log modal and food tab groupings (alongside Breakfast / Lunch / Dinner / Snack)

### Track Tab — Segment
- [ ] **Active tab segment pill matches theme colour** — the active segment indicator and label use `--md-primary` / `--md-primary-container` tokens so they follow the user's chosen seed colour; remove any hard-coded Ionic `color="primary"` on the segment

### Recipe
- [ ] **Deletion confirmation** — deleting any recipe (seed or custom) shows an `IonAlert` "Delete recipe?" with recipe name, Cancel, and Delete (destructive) actions before the delete executes

### UI Defects
- [ ] **Curved button focus rectangle** — remove the browser default rectangular `outline` on `IonSegmentButton`, `IonChip`, and pill-shaped `IonButton` elements; replace with a theme-coloured `box-shadow` ring that respects the element's `border-radius`

---

## 2.2.0 — Onboarding Redesign
*Goal: a leaner, more visually immersive onboarding that collects only what matters.*

### Step Changes
- [ ] **Remove weight logging step** — the Height & Weight step is replaced by a Height & Sex step; no weight value is collected during onboarding; `weight_entries` table starts empty after onboarding (no seed row written)
- [ ] **Height & Sex step — full-screen innovative layout** — full-viewport card; Height input uses a scrollable ruler-style picker (CSS snap scroll, cm / ft+in toggle); Sex uses large illustrated toggle cards (Male / Female / Prefer not to say) with subtle icon art; fills the entire screen with no scroll
- [ ] **Custom water goal picker** — the water goal step replaces the plain number input with a styled horizontal drum-roller or arc-slider component built in React (no native `<input type=number>`); shows the current value large and centred with ml / oz unit toggle; custom button increments (+100 ml / +250 ml quick-add chips below the picker)
- [ ] **Remove photo prompt** — no progress photo is requested during onboarding; the photo journey begins from the Track → Weight tab on first weigh-in

### Tutorial Walkthrough (post-onboarding)
- [ ] After the celebration screen routes to Home, a tooltip-based walkthrough launches automatically
- [ ] Walkthrough highlights: Home dashboard → Track tab → Recipes → Plan tab → Profile
- [ ] Each step: semi-transparent backdrop with a spotlight cutout on the target element, a bottom sheet tooltip card (title + one-sentence description + "Next" button)
- [ ] **Skip button** always visible in the top-right corner; skipping or completing stores `tutorial_complete = 1` in `settings` so it never re-runs
- [ ] 5 steps total; final step says "You're all set — let's go!" and dismisses the overlay

---

## 2.3.0 — Workout Tab
*Goal: add a fifth Track tab for logging exercise, with a full variety of workout types.*

### Tab Bar
- [ ] **Icon-only tab labels** — all five Track segment tabs (Weight / Water / Sleep / Food / Workout) switch from text labels to icon-only display using Ionicons; tooltips/aria-labels retain the text for accessibility

### Workout Logging
- [ ] New `workout_entries` table (migration v7): `id`, `date`, `type` (Cardio / Strength / Yoga / Pilates / HIIT / Custom), `name`, `duration_sec`, `intensity` (1–5), `calories_burnt`, `notes`, `photo_uri`, `created_at`
- [ ] `useWorkoutLog` hook: `addEntry` / `deleteEntry` / `entriesForDate` / `todayEntries` / `allEntries`
- [ ] **WorkoutTab.tsx** — today's summary card (total duration, total calories, entry count); grouped log list by type; FAB to add
- [ ] **Add Workout modal** — type selector (icon grid: Cardio 🏃, Strength 💪, Yoga 🧘, Pilates, HIIT 🔥, Custom ✏️); name field (pre-filled from type, editable for Custom); built-in stopwatch timer (Start / Pause / Stop); intensity slider (1–5 with emoji labels); calories field (auto-suggested from type × duration, editable); optional photo capture; notes field
- [ ] Workout entries visible in the same day timeline; delete with swipe + confirm

---

## 2.4.0 — Theming: Custom Colour Picker
*Goal: replace the browser's native `<input type="color">` with a fully custom, branded picker.*

- [ ] **Custom hex colour picker component** (`src/components/ColorPicker.tsx`) — built in React + CSS, no third-party picker library
- [ ] Picker layout: large hue/saturation 2-D gradient canvas (pointer drag); separate lightness slider; separate hue bar; live hex input field with validation; preview swatch (old colour left, new colour right)
- [ ] Renders inside a bottom sheet modal (`IonModal` with `initialBreakpoint`); triggered from the "Custom" chip in ProfilePage → Preferences → Colour
- [ ] Real-time theme preview: as the user drags, the MD3 palette recalculates live and the preview card updates (debounced 150 ms to avoid jank)
- [ ] Maintains backward compatibility: the 8 curated seed colour chips remain; picker only used for the free-form custom option

---

## 2.5.0 — Habits Page (replaces Achievements route)
*Goal: a gamified daily habit streak system that replaces the Achievements page.*

### Routing & Navigation
- [ ] `/tabs/habits` route replaces `/tabs/progress` (Achievements); the tab icon changes to a flame/streak icon
- [ ] Old `Achievements.tsx` is archived; Weight Journey + shareable card content moves into the new Habits page

### Habit System
- [ ] **Default habits (auto-created on first launch):** Weight Logging, Sleep Logging, Meal Logging
- [ ] **Addable habits:** Water Intake, Workout, Meditation; plus a fully Custom habit (name + icon + target description)
- [ ] Each habit tracks: current streak (days), best streak, total completions, XP accumulated
- [ ] **XP rules:** +10 XP on completion; −5 XP on a missed day (floor: 0); daily completion checked at midnight rollover
- [ ] **Milestone badges** per habit at streaks: 3, 7, 14, 30, 60, 100 days — badge image + unlock toast notification
- [ ] **Habits page layout:** hero streak summary card (current longest streak, total XP, level); habit card list (each card: icon, name, current streak flame counter, today's status toggle, XP bar); badges shelf (most recent 8 unlocked badges)
- [ ] **Add Habit sheet:** name, icon picker (emoji or Ionicons), target description, colour tag
- [ ] **Leaderboard tab** (device-local): ranks all habits by current streak; "Your best" highlighted; placeholder for future cloud leaderboard with a "Coming soon" chip

### Achievements Integration
- [ ] Weight Journey photo marquee (from old Achievements page) lives as a card on the Habits page below the habit list
- [ ] Shareable card generator moved to a floating action on the photo marquee card

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
