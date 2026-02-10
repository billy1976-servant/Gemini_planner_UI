# ROUND 2 — JSON Stage 1 Merge Plan

**Purpose:** Group JSON clusters and plan the merge. **Do NOT merge yet** — planning only.

**Constraint:** No change to screen JSON contract; no apps-offline/content bulk changes.

---

## 1. Layout definitions

| Current files | Location | Merge plan (Stage 1) |
|---------------|----------|----------------------|
| page-layouts.json | layout/page/ | **Group:** layout-definitions. Merge into one or two files: |
| templates.json | layout/page/ | e.g. layout-definitions.json with keys: pageLayouts, templates, defaultLayoutByTemplate; OR layout/page.json + layout/component.json. |
| component-layouts.json | layout/component/ | Same group; optional single layout/data/ dir. |

**Merge target:** One merged layout-definitions.json (or page.json + component.json) under layout/. Loaders updated to read from single file(s). No schema change to screen JSON.

---

## 2. Molecule layouts

| Current files | Location | Merge plan (Stage 1) |
|---------------|----------|----------------------|
| layout-column.json, layout-row.json, layout-stacked.json, layout-grid.json | lib/layout/definitions-molecule/ | **Group:** molecule-layouts. Single molecule-layouts.json with keys: column, row, stacked, grid. |

**Merge target:** One molecule-layouts.json; molecule-layout-resolver reads from it.

---

## 3. Presets

| Current files | Location | Merge plan (Stage 1) |
|---------------|----------|----------------------|
| card-presets/*.json (6) | lib/layout/card-presets/ | **Group:** card-presets. Single card-presets.json. |
| visual-presets/default.json | lib/layout/visual-presets/ | Keep or fold into layout-definitions. |
| spacing-scales/*.json (5) | lib/layout/spacing-scales/ | Optional: single spacing-scales.json. |
| hero-presets.json | lib/layout/ | Keep as single file. |

**Merge target:** card-presets → one file; spacing-scales optional; visual/hero plan only.

---

## 4. Presentation profiles

| Current files | Location | Merge plan (Stage 1) |
|---------------|----------|----------------------|
| *.profile.json (website, app, learning) | lib/layout/presentation/ | **Group:** presentation-profiles. Single presentation-profiles.json with keys: website, app, learning. |

**Merge target:** One presentation-profiles.json; profile-resolver updated.

---

## 5. Compounds

| Current files | Location | Merge plan (Stage 1) |
|---------------|----------|----------------------|
| compounds/ui/definitions/*.json (13) | avatar, button, card, section, … | **Group:** compound-definitions. Optional: single compound-definitions.json; registry.ts imports one file. |

**Merge target:** Optional; reduce loader surface. No merge required for R2.

---

## 6. Config

| Current files | Location | Merge plan (Stage 1) |
|---------------|----------|----------------------|
| renderer-contract.json, state-defaults.json, (ui-verb-map if present) | config/ | **Group:** config. Optional: single config.json with keys; or keep separate for clarity. |

**Merge target:** Plan only; no merge in Stage 1 unless desired.

---

## 7. Layout requirements

| Current files | Location | Merge plan (Stage 1) |
|---------------|----------|----------------------|
| section-layout-requirements.json, card-layout-requirements.json, organ-internal-layout-requirements.json | layout/requirements/ | **Group:** requirements. Optional: single requirements.json with keys section, card, organInternal. |

**Merge target:** Plan only; optional in Stage 1.

---

## 8. Out of scope (Stage 1)

| Cluster | Reason |
|---------|--------|
| apps-offline/*.json | Do not touch bulk content (directive). |
| content/sites/*, content/compiled/* | Same. |
| organs/*/variants/*.json | No change in R2; optional bundle in R3. |
| contracts/JSON_SCREEN_CONTRACT.json | No schema change. |
| palettes/*.json | No merge in Stage 1. |

---

## 9. Execution order (when executing)

1. Layout definitions (page + component + templates) → one or two files.
2. Molecule layouts → one file.
3. Card presets → one file.
4. Presentation profiles → one file.
5. (Optional) Spacing-scales, compound-definitions, config, requirements — as separate small steps.

---

## 10. Summary: JSON Stage 1 groups

| Group | Current (approx) | After merge (plan) |
|-------|------------------|--------------------|
| Layout definitions | 3 | 1–2 |
| Molecule layouts | 4 | 1 |
| Card presets | 6 | 1 |
| Presentation profiles | 3 | 1 |
| Spacing-scales | 5 | 1 (optional) |
| Compound definitions | 13 | 1 (optional) |
| Config | 3 | 1 (optional) |
| Layout requirements | 3 | 1 (optional) |

**Do not merge yet** — this document is the plan only.

---

*End of ROUND2_JSON_STAGE1_PLAN.md — plan only; no merge.*
