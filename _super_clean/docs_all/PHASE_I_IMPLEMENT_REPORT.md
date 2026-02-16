# PHASE I Implementation Report — Layout-Definitions as Single Section Gap Authority

**Goal:** Remove all template-profiles influence on section gap so section gap comes only from layout-definitions.

**Scope:** Sections only. Lists, toolbars, and card internals unchanged. No padding, typography, colors, atoms, molecules.json, or layout-definitions.json touched.

---

## Files Touched

| File | Change |
|------|--------|
| `src/03_Runtime/engine/core/json-renderer.tsx` | (1) Spacing overlay for sections no longer merges `layout.gap`. (2) Variant params overlay for sections no longer merges `gap` or `layout.gap`. |

**No other files modified.** template-profiles.json, layout-definitions.json, spacing-scales.json, section-layout-id, page.tsx, LayoutMoleculeRenderer, and all atoms/molecules left unchanged.

---

## Lines Removed / Replaced (summary)

- **Spacing overlay:** Replaced the single use of `getSpacingForScale(..., "section")` with a flow that still calls it for sections but strips `layout.gap` from the overlay before merging. So spacing scale no longer injects section gap; other spacing-scale keys (e.g. `surface`) still merge.
- **Variant params overlay:** Replaced direct use of `_variantParams` for sections with a derived overlay that omits top-level `gap` and `layout.gap` before merging. Non-gap variant params (e.g. containerWidth) still apply.

No lines were deleted in bulk; the previous ~15-line block (spacingOverlay + variantParamsOverlay + finalParams) was replaced by a larger block that implements the strip-and-merge behavior. Net change is additive (new logic), with no removal of unrelated code.

---

## New Gap Authority Path

**Section gap at runtime:**

1. **Only sources:**  
   - `layout-definitions.json` → **componentLayouts** `[layoutId].params.gap` (via resolveLayout → moleculeLayout.params), and  
   - `layout-definitions.json` → **pageLayouts** `[layoutId].contentColumn.gap` (for split layouts in LayoutMoleculeRenderer).

2. **No longer applied for section gap:**  
   - template-profiles **spacingScale** → spacing-scales.json `section.layout.gap` (still merged for section for other keys like `surface`; `layout.gap` is stripped before merge).  
   - template-profiles **layoutVariants** `[role].params.gap` and `params.layout.gap` (stripped before merge; other variant params still merge).

3. **Unchanged:**  
   - template-profiles still drives layout **selection** (defaultSectionLayoutId, layoutVariants.layoutId, etc.), visualPreset, and metadata.  
   - Gap for **lists**, **toolbars**, and **card** internals still comes from their existing sources (visual-presets, molecule params, etc.); no change.

**Data flow (sections only):**  
Section layout id → resolveLayout(layoutId) → layout-definitions (pageLayouts + componentLayouts) → params.gap and contentColumn.gap → LayoutMoleculeRenderer. json-renderer no longer adds or overrides section gap from spacingScale or layoutVariants.

---

## Validation

- **No new defaults:** No fallback gap values or `gap: 0` added.  
- **No fallbacks added:** Section gap is whatever layout-definitions specifies; if a layout has no gap, no default is injected.  
- **No 0 values inserted:** No zero gap or placeholder values.  
- **No behavior changes outside section spacing:** Only section params merge in json-renderer was narrowed (spacing overlay and variant overlay no longer contribute gap). Lists, toolbars, cards, padding, typography, and colors unchanged.

---

End of report.
