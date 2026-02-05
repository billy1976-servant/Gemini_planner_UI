# 8 — Suggestion Injection Point Plan

**Execution order:** 8 of 12  
**Classification:** FOUNDATIONAL — Where Logic hands suggestion to Layout resolver; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

**Domain:** Architecture (Logic + Layout)  
**Status:** Complete  
**Scope:** Design document only — no runtime code changes.

---

## Purpose

Define the single place where the Layout resolver requests a layout suggestion from Logic when user override and explicit node.layout are absent. The injection point has a clear interface: inputs, output shape, and the guarantee that suggestion is advisory only. Precedence remains **override → explicit → suggestion → default**; Logic never writes to the layout store or to node.layout.

---

## Inputs (to the Injection Point)

The resolver (or equivalent) calls into Logic at one well-defined point. The following are supplied by the caller:

| Input | Description | Supplier |
|-------|-------------|----------|
| **Section node** | The section tree (structure, children, content, role). | Layout/renderer pipeline. |
| **Template ID** | Current template from layout store or profile. | Layout. |
| **Compatible layout ID set** | Set of layout IDs that pass compatibility for this section (e.g. `evaluateCompatibility(...).sectionValid === true`). | Layout compatibility layer. |
| **Optional user context** | Viewport band, density preference, content type if available. | UI, viewport API, or defaults. |

Logic may use Contextual (Plan 4), Decision Engine (Plan 5), and Preference (Plan 6) internally; the injection point is the single call site from Layout to Logic.

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
| Logic may read state per Plan 9 (State Influence Rules). | Logic must not perform any store mutations as part of fulfilling the suggestion request. |

The resolver is the **single writer** for the resolved layout on the node. It uses the suggestion only as one input to precedence.

---

## How It Connects to Layout

- **Resolver calls Logic** at exactly one point in the resolution sequence: after checking user override and explicit node.layout, before falling back to template default.
- **Layout remains owner** of the final layout ID. Resolver applies: if override present → use it; else if explicit node.layout present → use it; else if suggestion present → use it; else → template default.
- **Compatible set is supplied by Layout.** Logic does not discover layout IDs on its own; it only scores and chooses from the set Layout provides.

---

## How It Connects to State

- Logic may **read** state as defined in Plan 9 (override maps, viewport, preference weights, etc.) when computing the suggestion. It does not write any of that state from this path.
- Preference memory (Plan 6) is updated only when the user triggers "more like this" / "less like this," not when the resolver requests a suggestion.

---

## Determinism Rules

- **Same inputs to the injection point ⇒ same recommended ID (and explanation).** Inputs are: section node, template ID, compatible set, user context. No hidden mutable state that would change the suggestion between calls.
- **Synchronous.** The call is synchronous so that resolution is deterministic and order is well-defined.

---

## Non-Negotiable Constraints

1. **Single call site.** The Layout resolver requests suggestion from Logic at one place only; no scattered or duplicate calls with different semantics.
2. **No store writes from Logic.** Logic returns a value only; it does not write to layout store, override store, or node.layout.
3. **Suggestion is optional input to precedence.** Resolver may use it when override and explicit are absent; user override and explicit node.layout always win.
4. **Resolver retains full control.** Final layout ID is always chosen by the resolver using the defined precedence order.

---

## Verification (Plan 8 completion)

- **Spec published:** [src/docs/ARCHITECTURE_AUTOGEN/SUGGESTION_INJECTION_POINT.md](../../docs/ARCHITECTURE_AUTOGEN/SUGGESTION_INJECTION_POINT.md) is the canonical reference.
- **Single resolution path:** applyProfileToNode in json-renderer sets section layout ID; precedence override → explicit → default; suggestion slot reserved.
- **No Logic call yet:** No suggestion API called from resolver; single call site will be added in that precedence branch when implemented.
- **Compatible set:** Supplied by Layout; Logic will receive as input.

---

## Change Log

- [2025-02-04] Plan created.
- [2025-02-04] Spec formalized in ARCHITECTURE_AUTOGEN; audits passed; marked complete; moved to logic/complete.
