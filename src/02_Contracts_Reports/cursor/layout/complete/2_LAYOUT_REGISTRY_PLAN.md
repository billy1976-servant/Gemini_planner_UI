# 2 — Layout Registry Plan

**Execution order:** 2 of 10  
**Classification:** FOUNDATIONAL — Single source of truth for layout IDs and requirements; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Layout (Registries, JSON)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define layout registries as the single source of truth for section, card, and organ layout IDs and their requirements. All new layouts plug in via JSON/registry only; no code-level fallbacks for unknown IDs.

---

## Current Runtime (Verified)

| Registry / data | Path | Role |
|-----------------|------|------|
| Section (page) layout definitions | `src/layout/page/page-layouts.json` | Layout ID → PageLayoutDefinition (containerWidth, split, backgroundVariant). |
| Section layout IDs (for dropdowns) | `src/layout/page/page-layout-resolver.ts` | `getPageLayoutIds()` = Object.keys(pageLayouts). |
| Section layout requirements | `src/layout/requirements/section-layout-requirements.json` | layoutRequirements[layoutId].requires = slot names. |
| Component (inner) layout definitions | `src/layout/component/component-layouts.json` | Layout ID → moleculeLayout (type, preset, params). |
| Card layout requirements | `src/layout/requirements/card-layout-requirements.json` | layoutRequirements[cardPresetId].requires. |
| Organ layout profiles | `src/layout-organ/organ-layout-profiles.json` | organs[].organId, internalLayoutIds, defaultInternalLayoutId, capabilities. |
| Organ internal requirements | `src/layout/requirements/organ-internal-layout-requirements.json` | organLayoutRequirements[organId][internalLayoutId] = slot names. |
| Section → card allow-list | `src/layout/page/capabilities.ts` | SECTION_TO_CARD_CAPABILITIES (currently TS; see Plan 6 for JSON migration). |

---

## Contract: JSON-Only Extension

- **Adding a section layout:** Add entry to page-layouts.json; add entry to component-layouts.json (if inner arrangement differs); add entry to section-layout-requirements.json (requires array, possibly empty). No resolver or evaluator code change.
- **Adding a card layout:** Add preset to card preset source; add entry to card-layout-requirements.json. If section→card allow-list is moved to JSON (Plan 6), add mapping there.
- **Adding an organ internal layout:** Add internalLayoutId to organ in organ-layout-profiles.json; add entry in organ-internal-layout-requirements.json for that organId and internalLayoutId.
- **No code fallbacks:** Resolver and compatibility must not substitute a default layout ID when an ID is missing from the registry. Unknown ID ⇒ null/undefined or empty set as appropriate; no silent "all presets" or hardcoded ID.

---

## What Layout Registries Can and Cannot Do

| Can | Cannot |
|-----|--------|
| Supply all layout IDs for dropdowns and compatibility filtering. | Be bypassed by code that invents layout IDs or fallback IDs. |
| Be extended via JSON (and optionally section→card JSON) only. | Require TypeScript edits for new layout IDs or new requirement entries. |

---

## How It Connects to Compatibility and Resolver

- **Compatibility:** Requirement registry reads JSON only; getRequiredSlots / getRequiredSlotsForOrgan return empty array for unknown or empty ID. Content extractor and SLOT_NAMES.md define available slots.
- **Resolver:** getPageLayoutById, resolveComponentLayout, getPageLayoutIds, getInternalLayoutIds, etc. read from these JSON sources. Missing ID ⇒ null or empty list; no fallback ID in code.
- **Dropdown source of truth:** Plan 3 defines that dropdown options are the intersection of registry IDs and compatibility result; registries are the authority for "which IDs exist."

---

## Governance

- Every layout ID in use (page, component, card, organ internal) must have a requirement entry (or explicit empty requires) so compatibility is well-defined. Plan 10 (Validation and Governance) covers audits and coverage.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*

---

## Verification Report (Step 2)

**Plan:** [2_LAYOUT_REGISTRY_PLAN.md](2_LAYOUT_REGISTRY_PLAN.md)  
**Scope:** Verify runtime registries as single source of truth; no code fallbacks for unknown IDs.  
**Date:** 2025-02-04

---

### Summary

| Check | Status |
|-------|--------|
| All registry/data paths present and roles as documented | ✅ PASS |
| Section layout IDs from registry (getPageLayoutIds = Object.keys) | ✅ PASS |
| Missing layout ID ⇒ null or empty (resolver, component, organ) | ✅ PASS |
| Default section layout from template JSON only; no code fallback | ✅ PASS |
| Section → card allow-list in capabilities.ts (Plan 6: JSON migration noted) | ✅ PASS (path correct) |
| Unknown section ID → silent "all presets" in capabilities | ⚠️ GAP (see below) |

**Overall: PASS with one documented gap** — Registries are the source of truth; one fallback (card presets for unknown section ID) to align with Plan 2/6.

---

### 1. Registry and data paths

| Registry / data | Path | Verified role |
|-----------------|------|----------------|
| Section (page) layout definitions | `src/layout/page/page-layouts.json` | Layout ID → PageLayoutDefinition (containerWidth, split, backgroundVariant). ✅ |
| Section layout IDs (for dropdowns) | `src/layout/page/page-layout-resolver.ts` | `getPageLayoutIds()` = `Object.keys(pageLayouts)`. ✅ |
| Section layout requirements | `src/layout/requirements/section-layout-requirements.json` | layoutRequirements[layoutId].requires. ✅ |
| Component (inner) layout definitions | `src/layout/component/component-layouts.json` | Layout ID → moleculeLayout (type, preset, params). ✅ |
| Card layout requirements | `src/layout/requirements/card-layout-requirements.json` | layoutRequirements[cardPresetId].requires. ✅ |
| Organ layout profiles | `src/layout-organ/organ-layout-profiles.json` | organs[].organId, internalLayoutIds, defaultInternalLayoutId, capabilities. ✅ |
| Organ internal requirements | `src/layout/requirements/organ-internal-layout-requirements.json` | organLayoutRequirements[organId][internalLayoutId]. ✅ |
| Section → card allow-list | `src/layout/page/capabilities.ts` | SECTION_TO_CARD_CAPABILITIES (TS; Plan 6: JSON migration). ✅ |

---

### 2. Contract: missing ID ⇒ null or empty

| API | Behavior for unknown/missing ID | Contract |
|-----|---------------------------------|----------|
| `getPageLayoutById(id)` | Returns `null` if not in pageLayouts | ✅ No fallback ID |
| `resolvePageLayout(layout, context)` | Uses getPageLayoutId → getPageLayoutById; returns `null` if no id or no def | ✅ |
| `resolveComponentLayout(layoutId)` | Returns `null` if not in componentLayouts | ✅ |
| `resolveLayout(layout, context)` | Returns `null` if !layoutId or !pageDef | ✅ |
| `getRequiredSlots` / `getRequiredSlotsForOrgan` | Unknown ID ⇒ entry missing ⇒ `[]` (empty requires) | ✅ |
| `getOrganLayoutProfile(organId)` | Unknown organ ⇒ `null` | ✅ |
| `getInternalLayoutIds(organId)` | Unknown organ ⇒ `[]` | ✅ |
| `getDefaultInternalLayoutId(organId)` | Unknown organ ⇒ `null` | ✅ |
| `resolveInternalLayoutId(organId, layoutId)` | Unknown organ ⇒ `null`; known organ uses profile default only | ✅ |
| `getDefaultSectionLayoutId(templateId)` | From templates[templateId].defaultLayout only; no template or no key ⇒ `undefined` | ✅ |

---

### 3. Gap: section → card allow-list fallback

**Location:** `src/layout/page/capabilities.ts`

```ts
export function getAllowedCardPresetsForSectionPreset(
  sectionLayoutId: string | null
): string[] {
  const id = (sectionLayoutId ?? "").toString().trim() || "";
  const allowed = SECTION_TO_CARD_CAPABILITIES[id];
  return allowed ?? [...ALL_CARD_PRESETS];  // ← unknown section ID ⇒ all card presets
}
```

**Contract (Plan 2):** "Unknown ID ⇒ null/undefined or empty set as appropriate; no silent 'all presets' or hardcoded ID."

**Current behavior:** Unknown or empty section layout ID returns `ALL_CARD_PRESETS` (silent "all presets").

**Recommendation:** For full Plan 2 alignment, unknown section ID could return `[]` (or a dedicated behavior). Plan 6 (Fallback Removal and JSON Defaulting) will migrate section→card to JSON; that migration is the natural place to define and implement the desired behavior (e.g. explicit default key in JSON or empty set for unknown). No change required for Step 2 verification; gap documented for Plan 6.

---

### 4. JSON-only extension (add new layout)

| Action | Required change | Code change for new ID? |
|--------|------------------|--------------------------|
| New section layout | page-layouts.json + component-layouts.json (if inner differs) + section-layout-requirements.json | No ✅ |
| New card layout | Card preset source + card-layout-requirements.json | No ✅ |
| New organ internal layout | organ-layout-profiles.json (internalLayoutIds + default) + organ-internal-layout-requirements.json | No ✅ |
| Section → card mapping | Currently capabilities.ts (Plan 6: move to JSON) | Today: TS edit; after Plan 6: JSON only |

---

### 5. Resolver and compatibility wiring

- **Resolver:** `layout-resolver.ts` uses getPageLayoutById, resolveComponentLayout, getPageLayoutIds, getDefaultSectionLayoutId from page/component. Missing ID ⇒ null or undefined. ✅
- **Compatibility:** Requirement registry reads JSON only; unknown ID ⇒ empty requires. ✅
- **Dropdown source:** Plan 3 defines options as registry IDs ∩ compatibility; registries supply "which IDs exist" via getPageLayoutIds(), getInternalLayoutIds(), etc. ✅

---

### Conclusion

Step 2 (Layout Registry) is **verified** with one documented gap: `getAllowedCardPresetsForSectionPreset` returns all card presets for unknown section layout ID. All other registry and resolver behavior matches the plan (single source of truth, no code fallbacks for layout IDs). The gap is left for Plan 6 (section→card JSON migration and defaulting).

**Next:** Proceed to Step 3 — [3_DROPDOWN_SOURCE_OF_TRUTH_PLAN.md](3_DROPDOWN_SOURCE_OF_TRUTH_PLAN.md) when ready.
