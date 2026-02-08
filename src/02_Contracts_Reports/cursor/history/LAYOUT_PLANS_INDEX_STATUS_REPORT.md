# Layout Plans Index — Status Report (Completed)

**Status:** Completed  
**Section:** History of corrections — `src/cursor/history/`  
**Classification:** REFERENCE — Index of all Layout continuation and cleanup plans; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Layout (Compatibility, Registry, Resolver, Overrides, Logic interface, Governance)  
**Purpose:** Single entry point for the Layout System Continuation and Cleanup planning. Plans 1–10 have been verified and moved to `src/cursor/layout/complete/` (each plan includes its verification report at the end). This status report is archived here for history of corrections.

---

## Plan order (execution sequence)

Plans 1–10 are in **complete** with verification reports appended. Links below point to `../layout/complete/`.

| # | File | Purpose |
|---|------|---------|
| 1.1 | [1.1_LAYOUT_COMPATIBILITY_CONTRACT_PLAN.md](../layout/complete/1.1_LAYOUT_COMPATIBILITY_CONTRACT_PLAN.md) | Slot names, required vs available, evaluateCompatibility contract; layout cannot change content. |
| 1.2 | [1.2_LAYOUT_REGISTRY_PLAN.md](../layout/complete/1.2_LAYOUT_REGISTRY_PLAN.md) | Section/card/organ layout IDs and requirement registries as single source of truth; JSON-only extension; no code fallbacks. |
| 1.3 | [1.3_DROPDOWN_SOURCE_OF_TRUTH_PLAN.md](../layout/complete/1.3_DROPDOWN_SOURCE_OF_TRUTH_PLAN.md) | Dropdown options from registry IDs + compatibility filter; single source for section, card, organ internal. |
| 1.4 | [1.4_SUGGESTION_INTAKE_AND_PRECEDENCE_PLAN.md](../layout/complete/1.4_SUGGESTION_INTAKE_AND_PRECEDENCE_PLAN.md) | Precedence override → explicit → suggestion → default; suggestion intake (Planned Future; Logic Plan 8). |
| 1.5 | [1.5_LAYOUT_RESOLVER_REFACTOR_PLAN.md](../layout/complete/1.5_LAYOUT_RESOLVER_REFACTOR_PLAN.md) | resolveLayout / applyProfileToNode contract; page + component merge; no silent fallbacks. |
| 1.6 | [1.6_FALLBACK_REMOVAL_AND_JSON_DEFAULTING_PLAN.md](../layout/complete/1.6_FALLBACK_REMOVAL_AND_JSON_DEFAULTING_PLAN.md) | Remove code fallbacks; default section layout from JSON/template only; section→card allow-list to JSON. |
| 1.7 | [1.7_OVERRIDE_SYSTEM_ALIGNMENT_PLAN.md](../layout/complete/1.7_OVERRIDE_SYSTEM_ALIGNMENT_PLAN.md) | Section/card/organ override stores; keying (screenId + sectionKey); alignment with Logic Plan 2. |
| 1.8 | [1.8_EXPLAINABILITY_AND_TRACE_PLAN.md](../layout/complete/1.8_EXPLAINABILITY_AND_TRACE_PLAN.md) | Layout-side trace: source, layoutId, optional compatibility/suggestionDetail; align with Logic Plan 10. |
| 1.9 | [1.9_LAYOUT_LOGIC_INTERFACE_FINALIZATION_PLAN.md](../layout/complete/1.9_LAYOUT_LOGIC_INTERFACE_FINALIZATION_PLAN.md) | What Layout exposes to Logic (capabilities, compatible sets); Logic suggests only; align with Logic Plan 1 and 8. |
| 1.10 | [1.10_LAYOUT_VALIDATION_AND_GOVERNANCE_PLAN.md](../layout/complete/1.10_LAYOUT_VALIDATION_AND_GOVERNANCE_PLAN.md) | Requirement registry coverage; slot name governance (SLOT_NAMES.md); validation and diagnostics. |

---

## Pipeline summary

```
Plans 1–3:   Compatibility, Registry, Dropdown (source of truth)
Plans 4–5:   Precedence, Suggestion intake, Resolver contract
Plans 6–7:   Fallback removal, Override alignment
Plans 8–9:   Explainability, Layout–Logic interface
Plan 10:     Validation and governance
```

---

## Layout Authority Resolution Refactor (executed 2025-02-04)

**Status: Complete.** Deterministic layout priority: explicit node.layout → profile override → template role → template default → undefined. Implementation: `src/engine/core/json-renderer.tsx` (applyProfileToNode). Doc: [LAYOUT_SIGNAL_PRIORITY.generated.md](../../../docs/ARCHITECTURE_AUTOGEN/LAYOUT_SIGNAL_PRIORITY.generated.md). Authority ladder: [RUNTIME_AUTHORITY_LADDER.md](../../../docs/ARCHITECTURE_AUTOGEN/RUNTIME_AUTHORITY_LADDER.md) Section Layout Authority updated.

---

## Related documents

- **Master roadmap:** [MASTER_ENGINE_COMPLETION_ROADMAP.md](../layout/MASTER_ENGINE_COMPLETION_ROADMAP.md) — Phases 1–9 layout→adaptive roadmap.
- **Logic plans:** `src/cursor/logic/planned/` — Logic ↔ Layout contract (1), State/override (2), Suggestion injection (8), Explainability (10).
- **Architecture:** `src/docs/ARCHITECTURE_AUTOGEN/` — LAYOUT_RESOLUTION_CONTRACT, LAYOUT_SIGNAL_PRIORITY.generated.md, LAYOUT_COMPATIBILITY_ENGINE, RUNTIME_FALLBACKS, RUNTIME_AUTHORITY_LADDER, etc.
- **System map:** `src/docs/SYSTEM_MAP_AUTOGEN/` — ENGINE_INDEX, RUNTIME_PIPELINE, CONTRACTS_EXTRACTED.

---

## Cursor file flow

- **Planned:** `src/cursor/layout/planned/` — Active layout index and MASTER_ENGINE_COMPLETION_ROADMAP. Plans 1–10 in complete after verification.
- **Complete:** `src/cursor/layout/complete/` — Older: 0.0–0.7 (e.g. 0.0_MASTER_LAYOUT_FINALIZATION, 0.1_organ-layout-plan). New: 1.1–1.10 plans (with verification report appended).
- **History of corrections:** `src/cursor/history/` — This file; completed status reports and indexes archived here.
- **Inbox:** `src/cursor/layout/inbox/` — New ideas before promotion.

---

*This index is completed. Archived in src/cursor/history/ for history of corrections. No implementation changes implied.*
