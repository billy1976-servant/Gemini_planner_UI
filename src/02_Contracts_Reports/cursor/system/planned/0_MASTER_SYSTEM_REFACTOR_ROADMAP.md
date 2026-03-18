# Master System Refactor Roadmap

**Purpose:** Define 8–12 tracks and global acceptance criteria for system refactor. No runtime code changes in this doc; planning only.

**Source:** Full system architecture scan; [MASTER_SYSTEM_INDEX.generated.md](../../../docs/SYSTEM_INTELLIGENCE_AUTOGEN/MASTER_SYSTEM_INDEX.generated.md), [DISCONNECTED_SYSTEMS_REPORT.generated.md](../../../docs/SYSTEM_INTELLIGENCE_AUTOGEN/DISCONNECTED_SYSTEMS_REPORT.generated.md).

---

## Tracks (8–12)

| # | Track | Scope |
|---|--------|--------|
| 1 | **Blueprint / Compiler** | Contract and gaps; API vs app wiring; schema and outputs |
| 2 | **Screen loading and API** | Screen load path; API contract; TSX vs JSON |
| 3 | **Registry and component resolution** | JsonRenderer registry; compound resolution; slot/type registry |
| 4 | **Layout system** | Resolver, profiles, compatibility, requirements; suggestion/trait (future) |
| 5 | **Logic engine discovery and wiring** | Engines ACTIVE/DORMANT/DISCONNECTED; flow path; action registry |
| 6 | **State authority and intent governance** | dispatchState surfaces; intent taxonomy; Layout/State separation |
| 7 | **Behavior verb surface and routing** | Contract verbs; action routing; state:*/navigate/visual-proof |
| 8 | **Organ expansion and variant governance** | resolve-organs; organ-registry; variant resolution; override stores |
| 9 | **Skin bindings and data flow** | applySkinBindings; palette; shells; compile path |
| 10 | **Runtime traceability and decision trace** | Explainability; trace (source, layoutId, suggestion); decision log |
| 11 | **JSON registry coverage and validation** | Slot names; allow-lists; capability lists; no hardcoded options |
| 12 | **Dead code and duplication removal** | Unreachable modules; duplicate logic; script vs app boundaries |

---

## Global acceptance criteria

- **No hardcoded options:** All dropdowns and option lists are capability-driven or from JSON registries (see JSON_DRIVEN_VIOLATIONS.generated.md).
- **All dropdowns capability-driven:** Section layout, card preset, organ variant, etc. derive options from layout/requirement/registry data.
- **All engines either wired or removed:** No orphan engines; each engine is either on a documented path (ACTIVE/DORMANT) or removed/archived (DISCONNECTED by design).
- **State mutation surfaces bounded:** All state writes via dispatchState or documented store setters; no Logic→Layout/State direct mutation (see STATE_WRITE_SURFACE_AUDIT.generated.md).
- **Registry complete:** Layout IDs, slot names, capability allow-lists, and component types are defined in JSON or registry and loaded at runtime where needed.
- **Layout suggestions explainable:** When suggestion/trait path is implemented, every suggested layout ID has a trace (source, layoutId, suggestionDetail).

---

## Plan files (12)

Each track has a dedicated plan in `planned/`:

1. `1_BLUEPRINT_COMPILER_CONTRACT_AND_GAPS_PLAN.md`
2. `2_SCREEN_LOADING_AND_API_CONTRACT_PLAN.md`
3. `3_REGISTRY_AND_COMPONENT_RESOLUTION_PLAN.md`
4. `4_LAYOUT_SYSTEM_REFACTOR_MASTER_PLAN.md`
5. `5_LOGIC_ENGINE_DISCOVERY_AND_WIRING_PLAN.md`
6. `6_STATE_AUTHORITY_AND_INTENT_GOVERNANCE_PLAN.md`
7. `7_BEHAVIOR_VERB_SURFACE_AND_ROUTING_PLAN.md`
8. `8_ORGAN_EXPANSION_AND_VARIANT_GOVERNANCE_PLAN.md`
9. `9_SKIN_BINDINGS_AND_DATA_FLOW_PLAN.md`
10. `10_RUNTIME_TRACEABILITY_AND_DECISION_TRACE_PLAN.md`
11. `11_JSON_REGISTRY_COVERAGE_AND_VALIDATION_PLAN.md`
12. `12_DEAD_CODE_AND_DUPLICATION_REMOVAL_PLAN.md`

After verification, plans move to `complete/` and rollup is in MASTER_VERIFICATION_SUMMARY.generated.md.

---

## Verification Report (Step 0)

| Check | Result |
|-------|--------|
| 8–12 tracks defined | PASS (12 tracks) |
| Global acceptance criteria stated | PASS |
| Plan file names and index | PASS |
| No runtime code changes in this doc | PASS |
