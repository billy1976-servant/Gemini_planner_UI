# V6 Contract Compatibility Report

**Source:** APP_BUILD_PROTOCOL_V6.md as constitutional authority.  
**Scope:** All files in `src/02_Contracts_Reports/contracts/`.  
**Classification:** REQUIRED FOR V6 | SUPPORTING | OPTIONAL | MISALIGNED WITH V6 | POTENTIAL DRIFT SOURCE | INCOMPLETE FOR V6

---

## 1. allowed-molecules.ts

**Classification:** [REQUIRED FOR V6]

- **V6 requirement satisfied:** Step 6 and Step 8 explicitly reference "only 12 allowed molecules" and "see `allowed-molecules.ts`". The file exports the closed set: section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar—exactly the 12 listed in V6.
- **Overlap/duplication:** Same 12 molecules appear in RENDERING_PURITY_CONTRACT.md (§6), BLUEPRINT_UNIVERSE_CONTRACT.md (molecule universe), and V6 Step 6. allowed-molecules.ts is the single runtime/code authority; the others are documentation. Risk of drift if any list is updated without the others.
- **Missing definitions:** None for molecule set. V6 does not define "behavior registry" or "engine registry" here.

---

## 2. BLUEPRINT_UNIVERSE_CONTRACT.md

**Classification:** [REQUIRED FOR V6]

- **V6 requirement satisfied:** Step 3 requires "define blueprint and content using molecule contracts (Blueprint Universe, Content Derivation)". V6 Ecosystem Ticket and Steps 3/8 assume blueprint nodes conform to molecule contract and layout; this contract defines the molecule universe, content slots, behavior verbs, organs, and blueprint grammar.
- **Overlap/duplication:** Molecule list (12) overlaps allowed-molecules.ts and RENDERING_PURITY_CONTRACT.md. Organ definitions overlap JSON_SCREEN_CONTRACT.json organs catalog. Behavior verbs overlap contract-verbs.ts and JSON_SCREEN_CONTRACT behaviorVerbs.
- **Missing definitions:** Does not define "Blueprint type" or "TSX wrapper family" as first-class terms; V6 requires Blueprint type to match TSX wrapper family. "Layout-glossary" is not defined here by name.

---

## 3. CONTENT_DERIVATION_CONTRACT.md

**Classification:** [REQUIRED FOR V6]

- **V6 requirement satisfied:** Step 3 and Ecosystem Ticket C) require content keys 1:1 to blueprint nodes, no orphan keys, no hardcoded text in TSX, universal content structure. This contract defines content derivation from blueprint, content manifest, and merge rules.
- **Overlap/duplication:** Content key rules align with JSON_SCREEN_CONTRACT molecules' allowedContentKeys and PARAM_KEY_MAPPING.md. Organ content bindings align with JSON_SCREEN_CONTRACT organs.
- **Missing definitions:** Does not define "content schema" or "CONTENT.json" shape for Step 3.5 artifact; V6 assumes CONTENT.json exists.

---

## 4. LAYOUT_SYSTEM_CONTRACT.md

**Classification:** [REQUIRED FOR V6]

- **V6 requirement satisfied:** Step 4 and Step 5 require structure type and template "from contract list" and "see LAYOUT_SYSTEM_CONTRACT.md". Defines the 8 structure types and templates-per-type table that match V6 exactly. Declaration requirement (no inference) aligns with V6.
- **Overlap/duplication:** layout-closed-sets.ts encodes the same 8 structure types and template ids; LAYOUT_SYSTEM_CONTRACT is the prose authority, layout-closed-sets.ts is the code authority. Must stay in sync.
- **Missing definitions:** "Layout glossary" and "layout-definitions" (V6 Ecosystem Ticket E) are not defined by name; this contract describes structure types and templates and "template definitions" in codebase (e.g. builtinTemplates). Default structure type/template when not declared is mentioned as "contract-defined default" but not specified.

---

## 5. PALETTE_SYSTEM_CONTRACT.md

**Classification:** [REQUIRED FOR V6]

- **V6 requirement satisfied:** Lock conditions and Rules require "palette system-driven only; no palette selection in compiled module or wrapper" and "no hardcoded styles". Ecosystem Ticket E) requires "Palette system-driven (no selection)". This contract defines palette shape, discovery, and forbids hardcoded styles.
- **Overlap/duplication:** RENDERING_PURITY_CONTRACT.md and V6 Lock Conditions restate no hardcoded styles and palette as style authority.
- **Missing definitions:** None for palette per se. V6 does not name a "palette registry" contract; discovery path is given.

---

## 6. RENDERING_PURITY_CONTRACT.md

**Classification:** [REQUIRED FOR V6]

- **V6 requirement satisfied:** Lock conditions and Rules (no hardcoded styles, no inline behavior, no business logic in TSX, structure from JSON, engines for behavior, palette for style, exactly 12 molecules). This contract defines authority roles (JSON, Engines, Palettes, Layout) and the 12-molecule closed set; aligns with V6.
- **Overlap/duplication:** Molecule list duplicates allowed-molecules.ts and V6. Authority roles duplicate concepts in V6 and PALETTE_SYSTEM_CONTRACT / LAYOUT_SYSTEM_CONTRACT.
- **Missing definitions:** Does not define "behavior registry" or "action registry" shape; it states "behaviors bound via action/behavior registry only" but no contract in folder defines that registry.

---

## 7. layout-closed-sets.ts

**Classification:** [REQUIRED FOR V6]

- **V6 requirement satisfied:** Step 4 and Step 5 require structure types and templates from "contract list". This file is the code source of truth for STRUCTURE_TYPES (8) and TEMPLATES_BY_STRUCTURE_TYPE; used by run-apps and validators. Values match V6 table exactly.
- **Overlap/duplication:** Duplicates LAYOUT_SYSTEM_CONTRACT.md §1 and §3. Canonical code list; LAYOUT_SYSTEM_CONTRACT is prose. Drift if one is updated without the other.
- **Missing definitions:** None for layout closed sets. Does not define "layout-definitions" or "layout glossary."

---

## 8. JSON_SCREEN_CONTRACT.json

**Classification:** [SUPPORTING] with [POTENTIAL DRIFT SOURCE] and [MISALIGNED WITH V6] (partial)

- **V6 requirement satisfied:** Supports Step 3 (molecule contracts), content keys, param keys, and Step 8 (allowed molecules). Defines atoms, molecules (allowedContentKeys, allowedParams, allowedBehaviors), organs, organNode, behaviorVerbs, stateModel, rendererExpectations. Referenced by V6 via "molecule contract" and param-key mapping.
- **Overlap/duplication:** Molecules overlap allowed-molecules.ts (but JSON has two extra entries: JournalHistory, UserInputViewer). Organs overlap BLUEPRINT_UNIVERSE. behaviorVerbs overlap contract-verbs.ts. Param keys overlap PARAM_KEY_MAPPING.md and expected-params.ts.
- **Misalignment:** Defines "JournalHistory" and "UserInputViewer" under molecules; V6 states "exactly 12" molecules and any other is HARD VIOLATION. So JSON_SCREEN_CONTRACT extends the molecule-type surface beyond the 12—either those are non-molecule screen types (and should be documented as such) or this is a MISALIGNED extension.
- **Missing definitions:** Does not define "TSX wrapper family" or "Blueprint type." Engine registry and action/behavior registry not defined.

---

## 9. PARAM_KEY_MAPPING.md

**Classification:** [SUPPORTING]

- **V6 requirement satisfied:** Supports Step 3 and Step 8 by aligning JSON_SCREEN_CONTRACT allowedParams, definition variant keys, and compound props. Ensures content/param keys match molecule contract so compiled module receives correct params.
- **Overlap/duplication:** Aligns with JSON_SCREEN_CONTRACT.json molecules, expected-params.ts, and compound definitions. Redundant with JSON for param keys but human-readable.
- **Missing definitions:** None required by V6 for param mapping.

---

## 10. expected-params.ts

**Classification:** [SUPPORTING]

- **V6 requirement satisfied:** Supports Step 8 and renderer diagnostics; must align with PARAM_KEY_MAPPING.md and JSON_SCREEN_CONTRACT allowedParams. Used for param-key-mapping test and validation.
- **Overlap/duplication:** Duplicates param keys from PARAM_KEY_MAPPING and JSON_SCREEN_CONTRACT; code authority for expected params per molecule. Stepper not listed (empty or steps-based); JSON has stepper with empty allowedParams—acceptable.
- **Missing definitions:** None.

---

## 11. contract-verbs.ts

**Classification:** [SUPPORTING]

- **V6 requirement satisfied:** Step 7 and Lock Conditions require "behaviors from action/behavior registry only" and "registry-only." This file defines the contract verb set (interaction, navigation, image domain) used by behavior-listener routing; it does not define the registry itself but defines which verbs are "contract" verbs.
- **Overlap/duplication:** Overlaps JSON_SCREEN_CONTRACT behaviorVerbs and BLUEPRINT_UNIVERSE behavior universe. Single code source for verb lists used in behavior routing.
- **Missing definitions:** Does not define the behavior/action registry shape or extension rules; V6 requires "registry-only" but no contract defines the registry.

---

## 12. layout-node-types.ts

**Classification:** [SUPPORTING]

- **V6 requirement satisfied:** Defines layout node types (Grid, Row, Column, Stack) that must not appear as node types in JSON (content-only rule); used for collapse-layout-nodes. Supports "no layout inference" and layout from Layout Engine / Preset.
- **Overlap/duplication:** Complements LAYOUT_SYSTEM_CONTRACT (structure types/templates) with layout primitives that are runtime-resolved, not screen JSON.
- **Missing definitions:** None for V6.

---

## 13. ENGINE_LAWS.md

**Classification:** [SUPPORTING] and [INCOMPLETE FOR V6]

- **V6 requirement satisfied:** Step 1, Step 2, and Ecosystem Ticket D) require engine binding, JSON I/O, engine logic outside TSX. ENGINE_LAWS describes runtime laws (wrapper inspection, preset override, hero, split layout, param merge, content on node, etc.) that implement engine/renderer boundaries. Supports "engine behavior is authority" and "no logic in TSX."
- **Overlap/duplication:** Complements RENDERING_PURITY_CONTRACT (engines as behavior authority). Does not duplicate engine registry or JSON I/O schema.
- **Missing definitions:** V6 requires "engine capability/registry" and "Engine JSON I/O" and "Engine input/output (declared)." ENGINE_LAWS does not define the engine registry shape, engine registration, or JSON I/O contract; it defines runtime behavior laws. So engine binding/registry is INCOMPLETE—no contract in folder defines engine registry or engine I/O schema.

---

## 14. renderer-contract.ts

**Classification:** [SUPPORTING] and [POTENTIAL DRIFT SOURCE]

- **V6 requirement satisfied:** Exports NON_ACTIONABLE_TYPES from config (rendererContract.nonActionableTypes). Supports renderer behavior boundary (which types do not get behavior). Aligns with "no inline behavior" and registry-only behavior by defining which types are non-actionable.
- **Overlap/duplication:** Reads from config.json, not from contracts folder; so the contract "surface" is in config. Non-actionable set may overlap RENDERING_PURITY_CONTRACT and BLUEPRINT_UNIVERSE (structural molecules).
- **Missing definitions:** Contract shape (nonActionableTypes) is in config; this file is a re-export. No formal "renderer contract" document in contracts folder.

---

## 15. ui-node.ts

**Classification:** [SUPPORTING]

- **V6 requirement satisfied:** Type definitions (UIParams, UINodeProps) for node shape used by renderer and engine. Supports Step 8 (compiled module node shape) and structure authority (id, content, behavior, layout, params, children).
- **Overlap/duplication:** Aligns with JSON_SCREEN_CONTRACT rendererExpectations (optionalKeysPerNode) and BLUEPRINT_UNIVERSE node shape.
- **Missing definitions:** None for V6.

---

## 16. SystemContract.ts

**Classification:** [OPTIONAL] for V6 build protocol

- **V6 requirement satisfied:** Not referenced by V6. Defines EngineStateContract, ValueImpactBlockContract, and other system types used by runtime (e.g. decision console, calculator). Supports ecosystem compatibility (state slices, engine output) but V6 does not name it.
- **Overlap/duplication:** Used by logic/engines and state; no overlap with molecule/layout/blueprint contracts.
- **Missing definitions:** N/A for V6. Could support "state slices reused" in Ecosystem Ticket E) but not declared as authority.

---

## 17. index.ts

**Classification:** [OPTIONAL]

- **V6 requirement satisfied:** Re-exports contract modules; no requirement in V6 for this file. Facilitates imports from a single entry.
- **Overlap/duplication:** Does not add content; re-exports only.
- **Missing definitions:** None.

---

## 18. ORGAN_CONTRACT_UPDATE_PLAN.md

**Classification:** [OPTIONAL] and [POTENTIAL DRIFT SOURCE]

- **V6 requirement satisfied:** Plan only; describes additive updates to JSON_SCREEN_CONTRACT, BLUEPRINT_UNIVERSE_CONTRACT, CONTENT_DERIVATION_CONTRACT for organ nodes. V6 does not reference it. If implemented, would support organ blueprint/content binding already partially present in BLUEPRINT_UNIVERSE and JSON_SCREEN_CONTRACT.
- **Overlap/duplication:** References existing contracts; organNode already present in JSON_SCREEN_CONTRACT.json.
- **Missing definitions:** Plan, not a contract. Drift risk if plan is executed and other contracts diverge.

---

## 19. CONTRACT_CONSOLIDATION_REPORT.md

**Classification:** [OPTIONAL]

- **V6 requirement satisfied:** Historical report on contract file moves and organization. Not referenced by V6. Useful for understanding contract layout.
- **Overlap/duplication:** None.
- **Missing definitions:** None.

---

## 20. README.md

**Classification:** [OPTIONAL]

- **V6 requirement satisfied:** States "REFERENCE ONLY — NOT USED BY EXPORTER" and canonical modules path (apps-json/apps). V6 does not reference it. May cause confusion: path and "exporter" are not part of V6 build steps.
- **Overlap/duplication:** None.
- **Missing definitions:** None.

---

## 21. master-business.blueprint.txt

**Classification:** [OPTIONAL]

- **V6 requirement satisfied:** Example blueprint file (MasterBusinessWebsite) using organs and sections. Illustrates blueprint grammar from BLUEPRINT_UNIVERSE_CONTRACT; not a contract itself. V6 does not require it.
- **Overlap/duplication:** Conforms to BLUEPRINT_UNIVERSE (organ:, Section, Button, etc.).
- **Missing definitions:** None.

---

## 22. load-app-offline-json.node.ts

**Classification:** [OPTIONAL]

- **V6 requirement satisfied:** Node-only loader for contract tests; loads JSON from path (references "src/apps-json/apps"). Not referenced by V6. Used by param-key-mapping.test.ts and showcase-visual-quality.test.ts.
- **Overlap/duplication:** Path may not match README (apps-json vs 01_App); test helper only.
- **Missing definitions:** None. Does not define build artifacts or Step 0 path.

---

## 23. param-key-mapping.test.ts

**Classification:** [OPTIONAL]

- **V6 requirement satisfied:** Test that asserts definition ↔ contract alignment for molecule params. Prevents param key drift. V6 does not require this file; it supports consistency required by Step 3/8.
- **Overlap/duplication:** Uses EXPECTED_PARAMS, JSON_SCREEN_CONTRACT, loadAppOfflineJson, definitions from components.
- **Missing definitions:** None.

---

## 24. showcase-visual-quality.test.ts

**Classification:** [OPTIONAL]

- **V6 requirement satisfied:** Asserts showcase-home.json structure for rendering quality. Not referenced by V6. Supports quality checks outside build protocol.
- **Overlap/duplication:** Uses load-app-offline-json.node.ts; references websocket path.
- **Missing definitions:** None.

---

## 25. critical-path.smoke.test.ts

**Classification:** [OPTIONAL]

- **V6 requirement satisfied:** Smoke test for deriveState, loadScreen, behavior-listener. Ensures critical runtime path remains importable. V6 does not require it; supports runtime contract stability.
- **Overlap/duplication:** None with other contracts.
- **Missing definitions:** None.

---

## 26. legacy/.gitkeep

**Classification:** [OPTIONAL]

- **V6 requirement satisfied:** Placeholder; no content. Not referenced by V6.
- **Overlap/duplication:** None.
- **Missing definitions:** None.

---

## Summary by classification

| Classification | Contracts |
|----------------|-----------|
| **REQUIRED FOR V6** | allowed-molecules.ts, BLUEPRINT_UNIVERSE_CONTRACT.md, CONTENT_DERIVATION_CONTRACT.md, LAYOUT_SYSTEM_CONTRACT.md, PALETTE_SYSTEM_CONTRACT.md, RENDERING_PURITY_CONTRACT.md, layout-closed-sets.ts |
| **SUPPORTING** | JSON_SCREEN_CONTRACT.json, PARAM_KEY_MAPPING.md, expected-params.ts, contract-verbs.ts, layout-node-types.ts, ENGINE_LAWS.md, renderer-contract.ts, ui-node.ts |
| **OPTIONAL** | SystemContract.ts, index.ts, ORGAN_CONTRACT_UPDATE_PLAN.md, CONTRACT_CONSOLIDATION_REPORT.md, README.md, master-business.blueprint.txt, load-app-offline-json.node.ts, param-key-mapping.test.ts, showcase-visual-quality.test.ts, critical-path.smoke.test.ts, legacy/.gitkeep |
| **MISALIGNED WITH V6** | JSON_SCREEN_CONTRACT.json (JournalHistory, UserInputViewer under molecules—beyond 12) |
| **POTENTIAL DRIFT SOURCE** | allowed-molecules.ts vs RENDERING_PURITY vs BLUEPRINT_UNIVERSE (12 molecules); layout-closed-sets.ts vs LAYOUT_SYSTEM_CONTRACT; JSON_SCREEN_CONTRACT (extra molecule-like types); renderer-contract.ts (config vs contracts); ORGAN_CONTRACT_UPDATE_PLAN |
| **INCOMPLETE FOR V6** | No contract defines behavior/action registry shape or extension rules; no contract defines engine registry or engine JSON I/O schema; ENGINE_LAWS supports engine boundary but does not define registry/I/O |
