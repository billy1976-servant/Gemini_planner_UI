---
name: Blueprint V2 Exhaustive Masterplan
overview: "Produce the contract-complete Blueprint V2 masterplan: one overview doc plus eight structure-type masterplans (list, board, dashboard, editor, timeline, detail, wizard, gallery), as 9 markdown files under docs/blueprints/, using only in-repo contract and execution sources. Analysis and spec only—no code edits or npm execution."
todos: []
isProject: false
---

# Blueprint V2 — Exhaustive Blueprint Masterplan (8 Structure Types)

## Scope and constraints (from your request)

- **Output:** 9 markdown files under `docs/blueprints/` (create directory if missing). No edits to existing code; no refactors; no npm execution.
- **Authority:** All content must be derived from the listed in-repo inputs. No invented molecules, verbs, layouts, or schemas outside closed sets.
- **Determinism:** Every optional region/node = toggleable feature flag with explicit toggle key. All behavior = contract verb tokens and valid target shapes only.

---

## Inputs used (ground truth)


| Input                | Location                                                                                                                                                                                               | Use                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blueprint Universe   | [BLUEPRINT_UNIVERSE_CONTRACT.md](src/02_Contracts_Reports/contracts/BLUEPRINT_UNIVERSE_CONTRACT.md)                                                                                                    | Molecules (12), organs, content slots, verb sets, state/mutation/semantic/validation, canonical pattern                                                                      |
| Allowed molecules    | [allowed-molecules.ts](src/02_Contracts_Reports/contracts/allowed-molecules.ts)                                                                                                                        | Closed set: section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar                                                                         |
| Contract verbs       | [contract-verbs.ts](src/02_Contracts_Reports/contracts/contract-verbs.ts)                                                                                                                              | CONTRACT_VERBS (tap, double, long, drag, scroll, swipe, go, back, open, close, route, crop, filter, frame, layout, motion, overlay); domains: interaction, navigation, image |
| State resolver       | [state-resolver.ts](src/03_Runtime/state/state-resolver.ts)                                                                                                                                            | Intents: state:currentView, journal.set/add, state.update, layout.override, scan.*, interaction.record; DerivedState shape                                                   |
| Behavior listener    | [behavior-listener.ts](src/03_Runtime/engine/core/behavior-listener.ts)                                                                                                                                | action event (params.name, params.to, valueFrom/fieldKey); CONTRACT_VERBS → runBehavior; state:* → dispatchState                                                             |
| Build protocol       | [APP_BUILD_PROTOCOL_V4.md](src/02_Contracts_Reports/build_protocol/APP_BUILD_PROTOCOL_V4.md)                                                                                                           | Steps 0–10; structure types and templates per type; molecule list                                                                                                            |
| Layout contract      | [LAYOUT_SYSTEM_CONTRACT.md](src/02_Contracts_Reports/contracts/LAYOUT_SYSTEM_CONTRACT.md)                                                                                                              | 8 structure types; template attachment; declaration requirement                                                                                                              |
| Layout closed sets   | [layout-closed-sets.ts](src/02_Contracts_Reports/contracts/layout-closed-sets.ts)                                                                                                                      | STRUCTURE_TYPES, TEMPLATES_BY_STRUCTURE_TYPE                                                                                                                                 |
| Content derivation   | [CONTENT_DERIVATION_CONTRACT.md](src/02_Contracts_Reports/contracts/CONTENT_DERIVATION_CONTRACT.md)                                                                                                    | contentMap by rawId; molecule/organ slotKeys; merge rule                                                                                                                     |
| Blueprint compiler   | [blueprint.ts](src/07_Dev_Tools/scripts/blueprint.ts)                                                                                                                                                  | parseBlueprint (rawId, type, organId, slots, behaviorToken, target); buildTree; idMap/targetToRaw; ALLOWED_CONTENT_KEYS                                                      |
| Skin compiler        | [compileSkinFromBlueprint.ts](src/06_Data/site-skin/compileSkinFromBlueprint.ts)                                                                                                                       | Blueprint screen → SiteSkinDocument (sections → nodes with role)                                                                                                             |
| TSX envelope         | [TSXScreenWithEnvelope.tsx](src/lib/tsx-structure/TSXScreenWithEnvelope.tsx)                                                                                                                           | resolveAppStructure(screenPath, override) → structureType, template, featureFlags; StructureConfigProvider; no hardcoded structure                                           |
| JSON skin engine     | [json-skin.engine.tsx](src/05_Logic/logic/engines/json-skin.engine.tsx)                                                                                                                                | Renders screen.children by node.type (section, field, button, etc.); selectActiveChildren(when.state/equals); action via behavior.params                                     |
| Resolver + templates | [resolver/index.ts](src/lib/tsx-structure/resolver/index.ts), [builtinTemplates.ts](src/lib/tsx-structure/resolver/builtinTemplates.ts), [convention.ts](src/lib/tsx-structure/resolver/convention.ts) | resolveAppStructure → structureType + templateId + overrides; BUILTIN_TEMPLATES per type                                                                                     |
| Types                | [types.ts](src/lib/tsx-structure/types.ts)                                                                                                                                                             | ResolvedAppStructure; List/Board/Dashboard/Editor/Detail/Wizard/Gallery/Timeline structure config interfaces                                                                 |


No "resolve-organs" file exists in repo; organ expansion is implied by blueprint.ts buildTree (organ → entry with organId, variant, content from contentMap) and CONTENT_DERIVATION_CONTRACT organ slotKeys.

---

## Deliverable 1: `docs/blueprints/V5_MASTERPLAN_OVERVIEW.md`

**Purpose:** Single source for universal invariants, pipeline, and do-not-drift rules.

**Required sections:**

1. **Universal invariants across all 8 types**
  - Closed sets: 12 molecules (allowed-molecules.ts), contract verbs (contract-verbs.ts), 8 structure types + templates (layout-closed-sets.ts), organs (BLUEPRINT_UNIVERSE_CONTRACT §6+).
  - Content binding: content key per node = intersection of outline tokens and molecule/organ contract; contentMap keyed by rawId (CONTENT_DERIVATION_CONTRACT).
  - Toggle naming: namespaced, deterministic keys (e.g. `list.hasFilterBar`, `board.swimlanesEnabled`); no magic defaults in wrapper/spec.
  - Behavior emission contract: actionable molecules only (Button, Chip, List item, Toolbar action, Footer item, Stepper, Toast, Avatar); event shape `CustomEvent("action", { detail: { type: "Action", params: { name, ... } } })` or `CustomEvent("navigate", { detail: { to, ... } })`; params.name = contract verb or state/mutation intent (behavior-listener).
2. **Blueprint → Screen JSON → Renderer pipeline (V5 canonical)**
  - Option A: blueprint.txt + content.txt → blueprint.ts compileApp() → app.json (screen root + children with id, type, content, behavior) → JsonSkinEngine(screen) or equivalent.
  - Option B: structureType + templateId (from resolver) → loadTemplate() → merged template JSON; no blueprint tree in this path; TSX wrapper receives ResolvedAppStructure (structureType, template, featureFlags) and renders via template-driven layout.
  - Canonical for V5: define which path is canonical (e.g. “Blueprint-first: blueprint + content → app.json → engine” vs “Resolver-first: screenPath + metadata → ResolvedAppStructure → TSX”). Document the single path that satisfies “no hardcoded defaults; JSON-driven.”
3. **Do-not-drift rules**
  - No text/image node types outside the 12 molecules (e.g. no raw `type: "text"` or `type: "image"` unless they map to a molecule’s content slot or an organ’s slotKey).
  - No TSX hardcoding: structure type and template come from config/metadata/resolver; palette from system; no fallback “if no structureType assume list” in renderer.
  - Violation detection: Build Report (APP_BUILD_PROTOCOL_V4 Step 10) must list molecule violations, structure/template violations, TSX/palette violations; run-apps or equivalent can validate against allowed-molecules and layout-closed-sets.

---

## Deliverables 2–9: Per-structure masterplans

For each of the 8 types, create one file:  
`V5_LIST_MASTERPLAN.md`, `V5_BOARD_MASTERPLAN.md`, `V5_DASHBOARD_MASTERPLAN.md`, `V5_EDITOR_MASTERPLAN.md`, `V5_TIMELINE_MASTERPLAN.md`, `V5_DETAIL_MASTERPLAN.md`, `V5_WIZARD_MASTERPLAN.md`, `V5_GALLERY_MASTERPLAN.md`.

Each file must contain the following sections with the stated content. Use the contract and execution sources above; do not invent new molecules or verbs.

---

### Section A — Purpose and scope (1 paragraph)

- What this structure type **is**: one-sentence definition aligned with LAYOUT_SYSTEM_CONTRACT (e.g. list = “List/vertical collection with density, sort, filter, pagination, selection”).
- What it **is not**: e.g. list is not a board (no columns/lanes), not a dashboard (no grid of widgets).

---

### Section B — Exhaustive node inventory

- Enumerate every canonical node/region the structure can include, in categories (chrome, header, toolbar, filter bar, list body, footer, overlays, modals, toasts, etc.—adapt per type).
- Each node must be one of: (1) an allowed molecule (from allowed-molecules.ts), or (2) an organ declaration (from BLUEPRINT_UNIVERSE_CONTRACT §6+) that expands into allowed molecules.
- Example for **list**: chrome (optional), header (Section or organ:header), toolbar (Toolbar), filter bar (Section + Chip/Field), list container (Section), list (List molecule, items = data), pagination (Footer or Button group), footer (Footer), modal (Modal), toast (Toast). Assign rawIds / node ids consistently (e.g. `list.chrome`, `list.header`, `list.toolbar`, `list.filterBar`, `list.body`, `list.list`, `list.pagination`, `list.footer`, `list.modal`, `list.toast`).

Repeat for board (chrome, header, toolbar, filter bar, lanes/columns, cards, footer, modal, toast), dashboard (chrome, header, toolbar, grid, widgets as Card/Section, footer, modal, toast), editor (chrome, toolbar, sidebars, content area with Field/Card/Section, footer, dirty state indicator, modal, toast), timeline (chrome, header, axis controls, time axis, slots/events as Card or List, footer, overlay, modal, toast), detail (chrome, master pane [List], detail pane [Section/Card/Fields], split control, footer, modal, toast), wizard (chrome, stepper, step content area, back/next/skip buttons, footer, modal, toast), gallery (chrome, header, grid/carousel area [Card or organ:gallery], lightbox [Modal], footer, toast).

---

### Section C — Full blueprint tree templates (exhaustive)

Provide three JSON **shapes** (node-based), not full app-specific JSON:

1. **Minimal:** Fewest nodes (e.g. list: screen → section → list; board: screen → section → columns placeholder; etc.).
2. **Standard:** Typical set (e.g. list: chrome off, header, toolbar, filter bar, list, pagination, footer).
3. **Maximal:** Every optional region present (all toggles on); include organ declarations where applicable.

Use only allowed molecule `type` values and organ declarations (`type: "organ", organId, variant`); use contract slot keys and explicit ids. Format as tree with `id`, `type`, `content`, `children`, and optional `behavior`/`params` so a compiler could generate a screen JSON deterministically. Reference blueprint.ts node shape (id from idMap, type, content from contentMap, behavior from target or logic).

---

### Section D — Feature flag matrix (toggle system)

Table with columns:

- **toggleKey** (namespaced, e.g. `list.showFilterBar`, `board.swimlanesEnabled`).
- **Affected nodes** (rawIds or node ids).
- **What appears/disappears when enabled.**
- **Contract constraints** (e.g. “Filter bar may contain only Chip, Field; actionable only for tap/route”).

Derive toggles from optional nodes in the inventory (e.g. showHeader, showToolbar, showFilterBar, showPagination, showFooter, showModal, showToast). For board: swimlanes, drag, columnsFromConfig. For dashboard: resizable, draggable, preset. For editor: toolbar placement, sidebar left/right, dirty indicator. For timeline: axis visible, viewModes, interaction drag/resize. For detail: split orientation, master ratio, persistSelection. For wizard: branching, skip button, progress style. For gallery: lightbox, masonry vs grid. Every optional capability = one row.

---

### Section E — Content slot contract (for this structure)

- For each molecule used in the structure’s templates: list allowed content keys and types (TEXT / MEDIA / DATA) per BLUEPRINT_UNIVERSE_CONTRACT and CONTENT_DERIVATION_CONTRACT (e.g. Button: label; Field: label, input, error; List: items; Card: title, body, media; Stepper: steps; Toolbar: actions; Modal: title, body; Toast: message; Footer: text, children; Section: title; Chip: title, body, media; Avatar: media, text).
- For each organ used: list slotKeys (e.g. header.logo, header.cta; hero.title, hero.subtitle, hero.cta) and value types.

---

### Section F — Behavior grammar (full)

- For each **actionable** node in the structure: allowed behaviors using ONLY contract verbs (tap, double, long, drag, scroll, swipe, go, back, open, close, route) and action-domain verbs (crop, filter, frame, layout, motion, overlay) where applicable per molecule (BLUEPRINT_UNIVERSE_CONTRACT “ACTIONABLE” and edge table).
- Include navigation (go, back, open, close, route) and state mutation (state.update, journal.add, etc.) as expressed via behavior-listener (params.name).
- Semantic verb mapping: save → append/update; submit → append; reset → clear; cancel → undo; confirm → commit; dismiss → no-op; complete/acknowledge → update; exit → navigation (BLUEPRINT_UNIVERSE_CONTRACT §1️⃣1️⃣). No pseudo-actions or invented verbs.

---

### Section G — State targets and data binding

- State targets this structure expects to read/write (abstract keys): e.g. list: `list.selection`, `list.sortKey`, `list.filterQuery`, `list.page`; board: `board.columns`, `board.cards`, `board.swimlanes`; dashboard: `dashboard.layout`, `dashboard.widgets`; editor: `editor.dirty`, `editor.content`; timeline: `timeline.viewMode`, `timeline.selectedDate`, `timeline.events`; detail: `detail.selectedId`, master list data; wizard: `wizard.currentStep`, `wizard.branch`; gallery: `gallery.selectedIndex`, `gallery.items`.
- How DATA slots are sourced: state vs engine output vs content manifest (per CONTENT_DERIVATION_CONTRACT and state-resolver DerivedState).
- How list items / board columns / wizard steps / timeline events bind: deterministic binding rule (e.g. List.items from state key X or content manifest key Y; board columns from template or state; wizard steps from config or data).

---

### Section H — Validation, mutation, undo/redo

- Where validation guards apply (pre-mutation): e.g. Field before submit (required, minLength, etc. from BLUEPRINT_UNIVERSE_CONTRACT §1️⃣2️⃣).
- Mutation verbs needed for this structure: append, update, remove, clear, replace, merge, reorder, toggle, etc. (from §🔟).
- Log/undo/redo: requirement from canonical stateful pattern (§1️⃣4️⃣); label “required for contract compliance” vs “currently implemented” (state-resolver has no undo/redo log; behavior-listener dispatches state intents).

---

### Section I — Execution interface requirements (TSX wrapper integration)

- ResolvedAppStructure inputs: structureType, template (from loadTemplate), templateId, layout profile hooks (from getDefaultTsxEnvelopeProfile or equivalent).
- Blueprint tree input format: if the renderer consumes blueprint-originated tree, document expected shape (id, type, content, behavior, children) consistent with blueprint.ts output.
- contentMap binding: key by rawId or node id; merge rule from CONTENT_DERIVATION_CONTRACT.
- Behavior emission: CustomEvent("action", { detail: { type: "Action", params: { name, key, value, valueFrom, fieldKey, to, ... } } }) and CustomEvent("navigate", { detail: { to } }); behavior-listener expects params.name and params.to.
- Organ expansion: compile-time (blueprint.ts buildTree) vs pre-render expansion; requirement that organ slots be filled from contentMap by slotKey.

Keep this section generic (no single renderer implementation); applicable to both JsonSkinEngine and TSXScreenWithEnvelope-style wrappers.

---

### Section J — Gap report (reality vs contract)

- List what is missing to execute this structure deterministically today:
  - **Missing molecule render coverage:** e.g. json-skin.engine has section, field, button, image, video, select, UserInputViewer but not full 12; no Card/List/Stepper/Toast/Toolbar/Footer/Avatar/Chip/Modal in same engine.
  - **Organ expansion path:** blueprint.ts emits organ nodes but no resolve-organs step that expands organId → Section + slot placeholders; CONTENT_DERIVATION_CONTRACT expects slotKeys.
  - **Semantic/mutation resolver:** semantic verbs (save, submit, reset, etc.) not fully mapped in behavior-listener to mutation intents.
  - **Validation layer:** no pre-mutation validation guard in runtime; contract requires validation blocks mutation.
  - **Undo/redo:** not implemented in state-resolver.
- Be blunt and precise; no refactor plan, only checklist.

---

## Structure-specific notes (to unify with sections above)

- **List:** Use BUILTIN_TEMPLATES list (default, compact, dense, minimal); ListStructureConfig from types.ts; density, sort, filter, pagination, selection, orientation.
- **Board:** BUILTIN_TEMPLATES board; BoardStructureConfig; columns, cards, drag, swimlanes; cards = Card molecule or repeatable node.
- **Dashboard:** BUILTIN_TEMPLATES dashboard; DashboardStructureConfig; grid, widgets; widgets = Card or Section.
- **Editor:** BUILTIN_TEMPLATES editor; EditorStructureConfig; toolbar, sidebars, dirtyState, contentArea; content = Field, Card, Section.
- **Timeline:** BUILTIN_TEMPLATES timeline; TimelineStructureConfig; slotMinutes, axis, viewModes, interaction, dataBinding; events/tasks from state or content.
- **Detail:** BUILTIN_TEMPLATES detail; DetailStructureConfig; split, master (List), detail (Section/Card/Fields).
- **Wizard:** BUILTIN_TEMPLATES wizard; WizardStructureConfig; steps (Stepper), navigation (Button), branching; steps from config or data.
- **Gallery:** BUILTIN_TEMPLATES gallery; GalleryStructureConfig; layout, grid, lightbox (Modal); items = Card or organ:gallery slots.

---

## File creation order

1. Create directory `docs/blueprints/` if it does not exist.
2. Write `V5_MASTERPLAN_OVERVIEW.md` (universal invariants, pipeline, do-not-drift).
3. Write the eight structure masterplans in any order (list, board, dashboard, editor, timeline, detail, wizard, gallery), each with sections A–J as specified.

---

## Quality bar

- Node sets must be exhaustive for that type; no “e.g.” without full enumeration where the contract defines a closed set.
- Toggles must cover all optionality in the node inventory and in BUILTIN_TEMPLATES/builtinTemplates.
- Behavior grammar must be complete and valid (contract verbs only; semantic → mutation/navigate explicitly stated).
- State targets and binding must be explicit (abstract keys + source).
- Gaps must be listed precisely (missing molecules in renderer, missing organ expansion, missing validation, missing undo/redo) so a senior engineer can implement without guessing.

