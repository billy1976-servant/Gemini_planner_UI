# Organ Capability → Layout Profile System

**Classification:** HISTORICAL — Organ layout phases done; current code in src/layout-organ.

Cursor task: Add Organ Capability → Layout Profile system (internal organ layout engine).

## Goal

Separate layout into two independent systems:

| System | Controls | Driven By |
|--------|----------|-----------|
| **Organ Layout Engine** | How parts inside an organ are arranged | Organ capabilities |
| **Section Layout Engine (layout-2)** | How an organ sits on the page | layout-2 IDs |

Organ layout ≠ Section layout.

## Phases

1. **Audit Organ Structures** — Identify how organs/molecules are composed (child elements, where structure is defined). Output a short list per organ (e.g. HeroOrgan → image + text; FeatureGrid → repeated card children).
2. **Define Capability Profiles** — Create `src/layout-organ/organ-layout-profiles.json` with capabilities and internal layout IDs per organ type. Internal organ layouts only, not section layouts.
3. **Organ Layout Resolver** — Create `src/layout-organ/organ-layout-resolver.ts`: given organ type (or detected capabilities), return valid internal layout IDs. Does not touch section layout.
4. **OrganCompound Integration** — Where organs render their internal structure: before rendering children, resolve internal layout and render child elements according to that profile (left/right, hidden button, input placement, media/text). Does not use layout-2.
5. **Keep Section Layout Untouched** — Confirm layout-2 still controls section placement; SectionCompound still uses layout-2; organ layout resolver does not affect SectionCompound.
6. **Testing Hooks (Temporary)** — Expose available internal layout options for dev testing only. Do not mix with section layout dropdown.

## Do Not

- Modify logic engines
- Modify section layout system
- Hardcode layout into screen JSON
- Merge organ layout with section layout

## Status

- Phase 1: **Done** — Audit in `src/cursor/layout/organ-structures-audit.md`.
- Phase 2: **Done** — `src/layout-organ/organ-layout-profiles.json` (capabilities + internal layout IDs per organ).
- Phase 3: **Done** — `src/layout-organ/organ-layout-resolver.ts` (getInternalLayoutIds, resolveInternalLayoutId, etc.).
- Phase 4: **Done** — SectionCompound uses organ layout resolver when `role` is an organ: inner moleculeLayout from variant (via resolveInternalLayoutId + loadOrganVariant); section placement still from layout-2. `resolve-organs` sets `params.internalLayoutId` on expanded organs.
- Phase 5: **Done** — layout-2 still controls section placement (containerWidth, split, backgroundVariant); organ layout only overrides moleculeLayout for organs.
- Phase 6: **Done** — `getInternalLayoutOptionsForDev()` in `@/layout-organ` for dev-only internal layout dropdown; do not mix with section layout dropdown.
