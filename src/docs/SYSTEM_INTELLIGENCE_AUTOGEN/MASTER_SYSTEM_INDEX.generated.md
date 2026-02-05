# Master System Index (Generated)

Full system discovery: subsystem folder roots, entrypoints, public APIs, runtime callers, state read/write surfaces, JSON registries, status. **Layout ≠ Logic ≠ State ≠ Behavior ≠ Blueprint/Compiler ≠ Organs ≠ Registry.**

**Seed entrypoints:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/engine/core/json-renderer.tsx`, `src/engine/core/behavior-listener.ts`, `src/engine/core/screen-loader.ts`, `src/state/state-store.ts`, `src/layout/index.ts`, `src/logic/runtime/runtime-verb-interpreter.ts`.

**Status legend:** Wired = reachable from seed and invoked; Dormant = reachable but not invoked on main path; Missing = documented but no implementation; Ambiguous = multiple entrypoints or unclear ownership.

---

## 1. Blueprint / Compiler

| Attribute | Value |
|-----------|--------|
| **Folder roots** | `src/lib/site-compiler/`, `src/lib/site-skin/` (compileSkinFromBlueprint), `src/compiler/`, `src/scripts/websites/` |
| **Entrypoints** | `src/app/api/sites/[domain]/*` (route.ts handlers), `src/scripts/websites/build-site.ts`, `src/scripts/websites/compile.ts` |
| **Public APIs** | `compileSiteToSchema`, `normalizeSiteData`, `compileSiteToScreenModel`, `compileSkinFromBlueprint`; API GET/POST per route |
| **Runtime callers** | Next.js (HTTP); no static import from seed. Scripts: CLI |
| **State read/write** | None from seed path; API routes may read filesystem |
| **JSON registries** | Site schema, page/skin JSON produced by compiler |
| **Status** | **Wired** (by URL); **Ambiguous** (API not in import graph from seed) |

**File refs:** `src/lib/site-compiler/compileSiteToSchema.ts`, `src/lib/site-compiler/normalizeSiteData.ts`, `src/app/api/sites/[domain]/route.ts`, `src/app/api/sites/[domain]/schema/route.ts`, `src/app/api/sites/[domain]/screen/route.ts`, `src/app/api/sites/[domain]/pages/route.ts`, `src/app/api/sites/[domain]/skins/route.ts`, `src/app/api/sites/[domain]/onboarding/route.ts`, `src/app/api/sites/[domain]/normalized/route.ts`, `src/app/api/sites/[domain]/debug/route.ts`, `src/app/api/sites/[domain]/brand/route.ts`.

---

## 2. Screen loading (API + loader)

| Attribute | Value |
|-----------|--------|
| **Folder roots** | `src/engine/core/screen-loader.ts`, `src/app/api/screens/` |
| **Entrypoints** | `src/app/page.tsx` → `loadScreen(path)`; `src/app/api/screens/[...path]/route.ts` (GET) |
| **Public APIs** | `loadScreen(path)` — returns `{ __type: "tsx-screen", path }` or JSON from fetch; API route serves JSON or TSX marker |
| **Runtime callers** | `page.tsx` (L ~screen param); API invoked by fetch from client |
| **State read/write** | `screen-loader.ts`: may call `dispatchState("state:currentView", { value })` when JSON has `state.currentView` (L ~33+) |
| **JSON registries** | Screens under `public/screens/`, `src/apps-offline/`; API reads from filesystem |
| **Status** | **Wired** |

**File refs:** `src/engine/core/screen-loader.ts` (loadScreen), `src/app/api/screens/[...path]/route.ts` (GET).

---

## 3. JsonRenderer + registry

| Attribute | Value |
|-----------|--------|
| **Folder roots** | `src/engine/core/json-renderer.tsx`, `src/engine/core/registry.tsx`, `src/compounds/ui/` |
| **Entrypoints** | `src/app/page.tsx` → `<JsonRenderer ... />`; registry used inside `renderNode` |
| **Public APIs** | `JsonRenderer` (default export), `applyProfileToNode`, `renderNode`; `Registry[type]` component map |
| **Runtime callers** | `page.tsx`; `renderNode` calls `getDefaultSectionLayoutId`, `evaluateCompatibility`, `definitions[type]`, `Registry[type]` |
| **State read/write** | Reads: `getState()`, override stores. No direct write; behavior path writes via dispatchState |
| **JSON registries** | Slot names by type in json-renderer (button, section, card, toolbar, list, footer); NON_ACTIONABLE_TYPES; component definitions from `@/compounds/ui` |
| **Status** | **Wired** |

**File refs:** `src/engine/core/json-renderer.tsx` (JsonRenderer, applyProfileToNode, renderNode ~L93+, ~159+), `src/engine/core/registry.tsx` (Registry).

---

## 4. Layout system (resolver, profiles, compatibility, requirements)

| Attribute | Value |
|-----------|--------|
| **Folder roots** | `src/layout/` (resolver, page, component, compatibility, renderer), `src/lib/layout/` (profiles, presets, template-profiles) |
| **Entrypoints** | `src/layout/index.ts` (re-exports); called from `json-renderer.tsx` → `getDefaultSectionLayoutId`, `evaluateCompatibility`; `Section` compound → `resolveLayout`, `LayoutMoleculeRenderer` |
| **Public APIs** | `resolveLayout`, `getLayout2Ids`, `getDefaultSectionLayoutId`, `evaluateCompatibility`, `getAvailableSlots`, `getRequiredSlots`, `getRequiredSlotsForOrgan`, `LayoutMoleculeRenderer` |
| **Runtime callers** | `json-renderer.tsx` (applyProfileToNode); section compound (resolveLayout, LayoutMoleculeRenderer) |
| **State read/write** | Reads: layout-store (getLayout, getTemplateProfile), section-layout-preset-store, organ-internal-layout-store (passed in). No Layout→State direct write |
| **JSON registries** | `page-layouts.json`, `templates.json`, `template-profiles.ts`, `component-layouts.json`; requirement-registry; layout definitions (row, column, grid, stacked) |
| **Status** | **Wired**. Layout Decision Engine, Trait Registry, Suggestion Injection: **Missing** (docs only) |

**File refs:** `src/layout/index.ts`, `src/layout/resolver/layout-resolver.ts` (resolveLayout, getDefaultSectionLayoutId), `src/layout/page/page-layout-resolver.ts`, `src/layout/component/component-layout-resolver.ts`, `src/layout/compatibility/compatibility-evaluator.ts`, `src/layout/requirements/`, `src/lib/layout/template-profiles.ts`, `src/lib/layout/profile-resolver.ts`, `src/lib/layout/card-layout-presets.ts`, `src/engine/core/json-renderer.tsx` (applyProfileToNode ~L364+).

---

## 5. Organs system

| Attribute | Value |
|-----------|--------|
| **Folder roots** | `src/organs/` (resolve-organs, organ-registry, OrganPanel) |
| **Entrypoints** | `src/app/page.tsx` → `expandOrgansInDocument`, `loadOrganVariant`; `OrganPanel` rendered in page (dev) |
| **Public APIs** | `expandOrgansInDocument`, `loadOrganVariant`, `OrganPanel`; organ-registry lookup |
| **Runtime callers** | `page.tsx`; section/organ nodes resolved in resolve-organs |
| **State read/write** | Reads override stores (organ internal layout); OrganPanel may call setOrganInternalLayoutOverride |
| **JSON registries** | Organ registry (variant IDs); organ-layout-profiles; section requirements for organs |
| **Status** | **Wired** |

**File refs:** `src/organs/resolve-organs.ts`, `src/organs/organ-registry.ts`, `src/organs/OrganPanel.tsx`, `src/app/page.tsx` (expandOrgansInDocument, loadOrganVariant), `src/layout-organ/` (resolveInternalLayoutId).

---

## 6. State system

| Attribute | Value |
|-----------|--------|
| **Folder roots** | `src/state/` (state-store, state-resolver, section-layout-preset-store, organ-internal-layout-store, state-adapter, persistence-adapter, global-scan.state-bridge) |
| **Entrypoints** | `src/state/state-store.ts` — getState, subscribeState, dispatchState; override stores |
| **Public APIs** | `getState`, `subscribeState`, `dispatchState`, `ensureInitialView`, `installStateMutateBridge`; section/card/organ override getters/setters |
| **Runtime callers** | behavior-listener, screen-loader, layout.tsx (navigate → dispatchState), action handlers (run-calculator, resolve-onboarding), json-skin, interaction-controller, state-adapter |
| **State read/write** | Single event log; deriveState replays; persist() → localStorage. Override stores: setSectionLayoutPresetOverride, setCardLayoutPresetOverride, setOrganInternalLayoutOverride |
| **JSON registries** | Persisted log (localStorage); state shape derived from intents |
| **Status** | **Wired** |

**File refs:** `src/state/state-store.ts` (dispatchState L42+, getState L31+, persist), `src/state/state-resolver.ts` (deriveState), `src/state/section-layout-preset-store.ts`, `src/state/organ-internal-layout-store.ts`, `src/state/state-adapter.ts`, `src/state/persistence-adapter.ts`.

---

## 7. Behavior system

| Attribute | Value |
|-----------|--------|
| **Folder roots** | `src/engine/core/behavior-listener.ts`, `src/behavior/` (behavior-runner, behavior-verb-resolver, etc.) |
| **Entrypoints** | `src/app/layout.tsx` → `installBehaviorListener(navigate)`; behavior-listener handles "action", "navigate", "input-change" |
| **Public APIs** | `installBehaviorListener`; `runBehavior(domain, action, ctx, args)`; contract verb set (tap, double, long, etc.); interpretRuntimeVerb → action-runner |
| **Runtime callers** | layout.tsx installs listener; JSON/TSX components fire CustomEvents; runtime-verb-interpreter, action-runner, action-registry |
| **State read/write** | behavior-listener calls dispatchState for state:*, input-change; action handlers (logic) may call dispatchState |
| **JSON registries** | behavior-actions, behavior-navigations, behavior-interactions; contract verb set in behavior-listener |
| **Status** | **Wired** |

**File refs:** `src/engine/core/behavior-listener.ts` (installBehaviorListener, L321 interpretRuntimeVerb), `src/behavior/behavior-runner.ts`, `src/logic/runtime/runtime-verb-interpreter.ts`, `src/logic/runtime/action-runner.ts`, `src/logic/runtime/action-registry.ts`.

---

## 8. Logic engines

| Attribute | Value |
|-----------|--------|
| **Folder roots** | `src/logic/engines/`, `src/logic/engine-system/`, `src/logic/runtime/`, `src/logic/actions/`, `src/logic/content/`, `src/logic/bridges/` |
| **Entrypoints** | **Wired:** runtime-verb-interpreter, action-runner, action-registry, landing-page-resolver, engine-bridge, json-skin.engine, Onboarding-flow-router, content-resolver, skinBindings.apply; **Unreachable from seed:** engine-registry, flow-loader, FlowRenderer, learning/calculator/abc/decision/summary engines |
| **Public APIs** | action-registry handlers (logic:runCalculator, logic:run25x, logic:resolveOnboarding); readEngineState, writeEngineState; resolveOnboardingFromAnswers; resolveContent; applySkinBindings |
| **Runtime callers** | behavior-listener → interpretRuntimeVerb → action-runner → handlers; page.tsx → resolveLandingPage, applySkinBindings; json-renderer → JsonSkinEngine |
| **State read/write** | engine-bridge (read/write engine state); handlers call dispatchState (e.g. run-calculator, resolve-onboarding) |
| **JSON registries** | Flows (flow-a/b/c.json); calculator types (JSON); action names in action-registry |
| **Status** | **Wired** (action path, landing page, skin bindings); **Dormant/Missing** (flow/engine-registry path unreachable from seed) |

**File refs:** `src/logic/runtime/runtime-verb-interpreter.ts`, `src/logic/runtime/action-runner.ts`, `src/logic/runtime/action-registry.ts`, `src/logic/runtime/landing-page-resolver.ts`, `src/logic/runtime/engine-bridge.ts`, `src/logic/engines/json-skin.engine.tsx`, `src/logic/engines/Onboarding-flow-router.tsx`, `src/logic/engines/25x.engine.ts`, `src/logic/actions/run-calculator.action.ts`, `src/logic/actions/resolve-onboarding.action.ts`, `src/logic/engine-system/engine-registry.ts`, `src/logic/flows/flow-loader.ts`, `src/logic/flow-runtime/FlowRenderer.tsx`.

---

## 9. Skin bindings

| Attribute | Value |
|-----------|--------|
| **Folder roots** | `src/logic/bridges/skinBindings.apply.ts`, `src/lib/site-skin/`, `src/engine/core/palette-store.ts` |
| **Entrypoints** | `src/app/page.tsx` → `applySkinBindings(document, ...)`; palette-store used by layout.tsx (usePaletteCSS) |
| **Public APIs** | `applySkinBindings`; palette-store getters/setters; SiteSkin, shells (AppShell, LearningShell, WebsiteShell) |
| **Runtime callers** | page.tsx; layout.tsx (palette); json-renderer (palette subscribe) |
| **State read/write** | Palette store (setPalette etc.); no state-store write from skin apply |
| **JSON registries** | siteSkin schema; palette tokens; shell configs |
| **Status** | **Wired** (applySkinBindings, palette); **Ambiguous** (site-skin compile path used by API/scripts) |

**File refs:** `src/logic/bridges/skinBindings.apply.ts`, `src/app/page.tsx` (L ~42–43), `src/engine/core/palette-store.ts`, `src/lib/site-skin/`, `src/lib/site-renderer/palette-bridge.tsx`.

---

## 10. Palettes / tokens

| Attribute | Value |
|-----------|--------|
| **Folder roots** | `src/palettes/`, `src/engine/core/palette-store.ts`, `src/styles/site-theme.css.ts` |
| **Entrypoints** | `src/app/layout.tsx` → usePaletteCSS (palette-bridge); palette-store subscribe/get |
| **Public APIs** | palette-store: getPalette, setPalette, subscribePalette; default.json (palettes); site-theme.css.ts |
| **Runtime callers** | layout.tsx; json-renderer (subscribePalette) |
| **State read/write** | palette-store in-memory; no state-store |
| **JSON registries** | `src/palettes/default.json.ts`; theme tokens |
| **Status** | **Wired** |

**File refs:** `src/palettes/index.ts`, `src/palettes/default.json.ts`, `src/engine/core/palette-store.ts`, `src/lib/site-renderer/palette-bridge.tsx`, `src/styles/site-theme.css.ts`.

---

## 11. API routes

| Attribute | Value |
|-----------|--------|
| **Folder roots** | `src/app/api/` (screens, flows, google-ads, google-auth, oauth2callback, search-console, local-screens, sites) |
| **Entrypoints** | Next.js route handlers (GET/POST by URL). No static import from app/page or layout |
| **Public APIs** | GET/POST per route: /api/screens/[...path], /api/flows/list, /api/flows/[flowId], /api/sites/[domain]/*, /api/google-ads/*, /api/google-auth, /api/oauth2callback, /api/search-console, /api/local-screens/[...path] |
| **Runtime callers** | HTTP only |
| **State read/write** | Routes may read filesystem, call compiler; no direct state-store from API |
| **JSON registries** | Responses (JSON); sites/pages/skins schema |
| **Status** | **Wired** (by URL); **Ambiguous** (unreachable in static import graph) |

**File refs:** `src/app/api/screens/[...path]/route.ts`, `src/app/api/screens/route.ts`, `src/app/api/flows/list/route.ts`, `src/app/api/flows/[flowId]/route.ts`, `src/app/api/sites/[domain]/route.ts`, `src/app/api/sites/[domain]/schema/route.ts`, `src/app/api/sites/[domain]/screen/route.ts`, `src/app/api/sites/[domain]/pages/route.ts`, `src/app/api/sites/[domain]/skins/route.ts`, `src/app/api/sites/[domain]/onboarding/route.ts`, `src/app/api/sites/[domain]/normalized/route.ts`, `src/app/api/sites/[domain]/debug/route.ts`, `src/app/api/sites/[domain]/brand/route.ts`, `src/app/api/google-ads/route.ts`, `src/app/api/google-auth/route.ts`, `src/app/api/oauth2callback/route.ts`, `src/app/api/search-console/route.ts`, `src/app/api/local-screens/[...path]/route.ts`.

---

## Verification

| Check | Result |
|-------|--------|
| All subsystems enumerated | PASS |
| Folder roots + entrypoints | PASS |
| Public APIs and runtime callers | PASS |
| State surfaces and JSON registries | PASS |
| Status (Wired/Dormant/Missing/Ambiguous) | PASS |
| File paths and function names | PASS |
| Line ranges where cited | PASS_WITH_GAPS (ranges approximate) |

---

*Generated. Deterministic. Regenerate when structure or seed changes.*
