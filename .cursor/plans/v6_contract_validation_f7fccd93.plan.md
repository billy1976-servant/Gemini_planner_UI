---
name: V6 Contract Validation
overview: "Validate all contracts in `src/02_Contracts_Reports/contracts/` against APP_BUILD_PROTOCOL_V6.md as constitutional authority, producing four deliverables: a V6 requirement matrix, a compatibility report per contract, a gap report, and an authority declaration file—without modifying, moving, or deleting any existing files."
todos: []
isProject: false
---

# V6 Contract Validation Plan

## Scope and constraints

- **Constitutional authority:** [APP_BUILD_PROTOCOL_V6.md](src/02_Contracts_Reports/build_protocol/APP_BUILD_PROTOCOL_V6.md).
- **Contract set:** All files under [src/02_Contracts_Reports/contracts/](src/02_Contracts_Reports/contracts/) (including `.ts`, `.md`, `.json`, `.txt`; excluding `legacy/.gitkeep` only as placeholder).
- **No:** file edits, deletions, moves, refactors, new architecture, build execution, or runtime redesign. Decisions must be based on contract and V6 text content, not on who imports what.

---

## Phase 1 — V6 requirement extraction

**Objective:** Turn V6 into a structured requirement set and assign each requirement to an authority type.

**Steps:**

1. **Parse V6** and extract:
  - **Authority surfaces:** Blueprint + Content as authority; 8 structure types and templates (from contract list); 12 molecules (closed set); engine registry and JSON I/O; behavior/action registry-only; palette system-driven; TSX wrapper family; Compiled TSX Screen Module.
  - **Invariants:** No step skip/reorder; TSX wrapper always Step 9, Build Report Step 10; exactly 12 molecules (any other = HARD VIOLATION); registry-only behavior; no hardcoded styles; no inline behavior in TSX; structure type and template declared not inferred; Blueprint type tied to TSX wrapper family; palette system-driven; no wrapper defaults; no engine logic in TSX; all new engines define JSON I/O; ecosystem compatibility verified.
  - **Compile guarantees:** Step 0–10 required artifacts (SYSTEM_SCAN_REPORT, BLUEPRINT.outline, CONTENT.json, BUILD_PLAN_ANALYSIS, COMPILED_TSX_SCREEN_MODULE, WRAPPER_VALIDATION_REPORT, FINAL_BUILD_REPORT); Lock Conditions (no hardcoded styles, no inline behavior, no structure invention in wrapper, no engine logic in wrapper/module, palette system-driven only).
  - **Ecosystem Build Ticket (Step 2.5):** Checklist format; TSX wrapper family selection; Blueprint ↔ TSX binding; Content ↔ Blueprint binding; Engine binding; system-driven layers (palette, layout IDs, behaviors registry-only, state slices, resolver strategy); one-app ecosystem compatibility; missing/unresolved list.
2. **Map each requirement to an authority type** using exactly: Blueprint | Content | Layout | Engine | Render | Behavior | Palette (and “Build” where the requirement is about steps/artifacts only).
3. **Produce:** `docs/contract_validation/V6_REQUIREMENT_MATRIX.md` with:
  - Table or section per requirement: **V6 Requirement** (short id or quote), **Why it exists** (one line), **Required authority type** (one or more of the list above).

**Key V6 citations to include:**

- Lines 3–7: Authority (Blueprint + Content; Compiled TSX Screen Module); canonical locations.
- Lines 26–39: Required artifacts per step.
- Lines 78–221: Ecosystem Build Ticket (wrapper, Blueprint↔TSX, Content↔Blueprint, Engine binding, system-driven layers).
- Lines 223–266: Steps 3–7 (molecules, structure type, template, behaviors registry-only).
- Lines 270–294: Step 8 (compile) and Step 9 (wrapper) constraints.
- Lines 298–302: Build Report content.
- Lines 304–309: Lock conditions.
- Lines 311–327: Rules (12 molecules, palette, declaration, etc.).

---

## Phase 2 — Contract compatibility scan

**Objective:** Classify every file in `contracts/` against V6 and document satisfaction/failure, overlap, and missing definitions.

**Contract inventory (from repo):**

- **Markdown:** BLUEPRINT_UNIVERSE_CONTRACT.md, CONTENT_DERIVATION_CONTRACT.md, LAYOUT_SYSTEM_CONTRACT.md, PALETTE_SYSTEM_CONTRACT.md, RENDERING_PURITY_CONTRACT.md, ENGINE_LAWS.md, PARAM_KEY_MAPPING.md, ORGAN_CONTRACT_UPDATE_PLAN.md, CONTRACT_CONSOLIDATION_REPORT.md, README.md.
- **TypeScript/JSON:** allowed-molecules.ts, layout-closed-sets.ts, layout-node-types.ts, contract-verbs.ts, renderer-contract.ts, SystemContract.ts, ui-node.ts, expected-params.ts, index.ts, JSON_SCREEN_CONTRACT.json.
- **Other:** master-business.blueprint.txt, load-app-offline-json.node.ts, param-key-mapping.test.ts, showcase-visual-quality.test.ts, critical-path.smoke.test.ts.

**Classification rules:**

- **[REQUIRED FOR V6]:** Contract is the named authority for a V6 requirement (e.g. V6 says “see allowed-molecules.ts”, “LAYOUT_SYSTEM_CONTRACT”, “molecule contracts”, “palette system”).
- **[SUPPORTING]:** Supports a V6 requirement but is not the single named source (e.g. param key alignment, content key mapping).
- **[OPTIONAL]:** Useful for tooling or tests but not referenced by V6 as authority.
- **[MISALIGNED WITH V6]:** Contradicts or relaxes a V6 invariant (e.g. different molecule set, inference where V6 requires declaration).
- **[POTENTIAL DRIFT SOURCE]:** Defines concepts V6 depends on but with different naming, scope, or semantics (e.g. “layout-definitions” vs “templates”).
- **[INCOMPLETE FOR V6]:** Partially satisfies a V6 requirement but omits required definitions (e.g. no formal behavior-registry contract).

**Per contract, document:**

- Which V6 requirement(s) it satisfies or fails (by requirement id or quote).
- Overlap or duplication with other contracts.
- Missing definitions that V6 assumes (e.g. “behavior registry”, “engine registry”, “layout-definitions”, “layout-glossary”).

**Output:** `docs/contract_validation/V6_COMPATIBILITY_REPORT.md` with one section per contract file, using the classifications above and the three bullets.

**Critical checks:**

- **allowed-molecules.ts** vs V6 “exactly 12” and list (section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar): confirm 1:1.
- **LAYOUT_SYSTEM_CONTRACT.md** vs V6 “8 structure types” and template table (Steps 4–5): confirm match.
- **layout-closed-sets.ts** vs LAYOUT_SYSTEM_CONTRACT: same closed sets.
- **RENDERING_PURITY_CONTRACT.md** vs V6 Lock Conditions and Rules: no conflict.
- **ENGINE_LAWS.md:** implementation laws; V6 requires “engine binding” and “engine registry”—whether ENGINE_LAWS is sufficient or a separate Engine Binding contract is missing (gap).
- **Behavior:** V6 requires “registry-only” and “action/behavior registry”; no contract in folder defines the registry’s shape or authority → INCOMPLETE / gap.
- **Blueprint type / TSX family:** V6 requires “Blueprint type must match TSX wrapper family”; which contract defines “TSX wrapper family” and “Blueprint type” explicitly.

---

## Phase 3 — Gap identification

**Objective:** List what V6 assumes but contracts do not define, and where ambiguity or drift can occur.

**Output:** `docs/contract_validation/V6_GAP_REPORT.md` with these sections:

1. **Missing required contracts**
  - Behavior/action registry: V6 requires “registry-only” and “bind behaviors from the action/behavior registry”; no contract in `contracts/` defines registry shape, allowed action names, or extension rules.
  - Engine binding/registry: V6 requires “engines from engine capability/registry” and “Engine JSON I/O”; ENGINE_LAWS describes runtime laws, not the formal registry or JSON I/O contract.
  - Optional: “Layout glossary” / “layout-definitions”: V6 checkboxes reference these; map to LAYOUT_SYSTEM_CONTRACT + layout-closed-sets or call out as undefined terms.
2. **Ambiguity zones**
  - Where “contract list” or “from contract” in V6 could mean more than one file (e.g. molecules: allowed-molecules.ts vs BLUEPRINT_UNIVERSE vs RENDERING_PURITY_CONTRACT).
  - Default structure type or template when “declared” is missing (V6 says “declared”; LAYOUT_SYSTEM_CONTRACT allows “contract-defined default” but which contract defines it).
3. **Drift vectors**
  - Multiple sources for the same closed set (e.g. 12 molecules in V6, RENDERING_PURITY_CONTRACT, BLUEPRINT_UNIVERSE, allowed-molecules.ts): one must be canonical; drift if code or docs update one but not others.
  - Structure/template list in V6 table vs LAYOUT_SYSTEM_CONTRACT vs layout-closed-sets.ts: keep in sync or document canonical source.
4. **Execution seams not formally declared**
  - Step 0: “npm run apps” and Build Report path—no contract for tooling or report schema.
  - Step 8: “Compile Blueprint+Content → TSX Screen Module”—no contract for compiler input/output schema or algorithm.
  - Step 9: “Wrapper consumes Compiled TSX Screen Module”—no contract for wrapper interface (props/context).
  - “Resolver strategy” in Ecosystem Ticket: no contract naming the resolver or its contract.
5. **V6 depends on undefined behavior**
  - “Engine binding” and “bindings to blueprint/TSX module” without a contract for binding shape.
  - “State slices reused” and “Resolver strategy declared” without a contract for state or resolver.

**Strictly V6-based:** Only include gaps that arise from V6 text; no new architecture.

---

## Phase 4 — Authority clarity file

**Objective:** Single declaration that V6 is constitutional and how each contract relates to it.

**Output:** `src/02_Contracts_Reports/build_protocol/V6_AUTHORITY_DECLARATION.md`

**Format:** Contract style. Bullet lists only. No essays.

**Required content:**

- **Constitutional authority:** V6 (APP_BUILD_PROTOCOL_V6.md) is the constitutional build authority; no step may be skipped or reordered; TSX wrapper is always Step 9; Build Report is always Step 10.
- **REQUIRED contracts:** List by filename the contracts that are the named authority for V6 requirements (from Phase 2 [REQUIRED FOR V6]).
- **SUPPORTING contracts:** List contracts that support V6 but are not the single named authority.
- **MISALIGNED contracts:** List contracts that contradict or relax V6 (from Phase 2).
- **Drift sources:** List contracts or duplicate definitions that introduce drift risk (from Phase 2 and Phase 3).
- **Inactive but retained:** List contracts that are not REQUIRED or SUPPORTING for V6 and are kept for reference or future use (no modification of Blueprint authority).
- **Blueprint authority rule:** No contract outside the REQUIRED set may modify Blueprint authority; Blueprint + Content remain the structure and semantics authority per V6.

**Do not:** Add new architecture, change existing contracts, or reference implementation paths beyond what V6 already names.

---

## Deliverables summary


| Deliverable | Path                                                                  | Purpose                                                          |
| ----------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Phase 1     | `docs/contract_validation/V6_REQUIREMENT_MATRIX.md`                   | V6 requirements + authority type mapping                         |
| Phase 2     | `docs/contract_validation/V6_COMPATIBILITY_REPORT.md`                 | Per-contract classification and V6 alignment                     |
| Phase 3     | `docs/contract_validation/V6_GAP_REPORT.md`                           | Missing contracts, ambiguities, drift, seams, undefined behavior |
| Phase 4     | `src/02_Contracts_Reports/build_protocol/V6_AUTHORITY_DECLARATION.md` | Constitutional declaration and contract lists                    |


---

## Success criteria (from task)

- No files modified except the four new deliverables.
- No deletions, no moves, no refactors of existing contracts.
- No new architecture or runtime redesign.
- Clear map of what V6 depends on (matrix + compatibility report).
- Clear identification of drift sources (compatibility report + gap report + authority declaration).

---

## Execution order

1. Create `docs/contract_validation/` if it does not exist (directory creation only).
2. Phase 1: Write V6_REQUIREMENT_MATRIX.md from V6 text.
3. Phase 2: For each contract file, classify and write its section in V6_COMPATIBILITY_REPORT.md.
4. Phase 3: Write V6_GAP_REPORT.md from Phase 1–2 and V6 text.
5. Phase 4: Write V6_AUTHORITY_DECLARATION.md from Phase 2 classifications and the authority rule.

No existing contract or protocol file is modified in this process.