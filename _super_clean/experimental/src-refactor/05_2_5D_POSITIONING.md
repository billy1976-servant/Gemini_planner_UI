# 05 — 2.5D Positioning

**Purpose:** Define what the 2.5D layer reads, where it sits, what it does NOT control, and how it interprets state, events, and engine outputs. Extracted from the master architecture (10_SYSTEM_CONNECTIONS, 08_DIAGNOSTICS).

---

## 1. What 2.5D reads

- **State snapshot:** getState() / subscribeState — derived state (currentView, journal, values, scans, interactions). Read-only.
- **Layout snapshot and override stores:** useSyncExternalStore(subscribeLayout, getLayout); getOverridesForScreen, getCardOverridesForScreen, getOrganInternalLayoutOverridesForScreen. Read-only.
- **Current screen tree:** getCurrentScreenTree() from current-screen-tree-store. Read-only.
- **Pipeline trace:** getLastPipelineTrace(), last event, stages (action, behavior, state, layout, render). Written by behavior-listener and optionally render path; read by InteractionTracerPanel and devtools.

No new API is required; all are existing subscriptions or getters.

---

## 2. Where it sits

- **Observation / diagnostics layer** — above the runtime execution path. It can see multiple domains (state, layout, renderer, pipeline) without being part of the execution path.
- **Implementation:** pipeline-debug-store.ts, pipelineStageTrace.ts, InteractionTracerPanel, runtime-decision-trace (dev), other dev-only panels and trace surfaces.
- **Position:** Does not sit in the spine (JSON → Engines → State → Layout → Renderer → DOM). It runs in parallel as a read-only observer.

---

## 3. What it does NOT control

- **Does not call dispatchState** — does not mutate app state.
- **Does not call setLayout, setSectionLayoutPresetOverride, setCardLayoutPresetOverride, setOrganInternalLayoutOverride** — does not change layout or overrides.
- **Does not alter runtime behavior or state flow** — dev-only or gated; production code paths unchanged.
- **Does not write to the event log** — observation only.
- **Does not trigger loadScreen, runBehavior, or interpretRuntimeVerb** — does not drive the pipeline.

---

## 4. How it interprets state

- **State:** Displays keys and counts (journal tracks, values keys, scans count, interactions count). Interprets as the current derived snapshot; does not modify or replay.
- **Layout:** Displays templateId, experience, override map keys, resolved layout per section. Interprets as current layout and override state; does not change resolution order or precedence.
- **Renderer:** Displays section keys, layout resolved per section (e.g. from data-section-layout, data-container-width). Interprets DOM or tree as output of the render pipeline; does not change render logic.

---

## 5. How it interprets events

- **Pipeline trace:** Last event (e.g. action, input-change) and which stages passed/failed (action, behavior, state, layout, render). Interprets as diagnostic only; does not alter event handling or branch order.
- **Behavior:** Can show last action name, branch taken (state:* vs navigate vs contract verb vs interpretRuntimeVerb). Does not change behavior-listener or runBehavior.

---

## 6. How it interprets engine outputs

- **Engines:** Can show which handlers ran (e.g. runCalculator, resolveOnboarding). Interprets as observation of the action path; does not invoke or bypass engines.
- **Stacked domains:** Can visualize State (log + derived), Layout (layout-store + override stores), Renderer (current tree + Registry), Behavior (last action, branch), and pipeline stages. All from existing getters and trace records; no new architecture.

---

## Summary

2.5D is a **read-only observation and diagnostics layer** that interprets state, events, and engine outputs for debugging and verification. It sits outside the runtime execution path and must not control or mutate state, layout, behavior, or the pipeline.
