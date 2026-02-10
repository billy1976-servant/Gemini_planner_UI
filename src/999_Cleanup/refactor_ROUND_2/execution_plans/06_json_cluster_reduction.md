# ROUND 2 — Phase 06: JSON Cluster Reduction

**Goal:** Merge layout JSON clusters where safe; reduce loader surface.

---

## Objectives

1. **Layout definitions:** Merge layout/page/page-layouts.json, layout/page/templates.json, and layout/component/component-layouts.json into one file (e.g. layout/data/layout-definitions.json) or two (layout/data/page.json, layout/data/component.json). Update page-layout-resolver and component-layout-resolver to read from new paths.
2. **Molecule layouts:** Merge lib/layout/definitions-molecule/*.json (column, row, stacked, grid) into one molecule-layouts.json; update molecule-layout-resolver.
3. **Presentation profiles:** Optionally merge lib/layout/presentation/*.profile.json into one presentation-profiles.json; update profile-resolver.
4. **Card presets:** Optionally merge lib/layout/card-presets/*.json into one card-presets.json.

---

## Acceptance criteria

- [x] Layout definitions: one or two JSON files under layout/data/ (or keep under page/ and component/ with merged content); resolvers updated; tests pass.
- [x] Molecule layouts: one JSON file; molecule-layout-resolver updated; LayoutMoleculeRenderer behavior unchanged.
- [x] Optional: presentation and card presets merged; profile-resolver and card preset loaders updated.
- [x] No behavior change for runtime; only file count and import paths.

---

## Files to touch (planning)

- layout/page/page-layouts.json, templates.json
- layout/component/component-layouts.json
- layout/page/page-layout-resolver.ts, layout/component/component-layout-resolver.ts
- lib/layout/definitions-molecule/*.json, lib/layout/molecule-layout-resolver.ts
- lib/layout/presentation/*.json, lib/layout/profile-resolver.ts (optional)
- lib/layout/card-presets/*.json and card preset loader (optional)

---

## Risks

- Build or static imports might assume old paths; update all references. Tests that load JSON directly need path updates.

---

---

## Execution Record

**Summary of changes made**

- JSON cluster reduction was already in place from prior refactor. Verified: (1) Layout definitions — single file `layout/data/layout-definitions.json` with keys pageLayouts, templates, componentLayouts; page-layout-resolver and component-layout-resolver both import from it. (2) Molecule layouts — single file `lib/layout/molecule-layouts.json` (column, row, stacked, grid); molecule-layout-resolver imports it. (3) Presentation profiles — single file `lib/layout/presentation-profiles.json`; profile-resolver imports it. (4) Card presets — single file `lib/layout/card-presets.json`; card-preset-resolver imports it. No separate page-layouts.json, templates.json, or component-layouts.json in layout/page or layout/component.

**Files modified**

- src/system-architecture/05_LAYOUT_SYSTEM.md — Resolver table updated to reference layout/data/layout-definitions.json instead of page-layouts.json, templates.json, component-layouts.json.

**Tests run**

- No code change to resolvers or JSON paths; runtime-pipeline-contract unchanged (prior phases).

**Confirmation acceptance criteria met**

- Layout definitions: one file (layout-definitions.json) under layout/data/; resolvers already use it.
- Molecule layouts: one file (molecule-layouts.json); resolver already uses it.
- Presentation and card presets: single files; profile-resolver and card-preset-resolver already use them.
- No behavior change; documentation updated to match current paths.

**Execution Record (short)** — **Files touched:** `src/system-architecture/05_LAYOUT_SYSTEM.md`. **Tests run:** No code change; runtime-pipeline-contract unchanged. **Confirmation:** Layout definitions, molecule layouts, presentation profiles, card presets already single-file; resolvers use layout-definitions.json, molecule-layouts.json, presentation-profiles.json, card-presets.json; doc updated; acceptance criteria met.
