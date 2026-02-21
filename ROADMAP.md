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

## 0.2.0 — Weight Tracking
*Goal: users can log and review their weight.*

- [ ] Weight entry form (value + optional note + date)
- [ ] Weight history list (reverse chronological)
- [ ] Simple line graph of weight over time
- [ ] Local data persistence (localStorage)

---

## 0.3.0 — Water Intake
*Goal: one-tap water logging with a visual daily goal.*

- [ ] Quick-add buttons: +250 ml, +500 ml, custom amount
- [ ] Daily goal ring (progress toward configurable daily target)
- [ ] Log resets at midnight
- [ ] Daily history list

---

## 0.4.0 — Sleep Tracking
*Goal: users can log sleep and see their patterns.*

- [ ] Sleep entry form (bedtime, wake time, quality slider 1–5)
- [ ] Calculated sleep duration display
- [ ] Sleep history list with quality indicator
- [ ] Average sleep duration stat

---

## 0.5.0 — Food Log
*Goal: photo-first meal capture across four categories.*

- [ ] Meal categories: Breakfast, Lunch, Dinner, Snacks
- [ ] Photo capture / upload per meal entry
- [ ] Optional text note per entry
- [ ] Daily food log view grouped by category

---

## 0.6.0 — Recipe Library
*Goal: users can browse and view saved recipes.*

- [ ] Recipe card list with name, prep time, and thumbnail
- [ ] Recipe detail page: ingredients, step-by-step instructions, prep time
- [ ] Seed library with 10–15 starter recipes
- [ ] Search / filter by name

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
