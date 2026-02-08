# 07 — System Map

**Source:** Compiled from `src/docs/SYSTEM_MAP_AUTOGEN/REACHABILITY_REPORT.generated.md`, `RUNTIME_CALL_GRAPH.generated.md`, `src/system-reports/summaries/AI_SNAPSHOT_PACK.md`, snapshot SYSTEM_SUMMARY.md.

---

## Reachability summary

| Status | Count |
|--------|-------|
| REACHABLE | 110 |
| UNREACHABLE | 401 |

**Seed entrypoints:** src/app/page.tsx, src/app/layout.tsx, src/engine/core/json-renderer.tsx, src/engine/core/behavior-listener.ts, src/engine/core/screen-loader.ts, src/state/state-store.ts, src/layout/index.ts, src/engine/core/registry.tsx, src/state/state-resolver.ts, src/logic/runtime/action-registry.ts, src/logic/runtime/runtime-verb-interpreter.ts.

**Note:** API routes (e.g. GET /api/screens/[...path]) are invoked by fetch; exclude from module reachability seed when listing runtime entrypoints.

---

## REACHABLE modules (by folder — key groups)

- **src/app/** — layout.tsx, page.tsx
- **src/behavior/** — behavior-runner.ts, contract-verbs.ts
- **src/components/9-atoms/primitives/** — collection, condition, field, media, sequence, shell, surface, text, trigger
- **src/compounds/ui/**, **12-molecules/** — index + avatar, button, card, chip, field, footer, list, modal, section, stepper, toast, toolbar
- **src/engine/core/** — behavior-listener, collapse-layout-nodes, current-screen-tree-store, json-renderer, layout-store, palette-*, registry, screen-loader
- **src/layout/** — index, layout-node-types; resolver, page, component, compatibility; renderer/LayoutMoleculeRenderer
- **src/lib/layout/** — card-layout-presets, molecule-layout-resolver, template-profiles, profile-resolver, definitions-molecule, layout-engine, molecules, presentation
- **src/lib/screens/** — compose-offline-screen
- **src/state/** — state-store, state-resolver, section-layout-preset-store, organ-internal-layout-store
- **src/logic/runtime/** — runtime-verb-interpreter, action-runner, action-registry, engine-bridge, landing-page-resolver
- **src/logic/engines/** — json-skin.engine (on main path); Onboarding-flow-router via landing-page-resolver
- **src/organs/** — resolve-organs, organ-registry (used by page.tsx)
- **src/contracts/** — expected-params.ts

Full list: see REACHABILITY_REPORT.generated.md (REACHABLE modules by folder).

---

## Runtime call graph (execution stages)

**Stage 1 — App entry:** layout.tsx (RootLayout) → palette, layout-store, current-screen-tree-store, dispatchState, installBehaviorListener, setLayout, fetch /api/screens, children → Page. page.tsx (Page) → searchParams, loadScreen, resolveLandingPage, assignSectionInstanceKeys, expandOrgansInDocument, applySkinBindings, composeOfflineScreen, setCurrentScreenTree, override stores, JsonRenderer, SectionLayoutDropdown, OrganPanel.

**Stage 2 — Screen resolution:** loadScreen (TSX descriptor or fetch); landing-page-resolver (getState, readEngineState, resolveOnboardingFromAnswers, resolveContent); API route GET (SCREENS_ROOT, TSX_ROOT).

**Stage 3 — Layout resolution:** json-renderer applyProfileToNode → getDefaultSectionLayoutId, evaluateCompatibility, getCardLayoutPreset; layout-resolver resolveLayout → getPageLayoutId, getPageLayoutById, resolveComponentLayout; section.compound → resolveLayout, LayoutMoleculeRenderer or div.

**Stage 4 — Render pipeline:** JsonRenderer (useSyncExternalStore layout/state/palette, applyProfileToNode, renderNode); renderNode (JsonSkinEngine, shouldRenderNode, Registry, Section → LayoutMoleculeRenderer).

**Stage 5 — Behavior:** behavior-listener (action, navigate, input-change) → dispatchState, runBehavior, interpretRuntimeVerb → action-runner → action-registry handlers.

Full hop-by-hop: RUNTIME_CALL_GRAPH.generated.md.

---

## Centrality (top files — from system-reports)

| Path | Centrality | Role |
|------|------------|------|
| src/state/state-store.ts | 27.0 | state |
| src/lib/layout/molecule-layout-resolver.ts | 17.0 | — |
| src/logic/flows/flow-loader.ts | 17.0 | — |
| src/components/9-atoms/primitives/surface.tsx | 15.5 | primitives |
| src/engine/core/palette-resolver.ts | 15.5 | engines |
| src/engine/core/json-renderer.tsx | 15.0 | engines |
| src/logic/runtime/engine-bridge.ts | 15.0 | — |
| src/engine/core/registry.tsx | 14.5 | engines |
| src/app/page.tsx | 12.5 | runtime_core |
| src/engine/core/layout-store.ts | 10.5 | engines |

---

## Export hubs (high in-degree)

state-store, surface.tsx, palette-resolver, molecule-layout-resolver, engine-bridge, flow-loader, collection/sequence/text.tsx, normalizeSiteData, trigger.tsx, layout-store, pipeline-debug-store, pipelineStageTrace.

---

## Trunk entry points (pipeline start)

- src/app/page.tsx
- src/app/api/screens/[...path]/route.ts
- src/engine/core/screen-loader.ts

---

## Suspected trunk candidates (state/layout/engine)

state-store, palette-resolver, json-renderer, registry, page.tsx, layout-store, palette-resolve-token, pipelineStageTrace, OnboardingFlowRenderer, GeneratedSiteViewer.

---

## Disconnected systems (by domain)

**Source:** DISCONNECTED_SYSTEMS_REPORT.generated.md. Reachability from seed is static import-based; API routes and TSX screens are invoked by URL or dynamic path, not by import from seed.

| Domain | What exists (disconnected) | Missing link | Where to connect (docs) |
|--------|----------------------------|--------------|--------------------------|
| Layout | Layout Decision Engine, trait registry, suggestion injection (docs only) | No implementation wired into resolver | LAYOUT_DECISION_ENGINE.md, SUGGESTION_INJECTION_POINT.md |
| Logic | engine-registry, learning/calculator/abc/decision/summary engines, flow-loader, value-comparison, export-resolver | Entry from main app is TSX/flow-only; no import from seed | ENGINE_WIRING_STATUS.generated.md, RUNTIME_CALL_GRAPH.generated.md |
| State | (All state modules on seed path are reachable) | — | — |
| Behavior | (behavior-runner reachable) | — | — |
| Organs | (resolve-organs, organ-registry, OrganPanel reachable) | — | — |
| Blueprint | Site compiler, skin compile, API routes for sites/skins/pages | API routes invoked by HTTP only; not in import graph | BLUEPRINT_TO_RUNTIME_WIRING.md |
| App/API | All src/app/api/** route handlers | Next.js invokes by URL; never imported by app code | — |
| Screens/TSX | engine-viewer, FlowRenderer, onboarding screens, site skins | Loaded by dynamic path (?screen=tsx:... or ?flow=...); not in import graph from seed | RUNTIME_PIPELINE.md, ENGINE_WIRING_STATUS |

---

## Reachability notes

- **REACHABLE:** Module is reachable from seed set via static imports. **UNREACHABLE:** No import path from seed; may still run at runtime via dynamic load (TSX) or HTTP (API).
- **First break:** For each UNREACHABLE module, reachability report lists first break (reason). Full list in REACHABILITY_REPORT.generated.md.
- **ENGINE_INDEX, RUNTIME_PIPELINE:** SYSTEM_MAP_AUTOGEN contains ENGINE_INDEX.md (core runtime files) and RUNTIME_PIPELINE.md (runtime call chain); use for TSX/flow wiring and camera-layer entrypoints.
