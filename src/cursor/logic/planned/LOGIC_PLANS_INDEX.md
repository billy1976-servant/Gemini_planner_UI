# Logic Plans Index

**Classification:** REFERENCE — Index of all Logic refactor plans; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Logic (Layout Intelligence + Architecture)  
**Purpose:** Single entry point for the Logic → Layout → State pipeline planning. Cursor file flow: all plans live under `src/cursor/logic/planned/` and are executed in order 1 → 12.

---

## Plan order (execution sequence)

| # | File | Purpose | Status |
|---|------|---------|--------|
| 1 | [1_LOGIC_LAYOUT_CONTRACT_PLAN.md](../complete/1_LOGIC_LAYOUT_CONTRACT_PLAN.md) | Logic ↔ Layout boundary: Logic suggests, Layout resolves; no cross-store mutations. | ✅ Complete |
| 2 | [2_STATE_AND_OVERRIDE_ORCHESTRATION_PLAN.md](../complete/2_STATE_AND_OVERRIDE_ORCHESTRATION_PLAN.md) | Override precedence, storage, and guarantees (override → explicit → suggestion → default). | ✅ Complete |
| 3 | [3_BLUEPRINT_TO_RUNTIME_WIRING_PLAN.md](../complete/3_BLUEPRINT_TO_RUNTIME_WIRING_PLAN.md) | Blueprint → Screen JSON → runtime; compilation vs runtime; no hardcoded layout IDs. | ✅ Complete |
| 4 | [4_CONTEXTUAL_LAYOUT_LOGIC_PLAN.md](../complete/4_CONTEXTUAL_LAYOUT_LOGIC_PLAN.md) | Content → traits: rules map section content/slots to suggested traits (no layout IDs). | ✅ Complete |
| 5 | [5_LAYOUT_DECISION_ENGINE_PLAN.md](../complete/5_LAYOUT_DECISION_ENGINE_PLAN.md) | Scores compatible layouts by traits and context; outputs one recommended layout ID. | ✅ Complete |
| 6 | [6_USER_PREFERENCE_ADAPTATION_PLAN.md](../complete/6_USER_PREFERENCE_ADAPTATION_PLAN.md) | "More / less like this" → trait weight deltas; preference memory read by Decision Engine. | ✅ Complete |
| 7 | [7_TRAIT_REGISTRY_SYSTEM_PLAN.md](../complete/7_TRAIT_REGISTRY_SYSTEM_PLAN.md) | Single source of truth for layout ID ↔ traits; read-only at runtime; JSON-only updates. | ✅ Complete |
| 8 | [8_SUGGESTION_INJECTION_POINT_PLAN.md](../complete/8_SUGGESTION_INJECTION_POINT_PLAN.md) | Where resolver calls Logic for one suggested layout ID; no store writes; single call site. | ✅ Complete |
| 9 | [9_STATE_INFLUENCE_RULES_PLAN.md](../complete/9_STATE_INFLUENCE_RULES_PLAN.md) | What Logic may read from state; never write (except Plan 6 preference memory). | ✅ Complete |
| 10 | [10_EXPLAINABILITY_CONTRACT_PLAN.md](10_EXPLAINABILITY_CONTRACT_PLAN.md) | Format and rules for tracing every layout decision (source, suggestion detail, compatibility). | Planned |
| 11 | [11_LOGIC_PIPELINE_ORCHESTRATION_PLAN.md](11_LOGIC_PIPELINE_ORCHESTRATION_PLAN.md) | Order of engines (Contextual → Decision Engine) and single entry point from resolver. | Planned |
| 12 | [12_TRAIT_CAPABILITY_ALIGNMENT_PLAN.md](12_TRAIT_CAPABILITY_ALIGNMENT_PLAN.md) | Alignment between traits and layout capabilities/slots; governance and validation. | Planned |

---

## Pipeline summary

```
Plans 1–3:   Foundation (Contract, State/Override, Blueprint → Runtime)
Plans 4–6:   Engines (Contextual Logic, Decision Engine, User Preference)
Plans 7–8:   Data + injection (Trait Registry, Suggestion Injection Point)
Plans 9–10:  Boundaries (State Influence Rules, Explainability Contract)
Plans 11–12: Orchestration + governance (Pipeline order, Trait–Capability Alignment)
```

---

## Cursor file flow

- **Inbox:** `src/cursor/logic/inbox/` — new ideas before promotion.
- **Planned:** `src/cursor/logic/planned/` — approved plans 1–12 and this index.
- **Complete:** `src/cursor/logic/complete/` — plans marked complete after implementation.

See [src/cursor/RULES.md](../RULES.md) for plan promotion and change log rules.

---

## Change Log

- [2025-02-04] Index created; plans 7–12 added to cursor file flow.
- [2025-02-04] Plan 1 marked complete; link updated to logic/complete; Status column added.
- [2025-02-04] Plan 2 marked complete; link updated to logic/complete.
- [2025-02-04] Plan 3 marked complete; link updated to logic/complete.
- [2025-02-04] Plan 4 marked complete; link updated to logic/complete.
- [2025-02-04] Plan 5 marked complete; link updated to logic/complete.
- [2025-02-04] Plan 6 marked complete; link updated to logic/complete.
- [2025-02-04] Plan 7 marked complete; link updated to logic/complete.
- [2025-02-04] Plan 8 marked complete; link updated to logic/complete.
- [2025-02-04] Plan 9 marked complete; link updated to logic/complete.
