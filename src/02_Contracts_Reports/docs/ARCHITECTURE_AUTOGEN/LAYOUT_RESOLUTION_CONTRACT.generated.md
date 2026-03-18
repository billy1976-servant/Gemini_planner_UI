# LAYOUT_RESOLUTION_CONTRACT.generated.md

Exact order of layout resolution derived from resolver code and stores. No doc assumptions.

---

## Stores involved

| Store | File path | Purpose |
|-------|-----------|---------|
| Layout (template/experience/mode) | `src/engine/core/layout-store.ts` | `getLayout()`, `subscribeLayout`, `setLayout`; holds experience, type, preset, templateId, mode, regionPolicy |
| Section layout preset overrides | `src/state/section-layout-preset-store.ts` | Per-screen, per-section: section container layout id; `getOverridesForScreen(screenId)`, `setSectionLayoutPresetOverride` |
| Card layout preset overrides | `src/state/section-layout-preset-store.ts` | Per-screen, per-section: card layout preset id; `getCardOverridesForScreen(screenId)`, `setCardLayoutPresetOverride` |
| Organ internal layout overrides | `src/state/organ-internal-layout-store.ts` | Per-screen, per-section: organ internal layout id; `getOrganInternalLayoutOverridesForScreen(screenId)`, `setOrganInternalLayoutOverride` |

---

## Resolver files and functions

| File path | Functions | Role |
|-----------|-----------|------|
| `src/layout/resolver/layout-resolver.ts` | `resolveLayout(layout, context)`, `getLayout2Ids()`, `getDefaultSectionLayoutId(templateId)` | Merges page + component layout by id; delegates to page + component |
| `src/layout/page/page-layout-resolver.ts` | `getPageLayoutId(layout, context)`, `getPageLayoutById(id)`, `getPageLayoutIds()`, `getDefaultSectionLayoutId(templateId)`, `resolvePageLayout(...)` | Resolves layout id from string or `{ template, slot }`; reads page-layouts.json, templates.json |
| `src/layout/page/page-layouts.json` | — | Map layout id → PageLayoutDefinition (containerWidth, split, backgroundVariant) |
| `src/layout/page/templates.json` | — | Map templateId → { sectionRole: layoutId, defaultLayout } |
| `src/layout/component/component-layout-resolver.ts` | `resolveComponentLayout(layoutId)`, `getComponentLayoutIds()` | layout id → ComponentLayoutDefinition (type, preset, params) |
| `src/layout/component/component-layouts.json` | — | Map layout id → moleculeLayout shape |
| `src/layout-organ/organ-layout-resolver.ts` | (used by layout-organ index) | Organ internal layout resolution |
| `src/layout-organ/organ-layout-profiles.json` | — | Organ capabilities / slots |
| `src/layout/compatibility/compatibility-evaluator.ts` | `evaluateCompatibility(args)` | Compares required slots (requirement-registry) vs available (content-capability-extractor) |
| `src/layout/compatibility/requirement-registry.ts` | `getRequiredSlots(layoutType, layoutId)`, `getRequiredSlotsForOrgan(organId, internalLayoutId)` | Reads section/card/organ requirement JSON |
| `src/layout/compatibility/content-capability-extractor.ts` | `getAvailableSlots(sectionNode, options)` | Derives slots from section content/children/role |

---

## Precedence order (section layout id)

Applied in `applyProfileToNode`, `src/engine/core/json-renderer.tsx`, for nodes with `type` section:

1. **Section layout preset override** (store)  
   `sectionLayoutPresetOverrides?.[sectionKey]` — from `getOverridesForScreen(screenKey)` (section-layout-preset-store).  
   Section key = `node.id ?? node.role ?? ""`.

2. **Explicit node.layout**  
   `node.layout` (string, trimmed). Only if no override.

3. **Template default**  
   `profile.defaultSectionLayoutId` or `getDefaultSectionLayoutId(templateId)` from `src/layout/page/page-layout-resolver.ts` (templates[templateId].defaultLayout).

4. **Fallback**  
   `undefined` if none set.

Result assigned to `next.layout` and `(next as any)._effectiveLayoutPreset`. Section params are stripped of moleculeLayout, layoutPreset, layout, containerWidth, backgroundVariant, split so JSON cannot supply section layout.

---

## Template defaults

- **Template id** from layout-store: `layoutSnapshot.templateId`.
- **Default section layout id**: `src/layout/page/page-layout-resolver.ts` → `getDefaultSectionLayoutId(templateId)` reads `templates[templateId]["defaultLayout"]`.  
- **templates.json** currently: `"startup-template"` → hero, features, content keys; no `defaultLayout` in file — so defaultSectionLayoutId can be undefined for other templates.

---

## Component layout merging

- **Unified resolve**: `resolveLayout(layout, context)` in `src/layout/resolver/layout-resolver.ts`:
  - `getPageLayoutId(layout, context)` → layout id (string or from template+slot).
  - `getPageLayoutById(layoutId)` → page definition.
  - `resolveComponentLayout(layoutId)` → component (moleculeLayout) definition.
  - Return `{ ...pageDef, moleculeLayout: componentDef ?? undefined }`.
- **Section compound**: `src/compounds/ui/12-molecules/section.compound.tsx` calls `resolveLayout(layout)` (layout = section’s resolved layout id from renderer). If section is organ, organ variant’s moleculeLayout overrides layoutDef.moleculeLayout.

---

## Compatibility filtering

- **When**: Inside `applyProfileToNode` for section nodes, dev only (console.debug).
- **Call**: `evaluateCompatibility({ sectionNode, sectionLayoutId: next.layout, cardLayoutId: cardLayoutPresetOverrides?.[sectionKey], organId: node.role, organInternalLayoutId: organInternalLayoutOverrides?.[sectionKey] })`.
- **Logic**: `getAvailableSlots(sectionNode)` vs `getRequiredSlots("section", sectionLayoutId)`, `getRequiredSlots("card", cardLayoutId)`, `getRequiredSlotsForOrgan(organId, organInternalLayoutId)`; returns sectionValid, cardValid, organValid, missing[].
- **Files**: `src/layout/compatibility/compatibility-evaluator.ts`, `requirement-registry.ts` (section-layout-requirements.json, card-layout-requirements.json, organ-internal-layout-requirements.json), `content-capability-extractor.ts`.

---

## Card layout preset (per-section)

- **Source**: `cardLayoutPresetOverrides?.[parentSectionKey]` (card layout preset store).
- **Applied**: In `applyProfileToNode` for nodes with type card when `parentSectionKey` and card preset exist; `getCardLayoutPreset(cardPresetId)` from `@/lib/layout/card-layout-presets`; merged into node params: mediaPosition, contentAlign.
- **Repeater items**: Same card preset merged into item params when itemType is card or feature-card.

---

## Organ internal layout

- **Store**: `src/state/organ-internal-layout-store.ts`; keyed by screenId + sectionKey.
- **Usage**: Passed as `organInternalLayoutOverrides` into JsonRenderer and into `applyProfileToNode`; passed to `evaluateCompatibility` as organInternalLayoutId.
- **Section compound**: When section is organ, `resolveInternalLayoutId(role, params.internalLayoutId)` and organ variant’s moleculeLayout override section layout’s moleculeLayout.

---

## Summary order

1. Section layout id: **override (store) → node.layout → template defaultSectionLayoutId**.
2. Section params: layout-related keys **stripped**; layout id passed as `layout` prop to Section.
3. Template profile (from layout-store + template-profiles) supplies visualPreset, spacingScale, cardPreset, defaultSectionLayoutId.
4. Component layout: **resolveLayout(layout)** → page def + component def merged; Section uses it for LayoutMoleculeRenderer; organ sections merge organ variant moleculeLayout.
5. Compatibility: **evaluateCompatibility** (required vs available slots) for section/card/organ; dev-only logging.
6. Card preset: **cardLayoutPresetOverrides** merged into Card params and repeater item params per parent section.
