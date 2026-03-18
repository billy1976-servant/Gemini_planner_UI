# Build System V2 — Contract Formalization Plan

## Goal

Upgrade to a **Version 2** build system that **formalizes and centralizes** system contracts. The goal is **not** to rebuild apps. The goal is to:

- Preserve universality
- Eliminate hardcoded defaults
- Make palettes, layout, engines, blueprint, and molecules extensible
- Enforce a sequential, enforceable build process
- Produce explicit, exhaustive reports

**Constraints:** Do NOT create duplicate contract systems. Use **src/02_Contracts_Reports** as the **canonical authority location** only. Do NOT remove existing contracts. Do NOT invent silent defaults or hidden authority. Everything must be discoverable and reportable. Extensibility must be preserved.

---

## Phase 1 — Analyze Current Contract Surface

### 1.1 Scan location

**Path:** [src/02_Contracts_Reports/contracts/](src/02_Contracts_Reports/contracts/)

### 1.2 Existing contracts (identified)

| Contract | File | Purpose |
|----------|------|---------|
| **Blueprint universe** | [BLUEPRINT_UNIVERSE_CONTRACT.md](src/02_Contracts_Reports/contracts/BLUEPRINT_UNIVERSE_CONTRACT.md) | All allowed blueprint elements, molecules × variants × content slots, behavior verbs |
| **Content derivation** | [CONTENT_DERIVATION_CONTRACT.md](src/02_Contracts_Reports/contracts/CONTENT_DERIVATION_CONTRACT.md) | Content manifest from blueprint; keys must match molecule contract |
| **Engine laws** | [ENGINE_LAWS.md](src/02_Contracts_Reports/contracts/ENGINE_LAWS.md) | Runtime laws (wrapper inspection, preset override, hero, split layout, etc.) — behavioral, not structural |
| **JSON screen contract** | [JSON_SCREEN_CONTRACT.json](src/02_Contracts_Reports/contracts/JSON_SCREEN_CONTRACT.json) | Atoms/molecules: requiredProps, optionalProps, contentKeys, paramKeys; notes that visual params come from Style System/palette |
| **Expected params** | [expected-params.ts](src/02_Contracts_Reports/contracts/expected-params.ts) | Per-molecule expected param keys (surface, label, trigger, etc.) — used by json-renderer |
| **Layout node types** | [layout-node-types.ts](src/02_Contracts_Reports/contracts/layout-node-types.ts) | LAYOUT_NODE_TYPES — used by collapse-layout-nodes and layout |
| **Renderer contract** | [renderer-contract.ts](src/02_Contracts_Reports/contracts/renderer-contract.ts) | NON_ACTIONABLE_TYPES — used by json-renderer |
| **Contract verbs** | [contract-verbs.ts](src/02_Contracts_Reports/contracts/contract-verbs.ts) | CONTRACT_VERBS, inferContractVerbDomain — used by behavior-listener |
| **UI node** | [ui-node.ts](src/02_Contracts_Reports/contracts/ui-node.ts) | UI node type definitions |
| **System contract** | [SystemContract.ts](src/02_Contracts_Reports/contracts/SystemContract.ts) | ExecutionEngineContract, PresentationModelContract, EngineStateContract, etc. — used by engine-system and decision |

Other files in the same folder: README.md, PARAM_KEY_MAPPING.md, CONTRACT_CONSOLIDATION_REPORT.md, ORGAN_CONTRACT_UPDATE_PLAN.md, index.ts, load-app-offline-json.node.ts, tests (critical-path.smoke.test.ts, param-key-mapping.test.ts, showcase-visual-quality.test.ts), master-business.blueprint.txt, legacy/.gitkeep.

### 1.3 Summary: what exists vs what is missing

**Exists:**

- Blueprint universe (structure + molecules + behaviors)
- Content derivation (content manifest rules)
- Engine laws (runtime behavioral laws)
- JSON screen contract (atom/molecule props and content keys; states visual params from Style System)
- Expected params (TypeScript)
- Layout node types (TypeScript)
- Renderer contract (non-actionable types)
- Contract verbs (behavior verbs)
- UI node types
- System contract (engine/presentation/state types)

**Missing (to formalize in Phase 2):**

- **Palette system** — No single contract that defines what a palette is, how it is structured, layered, or extended; that no hardcoded styles are allowed; that all visual tokens come from palette variables; and that new palettes must conform. (JSON_SCREEN_CONTRACT and ENGINE_LAWS mention Style System/palette but do not define the palette system.)
- **Layout system** — No single contract that explicitly lists the 8 structure types, how templates attach to structure types, that layout selection must be declared, that layout is data-driven not TSX-driven, and how new layouts may be added. (layout-node-types and tsx-structure exist in code but are not documented as a contract.)
- **Rendering purity** — No single contract that states: no hardcoded styles, no default visual fallbacks inside components, no business logic in TSX wrappers, JSON as structure authority, engines as behavior authority, palettes as style authority.

**Already aligned with “no duplicate authority”:** All contracts remain under **src/02_Contracts_Reports/contracts/**. Build protocol and build reports will live under **src/02_Contracts_Reports/** in new subfolders (build_protocol/, build_reports/), not in a separate root-level docs folder.

---

## Phase 2 — Formalize Missing Core Contracts

Create the following **new** contracts under [src/02_Contracts_Reports/contracts/](src/02_Contracts_Reports/contracts/). Do not remove or replace existing contracts.

### 2.1 PALETTE_SYSTEM_CONTRACT.md

**Path:** `src/02_Contracts_Reports/contracts/PALETTE_SYSTEM_CONTRACT.md`

**Must define:**

- What a palette is (e.g. a named set of design tokens: colors, spacing, typography, radii, etc.).
- How palettes are structured (e.g. JSON with a known shape; list required and optional top-level keys).
- How palettes are layered or extended (e.g. base palette + override keys; or inheritance/convention).
- No hardcoded styles are allowed in components; all style values that affect look-and-feel must be resolvable from palette (or layout) variables.
- All visual tokens used in rendering must come from palette variables (e.g. CSS vars or a runtime token map derived from the selected palette).
- New palettes must conform to this shape and be discoverable (e.g. under a single directory); adding a new palette must not require code edits to a central enum.

**Tone:** Extensible — allow future expansion (new token keys, new palettes) without refactoring the contract.

### 2.2 LAYOUT_SYSTEM_CONTRACT.md

**Path:** `src/02_Contracts_Reports/contracts/LAYOUT_SYSTEM_CONTRACT.md`

**Must define:**

- The **8 structure types**, explicitly listed: `list`, `board`, `dashboard`, `editor`, `timeline`, `detail`, `wizard`, `gallery`.
- How templates attach to structure types (e.g. each structure type has a set of template IDs; each template is a config object).
- Layout selection must be declared (e.g. in app/screen metadata or config), not inferred implicitly in code.
- Layout is data-driven, not TSX-driven: structure type and template are chosen from config/JSON; TSX consumes the resolved config and does not hardcode layout structure.
- How new layouts may be added without breaking the system (e.g. add a new template ID under an existing structure type, or extend the structure-type list in this contract and in the resolver; no hardcoded switch in TSX).

**Tone:** Extensible — allow new templates and, with contract update, new structure types.

### 2.3 RENDERING_PURITY_CONTRACT.md

**Path:** `src/02_Contracts_Reports/contracts/RENDERING_PURITY_CONTRACT.md`

**Must define:**

- No hardcoded styles in components (colors, spacing, fonts, etc. must come from palette/layout/system).
- No default visual fallbacks inside components that bypass the palette (e.g. no `color: '#333'` or `margin: 12` as fallback when a token is missing; use tokens only).
- No business logic inside TSX wrappers: TSX is for rendering only; logic lives in engines or data.
- JSON is structure authority: screen structure (nodes, hierarchy, visibility) comes from JSON (e.g. app.json, screen JSON), not from TSX conditionals or structure.
- Engines are behavior authority: actions, flow, and state transitions are defined by engines and registry, not by ad-hoc handlers in TSX.
- Palettes are style authority: visual appearance is determined by the selected palette and its tokens, not by inline styles or component-level defaults.

**Tone:** Extensible — the contract defines boundaries (no hardcoding, authority roles) so that new components and new apps can be added within those boundaries.

---

## Phase 3 — Create Build Protocol

### 3.1 Location

**Path:** [src/02_Contracts_Reports/build_protocol/APP_BUILD_PROTOCOL_V2.md](src/02_Contracts_Reports/build_protocol/APP_BUILD_PROTOCOL_V2.md)

Create the directory `src/02_Contracts_Reports/build_protocol/` if it does not exist.

### 3.2 Mandatory build order (10 steps)

The file must define the following steps. **No step may be skipped. No step may be reordered. TSX must always be last** (step 9). Build report is step 10.

| Step | Title | Required behavior |
|------|--------|-------------------|
| **STEP 1** | Extract Universal System | Identify and document any reusable system (engine, primitive, molecule, behavior) that is cross-app. No invention that applies only to a single app without going through contracts. |
| **STEP 2** | Register or extend Engine | Register or extend engines; define JSON input/output shape. Only engines from the engine capability/registry; no logic in TSX. |
| **STEP 3** | Define Blueprint + Content | Define blueprint and content using molecule contracts (Blueprint Universe, Content Derivation). All structure in JSON. |
| **STEP 4** | Select Structure Type | Choose exactly one of the 8 structure types. Explicitly list all 8 in the protocol: `list`, `board`, `dashboard`, `editor`, `timeline`, `detail`, `wizard`, `gallery`. Selection must be declared and from contract. |
| **STEP 5** | Select Template | Select a template for the chosen structure type (from builtin templates or contract). Template must be declared, not hardcoded. |
| **STEP 6** | Select Molecules | List available molecules (from contract) and which were chosen for this build. Only contract molecules may be used. |
| **STEP 7** | Bind Behaviors | Bind behaviors from the action/behavior registry only. No one-off handlers. |
| **STEP 8** | Select Palette | List available palettes (discovered) and which was chosen. Only discovered palettes; no hardcoded theme. |
| **STEP 9** | Render TSX wrapper | TSX is dumb: no business logic, no structure invention, no palette/layout/behavior hardcoding. Consumes JSON and contract-driven config only. |
| **STEP 10** | Generate Build Report | Emit Build Report to `src/02_Contracts_Reports/build_reports/` with full visibility (see Phase 4). |

Document clearly in the file: **No step may be skipped. No step may be reordered. TSX must always be last.**

---

## Phase 4 — Reporting System

### 4.1 Modify npm run apps

**File:** [src/07_Dev_Tools/scripts/run-apps.ts](src/07_Dev_Tools/scripts/run-apps.ts)

**Behavior:**

- **Scan all system contracts** under `src/02_Contracts_Reports/contracts/` (and any referenced discovery paths: palettes dir, layout-definitions, action-registry, engines, molecules, organ-index).
- **List:**
  - All structure types (8)
  - All templates (per structure type)
  - All molecules (from molecule contract / blueprint universe)
  - All engines (from registry after loadRegistrations)
  - All palettes (from palette discovery)
- **Show which were selected** for the current run or for each scanned app (structure type, template, molecules, engines, palette).
- **Flag any violation** of the Rendering Purity Contract (e.g. hardcoded styles, default fallbacks in components, business logic in TSX, structure not from JSON, behavior not from registry, style not from palette).
- **Output report to:** [src/02_Contracts_Reports/build_reports/](src/02_Contracts_Reports/build_reports/)

Create the directory `src/02_Contracts_Reports/build_reports/` if it does not exist.

### 4.2 Report content (explicit)

Each report must explicitly show:

- **What was available** — Full authority surface: all structure types, all templates, all molecules, all engines, all palettes (and optionally blueprint node types, actions).
- **What was selected** — For the build or scan: selected structure type, template, molecules, engines, palette.
- **What was invented** — Anything used or proposed that is not from the contracts (must be flagged; if proposed as a new universal system, it must be defined as engine/contract with JSON I/O and reuse rules).
- **What violated contracts** — Each violation of Rendering Purity (or other contracts), with a short description.

Optional: align with the previous “five questions” (What did I see? What did I choose? What did I invent? What did I violate? What universal system did I extract?) as a summary block at the end of the report.

### 4.3 No building in run-apps

If the current `run-apps.ts` still calls `compileApp()`, remove that call so that **npm run apps** does not build or compile apps; it only scans contracts, discovers surfaces, and produces the report. The script is a **contract surface scanner** and **report generator**, not a builder.

---

## Implementation Order

1. **Phase 1 (analysis)** — Document the “Existing contracts” and “Missing” summary (this plan serves as that summary; optionally add a short CONTRACT_SURFACE_SUMMARY.md under `src/02_Contracts_Reports/contracts/` or `src/02_Contracts_Reports/`).
2. **Phase 2 (new contracts)** — Create the three new markdown files in `src/02_Contracts_Reports/contracts/`: PALETTE_SYSTEM_CONTRACT.md, LAYOUT_SYSTEM_CONTRACT.md, RENDERING_PURITY_CONTRACT.md. Do not remove or alter existing contracts.
3. **Phase 3 (protocol)** — Create `src/02_Contracts_Reports/build_protocol/` and APP_BUILD_PROTOCOL_V2.md with the 10-step mandatory order and explicit list of 8 structure types.
4. **Phase 4 (reporting)** — Ensure `src/02_Contracts_Reports/build_reports/` exists. Refactor run-apps to: scan contracts and discovery paths; list all structure types, templates, molecules, engines, palettes; determine “selected” (from config or scan); flag Rendering Purity violations; write report with “available / selected / invented / violated”. Remove compileApp() from run-apps if present.

---

## File Structure (canonical authority only)

```
src/02_Contracts_Reports/
  contracts/                          # Existing + 3 new contracts
    BLUEPRINT_UNIVERSE_CONTRACT.md    # (existing)
    CONTENT_DERIVATION_CONTRACT.md     # (existing)
    ENGINE_LAWS.md                    # (existing)
    JSON_SCREEN_CONTRACT.json         # (existing)
    expected-params.ts                # (existing)
    layout-node-types.ts              # (existing)
    renderer-contract.ts               # (existing)
    contract-verbs.ts                  # (existing)
    ui-node.ts                         # (existing)
    SystemContract.ts                  # (existing)
    PALETTE_SYSTEM_CONTRACT.md        # NEW
    LAYOUT_SYSTEM_CONTRACT.md         # NEW
    RENDERING_PURITY_CONTRACT.md      # NEW
    # ... other existing files unchanged
  build_protocol/
    APP_BUILD_PROTOCOL_V2.md          # NEW — 10 steps, 8 structure types
  build_reports/
    BUILD_REPORT_<timestamp>.md       # Output of npm run apps
```

No duplicate contract system; no new root-level docs folder; single source of truth under **src/02_Contracts_Reports**.
