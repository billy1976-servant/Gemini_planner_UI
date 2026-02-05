# 3 — Dropdown Source of Truth Plan

**Execution order:** 3 of 10  
**Classification:** FOUNDATIONAL — Where dropdown options come from; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Layout (UI, Dropdowns)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define the single source of truth for section, card, and organ internal layout dropdown options. Options = registry IDs filtered by compatibility; no hardcoded option lists in UI code.

---

## Current Runtime (Verified)

| Dropdown | ID source | Filter | Where used |
|----------|-----------|--------|------------|
| Section layout | `getLayout2Ids()` → getPageLayoutIds() (page-layouts.json keys) | layoutIds.filter(id => evaluateCompatibility({ sectionNode, sectionLayoutId: id }).sectionValid) | SectionLayoutDropdown (dev), OrganPanel section dropdown |
| Card layout | getAllowedCardPresetsForSectionPreset(sectionLayoutId) then filter | evaluateCompatibility(..., cardLayoutId: candidateId).cardValid | OrganPanel card dropdown |
| Organ internal layout | getInternalLayoutIds(organId) from organ-layout-profiles.json | evaluateCompatibility(..., organInternalLayoutId: candidateId).organValid !== false | OrganPanel organ internal dropdown |

Card allow-list currently lives in `src/layout/page/capabilities.ts` (SECTION_TO_CARD_CAPABILITIES). Plan 6 covers moving to JSON and removing fallback.

---

## Contract: Single Source of Truth

1. **Section layout options:** Union of (a) all section layout IDs from the page layout registry (getPageLayoutIds / getLayout2Ids), (b) filtered to those for which evaluateCompatibility(..., sectionLayoutId: id).sectionValid is true for the current section node. No separate hardcoded list of section layout IDs in the dropdown component.
2. **Card layout options:** For the current section’s layout ID, allowed card preset IDs come from the section→card allow-list (today capabilities.ts; target JSON). That list is then filtered by evaluateCompatibility(..., cardLayoutId: candidateId).cardValid. No hardcoded card list in UI.
3. **Organ internal layout options:** For the current section’s organ role, internal layout IDs come from getInternalLayoutIds(organId) (organ-layout-profiles.json). Filter by evaluateCompatibility(..., organInternalLayoutId: candidateId).organValid !== false. No hardcoded organ internal list in UI.

---

## What Dropdown Options Can and Cannot Do

| Can | Cannot |
|-----|--------|
| Be derived from registry + compatibility only. | Be a fixed list in TSX/TS that is not sourced from layout registries. |
| Update automatically when new layouts are added to JSON (and requirements). | Require code changes to show new layout IDs in dropdowns. |

---

## How It Connects to Compatibility and Registries

- **Plan 1 (Compatibility):** evaluateCompatibility is the filter; options are the subset of registry IDs that pass.
- **Plan 2 (Registry):** Registry is the authority for "which IDs exist"; dropdown never invents IDs.
- **Renderer:** Does not use dropdown option list for resolution; resolution uses override → explicit → suggestion → default. Dropdowns only affect user overrides when user selects a value.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*

---

## Verification Report (Step 3)

**Plan:** [3_DROPDOWN_SOURCE_OF_TRUTH_PLAN.md](3_DROPDOWN_SOURCE_OF_TRUTH_PLAN.md)  
**Scope:** Verify dropdown options = registry IDs filtered by compatibility; no hardcoded option lists in UI.  
**Date:** 2025-02-04

---

### Summary

| Check | Status |
|-------|--------|
| Section layout: ID source = getLayout2Ids() / getPageLayoutIds() | ✅ PASS |
| Section layout: filter = evaluateCompatibility(..., sectionLayoutId).sectionValid | ✅ PASS |
| Card layout: ID source = getAllowedCardPresetsForSectionPreset(sectionLayoutId) | ✅ PASS |
| Card layout: filter = evaluateCompatibility(..., cardLayoutId).cardValid | ✅ PASS |
| Organ internal: ID source = getInternalLayoutIds(organId) | ✅ PASS |
| Organ internal: filter = organValid !== false | ✅ PASS |
| No hardcoded layout ID lists in dropdown components | ✅ PASS |

**Overall: PASS** — All dropdown options are derived from registry + compatibility; no fixed lists in UI code.

---

### 1. Dropdown-by-dropdown verification

#### 1.1 Section layout dropdown

| Contract | Implementation | Verified |
|----------|----------------|----------|
| ID source = getPageLayoutIds() (page-layouts.json keys) | SectionLayoutDropdown: `layoutIds = getLayout2Ids()` (→ getPageLayoutIds()). OrganPanel: `allSectionLayoutIds = getLayout2Ids()`, `presetOptions = sectionPresetOptions?.[sectionKey] ?? allSectionLayoutIds`. | ✅ |
| Filter = sectionValid for current section node | SectionLayoutDropdown: `layoutIds.filter(id => evaluateCompatibility({ sectionNode: s, sectionLayoutId: id }).sectionValid)`. OrganPanel: `presetOptions.filter(..., sectionValid)`. | ✅ |
| Where used | SectionLayoutDropdown (dev), OrganPanel section dropdown. page.tsx passes getLayout2Ids() as sectionPresetOptions (same registry source). | ✅ |

#### 1.2 Card layout dropdown

| Contract | Implementation | Verified |
|----------|----------------|----------|
| Allowed IDs from section→card allow-list (capabilities.ts) | OrganPanel: `allowedCardPresets = getAllowedCardPresetsForSectionPreset(currentSectionPreset \|\| null)`. | ✅ |
| Filter = cardValid | `allowedCardPresets.filter(..., cardValid)`. | ✅ |
| Where used | OrganPanel card dropdown only. | ✅ |

#### 1.3 Organ internal layout dropdown

| Contract | Implementation | Verified |
|----------|----------------|----------|
| IDs from getInternalLayoutIds(organId) (organ-layout-profiles.json) | OrganPanel: `internalLayoutIds = organId ? getInternalLayoutIds(organId) : []`. | ✅ |
| Filter = organValid !== false | `internalLayoutIds.filter(..., organValid !== false)`. | ✅ |
| Where used | OrganPanel organ internal dropdown (when organId and internalLayoutIds.length > 0). | ✅ |

---

### 2. Single source of truth

- **Section options:** No hardcoded section layout IDs in SectionLayoutDropdown or OrganPanel. Both use getLayout2Ids() (→ getPageLayoutIds()). Options = that set filtered by evaluateCompatibility(..., sectionLayoutId).sectionValid. ✅  
- **Card options:** No hardcoded card preset list in OrganPanel. Options = getAllowedCardPresetsForSectionPreset(sectionLayoutId) filtered by cardValid. ✅  
- **Organ internal options:** No hardcoded organ internal IDs. Options = getInternalLayoutIds(organId) filtered by organValid !== false. ✅  

---

### 3. Optional prop (OrganPanel)

OrganPanel accepts `sectionPresetOptions?: Record<string, string[]>`. When provided, it is used instead of allSectionLayoutIds for that section. In page.tsx, sectionPresetOptions is built from getLayout2Ids(), so the source remains the registry. The prop allows a parent to pass a list (e.g. pre-filtered or from the same registry); it is not a hardcoded list inside the component. Contract satisfied. ✅  

---

### 4. Connection to Plans 1 and 2

- **Plan 1 (Compatibility):** evaluateCompatibility is used as the filter in all three dropdowns; options are the subset of registry IDs that pass. ✅  
- **Plan 2 (Registry):** getLayout2Ids(), getInternalLayoutIds(), getAllowedCardPresetsForSectionPreset() supply "which IDs exist"; dropdowns do not invent IDs. ✅  

---

### Conclusion

Step 3 (Dropdown Source of Truth) is **verified**. Section, card, and organ internal dropdown options are derived from layout registries and filtered by evaluateCompatibility. No hardcoded option lists exist in the dropdown UI code.

**Next:** Proceed to Step 4 — [4_SUGGESTION_INTAKE_AND_PRECEDENCE_PLAN.md](4_SUGGESTION_INTAKE_AND_PRECEDENCE_PLAN.md) when ready.
