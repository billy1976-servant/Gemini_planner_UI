# ENGINE_INDEX.md — Core runtime files (exact paths)

**Purpose:** Single index of core runtime modules so an engineer can locate renderer, loader, registry, layout, behavior, state, and blueprint/site compiler without guessing.

---

## 1. Renderer

| Role | Path | Notes |
|------|------|--------|
| **JSON screen renderer** | `src/engine/core/json-renderer.tsx` | Renders screen tree; uses Registry, palette, layout profile, `renderNode` |
| **Registry (type → component)** | `src/engine/core/registry.tsx` | Maps JSON `type` to React components (atoms/molecules/screen/grid) |
| **Layout molecule renderer** | `src/layout/renderer/LayoutMoleculeRenderer.tsx` | Renders layout molecules; used by section/card compounds |
| **Site skin / schema renderer** | `src/lib/site-skin/SiteSkin.tsx` | Composes screen from schema; uses `composeScreen`, JsonRenderer |
| **Generated site viewer** | `src/engine/site-runtime/GeneratedSiteViewer.tsx` | Fetches compiled SiteSchema + NormalizedSite; renders via `renderLayoutBlocks` |
| **Render from schema** | `src/lib/site-renderer/renderFromSchema.tsx` | Renders layout blocks from schema; `handleAction` for site actions |

---

## 2. Loader (screen + site)

| Role | Path | Notes |
|------|------|--------|
| **Screen loader** | `src/engine/core/screen-loader.ts` | `loadScreen(path)`: TSX → `{ __type: "tsx-screen", path }`; JSON → fetch `/api/screens/...`, apply default state, return JSON |
| **Site loader** | `src/engine/core/site-loader.ts` | Site-level loading (if used) |
| **API screens route** | `src/app/api/screens/[...path]/route.ts` | GET: resolves JSON from `src/apps-json/apps`, or TSX marker from `src/apps-tsx`; returns JSON or `{ __tsx__: true, screen }` |
| **API screens list** | `src/app/api/screens/route.ts` | Screens list endpoint |

---

## 3. Registry

| Role | Path | Notes |
|------|------|--------|
| **Component registry** | `src/engine/core/registry.tsx` | JSON `type` → React component (see Renderer) |
| **Compound definitions** | `src/compounds/ui/index.ts` + `definitions/*.json` | Compound definitions; used by json-renderer |
| **Organ registry** | `src/organs/organ-registry.ts` / `resolve-organs.ts` | Organ variant loading; `loadOrganVariant` |
| **Engine registry** | `src/logic/engine-system/engine-registry.ts` | Execution engines (learning, calculator, decision, summary, abc, etc.); `getPresentation`, `getAvailableEngines`, `applyEngine` |
| **Layout requirement registry** | `src/layout/compatibility/requirement-registry.ts` | Reads section/card/organ requirement JSONs; `getRequiredSlots`, `getRequiredSlotsForOrgan` |

---

## 4. Layout

| Role | Path | Notes |
|------|------|--------|
| **Layout store** | `src/engine/core/layout-store.ts` | `getLayout`, `setLayout`, `subscribeLayout`; layout mode / template / experience |
| **Current screen tree store** | `src/engine/core/current-screen-tree-store.ts` | `getCurrentScreenTree`, `setCurrentScreenTree` |
| **Unified layout resolver** | `src/layout/resolver/layout-resolver.ts` | `resolveLayout(layoutId, context)`; merges page + component layout |
| **Layout module index** | `src/layout/index.ts` | Re-exports page, component, resolver, compatibility, LayoutMoleculeRenderer |
| **Page layout** | `src/layout/page/page-layout-resolver.ts`, `page-layouts.json` | Page-level section placement; `getPageLayoutById`, `getPageLayoutIds`, `getDefaultSectionLayoutId` |
| **Component layout** | `src/layout/component/component-layout-resolver.ts`, `component-layouts.json` | Inner molecule layout (column/row/grid/stacked) |
| **Organ layout** | `src/layout-organ/organ-layout-resolver.ts`, `organ-layout-profiles.json` | Organ-level layout profiles |
| **Compatibility** | `src/layout/compatibility/compatibility-evaluator.ts`, `content-capability-extractor.ts` | Slot requirements vs content; `evaluateCompatibility`, `getAvailableSlots` |
| **Compose offline screen** | `src/lib/screens/compose-offline-screen.ts` | `composeOfflineScreen`; infers section roles (header/hero/content/...) |
| **Section layout preset store** | `src/state/section-layout-preset-store.ts` | Per-screen, per-section layout preset overrides |
| **Organ internal layout store** | `src/state/organ-internal-layout-store.ts` | Per-screen, per-section organ internal layout overrides |
| **Profile/template** | `src/lib/layout/profile-resolver.ts`, `template-profiles.ts` | Experience profile, template profile (template dropdown) |

---

## 5. Behavior

| Role | Path | Notes |
|------|------|--------|
| **Behavior listener** | `src/engine/core/behavior-listener.ts` | `installBehaviorListener(navigate)`; listens for `navigate`, `action`; routes state:*, navigate, contract verbs to runner or state |
| **Behavior runner** | `src/behavior/behavior-runner.ts` | `runBehavior(domain, action, ctx, args)`; uses behavior-verb-resolver, interactions, navigations, BehaviorEngine |
| **Behavior verb resolver** | `src/behavior/behavior-verb-resolver.ts` | Resolves (domain, action) to handler name |
| **Behavior interactions** | `src/behavior/behavior-interactions.json` | Flat map: tap, double, long, drag, scroll, swipe → handler names |
| **Behavior navigations** | `src/behavior/behavior-navigations.json` | Nested: go/back/open/close/route + variants → handler names |
| **Behavior engine** | `src/behavior/behavior-engine.ts` | Handler implementations (e.g. nav.goScreen, interact.tap) |
| **Runtime verb interpreter** | `src/logic/runtime/runtime-verb-interpreter.ts` | `interpretRuntimeVerb(verb, state)`; normalizes and forwards to action-runner |
| **Action runner** | `src/logic/runtime/action-runner.ts` | Runs actions from runtime verbs |

---

## 6. State

| Role | Path | Notes |
|------|------|--------|
| **State store** | `src/state/state-store.ts` | `getState`, `subscribeState`, `dispatchState(intent, payload)`; append-only log, derive on each dispatch |
| **State resolver** | `src/state/state-resolver.ts` | `deriveState(log)`; intents: state:currentView, journal.set/add, state.update, scan.*, interaction.record |
| **State types** | `src/state/state.ts` | `StateEvent`, derived state shape (if defined here) |
| **Subscribe alias** | `src/state/state-store.ts` exports `subscribeState`; json-renderer uses `subscribeState`, `getState` from `@/state/state-store` |

---

## 7. Blueprint / site compiler

| Role | Path | Notes |
|------|------|--------|
| **Blueprint script** | `src/scripts/blueprint.ts` | Parses blueprint.txt; produces nodes; file-based, not used at runtime as “compiler” |
| **Site compiler (normalize)** | `src/lib/site-compiler/normalizeSiteData.ts` | Normalizes site data; uses compiler/* (extractAttributes, detectBaseModels, groupProductsByModel, etc.) |
| **Site compiler (schema)** | `src/lib/site-compiler/compileSiteToSchema.ts` | `compileSiteToSchema(domain)` → SiteSchema |
| **Product compiler pipeline** | `src/compiler/*.ts` | extractAttributes, detectBaseModels, groupProductsByModel, detectVariantDimensions, mapImagesToVariants, buildNormalizedModels |
| **Product screen adapter** | `src/lib/product-screen-adapter/compileProductDataToScreen.ts` | Compiles product data to offline JSON screen format |

---

## 8. Entry (app root)

| Role | Path | Notes |
|------|------|--------|
| **App layout** | `src/app/layout.tsx` | Palette, layout store, template list, `installBehaviorListener`, experience profiles, `dispatchState` |
| **App page** | `src/app/page.tsx` | Screen param → loadScreen; TSX vs JSON branch; expandOrgansInDocument; composeOfflineScreen; JsonRenderer |

All paths are relative to repo root (`HiSense/`).
