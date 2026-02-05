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
