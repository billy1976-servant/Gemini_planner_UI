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
