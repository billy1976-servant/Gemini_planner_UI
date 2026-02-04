# Layout System

**Primary Architecture Reference:** docs/SYSTEM_MASTER/

---

## Scope: two layers, one domain

| Layer | Controls | Code location |
|-------|----------|---------------|
| **Page (section) layout** | Section placement: container width, split, background variant. Which layout id a section uses. | `src/layout/page/`, `src/layout/resolver/`, `src/layout/renderer/` |
| **Component layout** | Internal arrangement: moleculeLayout (column/row/grid/stacked), card mediaPosition/contentAlign, organ internal layout. | `src/layout/component/`, `src/lib/layout/` (molecule-layout-resolver, card presets), `src/layout-organ/` |

Section layout **id** is a single string (e.g. `hero-split`, `content-narrow`). The resolver merges **page** definition (from `page-layouts.json`) with **component** definition (from `component-layouts.json`) so that one id yields both section-level and inner-arrangement data.

---

## Folder structure (current)

- **`src/layout/`** — Section layout and compatibility.
  - **`page/`** — `page-layout-resolver.ts`, `page-layouts.json`, `templates.json`, `section-helpers.ts`, `capabilities.ts` (section → allowed card presets). Section placement only: containerWidth, split, backgroundVariant.
  - **`component/`** — `component-layout-resolver.ts`, `component-layouts.json`. Resolves layout id to moleculeLayout-shaped definition (type, preset, params).
  - **`resolver/`** — `layout-resolver.ts`: `resolveLayout(layout, context?)` merges page + component; `getLayout2Ids()`, `getDefaultSectionLayoutId(templateId)`.
  - **`renderer/`** — `LayoutMoleculeRenderer.tsx`: renders section using resolved definition (container, split, moleculeLayout).
  - **`compatibility/`** — `evaluateCompatibility(args)`, `getAvailableSlots(sectionNode)`, `getRequiredSlots(layoutType, layoutId)`, `getRequiredSlotsForOrgan(organId, internalLayoutId)`. Pure; no store access.
  - **`requirements/`** — `section-layout-requirements.json`, `card-layout-requirements.json`, `organ-internal-layout-requirements.json`, `SLOT_NAMES.md`.
- **`src/lib/layout/`** — Skin, profiles, molecule layout, card presets.
  - **`layout-engine/`** — composeScreen, region-policy (for site skin / regions).
  - **`profile-resolver.ts`** — getExperienceProfile(profileId), resolveProfileLayout(profileId, role).
  - **`template-profiles.ts`** — TemplateProfile list; defaultSectionLayoutId, sections, visualPreset, etc.
  - **`molecule-layout-resolver.ts`** — resolveMoleculeLayout(flow, preset, params); used by molecules and section inner content.
  - **`card-layout-presets.ts`**, **`card-preset-resolver.ts`** — Card mediaPosition, contentAlign; card visual presets.
  - **`presentation/`** — website.profile.json, app.profile.json, learning.profile.json.
- **`src/layout-organ/`** — Organ internal layout only.
  - **`organ-layout-profiles.json`** — Per organ: organId, capabilities, internalLayoutIds, defaultInternalLayoutId.
  - **`organ-layout-resolver.ts`** — getOrganLayoutProfile, getInternalLayoutIds, getDefaultInternalLayoutId, resolveInternalLayoutId.

---

## Layout resolution order (section)

In `applyProfileToNode` (json-renderer), for each **section** node:

1. **Override** — `sectionLayoutPresetOverrides[sectionKey]` (from OrganPanel / store).
2. **Explicit** — `node.layout` if it is a non-empty string.
3. **Template default** — `profile.defaultSectionLayoutId` or `getDefaultSectionLayoutId(templateId)` from page `templates.json` (defaultLayout key).

Result is a single layout **id** written to `next.layout`. No layout keys (moleculeLayout, containerWidth, etc.) come from section params; they are stripped. Section then uses `resolveLayout(layout)` → page + component definition → LayoutMoleculeRenderer.

---

## Compatibility engine

- **Input:** section node, sectionLayoutId, cardLayoutId, organId, organInternalLayoutId.
- **Behavior:** Compares **required slots** (from requirement registries) to **available slots** (from content-capability-extractor: children + content + organ profile). Returns `{ sectionValid, cardValid, organValid?, missing[] }`.
- **Use:** OrganPanel and dev dropdowns filter options by compatibility; selection is never auto-changed. JsonRenderer calls `evaluateCompatibility` and stores result locally (optional dev log); no render branching on compatibility.
- **Slot naming:** `src/layout/requirements/SLOT_NAMES.md` — heading, body, image, card_list for section/card; organ slots from organ-layout-profiles capabilities.

---

## Organ layout

- Sections with an **organ role** (e.g. hero, features-grid) can have an **internal** layout id (how content is arranged inside the organ). Stored in `organInternalLayoutOverrides` by section key.
- `resolveInternalLayoutId(organId, layoutId)` (layout-organ) returns the layout id if valid for that organ, else the organ’s default. Section compound uses this when rendering organ content; section **placement** is still from section layout id only.

---

## Skin system (site/regions)

- **composeScreen** (`src/lib/layout/layout-engine/composeScreen.ts`): role-tagged nodes + layoutState + experience profile → composed tree (regions). Used for site skin flows.
- **region-policy**: getRegionOrder, isRegionEnabled, etc.
- **Shells:** WebsiteShell, AppShell, LearningShell (in `src/lib/site-skin/shells/`) render by experience; layout store `experience` selects shell.

---

## Capabilities (section → card)

- **`src/layout/page/capabilities.ts`** — `getAllowedCardPresetsForSectionPreset(sectionLayoutId)`, `getDefaultCardPresetForSectionPreset(sectionLayoutId)`. Constrains which card layouts are valid for cards in a section.
