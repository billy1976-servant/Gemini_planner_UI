# Organs Layer — JSON-Driven UI Sections

Organs are **section-scale compositions** of existing compounds only. They are configured entirely by JSON variants and never introduce new UI primitives or modify atoms/compounds.

## Manifest schema

Each organ lives in `src/organs/<organId>/` with:

- **`manifest.json`** — Organ metadata. Schema:

| Field        | Type     | Required | Description |
|-------------|----------|----------|-------------|
| `id`        | string   | yes      | Organ identifier (e.g. `header`, `hero`). |
| `label`     | string   | yes      | Human-readable label. |
| `slotSchema`| string[] | no       | Slot paths this organ accepts for override (e.g. `header.logo`, `hero.cta`). |
| `variantIds`| string[] | yes      | **Authoritative** list of variant IDs. Every ID must have a corresponding `variants/<variantId>.json` and an entry in `organ-registry.ts`. |

- **`variants/<variantId>.json`** — One file per variant. Each file is a single **root node** (see Variant JSON contract below).

## Variant JSON contract

- **Root**: One node (usually `Section` or `Row`/`Column`) with optional `id`, `type`, `role`, `layout`, `params`, `content`, `children`.
- **Allowed `type` values**: Only types that exist in the JsonRenderer **Registry** (no custom types). Allowed values include:
  - **Layout**: `Section`, `Row`, `Column`, `Grid`, `Stack`, `Page`
  - **Molecules**: `Button`, `Card`, `Avatar`, `Chip`, `Field`, `Footer`, `List`, `Modal`, `Stepper`, `Toast`, `Toolbar`, `Navigation`, `PricingTable`, `FAQ`, `CTABanner`, `ImageGallery`, `IconTextRow`
  - **Atoms**: `text`, `Media`, `Surface`, `Sequence`, `Trigger`, `Collection`, `Condition`, `Shell`
  - **Slot placeholder**: `slot` (resolved by applySkinBindings; not a Registry component)
- **No business logic**: Variant JSON is structure and layout/content defaults only. Behavior stays in molecule components and the existing behavior system.
- **Layout**: Use existing layout engine (row/column/grid/stack). Set `layout: { type, params }` on nodes; the molecule-layout-resolver and template profiles apply as usual.

## Pipeline

1. Skin JSON may contain nodes with `type: "organ"`, `organId`, `variant` (and optional `layout`/`params`/`content` overrides).
2. **expandOrgansInDocument** runs before applySkinBindings: each organ node is replaced by the loaded variant tree (with overrides merged).
3. **applySkinBindings** resolves `type: "slot"` nodes from data.
4. JsonRenderer sees only compound/layout nodes (no `organ` type).

## Validation

Run the variant validator to ensure every organ variant JSON uses only allowed types (Registry + `slot`):

```bash
npm run test:organs:layer7
```

Or run the validator directly (see `validate-variants.ts`).

## Organs and variant counts

| Organ            | Variant count | Notes |
|------------------|---------------|--------|
| header           | 12            | Sticky, transparent, minimal, centered, mega-ready, etc. |
| hero             | 9             | Centered, image-bg, split, full-screen, video-ready, etc. |
| nav              | 4             | Default, dropdown, mobile-collapse, centered-links |
| footer           | 5             | Multi-column, minimal, with-newsletter, centered, dense |
| content-section  | 4             | Text-only, media-left, media-right, zigzag |
| features-grid    | 4             | 2/3/4-col, repeater |
| gallery          | 4             | grid-2/3/4, carousel-ready |
| testimonials     | 4             | grid-2/3, single-featured, carousel-ready |
| pricing          | 5             | 2/3/4-tier, highlighted, minimal |
| faq              | 3             | Accordion, list, two-column |
| cta              | 4             | Banner, strip, split, full-width |
