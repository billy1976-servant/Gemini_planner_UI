# Phase 6 — Behavior Surface Normalization

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 6 (6.1–6.4); 6.1 covered in Phase 2.

---

## Goal

Contract verbs from config (Phase 2); document or remove silent fallbacks; no "falling back" with invented value; legacy state:* and state-mutate documented.

---

## Files Expected to Change

- behavior-listener.ts (input-change, state:* handling)
- state-store.ts (installStateMutateBridge)
- STATE_INTENTS.md, STATE_MUTATION_SURFACE_MAP, RUNTIME_PIPELINE_CONTRACT or behavior docs

---

## Exact Refactor Actions

1. **6.1** — Contract verbs: covered in Phase 2. No change.
2. **6.2** — input-change: when fieldKey missing, explicit no-op or early return; document. No invented fallback.
3. **6.3** — Legacy state:* valueFrom "input": document or remove. (Ephemeral buffers when fieldKey omitted.)
4. **6.4** — state-mutate (installStateMutateBridge): document or remove. Documented in STATE_INTENTS as legacy.

---

## What Must NOT Change

- state.update when fieldKey present
- state:* valueFrom input resolution when explicit
- dispatchState; listeners

---

## Acceptance Criteria

- No "falling back" with invented value for input-change.
- state:* valueFrom fallback and state-mutate bridge documented.

---

## Risk Level

**LOW**

---

## Dependencies

None (6.1 from Phase 2)


---

## Verification Report (Step 1 — 2026-02-06)

**Run:** Phase 6 executed; behavior surface normalization verified.

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | PASS |
| No forbidden changes made | PASS |
| No unexpected side effects | PASS |
| All stages (6.1–6.4) addressed | PASS |

### Actions verified / taken

- **6.1** — Contract verbs: covered in Phase 2 (contract-verbs.ts). No change.
- **6.2** — input-change: behavior-listener already has explicit no-op when fieldKey missing (early return + console.warn); no invented fallback. No change.
- **6.3** — Legacy state:* valueFrom "input": Documented in STATE_INTENTS.md (legacy note for valueFrom "input", ephemeral buffers when fieldKey omitted; prefer explicit fieldKey for new flows).
- **6.4** — state-mutate: installStateMutateBridge already documented in state-store.ts and STATE_INTENTS.md as legacy. No change.

### Files changed this run

- **New:** src/refactor_ROUND 1/06_phase6_behavior_normalization.md (plan content).
- **Modified:** src/docs/ARCHITECTURE_AUTOGEN/STATE_INTENTS.md (added legacy state:* valueFrom "input" paragraph).

### Acceptance

- No falling back with invented value for input-change; state:* valueFrom fallback and state-mutate documented.

