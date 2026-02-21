# Changelog

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
