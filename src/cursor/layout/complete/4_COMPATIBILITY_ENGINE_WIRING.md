# Compatibility Engine Wiring (No Behavior Change)

**Classification:** REFERENCE — Wiring complete; primary architecture reference: docs/SYSTEM_MASTER/

**Domain:** Layout  
**Status:** Complete

## Goal

Wire the existing Layout Compatibility Engine into OrganPanel and JsonRenderer so compatibility is evaluated at key points. Data wiring only: no logic branches, no dropdown filtering, no rendering changes.

## What Was Done

- **OrganPanel:** Optional prop `sectionNodesByKey`; for each section row, call `evaluateCompatibility({ sectionNode, sectionLayoutId, cardLayoutId, organId, organInternalLayoutId })` and store result in a local variable. Optional dev `console.debug` for verification. No use of result for filtering or selection.
- **JsonRenderer:** Optional prop `organInternalLayoutOverrides`; threaded through `renderNode` and `applyProfileToNode`. When processing a section in `applyProfileToNode`, after setting `next.layout`, call `evaluateCompatibility(...)` and store in a local variable; optional dev log. No branching on result.
- **Page:** Pass `sectionNodesByKey={sectionByKey}` to both OrganPanel usages; pass `organInternalLayoutOverrides={organInternalLayoutOverridesProp}` to JsonRenderer.

## Files Changed

| File | Change |
|------|--------|
| `src/organs/OrganPanel.tsx` | Import evaluateCompatibility; add sectionNodesByKey prop; call evaluateCompatibility per row; dev log. |
| `src/engine/core/json-renderer.tsx` | Import evaluateCompatibility; add organInternalLayoutOverrides prop; thread through renderNode/applyProfileToNode; call evaluateCompatibility in applyProfileToNode for sections; dev log. |
| `src/app/page.tsx` | Pass sectionNodesByKey to OrganPanel (both usages); pass organInternalLayoutOverrides to JsonRenderer. |

## Change Log

- [2025-02-03] Wiring implemented per plan (OrganPanel + JsonRenderer + page); no behavior or visual change.
