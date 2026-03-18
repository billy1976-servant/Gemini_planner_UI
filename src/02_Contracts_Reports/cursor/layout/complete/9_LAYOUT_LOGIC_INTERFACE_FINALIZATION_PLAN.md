# 9 — Layout–Logic Interface Finalization Plan

**Execution order:** 9 of 10  
**Classification:** FOUNDATIONAL — What Layout exposes to Logic and how suggestion flows; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN, src/cursor/logic/planned

**Domain:** Architecture (Layout, Logic)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Finalize the Layout–Logic interface: what Layout exposes to Logic (capabilities, compatible sets, layout ID lists) and how Logic supplies suggestion only. Align with Logic Plan 1 (Logic–Layout Contract) and Logic Plan 8 (Suggestion Injection Point). Layout never asks Logic to "apply" a layout; Layout resolver applies precedence and writes.

---

## What Layout Exposes to Logic

| Data | Description | Source / API |
|------|-------------|--------------|
| **Available slots** | Content slot names for a section (heading, body, image, card_list; organ slots when role is organ). | getAvailableSlots(sectionNode, options?) from `src/layout/compatibility/content-capability-extractor.ts`; exported via `@/layout`. |
| **Compatibility result** | Whether given section/card/organ layout IDs are structurally valid for a section. | evaluateCompatibility({ sectionNode, sectionLayoutId, cardLayoutId, organId, organInternalLayoutId }) → { sectionValid, cardValid, organValid?, missing }; `src/layout/compatibility/compatibility-evaluator.ts`. |
| **Section layout ID set** | All section (page) layout IDs; and the compatible subset for a section. | getLayout2Ids() / getPageLayoutIds(); compatible subset = filter by evaluateCompatibility(..., sectionLayoutId: id).sectionValid. |
| **Card layout ID set** | Allowed card presets for a section layout; compatible subset. | getAllowedCardPresetsForSectionPreset(sectionLayoutId) (today capabilities.ts); filter by cardValid. |
| **Organ internal layout ID set** | Valid internal layout IDs for an organ type; compatible subset. | getInternalLayoutIds(organId) from layout-organ; filter by organValid. |

Layout does **not** expose: write APIs for Logic to mutate layout store, override stores, or node.layout. Layout never asks Logic to "apply" a layout; resolver applies precedence and writes.

---

## What Logic Supplies to Layout

| Data | Description | Constraint |
|------|-------------|------------|
| **Recommended layout ID** | One layout ID when Decision Engine (Logic Plan 5) scores compatible layouts. | Must be an element of the compatible set supplied by Layout. Returned at the single injection point (Logic Plan 8); Logic does not write to any store. |
| **Optional explanation** | suggestionDetail for explainability (Plan 8, Logic Plan 10). | Read-only; no side effects. |

Logic does **not** send: raw layout IDs from rules (only from trait registry + compatible set); direct store writes; or overrides.

---

## Rule: Logic Suggests, Layout Resolves

- **Logic** produces a recommended layout ID (and optional explanation) from the compatible set. It does not write to layout store or node.layout.
- **Layout resolver** is the single place that chooses the final layout ID using precedence: override → explicit → suggestion → default. Resolver calls Logic at one point when override and explicit are absent (Planned Future).
- **No cross-store writes:** Logic does not call Layout store or override store setters; Layout does not call Logic store setters.

---

## How It Connects to Other Plans

- **Plan 1 (Compatibility):** evaluateCompatibility and getAvailableSlots are the APIs Layout exposes for compatibility and capabilities.
- **Plan 4 (Suggestion Intake):** Defines where resolver calls Logic and how suggestion is used in precedence.
- **Logic Plan 1:** Same boundary (Logic suggests, Layout resolves; no cross-store writes).
- **Logic Plan 8:** Single injection point; inputs (section node, template ID, compatible set) and output (recommended ID, optional explanation) defined there; Layout supplies compatible set and consumes recommendation.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*

---

## Verification Report (Step 9)

**Plan:** [9_LAYOUT_LOGIC_INTERFACE_FINALIZATION_PLAN.md](9_LAYOUT_LOGIC_INTERFACE_FINALIZATION_PLAN.md)  
**Scope:** Verify what Layout exposes to Logic (read-only capabilities, compatible sets); Logic suggests only; no cross-store writes.  
**Date:** 2025-02-04

---

### Summary

| Check | Status |
|-------|--------|
| Layout exposes getAvailableSlots, evaluateCompatibility, layout ID sets (section/card/organ) | ✅ PASS |
| Layout does not expose write APIs (store or node.layout mutators) | ✅ PASS |
| Logic does not call Layout setters or override store setters | ✅ PASS |
| Resolver applies precedence; no Layout call to Logic for suggestion today (Planned Future) | ✅ PASS |
| Alignment with Logic Plan 1 (Logic suggests, Layout resolves) | ✅ PASS |

**Overall: PASS** — Layout–Logic interface matches the plan; read-only exposure from Layout; suggestion injection is Planned Future.

---

### 1. What Layout exposes to Logic

| Data | Source / API | Verified |
|------|--------------|----------|
| **Available slots** | getAvailableSlots(sectionNode, options?) | ✅ Exported from `@/layout` (compatibility); from content-capability-extractor. |
| **Compatibility result** | evaluateCompatibility({ sectionNode, sectionLayoutId, cardLayoutId, organId, organInternalLayoutId }) → { sectionValid, cardValid, organValid?, missing } | ✅ Exported from `@/layout` (compatibility). |
| **Section layout ID set** | getLayout2Ids() / getPageLayoutIds(); compatible subset = filter by sectionValid | ✅ getLayout2Ids from resolver, getPageLayoutIds from page; filtering by evaluateCompatibility in dropdowns. |
| **Card layout ID set** | getAllowedCardPresetsForSectionPreset(sectionLayoutId); filter by cardValid | ✅ Exported from `@/layout` (page/capabilities); OrganPanel filters by cardValid. |
| **Organ internal layout ID set** | getInternalLayoutIds(organId); filter by organValid | ✅ From `@/layout-organ` (not @/layout); getInternalLayoutIds exported; OrganPanel filters by organValid. |

Layout does **not** export: setLayout, setSectionLayoutPresetOverride, setCardLayoutPresetOverride, setOrganInternalLayoutOverride, or any API that mutates layout store or node.layout. Those live in `src/state/` and are not re-exported by `@/layout`. ✅  

---

### 2. What Logic supplies to Layout

| Data | Constraint | Verified |
|------|------------|----------|
| **Recommended layout ID** | Element of compatible set; at single injection point (Planned Future); Logic does not write to any store | ✅ No injection point in code today; plan defines contract for when implemented. |
| **Optional explanation** | suggestionDetail; read-only | ✅ Contract only (Logic Plan 8, 10). |

Logic does not send raw layout IDs from rules, direct store writes, or overrides. ✅ (No Logic→Layout call today; contract for future.)

---

### 3. Rule: Logic suggests, Layout resolves

| Rule | Verified |
|------|----------|
| Logic produces recommended layout ID from compatible set; does not write to layout store or node.layout | ✅ No Logic code writes to layout or override stores (grep: no setLayout/setSectionLayoutPresetOverride etc. in src/logic). |
| Layout resolver is single place that chooses final layout ID (precedence: override → explicit → suggestion → default) | ✅ applyProfileToNode in json-renderer; no call to Logic for suggestion today. |
| No cross-store writes: Logic does not call Layout/override setters; Layout does not call Logic store setters | ✅ Layout does not export setters; Logic does not import from @/layout or state stores for writing. |

---

### 4. Layout exports (src/layout/index.ts)

- **From page:** getPageLayoutById, getPageLayoutIds, getDefaultSectionLayoutId, getAllowedCardPresetsForSectionPreset, getDefaultCardPresetForSectionPreset, etc. (read-only or resolver helpers).
- **From resolver:** resolveLayout, getLayout2Ids, getDefaultSectionLayoutId, LayoutDefinition.
- **From compatibility:** evaluateCompatibility, getAvailableSlots, getRequiredSlots, getRequiredSlotsForOrgan, types.
- **No exports** from layout index for: section-layout-preset-store, organ-internal-layout-store, or layout-store setters. ✅  

---

### 5. Logic use of Layout

- Grep for Layout/override APIs in `src/logic`: **no matches** for getAvailableSlots, evaluateCompatibility, getLayout2Ids, getAllowedCardPresetsForSectionPreset, or getInternalLayoutIds. Logic does not currently call Layout read APIs; the injection point (resolver calling Logic for suggestion) is **Planned Future**. ✅  

---

### 6. Connection to other plans

| Plan | Connection | Verified |
|------|------------|----------|
| Plan 1 (Compatibility) | evaluateCompatibility and getAvailableSlots are the APIs Layout exposes | ✅ |
| Plan 4 (Suggestion Intake) | Resolver will call Logic at one point when override/explicit absent (Planned Future) | ✅ Not implemented; contract in Plan 4. |
| Logic Plan 1 | Same boundary (Logic suggests, Layout resolves; no cross-store writes) | ✅ Logic Plan 1 complete; alignment confirmed. |
| Logic Plan 8 | Single injection point; Layout supplies compatible set, consumes recommendation | ✅ Contract only; implementation planned. |

---

### Conclusion

Step 9 (Layout–Logic Interface Finalization) is **verified**. Layout exposes read-only capabilities and ID sets (getAvailableSlots, evaluateCompatibility, getLayout2Ids, getAllowedCardPresetsForSectionPreset; getInternalLayoutIds from layout-organ). Layout does not expose write APIs. Logic does not call Layout or override stores today; the suggestion injection point is Planned Future. The interface aligns with Logic Plan 1 and the contract in Plan 8.

**Next:** Proceed to Step 10 — [10_LAYOUT_VALIDATION_AND_GOVERNANCE_PLAN.md](10_LAYOUT_VALIDATION_AND_GOVERNANCE_PLAN.md) when ready.
