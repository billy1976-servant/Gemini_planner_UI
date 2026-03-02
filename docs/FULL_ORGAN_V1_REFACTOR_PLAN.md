# Full Organ V1 Refactor Plan

**Authority:** BUILD_PROTOCOL (ORGAN)_V1.md. This plan refactors all 21 organs and all 8 TSX organisms to comply with the protocol. No new enforcement layers, contracts, compilers, lint systems, or guardrails. Existing architecture only.

---

## 1. Principle

- Each organ composes **only the 12 contract molecules** (section, button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar). No raw `<div>`, `<span>`, `<button>`, `<header>`, `<ul>`, `<li>`.
- **Layout** comes from `layout-definitions.json` and `resolveLayout(layoutId)` ([layout-resolver.ts](../src/04_Presentation/layout/resolver/layout-resolver.ts)); no layout inference or hardcoded flex/grid/gap/padding in TSX.
- **Styles** come from palette/context (CSS variables); no inline `style={{}}` and no hex/palette selection in components.
- **Behavior** stays registry-only ([organ-action-bridge](../src/03_Runtime/engine/core/organ-action-bridge.ts), action-registry); no inline handlers beyond delegation to `onAction`.
- **Blueprint** remains authority; structure is deterministic from blueprint + content (Step 8).

---

## 2. Before/after pattern

### Example: ToolbarOrgan

**Before (current):**

```tsx
return (
  <header
    className={className}
    data-organ-id={organId}
    style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", flexWrap: "wrap" }}
  >
    <div data-slot="toolbar.actions" style={{ flex: "0 0 auto" }}>{slots["toolbar.actions"]}</div>
    <div data-slot="toolbar.breadcrumb" style={{ flex: "1 1 auto", minWidth: 0 }}>{slots["toolbar.breadcrumb"]}</div>
    <div data-slot="toolbar.viewToggles" style={{ flex: "0 0 auto" }}>{slots["toolbar.viewToggles"]}</div>
  </header>
);
```

**After:**

- Add a component layout in `layout-definitions.json` (e.g. `organ-toolbar`) with `type: "row"` and params for gap/align/padding (using CSS variables only).
- Organ receives `layoutId` (e.g. `"organ-toolbar"`) from props or from a layout context.
- `layoutDef = resolveLayout(layoutId)`.
- Render the **Toolbar** molecule (from `@/04_Presentation/components/molecules`) with slot content; or render **Section** with `layout={layoutId}` and children as slot content, using `LayoutMoleculeRenderer` for inner structure so that no flex/gap/padding appear in the organ file.
- No `style={{}}`; no raw `<header>` or `<div>`. Slots are passed as children to the molecule or as named slots per molecule contract.

---

## 3. Step-ordered, file-specific refactor list

### Step 1 — Layout system: add organ layout definitions

**File:** [src/04_Presentation/layout/data/layout-definitions.json](../src/04_Presentation/layout/data/layout-definitions.json)

- Under `componentLayouts`, add one entry per organ that defines the slot structure (row/column/grid and params using CSS variables only). Reuse existing resolver behavior; no new keys beyond what the layout contract already supports.
- Suggested IDs (one per organ): `organ-toolbar`, `organ-sidebar`, `organ-filterBar`, `organ-paginationBar`, `organ-selectionBar`, `organ-modal`, `organ-splitPane`, `organ-listContent`, `organ-columnStrip`, `organ-boardColumn`, `organ-gridLayout`, `organ-widgetCell`, `organ-editorContent`, `organ-timelineRuler`, `organ-timelineLaneStrip`, `organ-timelineLane`, `organ-detailContent`, `organ-wizardStepStrip`, `organ-wizardStepContent`, `organ-galleryGrid`, `organ-lightbox`.
- Each entry: `type` ("row" | "column" | "grid") and `params` (e.g. `gap`, `padding`, `align`) using only `var(--...)` or contract-defined tokens. No hex, no px/rem literals in JSON (use variables).

### Step 2 — Refactor organs one-by-one (21 files)

For each organ below: (1) Add or reuse a layout ID from Step 1. (2) Replace root and slot wrappers with a single molecule composition (Section or the matching molecule—e.g. Toolbar for toolbar, Modal for modal). (3) Pass `layoutId` into the molecule or resolve layout and pass to `LayoutMoleculeRenderer`. (4) Remove every `style={{}}` and every raw `<div>`, `<span>`, `<button>`, `<header>`.

| # | Organ | Layout ID to use | Molecule(s) to use | Notes |
|---|-------|------------------|--------------------|-------|
| 1 | [BoardColumnOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/BoardColumnOrgan.tsx) | organ-boardColumn | Section | Column layout; slots as children regions |
| 2 | [ColumnStripOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/ColumnStripOrgan.tsx) | organ-columnStrip | Section | Column + inner row for strips |
| 3 | [DetailContentOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/DetailContentOrgan.tsx) | organ-detailContent | Section | Single body slot |
| 4 | [EditorContentOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/EditorContentOrgan.tsx) | organ-editorContent | Section | Toolbar + body slots |
| 5 | [FilterBarOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/FilterBarOrgan.tsx) | organ-filterBar | Section or Toolbar | Row for controls |
| 6 | [GalleryGridOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/GalleryGridOrgan.tsx) | organ-galleryGrid | Section | Grid layout; header + items |
| 7 | [GridLayoutOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/GridLayoutOrgan.tsx) | organ-gridLayout | Section | Grid; title + content area |
| 8 | [LightboxOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/LightboxOrgan.tsx) | organ-lightbox | Modal or Section | Item + caption slots |
| 9 | [ListContentOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/ListContentOrgan.tsx) | organ-listContent | Section | Header + items |
| 10 | [ModalOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/ModalOrgan.tsx) | organ-modal | Modal | Title + content from molecule |
| 11 | [PaginationBarOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/PaginationBarOrgan.tsx) | organ-paginationBar | Section or Footer | Label + extra row |
| 12 | [SelectionBarOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/SelectionBarOrgan.tsx) | organ-selectionBar | Section | Label + actions row |
| 13 | [SidebarOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/SidebarOrgan.tsx) | organ-sidebar | Section | Single content slot |
| 14 | [SplitPaneOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/SplitPaneOrgan.tsx) | organ-splitPane | Section | Primary + secondary slots |
| 15 | [TimelineLaneOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/TimelineLaneOrgan.tsx) | organ-timelineLane | Section | Label + events |
| 16 | [TimelineLaneStripOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/TimelineLaneStripOrgan.tsx) | organ-timelineLaneStrip | Section | Title + lanes |
| 17 | [TimelineRulerOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/TimelineRulerOrgan.tsx) | organ-timelineRuler | Section | Label slot; border from palette var |
| 18 | [ToolbarOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/ToolbarOrgan.tsx) | organ-toolbar | Toolbar | Use Toolbar molecule; slots map to molecule slots |
| 19 | [WidgetCellOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/WidgetCellOrgan.tsx) | organ-widgetCell | Card or Section | Single content slot; border from palette |
| 20 | [WizardStepContentOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/WizardStepContentOrgan.tsx) | organ-wizardStepContent | Section | Body slot |
| 21 | [WizardStepStripOrgan.tsx](../src/04_Presentation/components/organs/tsx-organs/WizardStepStripOrgan.tsx) | organ-wizardStepStrip | Section | Steps + nav row |

- **Border/color:** Where organs currently use `var(--border-color, #e0e0e0)` or hex fallbacks, remove fallbacks; use only palette variables (e.g. `var(--border-color)`). Ensure palette provides these in theme.

### Step 3 — Refactor organisms (8 files)

For each organism: (1) Replace wrapper `<div>` and inline `style={{}}` with layout-driven composition. (2) Use only organs (refactored) and the 12 molecules for structure. (3) Slot content passed to organs must be molecule output or valid children (e.g. Button molecule, Card molecule), not raw `<button>`, `<span>`, `<div>`. (4) Remove all hex colors and px/rem from organism files; use palette/context.

| # | Organism | Changes |
|---|----------|---------|
| 1 | [BoardOrganism.tsx](../src/04_Presentation/components/organisms/tsx-organisms/BoardOrganism.tsx) | Replace root divs with Section (or layout-driven wrapper); slot content for toolbar/sidebar/columns use Button, Card, etc. molecules; remove inline styles and hex. |
| 2 | [DashboardOrganism.tsx](../src/04_Presentation/components/organisms/tsx-organisms/DashboardOrganism.tsx) | Same: layout from context; widget cells and toolbar slots use molecules; no raw button/div/span. |
| 3 | [DetailOrganism.tsx](../src/04_Presentation/components/organisms/tsx-organisms/DetailOrganism.tsx) | Same: detail content and list areas use Section/Card/List molecules; selection highlight via palette var. |
| 4 | [EditorOrganism.tsx](../src/04_Presentation/components/organisms/tsx-organisms/EditorOrganism.tsx) | Same: editor content and sidebar use organs + molecules; no inline styles or hex. |
| 5 | [GalleryOrganism.tsx](../src/04_Presentation/components/organisms/tsx-organisms/GalleryOrganism.tsx) | Same: gallery grid and lightbox slots use Card/Modal molecules; no raw div/span/button. |
| 6 | [ListOrganism.tsx](../src/04_Presentation/components/organisms/tsx-organisms/ListOrganism.tsx) | Replace `<ul>`/`<li>` with List molecule (or Section + List); list item actions use Button molecule; no inline styles or hex. |
| 7 | [TimelineOrganism.tsx](../src/04_Presentation/components/organisms/tsx-organisms/TimelineOrganism.tsx) | Same: timeline structure from layout; slot content molecules only. |
| 8 | [WizardOrganism.tsx](../src/04_Presentation/components/organisms/tsx-organisms/WizardOrganism.tsx) | Same: wizard steps and nav use Stepper/Button molecules; no raw primitives. |

- Organisms may continue to use `useSyncExternalStore` for state read and `createOnAction` for behavior (registry); no engine logic or direct state mutation in TSX.

### Step 4 — OrganPanel and website organs

- **OrganPanel.tsx:** Dev-only panel. Either (a) refactor to use only the 12 molecules and layout system (no inline styles, no raw primitives, no useState/.push—move state to external store or props), or (b) explicitly exclude from protocol scope and document as dev-only (not an Organ per build protocol). If (a): add layout IDs for panel sections; use Section/Field/Button molecules; move layout picker state to context or parent.
- **NodeRegistry.tsx:** Refactor node components (used by NodeRenderer) to use only the 12 molecules and layout IDs; remove all inline styles and raw h1/h2/p/div/span; use Section, Card, etc. and palette vars.
- **DevNodePanel.tsx:** Same as OrganPanel—refactor to molecules + layout or exclude as dev-only. If refactor: remove useState; use molecules for all UI.
- **WebsiteTemplate.tsx:** Use Section + layoutId; no inline style; no raw div.

### Step 5 — Remove remaining violations

- Search all refactored files for any remaining `style={{`, `#`, raw `<div>`, `<span>`, `<button>`, `<input>`, `<header>`, `<ul>`, `<li>`, `<p>`, `<label>`, `<h1>`, `<h2>` in organ/organism bodies. Replace with molecule composition or layout-driven structure.
- Ensure no organ or organism imports from atoms; only molecules and layout/context.

---

## 4. Order of execution

1. **Step 1** — Add organ layout entries to `layout-definitions.json` (componentLayouts).
2. **Step 2** — Refactor the 21 tsx-organs in dependency order (e.g. ToolbarOrgan, ModalOrgan, SidebarOrgan first; then list/board/dashboard/grid organs; then timeline/wizard/gallery/detail/editor).
3. **Step 3** — Refactor the 8 organisms to use only refactored organs and molecules; remove raw primitives and inline styles.
4. **Step 4** — Refactor or exclude OrganPanel and website organs (NodeRegistry, DevNodePanel, WebsiteTemplate).
5. **Step 5** — Global pass: remove any remaining violations; verify palette provides border/color vars used by organs.

---

## 5. No new infrastructure

- Use only: [layout-resolver.ts](../src/04_Presentation/layout/resolver/layout-resolver.ts), [layout-definitions.json](../src/04_Presentation/layout/data/layout-definitions.json), [molecules/index.ts](../src/04_Presentation/components/molecules/index.ts), [section.compound.tsx](../src/04_Presentation/components/molecules/section.compound.tsx) (resolveLayout + LayoutMoleculeRenderer), [organ-action-bridge](../src/03_Runtime/engine/core/organ-action-bridge.ts), [action-registry](../src/05_Logic/logic/runtime/action-registry.ts), [tsx-organs/types.ts](../src/04_Presentation/components/organs/tsx-organs/types.ts).
- Do not add new contracts, linters, or compilers. Do not introduce new abstraction layers; only refactor existing organs/organisms to comply with V1.

---

*End of refactor plan. Refactor only when explicitly instructed.*
