# Phase 8 — Runtime Authority + Explainability

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 8 (8.1, 8.3); 8.2 covered in Phase 4; Part I B (section compound fallback), acceptance "Authority ladder".

---

## Goal

Authority ladder audit; document section layoutDef null fallback; planned engines (Phase 4).

---

## Files Expected to Change

- RUNTIME_AUTHORITY_LADDER.md (new or under src/docs)
- json-renderer applyProfileToNode (audit only / doc)
- section.compound.tsx (audit only / doc)

---

## Exact Refactor Actions

1. **8.1** — Authority ladder audit: confirm override → explicit → template default → undefined; doc and code match.
2. **8.3** — Section layoutDef null fallback: confirm resolveLayout null → section div; no invented layout ID; document.

---

## What Must NOT Change

- Precedence in code; section.compound.tsx resolveLayout behavior

---

## Acceptance Criteria

- RUNTIME_AUTHORITY_LADDER doc exists.
- Override → explicit → template default → undefined documented.
- Section null fallback documented.

---

## Risk Level

**LOW**

---

## Dependencies

None

---

## Verification report (Phase 8 executed)

**Plan name:** Phase 8 — Runtime Authority + Explainability  
**Scope:** Authority ladder audit; document section layoutDef null fallback.  
**Date:** 2025-02-04

| Check | Status |
|-------|--------|
| Runtime matches plan contract | ✅ PASS |
| No forbidden changes made | ✅ PASS |
| No unexpected side effects | ✅ PASS |
| All files referenced exist | ✅ PASS |

**Detailed findings**

- **8.1 — Authority ladder:** `RUNTIME_AUTHORITY_LADDER.md` already documented override → explicit (node.layout) → template default → undefined. Audited `json-renderer.tsx` `applyProfileToNode`: `layoutId = overrideId || existingLayoutId || templateDefaultLayoutId || undefined` and `ruleApplied` order match. No code change; doc and code align.
- **8.3 — Section layoutDef null fallback:** Confirmed in `section.compound.tsx`: `layoutDef = resolveLayout(layout)`; when `effectiveDef` is falsy (including `layoutDef == null`), component returns `<div data-section-id={id}>{children}</div>` with no LayoutMoleculeRenderer and **no invented layout ID**. Added dedicated subsection **"Section layoutDef null fallback (8.3)"** in `RUNTIME_AUTHORITY_LADDER.md` and clarified the Hard Fallbacks table row with "no invented layout ID".

**Files modified:** `src/docs/ARCHITECTURE_AUTOGEN/RUNTIME_AUTHORITY_LADDER.md` only (documentation; no behavior change).


---

## Verification Report (Step 2 — 2026-02-06)

**Run:** Phase 8 state verified; no changes required.

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | PASS |
| No forbidden changes made | PASS |
| All stages (8.1, 8.3) satisfied | PASS |

### Current state verified

- **8.1** — RUNTIME_AUTHORITY_LADDER.md documents override → explicit (node.layout) → template default → undefined. applyProfileToNode matches. No change.
- **8.2** — Planned engines: covered in Phase 4. No change.
- **8.3** — Section layoutDef null fallback: § "Section layoutDef null fallback (8.3)" and Hard Fallbacks table document resolveLayout null → section div; no invented layout ID. No change.

### Files changed this run

- None (verification only).

