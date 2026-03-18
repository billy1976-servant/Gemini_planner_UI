# Render Path Audit: Kanban / Board TSX Organs

## Symptom

TSX Board (Kanban) organs/organisms render blank or text-only instead of a real Kanban/Trello-style UI (visible columns, cards, and layout).

## Root cause

**Primary:** `organ-columnstrip` is defined as `type: "column"` in layout-definitions, so board columns stack vertically instead of in a horizontal row; and `organ-boardcolumn` has no flex/minWidth, so columns do not get horizontal space. **Contributing:** Board-style organs (e.g. `boardColumn`, `columnStrip`) have no entries in `organ-layout-profiles.json` or organ-registry VARIANTS, so they rely only on layout-definitions and get no Kanban-specific layout or variant; if palette CSS variables are not applied on the route, molecules can render with unresolved tokens (invisible or text-only).

---

## Evidence

### 1) Commands run

- **npm run apps** — Ran successfully (exit 0); reported violations but did not block.
- **npm test** — No top-level `"test"` script in `package.json`; only `test:organs:layer1`, `test:csv`, etc. exist.
- **npm run dev** — Not run; no runtime errors observed from code path.

### 2) Render chain: BoardOrganism → Section / Card / Button

| Step | File + line | Snippet / finding |
|------|-------------|--------------------|
| Entry | `src/04_Presentation/components/organisms/tsx-organisms/BoardOrganism.tsx` 29–51 | Uses `useSyncExternalStore(subscribeState, getState, getState)`; wraps content in `<Section layout={LAYOUT_ROOT} role={LAYOUT_ROOT}>`, inner `<Section layout={LAYOUT_LIST}>`, then `FilterBarOrgan`, `ColumnStripOrgan` (with `BoardColumnOrgan` children), `SelectionBarOrgan`. |
| Section | `BoardOrganism.tsx` 13, 49–52, 66 | Imports `Section` from `@/components/molecules/section.compound`; uses `layout="organism-root"`, `"organ-listcontent"`; per-card wrapper uses `layout="organ-filterbar"` (line 66). |
| Card | `BoardOrganism.tsx` 15, 44–46, 62–63, 67, 89 | Imports `Card` from `@/components/molecules/card.compound`; passes `content={{ title: "…" }}` and `params={ORGAN_CARD_PLACEHOLDER_PARAMS}`. |
| Button | `BoardOrganism.tsx` 14, 68–84 | Imports `Button` from `@/components/molecules/button.compound`; passes `content={{ label: "×" }}` and `behavior={{ type: "Action", params: { name: "structure:deleteItem", id: card.id } }}`. |
| BoardColumnOrgan | `src/04_Presentation/components/organs/tsx-organs/BoardColumnOrgan.tsx` 9–17 | Receives `slots`; renders `<Section id={organId} role={LAYOUT_ID} layout={LAYOUT_ID} params={{ internalLayoutId: LAYOUT_ID }}>` with `LAYOUT_ID = "organ-boardcolumn"`; children are `s["boardColumn.header"]`, `s["boardColumn.cards"]`, `s["boardColumn.footer"]`. |
| Section compound | `src/04_Presentation/components/molecules/section.compound.tsx` 138–214 | Calls `resolveLayout(layout, { templateId, sectionRole: role })`; if `layoutDef` exists, renders `LayoutMoleculeRenderer` with `effectiveDef` and `children`; else fallback `<div data-section-id={id}>{children}</div>`. |
| Layout resolver | `src/04_Presentation/layout/resolver/layout-resolver.ts` 54–78, 99–102 | `getPageLayoutId(layout, context)` → `getPageLayoutById(layoutId)` + `resolveComponentLayout(layoutId)`; returns merged `{ ...pageDef, moleculeLayout: componentDef }`. |
| Layout renderer | `src/04_Presentation/layout/renderer/LayoutMoleculeRenderer.tsx` 216–412 | Uses `moleculeLayout` → `resolveMoleculeLayout(...)` → `resolved`; for non-split, wraps `slotContent` + `children` in `SequenceAtom` or `CollectionAtom`; outer `SurfaceAtom(surfaceWithVariant)` and container styles from `layout.container`. |
| Palette | `src/03_Runtime/engine/core/palette-resolve-token.ts` 21–31 | `resolveToken(path, depth, paletteOverride)` uses `paletteOverride ?? getPalette()`; palette from `palette-store` (state.values.paletteName). |
| Palette at root | `src/app/layout.tsx` 28–29, 168 | Imports `usePaletteCSS` from `@/lib/site-renderer/palette-bridge`; calls `usePaletteCSS()` in `RootLayoutBody`. So any route under app (including tsx-test) gets palette applied at root. |
| Card placeholder params | `src/04_Presentation/components/organisms/tsx-organisms/shared.ts` 6–12 | `ORGAN_CARD_PLACEHOLDER_PARAMS` sets `surface: { background: "var(--color-surface-2, #f1f5f9)", padding: "var(--spacing-2, 8px)", radius: "var(--radius-md, 6px)" }` so Card has a visible surface when used in organs. |

### 3) Layout resolver and layout-definitions

- **Page layout IDs:** `src/04_Presentation/layout/page/page-layout-resolver.ts` 35–38 — `getPageLayoutById(id)` looks up `pageLayouts[id]` from `layout-definitions.json` `pageLayouts`.
- **Component layout IDs:** `src/04_Presentation/layout/component/component-layout-resolver.ts` 22–28 — `resolveComponentLayout(layoutId)` looks up `componentLayouts[normalized]` from `layout-definitions.json` `componentLayouts`.
- **IDs present in layout-definitions.json:**
  - `organism-root`: pageLayouts line 251; componentLayouts line 334 (`type: "row"`).
  - `organ-listcontent`: pageLayouts line 237; componentLayouts line 336 (`type: "column"`).
  - `organ-boardcolumn`: pageLayouts line 239; componentLayouts line 339 (`type: "column"`, `params: { "gap": "0", "align": "stretch", "padding": "0" }`).
  - `organ-filterbar`: pageLayouts line 234; componentLayouts line 331 (`type: "row"`).
  - `organ-columnstrip`: pageLayouts line 238; componentLayouts line 337 (`type: "column"`).

### 4) Molecules: DOM, provider, layout ID, content shape

| Molecule | (A) Renders DOM? | (B) Provider/context for styles? | (C) Layout ID required? | (D) Content shape |
|----------|------------------|----------------------------------|-------------------------|------------------|
| **Section** | Yes: either `LayoutMoleculeRenderer` (with inner divs + atoms) or fallback `<div data-section-id>`. | No separate provider; uses `resolveLayout` (layout-definitions) and, when `role` is in `getOrganLayoutOrganIds()`, `loadOrganVariant`. | Yes: `layout` prop is the layout id (e.g. `organ-boardcolumn`). All four IDs above exist in layout-definitions.json. | N/A (container only). |
| **Card** | Yes: `TriggerAtom` → `SurfaceAtom` → slot content (e.g. `TextAtom` for title/body). | Yes: `SurfaceAtom`/`TextAtom` use `resolveToken` → `getPalette()` (palette-store / state). Without palette CSS vars, tokens can be undefined → invisible. | No layout ID; uses `params.moleculeLayout` and `resolveParams(params.surface/title/body)` for styling. | Card expects `content.title` and/or `content.body` (and optional `content.media`). BoardOrganism passes `content={{ title: "…" }}` — correct. |
| **Button** | Yes: `TriggerAtom` → `SurfaceAtom` → `TextAtom` for label. | Same as Card: palette via `resolveParams(params.surface, params.label)` and `resolveToken` in atoms. | No layout ID; uses `params.moleculeLayout` (default row). | Button expects `content.label` (and optional `content.supportingText`). BoardOrganism passes `content={{ label: "×" }}` and `content={{ label: "→ …" }}` — correct. |

### 5) Why BoardColumnOrgan can appear blank or text-only

- **Slots:** Not undefined at runtime. BoardOrganism always passes an object for `slots` (lines 61–90 or 98–101); keys `boardColumn.header`, `boardColumn.cards`, `boardColumn.footer` are Card elements or fragments.
- **Section filtering children:** Section does not filter children; it passes `children` to `LayoutMoleculeRenderer` (section.compound.tsx 209–211). LayoutMoleculeRenderer uses them as `contentChildren` (non-split) and renders them inside `SequenceAtom`/`CollectionAtom` (lines 377–401).
- **Layout resolver / display:none:** Layout resolves (page + component defs exist). No `display: none` or zero-size in layout-definitions for these IDs. LAYOUT_RECOVERY_MODE in LayoutMoleculeRenderer (line 18) forces safe defaults when layout is null.
- **Palette / CSS variables:** Atoms use `resolveToken(params.…)` which calls `getPalette()`. If the route does not have palette applied (e.g. state.values.paletteName missing or a route outside the layout that calls `usePaletteCSS()`), token resolution can return undefined → transparent or unstyled text (text-only or blank). `ORGAN_CARD_PLACEHOLDER_PARAMS` uses `var(--color-surface-2, #f1f5f9)` so a missing var still has a fallback; palette-bridge sets `--color-surface-1` but not `--color-surface-2`, so the fallback is used unless palette defines it.
- **Hydration / useSyncExternalStore:** BoardOrganism uses `useSyncExternalStore(subscribeState, getState, getState)`. If `getState()` returns null or `state.values.structure` is missing, `tree`/`columns` are empty and the organism renders the empty state (one BoardColumnOrgan with “No columns” / “Add column…”). That still renders one column with text; blank would require that text to be invisible (palette) or the whole tree to be hidden.

**The one structural reason the organ can look “blank” or not like Kanban:**

- **Column strip direction:** In `layout-definitions.json`, `componentLayouts["organ-columnstrip"]` is `type: "column"` (line 337). So ColumnStripOrgan’s Section gets a column layout and all BoardColumnOrgan children stack **vertically**. For a Trello-like board, the strip must be a **row** so columns sit side by side. With column layout and no flex/minWidth on `organ-boardcolumn`, columns do not get horizontal space and the board does not look like Kanban; content can appear as a single narrow column or “text-only” if card surfaces are not visible.

### 6) Organ layout profiles and variants

- **organ-layout-profiles.json** (`src/04_Presentation/layout-organ/organ-layout-profiles.json`): Lists only hero, header, nav, footer, content-section, features-grid, gallery, testimonials, pricing, faq, cta. It does **not** list toolbar, sidebar, filterBar, columnStrip, boardColumn, selectionBar.
- **Section compound** (`section.compound.tsx` 154–184): `isOrgan = organIds.includes(role)`. For `role="organ-boardcolumn"`, `organIds` does not include that value (profiles use short names like `"hero"`, not `"organ-boardcolumn"`). So the organ variant branch is not taken; `loadOrganVariant` is not used for board organs. Layout comes only from `layout-definitions.json`.
- **organ-registry VARIANTS** (`src/04_Presentation/components/organs/organ-registry.ts` 79–169): No entries for boardColumn, columnStrip, toolbar, sidebar, filterBar, selectionBar. So even if a profile existed, `loadOrganVariant("organ-boardcolumn", …)` would return null.

---

## Fix plan (max 8 bullets, smallest change first)

1. **Add Kanban-specific layout for column strip:** In `layout-definitions.json`, either (a) add a new page + component layout id (e.g. `organ-boardcolumnstrip`) with `type: "row"` and use it from ColumnStripOrgan when used inside BoardOrganism, or (b) change `organ-columnstrip` componentLayout to `type: "row"` if that ID is only used for board. Prefer (a) if organ-columnstrip is shared with other UIs that need a vertical strip.
2. **Give board columns horizontal size:** In `layout-definitions.json` `componentLayouts["organ-boardcolumn"]`, add params so the column gets width in a row (e.g. `minWidth`, or a flex token if the layout engine supports it), so each column has a visible width when the strip is row.
3. **Ensure palette is applied on tsx-test (and any board route):** Confirm the board is rendered under the same root layout that calls `usePaletteCSS()` (e.g. `src/app/layout.tsx`). If the board is ever rendered in a route that does not use that layout, wrap that route with the same palette application or ensure state.values.paletteName is set and palette-store is hydrated.
4. **Optional: Add board organs to organ-layout-profiles.json:** Add entries for columnStrip and boardColumn with internalLayoutIds and defaultInternalLayoutId so Section’s organ branch can run and future variant JSON (e.g. “kanban”) can drive layout without code changes.
5. **Optional: Add organ variants for board:** In organ-registry VARIANTS, add boardColumn (and optionally columnStrip) with a default variant JSON that supplies moleculeLayout (e.g. column with gap/flex) so layout can be overridden per skin/variant.
6. **Do not add inline styles or raw div/button in organs:** Keep using Section/Card/Button and layout-definitions + palette only.
7. **Do not hardcode CSS in molecules:** Keep layout and spacing from layout-definitions and molecule-layout-resolver only.
8. **If Card/Button still look “flat”:** Ensure default palette (or the one used on the route) defines tokens referenced by ORGAN_CARD_PLACEHOLDER_PARAMS (e.g. `--color-surface-2` or that components use palette-bridge-set vars like `--color-surface-1`) so Card surface and text are visibly styled.

---

## What NOT to change

1. **Do not remove or bypass layout-definitions.json / component-layout-resolver:** Layout must stay the single source for section and component layout; organs and molecules must not invent layout in code.
2. **Do not add hardcoded flex/width in BoardOrganism or BoardColumnOrgan:** Column strip direction and column width must come from layout-definitions (or from organ variant JSON once profiles/variants exist).
3. **Do not replace Section/Card/Button with raw div/button in organisms or organs:** Keep the contract that only molecules and palette/layout systems drive the Kanban UI.
