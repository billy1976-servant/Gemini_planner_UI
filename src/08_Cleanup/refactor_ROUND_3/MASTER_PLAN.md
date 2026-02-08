# ROUND 3 — MASTER PLAN (RADICAL MODEL)

**Goal:** Core engine unification, shared execution pipeline, duplicate domain engines removal, major JSON compression stage 2, glue layer removal.  
**Prerequisite:** ROUND 2 complete (getSectionLayoutId in layout/, content/ legacy removed, calculator registry merged, JSON stage 1).  
**Execution:** See `execution_plans/` and `MASTER_ROUND3_PLAN.md` for phase list. This document is the radical-model master plan for R3.

---

## 1. CORE ENGINE UNIFICATION

### 1.1 Single execution engine style

| Current | Target |
|---------|--------|
| Trunk: engine/core (screen-loader, json-renderer, behavior-listener) | **Core** — unchanged; remains the single execution spine. |
| logic/engines (learning, calculator, abc, decision, summary, flow-router, 25x, comparison, json-skin, hi-engine-runner) | **Micro-engines** — plug into core via single registry (logic/engine-system); same execution contract. |
| logic/onboarding-engines (abc, calculator, learning, summary) | **Remove or re-export** — duplicate of logic/engines; no imports found; delete or re-export from logic/engines. |

**Unification rule:** One core (engine/core). All domain "engines" (learning, calculator, abc, decision, summary, etc.) are micro-engines registered in logic/engine-system; they do not duplicate pipeline logic. Execution style: flow → engine selector → execution engine → aftermath processors; single path.

### 1.2 Engine clusters that merge

| Cluster | Action |
|---------|--------|
| logic/engines | Keep as single micro-engine set; consumed by engine-registry, flow-router, action-registry, onboarding flows. |
| logic/onboarding-engines | Remove directory or re-export from logic/engines; zero runtime imports today. |
| logic/engine-system (engine-registry, engine-explain) | Single registry and explainability; no duplicate. |
| engine/onboarding (IntegrationFlowEngine, OnboardingFlowRenderer) | Keep as TSX UI; they consume logic/engines types and flows; no merge into core. |
| behavior/ (behavior-engine, behavior-runner, behavior-verb-resolver) | Single behavior module; already invoked by engine/core/behavior-listener; no duplicate engine. |

### 1.3 Shared execution pipeline (documented and enforced)

- **Trunk only:** page.tsx → loadScreen | resolveLandingPage → doc prep → JsonRenderer → layout.getSectionLayoutId + resolveLayout → behavior-listener → state.
- **Secondary (not trunk):** GeneratedSiteViewer, SiteSkin, flow-loader, applyEngineOverlays — documented; may reuse JsonRenderer or separate tree.
- **Micro-engines:** Invoked from trunk via action-registry (e.g. runCalculator), or from TSX/flow path via engine-registry/flow-router; they do not define a second pipeline.

---

## 2. REMOVAL OF DUPLICATE DOMAIN ENGINES

### 2.1 Duplicates to remove

| Item | Location | Action |
|------|----------|--------|
| logic/onboarding-engines/* | abc, calculator, learning, summary | Delete or re-export from logic/engines; no current imports. |
| decision-engine.ts vs decision/decision.engine.ts | logic/engines | Prefer single entry (decision/decision.engine.ts); decision-engine.ts re-export or remove if redundant. |

### 2.2 Consolidation (no duplicate behavior)

- **Calculator:** Single registration (done in R2); single engine (logic/engines/calculator/calculator.engine.ts).
- **Learning / ABC / Summary / Decision:** Single implementation in logic/engines; engine-registry and flow-router use only these.
- **25x, comparison, json-skin, hi-engine-runner:** Single implementations; no duplicates.

### 2.3 TSX onboarding screens

- screens/tsx-screens/onboarding: OnboardingEngine, OnboardingEnginev2, OnboardingEngineV3, integration-flow-engine, etc. — **Consolidate** to one or two flow entries that use logic/engines and engine-registry; avoid multiple "engine" implementations in TSX.

---

## 3. MAJOR JSON COMPRESSION — STAGE 2

### 3.1 Targets (building on R2)

| Cluster | R2 result | R3 target |
|---------|-----------|-----------|
| Layout definitions | 1–2 files | 1 layout-definitions.json |
| Layout molecule | 1 file | 1 molecule-layouts.json |
| Layout presets | Unchanged in R2 | 1 spacing-scales.json, 1 card-presets.json, 1 visual-presets.json (or merge into layout-definitions) |
| Layout requirements | 4 files | 1 requirements.json (optional) |
| Presentation profiles | 1 file | 1 presentation-profiles.json |
| Config | 3 files | 1 config.json (or keep 3) |
| Palettes | 10 files | 1 palettes index or 1 bundle |
| Compound definitions | 13 files | 1 compound-definitions.json (optional) |
| Contract schema | 1 file | 1 JSON_SCREEN_CONTRACT.json |
| Organs | 60+ files | 60 (no change) or 1 build-time bundle (optional) |

### 3.2 Core trunk JSON (final surface)

| Surface | Purpose | Count |
|---------|---------|-------|
| layout-definitions | Page + component layout | 1 |
| molecule-layouts | Column/row/grid/stacked | 1 |
| presentation-profiles | Experience/template defaults | 1 |
| config | state-defaults, renderer-contract, ui-verb-map | 1–3 |
| contract schema | JSON_SCREEN_CONTRACT.json | 1 |
| palettes | Theme tokens | 1 index or 1 bundle |
| compound-definitions (optional) | Param/defaults per molecule | 1 |
| organs (optional) | Variants bundle | 1 or 60+ |

**Stage 2 total:** Core pipeline JSON ~10–20 files (aggressive) or ~30 (conservative).

---

## 4. GLUE LAYER REMOVAL

### 4.1 Bridges/adapters to keep

| Item | Role | Keep? |
|------|------|-------|
| logic/runtime/engine-bridge.ts | Engine state holder; readEngineState, writeEngineState | **Keep** — single state bridge for logic engines. |
| logic/runtime/runtime-verb-interpreter.ts | JSON verb → action-runner | **Keep** — single interpreter for contract verbs. |
| logic/bridges/engineToSkin.bridge.ts, skinBindings.apply.ts | Skin application | **Keep** — secondary path (SiteSkin). |
| state/persistence-adapter.ts | Event-log persistence | **Keep** — canonical. |
| state/global-scan.state-bridge.ts | Scan → state | **Keep** — global scan path. |

### 4.2 Redundant or removable

| Item | Role | Action |
|------|------|--------|
| content/content-resolver | Legacy; unused | Removed in R2. |
| logic/runtime/calc-resolver | No main-path callers | Removed or optional in R2. |
| Duplicate engine sets (onboarding-engines) | Same as logic/engines | Removed in R3. |
| Overlapping "engine" wrappers in TSX | OnboardingEngine*, integration-flow-engine | Consolidate to single flow entry using logic/engines; remove redundant wrappers where possible. |

### 4.3 Document-only (no removal)

- **Secondary pipelines** — GeneratedSiteViewer, SiteSkin, flow-loader: document as "not trunk"; do not remove.
- **engine-runner.tsx** — Document DEAD/PARTIAL; no removal.
- **map (old)** — Document legacy; no migration.

### 4.4 Glue summary

- **Remove:** content/content-resolver (R2), calc-resolver (R2), logic/onboarding-engines (R3), redundant TSX engine wrappers where safe.
- **Keep:** engine-bridge, runtime-verb-interpreter, skin bridges, persistence-adapter, global-scan.state-bridge.
- **Document:** All bridge roles in system-architecture or contracts; single execution path documented.

---

## 5. RUNTIME CONTRACT FREEZE

- **Screen shape:** No breaking changes to screen JSON contract; additive only.
- **Layout API:** resolveLayout(layout, context), getSectionLayoutId(...) — frozen after R2.
- **State intents:** dispatchState, deriveState — frozen; document STATE_INTENTS.
- **Behavior:** behavior-listener → state | navigate | runBehavior | interpretRuntimeVerb — frozen.

No schema changes except additive. Tests (runtime-pipeline-contract, critical-path) must pass.

---

## 6. FILE COUNT AND RISK

### 6.1 Estimated file reduction (R3)

| Area | Change |
|-----|--------|
| logic/onboarding-engines | −4 files (remove or re-export) |
| logic/engines | Possibly −1 (decision-engine.ts re-export) |
| screens/tsx-screens/onboarding | Consolidate multiple engine TSX to 1–2 flow entries |
| JSON (presets, config, palettes, compounds) | −15 to −30 (merge to 1–2 per cluster) |
| **Total R3** | ~20–40 files reduced; trunk core ~10 TS + ~10 JSON |

### 6.2 Risk level: High

| Risk | Mitigation |
|------|------------|
| Removing onboarding-engines breaks unknown refs | Grep all references; remove only when zero or re-export. |
| JSON compression breaks loaders | Update all loaders (layout, palette, compound, config); test. |
| TSX engine consolidation breaks flows | Single flow entry; regression test onboarding and flow paths. |
| Glue removal breaks secondary paths | Only remove clearly redundant code; keep SiteSkin/flow paths. |

---

## 7. SUCCESS CRITERIA (ROUND 3)

- Single runtime pipeline documented and enforced; secondary paths explicitly "not trunk."
- Single authority per domain (layout, state, behavior, registry); no duplicates.
- logic/onboarding-engines removed or re-exported; logic/engines is the single micro-engine set.
- Core JSON reduced to layout-definitions, molecule-layouts, presentation-profiles, config, contract, palettes; optional compound/organ bundle.
- Redundant glue removed or documented; engine-bridge and runtime-verb-interpreter remain the single bridge/interpreter for trunk.
- Runtime contract frozen; tests pass; boundary checklist signed off.

### 7.1 Non-negotiable acceptance (hard rules)

- **JsonRenderer boundary:** JsonRenderer imports ONLY from @/layout, @/state, component registry, behavior listener contract. It must NOT import from @/lib/layout, molecule-layout resolvers, preset resolvers, or config readers. JsonRenderer may NOT resolve layout, resolve presets, or interpret config.
- **Layout authority:** All layout resolution flows through @/layout; lib/layout is internal implementation only; no direct imports to lib/layout from renderer or app.
- **Single authority checklist:** Exactly one exporter for deriveState, getSectionLayoutId, resolveLayout, component registry map; contracts only in /contracts (system/contracts re-export-only or removed).
- **Engine facade:** Single engine contract facade re-exports action-registry and engine-registry; no app-layer direct imports to both separately.

---

## 8. OUT OF SCOPE (ROUND 3)

- No new features.
- No removal of secondary pipelines (only document and isolate).
- No apps-offline or content/sites structural migration beyond optional bundle.
- No change to Next.js or app router structure.

---

*End of ROUND 3 MASTER_PLAN.md*
