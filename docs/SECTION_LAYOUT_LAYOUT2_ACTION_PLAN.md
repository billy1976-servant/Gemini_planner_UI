# Section layout pipeline refactor — diff-based action plan

**Classification:** REFERENCE — Section layout id only; actionable refactor steps; primary architecture reference: docs/SYSTEM_MASTER/

**Goal:** Templates, OrganPanel overrides, and dev dropdown all set a single section layout string ID on `section.layout`. No `{ type, params }` on layout. Bypass legacy preset system. SectionCompound renders only via `resolveLayout(layoutId)` → LayoutMoleculeRenderer.

---

## 1. section layout: add default layout id by template + role

**File:** `src/layout/resolver/layout-resolver.ts` (and export in `index.ts`)

- Add `getDefaultSectionLayoutId(templateId: string | undefined, role: string): string | null`.
- Use `templates.json`: if `templates[templateId]?.[role]` exists, return it.
- Else return fallback by role: hero → `"hero-split-image-right"`, content → `"content-narrow"`, features → `"features-grid-3"`, gallery → `"features-grid-3"`, cta → `"cta-centered"`, footer/nav/header → `"content-narrow"`, else `"content-narrow"`.
- Export from `src/layout/index.ts`.

---

## 2. json-renderer: applyProfileToNode — layout id only

**File:** `src/engine/core/json-renderer.tsx`

**Remove:**
- Entire block that sets `next.layout = { ...sectionDef }` and template params (lines ~329–359).
- Entire “Per-section: effective section layout preset” block that calls `getSectionLayoutPreset`, merges `sectionOnly` into `next.params`, and sets `_sectionPresetApplied` (lines ~361–412).

**Add (for sections only):**
- After stripping layout keys from section params (keep that), compute one layout id:
  - `overrideId = sectionLayoutPresetOverrides?.[sectionKey] ?? null`
  - `existingLayoutId = typeof node.layout === "string" && node.layout.trim() ? node.layout.trim() : null`
  - `templateId = profile?.id ?? null` (template profile id)
  - `defaultId = getDefaultSectionLayoutId(templateId, node.role)`
  - `next.layout = overrideId || existingLayoutId || (node.role === "hero" ? (profile?.defaultHeroPreset ?? "hero-split-image-right") : defaultId)`
- Set `(next as any)._effectiveLayoutPreset = next.layout` for any consumers.
- Keep hero title/typography merge from template if needed (optional: merge from profile when template is active, without setting layout to object). For minimal change, only set `next.layout`; do not write template `moleculeLayout`/`containerWidth` into params (section layout drives rendering).
- Remove import of `getSectionLayoutPreset`. Remove `SECTION_PRESET_KEYS` constant.

---

## 3. json-renderer: renderNode — stop re-merging legacy preset params

**File:** `src/engine/core/json-renderer.tsx`

- Remove the block that re-applies section preset keys when `_sectionPresetApplied` (lines ~545–553): delete the `sectionLayoutPresetWasApplied` check and the `if (typeKey === "section" && sectionLayoutPresetWasApplied ...)` block that merges split/moleculeLayout/containerWidth/backgroundVariant from profiledNode.params into finalParams.
- Optional: simplify or remove the hero “final params” console log if it only referenced legacy preset.

---

## 4. SectionCompound: layout only via resolveLayout → LayoutMoleculeRenderer

**File:** `src/compounds/ui/12-molecules/section.compound.tsx`

- Keep: `layoutDef = resolveLayout(layout)` and `if (layoutDef) return <LayoutMoleculeRenderer ... />`.
- When `layoutDef` is null: resolve a fallback layout id (e.g. `resolveLayout("content-narrow")` or use `getDefaultSectionLayoutId(undefined, role)` if available). If fallback def exists, render LayoutMoleculeRenderer with it; otherwise render a minimal single wrapper (e.g. contained Surface with children) so sections never use the legacy params block.
- Remove the entire legacy layout block (params-driven containerWidth/split/moleculeLayout/grid/full-bleed hero, etc.) — from the “BELOW: existing layout engine” comment through the final return (the big block that uses `containerWidth`, `splitConfig`, `moleculeLayout`, `partitionChildrenForSplit`, grid/row/column, SurfaceAtom, etc.). Replace with: `const fallbackDef = resolveLayout("content-narrow"); return fallbackDef ? <LayoutMoleculeRenderer layout={fallbackDef} ... /> : <div data-section-id={id}>{children}</div>` (or equivalent minimal wrapper).

---

## 5. OrganPanel: use layout ids for section layout

**File:** `src/organs/OrganPanel.tsx`

- Replace `getAllSectionPresetIds()` with `getLayout2Ids()` from `@/layout`.
- Use `getLayout2Ids()` for the section layout dropdown options (or a role-filtered list if you add `getEligibleLayout2Ids(sectionNode)` later). Same store key and callback: `sectionLayoutPresetOverrides` / `onSectionLayoutPresetOverride` now store and pass layout id strings.

---

## 6. Optional cleanup

- **section-layout-presets.ts:** No longer used for section layout in the pipeline. Leave file in place for now (or later remove/getEligiblePresetIds only if OrganPanel still needs role filtering; with getLayout2Ids we use same ids for all sections unless you add role filtering in section layout).
- **Dev dropdown:** Already uses `getLayout2Ids()` and writes `node.layout`; no change except that applyProfileToNode will no longer overwrite it with `{ type, params }`.

---

## Order of edits

1. section layout: add and export `getDefaultSectionLayoutId`.
2. json-renderer: refactor applyProfileToNode (layout id only; remove template object and legacy preset).
3. json-renderer: remove section preset re-merge in renderNode.
4. SectionCompound: remove legacy block; use resolveLayout + fallback default id.
5. OrganPanel: use getLayout2Ids() for section layout options.
