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
