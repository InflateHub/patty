# Patty â€” Roadmap (Post-1.0.5)

All versions prior to 1.1.0 are archived in [`ROADMAP/ROADMAP-v1.0.5.md`](ROADMAP/ROADMAP-v1.0.5.md).
Current production version: **1.1.0**. This document plans the path to **2.0.0**.

---

## 1.1.0 â€” UI Polish & Core Fixes
*Goal: resolve the most visible UX friction points in the shipped 1.0.5 build.*

- [x] **Fancy bottom bar** â€” taller tab bar with label visibility, active indicator pill/blob, subtle shadow elevation; uses MD3 tonal surface tokens
- [x] **Smooth splash screen transition** â€” replace abrupt splash dismiss with a cross-fade or scale-out animation into the Home tab (Capacitor SplashScreen `fadeOutDuration` + CSS entry animation)
- [x] **Track page contextual FAB** â€” FAB icon, label, and action change to match the active tab (Weight / Water / Sleep / Food); single `<IonFab>` driven by `activeTab` state; no more static `+`
- [x] **Delete seed recipe** â€” allow all recipes (seed and custom) to be deleted; deleted seed recipe IDs stored in a `deleted_seed_recipes` SQLite set; `useRecipes` filters them out on load

---

## 1.2.0 â€” Onboarding
*Goal: first-launch flow that collects profile data so the app is immediately personalised.*

- [x] Onboarding flag in `settings` table (`onboarding_complete`); main entry reads flag and routes accordingly
- [x] Multi-step onboarding: Welcome → Name & DOB → Height & Weight → Goal → Activity & Water goal → Celebration
- [x] Step progress indicator (4-dot pill indicator) with Back/Next navigation; all steps mandatory
- [x] Data written directly to the `settings` table (same as ProfilePage); no duplicate state
- [x] Starting weight also written to `weight_entries` table on save
- [x] Celebration screen on completion with CSS confetti + hero animation before routing to Home

---

## 1.3.0 â€” Notification System Redesigned
*Goal: smarter, more actionable notification experience.*

- [x] Weight reminder: default time 08:00 (morning)
- [x] Water: frequency system (1â€"8/day), configurable day window (start/end time), slots auto-distributed and individually editable, Reset to even spacing
- [x] Sleep log: changed from bedtime nag (22:00) to morning prompt (08:30 â€" "How did you sleep?")
- [x] Planning: Weekly check-in added (Mondays 09:00); meal plan + progress photo remain (Sundays)
- [x] Engagement nudges: Morning boost / Midday nudge / Evening reflection â€" each fires 30 min after its linked functional reminder; times cascade when the linked reminder changes
- [x] NotificationsPage redesigned: grouped cards, water stepper + window pickers + per-slot time editors, Engagement section with derived-time display
- [x] patty-engage Android notification channel added

---

## 1.4.0 â€” Progress Page Complete Redesign
*Goal: the Progress tab becomes the most visually compelling screen in the app.*

- [x] **Tab renamed** Progress → Achievements; route stays `/tabs/progress`
- [x] **Weight Photo Marquee** (hero): mandatory photo on weigh-in, horizontal scroll newest→oldest, delta chips, fullscreen tap
- [x] **Shareable Cards**: Daily / Weekly / Monthly / Yearly 400×600 branded cards; captured via `html-to-image`, shared via `@capacitor/share`
- [x] **Gamification Card**: XP bar + 5 levels (Seedling→Legend), current/best streak, 8 badge shelf
- [x] **Habit Rings**: 7-day × 4-habit (Weight/Water/Sleep/Food) dot grid; today highlighted
- [x] **Trend Charts removed**

---

## 1.5.0 — Privacy & Security
*Goal: protect personal health data with app lock and give users full control over their stored data.*

**App Lock (PIN + Biometric)**
- [ ] `@aparajita/capacitor-biometric-auth` installed; `useAppLock` hook manages lock state, PIN hash (SHA-256 via Web Crypto API), biometric availability and app-resume listener
- [ ] Lock screen: full-viewport overlay (`LockScreen.tsx`) — Patty logo, 4-dot PIN indicator, numeric pad, backspace, shake animation on wrong PIN, no tab content visible underneath
- [ ] PIN setup: two-step create-and-confirm flow (`PinSetupModal.tsx`) — shown on first enable; reusable for Change PIN
- [ ] Lock triggers on `appStateChange` → background → foreground (Capacitor `App` plugin)
- [ ] Biometric unlock: Face ID / Fingerprint via device capability; toggle shown only when biometrics are enrolled; auto-prompts on lock screen mount
- [ ] ProfilePage → **Privacy & Security** card: App Lock toggle, Biometric toggle (conditional), Change PIN button
- [ ] PIN stored as SHA-256 hex hash in `settings` KV table — never plaintext

**Data Clear (Danger Zone)**
- [ ] ProfilePage → **Danger Zone** card with three destructive actions, each behind a two-tap `IonAlert` confirm:
  - **Clear Logs** — deletes all `weight_entries`, `water_entries`, `sleep_entries`, `food_entries` rows
  - **Clear Photos** — deletes all progress photo files from device storage + nulls `photo_path` in `weight_entries`
  - **Factory Reset** — wipes all tables including recipes, meal plan, settings; reloads app → Onboarding

---

## 1.6.0 â€” Personalisation Theming
*Goal: users can pick their own accent colour; the entire MD3 palette re-seeds dynamically.*

- [ ] Colour picker in ProfilePage â†’ Preferences: 8 curated seed colours (slate-green default) + custom hex input
- [ ] Selected seed colour stored in `settings` (`pref_theme_seed`)
- [ ] On change: MD3 tonal palette recalculated in-app and written as CSS custom properties on `:root`
- [ ] Dark / light mode manual override toggle (currently follows system; add explicit "Light", "Dark", "System" option)
- [ ] Font size setting: Default / Large / Extra Large (scales `--md-body-lg` base size; affects all type-scale tokens)
- [ ] Theme preview card in the picker showing a sample card + FAB with the live palette

---

## 1.7.0 â€” App Landing Page (Design)
*Goal: a polished marketing webpage for Patty exists as a static site in the repo.*

- [ ] Create `docs/` folder in the repository as the website source (GitHub Pages standard)
- [ ] Single-page design: Hero (app name + tagline + mockup), Features, Screenshots, Download CTA, Footer
- [ ] Built with plain HTML + CSS; MD3 tokens referenced via inline custom properties
- [ ] Mobile-responsive layout (flexbox, 375px â†’ 1440px)
- [ ] Dark-mode support via `prefers-color-scheme`
- [ ] App screenshots embedded as static assets under `docs/assets/screenshots/`
- [ ] Favicon and Open Graph meta tags matching the app brand

---

## 1.8.0 â€” Landing Page Deployed to GitHub Pages
*Goal: `https://<username>.github.io/patty` (or custom domain) is live.*

- [ ] GitHub Actions workflow: on push to `main`, deploy `docs/` to `gh-pages` branch
- [ ] `CNAME` file added if a custom domain is used
- [ ] `sitemap.xml` and `robots.txt` added
- [ ] Lighthouse score â‰¥ 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] Download button links to the latest GitHub Release APK asset

---

## 1.9.0 â€” Play Store Release Pipeline
*Goal: repeatable, documented process to publish Patty to the Google Play Store.*

- [ ] Google Play Console: app created, store listing drafted (title, short/long description, category)
- [ ] Store listing assets produced: 512px icon, feature graphic (1024Ã—500), phone screenshots (min 2, max 8)
- [ ] Content rating questionnaire completed; target audience declared
- [ ] Privacy policy published (linked from the store listing and the landing page)
- [ ] `android/app/build.gradle`: `versionCode` increment strategy documented in AGENTS.md
- [ ] Internal testing track: AAB built via `./gradlew bundleRelease` and uploaded
- [ ] Internal testers complete smoke test checklist (all four Track tabs, Recipes, Plan, Progress, Profile)

---

## 1.9.1 â€” Crash Reporting & Analytics
*Goal: production crashes are visible and diagnosable without user reports.*

- [ ] Firebase App Distribution set up for beta builds
- [ ] Firebase Crashlytics integrated (`@capacitor-firebase/crashlytics`); crashes surface in Firebase console
- [ ] Non-PII usage events logged: tab switches, entry creates, photo captures (no personally identifiable data)
- [ ] Crash-free session target: â‰¥ 99% before promoting to production track
- [ ] `AGENTS.md` updated with Firebase project ID and crash-review process

---

## 1.9.2 â€” Open Beta
*Goal: wider real-world validation before public launch.*

- [ ] Play Store Open Beta track enabled; store listing published in "draft" state
- [ ] Beta feedback form linked from the app (ProfilePage â†’ App Info â†’ "Send feedback")
- [ ] All P1 bugs from internal testing resolved; no force-close crashes in the wild
- [ ] App size target: < 30 MB APK / < 15 MB AAB

---

## 2.0.0 â€” Cloud Sync & Accounts
*Goal: data lives in the cloud; users can switch devices and never lose history.*

- [ ] Authentication: email + password via Firebase Auth (or Supabase); optional Google Sign-In
- [ ] Cloud database: Firestore (or Supabase Postgres) mirroring the local SQLite schema
- [ ] Bidirectional sync: local-first; cloud push on save; pull on app open / foreground resume
- [ ] Conflict resolution: last-write-wins with server timestamp; UI alert on conflict
- [ ] Account page: sign up / log in / log out; link existing local data to a new account ("Import local data")
- [ ] Data export: full JSON dump of all logs downloadable from the account page
- [ ] Privacy: all user data encrypted at rest; no third-party data sharing
- [ ] Play Store production track promoted from beta; `v2.0.0` tag + GitHub Release created

---

## Post-2.0.0 Backlog

- Barcode scanner for food logging (Open Food Facts API)
- AI meal suggestions based on logged food + recipe library
- Apple Health / Google Fit two-way sync
- Wearable data import: sleep (Fitbit, Garmin), steps
- iOS App Store submission (requires macOS / Xcode build machine)
- Social: optional friend progress sharing (streak badges)
- Habit streaks gamification: unlock themes / badges at milestones
