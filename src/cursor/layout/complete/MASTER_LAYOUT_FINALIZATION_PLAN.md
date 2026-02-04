# MASTER LAYOUT FINALIZATION PLAN

**Classification:** REFERENCE — Layout finalization phases; Phase 1–4 complete; primary architecture reference: docs/SYSTEM_MASTER/

## Objective

Complete the Layout System so that:

- Dropdowns only show layouts that are structurally compatible
- Organs, sections, and cards resolve layouts deterministically
- No hardcoding, no silent fallbacks
- Future layouts plug in automatically via JSON
- Renderer, editor, and logic stay decoupled

This document defines the final integration path.

---

## PHASE 1 — Layout Compatibility Engine (Foundation)

**Status:** Engine Built

### Steps

1. Confirm requirement registries exist:
   - `section-layout-requirements.json`
   - `card-layout-requirements.json`
   - `organ-internal-layout-requirements.json`
2. Confirm slot naming standard (SLOT_NAMES.md) is aligned
3. Confirm extractor derives slots correctly from:
   - children
   - content
   - organ roles
4. Confirm evaluator is pure (no store writes)

---

## PHASE 2 — OrganPanel Dropdown Filtering

**Status:** Complete (option lists filtered by compatibility; selection never auto-changed)

**Goal:** Dropdowns reflect compatibility

### Steps

1. Filter Section Layout options by `compatibility.sectionValid`
2. Filter Card Layout options by `compatibility.cardValid`
3. Filter Organ Internal Layout options by `compatibility.organValid`
4. Never auto-change selection
5. If sectionNode missing → show all options

---

## PHASE 3 — Dev Section Layout Dropdown Filtering

**Status:** Complete (options filtered by sectionValid; selection unchanged)

**Goal:** Dev tools mirror production rules

### Steps

1. Filter dev SectionLayoutDropdown options using `compatibility.sectionValid`
2. Do not change selected values
3. Only filter option list

---

## PHASE 4 — Renderer Awareness (Non-Blocking)

**Status:** Complete (evaluateCompatibility in applyProfileToNode; local only; optional dev log; no branches)

**Goal:** Renderer knows compatibility without enforcing

### Steps

1. Call `evaluateCompatibility` inside JsonRenderer after layout resolution
2. Store result locally only
3. Optional dev log
4. No rendering branches yet

---

## PHASE 5 — Organ Capability → Layout Profile Link

**Status:** Verified (organ-layout-profiles.json has capabilities + internalLayoutIds; requirements map organ→layout; OrganPanel uses organIdBySectionKey and filters by organValid)

**Goal:** Organs advertise what layouts they support

### Steps

1. Ensure organ-layout-profiles.json exposes capability slots
2. Confirm mapping between organ slots and layout slots
3. Verify OrganPanel reads organId correctly
4. Ensure organ layouts are not offered when slots missing

---

## PHASE 6 — Layout Resolution Integrity

**Status:** Verified (section → setSectionLayoutPresetOverride only; card → setCardLayoutPresetOverride only; organ → setOrganInternalLayoutOverride only; separate stores)

**Goal:** Ensure layout overrides stay independent

### Steps

1. Section dropdown only writes section store
2. Card dropdown only writes card store
3. Organ dropdown only writes organ store
4. No cross-writes or fallback logic

---

## PHASE 7 — JSON Extensibility Test

**Status:** Complete (added `test-extensible` to section-layout-requirements.json and page-layouts.json only; appears in dropdowns when compatible; no TS edits)

**Goal:** Prove new layouts plug in automatically

### Steps

1. Add test layout ID to section-layout-requirements.json
2. Confirm it appears automatically in dropdowns when compatible
3. Confirm no TS edits required

---

## PHASE 8 — Safety & Determinism Validation

**Status:** Verified (defaults from template profile + getDefaultSectionLayoutId only; no fallback writes to stores; evaluator is pure; dropdowns only filter options; renderer does not call layout override setters)

**Goal:** Lock system rules

### Rules

- No hardcoded layout defaults
- No layout fallbacks written to stores
- Compatibility engine never writes state
- Dropdown filtering only removes impossible options
- Renderer never mutates layout selection

---

## PHASE 9 — Future Expansion (Document Only)

Not implemented now, but reserved:

- Warning badges for incompatible layouts
- Optional render guards
- Adaptive layout preference system

---

## Completion Criteria

Layout system is considered finalized when:

- [x] All dropdowns filter correctly (Phase 2 & 3: OrganPanel + SectionLayoutDropdown filter by compatibility)
- [x] No layout causes broken render due to missing slots (filtering prevents offering incompatible options)
- [x] New JSON layouts integrate automatically (Phase 7: test-extensible added via JSON only)
- [x] No layout ID is hardcoded anywhere (Phase 8: defaults from template/profile + templates JSON)
- [x] Compatibility engine runs silently in background (pure evaluator; optional dev log only)

**Status: Finalized** — Phases 1–8 complete; Phase 9 reserved for future expansion.

---

*End of Plan*
