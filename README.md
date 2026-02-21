# Patty

> **A calm daily health planner — not a hardcore fitness tracker.**

Patty is a minimal, elegant lifestyle companion that integrates health tracking with practical action. It doesn't just log your data — it helps you cook, eat, sleep, and exercise consistently by reducing the friction between *tracking* and *doing*.

---

## Table of Contents

- [Vision](#vision)
- [Target Users](#target-users)
- [Features](#features)
- [Information Architecture](#information-architecture)
- [Design Philosophy](#design-philosophy)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Differentiation](#differentiation)

---

## Vision

Most health apps make you log data endlessly without guiding your next action. Patty bridges that gap.

**Primary Goal:** Reduce friction between *tracking* and *doing*.

---

## Target Users

| Audience | Need |
|---|---|
| Beginners starting weight loss or fitness | Simple onboarding, no overwhelm |
| Busy individuals | Fast logging, minimal taps |
| People who dislike complex fitness apps | Visual progress, low cognitive load |

**Design Principle:** Few taps. Visual progress. Low cognitive load.

---

## Features

### Tracking System

#### Weight Tracking
- Manual weight entry
- Progress timeline with graph
- Photo-based visual progress
- Side-by-side photo comparison
- Optional notes per entry

#### Water Intake
- One-tap logging with 250ml / 500ml presets
- Daily goal ring
- Reminder notifications

#### Sleep Tracking
- Log sleep time and wake time
- Sleep quality slider
- MVP-first — no heavy biometrics

#### Food Intake
- Photo logging per meal
- Meal categories: Breakfast, Lunch, Dinner, Snacks
- Basic calorie estimation (planned for MVP+)

#### Recipe Library
- Ingredients & step-by-step instructions
- Prep time per recipe
- Nutrition summary (planned for MVP+)
- Linked directly to meal tracking

---

### Planning & Guidance Layer

#### Cooking Planner
- Weekly meal plan generator
- Auto-generated grocery list from selected recipes
- "Cook Today" quick suggestion

#### Exercise Planner
Structured routines for:
- Beginners
- Fat loss
- Mobility
- Strength basics

Focus: short sessions (10–20 min), minimal equipment.

---

## Information Architecture

```
Home (Dashboard)
│
├── Track
│   ├── Weight + Photos
│   ├── Water
│   ├── Sleep
│   └── Food Log
│
├── Recipes
│   └── Saved / Recommended
│
├── Plan
│   ├── Cooking Planner
│   └── Exercise Planner
│
└── Progress
    ├── Photos
    └── Trends
```

### Daily User Flow

1. Open the app
2. View the **Dashboard**
   - Weight trend
   - Water intake ring
   - Sleep summary
   - Today's meals
3. Quick actions
   - Log weight
   - Add meal photo
   - Log water
   - Start a workout

---

## Design Philosophy

| Principle | Application |
|---|---|
| Neutral colors | No harsh or distracting palettes |
| Soft typography | Readable, calm, approachable |
| Card-based layout | Clear content separation |
| Large touch targets | Accessible, fast interaction |

**Avoided deliberately:**
- Overloaded analytics dashboards
- Too many charts at once
- Aggressive gamification (streaks, badges spam)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Ionic](https://ionicframework.com/) 8 + [React](https://react.dev/) 19 |
| Build Tool | [Vite](https://vitejs.dev/) 5 |
| Language | TypeScript 5 |
| Routing | React Router 5 |
| Native Runtime | [Capacitor](https://capacitorjs.com/) |
| Unit Testing | [Vitest](https://vitest.dev/) + Testing Library |
| E2E Testing | [Cypress](https://www.cypress.io/) 13 |
| Linting | ESLint 9 |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- Ionic CLI

```bash
npm install -g @ionic/cli
```

### Install Dependencies

```bash
cd Patty
npm install
```

### Run in Development

```bash
npm run dev
# or
ionic serve
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

---

## Project Structure

```
Patty/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route-level page components
│   ├── theme/           # Ionic theme variables
│   ├── App.tsx          # Root component & routing
│   └── main.tsx         # Entry point
├── cypress/             # E2E tests
├── ionic.config.json    # Ionic project config
├── vite.config.ts       # Vite build config
├── tsconfig.json        # TypeScript config
└── package.json
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run test.unit` | Run unit tests with Vitest |
| `npm run test.e2e` | Run end-to-end tests with Cypress |

---

## Differentiation

| Feature | Most Apps | Patty |
|---|---|---|
| Progress tracking | Charts only | Photos + charts |
| Cooking | Separate app | Built-in, linked to food log |
| Workout guidance | Complex plans | Short, minimal-equipment sessions |
| Data presentation | Dashboard overload | One calm daily summary |
| User mindset | Hardcore tracking | Gentle daily habit building |
