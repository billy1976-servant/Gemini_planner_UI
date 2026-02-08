# Runtime Decision Trace Schema

**Purpose:** Standard structure for recording engine-level runtime decisions.  
**Scope:** Schema definition only. No implementation logic in this document.

---

## Trace entry shape

Each trace entry MUST include the following fields.

| Field | Type | Description |
|-------|------|--------------|
| **timestamp** | `string` (ISO 8601) or `number` (ms since epoch) | When the decision was made. |
| **engineId** | `string` | Which engine produced the decision. Examples: `layout-resolver`, `behavior-runner`, `state-deriver`, `renderer`, etc. |
| **decisionType** | `string` | Kind of decision. Examples: `layout-choice`, `behavior-dispatch`, `state-derivation`, `visibility-check`. |
| **inputsSeen** | `object` (serializable) | Raw inputs provided to the engine (e.g. layout ref, context, args). No functions or non-JSON-safe values. |
| **ruleApplied** | `string` or `object` | Which rule or contract caused the outcome (e.g. rule name, precedence step, contract id). |
| **decisionMade** | `any` (serializable) | Final output of the decision (e.g. layout id, handler name, derived key). |
| **downstreamEffect** | `string` or `object` (optional) | State change, render change, navigation, or other effect (e.g. "state.currentView", "navigate", "section layout applied"). |

---

## Engine IDs (canonical set)

- `layout-resolver` — unified layout resolution (page + component).
- `behavior-runner` — behavior verb resolution and handler dispatch.
- `state-deriver` — derivation of derived state from event log.
- `renderer` — JSON renderer (section layout choice, visibility, card preset).

Other engines may be added; use kebab-case.

---

## Decision types (canonical set)

- `layout-choice` — choice of layout id or definition.
- `behavior-dispatch` — choice and invocation of behavior handler.
- `state-derivation` — application of log events to derived state.
- `visibility-check` — decision to show or hide a node (e.g. `when` gating).

---

## Constraints

- Entries are append-only; no in-place mutation of existing entries.
- `inputsSeen` and `decisionMade` MUST be JSON-serializable (no functions, symbols, or circular refs).
- Schema is observational only; it does not define or change engine behavior.

---

*End of Runtime Decision Trace Schema.*
