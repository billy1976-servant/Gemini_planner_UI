# Trait Registry System

**Source:** Logic Plan 7 — [7_TRAIT_REGISTRY_SYSTEM_PLAN.md](../../cursor/logic/complete/7_TRAIT_REGISTRY_SYSTEM_PLAN.md).  
**Classification:** FOUNDATIONAL — Single source of truth for layout ID ↔ traits; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN  
**Implementation status:** PLANNED. No trait-registry.json or layout-traits.json in codebase; no layout→trait mapping in code. Prerequisite for Layout Decision Engine (Plan 5), Contextual Layout (Plan 4), User Preference (Plan 6).

The Trait Registry is the single source of truth for **layout ID → traits** (and optionally trait → layout IDs). Static config; consumed by Layout Decision Engine (Plan 5), Contextual Layout Logic (Plan 4), and User Preference Adaptation (Plan 6). No layout IDs or trait lists are hardcoded in code; all mapping comes from JSON.

---

## Purpose

- **Input:** Registry JSON (e.g. `trait-registry.json`, `layout-traits.json`) mapping layout ID → set of trait identifiers. Layout ID set comes from Layout system (page-layouts, component-layouts, requirement registries).
- **Output:** For a layout ID → trait set (Decision Engine scoring; Plan 6 signal translation). Optionally trait → layout IDs (explainability, tooling). Registry is read-only at runtime.
- **Ownership:** Registry file maintained by editing JSON at design time. New layouts/traits added via JSON-only; no programmatic mutation from engines or resolver.

---

## Inputs

| Input | Description | Source |
|-------|-------------|--------|
| **Registry JSON** | File or loaded config mapping layout ID → set of trait identifiers. | Static config under logic or layout config. |
| **Layout ID set** | Valid layout IDs (section, card, organ). Registry entries should align; Layout supplies IDs from page-layouts, requirement registries. | Layout system (read-only for registry). |

---

## Outputs

| Output | Description | Consumer |
|--------|-------------|----------|
| **Layout ID → trait set** | Given layout ID, return set of trait identifiers. | Decision Engine (Plan 5) scoring; User Preference (Plan 6) "current layout" → traits at signal time. |
| **Trait → layout IDs (optional)** | Reverse index for explainability and tooling. | Optional; Decision Engine or debug tools. |
| **Read-only at runtime** | No runtime writes; load once (or on config change); lookups are reads only. | All consumers. |

---

## What It Can and Cannot Modify

| Can | Cannot |
|-----|--------|
| Registry is **static config**. At runtime nothing modifies it; Logic and Layout only **read**. | No runtime writes. No code adds/removes layout IDs or traits at runtime. |
| **Ownership:** File maintained by editing JSON (design-time). New layouts/traits via JSON-only. | No programmatic mutation from engines or resolver. |

---

## How It Connects to Layout

- **Layout supplies the layout ID set.** Registry does not define which layout IDs exist; those come from page-layouts, section/card/organ requirement registries, and compatibility filtering.
- **Compatibility engine** filters by structure (slots, requirements); **trait registry** describes traits for scoring. Layout: "which IDs are valid for this section"; registry: "what traits each of those IDs has."
- **Consistency:** Every layout ID in the registry should exist in the Layout system's ID sets. Alignment between traits and layout capabilities is in Plan 12.

---

## How It Connects to State

- **No direct connection.** Registry is stateless; does not read from or write to any state store.
- **Preference layer (Plan 6)** uses the registry at signal time to map "current layout ID" → traits; registry is read-only in that path.

---

## Determinism Rules

- **Same registry + layout ID ⇒ same trait set.** Lookup is a pure function of registry contents and layout ID.
- **Registry load order:** If multiple files are merged (e.g. base + overrides), merge rules must be defined so the result is deterministic (e.g. last-wins per layout ID).
- **No hidden state.** Trait set for a layout ID does not depend on call order or mutable globals.

---

## Non-Negotiable Constraints

1. **No hardcoded layout IDs or trait lists in code.** All mapping from registry JSON. New layouts and traits by editing JSON only.
2. **Single source of truth.** One registry (or one deterministic merge) for layout ID → traits. Decision Engine, Contextual Logic, and User Preference all use the same registry.
3. **Read-only at runtime.** No engine or resolver writes to the registry. Load and lookup only.
4. **Trait identifiers are stable.** Same string id used in registry, contextual rules (Plan 4), preference memory (Plan 6), and Decision Engine scoring (Plan 5).

---

## Verification (Plan 7 completion)

- **Spec published:** This document is the canonical reference.
- **No trait registry yet:** No `trait-registry.json` or `layout-traits.json` in codebase; no hardcoded layout→trait mapping in code.
- **Layout ID set:** Layout system supplies IDs via page-layouts.json, getLayout2Ids(), requirement registries; registry will align with these when added.
- **Consumers specified:** Plan 5 (scoring), Plan 4 (contextual rules reference traits), Plan 6 (signal → traits lookup) all depend on same registry.
