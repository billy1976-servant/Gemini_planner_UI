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

---

## Verification Report (Step 1)

**Plan Name:** Phase 6 — Behavior Surface Normalization

**Scope:** Contract verbs from config (Phase 2 done); document or remove silent fallbacks; lock behavior branch order in doc (Phase 1 done). Changes: behavior-listener (input-change no-op when fieldKey missing; state:* legacy fallback documented; state-mutate emit comment); state-store (installStateMutateBridge documented as legacy). No changes to state:* valueFrom input when present, state.update when fieldKey present, dispatchState, or listeners.

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

- **6.2** — input-change: when fieldKey is missing, handler now does an explicit early return after a single warn ("missing fieldKey — skipping dispatch (no fallback)"); no dispatch and no invented value. Comment added: "No invented fallback: when fieldKey is missing we do not dispatch (explicit no-op)."
- **6.3** — Legacy state:* fallback (valueFrom "input" for currentView/update using lastFieldKey/inputByFieldKey/lastInputValue): comment updated to "Legacy fallback (documented): for state:* other than journal.add, valueFrom 'input' may resolve from ephemeral buffers … Prefer explicit fieldKey + state.values for new flows." The final emit of state-mutate reworded to "Legacy: emit state-mutate so older consumers can observe; do not rely for new code."
- **6.4** — installStateMutateBridge in state-store.ts: added JSDoc that it is legacy; external or older consumers can push intents via "state-mutate"; do not rely for new code; referenced STATE_INTENTS.md. STATE_INTENTS.md updated to state the bridge is legacy and not to be relied on for new code.

**Files changed**

- **Modified:** src/engine/core/behavior-listener.ts, src/state/state-store.ts, src/docs/ARCHITECTURE_AUTOGEN/STATE_INTENTS.md.

**Gaps / follow-up**

- None. Acceptance criteria met: no "falling back" with invented value for fieldKey (explicit no-op); state:* and state-mutate documented as legacy.
