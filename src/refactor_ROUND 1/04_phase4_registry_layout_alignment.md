# Phase 4 — Registry & Layout Authority Alignment

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 4 (stages 4.1–4.9).

---

## Goal

Layout types and IDs from registry; clarify planned vs implemented layout engines; document Component Registry as single source of truth.

---

## Files Expected to Change

- ARCHITECTURE_AUTOGEN (Layout Decision Engine, Suggestion Injection Point, Trait Registry, User Preference, Explainability/Trace, Contextual Layout Logic)
- CONTRACT_IMPLEMENTATION_DIFF (status of planned systems)
- src/engine/core/registry.tsx, docs (PIPELINE_AND_BOUNDARIES_REFERENCE)

---

## Exact Refactor Actions

1. **4.1** — Layout types: covered in Phase 2 (layout-allowed-types.json). No change.
2. **4.2** — getSectionLayoutIds: covered in Phase 3. No change.
3. **4.3** — Layout Decision Engine: docs state "planned" or stub. (LAYOUT_DECISION_ENGINE.md)
4. **4.4** — Suggestion Injection Point: implement or mark planned. (SUGGESTION_INJECTION_POINT.md)
5. **4.5** — Trait Registry System: implement or mark planned. (TRAIT_REGISTRY_SYSTEM.md)
6. **4.6** — User Preference Adaptation: implement or mark planned. (Docs)
7. **4.7** — Explainability/Trace: implement or mark planned. (Docs; layout trace)
8. **4.8** — Contextual Layout Logic: implement or mark planned. (CONTEXTUAL_LAYOUT_LOGIC.md, CONTRACT_IMPLEMENTATION_DIFF)
9. **4.9** — Component Registry source of truth: document registry.tsx as single type→component map; no competing maps.

---

## What Must NOT Change

- applyProfileToNode; getSectionLayoutIds/compatibility
- Resolver behavior
- Layout compatibility logic
- State; override stores
- resolveLayout; applyProfileToNode
- JsonRenderer Registry lookup

---

## Acceptance Criteria

- 4.1, 4.2 covered by prior phases.
- 4.3–4.8: Each doc has "Implementation status: PLANNED" (or equivalent); status clear.
- 4.9: Single source for Registry documented (e.g. PIPELINE_AND_BOUNDARIES_REFERENCE §15).

---

## Risk Level

**MED** (4.3, 4.4, 4.5, 4.8); **LOW** (4.6, 4.7, 4.9)

---

## Dependencies

Phase 1.4 (Blueprint boundary doc) recommended first.


---

## Verification Report (Step 1 — 2026-02-06)

**Run:** Phase 4 executed; registry and layout authority alignment verified.

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | PASS |
| No forbidden changes made | PASS |
| No unexpected side effects | PASS |
| All 9 stages addressed | PASS |

### Actions verified / taken

- **4.1** — Layout types: covered in Phase 2 (layout-allowed-types.json). No change.
- **4.2** — getSectionLayoutIds: covered in Phase 3. No change.
- **4.3** — Layout Decision Engine: LAYOUT_DECISION_ENGINE.md has "Implementation status: PLANNED". Doc updated to reference getSectionLayoutIds() (replacing getLayout2Ids) for Phase 3 alignment.
- **4.4** — Suggestion Injection Point: SUGGESTION_INJECTION_POINT.md has "Implementation status: PLANNED". No change.
- **4.5** — Trait Registry System: TRAIT_REGISTRY_SYSTEM.md has "Implementation status: PLANNED". No change.
- **4.6** — User Preference Adaptation: USER_PREFERENCE_ADAPTATION.md has "Implementation status: PLANNED". No change.
- **4.7** — Explainability/Trace: RUNTIME_DECISION_TRACE_IMPLEMENTATION.md states layout suggestion explainability PLANNED with Decision Engine and Suggestion Injection. No change.
- **4.8** — Contextual Layout Logic: CONTEXTUAL_LAYOUT_LOGIC.md has "Implementation status: PLANNED". CONTRACT_IMPLEMENTATION_DIFF marks it as Missing (planned). No change.
- **4.9** — Component Registry: PIPELINE_AND_BOUNDARIES_REFERENCE.md §15 documents registry.tsx as single type→component map; no competing maps. No change.

### Files changed this run

- **New:** src/refactor_ROUND 1/04_phase4_registry_layout_alignment.md (plan content).
- **Modified:** src/docs/ARCHITECTURE_AUTOGEN/LAYOUT_DECISION_ENGINE.md (getLayout2Ids → getSectionLayoutIds in three places).

### Acceptance

- 4.1, 4.2 covered by prior phases; 4.3–4.8 each have clear PLANNED status; 4.9 Registry single source documented.

---

## Verification Report (Step 2 — 2026-02-06, post–Phase 3)

**Run:** Phase 4 re-verified after Phase 3 completion; no code or doc changes required.

| Check | Status |
|-------|--------|
| 4.1–4.2 covered by prior phases | OK |
| 4.3 LAYOUT_DECISION_ENGINE.md — PLANNED + getSectionLayoutIds | OK |
| 4.4 SUGGESTION_INJECTION_POINT.md — PLANNED | OK |
| 4.5 TRAIT_REGISTRY_SYSTEM.md — PLANNED | OK |
| 4.6 USER_PREFERENCE_ADAPTATION.md — PLANNED | OK |
| 4.7 RUNTIME_DECISION_TRACE — explainability PLANNED | OK |
| 4.8 CONTEXTUAL_LAYOUT_LOGIC.md + CONTRACT_IMPLEMENTATION_DIFF — PLANNED/Missing | OK |
| 4.9 PIPELINE_AND_BOUNDARIES_REFERENCE §15 — Registry single source | OK |

**Conclusion:** Phase 4 complete. Ready to proceed to Phase 5.

