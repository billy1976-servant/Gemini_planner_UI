# FULL ENGINE + JSON UNIFICATION — MASTER PLAN (ANALYSIS ONLY)

**Mode:** Planning and audit only. No code edits, file moves, or refactor execution.

**Foundation (already done):** Engine surface unification complete. `engine-contract.ts` is the single public engine entry; all direct callers use it. Onboarding-engines are re-exports only. This plan builds on that.

---

## TASK 1 — One-Plug Engine Model (Deep Audit)

### 1.1 All engine execution paths

| Path | Entry | Invocation shape | Registry / lookup | Input shape |
|------|--------|-------------------|-------------------|-------------|
| **Trunk action** | behavior-listener → interpretRuntimeVerb → action-runner | getActionHandler(action.name) → handler(action, state) | action-registry (via engine-contract) | (action: { name, ...params }, state: Record) |
| **Flow** | flow-loader, engine-viewer, FlowRenderer, OnboardingFlowRenderer, IntegrationFlowEngine | applyEngine(flow, engineId), getPresentation(flow, engineId) | engine-registry (via engine-contract) | (flow: EducationFlow, engineId?: EngineId) |
| **Calculator** | Trunk only (logic:runCalculator) | runCalculator(action, state) → getCalculator(id) + runCalculators([calc], inputState) | calculator.registry (calc-registry) | (action: { calculatorId, inputKey, outputKey }, state) |
| **Behavior** | behavior-listener → runBehavior(domain, action, ctx, args) | BehaviorEngine[handler] + interactions/navigations JSON | behavior-engine + behavior-interactions.json, behavior-navigations.json | (domain, action, ctx, args) — no state envelope |
| **TSX screen** | loadScreen("tsx:...") → TsxComponent | engine-viewer / FlowRenderer use getPresentation, applyEngine via engine-contract | engine-contract | Same as flow (EducationFlow + engineId) |

**Critical finding — remaining dual entry:** `logic/flows/flow-loader.ts` still uses **dynamic import** of `../engine-system/engine-registry` in four places (lines ~152, 170, 205, 276) to call `applyEngine`. All other flow/engine UI already uses engine-contract. Migrating flow-loader to `import { applyEngine } from "@/logic/engine-system/engine-contract"` (or dynamic import of engine-contract) would remove the last direct engine-registry use and complete single-entry for engines.

### 1.2 Where engines still attach differently

- **Trunk vs flow:** Trunk uses (action, state) and string action names (e.g. `logic:runCalculator`). Flow uses (flow, engineId) and engine IDs (learning, calculator, abc, decision, summary). Same underlying calculator/learning implementations, but two invocation shapes.
- **Behavior path:** runBehavior does not go through engine-contract or action-registry. It uses BehaviorEngine + JSON maps (interactions, navigations). So “engine” in behavior is a different concept (verb → handler name) and is not part of the engine-registry/action-registry surface.
- **Onboarding-flow-router:** resolveOnboardingFromAnswers(answers) is called from landing-page-resolver and resolve-onboarding.action. It is a router/selector, not an execution engine; it returns a flow id. So it is a “which flow” decision, not “run engine.” No duplication with engine-contract.

### 1.3 Dual entry surfaces (after current unification)

- **Single remaining:** flow-loader → engine-registry (dynamic import). Fix: use engine-contract in flow-loader.
- **Conceptual dual shape:** action-registry (name → handler) vs engine-registry (engineId → engine/presentation). Both are re-exported by engine-contract, so there is one *module* entry but two *lookup* styles (action name vs engine id). A true one-plug would either unify under one registry (e.g. all engines by a single id/name) or keep both behind one facade and document as “action plug” vs “flow plug.”

### 1.4 Input shape differences

- **Trunk:** `(action: { name: string, ...params }, state: Record<string, any>)`. Handler returns void; state is mutated via dispatchState inside handlers.
- **Flow:** `(flow: EducationFlow)` or `(flow: EducationFlow, engineId: EngineId)`. Returns transformed flow or PresentationModel.
- **Behavior:** `(domain, action, ctx, args)`. No state object; ctx has navigate, etc. Returns nothing; side effects via ctx.

A single global engine contract envelope would require something like: `runEngine({ intent, payload, state?, context? })` with adapters that map action path, flow path, and (if desired) behavior path into that envelope. Today that would be a design change, not a trivial refactor.

### 1.5 What must exist for a TRUE one-plug model

- **One invocation shape:** Either a single function `runEngine(envelope)` with a normalized envelope (intent, payload, state, context) or a single facade that exposes both “run by action name” and “run by engine id” with documented use cases. Current facade (engine-contract) achieves the latter; full one-shape requires adapter layer and possibly handler signature changes.
- **One registry surface:** Today action-registry + engine-registry are both behind engine-contract. One registry would mean either action names and engine ids live in one map (with type discriminator) or one “engine” registry where trunk actions are a subset of “engines” with a different execution signature. Large change.
- **One adapter boundary:** engine-bridge (read/write engine state) is the single I/O boundary for engine state. Keep. Input envelope adapter would sit in front of getActionHandler / getExecutionEngine if we move to one invocation shape.
- **Engines as drop-in modules:** Today new trunk actions = add to action-registry; new flow engines = add to engine-registry. Both are extend-only. Drop-in would mean a single registration API (e.g. registerEngine(id, { run, presentation? })) used by both paths. Plan: introduce a single registration surface that action-registry and engine-registry both consume, or document the two registration points as the standard.

### 1.6 Structural plan to reach one-plug (high level)

1. **Close the dual entry:** Migrate flow-loader to use engine-contract for applyEngine (no direct engine-registry import). Now all engine execution goes through engine-contract.
2. **Document the two plug types:** “Action plug” (trunk: name → handler(action, state)) and “Flow plug” (flow: engineId → engine(flow)). Keep both behind engine-contract. No new code; doc only.
3. **Optional later:** Define a normalized envelope and a single runEngine(envelope) that dispatches to action or flow internally; migrate callers gradually. Or introduce a single registerEngine() that populates both action-registry and engine-registry for engines that support both (e.g. calculator).

---

## TASK 2 — JSON Domain Consolidation Map (Full System)

### 2.1 Layout domain

| Current files | Consumers | Classification |
|---------------|------------|-----------------|
| layout/data/layout-definitions.json | page-layout-resolver, component-layout-resolver | Single-consumer set; safe to keep as one or merge page+component into one keyed file |
| layout/requirements/section-layout-requirements.json, card-layout-requirements.json, organ-internal-layout-requirements.json | requirement-registry.ts (all 3) | Single consumer; same structure; **safe bundle** → layout-requirements.json (keys: section, card, organInternal) |
| lib/layout/molecule-layouts.json | molecule-layout-resolver | Single consumer |
| lib/layout/presentation-profiles.json | profile-resolver, lib/layout/index.ts, app/layout.tsx | Multi-consumer; **adapter-needed** if bundling with other layout JSON (or keep as-is) |
| lib/layout/layout-schema.json, layout-allowed-types.json | layout-store | Single consumer; **safe bundle** with layout-definitions or keep |
| lib/layout/card-presets.json, hero-presets.json | card-preset-resolver, layout index | Single-consumer group |
| lib/layout/spacing-scales/*.json (5) | spacing-scale-resolver, preset-resolver | Single consumer; **safe bundle** → spacing-scales.json |
| lib/layout/visual-presets/*.json (5) | visual-preset-resolver, preset-resolver | Single consumer; **safe bundle** → visual-presets.json |
| lib/layout/definitions-screen/*.json (8) | screen-layout-resolver | Single consumer; **safe bundle** → definitions-screen.json |
| lib/layout/template-roles.json | template-profiles.ts | Single consumer |
| lib/layout/presets/*.json (5) | profile/resolver usage | Single consumer; **safe bundle** → presets.json |
| lib/layout/roles/*.json (5) | template/roles | Single consumer; **safe bundle** → roles.json |
| layout-organ/organ-layout-profiles.json | organ-layout-resolver | Single consumer |

**Proposed bundle surfaces (layout):**

- **layout-core.json** (or keep layout-definitions.json name): page + component layout definitions; optional merge of layout-schema + layout-allowed-types.
- **layout-requirements.json**: section, card, organInternal requirements (3 → 1).
- **layout-presets.json**: optional merge of card-presets, hero-presets, spacing-scales, visual-presets into one keyed file; or keep layout-presets + spacing-scales + visual-presets as three files.
- **molecule-layouts.json**: keep (already one file).
- **presentation-profiles.json**: keep (already one file).
- **definitions-screen.json**: merge 8 files into one keyed file.
- **template-roles.json**, **presets.json**, **roles.json**: optional bundles per subfolder.

### 2.2 Behavior domain

| Current files | Consumers | Classification |
|---------------|------------|-----------------|
| behavior/behavior-interactions.json | behavior-runner | Single consumer |
| behavior/behavior-navigations.json | behavior-runner | Single consumer |
| behavior/behavior-actions-6x7.json | (verify) | **Safe bundle** with interactions/navigations or separate |

**Proposed:** **behavior.json** — single file with keys e.g. interactions, navigations (and actions if used). Update behavior-runner to read one file.

### 2.3 Engine config / calculator types

| Current files | Consumers | Classification |
|---------------|------------|-----------------|
| logic/engines/calculator/calculator-types/*.json (6) | calc-registry (simple-hours, profit); runCalculators | Single consumer; **safe bundle** → calculator-types.json (keyed by id or array) |

**Proposed:** **calculator-types.json** — one file; calc-registry imports and indexes by calculator id.

### 2.4 Visual / presentation

| Current files | Consumers | Classification |
|---------------|------------|-----------------|
| lib/layout/presentation-profiles.json | see layout | Already one file |
| palettes/*.json (10) | palettes/index.ts | Single entry; **optional** single palettes.json or keep index re-export |

**Proposed:** Keep presentation-profiles; palettes either one bundle or keep current index.

### 2.5 Contracts / schema

| Current files | Consumers | Classification |
|---------------|------------|-----------------|
| contracts/JSON_SCREEN_CONTRACT.json | param-key-mapping.test, showcase test | **Must remain split** (contract schema; do not merge with config) |
| config/config.json | state-store, renderer-contract | Config; keep or merge into single config.json with keys |

### 2.6 Content / flows

| Current files | Consumers | Classification |
|---------------|------------|-----------------|
| logic/content/flows/*.json (5+) | flow-loader | Multiple flows; **must remain split** per flow or one manifest that lists paths |
| logic/flows/*.json, logic/flows/generated/*.json | flow-loader, flow-definitions | Mixed; keep flow-definitions as code; JSON flows can stay per-file or one index |
| logic/modules/*.json | (verify) | Content modules; document |

**Proposed:** No mandatory merge for flows; optional flows-manifest.json that lists flow id → path.

### 2.7 Compounds

| Current files | Consumers | Classification |
|---------------|------------|-----------------|
| compounds/ui/compound-definitions.json | compounds/ui/index.ts, definitions/registry.ts | Single consumer; **optional** merge with definitions/*.json into one compound-definitions.json |

### 2.8 Organs

| Current files | Consumers | Classification |
|---------------|------------|-----------------|
| organs/*/variants/*.json (60+) | organ-registry.ts (many direct imports) | Single consumer; **adapter-needed** for bundle — build-time bundle (organs.json) or keep file-per-variant |

**Proposed:** Either keep file-per-variant or introduce build step that emits one organs.json; organ-registry loads that.

### 2.9 Config

| Current files | Consumers | Classification |
|---------------|------------|-----------------|
| config/config.json | state-store, renderer-contract | **Multi-consumer**; keep or merge into single config surface (e.g. config.json with stateDefaults, rendererContract keys) |

---

## TASK 3 — Glue Layer Detection (True vs Redundant)

| Layer | Location | Role | Classification |
|-------|----------|------|-----------------|
| **engine-bridge** | logic/runtime/engine-bridge.ts | readEngineState, writeEngineState, subscribe; shared engine I/O | **A) Must exist** — true boundary between UI/state and engine output |
| **layout-bridge** | lib/site-renderer/layout-bridge.tsx | useContainerLayout, etc.; wraps layout-store + profile + molecule + screen resolvers for site-renderer | **B) Can be absorbed** — secondary path; site-renderer could call layout/ and store directly with a thin hook |
| **palette-bridge** | lib/site-renderer/palette-bridge.tsx | usePaletteCSS, palette application for site | **B) Can be absorbed** — same; optional thin wrapper or inline in site shells |
| **engineToSkin.bridge** | logic/bridges/engineToSkin.bridge.ts | siteDataToSlots + applySkinBindings | **B) Can be absorbed** — fold into skinBindings or single “engine→skin” module |
| **skinBindings.apply** | logic/bridges/skinBindings.apply.ts | Resolves "slot" nodes with data | **A) Must exist** — document prep contract; not redundant |
| **layout/index re-exporting lib/layout** | layout/index.ts | Public API for layout; re-exports preset resolvers, molecule resolver, etc. | **A) Must exist** — layout authority boundary |
| **behavior-listener** | engine/core/behavior-listener.ts | Routes events → dispatchState, navigate, runBehavior, interpretRuntimeVerb | **A) Must exist** — single behavior bridge |
| **runtime-verb-interpreter** | logic/runtime/runtime-verb-interpreter.ts | Normalizes verb → runAction(action, state) | **B) Can be absorbed** — could live inside behavior-listener or stay as single function; no duplicate paths |
| **content/content-resolver.ts** | content/content-resolver.ts | Stub; deprecated | **C) Dead / legacy** — remove or keep throw-only stub |
| **calc-resolver** | logic/runtime/calc-resolver.ts | Legacy; uses engine-bridge + calculator.registry | **C) Dead / legacy** — no main-path callers; remove or document optional |
| **compileSkinFromBlueprint** | lib/site-skin/compileSkinFromBlueprint.ts | Compatibility adapter for blueprint output | **A) Must exist** — build-time boundary |
| **product-screen-adapter** | lib/product-screen-adapter/* | Product graph → screen nodes | **A) Must exist** — script/build boundary |
| **persistence-adapter** | state/persistence-adapter.ts | State persistence | **A) Must exist** |
| **state-mutate bridge** | state/state-store.ts (installStateMutateBridge) | CustomEvent "state-mutate" → dispatchState | **A) Must exist** — legacy event boundary |
| **flow-loader dynamic import** | logic/flows/flow-loader.ts | Dynamic import of engine-registry | **D) Duplicate authority** — should use engine-contract only |
| **preset-resolver** | lib/layout/preset-resolver.ts | Re-exports card, spacing, visual | **A) Must exist** — single preset surface; not duplicate |
| **contracts/index.ts** | contracts/index.ts | Re-export contract modules | **A) Must exist** — contract boundary |

**Clean map:**

- **True boundaries (keep):** engine-bridge, skinBindings.apply, layout public API (layout/index), behavior-listener, compileSkinFromBlueprint, product-screen-adapter, persistence-adapter, state-mutate bridge, preset-resolver, contracts index.
- **Absorbable:** layout-bridge, palette-bridge, engineToSkin (into skin or one module); runtime-verb-interpreter (optional inline).
- **Dead/legacy:** content/content-resolver stub, calc-resolver (no callers).
- **Duplicate authority:** flow-loader importing engine-registry; should use engine-contract.

---

## TASK 4 — File Surface Reduction Potential

**Current (approximate):**

- TS/TSX in src (excluding docs/refactor/cursor): ~318 .ts + ~166 .tsx ≈ **484**.
- JSON in src: **~328** (includes apps-offline, organs, compounds, lib/layout, layout, config, behavior, logic, palettes, etc.).
- Core trunk/near-trunk JSON (loaded by layout, behavior, logic, config, contracts): ~50–80 files.

**After:**

- **Engine unification:** Already done; no further TS reduction. flow-loader migration to engine-contract: 0 file change, 1 import path fix.
- **JSON bundling (realistic):** Layout requirements 3→1; behavior 2→1; calculator-types 6→1; spacing-scales 5→1; visual-presets 5→1; definitions-screen 8→1; optional compound-definitions merge; optional presets/roles bundles. **Estimate:** ~25–35 JSON files removed or merged into bundles (core pipeline). Trunk JSON count: **~15–25** (from ~50–80).
- **Dead path removal:** content/content-resolver (stub), calc-resolver (optional delete): **0–2** TS files.
- **Duplicate engine removal:** Already done (onboarding-engines are re-exports). **0** files.
- **Resolver consolidation:** No major TS reduction; resolvers already single public API per domain. **0** files.

**Projected:**

- **TS/TSX:** 484 → **482–484** (at most 2 removed if stubs deleted).
- **JSON (core):** ~50–80 → **~15–25** (conservative bundle plan) or **~10–15** (aggressive).
- **Core trunk surface size target:** Minimal set of JSON: layout-core (or definitions), layout-requirements, molecule-layouts, presentation-profiles, layout-presets (or split), config, contract schema, behavior.json, calculator-types.json, palettes (1 or index), compound-definitions (1), optional organs bundle. **No Ultra collapse;** layout/state/contract boundaries unchanged.

---

## TASK 5 — Risk Model

| Change / area | Would break system fastest? | Risk |
|---------------|-----------------------------|------|
| Changing behavior-listener branch order (state:* → navigate → contract verbs → interpretRuntimeVerb) | **Yes** — action routing would misroute | **High** |
| Moving layout resolution into JsonRenderer | **Yes** — violates trunk rule | **High** |
| Merging state and layout authority | **Yes** — boundary violation | **High** |
| Renaming or removing action IDs (logic:runCalculator, etc.) | **Yes** — handlers not found | **High** |
| Removing or changing engine-bridge | **Yes** — landing-page, resolve-onboarding, json-skin depend on it | **High** |
| Direct lib/layout imports from app/renderer (bypassing layout/) | **Yes** — breaks layout authority | **High** |
| JSON bundle shape change without updating all loaders | **Yes** — runtime import/parse errors | **Medium** |
| Migrating flow-loader to engine-contract | No | **Low** |
| Deleting content/content-resolver stub, calc-resolver | No (no callers) | **Low** |
| Bundling layout requirements, behavior, calculator-types with loader updates | No if all consumers updated | **Medium** |
| Bundling organs at build time | No if organ-registry consumes bundle | **Medium** (build step) |
| Absorbing layout-bridge / palette-bridge into site-renderer | No (secondary path) | **Low** |

---

## TASK 6 — Build Plan (Phased)

### Phase A — Zero risk

- **Flow-loader engine-contract migration:** Replace dynamic `import("../engine-system/engine-registry")` with dynamic (or static) import from `@/logic/engine-system/engine-contract` for `applyEngine` in flow-loader.ts. No behavior change; single engine entry.
- **Document two plug types:** Add short doc: “Action plug” (trunk) vs “Flow plug” (flow); both via engine-contract.
- **List exact JSON bundle groups:** From this plan; no execution.

**Structural change:** Single module entry for all engine use (including flow-loader). **Untouched:** Handlers, action names, layout, state, behavior-listener, JSON shapes. **File impact:** 0 new/removed files; 1 file edited (flow-loader). **Stability:** Unchanged. **Engine plug gain:** Full single-entry; no remaining engine-registry imports from app/runtime.

### Phase B — Low risk

- **Remove or keep stub:** content/content-resolver (no callers); calc-resolver (optional remove or keep @deprecated).
- **Single requirements.json:** Merge section/card/organ-internal into one file; update requirement-registry.
- **Single behavior.json:** Merge behavior-interactions + behavior-navigations; update behavior-runner.
- **Optional:** Single calculator-types.json; update calc-registry.

**Structural change:** Fewer JSON files; same resolution logic. **Untouched:** Layout authority, state, behavior order, action-registry map. **File impact:** 2–4 JSON merged; 1–2 TS loader updates; 0–2 TS removed (stubs). **Stability:** High. **Engine plug gain:** None (JSON only).

### Phase C — Medium risk

- **Layout JSON bundling:** Merge spacing-scales, visual-presets, definitions-screen into single files per domain; update resolvers and layout index. Then optional layout-requirements (if not in B), presets/roles.
- **Optional compound-definitions merge.** Optional palettes bundle.
- **Resolver consolidation:** No file cut; ensure layout/ is only public API (already true). Optional single preset-resolver facade doc.

**Structural change:** Fewer JSON files; same layout/ API. **Untouched:** layout/ as authority, state, contracts, renderer role. **File impact:** ~10–20 JSON → bundles; loader updates. **Stability:** Medium; per-domain rollout and tests. **Engine plug gain:** None.

### Phase D — Optional aggressive

- **Organs build-time bundle:** Script that emits organs.json; organ-registry loads it. Or keep file-per-variant.
- **Single config.json:** state-defaults, renderer-contract, ui-verb-map (if any) into one keyed file.
- **Absorb glue:** layout-bridge, palette-bridge, engineToSkin into fewer modules (secondary path only).

**Structural change:** Build step for organs; optional config merge; fewer bridge files. **Untouched:** Trunk behavior, layout/state/contract boundaries. **File impact:** Build script; optional JSON merges; 1–3 bridge files inlined or removed. **Stability:** Medium (build/orphans). **Engine plug gain:** None.

---

## FINAL OUTPUT

### Scores

| Score | Value | Rationale |
|-------|--------|-----------|
| **Engine plug readiness** | **7/10** | Single facade (engine-contract) adopted; one remaining dual entry (flow-loader). After flow-loader fix: 8/10. True one invocation shape (single envelope) would require adapter + design: 9–10. |
| **JSON consolidation readiness** | **8/10** | Domains and consumers mapped; many single-consumer clusters; layout/behavior/calculator safe to bundle. Organs and flows need care. |
| **Glue reduction potential** | **5/10** | Essential glue (engine-bridge, behavior-listener, layout API) must stay. Some absorbable (layout-bridge, palette-bridge, engineToSkin); limited file reduction. |
| **Stability risk** | **Medium** | Phase A–B low risk; Phase C–D medium (JSON/build). No high-risk change if boundaries and behavior order are preserved. |

### Best next move for maximum long-term system power

1. **Phase A: Migrate flow-loader to engine-contract.** Closes the last engine-registry use; completes single engine entry. Zero risk, one file.
2. **Phase B: Bundle layout-requirements and behavior JSON.** Low risk; immediate reduction in JSON surface and clearer data ownership.
3. **Then** Phase C layout JSON bundling (spacing, visual, definitions-screen) one domain at a time, with tests after each step.
4. **Do not:** Change behavior routing order; merge layout/state authority; move resolution into renderer; rename action IDs; or remove engine-bridge.

---

*End of FULL_ENGINE_JSON_UNIFICATION_MASTER_PLAN.md — analysis only; no code or file changes.*
