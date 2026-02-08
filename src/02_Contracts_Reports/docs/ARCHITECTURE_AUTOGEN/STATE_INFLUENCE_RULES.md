# State Influence Rules

**Source:** Logic Plan 9 — [9_STATE_INFLUENCE_RULES_PLAN.md](../../cursor/logic/complete/9_STATE_INFLUENCE_RULES_PLAN.md).  
**Classification:** FOUNDATIONAL — What Logic may read from state; never write; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

Explicit contract for what Logic may **read** from state (layout store, override maps, viewport, user preferences, etc.) and what Logic must **never write**. Ensures no cross-store mutations and clear boundaries between Logic, Layout, and State.

---

## Purpose

- **Reads:** Logic may read only from the sources listed below, via defined read-only APIs or arguments supplied by the caller.
- **Writes:** Logic never writes to layout store, override store, or node.layout. The only writable state for Logic is **preference memory** (trait weights), and only via Plan 6 (User Preference Adaptation) when the user triggers "more like this" / "less like this."

---

## Inputs (What Logic May Read)

| Source | Description | How provided |
|--------|-------------|--------------|
| **Section node** | Structure, children, content, role. | Passed as argument (e.g. from resolver or render pipeline). |
| **Compatible layout set** | Set of layout IDs valid for the section. | Supplied by Layout (e.g. from compatibility evaluation). |
| **Override maps** | Current user overrides for section/card/organ layout (read-only). | Passed as argument or via read-only getter; Logic never writes. |
| **Viewport / screen size band** | e.g. narrow, medium, wide. | From UI or viewport API; passed in or read-only source. |
| **Density preference** | e.g. compact, default, spacious. | From user settings or defaults; read-only. |
| **Preference weights** | Trait id → number from Plan 6. | Read-only; supplied by Plan 6 accessor. |
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
| **Preference memory (Plan 6):** User Preference Adaptation may write **trait weights** when the user triggers "more like this" / "less like this." This is the only writable state owned by Logic. | **Layout store:** Logic never writes. |
| | **Override store (section/card/organ overrides):** Logic never writes. |
| | **node.layout:** Logic never writes. |
| | **Any other engine's store:** Logic never writes. |

---

## State Influence Rules Table

| State / store | Logic may read? | Logic may write? |
|---------------|-----------------|-------------------|
| Section node (structure, content) | Yes (as argument) | No |
| Compatible layout ID set | Yes (supplied by Layout) | No |
| sectionLayoutPresetOverrides | Yes (read-only) | No |
| cardLayoutPresetOverrides | Yes (read-only) | No |
| organInternalLayoutOverrides | Yes (read-only) | No |
| Layout store (templateId, experience, etc.) | Yes (read-only) | No |
| Viewport / density / user context | Yes (read-only) | No |
| Preference weights (trait id → number) | Yes (read-only) | No (Plan 6 writes; pipeline only reads) |
| Preference memory (trait weights) | Yes (read) | Only via Plan 6 signal API (more/less like this) |

---

## How It Connects to Layout and State

- Logic reads layout-related state only through **read-only** APIs or arguments supplied by the Layout resolver. Layout never grants Logic write access to layout store or override store.
- The compatible set and any layout IDs in scope are always provided by Layout; Logic does not discover them independently.
- **Read-only list is explicit.** Any state not listed as "Logic may read" is off-limits unless the contract is updated.
- **Preference memory** is the only writable state for Logic, and only through the Plan 6 contract. The Layout resolver and other engines do not write to preference memory.

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

- **Spec published:** This document is the canonical reference.
- **Layout/override writes:** Only UI (app/layout, layout-dropdown, OrganPanel) write to layout store and override stores; no Logic engine writes to them.
- **Preference memory:** No runtime preference layer yet; when Plan 6 is implemented, only its signal path will write preference weights; suggestion path will only read.
- **Read sources:** Resolver passes section node, profile, override maps as arguments; compatible set will be supplied by Layout at injection point (Plan 8).
