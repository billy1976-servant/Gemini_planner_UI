# CURVESCRIPT: Contract-Governed Build System V2 — Phase 1 Analysis & Implementation Plan

**Canonical authority:** `src/02_Contracts_Reports/` only. No parallel contract folder. No tsconfig path changes. No moving existing contracts.

---

## Phase 1 — Scan Results (Analyze Only, No Changes)

### 1. Plain list: existing contracts

All under `src/02_Contracts_Reports/contracts/`:

| # | File | Type | Purpose |
|---|------|------|---------|
| 1 | `BLUEPRINT_UNIVERSE_CONTRACT.md` | MD | Blueprint elements, molecules × variants × content slots, behavior verbs; "no new molecules" |
| 2 | `CONTENT_DERIVATION_CONTRACT.md` | MD | Content manifest from blueprint; keys must match molecule contract |
| 3 | `ENGINE_LAWS.md` | MD | Runtime laws (wrapper, preset, hero, split, param merge, etc.) |
| 4 | `JSON_SCREEN_CONTRACT.json` | JSON | Atoms + molecules: requiredProps, optionalProps, contentKeys, paramKeys; visual params from Style System |
| 5 | `expected-params.ts` | TS | Per-molecule expected param keys (surface, label, trigger, etc.) |
| 6 | `layout-node-types.ts` | TS | `LAYOUT_NODE_TYPES_LIST` / `LAYOUT_NODE_TYPES` (Grid, Row, Column, Stack) |
| 7 | `renderer-contract.ts` | TS | `NON_ACTIONABLE_TYPES` (reads from config) |
| 8 | `contract-verbs.ts` | TS | `CONTRACT_VERBS`, `inferContractVerbDomain` for behavior-listener |
| 9 | `ui-node.ts` | TS | `UIParams`, `UINodeProps` |
| 10 | `SystemContract.ts` | TS | Engine/presentation/state contract types |
| 11 | `PARAM_KEY_MAPPING.md` | MD | Param key mapping rules |
| 12 | `ORGAN_CONTRACT_UPDATE_PLAN.md` | MD | Organ contract update plan |
| 13 | `CONTRACT_CONSOLIDATION_REPORT.md` | MD | Consolidation report |
| 14 | `README.md` | MD | Contract folder readme |
| 15 | `index.ts` | TS | Re-exports |
| 16 | `load-app-offline-json.node.ts` | TS | Load app offline JSON |
| 17 | `master-business.blueprint.txt` | TXT | Sample blueprint |
| 18 | `critical-path.smoke.test.ts` | TS | Smoke test |
| 19 | `param-key-mapping.test.ts` | TS | Param key tests |
| 20 | `showcase-visual-quality.test.ts` | TS | Visual quality assertions |
| 21 | `legacy/.gitkeep` | - | Legacy placeholder |

### 2. Plain list: missing contracts

| # | Missing contract | Required by CURVESCRIPT |
|---|------------------|-------------------------|
| 1 | **PALETTE_SYSTEM_CONTRACT.md** | Palette shape, discovery rules, no hardcoded styles, extension only via new palette files or overlay rules |
| 2 | **LAYOUT_SYSTEM_CONTRACT.md** | Current structure types (8), template attachment rules, structure type/template declared (no guessing), expansion only by contract update |
| 3 | **RENDERING_PURITY_CONTRACT.md** | No hardcoded styles/theme fallbacks; TSX zero business logic; JSON = structure, engines = behavior, palettes = style; molecules CLOSED (exactly 12), extra = HARD VIOLATION |

### 3. Missing protocol and report locations

| Item | Path | Exists? |
|------|------|--------|
| Build protocol | `src/02_Contracts_Reports/build_protocol/APP_BUILD_PROTOCOL_V2.md` | **No** (directory and file missing) |
| Build reports output | `src/02_Contracts_Reports/build_reports/` | **No** (directory missing) |

---

## Sources of truth (identified)

### A) Where the 12 molecule list is defined

- **Primary:** `src/02_Contracts_Reports/contracts/JSON_SCREEN_CONTRACT.json` — key `molecules` (section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar; also `JournalHistory`). So the *code* and docs treat **12** as the UI molecule set; the JSON has 13 keys.
- **Aligned:** `src/02_Contracts_Reports/contracts/expected-params.ts` — exactly 12 keys (section, button, card, toolbar, list, footer, chip, avatar, field, toast, modal; no JournalHistory).
- **Reference:** `src/02_Contracts_Reports/system-architecture/03_ENGINE_SYSTEM.md` and `docs/ARCHITECTURE_AUTOGEN/REGISTRY_MAP.generated.md` — list "12-molecules" and the same 12 types.
- **Gap:** No single contract file states: "The molecule set is closed; exactly these 12; any other molecule is a HARD VIOLATION." That will be stated in **RENDERING_PURITY_CONTRACT.md** (and optionally a single canonical list in that contract or in a small MOLECULE_SET contract slice).

**Canonical 12 (to be locked in contract):**  
`section`, `button`, `card`, `avatar`, `chip`, `field`, `footer`, `list`, `modal`, `stepper`, `toast`, `toolbar`.

### B) Where TSX wrapper structure types + templates are defined

- **Structure types (8):** `src/lib/tsx-structure/resolver/builtinTemplates.ts` — `STRUCTURE_TYPES = ["list", "board", "dashboard", "editor", "timeline", "detail", "wizard", "gallery"]`.
- **Templates:** Same file — `BUILTIN_TEMPLATES`: per structure type, map of `templateId → template` (e.g. list: default, compact, dense, minimal; board: default, minimal, pipeline, swimlanes; etc.).
- **Contracts per structure:** `src/lib/tsx-structure/contracts/*.ts` (list, board, dashboard, editor, timeline, detail, wizard, gallery) — each defines `structureType` and config shape.
- **Gap:** These live outside `src/02_Contracts_Reports/`. The **LAYOUT_SYSTEM_CONTRACT.md** will list the same 8 structure types and rules; it will not move code—it will be the *documented* source of truth for "what structure types exist" and "templates attach per structure type."

### C) Where palettes are discovered from

- **Discovery:** `src/07_Dev_Tools/scripts/run-apps.ts` — `discoverPalettes()` reads `src/04_Presentation/palettes/`, returns filenames with `.json` stripped, sorted.
- **Path:** `PATH_PALETTES = path.join(ROOT, "src", "04_Presentation", "palettes")`.
- **Gap:** No contract defines palette JSON shape, layering, or extension rules. **PALETTE_SYSTEM_CONTRACT.md** will define shape and discovery; discovery path can stay in code, but rules (no hardcoded styles, extension only by new files/overlays) will live in the contract.

---

## Non-negotiable locks (for implementation)

1. **Molecule set is closed:** Exactly 12 molecules (the list above). No new molecule types. Any molecule outside this set in blueprint/content/app JSON or runtime → Build Report "Violations" section, HARD VIOLATION.
2. **Structure types closed-per-contract:** At any time, structure types are exactly what **LAYOUT_SYSTEM_CONTRACT.md** lists (today: 8). New structure types only by updating that contract (and corresponding code). No inference.
3. **Extensible** means: more nodes, content, palettes, layouts, engines—**not** new molecule types.

---

## Implementation plan (Phases 2–4)

### Phase 2 — Create missing core contracts (only if missing)

Create in `src/02_Contracts_Reports/contracts/`:

1. **PALETTE_SYSTEM_CONTRACT.md**
   - Palette shape and discovery rules (e.g. directory, `.json`, required/optional top-level keys).
   - Explicitly forbid hardcoded styles and defaults.
   - Allow palette layering/extension only by new palette files or explicit overlay rules (no TSX fallbacks).

2. **LAYOUT_SYSTEM_CONTRACT.md**
   - List current structure types (8: list, board, dashboard, editor, timeline, detail, wizard, gallery).
   - Template attachment rules (templateId per structure type).
   - Structure type and template must be declared (no guessing).
   - Future expansion only by updating this contract.

3. **RENDERING_PURITY_CONTRACT.md**
   - No hardcoded styles or theme fallbacks.
   - TSX wrappers contain zero business logic.
   - JSON = structure authority; engines = behavior authority; palettes = style authority.
   - Molecules are CLOSED (exactly 12); any extra is a HARD VIOLATION.

Do not move or change existing contracts; do not change tsconfig path mappings.

### Phase 3 — Build protocol (process contract)

- Create directory: `src/02_Contracts_Reports/build_protocol/`.
- Create file: `src/02_Contracts_Reports/build_protocol/APP_BUILD_PROTOCOL_V2.md`.

Content must define mandatory build order (no skipping):

- STEP 1 — Extract universal system (cross-app)
- STEP 2 — Register/extend engine (define JSON I/O)
- STEP 3 — Define blueprint + content (conform to molecule contracts)
- STEP 4 — Choose structure type (from contract list; show all available first)
- STEP 5 — Choose template (from contract list; show all available first)
- STEP 6 — Choose molecules (show all 12; list chosen subset)
- STEP 7 — Bind behaviors (registry-only)
- STEP 8 — Choose palette (from discovered list; show all available first)
- STEP 9 — Render TSX wrapper last (no logic)
- STEP 10 — Generate Build Report

### Phase 4 — `npm run apps` refactor (scan + verify + report)

- **Default behavior:** scan + verify + report (not build). Output reports to `src/02_Contracts_Reports/build_reports/`.
- Create directory `src/02_Contracts_Reports/build_reports/` if missing.

Report must include:

- A. All available structure types  
- B. Selected structure type + why  
- C. All available templates  
- D. Selected template + why  
- E. All available molecules (the fixed 12)  
- F. Molecules used/selected  
- G. All available engines  
- H. Engines used/selected  
- I. All available palettes  
- J. Palette used/selected  
- K. Blueprint node types used (and which molecules appear)  
- L. Contract violations (must include molecule violations)

Five questions block:

- What did I see?
- What did I choose?
- What did I invent?
- What did I violate?
- What universal system did I extract?

Enforcement:

- Any molecule outside the fixed 12 in blueprint/content/app JSON or runtime → FAIL section "Violations".
- TSX wrapper with business logic or hardcoded palette/layout fallbacks → FAIL section "Violations".
- Structure type or template used not in contract surface → FAIL section "Violations".
- Report must list full authority surface (all available) before listing selections.

### Deliverables (summary)

- New contracts (only if missing): `PALETTE_SYSTEM_CONTRACT.md`, `LAYOUT_SYSTEM_CONTRACT.md`, `RENDERING_PURITY_CONTRACT.md` in `src/02_Contracts_Reports/contracts/`.
- `APP_BUILD_PROTOCOL_V2.md` in `src/02_Contracts_Reports/build_protocol/`.
- Updated `npm run apps` that generates Build Reports in `src/02_Contracts_Reports/build_reports/`.
- One sample Build Report generated by running `npm run apps` after changes.

---

**Phase 1 complete.** No file or folder changes were made. Proceed to Phase 2–4 per this plan.
