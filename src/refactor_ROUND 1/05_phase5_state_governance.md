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

---

## Verification Report (Step 1)

**Plan Name:** Phase 5 — State Governance & Intent Boundaries

**Scope:** Bound state write surfaces; single state intents reference; ensureInitialView from config (already done in Phase 2); no new state surfaces without contract. Documentation only: bounded audit, STATE_INTENTS, contribution rule. No changes to dispatchState signature, deriveState, or existing call sites.

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

- **5.1** — STATE_MUTATION_SURFACE_MAP.md: added **Bounded audit: every dispatchState call site** — table of File | Intent(s) | Trigger for all 16 call sites (state-store, behavior-listener, screen-loader, json-skin, layout, resolve-onboarding, EducationCard, run-calculator, state-adapter, global-scan.state-bridge, tsx-proof, interaction-controller, global-scan.engine).
- **5.2** — Created STATE_INTENTS.md (single reference): intents handled by deriveState (state:currentView, state.update, journal.set, journal.add, scan.result, scan.interpreted, interaction.record); intents logged but not derived (scan.record, scan.batch); legacy state-mutate bridge (any intent); rule that call sites use only listed intents and new intents require deriveState + doc update.
- **5.4** — STATE_MUTATION_SURFACE_MAP: added **Contribution rule** at top and at end — any new dispatchState call site must be added to the bounded audit and to the relevant section; new intents must be added to STATE_INTENTS and to state-resolver deriveState.

**Files changed / added**

- **New:** src/docs/ARCHITECTURE_AUTOGEN/STATE_INTENTS.md
- **Modified:** src/docs/ARCHITECTURE_AUTOGEN/STATE_MUTATION_SURFACE_MAP.md (bounded audit table, contribution rule in two places)

**Gaps / follow-up**

- None. Acceptance criteria met: state mutation surface list complete (bounded audit); single intents doc (STATE_INTENTS.md); contribution rule in doc.


---

## Verification Report (Step 2 — 2026-02-06)

**Run:** Phase 5 state verified; no changes required.

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | PASS |
| No forbidden changes made | PASS |
| No unexpected side effects | PASS |
| All stages (5.1, 5.2, 5.4) satisfied | PASS |

### Current state verified

- **5.1** — STATE_MUTATION_SURFACE_MAP.md contains **Bounded audit: every dispatchState call site** (table File | Intent(s) | Trigger) and detailed sections 1–13. List complete.
- **5.2** — STATE_INTENTS.md is the single reference: intents handled by deriveState (state:currentView, state.update, journal.set, journal.add, scan.result, scan.interpreted, interaction.record); intents logged but not derived (scan.record, scan.batch); legacy state-mutate bridge; rule that call sites use only listed intents and new intents require deriveState + doc update.
- **5.3** — ensureInitialView from config: covered in Phase 2 (state-defaults.json). No change.
- **5.4** — Contribution rule present at top of STATE_MUTATION_SURFACE_MAP and again at end: new dispatchState call sites must be added to bounded audit and relevant section; new intents to STATE_INTENTS and state-resolver deriveState.

### Acceptance

- State mutation surface list complete; single intents doc (STATE_INTENTS.md); contribution rule in doc.

### Files changed this run

- None (verification only).

---

## Verification Report (Step 3 — 2026-02-06, alignment pass)

**Run:** Phase 5 re-verified; two missing dispatchState call sites and one missing intent documented; bounded audit and single-reference updated.

### Verification Table

| Check | Status |
|-------|--------|
| Runtime matches plan contract | PASS |
| No forbidden changes made (signature, deriveState, call sites unchanged) | PASS |
| All stages (5.1, 5.2, 5.4) satisfied | PASS |

### Gaps found and fixed

- **5.1** — **Bounded audit:** Added `src/app/page.tsx` (layout.override) and `src/behavior/behavior-engine.ts` (interaction.record, state.update) to the table. Updated §11 (Interaction Controller + behavior-engine) and §13 (page.tsx layout preset handlers). Summary table updated to include layoutByScreen and behavior-engine.
- **5.2** — **STATE_INTENTS:** Added `layout.override` to "Intents handled by deriveState" (payload: screenKey, type, sectionId, presetId; effect: derived.layoutByScreen).
- **5.4** — Contribution rule already present; no change.

### Files changed this run

- **Modified:** src/docs/ARCHITECTURE_AUTOGEN/STATE_INTENTS.md (layout.override intent)
- **Modified:** src/docs/ARCHITECTURE_AUTOGEN/STATE_MUTATION_SURFACE_MAP.md (bounded audit + §11, §13, summary)

### Acceptance

- State mutation surface list complete (all dispatchState call sites in audit).
- Single intents doc includes all deriveState intents (including layout.override).
- Contribution rule in doc unchanged.

**Conclusion:** Phase 5 complete. Ready to proceed to Phase 6.
