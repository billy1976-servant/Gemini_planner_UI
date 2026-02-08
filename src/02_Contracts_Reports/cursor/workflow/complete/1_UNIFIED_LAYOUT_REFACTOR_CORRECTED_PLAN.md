Primary Architecture Reference: docs/SYSTEM_MASTER/

# Unified Layout System Refactor — Corrected Plan

**Classification:** REFERENCE — Corrected layout scope (page + component); aligns with current src/layout. Archived to workflow complete.

**Domain:** Layout  
**Status:** Complete  
**Workflow:** Complete

**Output title:** Unified Layout System Refactor — Corrected Plan  
**Mode:** Plan only — do NOT write code or create folders yet. This is a planning correction.

---

## Abandoned direction (do not use)

- **Do not** create or use `src/layout-organ/`
- **Do not** use `organ-layout-profiles.json`, organ-layout-resolver, or any "organ capability layout" files or plans
- Those belong to an abandoned parallel system and must not be used

---

## Correct architecture: one layout domain, two layers

We are implementing a **Unified Layout System** with **two** layout layers inside the **same** layout domain:

| Layer | Controls | Lives in |
|-------|----------|----------|
| **1. Page Layout (Section Placement)** | Section container width, section background/surface, section outer split (full-width, centered, etc.) | `src/layout/page/` |
| **2. Component Layout (Internal Arrangement)** | How content is arranged inside a section or molecule (left/right, stacked, grid columns, button position, media position, etc.) | `src/layout/component/` |

**Critical rules:**

- Do not create layout-organ or organ-specific layout systems
- **Organs, molecules, and cards all use the same component layout system**
- There is **one** layout domain, with `page/` and `component/` subfolders only

---

## Audit: where layout logic exists today

### A. Page layout logic (section placement)

**Location:** Today this is the **section layout** system and its consumers.

| Location | What it does |
|----------|--------------|
| **layout/page/layout-resolver.ts** | resolveLayout(id or template+slot) → full definition; getLayout2Ids(); getDefaultSectionLayoutId() |
| **layout/page/page-layouts.json** | Definitions keyed by layout id. Each entry currently has: containerWidth, split, backgroundVariant, **and moleculeLayout** (mixed; moleculeLayout is internal arrangement and will move to component) |
| **layout/page/LayoutMoleculeRenderer.tsx** | Renders section: applies container width, surface, split, backgroundVariant; **also** reads moleculeLayout from the same definition and drives inner content (mixed responsibility) |
| **layout/page/section-helpers.ts** | collectSectionKeysAndNodes, collectSectionLabels (section list for OrganPanel / page) |
| **layout/page/capabilities.ts** | Section layout id → allowed card preset ids (page/component boundary) |
| **layout/page/templates.json** | Template id → slot → layout id (page layout selection) |
| **layout/index.ts** | Public API for section layout |
| **compounds/ui/12-molecules/section.compound.tsx** | resolveLayout(layout), passes result to LayoutMoleculeRenderer |
| **engine/core/json-renderer.tsx** | applyProfileToNode: sets section `layout` (single section layout id) from override / node.layout / template default; strips layout keys from section params |
| **organs/OrganPanel.tsx** | Section Layout dropdown (section layout ids); Card Layout dropdown (component layout, but driven per section) |
| **dev/section-layout-dropdown.tsx** | Dev-only section layout (section layout ids) |
| **state/section-layout-preset-store.ts** | Persists section layout + card layout overrides by screenId + sectionKey |
| **lib/layout/profile-resolver.ts** | resolveProfileLayout(profileId, role) → layout id; feeds into resolveLayout (section layout) |
| **lib/layout/template-profiles.ts** | defaultSectionLayoutId, sections (role → layout id); used for template defaults |

**Summary:** Page layout = "which layout id does this section use?" and "what container width / surface / split does that id imply?". Today that lives in section layout; after refactor it lives in `src/layout/page/`.

---

### B. Internal (component / molecule) layout logic

**Location:** Today this is mixed across section layout definitions, lib/layout molecule resolver, card presets, organ variant JSON, and compounds.

| Location | What it does |
|----------|--------------|
| **layout/page/page-layouts.json** | Each layout id includes **moleculeLayout** (type, params) — inner flex/grid/split for the section. This is internal arrangement, not section placement. |
| **layout/page/LayoutMoleculeRenderer.tsx** | Calls resolveMoleculeLayout(moleculeLayout) and uses it for section inner content (grid, column, row, split media left/right). |
| **lib/layout/molecule-layout-resolver.ts** | resolveMoleculeLayout(flow, preset, params) → CSS-like layout params; uses definitions-molecule (column, row, grid, stacked). |
| **lib/layout/definitions-molecule/** | layout-column.json, layout-row.json, layout-grid.json, layout-stacked.json — flow definitions and presets. |
| **lib/layout/card-layout-presets.ts** | Preset id → mediaPosition, contentAlign (card-internal layout: image left/right/top/bottom, text align). |
| **lib/layout/card-preset-resolver.ts** | Card surface/title/body by preset id (visual; card layout is in card-layout-presets). |
| **layout/page/capabilities.ts** | Section layout id → allowed card preset ids (constrains which component layouts are valid for Cards in that section). |
| **engine/core/json-renderer.tsx** | Strips section params.moleculeLayout in applyProfileToNode; later merges section preset layout into moleculeLayout.params for Section; applies card layout preset (mediaPosition, contentAlign) to Card children per section. |
| **compounds/ui/12-molecules/*.tsx** | Button, modal, footer, field, chip, avatar, stepper, toolbar, toast, card, list: each reads params.moleculeLayout and calls resolveMoleculeLayout for inner arrangement. Card also uses mediaPosition/contentAlign (component layout). |
| **organs/*/variants/*.json** | Each variant defines **layout** (row/column) and **params.moleculeLayout** (type, params) and **children** (slot order). This is implicit "internal arrangement" per organ variant. After refactor: organs use the same component layout system; variant can imply a component layout id or default, not a separate organ-only system. |

**Summary:** Internal arrangement = "how are children laid out inside this section/molecule/card?". Today it is: moleculeLayout in section layout defs, molecule-layout-resolver + definitions-molecule, card-layout-presets, and organ variant layout/moleculeLayout. After refactor it all lives under `src/layout/component/` and is the **same** system for sections, organs, molecules, and cards.

---

## Migration plan (high level)

### 1. Move section placement logic → `src/layout/page/`

- Create `src/layout/page/` (when implementing; not in this plan step).
- Move section layout's **page-only** responsibilities into it:
  - **page-layout-resolver.ts** from layout-resolver.ts (resolve by id or template+slot; getLayout2Ids, getDefaultSectionLayoutId).
  - **page-layouts.json** from layouts.json with **only** section-level fields: containerWidth, split, backgroundVariant. **Remove moleculeLayout** from page definitions; inner arrangement will come from component layout.
- Move section-helpers, templates (or equivalent), and page-level capabilities (e.g. section layout id → allowed card layout ids) into page or a single place under layout.
- LayoutMoleculeRenderer (or equivalent) receives **page definition** (container, surface, split only) and **component layout** (inner arrangement) from the component system; it no longer reads moleculeLayout from the page definition.
- Update all imports from `@/section layout` to `@/layout/page` (or a barrel). Optionally keep a re-export barrel under layout for a transition period.

### 2. Move inner arrangement logic → `src/layout/component/`

- Create `src/layout/component/` (when implementing).
- **component-layouts.json**: Internal layout definitions (flow type, params, and optionally split/mediaSlot). Source: (1) moleculeLayout data extracted from current layout/page/layouts.json, (2) patterns from organ variants, (3) card layout presets (mediaPosition, contentAlign) as component layout ids for type "card".
- **component-layout-resolver.ts**: Resolves a component layout id (and optionally component type / context) to a single definition. Used by Section (via LayoutMoleculeRenderer), by molecules (Button, Card, List, etc.), and by organ-rendered sections. **One** resolver for all; no organ-specific resolver.
- Move or reference **molecule-layout-resolver** and **definitions-molecule** under component (or keep in lib/layout and have component resolver call into them).
- Move **card-layout-presets** (and card layout capability mapping) into component layout system so Card uses the same component layout ids and resolver.
- **LayoutMoleculeRenderer**: Gets inner arrangement by calling the **component** layout resolver (e.g. by section role or default), not from the page definition.

### 3. Remove organ-specific layout concepts

- Do **not** introduce organ-layout-profiles, organ-layout-resolver, or organ-only layout namespaces.
- Organ variants may still define **which** component layout id is the default for that variant (e.g. variant "split-left" → component layout id "hero-split-left"), but that is a mapping into the **single** component layout system, not a separate organ layout engine.
- Section role (or organ id derived from role) can be an **input** to the component layout resolver (e.g. "for role=hero, default component layout is hero-split") so screen JSON stays role-driven and deterministic. No new screen JSON fields for "organ layout" or "component layout"; derived from role/type and overrides (e.g. OrganPanel card layout) only.

### 4. Keep screen JSON role-driven and deterministic

- Section nodes keep: role, optional explicit layout id (page layout), and content/slots. No "organ layout" or "component layout" field in screen JSON.
- Page layout id for a section: from OrganPanel override, explicit node.layout, or template default (unchanged).
- Component layout for a section: resolved by component-layout-resolver from section role (and/or from current variant if organs are expanded) so behavior remains deterministic and role-driven.
- Card layout for cards inside a section: from OrganPanel card layout override or default allowed for that section's page layout; still applied as today but sourced from the unified component layout system.

---

## Target structure (reference only; do not create yet)

```
src/layout/
  page/
    page-layouts.json        ← section-level only (containerWidth, split, backgroundVariant)
    page-layout-resolver.ts
    section-helpers.ts      ← or keep name
    templates.json
    capabilities.ts         ← section layout id → allowed card layout ids (page/component boundary)
  component/
    component-layouts.json  ← internal layout definitions (sections, molecules, cards; one namespace)
    component-layout-resolver.ts
    definitions-molecule/   ← or reference lib/layout
    molecule-layout-resolver.ts  ← or move from lib/layout
    card-layout-presets.ts ← card layout is one kind of component layout
```

Existing **section layout** folder is retired or becomes a thin re-export from `layout/page`. No **layout-organ** or organ-only layout module.

---

## Summary

| Action | Target |
|--------|--------|
| Page layout (section placement) | Move from section layout → `src/layout/page/`; strip moleculeLayout from page definitions |
| Internal arrangement (sections, organs, molecules, cards) | Move to single `src/layout/component/`; one resolver, one namespace |
| Organ-specific layout | Remove; organs use the same component layout system |
| Screen JSON | Unchanged; role-driven; no new layout fields |

**End of corrected plan. No code or folder creation in this step.**

---

## Change Log

- [2026-02-04] Archived to workflow complete; moved to src/cursor/layout/complete/. Labeled per RULES.md: Domain Layout, Status Complete, Workflow Complete.
