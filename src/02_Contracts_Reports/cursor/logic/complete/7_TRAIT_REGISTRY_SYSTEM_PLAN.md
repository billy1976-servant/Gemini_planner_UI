# 7 — Trait Registry System Plan

**Execution order:** 7 of 12  
**Classification:** FOUNDATIONAL — Single source of truth for layout ID ↔ traits; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Logic (Layout Intelligence)  
**Status:** Complete  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define the Trait Registry as the single source of truth for layout ID → traits and (optionally) trait → layout IDs. The registry is static config owned by Logic/Layout config; consumed by the Layout Decision Engine (Plan 5), Contextual Layout Logic (Plan 4), and User Preference Adaptation (Plan 6). No layout IDs or trait lists are hardcoded in code; all mapping comes from JSON.

---

## Inputs

| Input | Description | Source |
|-------|-------------|--------|
| **Registry JSON** | File path or loaded config (e.g. `trait-registry.json`, `layout-traits.json`) mapping layout ID → set of trait identifiers. | Static config under logic or layout config. |
| **Layout ID set** | The set of valid layout IDs (section, card, organ). Registry entries should align with these; Layout supplies IDs from page-layouts, component-layouts, requirement registries. | Layout system (read-only for registry). |

---

## Outputs

| Output | Description | Consumer |
|--------|-------------|----------|
| **For a layout ID → trait set** | Given a layout ID, return the set of trait identifiers for that layout. | Decision Engine (Plan 5) for scoring; User Preference (Plan 6) when translating "current layout" → traits on signal. |
| **For a trait → layout IDs (optional)** | Reverse index: given a trait, return layout IDs that have that trait. Used for explainability and tooling. | Optional; Decision Engine or debug tools. |
| **Registry is read-only at runtime** | No runtime writes. Load once (or on config change); all lookups are reads. | All consumers. |

---

## What It Can and Cannot Modify

| Can | Cannot |
|-----|--------|
| Registry is **static config**. At runtime, nothing modifies the registry. Logic and Layout only **read**. | No runtime writes to the registry. No code adds or removes layout IDs or traits at runtime. |
| **Ownership:** The registry file is maintained by editing JSON (design-time). Who owns the file (logic vs layout config) is a project choice; the contract is that new layouts/traits are added via JSON-only process. | No programmatic mutation of registry from engines or resolver. |

---

## How It Connects to Layout

- **Layout supplies the layout ID set.** The registry does not define which layout IDs exist; those come from page-layouts, section/card/organ requirement registries, and compatibility filtering.
- **Compatibility engine** filters by structure (slots, requirements); the **trait registry** describes traits for scoring. Layout provides "which IDs are valid for this section"; registry provides "what traits each of those IDs has."
- **Consistency:** Every layout ID that appears in the registry should exist in the Layout system's ID sets. Alignment between traits and layout capabilities is defined in Plan 12.

---

## How It Connects to State

- **No direct connection.** The registry is stateless; it does not read from or write to any state store.
- **Preference layer (Plan 6)** uses the registry at signal time to map "current layout ID" → traits, then updates preference weights by trait id. Registry is read-only in that path.

---

## Determinism Rules

- **Same registry + layout ID ⇒ same trait set.** Lookup is pure function of registry contents and layout ID.
- **Registry load order:** If multiple files are merged (e.g. base + overrides), merge rules must be defined so that the resulting registry is deterministic (e.g. last-wins per layout ID, or explicit merge strategy).
- **No hidden state.** Trait set for a layout ID does not depend on call order or mutable globals.

---

## Non-Negotiable Constraints

1. **No hardcoded layout IDs or trait lists in code.** All mapping comes from the registry JSON (or equivalent config). New layouts and traits are added by editing JSON only.
2. **Single source of truth.** One registry (or one deterministic merge) for layout ID → traits. Decision Engine, Contextual Logic, and User Preference all use the same registry.
3. **Read-only at runtime.** No engine or resolver writes to the registry. Load and lookup only.
4. **Trait identifiers are stable.** Same string id used in registry, contextual rules (Plan 4), preference memory (Plan 6), and Decision Engine scoring (Plan 5).

---

## Verification (Plan 7 completion)

- **Spec published:** [src/docs/ARCHITECTURE_AUTOGEN/TRAIT_REGISTRY_SYSTEM.md](../../docs/ARCHITECTURE_AUTOGEN/TRAIT_REGISTRY_SYSTEM.md) is the canonical reference.
- **No trait registry yet:** No trait-registry.json or layout-traits.json; no hardcoded layout→trait mapping in code.
- **Layout ID set:** Supplied by layout system (page-layouts, getLayout2Ids(), requirement registries); registry will align when added.
- **Consumers:** Plan 5, 4, 6 all use same registry (single source of truth).

---

## Change Log

- [2025-02-04] Plan created.
- [2025-02-04] Spec formalized in ARCHITECTURE_AUTOGEN; audits passed; marked complete; moved to logic/complete.
