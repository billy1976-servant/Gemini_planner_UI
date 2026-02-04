# Hero Layout + Cascading Layout — Phase 1 Audit Report

**Classification:** REFERENCE — Hero/audit findings; primary architecture reference: docs/SYSTEM_MASTER/

**Date:** 2025-02-02  
**Scope:** SectionCompound, section layout presets, hero vs card media, full-bleed behavior.

---

## 1. How `role: "hero"` is handled

- **SectionCompound** does not declare or use a `role` prop in its type. The engine passes the full resolved node (including `role`) via `...resolvedNode`; SectionCompound only uses `id` for debug logs (`id.toLowerCase().includes("hero")`).
- Hero behavior is driven entirely by **params** (containerWidth, split, moleculeLayout) that the **json-renderer** sets when applying the section layout preset for `node.role === "hero"`.
- Preset application: `applyProfileToNode()` in `json-renderer.tsx` uses `getSectionLayoutPreset(presetToApply)` and merges `containerWidth`, `split`, `moleculeLayout`, `backgroundVariant` into `next.params`. Default hero preset is `hero-split-image-right` when no override is set.

---

## 2. Where layout presets are applied

- **Source:** `section-layout-presets.ts` (TS fallback) and `section-presets.json` (JSON takes precedence).
- **Hero preset IDs:** `hero-centered`, `hero-split-image-right`, `hero-split-image-left`, `hero-full-bleed-image`.
- **Flow:** Preset → `containerWidth`, `split`, `moleculeLayout` (and optionally `backgroundVariant`) → SectionCompound reads only `params` (no role-based branching inside the compound).

---

## 3. Hero vs other sections: containerWidth

- Hero uses the **same** containerWidth rules as other sections. No dedicated hero branch in SectionCompound for width; it’s whatever the preset sets (e.g. `wide`, `full`, or in TS `var(--container-narrow)` when `VISUAL_TEST_EXTREME`).
- Full-bleed: `effectiveContainerWidth === "full"` → outer wrapper gets `width: 100vw`, `marginLeft/Right: calc(50% - 50vw)`.

---

## 4. Hero media: Card vs hero media

- **Current behavior:** Hero media **is** rendered through CardCompound. `partitionChildrenForSplit()` picks the first child with `content.media` (typically a Card). That Card is rendered in the media column; SectionCompound injects `heroMediaFill: true` (via `injectHeroMediaFill`) so CardCompound renders only a full-bleed `<img>` (no surface, padding, radius) when `params.heroMediaFill || params.variant === "hero-media"`.
- **Conclusion:** Hero media is still “Card media” in structure (Card is the child); only the **visual** output is stripped to image-only. So hero media is treated as Card media, then Card is asked to render in “hero media” style.

---

## 5. Full-bleed mode (hero-full-bleed-image)

- **Preset:** `containerWidth: "full"` (or `100vw` in TS when `VISUAL_TEST_EXTREME`), `moleculeLayout.type: "column"`, `minHeight: "100vh"`, padding in `moleculeLayout.params`.
- **Issues identified:**
  1. **No max-height clamp:** Preset uses `minHeight: "100vh"` with no `max-height`; section can stretch to full viewport height without limit.
  2. **No dedicated full-bleed “background” media:** The preset has no `split`; layout is column only. So the section renders slotContent + children in a column. If the hero has a Card with media, that Card appears as a normal card in the column, not as a full-width background image. So “media spans full width background, content overlays” is **not** implemented for hero-full-bleed-image.
  3. **Padding:** Inner layout uses `moleculeLayout.params.padding` on the flex wrapper; there is no separate “text container” with its own padding tokens. So content padding is applied to the whole inner block, not a dedicated text area that could avoid “edge explosion.”

---

## 6. Summary table

| Item | Finding |
|------|--------|
| Hero containerWidth | Same rules as other sections (preset-driven). |
| Hero media | Rendered via CardCompound with heroMediaFill; structurally still a Card. |
| Full-bleed height | minHeight 100vh, no max clamp. |
| Full-bleed media | No background image mode; column layout only, no split. |
| Full-bleed text padding | Single inner padding on layout wrapper; no separate constrained text container. |

---

## Phase 2–5 Implementation Summary

**Phase 2 — Hero structure**
- SectionCompound now accepts `role` and `_effectiveLayoutPreset` (from engine).
- When `role === "hero"`: hero content is wrapped in a `.hero-inner` container with `data-hero-inner`; text width constrained with `maxWidth: min(100%, 42rem)`.
- Hero media no longer rendered through CardCompound when a media URL can be extracted: hero split uses a plain `<img>` with `object-fit: cover` and `max-height: min(70vh, 560px)` in the media column. Fallback: if no URL can be extracted, existing Card path with `heroMediaFill` is used.
- Modes: hero-centered (column, hero-inner); hero-split-image-left/right (two columns, media via img); hero-full-bleed-image (dedicated branch below).

**Phase 3 — Full-bleed safety**
- When `_effectiveLayoutPreset === "hero-full-bleed-image"` and a hero media URL exists: section renders a full-bleed block with `width: 100vw`, `position: relative`, `min-height: 420px`, `max-height: 70vh`; background layer = full-bleed image; overlay = `.hero-inner` with inner padding tokens (`var(--spacing-16) var(--spacing-6)` or from preset).
- Presets updated: `hero-full-bleed-image` uses `minHeight: 420px`, `maxHeight: 70vh` (no more `100vh` only).

**Phase 4 — Other sections**
- All branching is gated on `isHero` / `isFullBleedHero`. Non-hero sections use the same containerWidth and inner layout as before. Card children still render via CardCompound except for the hero media column when `isHero && heroMediaUrl` (media column shows img only).

**Phase 5 — Visual polish**
- Hero content column uses `gap: var(--spacing-6)` (others stay `var(--spacing-4)`). Hero-centered preset padding set to `var(--spacing-14) var(--spacing-6)` for slightly more vertical padding.

---

## Phase 6 — Verification Checklist

- [ ] **Preset dropdown:** Switching hero preset (hero-centered, hero-split-image-left, hero-split-image-right, hero-full-bleed-image) changes layout correctly (column vs row, media left/right, full-bleed background).
- [ ] **Other sections:** Features, gallery, pricing, etc. look unchanged; no “shifted” or “off” layout.
- [ ] **No card styling in hero media:** Hero media column shows only image (no card surface, radius, shadow); when hero has a Card child with media, that media is rendered as img in the hero media slot, not as a Card.
- [ ] **Full-bleed:** hero-full-bleed-image shows full-width background image with height clamped (420px–70vh) and text overlay with inner padding.
- [ ] **Container width:** Normal sections remain constrained; hero full-bleed has unconstrained media and constrained text in hero-inner.
