# ROUND 3 — Phase 02: Authority Single Source

**Goal:** Single authority per domain (state, layout, behavior, registry); verify and document.

---

## Objectives

1. **State:** Single deriveState (state-resolver); single dispatchState (state-store). Verify no other state derivation or write path.
2. **Layout:** Single getSectionLayoutId and resolveLayout in layout/; no duplicate "which layout id" or "layout definition" elsewhere.
3. **Behavior:** Single behavior-listener; single action-registry for action execution. Verify no competing behavior dispatch.
4. **Registry:** Single Registry (engine/core/registry.tsx) for type→component; catalogs (definitions, organs, layout IDs) documented as data only.
5. Document the "authority ladder" in one place (e.g. RUNTIME_AUTHORITY_LADDER or TRUNK_ARCHITECTURE_TARGET).

---

## Acceptance criteria

- [ ] Each domain (state, layout, behavior, registry) has exactly one documented authority; no duplicate authority in code.
- [ ] Authority ladder doc updated with R2/R3 state (getSectionLayoutId in layout, etc.).
- [ ] Grep/audit: no second deriveState, no second resolveLayout for section, no second Registry for component map.

---

## Files to touch (planning)

- layout/, state/, engine/core/behavior-listener.ts, engine/core/registry.tsx (verification only)
- docs: system-architecture, refactor_ROUND 3/architecture, RUNTIME_AUTHORITY_LADDER

---

*Planning only; execution later.*
