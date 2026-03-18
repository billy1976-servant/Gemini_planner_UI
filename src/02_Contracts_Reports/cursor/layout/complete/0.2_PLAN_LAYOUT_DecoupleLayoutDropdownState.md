# Decouple Section / Card / Organ Layout Dropdown State

**Classification:** REFERENCE — Decouple plan complete; primary architecture reference: docs/SYSTEM_MASTER/

**Domain:** Layout  
**Status:** Complete

## Goal

Section Layout dropdown updates only section layout override; Card Layout only card; Internal layout (organ) only organ. No shared setter so one dropdown never changes the others.

## What Was Done

- **Root cause:** In `src/app/page.tsx`, `handleSectionLayoutPresetOverride` called `setSectionLayoutPresetOverride` and also conditionally `setCardLayoutPresetOverride` when the current card preset was invalid for the new section — so changing Section Layout could change Card Layout.
- **Fix:** `handleSectionLayoutPresetOverride` now only calls `setSectionLayoutPresetOverride(screenKey, sectionKey, presetId)`. Removed the fallback block and the unused imports `getAllowedCardPresetsForSectionPreset` and `getDefaultCardPresetForSectionPreset` from `@/layout`.

## Files Changed

| File | Change |
|------|--------|
| `src/app/page.tsx` | Simplified Section handler to single store write; removed two layout imports. |

## Change Log

- [2025-02-03] Plan created (executed via Cursor Plan Mode)
- [2025-02-03] Marked complete; added to layout/complete
