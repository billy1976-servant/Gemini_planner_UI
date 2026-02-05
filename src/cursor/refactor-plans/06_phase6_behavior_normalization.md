# Phase 6 — Behavior Surface Normalization

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 6 (6.2–6.4); Part I B Gaps 2, 8–9; 6.1 covered in Phase 2.

---

## Goal

Contract verbs from config (Phase 2); document or remove silent fallbacks; lock behavior branch order in doc (Phase 1).

---

## Files Expected to Change

- `src/engine/core/behavior-listener.ts`
- `src/state/state-store.ts` (installStateMutateBridge)

---

## Exact Refactor Actions

1. **6.2** — input-change: when fieldKey missing, explicit no-op or early return; document (no invented fallback).
2. **6.3** — Legacy state:* fallback: document or remove.
3. **6.4** — state-mutate legacy (installStateMutateBridge): document or remove.

---

## What Must NOT Change

- state:* valueFrom input when present; state.update when fieldKey present; dispatchState; listeners

---

## Acceptance Criteria

- No "falling back" with invented value for fieldKey.
- state:* and state-mutate either documented or removed.

---

## Risk Level

**LOW**

---

## Dependencies

None
