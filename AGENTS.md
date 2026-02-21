# AGENTS.md — Patty

This file defines how AI agents (and contributors) should work within this project.
It establishes the workflow protocol, explains the codebase, and documents the
three-phase iterative process used to plan, build, and verify every feature.

---

## Project Overview

**Patty** is a minimal iOS/Android lifestyle companion built with **Ionic + React**.
It combines health tracking (weight, water, sleep, food) with practical planning
(cooking planner, meal prep, exercise routines) in a single calm, low-friction app.

The guiding principle is: **reduce the gap between tracking and doing**.

---

## Design System — Material Expressive 3

Patty uses **Material Design 3 (Material Expressive 3 / Material You)** as its
design language, implemented via CSS custom property overrides on top of Ionic.

### Core files
| File | Purpose |
|---|---|
| `src/theme/variables.css` | Full MD3 tonal palette tokens, Ionic token mapping, light + dark |
| `src/theme/md3.css` | Component-level overrides: shape, typography, elevation, motion |

### Rules for all UI work

**1. Always use MD3 tokens — never hard-code colours or sizes.**
```css
/* ✓ */  color: var(--md-on-surface);
/* ✗ */  color: #1A1C1B;
```

**2. Seed colour: `#5C7A6E` (Patty slate-green).**
All palette values must derive from this seed. Do not introduce unrelated hues.

**3. Shape scale — use the correct token for the component type.**
| Token | Value | Used for |
|---|---|---|
| `--md-shape-xs` | 4px | Badges, small chips |
| `--md-shape-sm` | 8px | Small buttons, small cards |
| `--md-shape-md` | 12px | Cards, list containers |
| `--md-shape-lg` | 16px | Large cards, nav rail |
| `--md-shape-xl` | 28px | Dialogs, bottom sheets, FAB |
| `--md-shape-full` | 9999px | Pill buttons, chips, tab indicator |

**4. Typography — Roboto only, via MD3 type-scale tokens.**
```css
/* ✓ */  font-size: var(--md-title-lg);  font-family: var(--md-font);
/* ✗ */  font-size: 20px;  font-family: Arial;
```
Type scale tokens: `--md-display-size`, `--md-headline-lg/md/sm`,
`--md-title-lg/md/sm`, `--md-body-lg/md/sm`, `--md-label-lg/md/sm`.

**5. Elevation — tonal, not shadow-based.**
Use `color-mix(in srgb, var(--md-shadow) X%, transparent)` for subtle shadows only
on FABs and modals. Cards use a border (`var(--md-outline-variant)`), not shadows.

**6. Dark mode is automatic.**
All tokens have dark-mode overrides in `variables.css` via
`@media (prefers-color-scheme: dark)`. Never write separate dark-mode logic in
component files.

**7. New pages must follow this structure:**
- `IonCard` for primary content sections (with `--md-shape-xl` radius)
- `IonListHeader` for section labels (uppercase, `--md-primary` colour)
- `IonFab` FAB for the primary action (uses `--md-primary-container`)
- Empty states: centred, emoji illustration, two-line message, muted colour

**8. No Ionic colour names in new code.**
Prefer MD3 tokens directly over `color="primary"` / `color="danger"` props
unless the Ionic prop maps correctly and you have verified the token mapping.

---

## Current File Map

```
Patty/
│
├── src/
│   ├── main.tsx               # App entry point — mounts React root, imports Ionic CSS
│   ├── App.tsx                # Root component — IonTabs with four tab routes
│   ├── App.test.tsx           # Smoke test for the root component
│   ├── setupTests.ts          # Vitest/Testing Library global setup
│   ├── vite-env.d.ts          # Vite environment types + ionicons ambient declaration
│   │
│   ├── pages/
│   │   ├── Track.tsx          # Track tab — weight tracking (0.2.0 complete)
│   │   ├── Recipes.tsx        # Recipes tab — recipe library (stub → 0.6)
│   │   ├── Plan.tsx           # Plan tab — cooking + exercise planners (stub → 0.7–0.8)
│   │   ├── Progress.tsx       # Progress tab — photos + trends (stub → 0.9)
│   │   ├── Home.tsx           # Dashboard stub — full dashboard in 1.0.0
│   │   └── Stub.css           # Shared empty-state styles for stub pages
│   │
│   ├── components/
│   │   └── WeightChart.tsx    # Recharts line chart for weight over time
│   │
│   ├── hooks/
│   │   └── useWeightLog.ts    # SQLite-backed weight log: addEntry / deleteEntry / getAll
│   │
│   ├── db/
│   │   ├── database.ts        # SQLite init (Capacitor native + jeep-sqlite WASM browser)
│   │   └── migrations.ts      # Versioned SQL migrations (v1: weight_entries table)
│       ├── variables.css      # MD3 tonal palette tokens + Ionic mapping, light + dark mode
│       └── md3.css            # MD3 component overrides: shape, type, elevation, motion
│
├── public/
│   └── assets/
│       └── sql-wasm.wasm      # sql.js 1.11.0 WASM binary (served for jeep-sqlite browser)
├── cypress/                   # End-to-end test specs (Cypress 13)
│
├── index.html                 # Vite HTML entry — loads src/main.tsx
├── vite.config.ts             # Vite + Ionic plugin configuration
├── tsconfig.json              # TypeScript project config (moduleResolution: Bundler)
├── tsconfig.node.json         # TypeScript config for Vite config file
├── eslint.config.js           # ESLint 9 flat config
├── cypress.config.ts          # Cypress base URL and spec config
├── ionic.config.json          # Ionic CLI project config (type: react-vite)
├── ionic.starter.json         # Starter metadata (safe to ignore after init)
├── .browserslistrc            # Target browser list for legacy builds
├── .gitignore                 # Git ignore rules (node_modules, dist, etc.)
│
├── ROADMAP.md                 # Feature roadmap 0.1.0 → 1.0.0
├── README.md                  # Full project documentation
└── AGENTS.md                  # This file — workflow protocol for agents
```

---

## Three-Phase Workflow

Every piece of work — feature, fix, or refactor — follows this cycle.
An agent must never skip a phase or combine phases without explicit confirmation.

---

### Phase 1 — Plan (Status + Proposal)

**Goal:** Agree on exactly what will be built before touching any code.

**Steps:**

1. **Summarise status** — State clearly what currently exists and what is missing.
   Keep it short. No jargon. One sentence per point.

2. **Propose the next step** — Describe the single next logical increment:
   - What files will be created or changed
   - What the user will see/experience after the change
   - Any decisions the user needs to make (e.g. naming, layout choice)

3. **Wait for confirmation** — Do not proceed to Phase 2 until the user explicitly
   confirms the plan (e.g. "yes", "go ahead", "looks good", or equivalent).

4. **Iterate** — If the user suggests changes, revise the proposal and repeat
   steps 1–3 until the plan is agreed.

**Format for Phase 1 responses:**

```
## Status
- [what exists]
- [what is missing / what this step addresses]

## Proposed Next Step
[concise description of the change]

**Files affected:** list them
**User will see:** what changes visually or functionally

Ready to proceed?
```

---

### Phase 2 — Implement

**Goal:** Execute exactly what was agreed in Phase 1. Nothing more.

**Rules:**
- Implement only what was confirmed. No scope creep.
- Make small, focused commits — one logical change per commit.
- If a blocker is discovered mid-implementation, pause and return to Phase 1
  with the new information. Do not improvise silently.
- After implementation, briefly describe what was done (files created/changed,
  key decisions made) and hand off to Phase 3.

---

### Phase 3 — Verify

**Goal:** Confirm the implementation works correctly before marking it done.

**Steps:**

1. **Run relevant tests** — unit tests (`npm run test.unit`) and/or E2E tests
   (`npm run test.e2e`) depending on the scope of the change.

2. **Manual check** — if the change is visual or interactive, run the dev server
   (`npm run dev`) and verify the expected behaviour in the browser.

3. **Update Files**:
   - ROADMAP.md — if the feature is complete and matches the description in the roadmap, check off the item.
   - CHANGELOG.md — add a brief entry describing the change, following the format:
     ```
     ## [Version] — [Feature Name]
     *Goal: one-sentence description of the feature.*

     - [ ] Key point or sub-feature 1
     - [ ] Key point or sub-feature 2
     ```
   - Make git commit with a clear message following the conventional commits format (e.g. `feat: add weight entry form`).

4. **Report outcome** — state clearly:
   - Tests passed / failed (with details if failed)
   - Any visual discrepancies noticed
   - Whether the implementation matches the Phase 1 agreement

5. **Iterate or close:**
   - If verification passes → mark the step complete, commit, then return to
     Phase 1 for the next increment.
   - If verification fails → return to Phase 2 with a clear description of
     what needs fixing. Do not start a new feature until the current one passes.

---

## Commit Convention

Use conventional commits for all git messages:

```
feat:     a new feature
fix:      a bug fix
refactor: code change with no functional effect
style:    formatting, CSS only
test:     adding or updating tests
chore:    tooling, config, deps
docs:     documentation only
```

Examples:
```
feat: add water intake one-tap logging component
fix: correct daily goal ring calculation
docs: update AGENTS.md with file map
```

---

## Key Constraints

- **No scope creep** — implement only what Phase 1 confirmed.
- **No silent decisions** — if something is ambiguous, ask in Phase 1.
- **No skipping tests** — Phase 3 is not optional.
- **One increment at a time** — finish and verify before starting the next.
