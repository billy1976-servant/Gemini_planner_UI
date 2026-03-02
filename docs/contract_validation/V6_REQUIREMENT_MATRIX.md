# V6 Requirement Matrix

**Source:** APP_BUILD_PROTOCOL_V6.md (constitutional build authority).  
**Purpose:** Map each V6 requirement to a required authority type.  
**Authority types:** Blueprint | Content | Layout | Engine | Render | Behavior | Palette | Build

---

## 1. Constitutional and canonical

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Contract-governed build; no step skipped or reordered | Enforce deterministic, auditable build | Build |
| TSX wrapper is always Step 9; Build Report is always Step 10 | Fixed pipeline so tooling and reports are predictable | Build |
| Blueprint + Content are authority (structure + semantics) | Single source of truth for UI shape and copy | Blueprint, Content |
| Build output is a Compiled TSX Screen Module | Clear deliverable from Step 8 | Build, Render |
| Canonical location: build_protocol/ and contracts/ | Single place for protocol and contract definitions | Build |

---

## 2. Execution mode and artifacts

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Each step (0–10) is atomic; each must emit required artifact | Gated execution; no silent skips | Build |
| Execution HALTS after each step until validation passes | Prevent proceeding with invalid state | Build |
| No step may begin until previous step artifact exists | Dependency ordering | Build |
| STEP 0: SYSTEM_SCAN_REPORT.md (authority surfaces, engines, palettes, blueprints) | Pre-flight visibility | Build |
| STEP 3: BLUEPRINT.outline, BLUEPRINT_VALIDATION_REPORT.md | Blueprint validation artifact | Blueprint, Build |
| STEP 3.5: CONTENT.json, CONTENT_VALIDATION_REPORT.md | Content validation artifact | Content, Build |
| STEP 4–7: BUILD_PLAN_ANALYSIS.md | Analysis before compile | Build |
| STEP 8: COMPILED_TSX_SCREEN_MODULE.tsx, TSX_COMPILE_REPORT.md | Compiled screen output | Render, Build |
| STEP 9: WRAPPER_VALIDATION_REPORT.md | Wrapper compliance | Render, Build |
| STEP 10: FINAL_BUILD_REPORT.md | Final audit trail | Build |
| Any missing artifact = HARD STOP | Enforce completeness | Build |
| Cursor must STOP after each artifact; must not proceed unless explicitly instructed | Human-in-the-loop gating | Build |

---

## 3. Step 0 — Pre-flight

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Run npm run apps; load most recent Build Report from build_reports/ | Sync with current system state | Build |
| Emit SYSTEM_SCAN_REPORT with all authority surfaces (structure types, templates, molecules, engines, palettes, actions, primitives, organs, layout IDs) | Single scan of all contract surfaces | Layout, Engine, Palette, Behavior, Blueprint |
| Current discovered palettes; current engine registry list; blueprints found | Discovery, not selection | Palette, Engine, Blueprint |
| STEP 0 is informational only; must not block execution | Allow build to continue despite violations for reporting | Build |

---

## 4. Step 1 — Extract universal system

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| List existing engines and primitives | Reuse before creating new | Engine |
| Confirm whether existing engine satisfies app goal | Avoid duplicate engines | Engine |
| Extend or create engine via Engine Creation Protocol; do NOT invent logic inside TSX | Logic lives in engines only | Engine, Render |
| Do NOT skip engine declaration | Every app declares engine use | Engine |

---

## 5. Step 2 — Register or extend engine

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Define JSON input/output shape for engines | Contractual engine I/O | Engine |
| Use only engines from engine capability/registry | No ad-hoc engines | Engine |
| No logic in TSX; engine behavior is authority for actions and flow | Behavior authority in engine/registry | Engine, Behavior |

---

## 6. Step 2.5 — Ecosystem Build Ticket

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Emit ECOSYSTEM BUILD TICKET; STRICT FORMAT; CHECKBOX + EVIDENCE + REFERENCES ONLY | Audit trail for each build | Build |
| A) TSX Wrapper Family: list discovered structure types + templates from contracts/layout system | Wrapper selection from contract list only | Layout |
| A) SELECTED: Type, Template; Evidence (file path / contract source) | Declared selection, not inferred | Layout |
| Wrapper consumes Compiled TSX Screen Module only | No structure invention in wrapper | Render |
| Wrapper has zero default layout; zero hardcoded style; zero inline behavior | Purity of wrapper | Render, Palette |
| Wrapper consumes blueprint only | Structure from blueprint | Blueprint, Render |
| B) BLUEPRINT TYPE: new required field; must match TSX wrapper family | Blueprint type tied to layout family | Blueprint, Layout |
| B) Blueprint nodes compatible with TSX family; toggleable (feature flags); no node outside molecule contract | Structure conforms to molecules and layout | Blueprint, Layout, Render |
| B) Blueprint is layout-glossary driven | Layout terms from glossary/contract | Blueprint, Layout |
| B) Blueprint compiles to TSX screen module (Step 8) | Compile path | Blueprint, Render |
| C) Content keys map 1:1 to blueprint nodes; no orphan content keys; no hardcoded text in TSX | Content bound to blueprint only | Content, Blueprint, Render |
| C) Universal content structure (cross-industry ready) | Content schema is generic | Content |
| D) ENGINE BINDING: list discovered engine registry; selected engines; purpose, I/O, bindings per engine | Engine use declared | Engine |
| D) Engine logic lives outside TSX; reusable; JSON layouts defined if new | Engine authority | Engine, Render |
| D) If new engine: name, JSON schema stub, cross-app reuse explanation | New engine contract | Engine |
| E) Palette system-driven (no selection); Layout IDs driven by layout-definitions; Behaviors registry-only | System-driven layers | Palette, Layout, Behavior |
| E) State slices reused (list); Resolver strategy declared (evidence) | State and resolver from system | Build, Behavior |
| F) One-app ecosystem compatibility (priority engine, learning, planner, habit/timer, recovery); no siloed logic | Ecosystem alignment | Engine, Build |
| G) List every [X]; reference missing file or contract | Unresolved items tracked | Build |

---

## 7. Step 3 — Define blueprint + content

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Define blueprint and content using molecule contracts (Blueprint Universe, Content Derivation) | Structure and semantics from contracts | Blueprint, Content |
| Structure and semantics come from blueprint + content | Single authority | Blueprint, Content |
| Content keys must match molecule contract | Content slots per molecule | Content, Render |
| Only the 12 allowed molecules may appear as node types | Closed molecule set | Render, Blueprint |

---

## 8. Step 4 — Choose structure type

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Choose exactly one structure type from contract list | No ad-hoc structure types | Layout |
| Before choosing, list all available | Discovery then selection | Layout |
| All available structure types (8): list, board, dashboard, editor, timeline, detail, wizard, gallery | Closed set from contract | Layout |
| Selection must be declared in app/screen config—no guessing or inference | Declaration, not inference | Layout, Build |

---

## 9. Step 5 — Choose template

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Choose template for chosen structure type from contract list (see LAYOUT_SYSTEM_CONTRACT.md) | Templates from contract only | Layout |
| Before choosing, list all available for that structure type | Discovery then selection | Layout |
| Template table: list/board/dashboard/editor/timeline/detail/wizard/gallery with template ids | Canonical template list | Layout |
| Selection must be declared—no inference | Declaration, not inference | Layout, Build |

---

## 10. Step 6 — Choose molecules

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Only contract molecules may be used; before choosing, show all 12 | Closed set from contract | Render |
| All available molecules (fixed 12): section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar | Canonical molecule list | Render |
| Any molecule type outside this set is HARD VIOLATION | Enforcement | Render, Build |
| List chosen molecules explicitly | Declaration | Render, Build |

---

## 11. Step 7 — Bind behaviors

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Bind behaviors from the action/behavior registry only | No one-off handlers | Behavior |
| No one-off handlers; no business logic in TSX | Logic in registry/engine | Behavior, Render |
| Events delegate to registry or engine | Single behavior path | Behavior, Engine |

---

## 12. Step 8 — Compile Blueprint+Content → TSX Screen Module

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Input: blueprint + content (authority) | Single source for compile | Blueprint, Content |
| Output: one Compiled TSX Screen Module file | Deliverable | Render, Build |
| Deterministic structure from blueprint+content only | No invention in compiler | Blueprint, Content, Render |
| Only 12 allowed molecules (see allowed-molecules.ts) | Molecule compliance | Render |
| Engine bindings declared; no engine logic inside module | Engine external | Engine, Render |
| Behavior bindings registry-only; no inline handlers | Behavior via registry | Behavior, Render |
| No inline styles; no palette selection; no layout inference | Style and layout from system | Palette, Layout, Render |

---

## 13. Step 9 — Render TSX wrapper

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Wrapper consumes the Compiled TSX Screen Module from Step 8 | Wrapper does not invent structure | Render |
| Wrapper provides only: state, palette context, layout context | Wrapper is thin shell | Render, Palette, Layout |
| Wrapper contains no business logic, no structure invention, no engine logic, no inline behaviors | Purity | Render, Engine, Behavior |
| Palette and layout from system/context only | No selection in wrapper | Palette, Layout, Render |

---

## 14. Step 10 — Build Report

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| Emit Build Report to build_reports/ | Audit trail | Build |
| Report must list full authority surface (all available) before listing selections | Discovery then selection | Build |
| Include Violations section (molecule, structure/template, TSX/palette violations) | Violations visible | Build, Render, Layout, Palette |
| Include the Five Questions block | Standard report shape | Build |

---

## 15. Lock conditions

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| No hardcoded styles in TSX screen module or wrapper | Style from palette/system | Palette, Render |
| No inline behavior logic in TSX screen module or wrapper; all behavior via registry | Behavior via registry | Behavior, Render |
| No structure invention in wrapper; structure from Compiled TSX Screen Module only | Structure from Step 8 only | Render |
| No engine logic in wrapper or in compiled module; all engine logic external | Engine boundary | Engine, Render |
| Palette system-driven only; no palette selection in compiled module or wrapper | Palette from system | Palette, Render |

---

## 16. Rules (summary invariants)

| V6 Requirement | Why it exists | Required authority type |
|----------------|---------------|--------------------------|
| No step may be skipped; no step may be reordered | Pipeline integrity | Build |
| Step 8 produces Compiled TSX Screen Module; Step 9 consumes it | Clear handoff | Build, Render |
| All architecture decisions must be declared before file creation | No implicit decisions | Build |
| Structure type and template must be declared, not inferred | Layout declaration | Layout, Build |
| Molecules: exactly 12; any other = HARD VIOLATION | Closed set | Render, Build |
| Palette: system-driven; no selection; no hardcoded styles | Palette authority | Palette, Render |
| Blueprint type must be declared and tied to TSX wrapper family | Blueprint–layout binding | Blueprint, Layout |
| No wrapper may assume defaults | No implicit defaults | Render |
| No feature may require wrapper modification to enable | Wrapper is generic | Render |
| All new engines must define JSON I/O schema | Engine contract | Engine |
| Ecosystem compatibility must be explicitly verified | Ecosystem alignment | Build |

---

## Authority type summary

- **Blueprint:** Structure and semantics authority; type tied to TSX family; layout-glossary driven; compiles to TSX module.
- **Content:** Semantics; keys 1:1 to blueprint nodes; molecule contract; universal structure.
- **Layout:** 8 structure types + templates from contract; layout-definitions; layout-glossary; declaration not inference.
- **Engine:** Registry only; JSON I/O; logic outside TSX; reusable; bindings declared.
- **Render:** Compiled TSX Screen Module; wrapper consumes only; 12 molecules; no logic, no styles, no invention.
- **Behavior:** Registry-only; no inline handlers; delegate to registry or engine.
- **Palette:** System-driven; no selection in module/wrapper; no hardcoded styles.
- **Build:** Steps 0–10; artifacts; gating; reports; declaration; ecosystem verification.
