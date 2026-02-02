# Root Cause: "Layout Preset: image-left-text-right" and Grid Columns — Diagnosis and Plan

**Read-only diagnosis.** No code changes. Contract is source of truth; code must conform.

---

## 1. End-to-end pipeline trace for preset "image-left-text-right"

| Step | File(s) | What happens | Evidence |
|------|---------|--------------|----------|
| **UI selection** | `src/organs/OrganPanel.tsx` | User selects "image-left-text-right" in Layout Preset dropdown. `onChange` calls `onSectionLayoutPresetOverride(sectionKey, e.target.value)`. | L159: `onChange={(e) => onSectionLayoutPresetOverride(sectionKey, e.target.value)}` |
| **State/store** | `src/app/page.tsx`, `src/state/section-layout-preset-store.ts` | Page wires to `setSectionLayoutPresetOverride(screenKey, sectionKey, presetId)`. Store updates `overrides[screenId][sectionKey] = presetId` and notifies. | page.tsx L491–492; store L54–69 |
| **Renderer receives** | `src/app/page.tsx` | `sectionLayoutPresetOverrides = getOverridesForScreen(screenKey)` (Record&lt;sectionKey, presetId&gt;) passed to `JsonRenderer`. | L408–409, L447 |
| **Apply step** | `src/engine/core/json-renderer.tsx` | `applyProfileToNode(node, profile, sectionLayoutPresetOverrides)` runs per node. For **Section**, effective preset = `sectionLayoutPresetOverrides[node.id ?? node.role] ?? node.layoutPreset`. | L359–366 |
| **Preset lookup** | `src/layout/section-layout-presets.ts` | `getSectionLayoutPreset(effectivePresetId)` returns preset def. For "image-left-text-right": `containerWidth: "contained"`, `moleculeLayout: { type: "row", preset: null, params: { gap, align, justify, padding } }`. **No card-level keys.** | L79–89, L140–141 |
| **Node params merge** | `src/engine/core/json-renderer.tsx` | Preset merged **only into Section** `next.params`: `next.params = { ...next.params, ...preset, moleculeLayout: { ...next.params?.moleculeLayout, ...preset.moleculeLayout } }`. **Children are recursed but preset is not merged into Card.** | L370–377 |
| **Section compound** | `src/compounds/ui/12-molecules/section.compound.tsx` | Reads `params.moleculeLayout` (L109). `moleculeLayout?.type === "row"` → `isSplitLayout = true` (L113–115). Renders **inline styles**: `display: "grid"`, `gridTemplateColumns: "1fr 1fr"` (L188–189). Puts `slotContent` in one cell and **all children** in the other. Does **not** use `src/layout/molecules/row-layout.tsx`. | L113–115, L185–221 |
| **Card params** | `src/compounds/ui/12-molecules/card.compound.tsx` | Card reads `params.mediaPosition` and `params.contentAlign` (L91–92). These come **only from the node** (JSON). Preset never writes to Card nodes, so **preset selection does not change card layout.** | L91–92 |
| **Card internal layout** | `src/compounds/ui/12-molecules/card.compound.tsx` | Uses **inline flex** (L174–180): `display: "flex"`, `flexDirection: isRow ? "row" : "column"`. Does **not** use RowLayout/ColumnLayout from `src/layout/molecules/`. Media chunk has **no** `flexShrink: 0` or `minWidth`; image can shrink. | L174–180, L138–142 (MediaAtom wrapper) |
| **Grid columns** | `src/engine/core/json-renderer.tsx` | For nodes with `node.layout.type` (e.g. Grid), `LayoutComponent = Registry[resolvedNode.layout.type]`; children wrapped in `<LayoutComponent params={resolvedNode.layout?.params}>`. Grid columns come from **node.layout.params** (JSON). Preset and organ variant do **not** overwrite Grid child `layout.params.columns` in apply step. | L634–644 |

**Summary:** The preset "image-left-text-right" is applied **only to the Section** (moleculeLayout.type = "row"). It is **never** applied to Card (no mediaPosition/contentAlign from preset) or to Grid (no columns from preset). Section compound implements "row" with an inline 1fr/1fr grid (section slot vs children), not with layout molecules, and does not pass any card-level params to children.

---

## 2. Where the intended signal is dropped or ignored

- **Preset defines Section-level row only**  
  `section-layout-presets.ts` L79–89: "image-left-text-right" sets `moleculeLayout: { type: "row", params: { gap, align, justify, padding } }`. It does **not** set any key that Card reads (e.g. `mediaPosition`, `contentAlign`) or that Grid reads (e.g. `layout.params.columns`). So the **intended** "image left / text right" (card-level) is never in the preset def.

- **Preset merged only into Section, never into Card**  
  `json-renderer.tsx` L359–381: When `effectiveLayoutPresetId` is set, the preset is merged into **that Section's** `next.params`. Children are recursed (L384–386) with the same `sectionLayoutPresetOverrides`, but **no code** merges preset (or a derived cardLayout) into **Card** nodes. So even if the preset added `mediaPosition: "left"`, it would not reach Card.

- **Section compound uses inline grid, not RowLayout**  
  `section.compound.tsx` L185–221: When `isSplitLayout` (moleculeLayout.type === "row"), the compound uses a **hard-coded** `display: "grid"`, `gridTemplateColumns: "1fr 1fr"`. So the "row" affects **section structure** (slotContent | children), not card internal layout. Layout molecules in `src/layout/molecules/row-layout.tsx` are **not** used for Section’s inner layout; they are only used when a **node** has `node.layout.type` (renderer L634–636). Section’s layout is driven by `params.moleculeLayout`, which the compound turns into inline styles.

- **Card media can shrink**  
  `card.compound.tsx` L173–184: The media+text container is a flex row with `gap` and `alignItems`. The media chunk is a direct child (L181–182) with **no** `flexShrink: 0` or `minWidth`. So in a narrow or constrained cell, the image shrinks. `media.tsx` uses `width: "100%"` inside its wrapper (L109), so it fills the flex item; the item itself can shrink.

- **Grid columns not driven by preset/variant**  
  Grid’s `layout.params` come from the node (JSON). `applyProfileToNode` does not, for a Section with a Grid child, merge a preset- or variant-derived `columns` into that Grid child’s `layout.params`. So "Grid columns" from the dropdown do not affect the Grid node for hand-written trees (no organ expansion).

---

## 3. Layout molecules (`src/layout/molecules/*`) — where they are invoked

| Context | Invoked? | Evidence |
|---------|----------|---------|
| **Section children container** | Only for **node.layout** | Renderer L634–644: `LayoutComponent = Registry[resolvedNode.layout.type]`; `wrappedChildren = LayoutComponent ? <LayoutComponent params={...}>{renderedChildren}</LayoutComponent> : renderedChildren`. So Section’s **children** are wrapped in whatever `node.layout.type` is (e.g. "column" → ColumnLayout). Section compound does **not** use `node.layout` for its inner split; it uses `params.moleculeLayout` and inline grid (section.compound L185–221). So **layout molecules are used for Section’s children** (via renderer), but the Section compound **adds** an extra grid (1fr 1fr) when preset says "row", so the visual "row" is Section’s inline grid, not RowLayout. |
| **Grid child nodes** | Yes | Grid node has `layout: { type: "grid", params: { columns, gap } }` (app-1.json L71). Renderer wraps Grid’s children in `Registry.grid` = GridLayout (`registry.tsx` L163–164). So **Grid’s children are laid out by `src/layout/molecules/grid-layout.tsx`.** |
| **Card internal layout (media + text)** | No | Card compound uses **inline flex** (card.compound L174–180). Card nodes do not have `layout.type` that would trigger RowLayout/ColumnLayout in the renderer; the Card **component** implements row/column itself. So **layout molecules are not used for Card internal (media + text) layout.** |

**Conclusion:** Layout molecules are used for **node-level** layout when `node.layout.type` is set (Section children → ColumnLayout; Grid children → GridLayout). They are **not** used for Section’s **inner** row (Section uses inline grid) or for Card’s **inner** media+text layout (Card uses inline flex).

---

## 4. Expected vs actual param keys; files that apply vs ignore

### 4.1 Contract allowed params (source of truth)

- **Section** (`JSON_SCREEN_CONTRACT.json` L62): `surface`, `title`, `containerWidth`, `heroMode`, `backgroundVariant`, `moleculeLayout`, `role`, `layout`, `layoutPreset`, `media`.
- **Card** (L74): `trigger`, `surface`, `media`, `title`, `body`, `moleculeLayout`.  
  Contract does **not** list `mediaPosition` or `contentAlign` for card. `PARAM_KEY_MAPPING.md` does not list them (L19–22 card row). So **contract/doc:** card layout keys used by the compound are not yet in the contract/mapping.

### 4.2 Preset definitions

- **Section preset "image-left-text-right"** (`section-layout-presets.ts` L79–89): Sets `containerWidth`, `moleculeLayout: { type, preset, params }`. **Does not set:** any key under Section that would flow to Cards (e.g. a `cardLayout` or child params), or Grid `layout.params.columns`.

### 4.3 Compounds — actual param reads

- **Section** (`section.compound.tsx` L106–118): Reads `params.containerWidth`, `params.heroMode`, `params.moleculeLayout` (and `moleculeLayout.type` for isSplitLayout / isGridLayout). **Does not read** any card-specific or Grid-specific keys from preset.
- **Card** (`card.compound.tsx` L91–92, L56–58): Reads `params.mediaPosition`, `params.contentAlign`, `params.moleculeLayout`, `params.layout`, `params.media`, etc. **Gets mediaPosition/contentAlign only from node (JSON); preset never merges into Card.**

### 4.4 Summary table

| Intended behavior | Expected param keys | Where set | Where read | Actual flow |
|------------------|---------------------|-----------|------------|-------------|
| Section row layout | `moleculeLayout.type`, `moleculeLayout.params` | Preset (Section only) | Section compound | Applied; Section uses inline grid 1fr 1fr (not RowLayout). |
| Card image left / text right | `mediaPosition`, `contentAlign` (or contract-equivalent) | Not in preset | Card compound L91–92 | **Dropped:** preset does not set; apply step does not merge into Card. |
| Grid columns (2/3/4) | `layout.params.columns` on Grid node | Not in preset; organ variant not applied to hand-written Grid | GridLayout (registry) | **Dropped:** only from JSON; preset/variant do not write to Grid child. |
| Card image not shrinking | — | — | Card compound (media chunk) | **Missing:** no flexShrink/minWidth on media chunk. |

---

## 5. Ranked root causes (with file/line evidence)

1. **Preset "image-left-text-right" is Section-only and never flows to Card**  
   - Preset defines only Section-level `moleculeLayout` (`section-layout-presets.ts` L79–89).  
   - Merge happens only into Section `next.params` (`json-renderer.tsx` L370–377).  
   - No logic merges preset (or a `cardLayout` block) into **Card** children.  
   - Card reads `params.mediaPosition` / `params.contentAlign` (`card.compound.tsx` L91–92) but they are only from JSON, so preset selection does not change card layout.  
   **Evidence:** Preset name suggests "image left / text right" (card-level), but the preset and apply step never touch Card params.

2. **Section compound implements "row" as section-level 1fr/1fr grid; card layout unchanged**  
   - `moleculeLayout.type === "row"` → `isSplitLayout = true` (`section.compound.tsx` L113–115).  
   - Inner content is `display: "grid"`, `gridTemplateColumns: "1fr 1fr"` (L188–189), with `slotContent` in one cell and **all children** in the other.  
   - So the **section** splits (e.g. empty left, title+Grid right). Cards inside the Grid are unchanged; no RowLayout from `src/layout/molecules/` is used for Section inner or Card inner.  
   **Evidence:** Selecting "image-left-text-right" can "shift the whole card" (section’s two columns) but does not make each card "image left / text right" by preset.

3. **Card media chunk has no flex constraint; image shrinks**  
   - Card builds a flex row for media + text (`card.compound.tsx` L174–180) with `firstChunk` / `secondChunk`.  
   - The media chunk (MediaAtom) is not wrapped with `flexShrink: 0` or `minWidth`.  
   **Evidence:** "Shrinks the image" matches unconstrained flex item; `media.tsx` L109 uses `width: "100%"` inside the wrapper, so the flex item can still shrink.

---

## 6. Minimal fix plan (no code)

### Fix 1: Preset → Card params (image left / text right)

- **Files to change:**  
  - `src/layout/section-layout-presets.ts`: Extend preset def (e.g. "image-left-text-right") with an optional **card-level** shape (e.g. `cardLayout: { mediaPosition?: "left" | "right" | "top" | "bottom", contentAlign?: "start" | "center" | "end" }`) so the preset can express card layout.  
  - `src/engine/core/json-renderer.tsx`: In `applyProfileToNode`, when a Section has an effective preset that contains this card-level shape, **when recursing to children**, if a child is a Card (or a Grid whose descendants include Cards), merge that shape into the Card’s `params` (so Card receives `mediaPosition` / `contentAlign`).  
- **Prop/key to wire:** Preset: `cardLayout.mediaPosition`, `cardLayout.contentAlign`. Card: existing `params.mediaPosition`, `params.contentAlign`. Contract: add `mediaPosition`, `contentAlign` to card `allowedParams` (and PARAM_KEY_MAPPING) so code conforms to contract.  
- **5-minute verification:** Load app-1, select "image-left-text-right" for features section. Cards in that section should show image left, text right; changing preset to (e.g.) default or another preset should change card layout if that preset sets a different cardLayout.

### Fix 2: Section "row" vs layout molecules (optional clarification)

- **Files to change:**  
  - Either keep current behavior (Section compound uses inline grid for slotContent | children) and document that "image-left-text-right" is section-level row + (after Fix 1) card-level media position,  
  - Or, if Section’s **children** should be laid out by RowLayout when preset is "row", ensure the **Section node’s** `layout` (or the merged params) results in the renderer wrapping Section’s children in `Registry.row` with the preset’s params, and that Section compound does not override that with a 1fr/1fr grid when a Grid child is present (per prior grid fix plan).  
- **Prop/key:** `node.layout.type` and `node.layout.params` for Section (or merged from preset) so renderer uses RowLayout/ColumnLayout; Section compound should not apply an extra grid that squashes the Grid into one cell.  
- **5-minute verification:** Section with preset "image-left-text-right" and a Grid of cards: section title and Grid should use the intended row/column; cards should not be confined to one narrow column.

### Fix 3: Card media chunk not shrinking

- **Files to change:**  
  - `src/compounds/ui/12-molecules/card.compound.tsx`: Where the media chunk is rendered (e.g. L138–142 / firstChunk secondChunk), when `mediaPosition` is "left" or "right", wrap the media chunk (or the node that wraps MediaAtom) in a container with `flexShrink: 0` and a sensible `minWidth` (e.g. token or `min(140px, 30%)`) so the image does not collapse.  
- **Prop/key:** No new params required if using a fixed token; optionally allow `params.media.minWidth` or similar if contract is extended.  
- **5-minute verification:** Resize viewport or use a section with constrained width; cards with image left/right should keep the image at a readable size instead of shrinking to a sliver.

### Fix 4: Grid columns from preset/variant (if desired)

- **Files to change:**  
  - `src/engine/core/json-renderer.tsx`: In `applyProfileToNode`, when the node is a Section with role features (or similar) and has an effective layout preset or organ variant override that implies a column count, **when recursing to children**, if a child has `type === "Grid"`, merge the resolved column count into that child’s `layout.params` (e.g. `columns`).  
  - `src/app/page.tsx`: Pass `organVariantOverrides` into JsonRenderer so variant (2-col, 3-col, 4-col) can be resolved to a number and applied to Grid children.  
- **Prop/key:** Grid node: `layout.params.columns`. Preset: e.g. `gridColumns` or derive from preset id; variant: from organVariantOverrides[sectionKey] (e.g. "2-col" → 2).  
- **5-minute verification:** Change Features Grid variant or a layout preset that sets grid columns; the card grid should switch to 2, 3, or 4 columns.

---

## 7. Contract alignment (no contract edits in this doc)

- Card compound uses `mediaPosition` and `contentAlign`; these are **not** in `JSON_SCREEN_CONTRACT.json` card `allowedParams` nor in `PARAM_KEY_MAPPING.md`. To conform to "contract is source of truth," either: (a) add these to contract and mapping and then wire preset → Card as above, or (b) document them as implementation details and keep preset → Card out of scope until contract is updated. This plan assumes (a) for Fix 1.
