# Rendering Purity Contract

**Authority:** This contract defines the boundaries for rendering: no hardcoded styles or theme fallbacks, no business logic in TSX wrappers, and strict authority roles. The molecule set is **closed** (exactly 12). Any molecule outside that set is a **HARD VIOLATION** and must appear in the Build Report Violations section.

**Canonical location:** `src/02_Contracts_Reports/contracts/`. See also: BLUEPRINT_UNIVERSE_CONTRACT.md, CONTENT_DERIVATION_CONTRACT.md, ENGINE_LAWS.md, PALETTE_SYSTEM_CONTRACT.md, LAYOUT_SYSTEM_CONTRACT.md.

---

## 1. Authority roles

| Authority | Owns | Not allowed elsewhere |
|-----------|------|------------------------|
| **JSON** | Structure: nodes, hierarchy, visibility, screen/app shape | Structure must not be invented in TSX or engines |
| **Engines** | Behavior: actions, flow, state transitions, event handling | Business logic must not live in TSX wrappers |
| **Palettes** | Style: colors, spacing, typography, radii, borders | No hardcoded styles or theme fallbacks in components |
| **Layout (contract)** | Structure types, templates, layout config | No inferred or invented structure types/templates |

---

## 2. No hardcoded styles or theme fallbacks

- **No hardcoded styles:** Components and TSX must not use literal style values (e.g. `color: '#333'`, `margin: 12`, `borderRadius: 8`) for themeable appearance. All such values must come from palette tokens or from layout/presentation config that derives from contract.
- **No theme fallbacks:** When a palette token or layout token is missing, components must not substitute a default (e.g. “if no primary, use #1A6BD4”). Resolution must be from palette/layout only, or the gap must be reported and handled by contract-defined mechanism.
- **Palette is style authority:** See PALETTE_SYSTEM_CONTRACT.md. Visual appearance is determined by the selected palette and its tokens.

---

## 3. TSX wrappers: zero business logic

- **TSX is for rendering only:** TSX wrappers must contain no business logic: no state derivation beyond what engines provide, no ad-hoc event handlers that implement domain rules, no data transformation that belongs in an engine or registry.
- **Behavior binding:** Behaviors are bound via the action/behavior registry only. Handlers in TSX must delegate to the registry (e.g. dispatch CustomEvents or call registered handlers). No one-off logic that implements business rules inside the wrapper.
- **Structure consumption:** TSX consumes resolved structure (from JSON + layout contract) and renders it. It does not invent structure, choose structure type by inference, or add nodes not present in the resolved tree.

---

## 4. JSON is structure authority

- Screen structure (nodes, hierarchy, visibility) comes from JSON (e.g. app.json, screen JSON, blueprint-derived content). TSX and engines must not create or remove structure nodes outside the contract (e.g. slot resolution, organ expansion) that is defined in BLUEPRINT_UNIVERSE_CONTRACT and CONTENT_DERIVATION_CONTRACT.
- **No structure invention in TSX:** Conditional rendering that adds/removes major structure (e.g. “if admin, show extra section”) must be driven by data/JSON or by engine output that conforms to contract, not by TSX branching alone.

---

## 5. Engines are behavior authority

- Actions, flow, and state transitions are defined by engines and the behavior/action registry. TSX must not implement behavior logic beyond forwarding to the registry or to engine-defined hooks.
- **No ad-hoc handlers:** Event handlers in wrappers must not encode business rules (e.g. “on click, recalculate and update state X”). Such logic belongs in engines or registered actions.

---

## 6. Molecules: closed set (exactly 12) — HARD VIOLATION

The **molecule set is closed.** Exactly the following 12 molecule types are allowed. No new molecule types may be added—ever. “Extensible” elsewhere means: more nodes, more content, more palettes, more layouts, more engines—**not** new molecules.

**Allowed molecules (exactly 12):**

1. `section`  
2. `button`  
3. `card`  
4. `avatar`  
5. `chip`  
6. `field`  
7. `footer`  
8. `list`  
9. `modal`  
10. `stepper`  
11. `toast`  
12. `toolbar`

- **Violation:** If any molecule **outside this set** appears in blueprint, content, app JSON, screen JSON, or runtime usage (e.g. node type in the tree, or registry lookup), that is a **HARD VIOLATION**.
- **Build Report:** Every such violation must be listed in the Build Report “Violations” section. The report must list “all available molecules (the fixed 12)” and “molecules used/selected,” and any type not in the fixed 12 must be flagged as a molecule violation.
- **Detection:** Scans and validators must check all blueprint/content/app JSON and runtime molecule references against this list. Any reference to a molecule type not in the list above fails the contract.

---

## 7. TSX wrapper and layout fallbacks — violation

- **Business logic in TSX:** If a TSX wrapper contains business logic (state derivation, domain rules, ad-hoc handlers that implement behavior), it is a contract violation.
- **Hardcoded palette/layout fallbacks:** If a TSX wrapper or component uses hardcoded styles or layout/palette defaults (e.g. default color, default spacing) instead of palette/layout tokens, it is a contract violation.
- Both must be reported in the Build Report Violations section.

---

## 8. Structure type / template not in contract — violation

- If a structure type or template is used that is not in the LAYOUT_SYSTEM_CONTRACT surface (see LAYOUT_SYSTEM_CONTRACT.md), it is a contract violation and must appear in the Build Report Violations section.

---

## 9. Build Report requirements

The Build Report must:

1. List the **full authority surface** (all available structure types, templates, molecules, engines, palettes) **before** listing selections.
2. Include a **Violations** section that:
   - Lists every molecule used that is not in the fixed 12 (HARD VIOLATION).
   - Lists every TSX wrapper that contains business logic or hardcoded palette/layout fallbacks.
   - Lists every structure type or template used that is not in the contract surface.

---

## 10. Summary

- **No** hardcoded styles or theme fallbacks anywhere.
- **No** business logic in TSX wrappers.
- **JSON** = structure authority; **Engines** = behavior authority; **Palettes** = style authority.
- **Molecules** = exactly 12, closed set; any extra = **HARD VIOLATION**.
- Violations must be reported in the Build Report; no silent drift.
