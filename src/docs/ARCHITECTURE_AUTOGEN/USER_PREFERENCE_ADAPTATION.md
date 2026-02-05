# User Preference Adaptation

**Source:** Logic Plan 6 — [6_USER_PREFERENCE_ADAPTATION_PLAN.md](../../cursor/logic/complete/6_USER_PREFERENCE_ADAPTATION_PLAN.md).  
**Classification:** REFERENCE — Future preference adaptation; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

Capture **"more like this"** and **"less like this"** signals and persist **preference weights per trait** so the Layout Decision Engine (Plan 5) can bias scoring. The system does not mutate the layout store or node.layout; it only reads layout state to translate signals into trait deltas and writes to a separate preference memory (trait id → number). Resolution order remains **override > explicit > suggestion > default**.

---

## System Purpose

- **Input:** Preference signal ("more like this" / "less like this"); section context (section key, current layout IDs at signal time); trait registry (same as Plan 5).
- **Output:** Updated preference memory (trait id → weight). Decision Engine (Plan 5) reads these weights when scoring; preference layer is the only writer.
- **Guarantee:** No layout store or node.layout writes; no layout IDs stored in preference memory; only trait weights.

---

## Inputs

| Input | Description |
|-------|-------------|
| **Preference signal** | "more like this" or "less like this". Triggered by UI or API. |
| **Section context** | At signal time: section key/node ref and current layout IDs (section, optionally card, organ internal). Used to resolve layout → traits via trait registry. |
| **Trait registry** | Same as Plan 5: layout ID → set of trait identifiers. Used only to look up "which traits does this layout have?" when applying a signal. |

The system does not store layout IDs in preference memory; it uses layout IDs only at signal time to look up traits, then updates weights by trait id.

---

## Decision Model

### Signals

- **"More like this"** — increase preference for traits present in the current layout (e.g. +1 per trait).
- **"Less like this"** — decrease preference for those traits (e.g. -1 per trait).

### Translation (at signal time)

1. Get current layout ID(s) for the section from layout state (read-only; passed in or from store).
2. Look up trait set for each layout ID from the trait registry (same JSON as Plan 5).
3. For "more like this": apply positive delta to each trait in preference memory; for "less like this": apply negative delta. Deltas may be configurable (e.g. signalDeltas in JSON).
4. Persist updated weights (storage TBD; out of scope for plan).

No layout ID is written to layout store or node. Only trait weights are updated in preference memory.

### Preference memory shape

**trait id → number** (weight). Positive = prefer that trait; negative = prefer to avoid.

- Layout engine and Decision Engine only **read** these weights; they never write. Preference adaptation layer is the only writer.
- No layout IDs in this memory; only trait id → number. New layouts with the same traits benefit from past feedback without code changes.

### How it biases scoring

Plan 5 (Layout Decision Engine) accepts optional **preference weights**. For each candidate layout it sums the preference weight for each trait on that layout (missing → 0). That sum is combined with context scoring. Preference is additive; it does not replace compatibility or context.

---

## Data Sources

| Data | Source |
|------|--------|
| Current layout IDs at signal time | Layout state (store or props) — read-only for this system. |
| Trait registry | Same JSON as Plan 5 (layout ID → traits). |
| Signal deltas (optional) | Config JSON (e.g. +1 / -1). |
| Preference weights (persisted) | Trait id → number; storage TBD. |

---

## Integration Points

- **Layout Decision Engine (Plan 5):** Accepts optional preference weights; uses them when scoring. This plan defines how weights are produced and updated.
- **Trait registry:** Same registry as Plan 5; single source of truth in JSON.
- **Layout store / node:** Preference system **reads** layout state when processing a signal; **never writes** to layout store or node.layout.

---

## Safety Rules

1. **No silent overrides:** Preference never changes which layout is applied; only influences recommendation when Decision Engine scores. Override and explicit node.layout always win.
2. **No mutation of layout store or node.layout:** Preference layer only reads layout state to record signals; only writes to preference memory (trait weights).
3. **Resolution order unchanged:** override > explicit > suggestion > default. Preference only affects suggestion/default ranking.
4. **No layout IDs in preference memory:** Only trait id → number; keeps system data-driven.

---

## Implementation Prerequisites (when scheduled)

- **Trait registry:** Same layout ID → traits JSON as Plan 5.
- **Preference memory:** Define trait id → number shape and persistence strategy (session, user profile, etc.) before Decision Engine consumes preference weights.

---

## Verification (Plan 6 completion)

- **Spec published:** This document is the canonical reference.
- **No existing preference adaptation:** No runtime code implements "more like this" / "less like this" or trait-weight persistence.
- **Layout store:** Only UI (app/layout, layout-dropdown, OrganPanel) writes layout state; preference layer will only read at signal time and write to separate preference memory.
- **Plan 5 alignment:** Decision Engine spec accepts optional preference weights; this plan defines their source and update semantics.
