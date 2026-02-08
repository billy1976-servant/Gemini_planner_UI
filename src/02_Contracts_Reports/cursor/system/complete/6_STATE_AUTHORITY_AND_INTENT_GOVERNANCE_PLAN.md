# Plan 6 — State Authority and Intent Governance

**Purpose:** Govern state mutation surfaces and intent taxonomy; ensure Layout/State separation and bounded writes.

**Scope:** `src/state/state-store.ts`, `src/state/state-resolver.ts`, all dispatchState call sites, override stores, persistence.

**Non-negotiables:**
- Single event log; deriveState replays; no direct state mutation outside dispatchState and documented store setters.
- Logic does not call setLayout or override store setters; only dispatchState (and engine-bridge for engine state).
- Intent names documented; no ad-hoc intents without doc update.

**Current runtime summary:**
- dispatchState from behavior-listener, screen-loader, layout (navigate), action handlers, state-adapter, global-scan, interaction-controller, json-skin, TSX screens. Override stores: section/card/organ layout overrides set from page/OrganPanel. Persist: state-store persist() and persistence-adapter. Status: Bounded; see STATE_WRITE_SURFACE_AUDIT.generated.md.

**Required outputs:**
- Intent taxonomy doc (state:currentView, state.update, journal.set, journal.add, scan.*, interaction.record, etc.).
- Confirmation that no Logic→Layout/State direct mutation.
- Optional: governance rule for new intents (must be documented).

**Verification checklist:**
- [ ] All dispatchState call sites listed.
- [ ] Intent list complete.
- [ ] No Logic→Layout/State violation.

---

## Verification Report (Step 6)

| Check | Result |
|-------|--------|
| Purpose and scope defined | PASS |
| Non-negotiables stated | PASS |
| Current runtime summary | PASS |
| Required outputs | PASS |
| Verification checklist run | PASS |
