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

---

## Verification Report (Step 1)

**Plan:** [1_LAYOUT_COMPATIBILITY_CONTRACT_PLAN.md](1_LAYOUT_COMPATIBILITY_CONTRACT_PLAN.md)  
**Scope:** Verify runtime matches the contract (design doc only; no code changes).  
**Date:** 2025-02-04

---

### Summary

| Check | Status |
|-------|--------|
| Requirement registry present and contract-compliant | ✅ PASS |
| Content capability extractor present and contract-compliant | ✅ PASS |
| Compatibility evaluator present and contract-compliant | ✅ PASS |
| SLOT_NAMES.md present and aligned | ✅ PASS |
| Requirement JSON files use contract slot names | ✅ PASS |
| Compatibility used for filtering only; no mutation | ✅ PASS |
| Determinism (pure, same inputs ⇒ same result) | ✅ PASS |

**Overall: PASS** — Runtime matches the Layout Compatibility Contract. No changes required for Step 1.

---

### 1. Component verification

#### 1.1 Requirement registry (`src/layout/compatibility/requirement-registry.ts`)

| Contract | Verified |
|----------|----------|
| `getRequiredSlots(layoutType, layoutId, organId?)` returns string[] | ✅ |
| `getRequiredSlotsForOrgan(organId, internalLayoutId)` returns string[] | ✅ |
| Reads section/card/organ requirement JSON | ✅ (section-layout-requirements.json, card-layout-requirements.json, organ-internal-layout-requirements.json) |
| Empty or missing `requires` ⇒ [] (always valid) | ✅ |
| ID normalization (trim, lowercase) | ✅ `normalizeId()` |

#### 1.2 Content capability extractor (`src/layout/compatibility/content-capability-extractor.ts`)

| Contract | Verified |
|----------|----------|
| `getAvailableSlots(sectionNode, options?)` returns string[] | ✅ |
| Read-only; does not modify section node | ✅ (no mutations) |
| Normalizes per SLOT_NAMES.md (title→heading, card→card_list) | ✅ `CHILD_TYPE_TO_SLOT` + `normalizeToSlot()` |
| Organ slots from organ profile when section.role is organ | ✅ `addOrganSlots()` using `getOrganLayoutProfile(role).capabilities.slots` |
| Options: `includeOrganSlots` (default true) | ✅ |

#### 1.3 Compatibility evaluator (`src/layout/compatibility/compatibility-evaluator.ts`)

| Contract | Verified |
|----------|----------|
| `evaluateCompatibility(args)` → `{ sectionValid, cardValid, organValid?, missing }` | ✅ |
| Pure; no store access | ✅ (only registry + extractor calls) |
| Section valid ⇔ every required section slot in available | ✅ |
| Card valid ⇔ every required card slot in available | ✅ |
| Organ valid (when organId + organInternalLayoutId) ⇔ every required organ slot in available | ✅ |
| `missing`: union of missing slots | ✅ (deduplicated) |

#### 1.4 Slot convention (`src/layout/requirements/SLOT_NAMES.md`)

| Contract | Verified |
|----------|----------|
| Section/card slots: heading, body, image, card_list | ✅ |
| Organ internal: per-organ from capabilities.slots (title, items, primary, logo, cta, etc.) | ✅ Documented |
| Normalization rules documented | ✅ |

---

### 2. Requirement JSON alignment

| File | Slot names used | Contract |
|------|-----------------|----------|
| section-layout-requirements.json | heading, body, image, card_list | ✅ Only section/card slots |
| card-layout-requirements.json | image (and empty) | ✅ |
| organ-internal-layout-requirements.json | heading, body, image, title, items, primary, logo, cta | ✅ Organ + section-style where applicable (e.g. hero) |

---

### 3. Usage (can / cannot)

| Rule | Verified |
|------|----------|
| Returns result only; does not change content or layout selection | ✅ |
| Used to filter dropdown options | ✅ `section-layout-dropdown.tsx` filters by `sectionValid`; `OrganPanel.tsx` filters section/card/organ options by compatibility |
| Optional dev logging | ✅ `json-renderer.tsx` calls `evaluateCompatibility` and logs only in `NODE_ENV === "development"`; result not used to branch or override |
| Does not block rendering or auto-change selection | ✅ Layout resolution uses override → explicit → suggestion → default; compatibility is not used there |

---

### 4. Determinism

| Rule | Verified |
|------|----------|
| Same section node + layout IDs ⇒ same result | ✅ No store or external state; pure data in, result out |
| Slot/ID normalization (lowercase, trim) in registry and extractor | ✅ Both use trim + lowercase for IDs/slots |

---

### 5. Exports and wiring

- `src/layout/compatibility/index.ts` exports: `evaluateCompatibility`, `getAvailableSlots`, `getRequiredSlots`, `getRequiredSlotsForOrgan` and relevant types. ✅
- `src/layout/index.ts` re-exports compatibility API. ✅

---

### Conclusion

Step 1 (Layout Compatibility Contract) is **verified**. The runtime implements the contract described in the plan: slot names, required vs available, evaluateCompatibility API, read-only behavior, and use for filtering only. No implementation changes are required for this step.

**Next:** Proceed to Step 2 — [2_LAYOUT_REGISTRY_PLAN.md](2_LAYOUT_REGISTRY_PLAN.md) when ready.
