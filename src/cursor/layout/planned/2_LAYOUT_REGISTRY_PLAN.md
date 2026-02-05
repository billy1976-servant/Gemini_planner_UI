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
