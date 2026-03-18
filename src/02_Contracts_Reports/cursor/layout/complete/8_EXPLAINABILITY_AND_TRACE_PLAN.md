# 8 — Explainability and Trace Plan

**Execution order:** 8 of 10  
**Classification:** FOUNDATIONAL — How every layout decision can be traced; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN, src/cursor/logic/planned

**Domain:** Layout (Explainability, Debug)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define how every resolved layout decision can be traced and debugged from the Layout side. Explanation is derived at resolution time; format aligns with Logic Plan 10 (Explainability Contract). Layout produces source and layoutId; optional compatibility summary; suggestion detail when source is suggestion (Planned Future).

---

## Current Runtime (Verified)

Resolver does not currently produce an explanation object. applyProfileToNode sets next.layout and _effectiveLayoutPreset; evaluateCompatibility is called and logged in dev. There is no structured trace (source, layoutId, suggestionDetail) in code today. This plan defines the **contract** and marks full implementation as **Planned Future** aligned with Logic Plan 10.

---

## Explanation Shape (Contract)

Read-only reporting. Abstract shape:

| Field | Description | When present |
|-------|-------------|--------------|
| **source** | One of: "override" \| "explicit" \| "suggestion" \| "default". | Always; indicates which source won. |
| **layoutId** | The resolved layout ID (or undefined when no layout). | Always. |
| **suggestionDetail** (optional) | When source is "suggestion": e.g. { recommendedId, matchedTraits, score }. | When Logic suggestion was used (Planned Future). |
| **compatibility** (optional) | e.g. { sectionValid, cardValid, organValid } or summary of missing slots. | When useful for debugging; from evaluateCompatibility. |

Optional **trace** array for multi-step explanation (e.g. "override absent, explicit absent, suggestion returned X"). Format stable for tooling and logs; no PII or unstable identifiers. Logic Plan 10 defines the same source enum and layoutId; Layout and Logic may both contribute to the same explanation object.

---

## What Explainability Can and Cannot Do

| Can | Cannot |
|-----|--------|
| Be derived at resolution time from override, explicit, suggestion, default, and compatibility. | Change layout or any state; explainability is read-only reporting. |
| Be exposed to dev tools, dropdown "suggested" badge, or logs. | Introduce new state stores solely for explanation; explanation is derived per resolution. |

---

## How It Connects to Resolver and Logic

- **Resolver:** When resolver (or applyProfileToNode) is extended to produce explanation, it sets source (which input won), layoutId, and optionally compatibility. Suggestion detail, when source is suggestion, may be supplied by Logic at the injection point (Logic Plan 8, 10).
- **Logic Plan 10 (Explainability Contract):** Same source enum and layoutId; suggestionDetail when source is "suggestion". Layout does not expose internal implementation details beyond what is needed for debugging.
- **Compatibility:** evaluateCompatibility result can be included in the explanation (e.g. why certain IDs were excluded from compatible set) without branching resolution on it.

---

## Determinism Rules

- Same resolution run ⇒ same explanation for the same inputs. Explanation is derived from the same inputs that drove the decision. Stable field names and value shapes for debug tools and logs.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*

---

## Verification Report (Step 8)

**Plan:** [8_EXPLAINABILITY_AND_TRACE_PLAN.md](8_EXPLAINABILITY_AND_TRACE_PLAN.md)  
**Scope:** Verify current runtime vs contract; no structured explanation today; contract defined for Planned Future (Logic Plan 10).  
**Date:** 2025-02-04

---

### Summary

| Check | Status |
|-------|--------|
| Resolver does not produce an explanation object today | ✅ PASS |
| applyProfileToNode sets next.layout and _effectiveLayoutPreset | ✅ PASS |
| evaluateCompatibility called; result logged in dev only | ✅ PASS |
| No structured trace (source, layoutId, suggestionDetail) in code | ✅ PASS |
| Contract (explanation shape) defined in plan for future implementation | ✅ PASS |

**Overall: PASS** — Current state matches plan: no Layout-side explanation/trace implemented; contract is defined and implementation is Planned Future aligned with Logic Plan 10.

---

### 1. Current runtime (as stated in plan)

| Statement in plan | Verified |
|-------------------|----------|
| "Resolver does not currently produce an explanation object." | ✅ No return type or attached object with source/layoutId/suggestionDetail/compatibility. |
| "applyProfileToNode sets next.layout and _effectiveLayoutPreset." | ✅ next.layout = layoutId; (next as any)._effectiveLayoutPreset = layoutId. |
| "evaluateCompatibility is called and logged in dev." | ✅ const compatibility = evaluateCompatibility({...}); if (process.env.NODE_ENV === "development") console.debug("Layout compatibility:", compatibility). |
| "There is no structured trace (source, layoutId, suggestionDetail) in code today." | ✅ No assignment to source, no suggestionDetail, no explanation object; layoutId is computed but not labeled by source. |

---

### 2. Explanation shape (contract for future)

Plan defines the **contract**; implementation is **Planned Future**. Shape aligns with Logic Plan 10 (Explainability Contract):

| Field | Description | When present |
|-------|-------------|--------------|
| **source** | "override" \| "explicit" \| "suggestion" \| "default" | Always (when implemented). |
| **layoutId** | Resolved layout ID or undefined | Always. |
| **suggestionDetail** (optional) | e.g. { recommendedId, matchedTraits, score } | When source is "suggestion". |
| **compatibility** (optional) | e.g. { sectionValid, cardValid, organValid } or missing slots | When useful for debugging. |

Optional **trace** array for multi-step explanation. Not present in runtime today; contract only.

---

### 3. What is present today

- **Resolution inputs:** overrideId, existingLayoutId, templateDefaultLayoutId → layoutId (override \|\| explicit \|\| default). No suggestion step.
- **Output on node:** next.layout, _effectiveLayoutPreset (both set to layoutId).
- **Compatibility:** evaluateCompatibility result computed and logged in development only; not attached to node or returned as part of an explanation object.
- **Debug visibility:** _effectiveLayoutPreset is used in JsonRenderer debug UI (layout id display); no source or trace.

---

### 4. What explainability can / cannot do (contract)

| Can | Verified (contract) |
|-----|----------------------|
| Be derived at resolution time from override, explicit, suggestion, default, compatibility | Contract only; not implemented. |
| Be exposed to dev tools, dropdown "suggested" badge, or logs | Not implemented; contract allows it. |

| Cannot | Verified |
|--------|----------|
| Change layout or any state; explainability is read-only reporting | Contract; current code does not use compatibility to change layout. |
| Introduce new state stores solely for explanation; derived per resolution | No explanation store in Layout; compatibility is computed, not stored. |

---

### 5. Connection to Logic Plan 10

- Logic Plan 10 defines same source enum and layoutId; suggestionDetail when source is "suggestion".
- Layout Plan 8 states that when resolver is extended to produce explanation, it sets source, layoutId, and optionally compatibility; suggestion detail may be supplied by Logic at injection point.
- No implementation in Layout or Logic for explanation object yet; both plans are design-only for this step.

---

### Conclusion

Step 8 (Explainability and Trace) is **verified**. The runtime matches the plan's description: no explanation object, no structured trace (source, layoutId, suggestionDetail). applyProfileToNode sets layout and _effectiveLayoutPreset; evaluateCompatibility is called and logged in dev. The explanation shape and rules are defined as the contract for future implementation, aligned with Logic Plan 10.

**Next:** Proceed to Step 9 — [9_LAYOUT_LOGIC_INTERFACE_FINALIZATION_PLAN.md](9_LAYOUT_LOGIC_INTERFACE_FINALIZATION_PLAN.md) when ready.
