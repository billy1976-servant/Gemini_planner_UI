# Runtime Decision Trace — Implementation

**Purpose:** Document the runtime decision trace layer: which engines are traced, what is logged, how to view logs, and how this connects to existing SYSTEM_INTELLIGENCE docs.  
**Implementation status (Explainability/Trace):** PARTIAL. Runtime decision trace (layout-resolver, renderer, behavior-runner, state-deriver) is implemented for dev; layout suggestion explainability (matchedTraits, score, "suggested" badge) is PLANNED with Layout Decision Engine and Suggestion Injection (Plans 5/8).

---

## 1. Schema and logger

| Item | Location |
|------|----------|
| **Schema (contract)** | [RUNTIME_DECISION_TRACE_SCHEMA.md](./RUNTIME_DECISION_TRACE_SCHEMA.md) — fields: `timestamp`, `engineId`, `decisionType`, `inputsSeen`, `ruleApplied`, `decisionMade`, `downstreamEffect`. |
| **Logger** | `src/engine/devtools/runtime-decision-trace.ts` — `logRuntimeDecision(trace)` appends to `window.__RUNTIME_DECISION_LOG__`. Safe in SSR and when devtools are disabled (no-op / no throw). |
| **Viewer** | `src/devtools/runtime-trace-viewer.tsx` — React panel that reads the log and renders a table. **Dev only:** does not render when `NODE_ENV === "production"`. |

---

## 2. Engines traced and decisions logged

| Engine | File | Decision type(s) | What is logged |
|--------|------|------------------|----------------|
| **layout-resolver** | `src/layout/resolver/layout-resolver.ts` | `layout-choice` | Inputs: `layout`, `context`; rule: getPageLayoutId + getPageLayoutById path or null reason; result: layout id + merged def or null; effect: merged layout or "no layout definition". |
| **renderer** | `src/engine/core/json-renderer.tsx` | `layout-choice`, `visibility-check` | **Layout:** section layout id resolution (override \|\| explicit \|\| template default); inputs: sectionKey, override/existing/template ids; rule: which precedence won; result: layoutId. **Visibility:** when `when` gating hides a node; inputs: nodeId, key, equals, stateValue; rule: missing key or equals mismatch; result: false; effect: "node not rendered". |
| **behavior-runner** | `src/behavior/behavior-runner.ts` | `behavior-dispatch` | Inputs: domain, action, args keys; rule: fromAction \| fromInteraction \| fromNavigation (or "no map"); result: handler name or null; effect: "invoke handler" or "none". |
| **state-deriver** | `src/state/state-resolver.ts` | `state-derivation` | Inputs: log length, last 50 intents; rule: deriveState branch per intent; result: hasCurrentView, journalTracks, valuesKeys, scansCount, interactionsCount; effect: "derived state snapshot". |

Instrumentation is **wrapper-only**: no business logic or return values are changed; only `logRuntimeDecision(...)` calls were added after existing decisions.

---

## 3. How to view logs

1. **In-memory log:** In the browser console, inspect `window.__RUNTIME_DECISION_LOG__` (array of trace objects).
2. **Dev panel:** Render `<RuntimeTraceViewer />` from `src/devtools/runtime-trace-viewer.tsx` on a dev-only route or debug overlay. The panel polls the log every 500ms and shows a table: **Engine | Decision | Rule | Output | Time**. It includes a **Clear** button and does not render in production builds.
3. **Programmatic:** Use `getRuntimeDecisionLog()` and `clearRuntimeDecisionLog()` from `src/engine/devtools/runtime-decision-trace.ts` for custom tooling.

---

## 4. Connection to other SYSTEM_INTELLIGENCE docs

| Document | Relationship to trace |
|----------|------------------------|
| **[ENGINE_RESPONSIBILITY_INDEX.md](./ENGINE_RESPONSIBILITY_INDEX.md)** | Each traced engine appears in the index; the trace records *which* engine made a decision and *what* it decided, aligning with "what each engine owns." |
| **[AUTHORITY_PRECEDENCE_MAP.md](./AUTHORITY_PRECEDENCE_MAP.md)** | Layout and behavior traces record which precedence step won (e.g. override vs explicit vs template default), matching the authority map. |
| **[DECISION_TRACE_CONTRACT.md](./DECISION_TRACE_CONTRACT.md)** | Static contract describing *why* decisions happen (conditions, branches, outputs). The runtime trace is the **live instance** of that contract: same engines, same decision points, with concrete inputs and results at runtime. |
| **RUNTIME_DECISION_TRACE_SCHEMA.md** | Defines the shape of each trace entry (this implementation follows that schema only; no logic in the schema doc). |

---

## 5. Constraints (unchanged)

- No engine behavior or return values are altered.
- No hardcoded UI in engines; only logging calls.
- No changes to existing contracts (layout, behavior, state).
- Logging is additive and removable (delete the `logRuntimeDecision` calls and the viewer to disable).
- Dev-only safe: viewer is production-gated; logger is safe when disabled or in SSR.

---

*End of Runtime Decision Trace Implementation.*
