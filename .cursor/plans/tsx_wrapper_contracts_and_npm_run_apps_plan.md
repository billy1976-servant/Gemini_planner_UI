# TSX Wrapper Build: Contracts, Rules & npm run apps — Full Analysis & Implementation Plan

## Executive Summary

This plan repositions **npm run apps** from “scan and present build components for Cursor to apply” to a **contract-first governance system**: gather and update contracts, propose mismatches, suggest updates, and verify which TSX wrapper builds have strayed or need refactoring. The end state is **one organism**: no singular app, but all screens sharing the same design, data contracts, and content/output so they are compatible across industries and use cases (GC → painter → framer; Dr → dentist → chiropractor; business ↔ personal ↔ church).

---

## Part A — Current System Analysis

### A.1 TSX Wrapper & Layout System (as-is)

| Asset | Location | Role |
|-------|----------|------|
| **Structure types** | `src/lib/tsx-structure/types.ts` | 8 types: `list`, `board`, `dashboard`, `editor`, `timeline`, `detail`, `wizard`, `gallery` |
| **Resolver** | `resolveAppStructure(screenPath, metadata?)` | Returns `structureType` + merged template + schemaVersion; convention by path/metadata |
| **Templates** | `src/lib/tsx-structure/resolver/builtinTemplates.ts` | BUILTIN_TEMPLATES per type (e.g. list: default/compact/dense/minimal; board: default/minimal/pipeline/swimlanes; timeline: default/compact/day-only/week-month) |
| **Envelope** | TSXScreenWithEnvelope | Wraps every TSX screen; applies palette, layout containment, StructureConfigProvider |
| **Registry** | `src/03_Runtime/engine/core/registry.tsx` | Manual `Registry` map: JSON `type` → React component (atoms, molecules, layout molecules, cards) |
| **Page layouts** | `layout-definitions.json` | pageLayouts (hero-*, content-*, etc.), componentLayouts, templates (e.g. startup-template) |

**Gap:** Layout “type” for a new TSX is not formally chosen by a **contract**. Cursor currently picks structure type ad hoc. There is no single “layout option catalog” that maps app intent (e.g. “calendar type”, “kanban type”) to `StructureType` + templateId.

### A.2 JSON-Driven Screen System (as-is)

| Asset | Location | Role |
|-------|----------|------|
| **Blueprint** | `blueprint.txt` per app | Node-per-line; hierarchy by indentation; type from allowed node grammar |
| **Blueprint compiler** | `src/07_Dev_Tools/scripts/blueprint.ts` | Reads blueprint + content → `app.json`, `content.manifest.json`, validation-report |
| **Content keys** | ALLOWED_CONTENT_KEYS (hardcoded in blueprint.ts) | Molecule → content keys (e.g. button→[label], card→[title, body, media, actions]) |
| **Organ index** | `organ-index.json` (hand-maintained) | Organ id → slots, variants |
| **JsonSkinEngine** | `src/05_Logic/logic/engines/json-skin.engine.tsx` | Renders app.json tree: section, text, molecules; state-driven view gating |

**Gap:** Blueprint/content drive **dead JSON apps** under `(dead) Json/apps`. Live TSX screens (e.g. workspace, landing, Container Creations) are not consistently driven by the same blueprint/content pipeline. The “JSON that drives the TSX basic design” for live TSX is not standardized.

### A.3 Logic Engines (as-is)

| Engine (sample) | File | Role |
|-----------------|------|------|
| json-skin | json-skin.engine.tsx | Screen tree renderer; view gating |
| calculator | calculator.engine.ts | Calc flows, product calc |
| learning | learning.engine.ts | Learning flows |
| 25x | 25x.engine.ts | Onboarding |
| decision | decision.engine.ts | Decision flows |
| flow-router | flow-router.ts | Flow routing |
| structure-mapper, progression, scheduling, recurrence, etc. | structure/*.ts | Structure/date/aggregation |
| value-comparison, value-translation | comparison/*.ts | Comparison/translation |
| summary | summary.engine.ts | Summary/export |
| hi-engine-runner | post-processing | HI pipeline |

**Registration:** Each engine calls `registerEngine({ name, integratesWith?, description? })` in `engineRegistry`. Discovery: `system/registry/loader.ts` walks `engineDir` + `templateDirs` and dynamic-imports files; engines self-register. So **engines are already auto-discovered** when the loader runs (e.g. in run-apps discoverEngines()).

**Gap:** No single “engine capability contract” (inputs/outputs, which state keys, which JSON shapes) that Cursor uses to **choose** engines for a new app. No report of “missing engine” when desired behavior cannot be fulfilled.

### A.4 Other Systems (as-is)

| System | Location | Auto vs manual |
|--------|----------|-----------------|
| **Molecules** | molecules/index.ts COMPONENT_MAP | Manual map (12 contract molecules) |
| **Organs** | organ-registry.ts + organ-index.json | Manual imports + VARIANTS; index hand-maintained |
| **Palettes** | palettes/*.json | Runtime: require.context auto; run-apps: scan *.json |
| **Layout definitions** | layout-definitions.json | Single JSON; run-apps reads for discovery |
| **Actions** | action-registry.ts | Manual registry map |
| **Director primitives** | primitive-registry.ts | 25 primitives (visibility, variant, layoutDensity, …) |
| **State** | state-store.ts + state-resolver | No schema; deriveState(log) from intent log |
| **Flows** | logic/content/flows/*.json | Onboarding/simple flows; path-based |
| **Section registry** | section-registry.tsx | Manual section type → renderer |

### A.5 npm run apps (run-apps.ts) Today

- **Does:** Scans palettes, layout-definitions, molecules (fs + COMPONENT_MAP), organs (index + fs), blueprint node types, structure types (hardcoded list), reads rule files, discovers actions (parse action-registry.ts), discovers engines (loadRegistrations + getEngines).
- **Emits:** BUILD_AUTHORITY_SURFACE.json, CURSOR_BUILD_COMMAND.md, apps-enforcement-report.md; optionally _audit copies. Compiles each app with compileApp().
- **Does not:** Update or derive contracts from code; compare TSX wrappers to a contract; propose layout type for a new screen; validate “this TSX uses only allowed structure types”; auto-generate organ-index or molecule content keys from filesystem.

---

## Part B — Proposed Process: Every New TSX App Build

### Phase 1 (Before Any TSX Code)

#### Step 1 — Determine wrapper (layout) type and propose driving JSON

**Goal:** For every new TSX file (planner, learning platform, journal, etc.), Cursor must first decide the **structure type** and the **JSON shape** that will drive the TSX (so the TSX stays a dumb wrapper).

1. **Layout option catalog (new contract)**  
   - Define a single **layout-options contract** (e.g. `layout-options.contract.json` or section in a master contract):
     - Map **intent keywords** → `StructureType` + optional `templateId`.
     - Examples: “calendar”, “schedule”, “agenda” → `timeline` (templateId: default | day-only | week-month); “kanban”, “board”, “pipeline” → `board` (default | pipeline | swimlanes); “list of items”, “table” → `list`; “dashboard”, “widgets” → `dashboard`; “wizard”, “onboarding”, “steps” → `wizard`; “gallery”, “grid of images” → `gallery`; “master-detail”, “split” → `detail`; “form”, “editor” → `editor`.
   - Cursor **analyzes** the current TSX wrapper system (registry, envelope, resolver, builtinTemplates) and the existing app (if refactoring) to choose from this catalog.
   - **Output:** A short **proposal**: “Structure type: X, templateId: Y, reason: Z.” If no existing layout fits, proposal includes “New layout option: [description]” for product approval.

2. **JSON file that drives the TSX**  
   - For **live** TSX screens, define a convention:
     - Either (a) the screen is driven by an **app.json** (or equivalent) produced from blueprint + content for that screen, or (b) the screen has a **screen-specific JSON** (e.g. `planner.screen.json`) that follows the same node shape as app.json (id, type, content, behavior, when).
   - Cursor **proposes** the JSON file (and optionally blueprint.txt + content.manifest) that will drive the new TSX, so the TSX only consumes `structureConfig` + JSON tree and does not hardcode structure.

**Deliverable (Phase 1 step 1):** “Layout type proposal” + “Driving JSON proposal” (and optional blueprint/content sketch).

#### Step 2 — Logic engines: choose existing, extend, or report gap

**Goal:** Use existing engines with JSON design first; then propose engine updates; if something is missing, report it with suggestions (always with JSON capability for existing and future apps).

1. **Engine capability contract (new)**  
   - Maintain an **engine-capability.contract.json** (or equivalent):
     - For each registered engine: `name`, `integratesWith` (state keys), `inputShape` (optional JSON schema or key names), `outputShape`, `typicalUse` (e.g. “onboarding”, “calculator”, “scheduling”).
   - run-apps (or a sibling script) can **derive** a minimal version from engine registry + JSDoc/source comments, or it can be hand-maintained and validated against registry.

2. **Cursor process**  
   - For the desired application, Cursor **analyzes** engine-capability contract and **decides**:
     - Which existing engines apply (with JSON design to satisfy the app).
     - What **updates** to existing engines are needed (e.g. new optional input key) — propose as a small change set.
     - If something **cannot** be fulfilled: **report** “Missing capability: X; suggestion: extend engine Y with Z, or add new engine with JSON contract W.”

3. **Rule**  
   - No “1000 individual apps”: any new behavior must be expressible in JSON and reusable by other app builds.

**Deliverable (Phase 1 step 2):** “Engines to use: [list]”; “Engine updates: [list]”; or “Gap report: [missing], suggestion: [extend/new engine].”

#### Step 3 — Compatibility with existing systems

**Goal:** Ensure the new (or refactored) TSX wrapper can adapt/connect to all existing systems; refactor and conform so everything is one organism.

1. **Compatibility checklist (contract)**  
   - State: Uses `getState` / `subscribeState` / `dispatchState` (or engine bridge) only; no local schema that conflicts with deriveState.
   - Palette: Uses CSS variables from envelope; no hardcoded theme.
   - Layout: Uses resolved structure (useAutoStructure / envelope props); no hardcoded layout IDs.
   - Actions: Uses action-registry actions via behavior layer (e.g. CustomEvent "action" / "navigate"); no one-off handlers that bypass registry.
   - Molecules/organs: Uses only contract molecules and organs from registry; content keys from content manifest.
   - Director: If the screen is under Director, uses DirectorContext and primitives only from PRIMITIVE_REGISTRY.

2. **Cursor process**  
   - After layout and engine proposal, Cursor **analyzes** the TSX (or the planned TSX) against this checklist and **proposes** small refactors to existing TSX so that all screens conform (e.g. “replace hardcoded layout with useAutoStructure()”).

**Deliverable (Phase 1 step 3):** “Compatibility plan: [checklist results]”; “Refactors: [list of files and changes].”

---

### Phase 2 (Structure and Blueprint)

#### Step 4 — App structure from proposal and blueprint/contract

**Goal:** Universalize every TSX build so it can switch industry/vertical and update from content/JSON (e.g. Dr → dentist → chiropractor) without code change.

1. **Blueprint + content as source of truth**  
   - Each app (or screen) has:
     - `blueprint.txt` (or equivalent) — structure and flow.
     - `content.manifest.json` (or content.txt) — content keys per node, filled for the current vertical.
   - The **same** blueprint can be reused across verticals; only content and optional “skin” (palette/layout preset) change.

2. **Cursor process**  
   - From Phase 1 proposal, Cursor **builds** the app structure: blueprint nodes, content manifest, and (for live TSX) the minimal JSON that the TSX wrapper will consume. All driven by the existing **BLUEPRINT_UNIVERSE_CONTRACT** and **CONTENT_DERIVATION_CONTRACT**.

**Deliverable (Phase 2 step 4):** blueprint.txt (or equivalent) + content.manifest.json + driving JSON for the TSX.

#### Step 5 — Blueprint: all-inclusive, turn on/off nodes

**Goal:** Blueprint is exhaustive at conception; end user can turn on/off nodes during build or live. No need to rebuild to add optional sections.

1. **Contract**  
   - Blueprint node model supports:
     - **Visibility / enable** (e.g. a node has `enabled: true|false` or a when-condition); nodes can be toggled by TOC or manual control.
     - **Table of contents** (TOC): optional structure (e.g. a separate TOC node or metadata) that lists all sections; TOC and manual control can show/hide sections without changing blueprint structure.

2. **Implementation**  
   - Compiler and runtime already support `when` (state-based visibility). Extend so that “turn on/off” is either (a) a when-condition driven by state, or (b) a separate “enabled” list in app config. Cursor generates blueprint with **all** optional sections present; visibility controlled by config/state.

**Deliverable (Phase 2 step 5):** Blueprint and runtime behavior for “all-inclusive + toggle” documented and implemented where missing.

#### Step 6 — TOC and manual control

**Goal:** Nodes can be organized and toggled via table of contents or manual control.

- **Contract:** App JSON or envelope supports (optional):
  - `toc`: array of { id, label, visible } (or similar) so UI can render a TOC and toggle visibility.
  - Manual control: state key (e.g. `sectionsVisible: Record<id, boolean>`) that the runtime uses to show/hide sections.
- Cursor uses this in the blueprint/content design so that every TSX build can grow and mature without rebuilding.

#### Step 7 — Include all existing systems in the build

**Goal:** Every TSX app build explicitly rests on the same set of system pieces, all JSON-driven and reusable.

The construction of blueprint, TSX wrapper, and content **must** include and reference:

| System | Contract / source | How it’s used in build |
|--------|-------------------|-------------------------|
| **Molecule contracts** | BLUEPRINT_UNIVERSE_CONTRACT + expected-params + ALLOWED_CONTENT_KEYS | Content keys and params per node type; no invented keys. |
| **Palettes** | palettes/*.json (discovered) | Chosen by system/envelope; never hardcoded in TSX. |
| **State system** | state-store + state-resolver (no schema) | Reconstruct design: intent log → deriveState; TSX only subscribes/dispatches. |
| **Layouts and flows** | layout-definitions.json + flows JSON | Layout from resolver; flows from content/runtime. |
| **Behaviors** | action-registry + behavior engine | All actions go through registry; no ad-hoc handlers. |
| **TSX component types (25 primitives)** | primitive-registry.ts PRIMITIVE_REGISTRY | Director/primitive props only from this set. |
| **Structure types (8)** | tsx-structure types + builtinTemplates | Wrapper type and template from layout-options contract. |
| **Engines** | engineRegistry + engine-capability contract | Selection and wiring per app; JSON-driven. |
| **Organs** | organ-index + organ-registry | Slots/variants from index; no new organs without index update (or auto-generation). |
| **Section registry** | section-registry (site sections) | For site-style screens; section type → renderer. |

**Cursor process:** For every new TSX app build, Cursor **checks** that the plan references these systems and that the implementation uses only these contracts (no new one-off molecules, actions, or state shapes).

---

## Part C — Contracts to Fully Implement

To support the above, the following contracts (and their sources) must be defined or formalized so Cursor and npm run apps can use them consistently.

### C.1 Layout / wrapper selection

| Contract | Purpose | Source / location |
|----------|---------|-------------------|
| **Layout-options contract** | Map intent → StructureType + templateId | New: e.g. `src/02_Contracts_Reports/contracts/layout-options.contract.json` or section in a master contract. |
| **Structure-type catalog** | Authoritative list of 8 types + templates per type | Already in tsx-structure (types.ts, builtinTemplates.ts); expose as contract JSON for run-apps. |

### C.2 Molecules and content

| Contract | Purpose | Source / location |
|----------|---------|-------------------|
| **Molecule content keys** | Allowed content keys per molecule | Today: ALLOWED_CONTENT_KEYS in blueprint.ts. **Target:** Single JSON (e.g. molecules.content-keys.json) derived from or synced with blueprint + BLUEPRINT_UNIVERSE_CONTRACT. |
| **Expected params (molecule)** | Expected params per molecule | Already: expected-params.ts. Keep or mirror to JSON for run-apps. |
| **Content derivation** | Content manifest shape and rules | CONTENT_DERIVATION_CONTRACT.md. |

### C.3 Blueprint

| Contract | Purpose | Source / location |
|----------|---------|-------------------|
| **Blueprint universe** | All allowed node types, molecules, organs, behaviors | BLUEPRINT_UNIVERSE_CONTRACT.md. |
| **Blueprint node grammar** | Line format, arrows, @id, etc. | blueprint.ts parser + doc. |
| **Node visibility / TOC** | Turn on/off nodes; TOC and manual control | New section in blueprint contract or app schema. |

### C.4 State and storage

| Contract | Purpose | Source / location |
|----------|---------|-------------------|
| **State system contract** | No schema; intent log → deriveState; reconstruct design | Document in state-store + state-resolver; “simple no-schema, reconstruct design” as contract. |
| **Storage** | Persistence (if any) | Document where and how (e.g. engine-bridge, localStorage keys) so all apps use the same approach. |

### C.5 Behaviors and actions

| Contract | Purpose | Source / location |
|----------|---------|-------------------|
| **Action registry contract** | All actions are in action-registry; no one-off handlers | action-registry.ts as source of truth; run-apps discovers keys. |
| **Behavior verbs** | Allowed verbs per molecule (BLUEPRINT_UNIVERSE) | Already in BLUEPRINT_UNIVERSE_CONTRACT. |

### C.6 Engines

| Contract | Purpose | Source / location |
|----------|---------|-------------------|
| **Engine capability contract** | name, integratesWith, input/output shape, typical use | New: engine-capability.contract.json (or generated from engine files + registry). |
| **Engine discovery** | List of engines (already auto via loader) | engineRegistry getEngines(); run-apps already uses this. |

### C.7 Primitives and Director

| Contract | Purpose | Source / location |
|----------|---------|-------------------|
| **25 primitives** | PRIMITIVE_REGISTRY as the only primitive set | primitive-registry.ts; document as contract. |
| **Director archetypes** | director-types.ts Archetype | For app schema; optional per screen. |

### C.8 Palettes and layouts

| Contract | Purpose | Source / location |
|----------|---------|-------------------|
| **Palette list** | Discovered from palettes/*.json | run-apps already scans; document as “system-driven, do not hardcode”. |
| **Layout definitions** | pageLayouts, componentLayouts, templates | layout-definitions.json; run-apps already reads. |

### C.9 Registry type → component (TSX)

| Contract | Purpose | Source / location |
|----------|---------|-------------------|
| **Registry type map** | JSON node type → component | registry.tsx; today manual. **Target:** Either keep as single source of truth and have run-apps discover keys, or drive from a JSON manifest so new types don’t require code edits. |

### C.10 Organs

| Contract | Purpose | Source / location |
|----------|---------|-------------------|
| **Organ index** | organId → slots, variants | organ-index.json. **Target:** Auto-generate from filesystem (organs/*/variants/*.json) so no hand edits. |

---

## Part D — New Role of npm run apps

### D.1 Goals

1. **Gather and update contracts**  
   - Scan code and config to **derive** or **update** contract artifacts (e.g. molecule content keys from molecules + blueprint universe; organ-index from organs filesystem; layout-options from a single JSON).

2. **Propose mismatches**  
   - Compare: (a) TSX wrappers vs layout-options and structure types; (b) content.manifest vs molecule content keys; (c) blueprint nodes vs blueprint universe; (d) action usage vs action-registry. Emit a **mismatch report** (e.g. “Screen X uses structure type not in catalog”, “Node Y uses content key not in contract”).

3. **Suggest updates**  
   - For each mismatch, suggest a change (e.g. “Add content key Z to molecule contract” or “Refactor screen X to use timeline templateId default”).

4. **Verify strayed TSX**  
   - For each TSX screen (e.g. under a known path pattern), check: uses envelope, uses useAutoStructure or structureConfig, uses CSS vars, no hardcoded layout/palette/action. Mark “compliant” or “needs refactor” with reasons.

5. **Auto-registration**  
   - Where possible, **generate** or **discover** so that new components don’t require manual registry edits:
     - Molecule list and content keys from molecules dir + a single content-keys manifest.
     - Organ index from organs/*/variants.
     - Registry type map: either keep single file and parse for discovery, or add a manifest that registry.tsx reads.
     - Engines: already auto via loader; run-apps already calls it.
     - Palettes, layout IDs: already discovered by run-apps.

### D.2 run-apps.ts changes (high level)

| Change | Description |
|--------|-------------|
| **Contract output** | Write or update contract files (e.g. layout-options.contract.json, molecules.content-keys.json, engine-capability.contract.json) from discovery + optional hand-maintained overrides. |
| **Layout proposal** | For each app/screen, optionally run a “suggest layout type” step using layout-options contract and emit in report or BUILD_AUTHORITY_SURFACE. |
| **Mismatch report** | New section in apps-enforcement-report (or new file): compare apps vs contracts and list mismatches + suggestions. |
| **TSX compliance check** | Scan TSX files under app paths; check for envelope usage, useAutoStructure, no hardcoded theme/layout; output “TSX compliance” section. |
| **Auto organ-index** | Script or step: generate organ-index.json from organs filesystem; run before or inside run-apps. |
| **Single discoverEngines** | Keep one discoverEngines(); fix type to BuildAuthoritySurfaceV2; remove duplicate and orphan code. |
| **buildingBlocks type** | Remove duplicate keys in BuildAuthoritySurfaceV2.buildingBlocks (molecules, organs, blueprintNodeTypes listed once). |

### D.3 Auto-registration checklist

| Item | Current | Target |
|------|---------|--------|
| Palettes | Discovered (run-apps) | Keep; document as contract. |
| Layout IDs | Discovered from layout-definitions | Keep. |
| Molecules | COMPONENT_MAP + fs *.compound.tsx | Derive content keys from contract JSON; consider manifest for COMPONENT_MAP. |
| Organs | organ-index hand + fs variants | **Generate** organ-index from fs. |
| Engines | Loader + registerEngine | Keep; add engine-capability contract. |
| Actions | Parse action-registry.ts | Keep; add to BUILD_AUTHORITY_SURFACE. |
| Registry (type→component) | Manual Registry in registry.tsx | Discover keys from Registry for report; optional: manifest-driven registry. |
| Blueprint node types | Snapshot + organ keys | Derive from blueprint universe + organ-index. |

---

## Part E — Implementation Order (Suggested)

1. **Contracts (no code break)**  
   - Add layout-options.contract.json.  
   - Add or generate engine-capability.contract.json.  
   - Extract molecule content keys to a JSON (e.g. molecules.content-keys.json) and have blueprint.ts read from it (or keep in code but single source).  
   - Document state contract and “node visibility / TOC” in blueprint contract.

2. **run-apps fixes and extensions**  
   - Fix run-apps.ts: remove duplicate discoverEngines and orphan lines; fix BuildAuthoritySurfaceV2.buildingBlocks type.  
   - Add organ-index generation from filesystem (new script or step in run-apps).  
   - Add contract output step (write/update layout-options, molecules.content-keys, etc.).  
   - Add mismatch report (apps vs contracts).  
   - Add TSX compliance check (optional, can be heuristic).

3. **Cursor process (rules/docs)**  
   - Add Cursor rule or plan: “For every new TSX app build, Phase 1: (1) layout proposal from layout-options, (2) engine selection from engine-capability, (3) compatibility checklist. Phase 2: blueprint + content + all-inclusive nodes + TOC.”  
   - Reference all contracts (molecule, palette, state, layouts, flows, behaviors, 25 primitives, engines) in the rule.

4. **Blueprint/runtime**  
   - Implement or document “turn on/off nodes” and TOC (state or config); ensure compiler supports it.

5. **Ongoing**  
   - Run npm run apps in CI or pre-commit to refresh contracts and mismatch report; fix violations over time.

---

## Summary Table: Contracts to Implement

| # | Contract | Location / source | Status |
|---|----------|-------------------|--------|
| 1 | Layout-options (intent → structureType + templateId) | New JSON | To add |
| 2 | Structure-type catalog (8 types + templates) | tsx-structure → export or mirror JSON | To expose |
| 3 | Molecule content keys | Single JSON; blueprint reads it | To add / refactor |
| 4 | Expected params (molecule) | expected-params.ts or JSON | Exists; optional JSON mirror |
| 5 | Content derivation | CONTENT_DERIVATION_CONTRACT | Exists |
| 6 | Blueprint universe | BLUEPRINT_UNIVERSE_CONTRACT | Exists |
| 7 | Blueprint node visibility / TOC | New section or app schema | To add |
| 8 | State (no-schema, reconstruct) | state-store + doc | To document |
| 9 | Action registry | action-registry.ts + discovery | Exists; discovery in run-apps |
| 10 | Engine capability | New JSON (or generated) | To add |
| 11 | 25 primitives | primitive-registry.ts | Exists; document |
| 12 | Director archetypes | director-types.ts | Exists |
| 13 | Palette / layout (system-driven) | palettes, layout-definitions | Discovered; document |
| 14 | Registry type map | registry.tsx or manifest | Discover or manifest |
| 15 | Organ index | organ-index.json (auto-generated) | To auto-generate |

This plan gives a full analysis and a concrete path to a **contract- and rule-constrained TSX wrapper build**, with **npm run apps** as the tool that gathers/updates contracts, proposes mismatches, suggests updates, and verifies TSX wrappers, while moving toward **auto-registration** everywhere possible.
