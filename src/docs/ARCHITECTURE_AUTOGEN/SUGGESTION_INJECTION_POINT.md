# Suggestion Injection Point

**Source:** Logic Plan 8 — [8_SUGGESTION_INJECTION_POINT_PLAN.md](../../cursor/logic/complete/8_SUGGESTION_INJECTION_POINT_PLAN.md).  
**Classification:** FOUNDATIONAL — Where Logic hands suggestion to Layout resolver; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

The **single place** where the Layout resolver requests a layout suggestion from Logic when user override and explicit node.layout are absent. Clear interface: inputs, output shape, and guarantee that suggestion is advisory only. Precedence remains **override → explicit → suggestion → default**; Logic never writes to the layout store or to node.layout.

---

## Purpose

- **Call site:** Resolver (e.g. `applyProfileToNode` in json-renderer) calls into Logic at exactly one point in the resolution sequence: after override and explicit node.layout, before template default.
- **Interface:** Caller supplies section node, template ID, compatible layout ID set, optional user context; Logic returns recommended layout ID (from compatible set) and optional explanation. No side effects on stores or node.layout.
- **Ownership:** Layout remains owner of the final layout ID; resolver applies precedence; Logic only returns a value.

---

## Inputs (to the Injection Point)

Supplied by the caller (resolver / renderer pipeline):

| Input | Description | Supplier |
|-------|-------------|----------|
| **Section node** | Section tree (structure, children, content, role). | Layout/renderer pipeline. |
| **Template ID** | Current template from layout store or profile. | Layout. |
| **Compatible layout ID set** | Layout IDs that pass compatibility for this section (`evaluateCompatibility(...).sectionValid === true`). | Layout compatibility layer. |
| **Optional user context** | Viewport band, density preference, content type if available. | UI, viewport API, or defaults. |

Logic may use Contextual (Plan 4), Decision Engine (Plan 5), and Preference (Plan 6) internally; the injection point is the **single call site** from Layout to Logic.

---

## Outputs

| Output | Description | Constraint |
|--------|-------------|------------|
| **Recommended layout ID** | One layout ID from the compatible set, or null/undefined when no recommendation. | Must be an element of the compatible set supplied as input; never a layout ID from outside that set. |
| **Optional explanation object** | e.g. `{ source: "suggestion", matchedTraits, score }` for debugging and dropdown "suggested" badge. | See Plan 10 (Explainability Contract). |

No side effects on layout store, override store, or node.layout. The only effect is the return value.

---

## What It Can and Cannot Modify

| Can | Cannot |
|-----|--------|
| Return a recommended layout ID and optional explanation. | Write to layout store, override store, or node.layout. |
| Logic may read state per Plan 9 (State Influence Rules). | Logic must not perform any store mutations when fulfilling the suggestion request. |

The resolver is the **single writer** for the resolved layout on the node. It uses the suggestion only as one input to precedence.

---

## How It Connects to Layout

- **Resolver calls Logic** at exactly one point: after checking user override and explicit node.layout, before falling back to template default.
- **Layout remains owner** of the final layout ID. Resolver applies: override → explicit → suggestion → template default.
- **Compatible set is supplied by Layout.** Logic does not discover layout IDs on its own; it only scores and chooses from the set Layout provides.

---

## How It Connects to State

- Logic may **read** state per Plan 9 (override maps, viewport, preference weights, etc.) when computing the suggestion. It does not write any of that state from this path.
- Preference memory (Plan 6) is updated only when the user triggers "more like this" / "less like this," not when the resolver requests a suggestion.

---

## Determinism Rules

- **Same inputs ⇒ same recommended ID (and explanation).** Inputs: section node, template ID, compatible set, user context. No hidden mutable state that would change the suggestion between calls.
- **Synchronous.** The call is synchronous so resolution is deterministic and order is well-defined.

---

## Non-Negotiable Constraints

1. **Single call site.** The Layout resolver requests suggestion from Logic at one place only; no scattered or duplicate calls with different semantics.
2. **No store writes from Logic.** Logic returns a value only; it does not write to layout store, override store, or node.layout.
3. **Suggestion is optional input to precedence.** Resolver may use it when override and explicit are absent; user override and explicit node.layout always win.
4. **Resolver retains full control.** Final layout ID is always chosen by the resolver using the defined precedence order.

---

## Verification (Plan 8 completion)

- **Spec published:** This document is the canonical reference.
- **Single resolution path:** Section layout ID is set in one place only — `applyProfileToNode` in `src/engine/core/json-renderer.tsx`. Precedence: override → explicit → template default → undefined; **suggestion slot** (between explicit and template default) is reserved for future injection.
- **No Logic call yet:** No resolver code calls a suggestion API; when added, it will be the single call site in that precedence branch.
- **Compatible set:** Supplied by Layout (evaluateCompatibility + getLayout2Ids); Logic will receive it as input, not compute it.
