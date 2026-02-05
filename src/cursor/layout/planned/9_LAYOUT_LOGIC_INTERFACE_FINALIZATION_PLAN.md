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
