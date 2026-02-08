# 10 — Explainability Contract Plan

**Execution order:** 10 of 12  
**Classification:** FOUNDATIONAL — How every layout decision can be traced and debugged; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Architecture (Logic + Layout)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define how every resolved layout decision can be traced and debugged. Every resolved layout must be explainable from inputs; this plan defines the format and rules for explanation and trace data. The Layout resolver and the Logic pipeline (Decision Engine, injection point) may produce and expose explanation objects for debugging and UX (e.g. "suggested" badge).

---

## Inputs

The same inputs that drive resolution:

- Section node, override maps, explicit node.layout, suggestion from Logic (when used), template default, compatibility result (sectionValid, cardValid, organValid).

Explanation is **derived from** these inputs; it does not add new inputs.

---

## Outputs (Explanation Shape)

Explanation is read-only reporting. Abstract shape:

| Field | Description | When present |
|-------|-------------|--------------|
| **source** | One of: `"override"` \| `"explicit"` \| `"suggestion"` \| `"default"`. | Always; indicates which source won. |
| **layoutId** | The resolved layout ID. | Always. |
| **suggestionDetail** (optional) | When source is `"suggestion"`: e.g. `{ recommendedId, matchedTraits, score }`. | When Logic suggestion was used. |
| **compatibility** (optional) | e.g. `{ sectionValid, cardValid, organValid }` or summary of why certain IDs were excluded. | When useful for debugging. |

Optional **trace** array for multi-step explanation (e.g. "override absent, explicit absent, suggestion returned X because traits Y, Z matched"). Format is stable for tooling and logs; no PII or unstable identifiers.

---

## What It Can and Cannot Modify

| Can | Cannot |
|-----|--------|
| Populate and return explanation objects. Logic (Decision Engine) and Layout resolver may both contribute. | Change layout or any state. Explainability is read-only reporting. |
| Expose explanation to dev tools, dropdown badge, or logs. | Introduce new state stores solely for explanation; explanation is derived at resolution time. |

---

## How It Connects to Layout

- **Resolver** produces the final explanation: which source won (override | explicit | suggestion | default) and which layoutId was resolved.
- **Compatibility result** can be included in the story (e.g. why certain layout IDs were not in the compatible set). Layout does not expose internal implementation details beyond what is needed for debugging.

---

## How It Connects to State

- Explanation may **reference** state that was read (e.g. "override was present for this section") but must not expose write paths or mutable internals.
- No persistence of explanation is required by this contract; it may be computed on demand per resolution.

---

## Determinism Rules

- **Same resolution run ⇒ same explanation** for the same inputs. Explanation is derived from the same inputs that drove the decision.
- **Stable format.** Field names and value shapes are consistent so that debug tools and logs can rely on them.

---

## Non-Negotiable Constraints

1. **Every resolved layout has a defined source.** One of: override | explicit | suggestion | default. No "unknown" or silent path.
2. **Decision Engine** can optionally return `matchedTraits` and `score` when suggestion is used; these feed into `suggestionDetail` for explainability.
3. **No PII or unstable identifiers** in explanation. Use stable section keys and layout IDs; avoid user-specific or session-specific data in the standard shape.
4. **Format is stable** for debugging and tooling. Changes to the explanation shape are contract changes.

---

## Change Log

- [2025-02-04] Plan created.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*
