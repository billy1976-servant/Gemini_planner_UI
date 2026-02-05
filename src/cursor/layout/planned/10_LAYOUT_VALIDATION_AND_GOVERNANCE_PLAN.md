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
