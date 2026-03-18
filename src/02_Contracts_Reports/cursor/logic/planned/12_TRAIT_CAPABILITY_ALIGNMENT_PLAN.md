# 12 — Trait–Capability Alignment Plan

**Execution order:** 12 of 12  
**Classification:** FOUNDATIONAL — Alignment between traits and layout capabilities/slots; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN, src/layout/requirements

**Domain:** Logic + Layout (Governance)  
**Status:** Planning  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define how traits (Trait Registry, Plan 7) align with layout capabilities (slots, structure) so that the trait registry and the compatibility engine stay consistent. Traits describe "what" a layout is good for; capabilities describe "what" a section can support. This plan prevents traits that imply capabilities not reflected in the layout requirement registries and defines governance for adding new layouts and traits.

---

## Inputs (Design-Time / Governance)

| Input | Description |
|-------|-------------|
| **Trait registry** | Layout ID → set of trait identifiers (Plan 7). |
| **Layout requirement registries** | Section/card/organ layout requirements and slot definitions (e.g. src/layout/requirements/, compatibility layer). |
| **Layout ID sets** | Page-layouts, component-layouts, organ layout profiles. |

These are static configs. Alignment is checked at design time or via validation when configs change.

---

## Outputs

This plan does not define runtime outputs. It defines:

- **Governance rules:** e.g. every trait used in the registry must be defined in a trait taxonomy; every layout ID in the registry must exist in the Layout system’s ID sets; traits that imply slots (e.g. `media-prominent`) should align with requirement definitions.
- **Optional validation checklist** for adding new layouts or traits: verify layout ID exists in Layout, verify traits are in taxonomy, verify trait–slot implications are consistent with requirements.

---

## What It Can and Cannot Modify

| Can | Cannot |
|-----|--------|
| Define rules and an optional validation process for config edits. | Modify runtime behavior. Registry and requirement owners follow alignment rules when editing JSON. |
| Recommend where trait taxonomy and validation live (e.g. schema, CI, or doc). | Change how compatibility or Decision Engine work at runtime; they already use registry and requirements. |

---

## How It Connects to Layout

- **Layout owns** capability and requirement definitions (slots, required slots per layout, section/card/organ requirements).
- **Trait registry** (Logic/config) must stay consistent so that Decision Engine scoring and compatibility filtering are coherent. Example: a layout tagged `media-prominent` should require or support an image (or media) slot where that trait is used; otherwise scoring could recommend a layout that compatibility would not allow for a section without that slot.
- **No contradiction:** A trait must not imply a capability that the layout’s requirements do not already enforce or allow.

---

## How It Connects to State

- **No connection.** Alignment is between static configs. State is not read or written by this governance.

---

## Determinism Rules

- **N/A for governance.** At runtime, compatibility and trait lookup remain deterministic as defined in other plans (Plans 5, 7, and layout compatibility).

---

## Non-Negotiable Constraints

1. **No trait in the registry that contradicts layout requirements.** If a trait implies a slot or structure, layouts with that trait must align with the requirement definitions that reference that slot or structure.
2. **Single place for "valid traits."** A trait taxonomy or registry section defines the set of allowed trait identifiers. New layouts get traits only from that set.
3. **New layouts:** When adding a layout ID to the system, it must be added to the trait registry with a consistent trait set and to the appropriate requirement registry; alignment rules apply.
4. **Optional validation step** when adding layouts/traits to avoid drift (e.g. schema check or CI step that ensures every layout in the trait registry exists in Layout ID sets and every trait is in the taxonomy).

---

## Change Log

- [2025-02-04] Plan created.

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*
