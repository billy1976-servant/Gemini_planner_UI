# Disconnected Systems Report (Generated)

High-signal list of disconnected subsystems (folders or feature clusters). Grouped by domain. For each cluster: **what exists**, **what is missing link**, **where to connect** (docs pointer only; no code changes).

**Source:** [REACHABILITY_REPORT.generated.md](./REACHABILITY_REPORT.generated.md) (module-level reachability from seed). Seed: `src/app/page.tsx`, `src/app/layout.tsx`, `src/engine/core/json-renderer.tsx`, `src/engine/core/behavior-listener.ts`, `src/engine/core/screen-loader.ts`, `src/state/state-store.ts`, `src/layout/index.ts`, `src/logic/runtime/runtime-verb-interpreter.ts`.

---

## Summary

| Domain    | What exists (disconnected) | Missing link | Where to connect (docs) |
|-----------|-----------------------------|--------------|--------------------------|
| Layout    | Layout decision engine, trait registry, suggestion injection (docs only) | No implementation wired into resolver | [LAYOUT_DECISION_ENGINE.md](../ARCHITECTURE_AUTOGEN/LAYOUT_DECISION_ENGINE.md), [SUGGESTION_INJECTION_POINT.md](../ARCHITECTURE_AUTOGEN/SUGGESTION_INJECTION_POINT.md) |
| Logic     | engine-registry, learning/calculator/abc/decision/summary engines, flow-loader, value-comparison, export-resolver | Entry from main app is TSX/flow-only; no import from seed | [ENGINE_WIRING_STATUS.generated.md](../ARCHITECTURE_AUTOGEN/ENGINE_WIRING_STATUS.generated.md), [RUNTIME_CALL_GRAPH.generated.md](./RUNTIME_CALL_GRAPH.generated.md) |
| State     | (All state modules in seed path are reachable) | — | — |
| Behavior  | (behavior-runner is reachable) | — | — |
| Organs    | (resolve-organs, organ-registry, OrganPanel reachable) | — | — |
| Blueprint | Site compiler, skin compile, API routes for sites/skins/pages | API routes not imported; invoked by HTTP only | [BLUEPRINT_TO_RUNTIME_WIRING.md](../ARCHITECTURE_AUTOGEN/BLUEPRINT_TO_RUNTIME_WIRING.md) |
| App/API   | All `src/app/api/**` route handlers | Next.js invokes by URL; no static import from app | — |
| Screens/TSX | engine-viewer, FlowRenderer, onboarding screens, site skins | Loaded by dynamic path (e.g. `?screen=tsx:...`); not in import graph from seed | [RUNTIME_PIPELINE.md](./RUNTIME_PIPELINE.md) |

---

## Layout

**What exists:** Layout resolver, compatibility evaluator, page/component layout resolvers are **reachable** and used by `json-renderer`. Documented but not implemented: Layout Decision Engine (score/rank layout IDs by traits), Trait Registry, Suggestion Injection Point, Contextual Layout Logic, User Preference Adaptation.

**What is missing link:** Resolver never calls a “logic” layer for suggested layout ID; precedence is override → explicit → template default. No trait-registry.json or layout-traits loader in runtime.

**Where to connect:** See [LAYOUT_DECISION_ENGINE.md](../ARCHITECTURE_AUTOGEN/LAYOUT_DECISION_ENGINE.md), [SUGGESTION_INJECTION_POINT.md](../ARCHITECTURE_AUTOGEN/SUGGESTION_INJECTION_POINT.md), [TRAIT_REGISTRY_SYSTEM.md](../ARCHITECTURE_AUTOGEN/TRAIT_REGISTRY_SYSTEM.md), [CONTEXTUAL_LAYOUT_LOGIC.md](../ARCHITECTURE_AUTOGEN/CONTEXTUAL_LAYOUT_LOGIC.md). Connection point in code (for future work): `applyProfileToNode` in `src/engine/core/json-renderer.tsx` and `getDefaultSectionLayoutId` / resolver in `src/layout/`.

---

## Logic (engines and flow)

**What exists:** `src/logic/engine-system/engine-registry.ts`, `src/logic/engines/learning.engine.ts`, `calculator.engine.ts`, `abc.engine.ts`, `decision/decision.engine.ts`, `summary/summary.engine.ts`, `flow-router.ts`, `flow-loader.ts`, `FlowRenderer.tsx`, value-comparison and value-translation engines, export-resolver, engine-explain.

**What is missing link:** These are only imported by TSX screens (engine-viewer, onboarding, flow UIs) and by flow-loader. No import path from the eight seed entrypoints; therefore they are **unreachable** in the static import graph. They run only when user navigates to a flow/onboarding/TSX screen (e.g. `?screen=tsx:tsx-screens/onboarding/engine-viewer` or `?flow=...`).

**Where to connect:** [ENGINE_WIRING_STATUS.generated.md](../ARCHITECTURE_AUTOGEN/ENGINE_WIRING_STATUS.generated.md) (DISCONNECTED table), [RUNTIME_CALL_GRAPH.generated.md](./RUNTIME_CALL_GRAPH.generated.md) (“Engines NOT Reached During Runtime”). To make them “reachable” from seed you would add an import from a seed module (e.g. layout or page) to engine-registry or flow-loader — not required for current behavior.

---

## State

**What exists:** state-store, state-resolver, section-layout-preset-store, organ-internal-layout-store are **reachable** and used.

**What is missing link:** Nothing; state layer is wired from layout, page, behavior-listener.

**Where to connect:** N/A. See [STATE_AND_OVERRIDE_ORCHESTRATION.md](../ARCHITECTURE_AUTOGEN/STATE_AND_OVERRIDE_ORCHESTRATION.md).

---

## Behavior

**What exists:** behavior-runner, behavior-listener are **reachable**. Contract verbs (tap, double, long, etc.) and runtime verbs (action-runner, runtime-verb-interpreter) are on the main path.

**What is missing link:** None for main path.

**Where to connect:** N/A. See [BEHAVIOR_EVENT_WIRING.generated.md](../ARCHITECTURE_AUTOGEN/BEHAVIOR_EVENT_WIRING.generated.md).

---

## Organs

**What exists:** resolve-organs, organ-registry, OrganPanel are **reachable** from page.tsx.

**What is missing link:** None.

**Where to connect:** N/A. See [ORGAN_EXPANSION_CONTRACT.generated.md](../ARCHITECTURE_AUTOGEN/ORGAN_EXPANSION_CONTRACT.generated.md).

---

## Blueprint / site compiler

**What exists:** `src/lib/site-compiler/`, `src/lib/site-skin/compileSkinFromBlueprint`, `src/app/api/sites/**` (sites, pages, skins, schema, onboarding, normalized, etc.). Scripts: `src/scripts/websites/compile.ts`, `build-site.ts`, adapters.

**What is missing link:** API routes are invoked by HTTP (Next.js routing), not by static import. Site compiler and skin compilation are used by API handlers or scripts; no import from seed entrypoints.

**Where to connect:** [BLUEPRINT_TO_RUNTIME_WIRING.md](../ARCHITECTURE_AUTOGEN/BLUEPRINT_TO_RUNTIME_WIRING.md), [BLUEPRINT_RUNTIME_INTERFACE.generated.md](../ARCHITECTURE_AUTOGEN/BLUEPRINT_RUNTIME_INTERFACE.generated.md). Connection is by URL (e.g. `/api/sites/[domain]/...`), not by module import.

---

## App / API routes

**What exists:** All route handlers under `src/app/api/` (screens, sites, flows, google-ads, search-console, oauth2callback, etc.) and `src/app/sites/[domain]/page.tsx`, `not-found.tsx`.

**What is missing link:** Next.js invokes these by request URL; they are never imported by other app code. So they are **unreachable** in the static import graph by design.

**Where to connect:** N/A for reachability. For “camera” view they are documented as entrypoints by URL in [RUNTIME_PIPELINE.md](./RUNTIME_PIPELINE.md) and API surface docs.

---

## Screens / TSX and flow UIs

**What exists:** `src/screens/tsx-screens/**` (onboarding, engine-viewer, flows, skins, calculators, etc.), `src/logic/flow-runtime/FlowRenderer.tsx`, `src/logic/ui-bindings/engine-viewer.tsx`, integration-flow-engine.

**What is missing link:** These are loaded by **dynamic** path (e.g. `loadScreen("tsx:tsx-screens/onboarding/engine-viewer")`) or by flow param. They are not statically imported from the seed set; hence they appear **unreachable** in the import-based reachability report.

**Where to connect:** [RUNTIME_PIPELINE.md](./RUNTIME_PIPELINE.md), [ENGINE_WIRING_STATUS.generated.md](../ARCHITECTURE_AUTOGEN/ENGINE_WIRING_STATUS.generated.md). To see “what is wired” for TSX screens, use runtime call graph and screen-loader’s TSX branch; no code change needed for docs.

---

## Scripts and diagnostics

**What exists:** `src/scripts/**` (blueprint, contract-report, pipeline-proof, websites, onboarding, etc.), `src/diagnostics/`, `src/compiler/`, `src/web2extractor/`, `src/map (old)/`.

**What is missing link:** Run by CLI (e.g. `npm run blueprint`, `npm run website`); not imported by the app. **Unreachable** from seed.

**Where to connect:** Document as “offline/CLI” entrypoints. No connection into app seed set required.

---

*Autogenerated. Regenerate REACHABILITY_REPORT then review this report when adding or removing entrypoints.*
