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
