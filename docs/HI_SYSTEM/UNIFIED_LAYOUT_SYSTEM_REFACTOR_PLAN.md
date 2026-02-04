# Unified Layout System Refactor Plan

**Classification:** HISTORICAL — Superseded by UNIFIED_LAYOUT_SYSTEM_REFACTOR_CORRECTED_PLAN and current code (src/layout).

**Output title:** Unified Layout System Refactor Plan  
**Mode:** Plan only — do NOT implement or modify code yet.

---

## Rule

There is **one** layout system, split into **two** scopes:

| Scope | Controls | Does not control |
|-------|----------|-------------------|
| **Page Layout** | How sections sit on the screen (container width, surface, split, stacking) | Arrangement of children inside a section/organ/molecule |
| **Component Layout** | How elements arrange inside a section, organ, or molecule (hero image left/right, card icon left/top, track input+button, etc.) | Where the section sits on the page |

---

## Target folder structure

```
src/layout/
  page/
    page-layouts.json      ← section-level definitions only
    page-layout-resolver.ts
  component/
    component-layouts.json ← internal layout definitions (by type/capability)
    component-layout-resolver.ts
```

No new layout types are added; existing responsibilities are reorganized into these two scopes.

---

# PHASE 1 — Audit (no code changes)

## 1. Files responsible for section/page layout (map to layout-2)

These should move under `src/layout/page/` or stay as consumers of it.

| File | Responsibility |
|------|----------------|
| **layout/resolver/layout-resolver.ts** | Resolves layout id (or template+slot) to full definition; getLayout2Ids, getDefaultSectionLayoutId |
| **layout/page/page-layouts.json** | Section layout definitions: containerWidth, split, backgroundVariant, and currently **moleculeLayout** (to be scoped to page-only; inner arrangement moves to component) |
| **layout/page/LayoutMoleculeRenderer.tsx** | Renders section using resolved definition; applies container width, surface, split, and **uses moleculeLayout** for inner content (today mixed; after refactor: page layout passes container/surface/split only; component layout drives inner arrangement) |
| **layout/page/section-helpers.ts** | collectSectionKeysAndNodes, collectSectionLabels — used by OrganPanel and page.tsx for section list |
| **layout/page/capabilities.ts** | Section layout id → allowed card preset ids (card layout is component-level; the *mapping* from section layout to allowed card presets stays page-side or moves to component as “allowed per section type”) |
| **layout/page/templates.json** | Template id → slot → layout id (page layout selection) |
| **layout/index.ts** | Public API for layout (section layout) |
| **compounds/ui/12-molecules/section.compound.tsx** | Consumes layout-2: resolveLayout(layout), LayoutMoleculeRenderer |
| **engine/core/json-renderer.tsx** | applyProfileToNode: sets section `layout` (section layout id) from override / node.layout / template default; strips layout keys from section params |
| **organs/OrganPanel.tsx** | Section Layout dropdown (section layout ids); Card Layout dropdown (component-level, but driven per section) |
| **dev/section-layout-dropdown.tsx** | Dev-only section layout (layout-2) |
| **state/section-layout-preset-store.ts** | Persists section layout preset and card layout preset overrides by screenId + sectionKey |
| **lib/layout/profile-resolver.ts** | getExperienceProfile, resolveProfileLayout(profileId, role) → layout id; “feeds directly into resolveLayout() from @/layout” |
| **lib/layout/template-profiles.ts** | TemplateProfile: defaultSectionLayoutId, sections (role → layout), containerWidth, etc.; used for default section layout id and template defaults |

**Summary:** Page layout is driven by layout-2 (layout id → definition). Section gets one layout id; that id currently points to a definition that includes both section-level (containerWidth, split, backgroundVariant) and inner (moleculeLayout). Refactor will separate: page definition = section-level only; inner arrangement = component layout.

---

## 2. Files influencing internal arrangement (organs, molecules, compounds)

These will be formalized under `src/layout/component/` or stay as consumers of the component layout resolver.

### 2a. Molecule layout (flow + params)

| File | Responsibility |
|------|----------------|
| **lib/layout/molecule-layout-resolver.ts** | resolveMoleculeLayout(flow, preset, params) → CSS-like layout params; uses definitions-molecule (column, row, grid, stacked) |
| **lib/layout/definitions-molecule/** | layout-column.json, layout-row.json, layout-grid.json, layout-stacked.json — flow definitions and presets |
| **layout/renderer/LayoutMoleculeRenderer.tsx** | Calls resolveMoleculeLayout(moleculeLayout?.type, moleculeLayout?.preset, params) to render section inner content (grid, flex column/row); also handles split (media left/right) |
| **layout/page/page-layouts.json** | Each entry has **moleculeLayout** (type, params) — currently source of inner arrangement for sections; will become component layout concern keyed by section/component type |

### 2b. Compounds using moleculeLayout

Each of these reads `params.moleculeLayout` and calls `resolveMoleculeLayout` for inner arrangement:

- **compounds/ui/12-molecules/button.compound.tsx**
- **compounds/ui/12-molecules/modal.compound.tsx**
- **compounds/ui/12-molecules/footer.compound.tsx**
- **compounds/ui/12-molecules/field.compound.tsx**
- **compounds/ui/12-molecules/chip.compound.tsx**
- **compounds/ui/12-molecules/avatar.compound.tsx**
- **compounds/ui/12-molecules/stepper.compound.tsx**
- **compounds/ui/12-molecules/toolbar.compound.tsx**
- **compounds/ui/12-molecules/toast.compound.tsx**
- **compounds/ui/12-molecules/card.compound.tsx** (mediaPosition, contentAlign + moleculeLayout for gap/padding)
- **compounds/ui/12-molecules/list.compound.tsx**
- **compounds/ui/12-molecules/section.compound.tsx** (params type declares moleculeLayout; actual usage is via LayoutMoleculeRenderer)

### 2c. Card layout (component-level)

| File | Responsibility |
|------|----------------|
| **lib/layout/card-layout-presets.ts** | Preset id → mediaPosition, contentAlign (card-internal layout) |
| **lib/layout/card-preset-resolver.ts** | Card surface/title/body by preset id (visual preset, not layout) |
| **layout/page/capabilities.ts** | Section layout id → allowed card preset ids (coupling page layout to allowed component layouts; can move to component with “allowed card layouts per section type”) |
| **engine/core/json-renderer.tsx** | Applies card layout preset (mediaPosition, contentAlign) to Card children per section when cardLayoutPresetOverrides set; repeater mode applies card preset to item Cards |

Card compound uses **mediaPosition** and **contentAlign** to arrange media vs text (left/right/top/bottom, alignment). This is component layout.

### 2d. Organ variant JSON (structure patterns)

Organ variants define internal structure via **layout** and **params.moleculeLayout** and **children** (slot order):

- **organs/hero/variants/*.json** — layout row/column, moleculeLayout column/grid, slots: title, subtitle, cta, media
- **organs/content-section/variants/*.json** — media-left, media-right, zigzag (media + title + body order)
- **organs/features-grid/variants/*.json**, **gallery**, **pricing**, **testimonials**, **faq**, **cta**, **header**, **footer**, **nav** — same pattern: layout + moleculeLayout + slots

These are the “implicit” component layouts: variant id implies an internal arrangement. Formalizing means: component layout ids are derived from organ/molecule type (and optionally variant), not manually chosen in screen JSON.

### 2e. Other lib/layout that touches “internal” layout

| File | Note |
|------|------|
| **lib/layout/visual-preset-resolver.ts** | getVisualPresetForMolecule — used by json-renderer for template visual overlay; can include layout (gap/padding) for section; component-scope |
| **lib/layout/spacing-scale-resolver.ts** | getSpacingForScale — section spacing overlay; can stay or move under component when keyed by type |
| **lib/layout/layout-bridge.tsx** | useSectionLayout — uses resolveProfileLayout + resolveMoleculeLayout; currently unused in main app; mixes profile (page) with molecule (component) |
| **lib/site-renderer/renderFromSchema.tsx** | resolveProfileLayout, resolveMoleculeLayout, resolveScreenLayout — alternate render path |

**Summary:** Component layout is currently: (1) moleculeLayout in layout/page definitions and in variant JSON, (2) resolveMoleculeLayout + definitions-molecule used by Section (via LayoutMoleculeRenderer) and by all molecules above, (3) card-layout-presets + mediaPosition/contentAlign for Card, (4) variant JSON structure (slot order + layout type). None of this should control section container width or section stacking; that stays page layout.

---

# PHASE 2 — Refactor plan (no code yet)

## Step 1: Section layout in `src/layout/page/`

1. Create **src/layout/page/**.
2. Move **layout/page/layout-resolver.ts** → **layout/page/page-layout-resolver.ts** (rename symbols if desired: e.g. resolveLayout → resolvePageLayout; getLayout2Ids → getPageLayoutIds; keep LayoutDefinition type).
3. Move **layout/page/layouts.json** → **layout/page/page-layouts.json**.
4. Move **layout/page/templates.json** into **layout/page/** (e.g. templates.json or part of page config).
5. Move **layout/page/section-helpers.ts** into **layout/page/** (section keys/labels are page-level concepts).
6. Move **layout/page/capabilities.ts** into **layout/page/** (section layout → allowed card presets is page/component boundary; can stay here as “page capabilities” or move to component in a later step).
7. **LayoutMoleculeRenderer**: move to **layout/page/** (or keep under layout-2 until step 2 is done). It will be updated so it receives **page** layout (containerWidth, surface, split, backgroundVariant) from page resolver and **component** layout (inner arrangement) from component resolver.
8. **layout/page/index.ts**: Replace with re-exports from **src/layout/page/** (or a thin **src/layout/index.ts**) so existing imports `@/layout` continue to work during migration. Alternatively, update all import paths to `@/layout/page` and use @/layout only (layout-2 removed).
9. Update every file that imports from `@/layout` to import from `@/layout/page` (or keep layout-2 as a re-export barrel for minimal churn).

**Page layout definition (page-layouts.json) after refactor:**  
Each entry should contain only section-level fields: **containerWidth**, **split**, **backgroundVariant**. Remove **moleculeLayout** from page-layouts.json and source inner arrangement from component layout (see step 2).

---

## Step 2: Introduce `src/layout/component/` for internal layouts

1. Create **src/layout/component/**.
2. **component-layouts.json**  
   - Define internal layout definitions keyed by **component layout id** (e.g. hero-split, hero-stacked, content-media-left, card-image-left, grid-2, grid-3).  
   - Each definition: layout flow (column/row/grid/stacked), params (gap, columns, align, etc.), and optionally split (mediaSlot left/right) for section-like content.  
   - This can be the current moleculeLayout-shaped data extracted from layout/page/page-layouts.json plus organ variant patterns, normalized to a single namespace.
3. **component-layout-resolver.ts**  
   - **getComponentLayoutIds(componentType)** — return valid internal layout ids for that type (e.g. hero → [hero-split, hero-stacked, hero-overlay]; card → [image-top, image-left, …]; features-grid → [grid-2, grid-3, grid-4]).  
   - **resolveComponentLayout(componentType, componentLayoutId?)** — return the definition to use. If no id given, return default for that type (e.g. first in list or a designated default).  
   - Component type = section role (hero, content, features, …), or molecule type (Card, Button, …), or organ id. Use same role→organ mapping as section-helpers where needed.
4. Move **lib/layout/molecule-layout-resolver.ts** and **lib/layout/definitions-molecule/** under **layout/component/** (or keep under lib/layout and have component-layout-resolver call into them). Component layout definitions in component-layouts.json can reference flow + params that molecule-layout-resolver understands.
5. Move **lib/layout/card-layout-presets.ts** (and optionally card-preset-resolver if visual-only) under **layout/component/** as the Card component layout source; card presets are component layout ids for type “card”.
6. **layout/page/capabilities.ts** (section layout → allowed card presets): move to **layout/page** as page capability, or to **layout/component** as “allowed component layout ids per page layout id”. Prefer component: “for section layout X, allowed card layout ids are […]” so component layout system owns the list; page only holds section layout id.

**Determination of internal layout id (no manual choice in screen JSON):**

- **Sections/organs:** Resolved by **section role** (or organ id): e.g. role=hero → default component layout “hero-split” or from template/profile. Optionally, template profile or a small “section role → default component layout id” map in component or page config. Do not add a new field in screen JSON for this; keep screen JSON role-driven.
- **Molecules (Card, etc.):** For Card, component layout id can come from (1) per-section card layout preset override (OrganPanel), (2) section’s allowed card layouts and default. So “component type = card” + “parent section” → resolve to one of the allowed card layout ids (preset override or default).
- **Other molecules:** Default from component type (e.g. Button → single default layout; List → list layout). No screen JSON field for internal layout id; derived from type (and parent section for Card).

---

## Step 3: Separate page vs component in render path

1. **SectionCompound**  
   - Receives section `layout` (page layout id). Call **page-layout-resolver** to get page definition (containerWidth, split, backgroundVariant only).  
   - Resolve **component** layout for this section: **resolveComponentLayout(role)** (or organ id from role) → inner arrangement definition.  
   - Pass both to **LayoutMoleculeRenderer**: page definition for container/surface/split, component definition for inner flex/grid and media slot order.
2. **LayoutMoleculeRenderer**  
   - Accept two inputs: (a) page layout definition (containerWidth, surface, backgroundVariant, split), (b) component layout definition (moleculeLayout-like: type, params, split.mediaSlot).  
   - Use (a) for outer wrapper and surface; use (b) for resolveMoleculeLayout and partitionChildren (split).  
   - No longer read moleculeLayout from the single page definition; read from component resolver.
3. **json-renderer**  
   - Keep applying only **page** layout id to section nodes (override, node.layout, template default). Do not write component layout id to node; component layout is resolved at render time from role/type.  
   - Card layout preset override remains per-section; it selects which **component** layout id (card preset) applies to Cards in that section; apply mediaPosition/contentAlign from component-layout (card presets) as today.
4. **Organ variant JSON**  
   - Variants can continue to specify layout/moleculeLayout for default appearance; at render time, **component-layout-resolver** can use organ id + variant (or role) to return the same shape. Alternatively, variant JSON remains the source of “default” component layout for that organ until component-layouts.json fully replaces it; then variant JSON only holds slot keys and content, not layout.

---

## Step 4: Guarantees

- **Page layout never controls component layout:** Page layout id only selects container width, surface, split at section level. It does not pass moleculeLayout to the section content; component layout is resolved separately by role/type.
- **Component layout never controls page layout:** Component layout resolver does not receive or return page layout ids. It only returns inner arrangement (flow, params, mediaSlot). Section’s position on the page and container width come only from page-layout-resolver.
- **Screen JSON stays clean and role-driven:** Screen JSON has section role and optional section layout id (page). No new field for “component layout id”; that is derived from type/role and (for Card) from per-section card preset override.

---

## Step 5: Optional consolidation under `src/layout/`

- Add **src/layout/index.ts** that re-exports:
  - From **layout/page**: resolvePageLayout, getPageLayoutIds, LayoutMoleculeRenderer, section helpers, templates, capabilities.
  - From **layout/component**: resolveComponentLayout, getComponentLayoutIds, getCardLayoutPreset, molecule-layout-resolver (if moved).
- **layout-2** folder has been removed; all imports use **layout** (layout/page and layout/component).

---

## Files to touch (summary)

- **Section layout:** Implemented in layout/page/ and layout/resolver/; no layout-2 folder. Use `@/layout` for resolution and renderer.
- **Create:** layout/component (component-layouts.json, component-layout-resolver.ts); move or reference molecule-layout-resolver, definitions-molecule, card-layout-presets.
- **Update imports:** section.compound.tsx, json-renderer.tsx, OrganPanel.tsx, page.tsx, dev/section-layout-dropdown.tsx, profile-resolver.ts, template-profiles.ts, layout-store.ts, SiteSkin.tsx, registry (if it imports layout molecules), and any other file importing from @/layout or @/lib/layout for layout resolution.
- **Update behavior:** LayoutMoleculeRenderer to take page definition + component definition; SectionCompound to call both resolvers; applyProfileToNode unchanged (still sets only page layout id on section).

---

**End of plan. Do not implement until approved.**
