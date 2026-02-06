# ROUND 3 — Master Plan

**Goal:** Final trunk-line architecture + JSON consolidation.  
**Prerequisite:** ROUND 2 complete. Planning only; execution later.

---

## 1. Phase overview

| Phase | Focus |
|-------|--------|
| 01_pipeline_unification | Single runtime pipeline documented and enforced; no second main path. |
| 02_authority_single_source | Single authority per domain (state, layout, behavior, registry); verify and document. |
| 03_json_surface_compression | Minimal JSON surface: layout-definitions, config, contract, profiles, palettes; optional compound/organ bundle. |
| 04_runtime_contract_freeze | Freeze runtime contract (screen shape, layout API, state intents); no schema changes except additive. |
| 05_final_integrity_pass | Full test run; trunk checklist; ROUND 3 sign-off. |

---

## 2. Dependencies

- ROUND 2 must be complete (getSectionLayoutId in layout, content/ legacy removed, calculator registry merged, JSON cluster reduction started).
- ROUND 3 builds on R2: pipeline unification is "lock and document"; authority single source is "verify after R2"; JSON compression is "complete merge to minimal surface"; contract freeze is "no breaking changes."

---

## 3. Success criteria (ROUND 3)

- Single runtime pipeline documented; secondary paths explicitly "not trunk."
- Single authority per domain (layout, state, behavior, registry) with no duplicates.
- Core JSON reduced to a small set (layout-definitions, config, contract, profiles, palettes); optional compound/organ bundle.
- Runtime contract frozen; tests pass; boundary checklist signed off.

---

## 4. Out of scope

- No new features.
- No removal of secondary pipelines (only document and isolate).
- No apps-offline or content/sites structural migration beyond optional bundle.

---

*End of MASTER_ROUND3_PLAN.md*
