# 1 — Layout Compatibility Contract Plan

**Execution order:** 1 of 10  
**Classification:** FOUNDATIONAL — Slot names, required vs available, compatibility API; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Layout (Compatibility)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define the formal contract for layout compatibility: slot names, required vs available slots, and the evaluateCompatibility API. Layout compatibility validates structure only; it cannot change content or layout selection.

---

## Current Runtime (Verified)

| Component | Path | Role |
|-----------|------|------|
| Requirement registry | `src/layout/compatibility/requirement-registry.ts` | `getRequiredSlots(layoutType, layoutId)`, `getRequiredSlotsForOrgan(organId, internalLayoutId)`; reads section/card/organ requirement JSON. |
| Content capability extractor | `src/layout/compatibility/content-capability-extractor.ts` | `getAvailableSlots(sectionNode, options?)`; derives slots from section content/children/role; normalizes per SLOT_NAMES.md. |
| Compatibility evaluator | `src/layout/compatibility/compatibility-evaluator.ts` | `evaluateCompatibility(args)` → `{ sectionValid, cardValid, organValid?, missing }`; pure, no store access. |
| Slot convention | `src/layout/requirements/SLOT_NAMES.md` | Section/card: heading, body, image, card_list; organ slots from organ profile capabilities. |

---

## Slot Name Contract

| Scope | Slot names | Source |
|-------|------------|--------|
| Section / card | heading, body, image, card_list | SLOT_NAMES.md; content-capability-extractor normalizes (e.g. title → heading, card → card_list). |
| Organ internal | Per organ: title, items, primary, logo, cta, etc. | organ-layout-profiles.json capabilities.slots; extractor maps canonical slots to organ slots when section.role is organ. |

Layout **cannot** introduce new slot names in code; new slots require JSON and SLOT_NAMES.md update. Requirement JSON and extractor must stay aligned.

---

## Required vs Available

- **Required:** From requirement registries (section-layout-requirements.json, card-layout-requirements.json, organ-internal-layout-requirements.json). Empty or missing `requires` = no required slots (always valid).
- **Available:** From `getAvailableSlots(sectionNode)` — section content keys and child types plus organ slots when role is organ.
- **Compatibility:** A layout ID is compatible for a section when every required slot is in the available set. No scoring; boolean per dimension (sectionValid, cardValid, organValid).

---

## What Layout Compatibility Can and Cannot Do

| Can | Cannot |
|-----|--------|
| Return compatibility result (sectionValid, cardValid, organValid, missing). | Change section content, node.layout, or any store. |
| Be used to filter dropdown options and to log mismatches (dev). | Block rendering or auto-change selection when invalid; filtering is advisory for options only. |
| Read section node (structure, content, children, role) read-only. | Mutate the section node or any other input. |

---

## How It Connects to Resolver and Renderer

- **Resolver:** Does not call evaluateCompatibility to decide layout ID; precedence (override → explicit → suggestion → default) decides. Compatibility is used to filter which IDs are offered (dropdowns) and optionally to log.
- **Renderer:** applyProfileToNode may call evaluateCompatibility for dev logging; result is not used to branch or override layout.
- **Dropdowns:** SectionLayoutDropdown and OrganPanel filter options by evaluateCompatibility so only structurally valid IDs are shown.

---

## Determinism Rules

- Same section node + layout IDs ⇒ same compatibility result. No side effects; pure function.
- Slot names are stable; normalization (lowercase, trim) is part of the contract so IDs and slots match across registry and extractor.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*
