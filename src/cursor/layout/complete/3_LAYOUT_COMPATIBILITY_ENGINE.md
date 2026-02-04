# Layout Compatibility & Requirements Engine

**Classification:** REFERENCE — Compatibility engine description; primary architecture reference: docs/SYSTEM_MASTER/

**Domain:** Layout  
**Status:** Complete

## Goal

Design and implement a read-only engine that determines whether the selected Section Layout, Card Layout, and Organ Internal Layout are structurally compatible with a section's content (required slots). Prevents empty or broken layouts when required pieces are missing. Validation and guidance only; no state changes or auto-overrides.

## What Was Done

- **Layout Requirement Registry (JSON):** Added `src/layout/requirements/section-layout-requirements.json`, `card-layout-requirements.json`, and `organ-internal-layout-requirements.json` mapping layout IDs → required slots. Added `SLOT_NAMES.md` for slot name convention.
- **Content Capability Extractor:** `src/layout/compatibility/content-capability-extractor.ts` — `getAvailableSlots(sectionNode, options?)` derives available slots from section node children and content, with normalization and optional organ slot mapping.
- **Requirement Registry Loader:** `src/layout/compatibility/requirement-registry.ts` — `getRequiredSlots(layoutType, layoutId, organId?)` and `getRequiredSlotsForOrgan(organId, internalLayoutId)` read from the JSON registries.
- **Compatibility Evaluator:** `src/layout/compatibility/compatibility-evaluator.ts` — `evaluateCompatibility(args)` returns `{ sectionValid, cardValid, organValid?, missing }`; pure function, no store access.
- **Public API:** Exported from `src/layout/compatibility/index.ts` and re-exported from `@/layout` (`evaluateCompatibility`, `getAvailableSlots`, `getRequiredSlots`, `getRequiredSlotsForOrgan` and types).
- **Plan document:** `src/layout/cursor/3_LAYOUT_COMPATIBILITY_ENGINE_PLAN.md` (architecture + implementation summary).

Engine does not change layout state, assign fallbacks, or write to stores. UI guidance (OrganPanel filtering, JsonRenderer guard, warnings) is left for a later phase.

## Files Changed

| File | Change |
|------|--------|
| `src/layout/requirements/SLOT_NAMES.md` | New — slot name convention. |
| `src/layout/requirements/section-layout-requirements.json` | New — section layout ID → requires. |
| `src/layout/requirements/card-layout-requirements.json` | New — card layout ID → requires. |
| `src/layout/requirements/organ-internal-layout-requirements.json` | New — organ + internal layout → requires. |
| `src/layout/compatibility/content-capability-extractor.ts` | New — getAvailableSlots. |
| `src/layout/compatibility/requirement-registry.ts` | New — getRequiredSlots, getRequiredSlotsForOrgan. |
| `src/layout/compatibility/compatibility-evaluator.ts` | New — evaluateCompatibility. |
| `src/layout/compatibility/index.ts` | New — public API. |
| `src/layout/index.ts` | Re-export compatibility API from @/layout. |
| `src/layout/cursor/3_LAYOUT_COMPATIBILITY_ENGINE_PLAN.md` | New — plan doc. |

## Change Log

- [2025-02-03] Plan created (Cursor Plan Mode)
- [2025-02-03] Implementation completed (registries, extractor, registry loader, evaluator, public API)
- [2025-02-03] Marked complete; added to layout/complete
