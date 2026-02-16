# Layout preview “falling back to default” – analysis

## Goal

Understand why some section layout previews (hero-split, testimonial-band, cta-centered) appear to fall back to a default look while others (content-stack, features-grid-3) do not, using `Layout_Dropdown.json` and the current pipeline.

## JSON screen file (`Layout_Dropdown.json`)

- **Sections and their `layout` in JSON:**
  - `nav_section`: `content-stack`
  - `header_section`: `content-stack`
  - `hero_section`: `hero-split`
  - `features_section`: `features-grid-3`
  - `gallery_section`: `features-grid-3`
  - `testimonials_section`: `testimonial-band`
  - `pricing_section`: `features-grid-3`
  - `faq_section`: `content-stack`
  - `cta_section`: `cta-centered`
  - `footer_section`: (Footer, no section layout id)

All of these layout ids exist in `layout-definitions.json` (pageLayouts and componentLayouts). So “falling back” is not due to missing layout ids in the JSON or in definitions.

## Pipeline (preview tiles)

1. **OrganPanel** builds one preview tile per section layout option; each tile uses `PreviewRender` with `sectionKey` (e.g. `gallery_section`) and `previewValue` (e.g. `testimonial-band`).
2. **PreviewRender** builds `sectionOverrides = { [sectionKey]: previewValue }` and passes it to **JsonRenderer** as `sectionLayoutPresetOverrides`.
3. **JsonRenderer** → **applyProfileToNode** uses **getSectionLayoutId** with override → node.layout → template → fallback. For a tile with `previewValue === "testimonial-band"`, override wins, so the resolved section layout id is `testimonial-band` (no fallback at this step).
4. **SectionCompound** receives `layout: "testimonial-band"` (or hero-split, cta-centered, etc.) and calls **resolveLayout(layout, context)**.
5. **resolveLayout** merges **page layout** (from `layout-definitions.json` pageLayouts) and **component layout** (componentLayouts). So we get `containerWidth`, `split`, `container`, and `moleculeLayout`.
6. **LayoutMoleculeRenderer** gets this merged definition and:
   - For **split** layouts: uses `contentColumn.*`, `mediaColumn.*`, `mediaImage.*`, etc. from the layout object.
   - Uses **requireLayoutValue(name, value, layoutId)** for many of these. If `value` is missing, it logs `[LAYOUT HARD FAIL]` and returns `undefined` (no fallback value).

## Root cause 1: Missing tokens for split / column in definitions

In **layout-definitions.json**:

- **pageLayouts** for `hero-split`, `testimonial-band`, `cta-centered`, etc. only define:
  - `containerWidth`, `container`, and for hero-split also `split: { type: "split", mediaSlot: "right" }`.
- There are **no** `contentColumn`, `mediaColumn`, `mediaImage`, or `mediaImageWrapper` keys in any layout definition.

So in **LayoutMoleculeRenderer**:

- `(layout as any)?.contentColumn` → `undefined` → `contentColumnLayout = {}`.
- `requireLayoutValue("contentColumn.display", contentColumnLayout.display, layoutId)` → value is `undefined` → **`[LAYOUT HARD FAIL]`** and returns `undefined`.
- Same for other `contentColumn.*`, `mediaColumn.*`, `mediaImage.*` tokens.
- Result: **content column and media column get no styles** (empty style objects). The section still renders (divs and content exist), but without the intended flex/grid/split styling, so it can look like a plain/default stack.

So:

- **content-stack** and **features-grid-3** do not rely on `contentColumn` / `mediaColumn` for their main structure; they use `moleculeLayout` (column/grid) and Collection/Sequence. So they still look correct.
- **hero-split** depends on `split` plus content/media column styling. Missing `contentColumn`/`mediaColumn` → no split styling → “default” look.
- **testimonial-band** and **cta-centered** use `moleculeLayout` (row/column) and no split, so in theory they don’t need contentColumn. If they still look like default, it may be due to other missing tokens or to cause 2 below.

## Root cause 2: Preview height effect and re-renders

In **PreviewRender.tsx** the height of the tile is driven by **scaledHeight**, which is set in a **useLayoutEffect** that reads `inner.offsetHeight` and scales it.

- If this effect runs **on every render** (no deps), then on every parent re-render all preview tiles run the effect. That can cause many `setScaledHeight` updates and layout thrashing; occasionally the read of `inner.offsetHeight` can happen before layout has settled, giving a wrong (e.g. too small) height and making the tile look clipped or “default”.
- If the effect depended on **screenModel**, then any time the parent passed a new `screenModel` reference (even for the same screen), every tile would re-run the effect again → same thrashing and risk of wrong height.

**Change made:** the effect now has dependencies **only** `[containerWidth, previewValue, sectionKey]` (no `screenModel`). So we re-measure when:
- The container width changes,
- The user switches layout preset (`previewValue`), or
- The section changes (`sectionKey`),

and we do **not** re-run on every parent re-render or when `screenModel` reference changes. That should reduce thrashing and stabilize tile height so previews are less likely to look “default” due to clipping or wrong height.

## Why “these and not others”?

| Layout type              | Depends on contentColumn/mediaColumn? | In layout-definitions? | Result |
|--------------------------|---------------------------------------|-------------------------|--------|
| content-stack             | No (moleculeLayout column only)       | Yes (moleculeLayout)    | Works  |
| features-grid-3          | No (moleculeLayout grid only)         | Yes (moleculeLayout)    | Works  |
| hero-split               | Yes (split + content + media columns)| **No**                  | Looks default |
| testimonial-band         | Largely moleculeLayout row            | Yes (moleculeLayout)    | May work or look default if other tokens are required |
| cta-centered             | Largely moleculeLayout column         | Yes (moleculeLayout)    | Same as above |

So the ones that “fall back” are those that either:

1. Depend on **split + contentColumn/mediaColumn** (hero-split), and those tokens are missing in definitions, or  
2. Are affected by **preview height timing** (any layout) when the effect ran too often or too early.

## What was changed (implementation)

- **PreviewRender.tsx**
  - **useLayoutEffect** that sets `scaledHeight` now has deps `[containerWidth, previewValue, sectionKey]` (no `screenModel`), with a short comment explaining why.
  - Restored a single **console.debug** when `scaledHeight` is recalculated (dev only).

No changes to JSON schema, layout-definitions content, engine behavior, or registry. Fix is limited to preview stability (height re-measure policy and logging).

## Applied: layout-definitions tokens for split layouts

**contentColumn**, **mediaColumn**, **mediaImageWrapper**, and **mediaImage** were added to the three split layouts (**hero-split**, **hero-split-image-right**, **hero-split-image-left**) in that file. **LayoutMoleculeRenderer**’s **requireLayoutValue** calls for those keys now get values, so no **LAYOUT HARD FAIL** or unstyled columns. The remaining cause was **missing layout tokens** in `layout-definitions.json` (e.g. `contentColumn`, `mediaColumn`, `mediaImage` for split layouts). Fixing that would require adding those tokens to the layout definitions (or relaxing **requireLayoutValue** / adding safe defaults in the renderer). That would be a separate, schema/definition change and is out of scope for “preview consistency only.”
