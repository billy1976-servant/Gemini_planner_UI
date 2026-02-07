# ROUND 2 — Phase 08: Contract Reseal

**Goal:** Update contracts and docs to reflect single layout authority, single content entrypoint, and registry/catalog distinction. No contract schema changes.

---

## Objectives

1. **Layout:** Document that section layout id resolution is owned by layout/ (getSectionLayoutId); layout definition by resolveLayout. Update BOUNDARY_SEPARATION_CHECKLIST or PIPELINE if needed.
2. **Content:** Document that the only content resolution entrypoint is logic/content/content-resolver; content/ is legacy or removed.
3. **Registry:** Document Registry (engine/core/registry.tsx) = type→component; catalogs = definitions, organs, layout IDs (data only).
4. **Contracts:** No change to JSON_SCREEN_CONTRACT.json or other schema files; only narrative/docs.

---

## Acceptance criteria

- [ ] At least one doc (system-architecture or contracts or refactor_ROUND 2/architecture) states: layout owns section layout id + definition; content entrypoint is logic/content; Registry vs catalogs defined.
- [ ] BOUNDARY_SEPARATION_CHECKLIST (if present) still accurate; no new cross-boundary writes.
- [ ] No edits to JSON_SCREEN_CONTRACT.json or schema files.

---

## Files to touch (planning)

- src/system-architecture/*.md or src/docs/ARCHITECTURE_AUTOGEN
- src/contracts (narrative only)
- refactor_ROUND 2/architecture/ (new doc or link)

---

*Planning only; execution later.*

---

## Execution Record

**Files touched:** *(To be filled at execution.)*  
**Tests run:** *(To be filled at execution.)*  
**Confirmation:** *(To be filled at execution.)*
