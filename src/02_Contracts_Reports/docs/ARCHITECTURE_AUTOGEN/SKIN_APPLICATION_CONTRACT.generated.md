# SKIN_APPLICATION_CONTRACT.generated.md

How visual skin/theme is applied: skin resolver files, where tokens are injected, which components consume skin values. Code-derived only.

---

## Skin resolver / binding entry

| File | Role |
|------|------|
| src/logic/bridges/skinBindings.apply.ts | applySkinBindings(doc, data): resolves type "slot" nodes via slotKey into data; returns doc with only renderable nodes (no slot nodes). |
| src/lib/site-skin/loadSiteSkin.ts | loadSiteSkin(domain, pageId): fetch /api/sites/:domain/skins/:pageId; returns SiteSkinDocument. |
| src/app/api/sites/[domain]/skins/[pageId]/route.ts | GET: reads content/compiled/sites/{domain}/compiled/skins/{pageId}.skin.json; returns JSON. |
| src/app/api/sites/[domain]/skins/route.ts | GET: lists .skin.json files in skins dir; returns { pageId }[]. |

---

## Where tokens / data are injected

| Location | Mechanism | File |
|----------|------------|------|
| Slot resolution | getByPath(data, slot.slotKey); if value is array of nodes (type string), use as replacement; else [] | src/logic/bridges/skinBindings.apply.ts resolveSlotNode(), resolveNodes() |
| Screen data bag | applySkinBindings(expandedDoc, json?.data ?? {}) | src/app/page.tsx |
| SiteSkin | applySkinBindings(expandOrgansInDocument(doc, loadOrganVariant), data ?? {}) | src/lib/site-skin/SiteSkin.tsx |
| engineToSkin.bridge | applySkinBindings(args.skin, dataBag) | src/logic/bridges/engineToSkin.bridge.ts |

No CSS/token (theme) injection in skinBindings.apply; it only replaces slot nodes with content from data. Visual tokens (e.g. palette, spacing) are applied elsewhere (profile, template, json-renderer applyProfileToNode).

---

## Slot node contract

| Field | Required | Notes |
|-------|----------|--------|
| type | "slot" | isSlotNode checks type === "slot" and slotKey string |
| slotKey | string | Dot path into data (e.g. "products.featured", "nav.items") |
| renderAs | optional | Not used in skinBindings.apply; engine/mappers may supply pre-built molecule nodes in data. |

Source: src/lib/site-skin/siteSkin.types.ts SlotNode; src/logic/bridges/skinBindings.apply.ts isSlotNode, resolveSlotNode.

---

## Components that consume skin / data-driven content

| Consumer | What it consumes | File |
|----------|------------------|------|
| JsonRenderer | Renders tree after applySkinBindings; no direct "skin" prop; node types from Registry. | src/engine/core/json-renderer.tsx |
| JsonSkinEngine | Renders node.type "json-skin" screen.children; uses state (globalState + engineState) for selectActiveChildren (when.state/equals). Does not read theme tokens. | src/logic/engines/json-skin.engine.tsx |
| SiteSkin | data prop passed to applySkinBindings; data-skin-source, data-skin-domain, data-skin-page-id on root. | src/lib/site-skin/SiteSkin.tsx |
| Section/Card/atoms | No direct skin API; layout and visual preset from profile (template + experience) and applyProfileToNode (visualPreset, spacingScale, cardPreset). | src/engine/core/json-renderer.tsx applyProfileToNode, getVisualPresetForMolecule, getCardPreset |

---

## Theme / visual preset (not "skin" in slot sense)

| File | Role |
|------|------|
| src/lib/layout/profile-resolver.ts | getExperienceProfile(experience) |
| src/lib/layout/template-profiles.ts | getTemplateProfile(templateId); template supplies visualPreset, spacingScale, cardPreset, defaultSectionLayoutId, sectionBackgroundPattern, etc. |
| src/engine/core/json-renderer.tsx | applyProfileToNode merges profile; getVisualPresetForMolecule(type, profile?.visualPreset, profile?.id); getSpacingForScale(profile.spacingScale); getCardPreset(profile.cardPreset). |
| src/engine/core/layout-store.ts | getLayout(), subscribeLayout; holds templateId, experience, mode. |

Palette: json-renderer uses subscribePalette, getPalette (palette-store/palette-resolver); tokens from palette, not from skinBindings.

---

## Summary

- **Skin binding**: applySkinBindings replaces type "slot" nodes with content from data[slotKey]. No theme tokens in this layer.
- **Theme / layout**: Profile (template + experience) and layout-store drive visualPreset, spacingScale, cardPreset, section layout; applied in JsonRenderer applyProfileToNode.
- **json-skin type**: Rendered by JsonSkinEngine; view gating by state (when.state/equals); no separate skin resolver for json-skin.
