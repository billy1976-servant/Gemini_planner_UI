# Phase 1: Organ Structures Audit

**Classification:** REFERENCE — Organ structure audit; primary architecture reference: docs/SYSTEM_MASTER/

**Goal:** Identify how organs/molecules are composed (child elements, where structure is defined). Short list per organ.

---

## Where structure is defined

| Source | What it defines |
|--------|------------------|
| **Variant JSON** (`src/organs/<organ>/variants/*.json`) | Root `type: "Section"`, `role`, `layout` (object: type + params), `params.moleculeLayout` (optional), `children` (array of slots). |
| **SectionCompound** | Receives resolved node; passes `layout` (section layout id after engine) and `params` to `LayoutMoleculeRenderer`. |
| **LayoutMoleculeRenderer** (`section layout`) | Uses `layout` (section layout definition: containerWidth, split, backgroundVariant, moleculeLayout) and `params`; renders inner content via split grid, `SequenceAtom`, or `CollectionAtom` from `moleculeLayout`. |
| **Engine (json-renderer)** | For sections: replaces `node.layout` with section layout preset id; preserves `params.moleculeLayout`; does not derive layout from role. |

So: **internal arrangement** (row/column/grid, slot order) is currently encoded in (a) variant JSON `children` order and `layout`/`params.moleculeLayout`, and (b) section layout definition (moleculeLayout). The engine overwrites section-level `layout` with a section layout id; variant `params.moleculeLayout` can still reach SectionCompound/LayoutMoleculeRenderer.

---

## Per-organ summary

| Organ | Child elements (slots) | Internal structure (variants) |
|-------|-------------------------|-------------------------------|
| **hero** | `hero.title`, `hero.subtitle`, `hero.media`, `hero.cta` | Centered: column, title → subtitle → cta (no media). Split-left/split-right: row, content column (title, subtitle, cta) + media slot. Right-aligned, image-bg, full-screen, short, with-cta, video-ready: variants of column/row and slot set. |
| **header** | `header.logo`, `header.cta` | Row: logo + cta. All variants share same slots; differ by params (sticky, transparent, etc.). |
| **nav** | `nav.primary` | Single slot (links block). Row layout. |
| **footer** | `footer.primary` | Single slot. Grid (e.g. 4 columns) or column. |
| **content-section** | `content.title`, `content.body`, `content.media`, `content.block1`, `content.block2` | Text-only: column, title + body. Media-left: row, media then title+body column. Media-right: row, title+body column then media. Zigzag: column + moleculeLayout row, block1 + block2. |
| **features-grid** | `features.title`, `features.items` (or `features.cards`) | Column; inner moleculeLayout grid (2/3/4 columns). Title + items. |
| **gallery** | `gallery.title`, `gallery.items` | Column; inner moleculeLayout grid (2/3/4 cols). Title + items. |
| **testimonials** | `testimonials.title`, `testimonials.items` | Column; inner moleculeLayout grid (2/3 cols or single-featured). Title + items. |
| **pricing** | `pricing.title`, `pricing.primary` | Column; inner moleculeLayout grid (2/3/4 tiers). Title + primary. |
| **faq** | `faq.title`, `faq.primary` | Column. Title + primary (accordion/list/two-column). |
| **cta** | `cta.primary` | Single slot. Column (banner/strip) or split/full-width. |

---

## Capability-style summary (for Phase 2)

- **Hero:** media + text; placement: media left / media right / no media / background media.
- **Header:** logo + cta; row.
- **Nav:** single nav slot; row.
- **Footer:** primary block (multi-column or single); grid or column.
- **Content-section:** text + optional media; order: media-left, media-right, text-only; or zigzag blocks.
- **Features-grid:** title + repeated items; grid 2/3/4 or repeater.
- **Gallery:** title + items; grid 2/3/4 or carousel-ready.
- **Testimonials:** title + items; grid 2/3, single-featured, or carousel-ready.
- **Pricing:** title + tiers; grid 2/3/4 or minimal/highlighted.
- **FAQ:** title + items; accordion, list, or two-column.
- **CTA:** single primary block; banner, strip, split, full-width.

---

## Files referenced

- Organ variant roots: `src/organs/{hero,header,nav,footer,content-section,features-grid,gallery,testimonials,pricing,faq,cta}/variants/*.json`
- Manifests (slotSchema, variantIds): `src/organs/<organ>/manifest.json`
- Section compound: `src/compounds/ui/12-molecules/section.compound.tsx`
- Layout renderer: `src/layout/renderer/LayoutMoleculeRenderer.tsx`
- Resolver: `src/layout/resolver/layout-resolver.ts`
- Engine: `src/engine/core/json-renderer.tsx` (applyProfileToNode, section layout id injection)
- Registry: `src/organs/organ-registry.ts`, `src/organs/resolve-organs.ts`

Phase 1 complete. Next: Phase 2 — Define capability profiles in `src/layout-organ/organ-layout-profiles.json`.
