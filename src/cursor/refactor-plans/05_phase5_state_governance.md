# Phase 5 — State Governance & Intent Boundaries

**Source:** [src/cursor/REFRACTOR_EXECUTION_MASTER_ROADMAP.md](../REFRACTOR_EXECUTION_MASTER_ROADMAP.md) — Phase 5 (5.1, 5.2, 5.4); Part I B Gap 16; 5.3 covered in Phase 2.

---

## Goal

Bound state write surfaces; single state intents reference; ensureInitialView from config (done in Phase 2); no new state surfaces without contract.

---

## Files Expected to Change

- STATE_MUTATION_SURFACE_MAP.md (or new under src/docs), `src/state/state-store.ts`
- `src/state/state-resolver.ts`, STATE_INTENTS.md or contract
- STATE_MUTATION_SURFACE_MAP; contribution rules

---

## Exact Refactor Actions

1. **5.1** — State mutation surface audit: bounded list of every dispatchState call site.
2. **5.2** — State intents single reference: one list of all intents; call sites use only listed.
3. **5.4** — Document rule: new dispatchState must be listed in STATE_MUTATION_SURFACE_MAP.

---

## What Must NOT Change

- dispatchState signature; deriveState; existing call sites

---

## Acceptance Criteria

- State mutation surface list complete.
- Single intents doc.
- Contribution rule in doc.

---

## Risk Level

**LOW**

---

## Dependencies

None (5.4 depends on 5.1)
