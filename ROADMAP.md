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

## 0.7.0 — Cooking Planner
*Goal: plan meals for the week and get a grocery list.*

- [ ] Weekly meal plan grid (7 days × 3 meal slots)
- [ ] Assign recipes to slots by picking from the library
- [ ] Auto-generated grocery list aggregated from the weekly plan
- [ ] "Cook Today" suggestion (random recipe from plan or library)

---

## 0.8.0 — Exercise Planner
*Goal: structured short routines users can follow.*

- [ ] Four routine categories: Beginner, Fat Loss, Mobility, Strength Basics
- [ ] Routine detail: exercise list, sets/reps or duration, rest time
- [ ] Session timer (per-exercise countdown)
- [ ] Log completed session (date + routine name)

---

## 0.9.0 — Progress Hub
*Goal: visual history of body changes and trends.*

- [ ] Progress photo upload (date-stamped)
- [ ] Side-by-side photo comparison (pick two dates)
- [ ] Trend charts: weight, average sleep, daily water — all on one screen
- [ ] Basic stats summary (current weight, 7-day avg sleep, weekly water avg)

---

## 1.0.0 — Full Dashboard + Polish
*Goal: everything works together; app is shippable.*

- [ ] Dashboard assembled: weight trend mini-chart, water ring, sleep summary, today's meals
- [ ] Quick-action buttons on dashboard: Log Weight, Add Meal, Log Water, Start Workout
- [ ] Push notification reminders: water, sleep log, weigh-in
- [ ] Basic calorie estimation on food log entries
- [ ] Nutrition summary on recipe detail pages
- [ ] Recipe library linked to food log ("Log this recipe as a meal")
- [ ] Settings page: daily water goal, weight unit (kg/lb), notification prefs
- [ ] Full data persistence audit (consistent storage across all features)
- [ ] UI polish pass: spacing, loading states, empty states, error handling
- [ ] Capacitor integration for iOS + Android native builds

---

## Post-1.0.0 (Backlog)

- Cloud sync / account system
- Barcode scanner for food logging
- AI meal suggestions based on logged data
- Apple Health / Google Fit integration
- Wearable data import (sleep, steps)
