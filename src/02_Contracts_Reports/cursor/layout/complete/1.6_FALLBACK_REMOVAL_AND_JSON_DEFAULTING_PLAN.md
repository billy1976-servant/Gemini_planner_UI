# 6 — Fallback Removal and JSON Defaulting Plan

**Execution order:** 6 of 10  
**Classification:** FOUNDATIONAL — No code fallbacks; defaults from JSON only; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Layout (Defaults, Fallbacks)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define the rule that layout defaults come from JSON/template data only and that code-level fallbacks (e.g. "unknown section → all card presets" or "missing template → hardcoded layout ID") are removed or replaced by explicit behavior (undefined or empty set).

---

## Current Runtime (Verified)

| Area | Current behavior | Target |
|------|-------------------|--------|
| Section layout default | getDefaultSectionLayoutId(templateId) reads templates[templateId]["defaultLayout"]; returns undefined when no template or no key. Template-profiles.ts has defaultSectionLayoutId per template (used in applyProfileToNode as profile.defaultSectionLayoutId). | Single canonical source: either templates.json defaultLayout or template-profiles defaultSectionLayoutId; document which is authoritative. No code constant fallback. |
| Section layout ID unknown | getPageLayoutById(id) returns null; resolveLayout returns null; Section gets layout undefined and renders div. | Keep; no fallback ID. |
| Card allow-list | getAllowedCardPresetsForSectionPreset(sectionLayoutId) returns SECTION_TO_CARD_CAPABILITIES[id] ?? [...ALL_CARD_PRESETS]. Unknown section ID ⇒ all card presets (code fallback). | Move section→card mapping to JSON; for unknown section ID return empty array or defined default from JSON, not "all presets" in code. |
| Organ internal default | resolveInternalLayoutId(organId, layoutId) uses profile.defaultInternalLayoutId when requested ID invalid or missing. Organ profile is JSON. | Keep; default from organ-layout-profiles.json only. |

---

## Contract: No Silent Fallbacks

1. **Section layout:** No code path may set a section layout ID to a hardcoded string (e.g. "content-narrow") when override, explicit, and template default are all absent. Result is undefined; Section receives undefined and renders without LayoutMoleculeRenderer (div wrapper).
2. **Template default:** Default section layout for a template must come from (a) templates.json entry (e.g. defaultLayout) or (b) template-profiles defaultSectionLayoutId — one canonical source, documented. Not from a constant in resolver or engine.
3. **Card options per section:** Section→card allow-list must be data-driven (JSON). When section layout ID is unknown or missing from the allow-list, return an explicit value: empty array (no card options) or a single JSON-defined default list, not ALL_CARD_PRESETS in code.
4. **Requirement registry:** Unknown layout ID in getRequiredSlots / getRequiredSlotsForOrgan returns [] (no required slots). No fallback to another layout’s requirements.

---

## What Defaulting Can and Cannot Do

| Can | Cannot |
|-----|--------|
| Use template JSON or template-profiles for default section layout. | Use a layout ID constant in code when template/default are missing. |
| Use JSON for section→card allow-list and define behavior for unknown section ID in that JSON or contract (e.g. empty list). | Fall back to "all card presets" or "first layout in list" in TypeScript when section ID is unknown. |

---

## "No Layout" Path (Documented)

When section layout is undefined: Section compound receives layout undefined → resolveLayout(undefined) → null → Section renders `<div data-section-id={id}>{children}</div>`. This is explicit, not an error. No silent switch to another layout.

---

## How It Connects to Plan 2 and 3

- **Plan 2 (Registry):** Registries are the source for IDs and defaults; no code invents IDs or default lists.
- **Plan 3 (Dropdown):** Dropdown options for card layouts use the section→card allow-list (after migration to JSON); unknown section ⇒ no options or JSON-defined default, not ALL_CARD_PRESETS.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*

---

## Verification Report (Step 6)

**Plan:** [6_FALLBACK_REMOVAL_AND_JSON_DEFAULTING_PLAN.md](6_FALLBACK_REMOVAL_AND_JSON_DEFAULTING_PLAN.md)  
**Scope:** Verify no code fallbacks; defaults from JSON/template only; document gaps (card allow-list, canonical template default).  
**Date:** 2025-02-04

---

### Summary

| Check | Status |
|-------|--------|
| Section layout default: from JSON/template only; no hardcoded ID in resolver or engine | ✅ PASS |
| Section layout ID unknown: null/undefined → Section renders div | ✅ PASS |
| Template default: two sources (templates.json defaultLayout, template-profiles defaultSectionLayoutId); no code constant | ✅ PASS (note: canonical source not yet single) |
| Card allow-list: section→card in TS; unknown section ID ⇒ ALL_CARD_PRESETS | ⚠️ GAP |
| Organ internal default: from organ-layout-profiles.json only | ✅ PASS |
| Requirement registry: unknown layout ID ⇒ [] | ✅ PASS |
| "No layout" path documented (Section → div) | ✅ PASS |

**Overall: PASS with one gap** — Section/organ defaults and "no layout" path comply; card allow-list still has code fallback and is in TS (target: JSON + explicit behavior for unknown ID).

---

### 1. Section layout default

| Contract | Current behavior | Verified |
|----------|------------------|----------|
| No code path sets section layout to a hardcoded ID when override, explicit, and template default are absent | applyProfileToNode: layoutId = overrideId \|\| existingLayoutId \|\| templateDefaultLayoutId \|\| undefined. No else-branch constant. | ✅ |
| Default from (a) templates.json defaultLayout or (b) template-profiles defaultSectionLayoutId | applyProfileToNode uses profile.defaultSectionLayoutId first, then getDefaultSectionLayoutId(templateId). getDefaultSectionLayoutId reads templates[templateId]["defaultLayout"]; returns undefined when missing. Template-profiles.ts has defaultSectionLayoutId per template (injected as profile in page.tsx). | ✅ |
| Not from a constant in resolver or engine | page-layout-resolver returns undefined when no template or no defaultLayout key; no fallback ID. | ✅ |

**Note:** Two sources are in use (profile.defaultSectionLayoutId from template-profiles, and getDefaultSectionLayoutId from templates.json). Plan target: "Single canonical source, documented." Current state complies with "no code constant fallback"; clarifying a single authoritative source is a documentation/design follow-up, not a runtime violation.

---

### 2. Section layout ID unknown

| Contract | Verified |
|----------|----------|
| getPageLayoutById(id) returns null for unknown ID | ✅ |
| resolveLayout returns null; Section receives layout undefined | ✅ |
| Section renders `<div data-section-id={id}>{children}</div>` (explicit, not error) | ✅ (SectionCompound when effectiveDef is null) |

---

### 3. Card allow-list (GAP)

| Contract | Current behavior | Status |
|----------|------------------|--------|
| Section→card allow-list data-driven (JSON) | SECTION_TO_CARD_CAPABILITIES is in `src/layout/page/capabilities.ts` (TypeScript). | ⚠️ GAP — target is JSON |
| Unknown section ID: empty array or JSON-defined default, not ALL_CARD_PRESETS in code | `getAllowedCardPresetsForSectionPreset`: `return allowed ?? [...ALL_CARD_PRESETS]` for unknown/missing id. | ⚠️ GAP — code fallback |

**Target (from plan):** Move section→card mapping to JSON; for unknown section ID return empty array or a JSON-defined default, not "all presets" in code. Implementation deferred to a later change; gap documented.

---

### 4. Organ internal default

| Contract | Verified |
|----------|----------|
| resolveInternalLayoutId uses profile.defaultInternalLayoutId when requested ID invalid or missing | ✅ (organ-layout-resolver.ts) |
| Organ profile from JSON (organ-layout-profiles.json) only | ✅ No code fallback for organ default |

---

### 5. Requirement registry

| Contract | Verified |
|----------|----------|
| Unknown layout ID in getRequiredSlots / getRequiredSlotsForOrgan returns [] | ✅ (Step 1/2) |
| No fallback to another layout's requirements | ✅ |

---

### 6. "No layout" path

| Contract | Verified |
|----------|----------|
| Section layout undefined → resolveLayout(undefined) → null → Section renders div | ✅ |
| Explicit, not an error; no silent switch to another layout | ✅ |

---

### 7. Defaulting can / cannot

| Can | Verified |
|-----|----------|
| Use template JSON or template-profiles for default section layout | ✅ |
| Use JSON for section→card allow-list and define behavior for unknown in JSON/contract | ⚠️ Not yet (card allow-list still TS + code fallback) |

| Cannot | Verified |
|--------|----------|
| Use a layout ID constant in code when template/default are missing | ✅ No such constant |
| Fall back to "all card presets" or "first layout in list" in TS when section ID unknown | ⚠️ Card: getAllowedCardPresetsForSectionPreset still does `?? [...ALL_CARD_PRESETS]` |

---

### Conclusion

Step 6 (Fallback Removal and JSON Defaulting) is **verified** with one **gap**:

- **Compliant:** Section layout default from JSON/template only; no layout ID constant; unknown section layout ID → undefined/div; organ default from JSON; requirement registry returns [] for unknown; "no layout" path is explicit.
- **Gap:** Card allow-list remains in TypeScript (`capabilities.ts`) and returns `ALL_CARD_PRESETS` for unknown section ID. Plan target: move to JSON and use empty array or JSON-defined default for unknown. No code change in this step; gap recorded for future implementation.

**Next:** Proceed to Step 7 — [7_OVERRIDE_SYSTEM_ALIGNMENT_PLAN.md](7_OVERRIDE_SYSTEM_ALIGNMENT_PLAN.md) when ready.
