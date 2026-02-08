# Layout Signal Priority (Generated)

**Purpose:** Single canonical order for which layout signal wins when multiple are present. Signal resolution only—no layout definitions or visual tokens changed.

---

## Priority Hierarchy (highest to lowest)

| Priority | Source | When it applies |
|----------|--------|-----------------|
| **1 (highest)** | Explicit `node.layout` in JSON (section or card) | Section/card node has non-empty `layout` string in screen JSON. |
| **2** | Profile overrides via `applyProfileToNode` | Section: `sectionLayoutPresetOverrides[sectionKey]`. Card: `cardLayoutPresetOverrides[parentSectionKey]`. |
| **3** | Template role-based layout | When layout ref is missing and context has `templateId` + `sectionRole`; `getPageLayoutId(null, { templateId, sectionRole })` returns a layout id (e.g. hero, features). |
| **4** | Template default layout | `profile.defaultSectionLayoutId` or `getDefaultSectionLayoutId(templateId)` from templates/template-profiles. |
| **5** | Card preset layout | Card preset (centered-card, narrow, etc.) when no override but preset applies (e.g. profile/section default). |
| **6** | Organ internal layout defaults | When section is organ and no override; `resolveInternalLayoutId` / organ variant `moleculeLayout`. |
| **7 (lowest)** | Component fallback | Section: `<div>` wrapper when `resolveLayout(layout)` returns null. Card: default `mediaPosition` / `contentAlign`. |

- **Section layout** controls page structure (container, split, background).
- **Card layout** controls card alignment/width inside section.
- **Organ layout** applies only when neither section nor card override it.
- **No template default overrides explicit JSON** — explicit `node.layout` always wins.

---

## Layout Sources (SOURCE → FILE → WHEN)

| SOURCE | FILE(S) | WHEN IT APPLIES |
|--------|--------|-----------------|
| Section node.layout in JSON | Screen JSON; read in `src/engine/core/json-renderer.tsx` `applyProfileToNode` as `existingLayoutId` | When computing `next.layout` for nodes with `type === "section"`. |
| Profile / store overrides (section) | `src/engine/core/json-renderer.tsx` `applyProfileToNode`; `src/state/section-layout-preset-store.ts` | `sectionLayoutPresetOverrides[sectionKey]`; applied per section when preset store has an override. |
| Template default layout | `src/lib/layout/template-profiles.ts` (`defaultSectionLayoutId`); `src/layout/page/page-layout-resolver.ts` `getDefaultSectionLayoutId` (reads `templates.json` `defaultLayout`) | When no explicit and no override; profile supplies default or getDefaultSectionLayoutId(templateId). |
| Template role-based layout | `src/layout/page/page-layout-resolver.ts` `getPageLayoutId(layout, context)` when `layout == null` and `context.templateId` + `context.sectionRole` present | templates.json slot map (e.g. hero, features). Resolved in applyProfileToNode when no explicit and no override. |
| Card preset layout | `src/lib/layout/card-layout-presets.ts`; applied in `src/engine/core/json-renderer.tsx` `applyProfileToNode` | When `type === "card"` and `cardLayoutPresetOverrides[parentSectionKey]` set; merges mediaPosition, contentAlign into card params. |
| Organ internal layout | `src/layout-organ/organ-layout-resolver.ts`; `src/organs/resolve-organs.ts`; `src/compounds/ui/12-molecules/section.compound.tsx` | When section role in getOrganLayoutOrganIds(); resolveInternalLayoutId(role, params.internalLayoutId); variant moleculeLayout. Overrides in expandOrgansInDocument. |
| Section visual preset layout overlay | `src/engine/core/json-renderer.tsx` `renderNode`: `sectionPresetLayoutOverlay` from `visualPresetOverlay?.layout` | Merges profile visual-preset layout (gap/padding) into section params; does not set section layout ID. |
| Component fallback (section) | `src/compounds/ui/12-molecules/section.compound.tsx` | When `resolveLayout(layout)` returns null: render div wrapper; no layout ID invented. |
| Card component defaults | `src/compounds/ui/12-molecules/card.compound.tsx` | `mediaPosition ?? "top"`, `contentAlign ?? "start"`; resolveWithDefaultLayout default flow. |
