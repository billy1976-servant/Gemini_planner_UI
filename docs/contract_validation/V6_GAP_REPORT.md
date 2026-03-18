# V6 Gap Report

**Source:** APP_BUILD_PROTOCOL_V6.md. Gaps are identified strictly from V6 text; no new architecture is proposed.

---

## 1. Missing required contracts

### 1.1 Behavior / action registry

- **V6 requirement:** Step 7: "Bind behaviors from the action/behavior registry only. No one-off handlers." Lock conditions: "all behavior via registry." Ecosystem Ticket E): "Behaviors registry-only." Rules: "all behavior via registry."
- **Gap:** No contract in `src/02_Contracts_Reports/contracts/` defines:
  - The shape of the action/behavior registry (e.g. name → handler, or name → { handler, schema }).
  - Which action names are allowed or how they are registered.
  - Extension rules (how to add a new behavior/action).
- **Effect:** Build and validators cannot verify "registry-only" against a formal contract; "action/behavior registry" is an implementation detail (e.g. action-registry.ts) not a contract in the contracts folder.

### 1.2 Engine registry and engine JSON I/O

- **V6 requirement:** Step 1: "existing engines"; Step 2: "Use only engines from the engine capability/registry" and "define JSON input/output shape"; Step 2.5 D): "list discovered engine registry," "Engine input/output (declared)," "Engine JSON layouts defined (if new)"; Rules: "All new engines must define JSON I/O schema."
- **Gap:** No contract in the contracts folder defines:
  - The engine registry (engine id → engine or engine descriptor).
  - The required JSON input/output schema for an engine.
  - How engines are registered or discovered.
- **Effect:** ENGINE_LAWS.md describes runtime laws (wrapper inspection, presets, etc.) but does not define registry shape or I/O contract. Step 2 and Ecosystem Ticket D) assume a defined registry and I/O; neither exists as a contract.

### 1.3 Layout glossary / layout-definitions

- **V6 requirement:** Ecosystem Ticket B): "Blueprint is layout-glossary driven." Ecosystem Ticket E): "Layout IDs driven by layout-definitions."
- **Gap:** The terms "layout-glossary" and "layout-definitions" are not defined in any contract. LAYOUT_SYSTEM_CONTRACT.md defines structure types and templates and refers to "template definitions" in the codebase (e.g. builtinTemplates). layout-closed-sets.ts defines the closed sets. It is ambiguous whether "layout-glossary" = LAYOUT_SYSTEM_CONTRACT + layout-closed-sets, or a separate artifact (e.g. a glossary file), and whether "layout-definitions" = template definitions in code or a contract document.
- **Effect:** Build Ticket checkboxes cannot be verified against a single named contract.

---

## 2. Ambiguity zones

### 2.1 "Contract list" / "from contract" for molecules

- **V6:** Step 6: "Only contract molecules may be used"; Step 8: "Only 12 allowed molecules (see allowed-molecules.ts)."
- **Ambiguity:** The 12 molecules appear in (1) V6 text, (2) allowed-molecules.ts, (3) RENDERING_PURITY_CONTRACT.md §6, (4) BLUEPRINT_UNIVERSE_CONTRACT.md. V6 names allowed-molecules.ts for Step 8; Step 3 names "molecule contracts (Blueprint Universe, Content Derivation)." So "contract" could mean the .ts file, the markdown contracts, or both. Canonical source for the list is not explicitly declared (e.g. "allowed-molecules.ts is the single source of truth for the 12").

### 2.2 Default structure type or template

- **V6:** Step 4/5: "Selection must be declared in app/screen config—no guessing or inference."
- **Ambiguity:** LAYOUT_SYSTEM_CONTRACT.md allows "a contract-defined default for that structure type" when template is not specified, but does not name which contract or file defines that default (e.g. resolver, builtinTemplates, or a contract doc). V6 does not mention a default; so if "declared" is missing, it is unclear whether a default is permitted and where it is defined.

### 2.3 TSX wrapper family and Blueprint type

- **V6:** Ecosystem Ticket A): "SELECTED TSX FAMILY: Type, Template"; B): "BLUEPRINT TYPE: (new required field; must match TSX wrapper family)." Rules: "Blueprint type must be declared and tied to TSX wrapper family."
- **Ambiguity:** No contract defines "TSX wrapper family" (is it structure type + template, or a separate taxonomy?). No contract defines "Blueprint type" as a formal field or enum. LAYOUT_SYSTEM_CONTRACT defines structure types and templates; the binding between Blueprint type and TSX wrapper family is not specified in any contract.

---

## 3. Drift vectors

### 3.1 Multiple sources for the 12 molecules

- **Sources:** V6 (Step 6 table), allowed-molecules.ts, RENDERING_PURITY_CONTRACT.md §6, BLUEPRINT_UNIVERSE_CONTRACT.md (molecule universe). Same 12 names in all; if one is updated (e.g. typo, reorder, or future change), others can diverge.
- **Recommendation (document only):** Declare one canonical source (e.g. allowed-molecules.ts) and state in V6 or authority declaration that other docs reference it.

### 3.2 Structure types and templates in three places

- **Sources:** V6 (Step 5 table), LAYOUT_SYSTEM_CONTRACT.md §1 and §3, layout-closed-sets.ts. Same 8 types and same template ids; code (layout-closed-sets.ts) and prose (LAYOUT_SYSTEM_CONTRACT) must stay in sync.
- **Drift:** Adding a new template in code without updating LAYOUT_SYSTEM_CONTRACT (or vice versa) causes mismatch.

### 3.3 JSON_SCREEN_CONTRACT molecule surface vs 12 molecules

- **Sources:** JSON_SCREEN_CONTRACT.json includes "JournalHistory" and "UserInputViewer" under molecules. V6 and allowed-molecules.ts define exactly 12; those two are not in the 12.
- **Drift:** Either those types are special (e.g. screen-level, not molecules) and should be documented outside the molecule list, or they are a violation of the closed set. Unclear status causes drift between "12 molecules" and "molecules in JSON contract."

### 3.4 Renderer contract in config vs contracts folder

- **Sources:** renderer-contract.ts reads config.rendererContract (e.g. nonActionableTypes). The contract shape lives in config, not in contracts folder.
- **Drift:** Changes to renderer contract are in config; documents in contracts folder do not define this surface, so validation and docs can diverge from runtime.

---

## 4. Execution seams not formally declared

### 4.1 Step 0 — npm run apps and Build Report path

- **V6:** Step 0: "Run npm run apps"; "Load the most recent Build Report from build_reports/"; emit SYSTEM_SCAN_REPORT.md.
- **Gap:** No contract defines: the schema of SYSTEM_SCAN_REPORT.md; the schema of "most recent Build Report"; or the contract for what "npm run apps" must produce. Tooling and report format are implementation-defined.

### 4.2 Step 8 — Compile Blueprint+Content → TSX Screen Module

- **V6:** Step 8: Input blueprint + content; output one Compiled TSX Screen Module file; deterministic; 12 molecules; engine/behavior bindings declared; no inline styles/palette/layout inference.
- **Gap:** No contract defines: the input schema (blueprint format, content format); the output schema (TSX module file structure, exports, props); or the compilation algorithm. "Compiled TSX Screen Module" is a requirement label, not a formal interface.

### 4.3 Step 9 — Wrapper consumes Compiled TSX Screen Module

- **V6:** Step 9: Wrapper consumes the Compiled TSX Screen Module from Step 8; provides only state, palette context, layout context; no business logic, no structure invention, no engine logic, no inline behaviors.
- **Gap:** No contract defines: the wrapper interface (what props/context the wrapper receives and provides); how the wrapper imports or mounts the compiled module; or the contract between wrapper and module. "Consumes" is not formally specified.

### 4.4 Resolver strategy

- **V6:** Ecosystem Ticket E): "Resolver strategy declared (evidence)."
- **Gap:** No contract names the resolver or defines "resolver strategy." Layout resolution is described in LAYOUT_SYSTEM_CONTRACT and implementation (e.g. resolver, builtinTemplates) but there is no contract document that defines the resolver's contract or strategy.

---

## 5. V6 depends on undefined behavior

### 5.1 Engine binding shape

- **V6:** Step 2.5 D): "Engine input/output (declared); bindings to blueprint/TSX module"; "Blueprint node bindings."
- **Gap:** "Bindings to blueprint/TSX module" and "Blueprint node bindings" are not defined. No contract specifies how an engine is bound to blueprint nodes or to the TSX module (e.g. by node id, by type, by role).

### 5.2 State slices reused

- **V6:** Ecosystem Ticket E): "State slices reused (list)."
- **Gap:** No contract in the contracts folder defines "state slices" or which state slices exist or how they are reused. State model is partially in JSON_SCREEN_CONTRACT (stateModel) but "state slices" as a reusable list is not a formal contract.

### 5.3 Resolver strategy declared

- **V6:** Ecosystem Ticket E): "Resolver strategy declared (evidence)."
- **Gap:** "Resolver strategy" is not defined. No contract states what must be declared or what evidence is required (e.g. file path, config key, or document reference).

---

## Summary

- **Missing contracts:** Behavior/action registry; engine registry and engine JSON I/O; optional: layout-glossary / layout-definitions (or explicit mapping to existing contracts).
- **Ambiguity:** Canonical source for 12 molecules; default structure type/template; TSX wrapper family and Blueprint type.
- **Drift:** 12 molecules in four places; structure/template list in V6 + LAYOUT_SYSTEM_CONTRACT + layout-closed-sets; JSON_SCREEN_CONTRACT molecule types vs 12; renderer contract in config.
- **Execution seams:** Step 0 report schema and tooling; Step 8 compile input/output and algorithm; Step 9 wrapper interface; resolver strategy.
- **Undefined behavior:** Engine binding shape; state slices; resolver strategy evidence.

All of the above are derived only from V6 text and existing contracts; no new architecture or redesign is proposed.
