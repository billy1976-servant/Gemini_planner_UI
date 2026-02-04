# User Preference Adaptation Plan

**Classification:** REFERENCE — Future preference adaptation; primary architecture reference: docs/SYSTEM_MASTER/

**Domain:** Logic (Layout Intelligence)  
**Status:** Planning  
**Scope:** Planning only — no code edits, no runtime changes.

---

## System Purpose

Capture **"more like this"** and **"less like this"** signals from the user and persist **preference weights per trait** so that the Layout Decision Engine can bias scoring toward preferred layouts when multiple compatible options exist. The system does not silently override anything: it does not mutate the layout store or node.layout. It only reads current layout state to translate signals into trait deltas and writes to a separate preference memory (trait weights). Layout resolution order remains **override > explicit > suggestion > default**.

---

## Inputs

| Input | Description |
|-------|-------------|
| **Preference signal** | One of: "more like this", "less like this". Triggered by UI (e.g. button, gesture) or API. |
| **Section context** | At signal time: section key or section node ref, and current layout IDs (section layout, and optionally card layout and organ internal layout) for that section. Used to resolve layout → traits via the trait registry. |
| **Trait registry** | Same as Layout Decision Engine: layout ID → set of trait identifiers. Used only to look up "which traits does this layout have?" when applying a signal. |

The system does not receive or store layout IDs in preference memory; it only uses them at signal time to look up traits, then updates weights by trait id.

---

## Decision Model

### Preference signal model

**Signals:**

- **"More like this"** — the user prefers the current layout style. The system should increase preference for the traits present in the current layout.
- **"Less like this"** — the user wants to see fewer layouts like the current one. The system should decrease preference for the traits present in the current layout.

**Trigger and context:**

- A signal is triggered by a concrete UI action (e.g. "More like this" / "Less like this" button) or by an API call (e.g. analytics or backend event).
- When the signal fires, the system must have access to: (1) which section (or view) the feedback refers to (section key or stable ref), and (2) the **current** section layout ID (and optionally card layout ID, organ internal layout ID) for that section at the time of the signal. This context is read from the current layout state (store or props); the preference system does **not** write that state. It only reads it to resolve layout → traits.

**Translation:**

1. Get current layout ID(s) for the section from the existing layout state (passed in or read from store).
2. Look up the set of trait identifiers for each of those layout IDs from the **trait registry** (same JSON as used by the Layout Decision Engine).
3. For "more like this": apply a positive delta (e.g. +1) to each of those traits in the preference memory. For "less like this": apply a negative delta (e.g. -1). Deltas may be configurable via JSON (e.g. `signalDeltas: { moreLikeThis: 1, lessLikeThis: -1 }`).

No layout ID is written to the layout store or to the section node. Only trait weights are updated in preference memory.

### Trait weight memory structure

Preference memory stores a single structure: **trait id → number** (weight). Positive values mean the user prefers that trait; negative values mean they prefer to avoid it.

**Schema (JSON shape):**

```json
{
  "description": "Preference weights keyed by trait id. Layout engine only reads.",
  "weights": {
    "media-prominent": 2,
    "dense": -1,
    "stacked": 1,
    "split": 0
  }
}
```

- **Storage location** (e.g. sessionStorage, user profile, backend) is out of scope for this plan. The plan only defines the shape and semantics.
- **Layout engine usage:** The layout engine (and Layout Decision Engine) only **read** these weights. They never write them. The preference adaptation layer is the only writer. So from the layout engine's perspective, preference memory is read-only.

No layout IDs are stored in this memory. Only trait id → number. That keeps the layout engine free of layout-ID-specific logic and allows new layouts (with the same traits) to benefit from past feedback without code changes.

### How layout traits connect to preference weights

When a signal fires:

1. **Read** current layout ID(s) for the section (from layout state/context; not written by this system).
2. **Look up** traits for each layout ID from the trait registry (e.g. `hero-split` → `["media-prominent", "split", "wide"]`).
3. **Apply delta** to each of those traits in the preference memory: for "more like this", add +1 (or configured value); for "less like this", add -1 (or configured value). Clamping or bounds (e.g. [-5, 5]) may be defined in config to keep weights stable.
4. **Persist** the updated weights (implementation detail; not part of this plan).

No layout ID is written to the layout store or to any node. Only the trait-weight map is updated.

### How logic biases future layout scoring

The Layout Decision Engine (see Plan 4) receives an optional input: **preference weights** (trait id → number). For each candidate layout, it looks up that layout's traits and sums the preference weight for each trait (missing trait → 0). That sum is combined with context-based scoring (e.g. context weights + preference weights). So:

- Layouts that have traits the user has favored (positive weight) get a higher score.
- Layouts that have traits the user has disfavored (negative weight) get a lower score.

Preference is **additive** only. It does not replace compatibility (the candidate set is still only compatible layouts) or context (viewport, density). It only biases the ranking within the compatible set.

---

## Data Sources

| Data | Source |
|------|--------|
| Current layout IDs at signal time | Layout state (store or props) — read-only for this system. |
| Trait registry | Same JSON as Layout Decision Engine (layout ID → traits). |
| Signal deltas (optional) | Config JSON (e.g. +1 / -1 or per-signal values). |
| Preference weights (persisted) | Trait id → number; storage TBD (session, user profile). |

---

## Integration Points

### Layout Decision Engine

The Decision Engine accepts optional **preference weights** (trait id → number). It uses them when scoring compatible layouts. This plan defines how those weights are produced and updated; it does not implement the scoring (that is in Plan 4).

### Trait registry

The same trait registry used by the Layout Decision Engine is used here to map "current layout ID at signal time" → traits. No duplicate registry; single source of truth in JSON.

### Layout store / node

The preference system **reads** layout state (section layout ID, etc.) when processing a signal. It **never writes** to the layout store or to node.layout. Layout resolution and overrides remain entirely under the control of the layout resolver and the user.

---

## Safety Rules

1. **No silent overrides:** The preference system never changes which layout is applied. It only influences the **recommendation** when the Decision Engine scores compatible options. User override and explicit node.layout always win.
2. **No mutation of layout store or node.layout:** The preference layer only reads layout state to record signals and only writes to preference memory (trait weights). No layout IDs are written to layout state by this system.
3. **Layout resolution order unchanged:** override > explicit > suggestion > default. Preference only affects the "suggestion" or default-ranking step; it does not bypass that order.
4. **No layout IDs in preference memory:** Only trait id → number. So the system stays data-driven and works with any layout that has traits in the registry.

---

## Future Expansion

- **Decay:** Over time, reduce magnitude of weights (e.g. toward zero) so old feedback matters less.
- **Per-template or per-experience weights:** Store separate weight maps per template or experience (website/app/learning) so feedback in one context does not override another.
- **Sync to backend:** Persist weights to user profile for cross-device and long-term preference.
- **Undo:** Allow "undo last feedback" by reverting the last delta applied (requires storing a short history or last delta per trait).

---

*This document is planning only. No implementation changes are implied until explicitly scheduled.*
