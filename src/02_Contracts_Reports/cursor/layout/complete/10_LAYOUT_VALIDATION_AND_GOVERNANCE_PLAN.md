# 10 — Layout Validation and Governance Plan

**Execution order:** 10 of 10  
**Classification:** FOUNDATIONAL — Requirement coverage, slot governance, diagnostics; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Layout (Governance, Validation)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define how layout JSON and requirement registries are kept consistent: full coverage of layout IDs in requirement files, slot name governance (SLOT_NAMES.md), validation of new layout JSON, and optional diagnostics/dev tools for compatibility and usage.

---

## Requirement Registry Coverage

- **Section layouts:** Every layout ID in page-layouts.json (and thus getPageLayoutIds) should have an entry in section-layout-requirements.json — either with a "requires" array (possibly empty) or explicitly documented as "no required slots." No layout ID in use should be missing from the requirement registry; unknown ID returns [] today (treated as always valid).
- **Card layouts:** Every card preset ID used in section→card allow-list and in card dropdowns should have an entry in card-layout-requirements.json.
- **Organ internal layouts:** For each organ in organ-layout-profiles.json, every internalLayoutId should have an entry in organ-internal-layout-requirements.json under that organId. Missing entry ⇒ getRequiredSlotsForOrgan returns [] (always valid); governance recommends explicit entries for clarity.

---

## Slot Name Governance

- **Single convention doc:** SLOT_NAMES.md (`src/layout/requirements/SLOT_NAMES.md`) is the authority for section/card slot names (heading, body, image, card_list) and the note that organ slots come from organ profile capabilities. Any new section/card slot requires updating SLOT_NAMES.md and the content-capability-extractor normalization (and requirement JSON) so extractor and registries stay aligned.
- **Organ slots:** Defined per organ in organ-layout-profiles.json capabilities.slots; organ-internal-layout-requirements.json uses those names. Adding a new organ slot is a data change (profile + requirements); no new slot name in code without doc and extractor update.

---

## Validation of New Layout JSON

- **Process (documented):** To add a new section layout: (1) Add to page-layouts.json and optionally component-layouts.json, (2) Add to section-layout-requirements.json with requires array, (3) If section→card allow-list is JSON, add mapping. No resolver or compatibility-evaluator code change. Same idea for card and organ internal.
- **Consistency checks (optional tooling):** Dev or CI can validate: every ID in page-layouts.json exists in section-layout-requirements.json; every ID in section→card JSON exists in card-layout-requirements.json; every organ internalLayoutId has organ-internal-layout-requirements entry. Plan does not mandate implementation; contract is that coverage is maintained.

---

## Diagnostics and Dev Tools

- **Layout usage (optional):** Dev-only tracking of which section/card/organ layout IDs are used per screen or per section; log or emit counts. No production impact; no state change to layout selection. (See MASTER_ENGINE_COMPLETION_ROADMAP Phase 3.)
- **Compatibility mismatch logging:** When evaluateCompatibility returns invalid (sectionValid/cardValid/organValid false), log or collect mismatch details (section key, layout IDs, missing slots). Optional dev panel or console summary. No auto-fix or fallback.
- **Layout diagnostic utility:** List all sections with current layout IDs, required slots, available slots, and compatibility result; optional export as JSON report. Document how to run (e.g. dev-only route or tool).

---

## What Validation and Governance Can and Cannot Do

| Can | Cannot |
|-----|--------|
| Define coverage rules and slot convention; recommend audits and optional tooling. | Enforce coverage at runtime (e.g. block render if requirement missing); governance is process and optional validation. |
| Document process for adding layouts (JSON steps only). | Require TypeScript changes for every new layout ID when registries are used correctly. |

---

## How It Connects to Plan 1 and 2

- **Plan 1 (Compatibility):** Slot names and requirement structure are shared; governance keeps SLOT_NAMES.md and requirement JSON aligned with content-capability-extractor.
- **Plan 2 (Registry):** Registries are the source of truth; governance ensures every layout in use has a requirement entry (or explicit "no required slots") so compatibility is well-defined.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*

---

## Verification Report (Step 10)

**Plan:** [10_LAYOUT_VALIDATION_AND_GOVERNANCE_PLAN.md](10_LAYOUT_VALIDATION_AND_GOVERNANCE_PLAN.md)  
**Scope:** Verify requirement registry coverage, slot governance (SLOT_NAMES.md), no runtime enforcement; document process and optional tooling.  
**Date:** 2025-02-04

---

### Summary

| Check | Status |
|-------|--------|
| Section layout coverage: every page-layouts.json ID in section-layout-requirements.json | ✅ PASS |
| Card layout coverage: every card preset in use in card-layout-requirements.json | ✅ PASS |
| Organ internal coverage: every organ internalLayoutId in organ-internal-layout-requirements.json | ✅ PASS |
| SLOT_NAMES.md is single convention doc; extractor and registries aligned | ✅ PASS |
| Unknown layout ID returns [] (no runtime block); governance is process/optional | ✅ PASS |
| No runtime enforcement (block render if requirement missing) | ✅ PASS |

**Overall: PASS** — Coverage is complete; slot governance in place; validation is process and optional tooling, not runtime enforcement.

---

### 1. Requirement registry coverage audit

#### 1.1 Section layouts

| Source | IDs |
|--------|-----|
| page-layouts.json (getPageLayoutIds) | hero-centered, hero-split, hero-split-image-right, hero-split-image-left, hero-full-bleed-image, content-narrow, content-stack, image-left-text-right, features-grid-3, feature-grid-3, testimonial-band, cta-centered, test-extensible (13) |
| section-layout-requirements.json layoutRequirements | Same 13 keys; each has "requires" (array, possibly empty). |

**Result:** Full coverage. Every section layout ID in page-layouts.json has an entry in section-layout-requirements.json. ✅  

#### 1.2 Card layouts

| Source | IDs |
|--------|-----|
| card-layout-requirements.json | image-top, image-left, image-right, image-bottom, centered-card, centered-image-left, centered-image-right (7) |
| SECTION_TO_CARD_CAPABILITIES (section→card allow-list) | Values reference only these 7 card preset IDs. |

**Result:** Full coverage. Every card preset ID used in the allow-list and dropdowns has an entry in card-layout-requirements.json. ✅  

#### 1.3 Organ internal layouts

For each organ in organ-layout-profiles.json, every internalLayoutId was checked against organ-internal-layout-requirements.json:

| organId | internalLayoutIds (profile) | organ-internal-layout-requirements entry |
|---------|-----------------------------|----------------------------------------|
| hero | 9 ids | ✅ All 9 present |
| header | 12 ids | ✅ All 12 present |
| nav | 4 ids | ✅ All 4 present |
| footer | 5 ids | ✅ All 5 present |
| content-section | 4 ids | ✅ All 4 present |
| features-grid | 4 ids | ✅ All 4 present |
| gallery | 4 ids | ✅ All 4 present |
| testimonials | 4 ids | ✅ All 4 present |
| pricing | 5 ids | ✅ All 5 present |
| faq | 3 ids | ✅ All 3 present |
| cta | 4 ids | ✅ All 4 present |

**Result:** Full coverage. Every organ's internalLayoutIds have a corresponding entry under that organId in organ-internal-layout-requirements.json. ✅  

---

### 2. Slot name governance

| Contract | Verified |
|----------|----------|
| SLOT_NAMES.md at `src/layout/requirements/SLOT_NAMES.md` is the authority for section/card slot names (heading, body, image, card_list) | ✅ Doc exists and lists these four. |
| Organ slots from organ profile capabilities.slots; organ-internal-layout-requirements uses those names | ✅ organ-layout-profiles.json has capabilities.slots where applicable; requirement JSON uses title, items, primary, logo, cta, etc. |
| Content-capability-extractor normalizes per SLOT_NAMES.md (e.g. title→heading, card→card_list) | ✅ Verified in Step 1; CHILD_TYPE_TO_SLOT and normalizeToSlot align with doc. |
| New section/card slot requires SLOT_NAMES.md + extractor + requirement JSON update | ✅ Documented in plan; process only (no code change in this step). |

---

### 3. Unknown ID behavior

| Contract | Verified |
|----------|----------|
| Unknown section/card/organ layout ID in getRequiredSlots / getRequiredSlotsForOrgan returns [] (treated as always valid) | ✅ requirement-registry returns [] when entry missing (Step 1). |
| No runtime enforcement: do not block render if requirement missing | ✅ evaluateCompatibility is not used to block or override layout in json-renderer; only dev logging. |

---

### 4. Validation and governance can / cannot

| Can | Verified |
|-----|----------|
| Define coverage rules and slot convention; recommend audits and optional tooling | ✅ Plan defines rules; this report is an audit; optional CI/tooling not mandated. |
| Document process for adding layouts (JSON steps only) | ✅ Plan and LAYOUT_PLANS_INDEX / Plan 2 describe JSON-only extension. |

| Cannot | Verified |
|--------|----------|
| Enforce coverage at runtime (e.g. block render if requirement missing) | ✅ Resolver and renderer do not block on missing requirement; unknown ID ⇒ []. |
| Require TypeScript changes for every new layout ID when registries used correctly | ✅ New layouts added via JSON only (Plan 2). |

---

### 5. Process for adding new layout (documented)

- **Section:** Add to page-layouts.json (+ component-layouts.json if needed); add to section-layout-requirements.json with requires array; if section→card is JSON, add mapping. No resolver/evaluator code change.
- **Card:** Add preset to card source; add to card-layout-requirements.json.
- **Organ internal:** Add internalLayoutId to organ in organ-layout-profiles.json; add entry in organ-internal-layout-requirements.json for that organId and internalLayoutId.

Optional consistency checks (CI or dev tool): validate every page-layouts ID in section-layout-requirements; every section→card card ID in card-layout-requirements; every organ internalLayoutId in organ-internal-layout-requirements. Plan does not mandate implementation; contract is that coverage is maintained. ✅  

---

### 6. Diagnostics and dev tools (optional)

- **Layout usage / compatibility mismatch / diagnostic utility:** Plan describes optional dev-only logging, mismatch details, and layout diagnostic report. Not implemented in this step; no production impact. ✅  

---

### Conclusion

Step 10 (Layout Validation and Governance) is **verified**. Requirement registry coverage is complete for section, card, and organ internal layouts. SLOT_NAMES.md is the slot convention; extractor and requirement JSON are aligned. Unknown ID returns []; there is no runtime enforcement (no block on missing requirement). Governance is process and optional validation/tooling as defined in the plan.

---

### Layout Plans 1–10 verification complete

All 10 layout planned steps have been verified. Summary:

| Step | Plan | Result |
|------|------|--------|
| 1 | Layout Compatibility Contract | PASS |
| 2 | Layout Registry | PASS (gap: card allow-list fallback for unknown section ID) |
| 3 | Dropdown Source of Truth | PASS |
| 4 | Suggestion Intake and Precedence | PASS |
| 5 | Layout Resolver Refactor | PASS |
| 6 | Fallback Removal and JSON Defaulting | PASS (gap: card allow-list in TS + fallback) |
| 7 | Override System Alignment | PASS |
| 8 | Explainability and Trace | PASS (contract only; implementation planned future) |
| 9 | Layout–Logic Interface Finalization | PASS |
| 10 | Layout Validation and Governance | PASS |
