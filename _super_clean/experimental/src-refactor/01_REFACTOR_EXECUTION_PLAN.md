# 01 — Refactor Execution Plan

**Purpose:** Structured breakdown of the master architecture into execution blocks. This is NOT new architecture; it is extraction and structuring of the existing document for analysis, validation, and execution planning.

---

## 1. Spine lock definition (Phase 1 — LOCKED)

- **Authoritative flow:** JSON Screen → Engines → State → Layout → Renderer → DOM (HiSense) = JSON Screen → Engines → State → Layout → Renderer → Final Screen (HIClarify Section 3). This is the permanent runtime contract.
- **Lock:** This order is inviolable. No stage may be skipped or reordered on the primary path. Nothing bypasses the spine. See [00_HICLARIFY_LEVEL10_EXECUTION_LOCK.md](00_HICLARIFY_LEVEL10_EXECUTION_LOCK.md) Section 3.
- **Key files per stage:**
  - JSON Screen: page.tsx, api/screens/[...path]/route.ts, screen-loader.ts
  - Engines: page.tsx (assignSectionInstanceKeys, expandOrgansInDocument, applySkinBindings, composeOfflineScreen); behavior-listener; behavior-runner; engine-bridge
  - State: state-store.ts, state-resolver.ts
  - Layout: layout/resolver/layout-resolver.ts, layout-store.ts, molecule-layout-resolver
  - Renderer: json-renderer.tsx, registry.tsx, section.compound.tsx, LayoutMoleculeRenderer.tsx
  - DOM: data-node-id, data-section-id, data-section-layout, data-container-width
- **Execution implication:** Any refactor must preserve this spine; validation must assert the pipeline order.

---

## 2. Engine separation plan

- **Primary renderer:** JsonRenderer only for main JSON path.
- **Secondary:** renderFromSchema, GeneratedSiteViewer, SiteSkin (site/TSX flows). Must be documented and isolated.
- **DEAD / PARTIAL:** ScreenRenderer, EngineRunner — remove or wire; document DEAD.
- **ACTIVE engines (main path):** JsonSkinEngine, Onboarding-flow-router, engine-bridge, action-runner, action-registry, 25x, resolve-onboarding, run-calculator, layout resolver/compatibility, content-resolver, skinBindings.apply, runtime-verb-interpreter (logic/runtime only).
- **DISCONNECTED:** Flow/engine-registry path (learning, calculator, decision, summary, flow-router); Layout Decision Engine, Contextual Layout Logic, Trait Registry (documented, not implemented).
- **Execution implication:** Single runtime-verb-interpreter (logic/runtime); single content-resolver; no engine/runtime interpreter on main path. Engine registry and flow path documented as TSX/flow-only.

---

## 3. State contract stabilization

- **Single source of truth:** state-store holds append-only log; state = deriveState(log).
- **Derived shape:** currentView, journal, values, layoutByScreen, scans, interactions (and rawCount).
- **Intents (single reference):** state:currentView, state.update, journal.set/add, scan.result/interpreted, interaction.record. New intents require state-resolver branch + contract doc.
- **Bounded write surfaces:** All dispatchState call sites must be listed (STATE_MUTATION_SURFACE_MAP); no new surfaces without contract update.
- **ensureInitialView:** Default view from config or omit; no invented "|home" without contract.
- **Execution implication:** State mutation surface audit; state intents single reference doc; no new state surfaces without contract; persistence contract documented (localStorage key, log shape, rehydration).

---

## 4. Event stream persistence model

- **Format:** Append-only event log. Each entry: { intent, payload }.
- **Storage:** localStorage (key defined in state-store). Persist on every dispatch except intent === "state.update".
- **Reconstruction:** deriveState(log) is pure; same log ⇒ same DerivedState. Timeline = ordered list of intents and payloads; no separate planning/relationships store.
- **Rehydration:** On bootstrap, read from localStorage and replay log to deriveState.
- **Execution implication:** No new persistence surfaces without updating state-store and contract; event stream philosophy documented; single entry persistence format; timeline reconstruction concept preserved.

---

## 5. Compiler micro-pipeline structure

- **Blueprint (build-time only):** Script src/scripts/blueprint.ts — CLI; outputs app.json, content.manifest.json under apps-offline/apps/<appPath>/.
- **Tree shape:** id, type, children, content; optional role, state, params, behavior. No layout ids for sections from blueprint; no screen IDs; no layout primitive nodes as content nodes.
- **Runtime boundary:** No blueprint script imported by app/engine/state/layout at runtime. No runtime layout IDs from blueprint.
- **Site compiler:** normalizeSiteData, compileSiteToSchema, applyEngineOverlays — build-time or secondary; not on main JSON screen path.
- **Execution implication:** Blueprint boundary doc; site compiler pipeline doc; Contract 9.2: screen tree must not contain layout primitive node types (Grid, Row, Column, Stack) as content nodes; collapse in dev where applicable.

---

## 6. Layout normalization strategy

- **Precedence (section layout id):** override (store) → explicit node.layout → template defaultSectionLayoutId → undefined. No invented layout ID.
- **When resolveLayout returns null:** Section renders div only; no LayoutMoleculeRenderer; no fallback layout ID.
- **Stores:** section-layout-preset-store (section + card overrides), organ-internal-layout-store. Passed to JsonRenderer as overrides. Override writers: UI only (OrganPanel).
- **Resolvers:** layout-resolver (resolveLayout, getDefaultSectionLayoutId); page (page-layouts, templates); component (component-layouts); compatibility (evaluateCompatibility).
- **Hardcode removal:** Layout allowedTypes from registry or JSON; LAYOUT_NODE_TYPES from layout/registry or defs; template criticalRoles/optionalRoles from data.
- **Planned (not built):** Layout Decision Engine, Suggestion Injection Point, Trait Registry, Contextual Layout Logic, User Preference Adaptation, Explainability/Trace — implement or mark planned.
- **Execution implication:** Authority ladder audit; layout resolution order doc; getLayout2Ids → getSectionLayoutIds or alias; no layout in state; no behavior in layout.

---

## 7. Responsibility boundaries

- **Inviolable:** Layout ≠ Logic ≠ State ≠ Behavior ≠ Blueprint ≠ Organs ≠ Registry.
- **No cross-boundary writes:** Layout must not write state/behavior/logic; Logic must not write layout/override/node.layout (only preference memory when implemented); State must not mutate layout/registry/blueprint; Behavior must not resolve layout/organs; Blueprint build-time only; Registry read-only.
- **Integration surfaces only:** dispatchState (state); runBehavior, interpretRuntimeVerb (behavior → logic/state); applyProfileToNode (layout from profile/override); loadScreen (screen doc → state default).
- **Execution implication:** Separation checklist (BOUNDARY_SEPARATION_CHECKLIST); any new cross-boundary write must use documented integration point or update PIPELINE_AND_BOUNDARIES_REFERENCE / STATE_MUTATION_SURFACE_MAP. Phase 10 sign-off: no layout in state, no behavior in layout, no blueprint in runtime, JSON authority, JsonRenderer primary.

---

## 8. Runtime vs ingest vs build separation

- **Runtime:** app, engine (core), state, layout, behavior, logic/runtime, organs, contracts — the primary path and state spine. Single pipeline: loadScreen → document prep → setCurrentScreenTree → JsonRenderer → behavior-listener.
- **Ingest:** Scans enter via dispatchState("scan.result" | "scan.interpreted"). Screen/content via loadScreen and json?.data + applySkinBindings. Any external input that affects the app must produce state intents (dispatchState) or screen/content (loadScreen, data bag); no bypass of state or pipeline.
- **Build:** Blueprint script (CLI); scripts under src/scripts/ (blueprint, docs generators, reachability) — build-time or one-off. No script imported by app/engine/state/layout at runtime. Site compiler and applyEngineOverlays build-time or secondary.
- **Execution implication:** Scripts boundary doc; API route boundary (Next.js/fetch) documented; site compiler pipeline doc; ingest integration points documented without new architecture.
