# Phase 4 — Registry & Layout Authority Alignment

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 4 (stages 4.1–4.9); Part I B Gaps 15, 17; 4.1/4.2 deferred to Phase 2/3.

---

## Goal

Layout types and IDs from registry (Phase 2); rename covered in Phase 3; clarify planned vs implemented layout engines; Component Registry source of truth.

---

## Files Expected to Change

- ARCHITECTURE_AUTOGEN, cursor logic plan (Layout Decision Engine)
- SUGGESTION_INJECTION_POINT.md
- TRAIT_REGISTRY_SYSTEM.md
- User Preference Adaptation / Explainability / Contextual Layout Logic docs
- CONTEXTUAL_LAYOUT_LOGIC.md, CONTRACT_IMPLEMENTATION_DIFF
- `src/engine/core/registry.tsx`, docs or manifest

---

## Exact Refactor Actions

1. **4.3** — Layout Decision Engine: implement or mark planned in docs.
2. **4.4** — Suggestion Injection Point: implement or mark planned.
3. **4.5** — Trait Registry System: implement or mark planned.
4. **4.6** — User Preference Adaptation: implement or mark planned.
5. **4.7** — Explainability/Trace: implement or mark planned.
6. **4.8** — Contextual Layout Logic: implement or mark planned.
7. **4.9** — Document registry.tsx as single type→component map or derive from JSON; no competing maps.

---

## What Must NOT Change

- applyProfileToNode; getLayout2Ids/compatibility; resolver; state; override stores; resolveLayout; layout decision logic (unless implementing)

---

## Acceptance Criteria

- Each engine (Layout Decision, Suggestion, Trait, User Preference, Explainability, Contextual Layout) has documented status "planned" or stub.
- Registry single source documented.

---

## Risk Level

**MED** (4.3, 4.4, 4.5, 4.8); **LOW** (4.6, 4.7, 4.9)

---

## Dependencies

1.4 (Blueprint boundary doc)

---

## Verification Report (Step 1)

**Plan Name:** Phase 4 — Registry & Layout Authority Alignment

**Scope:** Layout types and IDs from registry (Phase 2); rename covered in Phase 3; clarify planned vs implemented layout engines; Component Registry source of truth. Documentation only: add implementation status to each engine doc; document registry as single source. No code changes to applyProfileToNode, getLayout2Ids/compatibility, resolver, state, override stores, resolveLayout.

**Date:** 2026-02-04

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | ✅ PASS |
| No forbidden changes made | ✅ PASS |
| No unexpected side effects | ✅ PASS |
| All files referenced exist | ✅ PASS |

### Detailed Findings

**What was verified**

- **4.3** — LAYOUT_DECISION_ENGINE.md: added **Implementation status:** PLANNED (no runtime scoring by traits; compatible ID source and precedence slot exist).
- **4.4** — SUGGESTION_INJECTION_POINT.md: added **Implementation status:** PLANNED (no resolver call to Logic yet; slot reserved in applyProfileToNode).
- **4.5** — TRAIT_REGISTRY_SYSTEM.md: added **Implementation status:** PLANNED (no trait-registry.json; prerequisite for Plans 4/5/6).
- **4.6** — USER_PREFERENCE_ADAPTATION.md: added **Implementation status:** PLANNED (no "more like this" / trait-weight code; depends on Trait Registry and Decision Engine).
- **4.7** — RUNTIME_DECISION_TRACE_IMPLEMENTATION.md: added **Implementation status (Explainability/Trace):** PARTIAL (runtime trace implemented for dev; layout suggestion explainability planned with Plans 5/8).
- **4.8** — CONTEXTUAL_LAYOUT_LOGIC.md: added **Implementation status:** PLANNED (no contextual engine or rules JSON; getAvailableSlots exists for future use).
- **4.9** — registry.tsx: added JSDoc that it is the single source for type→component; no competing maps. PIPELINE_AND_BOUNDARIES_REFERENCE.md: added §15 Component Registry (single source).

**Files changed**

- **Modified:** LAYOUT_DECISION_ENGINE.md, SUGGESTION_INJECTION_POINT.md, TRAIT_REGISTRY_SYSTEM.md, USER_PREFERENCE_ADAPTATION.md, CONTEXTUAL_LAYOUT_LOGIC.md, SYSTEM_INTELLIGENCE/RUNTIME_DECISION_TRACE_IMPLEMENTATION.md, PIPELINE_AND_BOUNDARIES_REFERENCE.md, src/engine/core/registry.tsx.

**Gaps / follow-up**

- None. Acceptance criteria met: each engine has documented status "planned" or "partial"; registry single source documented.
