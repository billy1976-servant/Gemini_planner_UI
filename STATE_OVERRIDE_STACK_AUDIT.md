# Audit 1 — State Override Stack

**Purpose:** Trace how runtime values propagate and override across layers for layout choice, spacing, typography, surface props, and alignment. Read-only analysis; no code modifications.

---

## 1. Data Flow Summary

| Layer | Source | What it supplies |
|-------|--------|------------------|
| Screen JSON | Screen payload (path, doc) | Tree with sections; optional per-node `layout`, `id`, `role`. No single "screen layout" value. |
| Layout JSON | `src/04_Presentation/layout/data/layout-definitions.json` | `pageLayouts`, `templates`, `componentLayouts` (see below). |
| Template profiles | `src/04_Presentation/lib-layout/template-profiles.json` + `.ts` | `sections[role]` (type + params), `defaultSectionLayoutId`, `containerWidth`, `widthByRole`, `spacingScale`, `visualPreset`, `cardPreset`. |
| Molecule presets | `molecule-layouts.json`, `screen-definitions.json` | Flow + params (e.g. gap.md); used by molecule-layout-resolver, screen-layout-resolver. |
| Layout resolver | `src/04_Presentation/layout/resolver/layout-resolver.ts` | `resolveLayout(layout, context)` → pageDef + moleculeLayout; no template merge here. |
| Section layout id | `src/04_Presentation/layout/section-layout-id.ts` | Single authority for which layout id wins (override → node.layout → layoutVariants → template role → template default → "content-stack"). |
| Molecule resolver | `LayoutMoleculeRenderer` + `molecule-layout-resolver.ts` | resolveMoleculeLayout(type, preset, params); merge: def.defaults → layout.params → presetParams → passed params. |
| Params merge | `src/03_Runtime/engine/core/json-renderer.tsx` (≈807–875) | visualPreset + cardPreset → resolveParams → section layout overlay → spacing overlay → _variantParams (gap stripped from variant for sections). |
| Atom params | `palette-resolver.ts`, `palette-resolve-token.ts` | deepMerge then resolveToken per key; palette from store or override. |
| TSX fallbacks | LayoutMoleculeRenderer, Section, atoms | renderWithDefaults (flex center div); getLayoutValueWithSafeDefault for some keys; atoms return path as-is if token missing. |
| CSS | `src/07_Dev_Tools/styles/site-theme.css` | :root --spacing-*, --color-*, --radius-*, --shadow-*. |

---

## 2. Layout Choice

**All sources (file + key path):**

1. **sectionLayoutPresetOverrides** — State/store; key = sectionKey; value = layoutId. Injected by page.tsx (getOverridesForScreen / sectionLayoutPresetFromState) and passed to JsonRenderer → getSectionLayoutId.
2. **node.layout** — Screen JSON section node; key `layout` (string).
3. **template layoutVariants[role]** — template-profiles (profile.layoutVariants[nodeRole].layoutId); used when no override and no node.layout.
4. **Template role** — layout-definitions.json `templates[templateId][sectionRole]`; resolved via getPageLayoutId(null, { templateId, sectionRole }) in page-layout-resolver.
5. **Template default** — `defaultSectionLayoutIdFromProfile` (from template-profiles) or `getDefaultSectionLayoutId(templateId)`. In page-layout-resolver (lines 79–85), getDefaultSectionLayoutId returns `templates[templateId]["defaultLayout"]`; layout-definitions.json templates currently do not define `defaultLayout`; the effective template default is from template-profiles `defaultSectionLayoutId` passed as `defaultSectionLayoutIdFromProfile`.
6. **Fallback** — Hardcoded `"content-stack"` in section-layout-id.ts (line 127).

**Override order (numbered):** 1 → 2 → 3 → 4 → 5 → 6.

**Last-writer wins:** The first non-null in that order (override wins over node.layout wins over layoutVariants wins over template role wins over template default wins over fallback).

**Hidden defaults:** Fallback "content-stack" when all prior sources are empty. defaultSectionLayoutId from template-profiles when layout-definitions templates have no defaultLayout.

**Parallel competing sources:** sectionLayoutPresetOverrides (state/store) vs node.layout (JSON) vs template (layoutVariants vs templates[templateId][role]) vs template-profiles defaultSectionLayoutId vs layout-definitions defaultLayout (currently unused). Two sources for "template default": template-profiles and layout-definitions; in practice only template-profiles is used because defaultLayout is not set in layout-definitions.

---

## 3. Spacing Values

**All sources (file + key path):**

1. **layout-definitions.json** — `pageLayouts[id].contentColumn.gap`, `componentLayouts[id].params.gap`, `componentLayouts[id].params.padding` (e.g. var(--spacing-6), var(--spacing-8), var(--spacing-10) 0).
2. **template-profiles.json** — `sections[role].params.gap`, `sections[role].params.padding` (e.g. "1rem", "2.5rem", "3rem 0").
3. **spacing-scales.json** — `[scaleId].section.layout.gap`, etc.; referenced by getSpacingForScale(profile.spacingScale, "section") in json-renderer (838–848). JsonRenderer strips gap from spacing overlay for sections (842–848) so spacing scale does not override section gap.
4. **visual-presets.json** — Preset layout.gap (e.g. spacing.stackGap, gap.xl); applied via getVisualPresetForMolecule → resolveParams; for sections, sectionPresetLayoutOverlay (828–835) merges visualPresetOverlay.layout.
5. **molecule-layouts.json** — Defaults/presets params.gap (e.g. gap.md); merged in molecule-layout-resolver before translateFlow.
6. **LayoutMoleculeRenderer** — Reads moleculeLayout.params.gap and .padding (lines 283–284, 313–314); applies to splitLayoutStyle or resolved Collection/Sequence params. Only applies when value explicitly present (requireLayoutValue).
7. **resolveParams / resolveToken** — Palette and inline params; gap/padding can be token paths (e.g. gap.xl) resolved to values.

**Override order (for section):** In JsonRenderer: resolvedParams (visualPreset + cardPreset + node params) → sectionPresetLayoutOverlay (visual preset layout) → spacingOverlay (spacing scale; gap stripped for section) → variantParamsOverlay (gap stripped for section). Final params then drive Section → resolveLayout(layoutId) → componentLayouts[layoutId].params; that merged with moleculeLayout in LayoutMoleculeRenderer (resolveMoleculeLayout gets layout-definitions componentLayouts params). So: layout-definitions componentLayouts.params.gap/padding are the section inner gap/padding authority when present; visual preset and spacing scale can overlay other keys; variant params applied but gap intentionally stripped so layout-definitions wins for gap.

**Last-writer wins layer:** For section gap/padding effectively layout-definitions (componentLayouts[layoutId].params) as merged into moleculeLayout and then into finalParams (Section receives layout id, resolveLayout returns that def; LayoutMoleculeRenderer uses moleculeLayout.params). JsonRenderer merge order means later overlays win for non-gap keys; for gap, section gap is deliberately preserved from layout-definitions.

**Hidden defaults:** molecule-layout-resolver merges def.defaults then layout.params then presetParams then passed params; STRICT_JSON_MODE warns on def.defaults. getLayoutValueWithSafeDefault in LayoutMoleculeRenderer for some media/split keys when layoutId exists.

**Parallel competing sources:** template-profiles sections[role].params.gap/padding, layout-definitions componentLayouts params, spacing-scales, visual-presets layout.gap, molecule-layouts defaults/presets, _variantParams (gap stripped for section). Authority for section inner gap: layout-definitions componentLayouts; for other spacing (e.g. card, list): visual preset, spacing scale, variant.

---

## 4. Typography Values

**All sources (file + key path):**

1. **visual-presets.json** — title/body/text: size, weight, lineHeight, letterSpacing, color, fontFamily (e.g. textRole.title.size, color.onSurface). Applied via getVisualPresetForMolecule → resolveParams.
2. **Palette** — default.json and other palettes: textSize, textWeight, lineHeight, letterSpacing; resolved by resolveToken in palette-resolve-token.ts.
3. **ui-atom-token.json** — textSize, textWeight, lineHeight, letterSpacing (numeric or token paths).
4. **Node params** — section/card/node params (title, body, text) passed through resolveParams; deepMerge(visualPreset, variantPreset, sizePreset, inlineParams) then resolveToken per key.
5. **site-theme.css** — --font-size-*, --font-weight-*, --line-height-*; used where components or layout reference var().

**Override order:** resolveParams merge: visualPreset (from getVisualPresetForMolecule) + cardPresetOverlay → variantPreset → sizePreset → profiledNode.params (820–825). Then resolveToken for each key. So: inline node params win over size over variant over visual/card preset.

**Last-writer wins layer:** Inline params (profiledNode.params) in resolveParams; then CSS if component uses var().

**Hidden defaults:** visualPreset and sizePreset supply defaults when node params omit keys; palette resolveToken returns path as-is if lookup fails (no hidden value).

**Parallel competing sources:** visual-presets (per molecule type), palette (per palette), node params, size preset, variant preset. No single typography authority across all components.

---

## 5. Surface Props

**All sources (file + key path):**

1. **visual-presets.json** — section/card/button/navigation etc. surface: background, shadow, radius, transition, borderColor, borderWidth. Token paths (e.g. surface.section, elevation.none, radius.md).
2. **Palette** — color.*, surface.*, radius.*, shadow.*; resolveToken resolves to hex/px or value.
3. **LayoutMoleculeRenderer** — backgroundVariant overrides surface: hero-accent → var(--color-surface-hero-accent), alt → var(--color-surface-alt), dark → var(--color-surface-dark) + color (lines 145–152). resolveParams(params.surface) then variant overlay.
4. **layout-definitions** — No direct surface keys; backgroundVariant on pageLayout drives LayoutMoleculeRenderer overlay.
5. **site-theme.css** — --color-surface-*, --shadow-*, --radius-*.

**Override order:** resolveParams(surface) then in LayoutMoleculeRenderer: if backgroundVariant, overlay background (and color for dark). So: backgroundVariant (layout-definitions pageLayout) wins over resolved surface params for background/color when variant set.

**Last-writer wins layer:** LayoutMoleculeRenderer backgroundVariant overlay when present; otherwise resolveParams output for surface.

**Hidden defaults:** visualPreset supplies surface defaults (background, shadow, radius, transition); palette supplies values for token paths.

**Parallel competing sources:** visual-presets surface, palette surface/color/radius/shadow, layout backgroundVariant, node params.surface.

---

## 6. Alignment Props

**All sources (file + key path):**

1. **layout-definitions.json** — `componentLayouts[id].params`: align, justify (e.g. center, stretch, flex-start, space-between). Also pageLayouts[id].contentColumn.alignItems, mediaColumn.alignItems, splitLayout.alignItems.
2. **template-profiles.json** — `sections[role].params`: align, justify, wrap.
3. **molecule-layouts.json** — layout.params align, justify; merged in molecule-layout-resolver.
4. **screen-definitions.json** — defaults and presets for row/column/grid (align, justify).
5. **LayoutMoleculeRenderer** — contentColumnAlignItems, mediaColumnAlignItems, splitAlignItems from layout (requireLayoutValue); resolved moleculeLayout (SequenceAtom/CollectionAtom params) from resolveMoleculeLayout.
6. **resolveMoleculeLayout** — translateFlow maps direction + params to display/direction/gridTemplateColumns; align/justify passed through.

**Override order:** For section inner: componentLayouts[layoutId].params (align, justify) merged in resolveMoleculeLayout with def.defaults, layout.params, presetParams, passed params (molecule-layout-resolver). Passed params come from resolvedNode.params.moleculeLayout (JsonRenderer finalParams). JsonRenderer merge order: resolvedParams → sectionPresetLayoutOverlay → spacingOverlay → variantParamsOverlay. So alignment in _variantParams or node params can override; then componentLayouts params; then molecule-layouts defaults/presets.

**Last-writer wins layer:** In resolveMoleculeLayout, passed params (from finalParams.moleculeLayout) win over presetParams over layout.params over def.defaults. So alignment effectively: variant params / node params (if merged into moleculeLayout) over layout-definitions componentLayouts over molecule-layouts.

**Hidden defaults:** molecule-layouts.json column/row/grid/stacked have params (align, justify); screen-definitions defaults; translateFlow does not inject alignment if missing.

**Parallel competing sources:** template sections.params (align, justify), layout-definitions componentLayouts.params, molecule-layouts params, screen-definitions, _variantParams, node params.

---

## 7. layout-definitions.json Key Hierarchy

**Verification:** In `src/04_Presentation/layout/data/layout-definitions.json`, the top-level keys are three siblings: **pageLayouts**, **templates**, **componentLayouts**. There is no nesting of componentLayouts inside templates. Same id (e.g. hero-split) can appear in both pageLayouts and componentLayouts; they are looked up by the same layoutId—page layout from pageLayouts, component (molecule) layout from componentLayouts—and merged in resolveLayout, so they do not diverge for the same id; they are two facets (page-level vs inner arrangement) of the same layout id.

---

## 8. Summary Table

| Property class | Last-writer wins layer | Hidden defaults | Competing sources (count) |
|----------------|------------------------|-----------------|----------------------------|
| Layout choice | getSectionLayoutId (override → … → fallback) | "content-stack" fallback; template-profiles defaultSectionLayoutId | 6 (override, node, layoutVariants, template role, template default, fallback) |
| Spacing | layout-definitions componentLayouts.params for section gap/padding; overlays for other keys | molecule-layout def.defaults; getLayoutValueWithSafeDefault | 6+ (layout-definitions, template-profiles, spacing-scales, visual-presets, molecule-layouts, variant) |
| Typography | resolveParams: inline params over size over variant over visual | visual/size preset when key missing | 5 (visual preset, palette, node, size, variant) |
| Surface | LayoutMoleculeRenderer backgroundVariant overlay; else resolveParams surface | visual preset surface | 4 (visual preset, palette, backgroundVariant, node) |
| Alignment | resolveMoleculeLayout passed params (from finalParams) over componentLayouts over molecule-layouts | molecule-layouts/screen-definitions defaults | 5+ (template sections, layout-definitions, molecule-layouts, screen-definitions, variant, node) |
