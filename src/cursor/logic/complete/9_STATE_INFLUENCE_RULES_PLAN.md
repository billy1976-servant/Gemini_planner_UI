# 9 — State Influence Rules Plan

**Execution order:** 9 of 12  
**Classification:** FOUNDATIONAL — What Logic may read from state; never write; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Architecture (State, Logic, Layout)  
**Status:** Complete  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define an explicit contract for what Logic may **read** from state (layout store, override maps, viewport, user preferences, etc.) and what Logic must **never write**. This ensures no cross-store mutations and clear boundaries between Logic, Layout, and State.

---

## Inputs (What Logic May Read)

Logic is allowed to read the following, only through defined read-only APIs or arguments supplied by the caller:

| Source | Description | How provided |
|--------|-------------|--------------|
| **Section node** | Structure, children, content, role. | Passed as argument (e.g. from resolver or render pipeline). |
| **Compatible layout set** | Set of layout IDs valid for the section. | Supplied by Layout (e.g. from compatibility evaluation). |
| **Override maps** | Current user overrides for section/card/organ layout (read-only). | Passed as argument or via read-only getter; Logic never writes. |
| **Viewport / screen size band** | e.g. narrow, medium, wide. | From UI or viewport API; passed in or read from a read-only source. |
| **Density preference** | e.g. compact, default, spacious. | From user settings or defaults; read-only. |
| **Preference weights** | Trait id → number from User Preference (Plan 6). | Read-only; supplied by Plan 6 accessor. |
| **Template ID and template defaults** | Which template is active and its default layout. | Read-only; from layout store or profile. |

Logic does **not** read from arbitrary global mutable state. All reads are from immutable snapshots or stable arguments at call time.

---

## Outputs

Logic outputs only:

- **Trait sets or trait weights** (from Contextual Logic, Plan 4).
- **Recommended layout ID** (from Decision Engine, Plan 5), derived only from trait registry lookup over the compatible set.
- **Optional explanation object** (per Plan 10).

No state mutations are outputs. Return values and explanation are the only effects.

---

## What Logic Can and Cannot Modify

| Can | Cannot |
|-----|--------|
| **Preference memory (Plan 6):** The User Preference Adaptation layer may write **trait weights** (trait id → number) when the user triggers "more like this" / "less like this." This is the only writable state owned by Logic. | **Layout store:** Logic never writes. |
| | **Override store (section/card/organ overrides):** Logic never writes. |
| | **node.layout:** Logic never writes. |
| | **Any other engine's store:** Logic never writes. |

---

## State Influence Rules Table

| State / store | Logic may read? | Logic may write? |
|---------------|-----------------|------------------|
| Section node (structure, content) | Yes (as argument) | No |
| Compatible layout ID set | Yes (supplied by Layout) | No |
| sectionLayoutPresetOverrides | Yes (read-only) | No |
| cardLayoutPresetOverrides | Yes (read-only) | No |
| organInternalLayoutOverrides | Yes (read-only) | No |
| Layout store (templateId, experience, etc.) | Yes (read-only) | No |
| Viewport / density / user context | Yes (read-only) | No |
| Preference weights (trait id → number) | Yes (read-only) | No (Plan 6 writes; Logic pipeline only reads) |
| Preference memory (trait weights) | Yes (read) | Only via Plan 6 signal API (more/less like this) |

---

## How It Connects to Layout

- Logic reads layout-related state only through **read-only** APIs or arguments supplied by the Layout resolver. Layout never grants Logic write access to layout store or override store.
- The compatible set and any layout IDs in scope are always provided by Layout; Logic does not discover them independently.

---

## How It Connects to State

- **Read-only list is explicit.** Any state not listed above as "Logic may read" is off-limits unless the contract is updated.
- **Preference memory** is the only writable state for Logic, and only through the Plan 6 contract (signal handling). The Layout resolver and other engines do not write to preference memory.

---

## Determinism Rules

- Reads are from **immutable snapshots or stable arguments** at call time. Logic must not rely on mutable global state that could change mid-resolution.
- Same snapshot / same arguments ⇒ same Logic output. No hidden side effects that would make behavior non-deterministic.

---

## Non-Negotiable Constraints

1. **No cross-engine store writes.** Logic does not write to layout store, override store, or node.layout. The only writable state for Logic is preference memory, and only via Plan 6.
2. **Explicit read-only list.** Only the state sources listed in this plan may be read by Logic. New read sources require a contract update.
3. **Preference memory** is written only by the Plan 6 signal path; the suggestion pipeline (Plans 4, 5, 8, 11) only reads.

---

## Verification (Plan 9 completion)

- **Spec published:** [src/docs/ARCHITECTURE_AUTOGEN/STATE_INFLUENCE_RULES.md](../../docs/ARCHITECTURE_AUTOGEN/STATE_INFLUENCE_RULES.md) is the canonical reference.
- **Layout/override writes:** Only UI writes to layout store and override stores; no Logic engine writes.
- **Preference memory:** When Plan 6 is implemented, only its signal path writes; suggestion pipeline only reads.
- **Read sources:** Resolver passes section node, profile, override maps; compatible set supplied by Layout at injection point.

---

## Change Log

- [2025-02-04] Plan created.
- [2025-02-04] Spec formalized in ARCHITECTURE_AUTOGEN; audits passed; marked complete; moved to logic/complete.
