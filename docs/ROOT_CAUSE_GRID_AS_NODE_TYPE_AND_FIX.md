# Root Cause: "type":"Grid" as JSON Node — Evidence, Target Shape, Fix Plan

**Goal:** Grid (and row/column/stack) must NEVER appear as a JSON node type. JSON screens stay content-only; layout is applied only via runtime overrides / params / render-time strategy.

---

## 1. Root cause — where "type":"Grid" originates

| Source | Kind | File(s) | Evidence |
|--------|------|---------|----------|
| **Product screen compiler** | Code emitter (in-memory tree) | `src/lib/product-screen-adapter/compileProductDataToScreen.ts` | L69–88: `layoutType = options.layout === "column" ? "Column" : ... ? "Row" : "Grid"`; L82–88: `layoutNode = { type: layoutType, ... children: cardNodes }`. This is the **only code** that creates a node with `type: "Grid"` (or "Row"/"Column") and injects it into the screen tree. |
| **Organ variant JSON (disk)** | Template/manual authoring | `src/organs/features-grid/variants/*.json`, `gallery/variants/*.json`, `testimonials/variants/*.json`, `pricing/variants/*.json`, `faq/variants/two-column.json` | Each variant file contains a child node `{ "type": "Grid", "layout": { "type": "grid", "params": { ... } }, "children": [ slot ] }`. Organ expander (`resolve-organs.ts`) **loads** these files via `loadOrganVariant()` and merges them; it does **not** generate "Grid" — the JSON files are the source. |
| **App JSON (disk)** | Manual / copy-from-template | `src/apps-offline/apps/journal_track/app-1.json`, `apps/websites/showcase/showcase-home.json`, `apps/websites/*/products.json` | Hand-authored or copied from organ/template; no script writes these. |
| **Contract (documentation only)** | Describes current organ output | `src/contracts/JSON_SCREEN_CONTRACT.json` L173 | features-grid organ has `"emittedMolecules": ["Section", "Grid"]`. Documents current behavior; does not "allow" Grid as a content type. |

**Exact emitter (code):** `src/lib/product-screen-adapter/compileProductDataToScreen.ts`, function `compileProductDataToScreen`, lines 69–88 (layoutType assignment and layoutNode creation).

**Registry:** `src/engine/core/registry.tsx` L163–164: `grid: GridLayout`, `Grid: GridLayout`. So there **is** a Registry entry for `"Grid"`. It exists so that when the renderer sees a node with `type: "Grid"`, it resolves `Component = GridLayout` and renders that node as a layout wrapper (same component as `node.layout.type === "grid"`). The app renders today because those nodes are treated as layout wrappers. After the fix, we stop creating such nodes and optionally rewrite or fail-fast if any remain.

---

## 2. Target JSON shape (section with title + cards) — content-only

**Current (has layout node):**
```json
{
  "id": "features_section",
  "type": "Section",
  "role": "features",
  "layout": { "type": "column", "params": { "gap": "1.5rem", "align": "stretch" } },
  "content": {},
  "children": [
    { "type": "Section", "content": { "title": "Why this works" } },
    {
      "type": "Grid",
      "layout": { "type": "grid", "params": { "columns": 3, "gap": "2rem" } },
      "children": [
        { "type": "Card", "content": { ... }, "params": { ... } },
        { "type": "Card", ... },
        { "type": "Card", ... }
      ]
    }
  ]
}
```

**Target (content-only; layout as metadata):**
```json
{
  "id": "features_section",
  "type": "Section",
  "role": "features",
  "layout": { "type": "column", "params": { "gap": "1.5rem", "align": "stretch" } },
  "params": {
    "moleculeLayout": { "type": "grid", "params": { "columns": 3, "gap": "2rem" } }
  },
  "content": { "title": "Why this works" },
  "children": [
    { "type": "Card", "content": { ... }, "params": { ... } },
    { "type": "Card", ... },
    { "type": "Card", ... }
  ]
}
```

- No `"type":"Grid"` (or Row/Column/Stack) node.
- Section has `params.moleculeLayout` for grid (columns, gap); dropdowns/overrides merge into this at runtime.
- Title in `content.title`; cards are direct children of the Section.

---

## 3. Fix plan checklist

- [x] **1. Stop emitting "type":"Grid" at source**  
  - **Done.** In `compileProductDataToScreen.ts`: Section has `params.moleculeLayout: { type, params }` and `children: cardNodes` (no layout node).

- [x] **2. Migration transform (script/codemod)**  
  - **Implemented:** `scripts/migrate-grid-to-content-only.js`. Rewrites JSON that contains `"type":"Grid"` (or Row/Column/Stack): merges layout into parent.params.moleculeLayout and replaces the layout node with its children. Targets: `src/organs/**/variants/*.json`, `src/apps-offline/**/*.json`. Run: `node scripts/migrate-grid-to-content-only.js` (use `--dry-run` to preview).

- [ ] **3. Dropdowns still control columns/gap**  
  - applyProfileToNode (or equivalent) already merges section layout preset / organ variant into Section params. Ensure grid columns/gap come from override maps into Section’s `params.moleculeLayout.params`. No new node types. (Section compound now reads columns/gap from moleculeLayout.params.)

- [x] **4. Enforce rule: fail-fast + optional auto-rewrite**  
  - **Implemented:** In `src/app/page.tsx`, before passing the tree to JsonRenderer: in dev, if `hasLayoutNodeType(composed)`, log a clear console.error and run `collapseLayoutNodes(composed)` so the tree passed to render is content-only. Uses `src/engine/core/collapse-layout-nodes.ts`.

- [x] **5. Section compound**  
  - **Done.** When isGridLayout, use `moleculeLayout.params.columns` (default 3) and `moleculeLayout.params.gap` for gridTemplateColumns and gap.

---

## 4. Minimal patch (files to change)

| File | Change |
|------|--------|
| `src/lib/product-screen-adapter/compileProductDataToScreen.ts` | **Done.** No layout node; Section has `params.moleculeLayout` and `children: cardNodes`. |
| `src/engine/core/collapse-layout-nodes.ts` | **Done.** `collapseLayoutNodes(node)`, `hasLayoutNodeType(node)`; merge layout into parent.params.moleculeLayout and replace layout node with its children. |
| `src/app/page.tsx` | **Done.** Before JsonRenderer: in dev, if `hasLayoutNodeType(composed)`, console.error and set `treeForRender = collapseLayoutNodes(composed)`. |
| `src/compounds/ui/12-molecules/section.compound.tsx` | **Done.** When isGridLayout, use `moleculeLayout.params.columns` (default 3) and `moleculeLayout.params.gap` for grid. |
| `scripts/migrate-grid-to-content-only.js` | **Done.** Rewrites target JSON files in place; run with `--dry-run` to preview. |

Contract: Do **not** add Grid as an allowed content type. Update contract only to reflect new behavior: e.g. features-grid `emittedMolecules` → `["Section"]` and note that layout is params-only (optional, per your constraints).
