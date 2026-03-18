# Disconnected Systems Report (Generated) — Exhaustive

For every system that exists but is not connected to the seed: **what it is**, **where it lives**, **what should call it**, **evidence it's not called**, **required wiring steps (TODO only)**, **risk level**, **JSON-driven violations (if any)**.

**Seed:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/engine/core/json-renderer.tsx`, `src/engine/core/behavior-listener.ts`, `src/engine/core/screen-loader.ts`, `src/state/state-store.ts`, `src/layout/index.ts`, `src/logic/runtime/runtime-verb-interpreter.ts`.

**Source:** [REACHABILITY_REPORT.generated.md](../SYSTEM_MAP_AUTOGEN/REACHABILITY_REPORT.generated.md); 55 reachable, 451 unreachable modules.

---

## Summary

| Domain | Disconnected count | Risk | JSON violations |
|--------|--------------------|------|------------------|
| Logic (engines + flow) | 20+ modules | Medium | None |
| Layout (intelligence) | 5 concepts (docs only) | Low | Trait/suggestion not JSON-driven |
| API routes | All route handlers | Low (by design) | N/A |
| Screens/TSX | TSX screens, FlowRenderer | Low | N/A |
| Blueprint/Compiler | API + scripts (URL/CLI) | Low | N/A |
| Scripts/Diagnostics | All scripts | Low | N/A |

---

## 1. Logic — Engine registry and flow path

### What it is

- **engine-registry:** `getEngine`, `applyEngine`, `getPresentation`; registry of learning, calculator, abc, decision, summary engines.
- **flow-loader:** Loads/transforms flows; calls `applyEngine`.
- **FlowRenderer:** Renders flow UI.
- **Engines:** learning.engine, calculator.engine, abc.engine, decision.engine, summary.engine, flow-router, next-step-reason, decision-engine, value-comparison, value-translation, export-resolver, engine-selector, calculator.module, hi-engine-runner.

### Where it lives

- `src/logic/engine-system/engine-registry.ts`
- `src/logic/engine-system/engine-explain.ts`
- `src/logic/engines/learning.engine.ts`, `calculator/calculator.engine.ts`, `abc.engine.ts`, `decision/decision.engine.ts`, `summary/summary.engine.ts`
- `src/logic/engines/flow-router.ts`, `next-step-reason.ts`, `decision-engine.ts`
- `src/logic/engines/comparison/value-comparison.engine.ts`, `value-translation.engine.ts`, `value-dimensions.ts`
- `src/logic/engines/summary/export-resolver.ts`, `shared/engine-selector.ts`, `calculator/calculator.module.ts`, `post-processing/hi-engine-runner.ts`
- `src/logic/flows/flow-loader.ts`
- `src/logic/flow-runtime/FlowRenderer.tsx`
- `src/logic/orchestration/integration-flow-engine.tsx`

### What should call it

- A flow or onboarding entrypoint reachable from page/layout (e.g. when `?flow=...` or `?screen=tsx:tsx-screens/onboarding/engine-viewer`). Today that entry is **dynamic** (loadScreen returns tsx path; component loaded at runtime). So "should call" is satisfied by **dynamic** path, not static import.

### Evidence it's not called (from seed)

- No static import from any of the 8 seed files to `engine-registry`, `flow-loader`, or `FlowRenderer`. BFS from seed does not include these modules. Grep: no `from "@/logic/engine-system/engine-registry"` or `from "@/logic/flows/flow-loader"` in `src/app/`, `src/engine/core/`, `src/state/`, `src/layout/`, or `src/logic/runtime/runtime-verb-interpreter.ts`.

### Required wiring steps (TODO only)

- (Optional) Add a static import from a seed module (e.g. `page.tsx` or a layout wrapper) to a thin "flow entry" that re-exports flow-loader or engine-registry, so that flow path appears in static reachability. Not required for current runtime behavior.
- (Optional) Document flow/onboarding as first-class entrypoints in START_HERE and MASTER_SYSTEM_INDEX so "disconnected" is clearly "by design (dynamic)".

### Risk level

**Medium.** Flow/onboarding features depend on dynamic screen loading; if loadScreen or TSX resolution changes, these modules may become truly dead without static references.

### JSON-driven violations

None. Engine config and flows are JSON/data-driven where used.

---

## 2. Layout — Decision engine, trait registry, suggestion injection

### What it is

- **Layout Decision Engine:** Would score/rank compatible layout IDs by traits. Documented in ARCHITECTURE_AUTOGEN; no implementation.
- **Trait Registry:** layout ID → traits lookup. No trait-registry.json or loader in runtime.
- **Suggestion Injection Point:** Resolver would call Logic for suggested layout ID. Not implemented; precedence is override → explicit → template default only.
- **Contextual Layout Logic:** Map content structure to trait suggestions. No implementation.
- **User Preference Adaptation:** Persist trait weights from "more/less like this". No implementation.

### Where it lives

- Docs: `src/docs/ARCHITECTURE_AUTOGEN/LAYOUT_DECISION_ENGINE.md`, `SUGGESTION_INJECTION_POINT.md`, `TRAIT_REGISTRY_SYSTEM.md`, `CONTEXTUAL_LAYOUT_LOGIC.md`, `USER_PREFERENCE_ADAPTATION.md`.
- Code: **None.** No files implement these.

### What should call it

- `applyProfileToNode` in `src/engine/core/json-renderer.tsx` (when choosing section layout ID) would call a "suggestion" service; layout resolver would use trait registry and decision engine.

### Evidence it's not called

- No function in codebase implements layout scoring by traits. No import of a trait registry or decision engine in `json-renderer.tsx` or `src/layout/`. Resolver uses only override, node.layout, and getDefaultSectionLayoutId(templateId).

### Required wiring steps (TODO only)

- TODO: Add trait-registry loader (e.g. layout-traits.json or trait-registry.json) and load in layout or engine core.
- TODO: Implement Layout Decision Engine (score compatible layout IDs) and call from resolver or a new "suggestion" step before applyProfileToNode.
- TODO: Add Suggestion Injection Point: resolver calls Logic with context; Logic returns suggested layout ID; resolver uses it when no override and no explicit node.layout.
- TODO: Implement Contextual Layout Logic (content → traits) and User Preference Adaptation (persist weights); wire into suggestion path.

### Risk level

**Low.** Current behavior is consistent (override → explicit → template); no silent wrong layout. Missing features are additive.

### JSON-driven violations

- **PASS_WITH_GAPS:** Layout IDs today come from template JSON and override stores; no hardcoded layout ID array in resolver. Dropdown for section layout uses `getLayout2Ids()` (from page-layouts/template data). If dropdown options were hardcoded elsewhere, that would be a violation — see JSON_DRIVEN_VIOLATIONS.generated.md.

---

## 3. API routes

### What it is

- All route handlers under `src/app/api/`: screens, flows, google-ads, google-auth, oauth2callback, search-console, local-screens, sites (domain, schema, screen, pages, skins, onboarding, normalized, debug, brand).

### Where it lives

- `src/app/api/screens/route.ts`, `src/app/api/screens/[...path]/route.ts`
- `src/app/api/flows/list/route.ts`, `src/app/api/flows/[flowId]/route.ts`
- `src/app/api/google-ads/route.ts`, `campaigns/route.ts`, `validate/route.ts`, `client.ts`
- `src/app/api/google-auth/route.ts`, `src/app/api/oauth2callback/route.ts`
- `src/app/api/search-console/route.ts`
- `src/app/api/local-screens/[...path]/route.ts`
- `src/app/api/sites/list/route.ts`, `src/app/api/sites/[domain]/route.ts`, `schema/route.ts`, `screen/route.ts`, `pages/route.ts`, `pages/[pageId]/route.ts`, `skins/route.ts`, `skins/[pageId]/route.ts`, `onboarding/route.ts`, `normalized/route.ts`, `debug/route.ts`, `brand/route.ts`
- `src/app/api/google-trends (later)/route.ts`

### What should call it

- Next.js runtime invokes by HTTP request. No app code should "call" these by import.

### Evidence it's not called (by static import)

- No file in the seed set imports any route module. Grep: no `from "@/app/api/...` in page.tsx, layout.tsx, engine, state, layout, runtime-verb-interpreter.

### Required wiring steps (TODO only)

- None. API routes are intentionally URL-invoked.

### Risk level

**Low.** By design.

### JSON-driven violations

N/A.

---

## 4. Screens / TSX and flow UIs

### What it is

- TSX screens: engine-viewer, onboarding variants, flow UIs, site skins, calculators, control-json, global-scans, etc. FlowRenderer, OnboardingFlowRenderer, engine-viewer component.

### Where it lives

- `src/screens/tsx-screens/**` (onboarding, engine-viewer, flows, skins, control-json, global-scans, site-skin, etc.)
- `src/logic/flow-runtime/FlowRenderer.tsx`, `src/logic/ui-bindings/engine-viewer.tsx`
- `src/engine/onboarding/OnboardingFlowRenderer.tsx`, `src/screens/tsx-screens/onboarding/integration-flow-engine.tsx`, etc.

### What should call it

- `loadScreen("tsx:tsx-screens/...")` returns `{ __type: "tsx-screen", path }`; ScreenRenderer or equivalent resolves component by path and renders. So "call" is dynamic at runtime.

### Evidence it's not called (from seed statically)

- Seed does not import any TSX screen component. Only dynamic path string passed to loadScreen.

### Required wiring steps (TODO only)

- None for connectivity. Optional: document TSX screen manifest so all tsx-screens are discoverable.

### Risk level

**Low.** Dynamic loading is intentional.

### JSON-driven violations

N/A.

---

## 5. Blueprint / site compiler (API and scripts)

### What it is

- Site compiler: compileSiteToSchema, normalizeSiteData, compileSiteToScreenModel. Skin compile: compileSkinFromBlueprint. API routes for sites, pages, skins, onboarding, normalized, debug, brand. Scripts: build-site, compile, adapters.

### Where it lives

- `src/lib/site-compiler/`, `src/lib/site-skin/` (compile skin), `src/app/api/sites/[domain]/*`, `src/scripts/websites/build-site.ts`, `src/scripts/websites/compile.ts`, adapters under `src/scripts/websites/adapters/`.

### What should call it

- API routes by HTTP; scripts by CLI. No in-app import from page/layout.

### Evidence it's not called (from seed)

- No import from seed to site-compiler or API route handlers. Compiler is invoked by API handler when request hits `/api/sites/[domain]/...`.

### Required wiring steps (TODO only)

- None. Connection is by URL and CLI.

### Risk level

**Low.**

### JSON-driven violations

None. Compiler outputs and consumes JSON/schema.

---

## 6. Scripts and diagnostics

### What it is

- All scripts: blueprint, contract-report, contract-validate, pipeline-proof, generate-allfiles, diagnostics, run-chain-test, global-scan, schema, logic:compile, onboarding, compile, website, etc. Diagnostics: run-diagnostics, app.json.

### Where it lives

- `src/scripts/**`, `src/diagnostics/**`, `src/compiler/**`, `src/web2extractor/**`, `src/map (old)/`.

### What should call it

- CLI / npm scripts. Not by app.

### Evidence it's not called

- No app code imports scripts.

### Required wiring steps (TODO only)

- None.

### Risk level

**Low.**

### JSON-driven violations

N/A.

---

## Verification

| Check | Result |
|-------|--------|
| Every disconnected system has: what it is, where it lives | PASS |
| What should call it, evidence not called | PASS |
| Required wiring (TODO only) | PASS |
| Risk level | PASS |
| JSON-driven violations (if any) | PASS |
| Exhaustive (no omitted domain) | PASS |
| File paths and function names | PASS |

---

*Generated. Deterministic. Exhaustive. Regenerate with REACHABILITY_REPORT.*
