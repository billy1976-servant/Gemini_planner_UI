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
