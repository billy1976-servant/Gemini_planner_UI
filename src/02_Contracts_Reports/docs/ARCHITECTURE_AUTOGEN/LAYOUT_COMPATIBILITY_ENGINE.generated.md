# Layout Compatibility Engine (Generated)

Extracted from code. Function names and file paths only; no conceptual duplication.

---

## Slot requirement structure

- **Section layouts:** `src/layout/requirements/section-layout-requirements.json`  
  Root: `{ "layoutRequirements": { [layoutId]: { "requires": string[] } } }`  
  Example: `"hero-split": { "requires": ["heading", "body", "image"] }`.

- **Card layouts:** `src/layout/requirements/card-layout-requirements.json`  
  Same shape: `layoutRequirements[layoutId].requires` = array of slot names.

- **Organ internal layouts:** `src/layout/requirements/organ-internal-layout-requirements.json`  
  Root: `{ "organLayoutRequirements": { [organId]: { [internalLayoutId]: string[] } } }`  
  Example: `"hero": { "centered": ["heading", "body"], "image-bg": ["heading", "body", "image"] }`.

- **Slot name convention:** `src/layout/requirements/SLOT_NAMES.md`  
  Section/card slots: `heading`, `body`, `image`, `card_list`. Organ slots from organ profile `capabilities.slots`: e.g. `title`, `items`, `primary`, `logo`, `cta`.

---

## Content capability (available slots)

| File Path | Function | Input | Output | Logic |
|-----------|----------|--------|--------|--------|
| `src/layout/compatibility/content-capability-extractor.ts` | `getAvailableSlots(sectionNode, options?)` | `SectionNode`: `{ id?, role?, type?, children?, content?, params? }`; `options.includeOrganSlots` (default true) | `string[]` (slot names) | 1) From `sectionNode.content`: keys normalized via `normalizeToSlot(key)` (and `content.title` → `heading`). 2) From `sectionNode.children`: each child `type` or `role` normalized via `normalizeToSlot(t)`. 3) If `includeOrganSlots` and `sectionNode.role`: `addOrganSlots(slots, role)` using `getOrganLayoutProfile(role)` from `@/layout-organ`; maps organ slots (title, items, primary, logo, cta) from canonical slots (heading→title, card_list→items, body/heading→primary, etc.). |

**Normalization (same file):**  
`CHILD_TYPE_TO_SLOT`: `heading`/`title`→`heading`, `body`→`body`, `image`→`image`, `card`→`card_list`. `normalizeToSlot(typeOrKey)` returns canonical slot or null.

---

## Compatibility evaluation (no scoring; boolean per dimension)

| File Path | Function | Input | Output | Logic |
|-----------|----------|--------|--------|--------|
| `src/layout/compatibility/compatibility-evaluator.ts` | `evaluateCompatibility(args)` | `EvaluateCompatibilityArgs`: `{ sectionNode?, sectionLayoutId?, cardLayoutId?, organId?, organInternalLayoutId? }` | `CompatibilityResult`: `{ sectionValid: boolean, cardValid: boolean, organValid?: boolean, missing: string[] }` | 1) `availableSet` = `getAvailableSlots(sectionNode)`. 2) `sectionValid` = every `getRequiredSlots("section", sectionLayoutId)` in availableSet (empty required ⇒ true). 3) `cardValid` = every `getRequiredSlots("card", cardLayoutId)` in availableSet. 4) If `organId` and `organInternalLayoutId`: `organValid` = every `getRequiredSlotsForOrgan(organId, organInternalLayoutId)` in availableSet. 5) `missing` = union of required slots not in availableSet. |

**Exact functions used:**  
- `getAvailableSlots(sectionNode ?? undefined)` from `content-capability-extractor.ts`.  
- `getRequiredSlots("section" | "card", layoutId)` and `getRequiredSlotsForOrgan(organId, internalLayoutId)` from `requirement-registry.ts`.

---

## Requirement registry

| File Path | Function | Input | Output |
|-----------|----------|--------|--------|
| `src/layout/compatibility/requirement-registry.ts` | `getRequiredSlots(layoutType, layoutId, organId?)` | `layoutType`: `"section"` \| `"card"` \| `"organ"`; `layoutId`: string; `organId` for type `"organ"` | `string[]` (required slot names); empty if layoutId empty or missing in JSON |
| Same | `getRequiredSlotsForOrgan(organId, internalLayoutId)` | organId, internalLayoutId (normalized to lowercase trim) | `string[]` from `organ-internal-layout-requirements.json` |

Layout IDs are normalized with `normalizeId(id)`: `(id ?? "").trim().toLowerCase()`.

---

## Layout resolvers that filter by compatibility

| File Path | How compatibility is used |
|-----------|----------------------------|
| `src/dev/section-layout-dropdown.tsx` | `getLayout2Ids()` then filter: `layoutIds.filter((id) => evaluateCompatibility({ sectionNode: s, sectionLayoutId: id }).sectionValid)`. Options shown = compatible section layouts only. |
| `src/organs/OrganPanel.tsx` | Section dropdown: `presetOptions.filter((candidateId) => evaluateCompatibility({ sectionNode, sectionLayoutId: candidateId, cardLayoutId, organId, organInternalLayoutId }).sectionValid)`. Card dropdown: `getAllowedCardPresetsForSectionPreset(currentSectionPreset)` then filter by `evaluateCompatibility(..., cardLayoutId: candidateId).cardValid`. Organ internal: `internalLayoutIds.filter((candidateId) => evaluateCompatibility(..., organInternalLayoutId: candidateId).organValid !== false)`. |
| `src/engine/core/json-renderer.tsx` | `evaluateCompatibility({ sectionNode: node, sectionLayoutId, cardLayoutId, organId, organInternalLayoutId })` called in `applyProfileToNode` for dev logging only; does not filter layout list in code path shown. |

---

## Card layout allow-list (section → card options)

Not part of compatibility evaluator; used together with it:

- **File:** `src/layout/page/capabilities.ts`  
- **Function:** `getAllowedCardPresetsForSectionPreset(sectionLayoutId): string[]`  
- **Data:** `SECTION_TO_CARD_CAPABILITIES`: section layout id → allowed card layout ids. Empty section id `""` → all card presets. Used by OrganPanel to get candidate card layouts before filtering by `cardValid`.

---

## Precedence when multiple layouts qualify

**No scoring in code.** Compatibility is boolean (sectionValid, cardValid, organValid). When multiple layout IDs are valid:

- Section/card/organ dropdowns show all compatible options (filtered lists above).
- Which layout is applied comes from: override (e.g. sectionLayoutPresetOverrides), node.layout, or template default (`getDefaultSectionLayoutId` / organ default internal layout).  
**Precedence rule for “which one wins” when multiple qualify:** UNDETERMINED IN CODE (selection is by user or profile/default, not by the compatibility engine).

---

## Related files (no slot registry as separate module)

- `src/layout/compatibility/compatibility-evaluator.ts` — evaluator
- `src/layout/compatibility/requirement-registry.ts` — required slots from JSON
- `src/layout/compatibility/content-capability-extractor.ts` — available slots from section node
- `src/layout/requirements/SLOT_NAMES.md` — slot name convention (documentation only)
- `src/layout/requirements/section-layout-requirements.json` — section layout requirements
- `src/layout/requirements/card-layout-requirements.json` — card layout requirements
- `src/layout/requirements/organ-internal-layout-requirements.json` — organ internal layout requirements
- `src/layout-organ/organ-layout-resolver.ts` — `getOrganLayoutProfile(role)` used by content-capability-extractor for organ slots
- `src/layout-organ/organ-layout-profiles.json` — organ capabilities (e.g. slots) and internal layout ids

**Unclear / implicit:** No separate “slot name registry” module; slot names are fixed in extractor (`CHILD_TYPE_TO_SLOT`, `addOrganSlots`), SLOT_NAMES.md, and requirement JSON keys. Adding a new slot requires code/JSON change.
