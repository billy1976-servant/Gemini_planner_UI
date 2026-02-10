# Layout System Audit Report

**Date:** 2025-02-10  
**Objective:** Clean and normalize the layout system — one definition per layout id, no duplicate tiles in UI.

---

## 1. Master Index (post-cleanup)

### Section layouts (page layouts)

**Source:** `src/04_Presentation/layout/data/layout-definitions.json` → `pageLayouts`

| Id | containerWidth |
|----|----------------|
| hero-centered | wide |
| hero-split | full |
| hero-split-image-right | full |
| hero-split-image-left | full |
| hero-full-bleed-image | full |
| content-narrow | narrow |
| content-stack | contained |
| image-left-text-right | contained |
| features-grid-3 | contained |
| testimonial-band | contained |
| cta-centered | contained |
| test-extensible | contained |

**Count:** 12 section layout ids.

### Component layouts (section-inner)

**Source:** `src/04_Presentation/layout/data/layout-definitions.json` → `componentLayouts`

Ids: same as section except `test-extensible` (page-only). **Count:** 11.

### Card layouts

**Source:** `src/04_Presentation/layout/data/card-layout-presets.json`

| Id |
|----|
| image-top |
| image-left |
| image-right |
| image-bottom |
| centered-card |
| centered-image-left |
| centered-image-right |
| media-dominant-top |
| media-dominant-left |
| text-dominant-top |
| text-dominant-left |
| minimal |

**Count:** 12 card layout ids. No duplicates found.

### Template layouts

**Source:** `src/04_Presentation/layout/data/layout-definitions.json` → `templates`

| Template id | Slots (role → layout id) |
|-------------|--------------------------|
| startup-template | hero → hero-split, features → features-grid-3, content → content-stack |

**Count:** 1 template. References canonical section ids only.

### Internal / organ layouts

**Source:** `src/04_Presentation/layout-organ/organ-layout-profiles.json`

Per-organ `internalLayoutIds` (e.g. hero: centered, image-bg, split-left…; cta: banner, strip, split, full-width). Scoped by organ; no cross-organ duplicate id requirement. **Not merged with section layouts.**

---

## 2. Duplicates found and resolved

### Section layout duplicate: `feature-grid-3` vs `features-grid-3`

- **Type:** Exact same layout (grid, 3 columns, contained) under two ids.
- **Canonical id kept:** `features-grid-3` (used in templates, layout-labels, section-card-capabilities).
- **Id removed:** `feature-grid-3`.

### Other checks

- **Card layouts:** No duplicate ids in `card-layout-presets.json`.
- **Organ internal:** Ids are per-organ; same string in different organs (e.g. `grid-3` for gallery vs testimonials) is intentional.
- **Aliases:** No other alias-style duplicates (e.g. grid-3 / grid3 / three-grid) found in section or card definitions.

---

## 3. Files cleaned

| File | Change |
|------|--------|
| `src/04_Presentation/layout/data/layout-definitions.json` | Removed `feature-grid-3` from `pageLayouts` and `componentLayouts`. |
| `src/04_Presentation/layout/requirements/layout-requirements.json` | Removed `feature-grid-3` from `section.layoutRequirements`. |
| `src/04_Presentation/layout/page/capabilities.ts` | Removed `feature-grid-3` from `SECTION_TO_CARD_CAPABILITIES`. |
| `src/04_Presentation/components/organs/OrganPanel.tsx` | Removed `feature-grid-3` from `SECTION_LAYOUT_ORDER`. |
| `src/app/ui/control-dock/layout/LayoutThumbnailShowcase.tsx` | Removed `feature-grid-3` from `ALL_LAYOUT_IDS`. |
| `src/app/ui/control-dock/layout/LayoutThumbnail.tsx` | Removed `feature-grid-3` blueprint entry. |
| `src/app/ui/layoutThumbnailRegistry.ts` | Removed `feature-grid-3` from `SECTION_LAYOUT_THUMBNAILS`. |
| `src/app/ui/control-dock/layout/LAYOUT_REFERENCE.md` | Removed `feature-grid-3` section and table alias. |
| `src/app/ui/control-dock/layout/LAYOUT_THUMBNAILS.md` | Removed `feature-grid-3` bullet. |

**Not changed:** `src/04_Presentation/layout/data/layout-labels.json` (already only had `features-grid-3` for section).  
**Not changed:** `src/04_Presentation/layout/data/section-card-capabilities.json` (already only had `features-grid-3`).

---

## 4. Ids removed

| Id | Reason |
|----|--------|
| feature-grid-3 | Duplicate of `features-grid-3`; same definition in pageLayouts and componentLayouts. |

---

## 5. Registries / resolvers updated

| Location | Change |
|----------|--------|
| `src/04_Presentation/layout/page/page-layout-resolver.ts` | `getPageLayoutIds()` now returns `[...new Set(Object.keys(pageLayouts))]` so layout lists are unique by id. |
| `src/04_Presentation/layout/component/component-layout-resolver.ts` | `getComponentLayoutIds()` now returns `[...new Set(Object.keys(componentLayouts))]`. |
| `src/04_Presentation/layout-organ/organ-layout-resolver.ts` | `getInternalLayoutIds(organId)` now returns `[...new Set(ids)]` for the given organ’s list. |

No other registry merges layout lists; section, card, and organ sources remain separate.

---

## 6. What was not changed

- Rendering engines (e.g. JsonRenderer, LayoutMoleculeRenderer).
- `OrganPanel.tsx` logic (only the section layout order array was normalized to match the registry).
- `LayoutTilePicker.tsx`.
- Section compound or section behavior.
- Organ internal layout definitions or organ-scoped ids.

---

## 7. Final layout counts

| Category | Count | Source |
|----------|-------|--------|
| Section (page) layouts | 12 | layout-definitions.json → pageLayouts |
| Component (section-inner) layouts | 11 | layout-definitions.json → componentLayouts |
| Card layouts | 12 | card-layout-presets.json |
| Templates | 1 | layout-definitions.json → templates |
| Organ types with internal layouts | 11 | organ-layout-profiles.json → organs |

**Result:** One definition per section layout id; no duplicate tiles in the section layout UI; canonical id `features-grid-3` only.
