# ROUND 3 — Phase 04: Runtime Contract Freeze

**Goal:** Freeze runtime contract (screen shape, layout API, state intents); no schema changes except additive.

---

## Objectives

1. **Screen shape:** Document the minimal screen JSON shape that loadScreen and JsonRenderer expect; no breaking change to that shape.
2. **Layout API:** Public layout API is getSectionLayoutId(...) and resolveLayout(layoutId, context); no removal or breaking change to signatures.
3. **State intents:** Document state intents (state:currentView, state.update, journal.add, layout.override, etc.); no removal of intents that are in use; additive only.
4. **Contract schema:** JSON_SCREEN_CONTRACT.json — no breaking change; additive-only if any change.
5. Update CONTRACT_CONSOLIDATION_REPORT or contracts index with "frozen as of R3" note.

---

## Acceptance criteria

- [ ] Screen shape, layout API, and state intents are documented; no breaking changes introduced in R3.
- [ ] JSON_SCREEN_CONTRACT.json unchanged or additive-only.
- [ ] Contracts doc states "runtime contract frozen as of ROUND 3."

---

## Files to touch (planning)

- contracts/ (docs, index)
- contracts/JSON_SCREEN_CONTRACT.json (additive only if at all)
- system-architecture or refactor_ROUND 3/architecture (contract freeze note)

---

*Planning only; execution later.*
