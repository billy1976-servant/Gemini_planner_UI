# Compatibility Engine — Dropdown Option Filtering

**Classification:** REFERENCE — Dropdown filtering complete; primary architecture reference: docs/SYSTEM_MASTER/

**Domain:** Layout  
**Status:** Complete

## Goal

Integrate the Layout Compatibility Engine with dropdown option builders so each dropdown only shows layouts that are structurally compatible with the section’s content. No store, renderer, or fallback changes.

## What Was Done

- **OrganPanel:** For each section row, option lists are filtered by `evaluateCompatibility` before rendering:
  - **Section layout:** Only IDs where `sectionValid === true` (e.g. no hero-split when section has no image).
  - **Card layout:** Only IDs where `cardValid === true` (e.g. no image-left/right when card has no image).
  - **Organ internal layout:** Only IDs where `organValid !== false` (required slots present). Filtering applied only when `sectionNode` (and for organ, `organId`) is present; otherwise full lists are shown.
- **SectionLayoutDropdown (dev):** Per section, section layout options are filtered to IDs where `evaluateCompatibility({ sectionNode: s, sectionLayoutId: id }).sectionValid === true`.

## Files Changed

| File | Change |
|------|--------|
| `src/organs/OrganPanel.tsx` | Compute `sectionOptionsFiltered`, `cardOptionsFiltered`, `organOptionsFiltered` per row using `evaluateCompatibility`; use them in the three `<select>` option lists. |
| `src/dev/section-layout-dropdown.tsx` | Import `evaluateCompatibility`; per section, filter `layoutIds` by `sectionValid` and use filtered list in options. |

## Constraints Respected

- No layout store or renderer changes.
- No fallbacks or auto-selection when current value is invalid.
- No section data mutation; only filtering of dropdown option arrays.

## Change Log

- [2025-02-03] Dropdown filtering implemented per plan (OrganPanel + SectionLayoutDropdown).
