# Organ Build Protocol V6

**This protocol governs Organ creation only.** Organs are TSX components composed of contract molecules. Organs are later composed elsewhere (not defined here).

**Authority:** Contract-governed build. No step may be skipped. No step may be reordered. TSX wrapper is always Step 9; Build Report is always Step 10.

**Blueprint + Content are authority (structure + semantics). Build output is a Compiled TSX Organ Component.**

**Canonical location:** `src/02_Contracts_Reports/build_protocol/`. Contracts: `src/02_Contracts_Reports/contracts/`.

---

## Mandatory build order

Follow these steps in order. Do not skip; do not reorder.

---

## EXECUTION MODE — GATED

- Each step (0–10) is atomic.
- Each step must emit a required artifact.
- Execution HALTS after each step until validation passes.
- No step may begin until the previous step artifact exists.

---

## Required Artifact Definitions

| Step | Required artifact(s) |
|------|----------------------|
| STEP 0 | `SYSTEM_SCAN_REPORT.md` — authority surfaces, engines, palettes, blueprints found |
| STEP 3 | `BLUEPRINT.outline`, `BLUEPRINT_VALIDATION_REPORT.md` |
| STEP 3.5 (Content Build) | `CONTENT.json`, `CONTENT_VALIDATION_REPORT.md` |
| STEP 4–7 | `BUILD_PLAN_ANALYSIS.md` |
| STEP 8 | `COMPILED_TSX_ORGAN_COMPONENT.tsx`, `TSX_COMPILE_REPORT.md` |
| STEP 9 | `WRAPPER_VALIDATION_REPORT.md` |
| STEP 10 | `FINAL_BUILD_REPORT.md` |

- Cursor must STOP after each artifact emission.
- Cursor must not proceed unless explicitly instructed to continue.
- Any missing artifact = HARD STOP.

---

### STEP 0 — Pre-flight context sync (non-blocking)

- Run `npm run apps`.
- Load the most recent Build Report from:
  `src/02_Contracts_Reports/build_reports/`.
- Emit **SYSTEM_SCAN_REPORT.md** including:
  - All authority surfaces (structure types, templates, molecules, engines, palettes, actions, primitives, organs, layout IDs).
  - Current discovered palettes.
  - Current engine registry list.
  - Blueprints found.
- Do NOT:
  - Stop the build if violations exist.
  - Ask whether to continue.
  - Attempt to refactor.
  - Attempt to fix violations.
- This step is informational only.
- Continue immediately to STEP 1.

---

### STEP 1 — Extract universal system (cross-organ)

- List existing engines.
- List existing primitives.
- Confirm whether an existing engine satisfies the organ goal.
- If not, extend an existing engine or create a new engine via Engine Creation Protocol.
- Do NOT invent logic inside TSX.
- Do NOT skip engine declaration.

---

### STEP 2 — Register or extend engine (define JSON I/O)

Register or extend engines; define JSON input/output shape. Use only engines from the engine capability/registry. No logic in TSX. Engine behavior is the authority for actions and flow.

---

### STEP 2.5 — ECOSYSTEM BUILD TICKET (V6)

Emit the following structured report. STRICT FORMAT. NO PARAGRAPHS. NO PROSE. NO EXPLANATION. CHECKBOX + EVIDENCE + REFERENCES ONLY.

==================================================
ECOSYSTEM BUILD TICKET (V6)
==================================================


ORGAN:
GOAL (1 line):


--------------------------------------------------
A) TSX WRAPPER FAMILY (ONLY SELECTION)
--------------------------------------------------


AVAILABLE TSX WRAPPER FAMILIES:
- (list discovered structure types + templates from contracts / layout system)


SELECTED TSX FAMILY:
- Type:
- Template:
- Evidence (file path / contract source):


[✓/X] Wrapper consumes Compiled TSX Organ Component only
[✓/X] Wrapper has zero default layout
[✓/X] Wrapper has zero hardcoded style
[✓/X] Wrapper has zero inline behavior
[✓/X] Wrapper consumes blueprint only


--------------------------------------------------
B) BLUEPRINT ↔ TSX STRUCTURAL BINDING
--------------------------------------------------


BLUEPRINT TYPE:
- (new required field; must match TSX wrapper family)


[✓/X] Blueprint nodes compatible with TSX family
[✓/X] Blueprint nodes toggleable (feature flags)
[✓/X] No node outside molecule contract
[✓/X] Blueprint is layout-glossary driven
[✓/X] Blueprint compiles to TSX Organ Component (Step 8)


Blueprint Preview (compact tree):
- organ
  - section
    - card
    - list
  - toolbar
  - modal


--------------------------------------------------
C) CONTENT ↔ BLUEPRINT BINDING
--------------------------------------------------


[✓/X] Content keys map 1:1 to blueprint nodes
[✓/X] No orphan content keys
[✓/X] No hardcoded text in TSX
[✓/X] Universal content structure (cross-industry ready)


Content Preview (compact JSON keys):
{
  ...
}


--------------------------------------------------
D) ENGINE BINDING (UNIVERSAL)
--------------------------------------------------


AVAILABLE ENGINES:
- (list discovered engine registry items)


SELECTED ENGINES:
- (list or NONE)


For each engine:
- Purpose:
- Engine input/output (declared); bindings to blueprint/TSX Organ Component
- Blueprint node bindings:


[✓/X] Engine logic lives outside TSX
[✓/X] Engine reusable across ecosystem
[✓/X] Engine JSON layouts defined (if new)


If new engine required:
[ ] New universal engine proposed
- Engine Name:
- JSON schema (stub required)
- Cross-organ reuse explanation (1 line max)


--------------------------------------------------
E) SYSTEM-DRIVEN LAYERS (NOT CHOSEN)
--------------------------------------------------


[✓/X] Palette system-driven (no selection)
[✓/X] Layout IDs driven by layout-definitions
[✓/X] Behaviors registry-only
[✓/X] State slices reused (list)
[✓/X] Resolver strategy declared (evidence)


--------------------------------------------------
F) ONE-ORGAN ECOSYSTEM COMPATIBILITY
--------------------------------------------------


[✓/X] Compatible with priority engine
[✓/X] Compatible with learning modules
[✓/X] Compatible with planner modules
[✓/X] Compatible with habit/timer modules
[✓/X] Compatible with recovery tools
[✓/X] No siloed logic introduced


--------------------------------------------------
G) MISSING / UNRESOLVED
--------------------------------------------------


- List every [X]
- Reference missing file or contract


==================================================

---

### STEP 3 — Define blueprint + content (conform to molecule contracts)

Define blueprint and content using molecule contracts (Blueprint Universe, Content Derivation). Structure and semantics come from blueprint + content. Build compiles to TSX Organ Component (see Step 8). Content keys must match molecule contract. Only the 12 allowed molecules may appear as node types.

---

### STEP 4 — Choose structure type (from contract list; show all available first)

Choose exactly one structure type. It must be from the contract list. Before choosing, list all available.

**All available structure types (8):**  
`list`, `board`, `dashboard`, `editor`, `timeline`, `detail`, `wizard`, `gallery`.

Selection must be declared in organ config—no guessing or inference.

---

### STEP 5 — Choose template (from contract list; show all available first)

Choose a template for the chosen structure type. It must be from the contract list. Before choosing, list all available for that structure type.

**Templates by structure type (see LAYOUT_SYSTEM_CONTRACT.md):**

| Structure type | Template ids |
|----------------|--------------|
| list | default, compact, dense, minimal |
| board | default, minimal, pipeline, swimlanes |
| dashboard | default, compact, single-column, wide |
| editor | default, minimal, sidebar-left, fullscreen |
| timeline | default, compact, day-only, week-month |
| detail | default, minimal, detail-right, detail-bottom |
| wizard | default, minimal, linear, branched |
| gallery | default, minimal, masonry, uniform |

Selection must be declared—no inference.

---

### STEP 6 — Choose molecules (show all 12; list chosen subset)

Only contract molecules may be used. Before choosing, show all 12. Then list which subset was chosen for this build.

**All available molecules (fixed 12, closed set):**  
`section`, `button`, `card`, `avatar`, `chip`, `field`, `footer`, `list`, `modal`, `stepper`, `toast`, `toolbar`.

Any molecule type outside this set is a **HARD VIOLATION**. List chosen molecules explicitly.

---

### STEP 7 — Bind behaviors (registry-only)

Bind behaviors from the action/behavior registry only. No one-off handlers. No business logic in TSX. Events delegate to registry or engine.

---

### STEP 8 — Compile Blueprint+Content → TSX Organ Component

- [ ] Input: blueprint + content (authority).
- [ ] Output: one Compiled TSX Organ Component file.
- [ ] Deterministic structure from blueprint+content only.
- [ ] Only 12 allowed molecules (see `allowed-molecules.ts`).
- [ ] Engine bindings declared; no engine logic inside TSX Organ Component.
- [ ] Behavior bindings registry-only; no inline handlers.
- [ ] No inline styles.
- [ ] No palette selection.
- [ ] No layout inference.

---

### STEP 9 — Render TSX wrapper last (no logic)

- [ ] Wrapper consumes the Compiled TSX Organ Component from Step 8.
- [ ] Wrapper provides only: state, palette context, layout context.
- [ ] Wrapper contains no business logic, no structure invention, no engine logic, no inline behaviors.
- [ ] Palette and layout from system/context only.

---

### STEP 10 — Generate Build Report

Emit the Build Report to `src/02_Contracts_Reports/build_reports/`. The report must list the full authority surface (all available) before listing selections, and must include a Violations section (molecule violations, structure/template violations, TSX/palette violations). Include the Five Questions block.

---

## Lock Conditions

- [ ] No hardcoded styles in TSX Organ Component or wrapper.
- [ ] No inline behavior logic in TSX Organ Component or wrapper; all behavior via registry.
- [ ] No structure invention in wrapper; structure comes from Compiled TSX Organ Component only.
- [ ] No engine logic in wrapper or in Compiled TSX Organ Component; all engine logic external.
- [ ] Palette system-driven only; no palette selection in Compiled TSX Organ Component or wrapper.

---

## Rules

- **No step may be skipped.**
- **No step may be reordered.**
- **Step 8 produces the Compiled TSX Organ Component; Step 9 consumes it.**
- **TSX wrapper is always Step 9;** Build Report is Step 10.
- **Cursor must STOP after each artifact emission; must not proceed unless explicitly instructed to continue.**
- **Any missing required artifact = HARD STOP.**
- **STEP 0 is informational only and must not block execution.**
- **All architecture decisions must be declared before file creation.**
- Structure type and template must be **declared**, not inferred.
- Molecules: **exactly 12**; any other = HARD VIOLATION.
- Palette: **system-driven**; no selection; no hardcoded styles.
- Blueprint type must be declared and tied to TSX wrapper family.
- No wrapper may assume defaults.
- No feature may require wrapper modification to enable.
- All new engines must define JSON I/O schema.
- Ecosystem compatibility must be explicitly verified.
