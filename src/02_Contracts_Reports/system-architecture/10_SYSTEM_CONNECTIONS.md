# 10 — System Connections

**Purpose:** Master wiring explanation between runtime pipeline, engines, state, layout, renderer, contracts, diagnostics, and observation layers. Derived only from existing 01–09 and AUTOGEN sources. No new architecture; connects what already exists. This file is the **single top-level topology map** showing how every major layer connects end-to-end at runtime.

---

## FULL PIPELINE FLOW

Exact flow from input to output and back:

```
INPUT
(JSON screens + events + sensors)
↓
ENGINES
(processors)
↓
STATE
(current resolved truth)
↓
LAYOUT
(JSON layout decisions)
↓
RENDERER
(UI output)
↓
EVENT STORE
(persistence timeline)
↓
2.5D
(visual interpretation layer)
```

- **INPUT:** JSON screens (loadScreen from API or TSX descriptor), user events (CustomEvents: navigate, action, input-change), and sensor/ingest signals (e.g. scan.result, scan.interpreted via global-scan.engine and state-bridge). All enter via the same pipeline entry points: screen path, behavior-listener, or dispatchState.
- **ENGINES:** Document processors (assignSectionInstanceKeys, expandOrgansInDocument, applySkinBindings, composeOfflineScreen), layout resolution (applyProfileToNode, resolveLayout, compatibility), action handlers (runBehavior, interpretRuntimeVerb, action-runner). Engines consume input and composed tree; they read state and (where allowed) write via dispatchState only.
- **STATE:** Current resolved truth = deriveState(log). DerivedState (currentView, journal, values, scans, interactions) is the single snapshot. State is the only writable app truth (besides layout/override stores for UI overrides); engines and renderer read from it.
- **LAYOUT:** JSON layout decisions = override store + node.layout + template default, applied per section in applyProfileToNode. Layout reads from layout-store and override stores; it does not read state-store for section layout id. Output is resolved layout id and card preset on each node.
- **RENDERER:** UI output = JsonRenderer(applyProfileToNode → renderNode → Registry / Section / LayoutMoleculeRenderer). Subscribes to state and layout; produces DOM (data-node-id, data-section-id, data-section-layout, data-container-width). User gestures from DOM feed back into INPUT as events.
- **EVENT STORE:** Persistence timeline = append-only log (StateEvent[]). Every dispatchState(intent, payload) appends to the log; persist() writes to localStorage (except state.update). Rehydration replays the log to deriveState. So the event store is the durable timeline; state is the derived view of it.
- **2.5D:** Visual interpretation layer = read-only observation (pipeline-debug-store, pipelineStageTrace, getState(), layout/override getters, current-screen-tree). Consumes state snapshot, event stream (via log or trace), and engine outputs (trace stages); does not alter runtime.

---

## LAYER CONNECTION TABLE

| Connection | What flows | How |
|------------|------------|-----|
| **What feeds Engines** | Screen document (root, data bag), current state snapshot (getState), override maps (props), URL/searchParams, user event detail (action/navigate/input-change). | loadScreen(path); page passes tree + profile + overrides to JsonRenderer; behavior-listener receives CustomEvents and passes detail to runBehavior/interpretRuntimeVerb; handlers receive (action, state). |
| **What Engines read** | State: getState() or useSyncExternalStore(subscribeState, getState). Layout: profile, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides (passed in or from stores). Tree: current-screen-tree, node children. | All engines read through these APIs; none read DOM or UI components directly. |
| **What Engines write** | State only (via dispatchState(intent, payload)). Optional navigate(to) from behavior path. No engine writes to Layout store, Registry, or Renderer; override stores are written only by UI (OrganPanel). | dispatchState from screen-loader, behavior-listener, action handlers, interaction-controller, global-scan.engine, global-scan.state-bridge, state-adapter, etc. |
| **How State feeds Layout** | Layout does not read state-store for section layout id. State (e.g. values.sectionLayoutPreset) can be consumed by UI that then calls setSectionLayoutPresetOverride; the authoritative layout input to the renderer is the override store. So State feeds Layout only indirectly (UI reads state → UI writes override store). | Documented in 04_STATE_SYSTEM, 05_LAYOUT_SYSTEM; override store is the layout authority at render time. |
| **How Layout feeds Renderer** | Resolved layout id and card preset per node; layout prop to Section; resolveLayout(layout) → LayoutDefinition or null. Profile (visualPreset, spacingScale, cardPreset) merged in applyProfileToNode. | applyProfileToNode in JsonRenderer; Section compound receives layout prop and calls resolveLayout; LayoutMoleculeRenderer receives layoutDef. |
| **How Renderer emits events** | Compounds (button, field, list, etc.) dispatch CustomEvents: "navigate" (detail.to), "action" (detail = behavior), "input-change" (fieldKey, value). behavior-listener (capture) subscribes to window; routes to dispatchState, navigate, runBehavior, or interpretRuntimeVerb. | DOM events → component handlers → dispatchEvent → behavior-listener → State or Logic or navigate. |
| **How Event Store feeds engines again** | Rehydration: on bootstrap, state-store reads localStorage (__app_state_log__), replays log, state = deriveState(log). Engines and Renderer subscribe to state; when state updates (after any dispatchState), they re-run with new snapshot. So the event store (log) is the durable source; engines see its effect through deriveState and listeners. | persist() and rehydrate() in state-store; listeners.forEach(l => l()); JsonRenderer and any getState() consumer get new derived state. |
| **How 2.5D reads** | State: getState() / subscribeState (currentView, journal, values, scans, interactions). Event stream: log (if exposed) or pipeline trace (last event, stages). Engine outputs: pipelineStageTrace (action, behavior, state, layout, render pass/fail), current-screen-tree-store (composed tree), layout getLayout() and override getters. | Read-only subscriptions and getters; no dispatchState or setLayout from 2.5D. See 08_DIAGNOSTICS, 2.5D VISIBILITY HOOK below. |

---

## SYSTEM FLOW OVERLAY

How everything connects across: **JSON → Engines → State → Layout → Renderer → UI → Feedback → State**.

1. **JSON** — Screen document (root/screen/node, optional state.currentView, optional data) is loaded via `loadScreen(path)`: either TSX descriptor or fetch from API. API reads from `src/apps-offline/apps/...` or TSX marker. Root is `json?.root ?? json?.screen ?? json?.node ?? json`.

2. **Engines (document prep)** — Page runs in order: `assignSectionInstanceKeys` → `expandOrgansInDocument` (organ → variant tree, using loadOrganVariant and organInternalLayoutOverrides) → `applySkinBindings` (slot → data[slotKey]) → `composeOfflineScreen` (role inference). Result is the composed tree; `setCurrentScreenTree(composed)`.

3. **State (initial)** — If JSON has `json.state?.currentView`, screen-loader calls `dispatchState("state:currentView", { value })` so the first derived state matches the screen. Bootstrap `ensureInitialView` does the same when no currentView.

4. **Layout** — Profile (experience + template) and override maps (section/card/organ) are passed into JsonRenderer. Per-node in renderer, `applyProfileToNode` sets section layout id: **override → node.layout → template default**. Layout store and override stores are read here; nothing in Layout writes to State or Behavior.

5. **Renderer** — JsonRenderer subscribes to layout and state (`useSyncExternalStore`). It runs `applyProfileToNode` then `renderNode` (recursive): visibility (when/state), repeater mapping, Registry lookup, Section → `resolveLayout(layout)` → LayoutMoleculeRenderer or div. Registry components receive props; no further transform.

6. **UI (DOM)** — User sees the tree. Proof attributes: `data-node-id`, `data-section-id`, `data-section-layout`, `data-container-width`. User gestures (tap, input) are handled by compounds (button, field, etc.) which dispatch CustomEvents: `"navigate"`, `"action"`, `"input-change"`.

7. **Feedback** — behavior-listener (capture) receives events. **Branch order:** state:* → dispatchState; navigate → navigate(to); contract verbs → runBehavior; else interpretRuntimeVerb → action-runner → handlers. input-change → dispatchState("state.update", { key: fieldKey, value }). Handlers may call dispatchState (e.g. resolve-onboarding, run-calculator) or navigate.

8. **State (update)** — dispatchState(intent, payload) → log.push; state = deriveState(log); persist() (except state.update); listeners notified. Subscribers (e.g. JsonRenderer) re-run; render tree updates from new state (when/state, field values, journal).

**Loop:** UI → Feedback → State → (Layout reads overrides; Renderer reads state + layout) → Renderer → UI. Single spine: one state log, one pipeline, one primary renderer (JsonRenderer).

---

## ENGINE INTERACTION MAP

**How multiple engines run in sequence**

- **Document pipeline (page.tsx):** assignSectionInstanceKeys (organs) → expandOrgansInDocument (organs + organ-registry) → applySkinBindings (logic/bridges) → composeOfflineScreen (lib/screens). Order is fixed; each step consumes the previous output.
- **Render pipeline:** applyProfileToNode (layout resolver, compatibility, card presets) runs per node; then renderNode (JsonSkinEngine for type "json-skin", Registry for others; Section calls resolveLayout and LayoutMoleculeRenderer). Layout resolver and compatibility run inside JsonRenderer; they do not run before page.tsx.
- **Action pipeline (on user action):** behavior-listener → state:* (state-store) **or** navigate (layout.tsx callback) **or** contract verbs → runBehavior (behavior-runner, BehaviorEngine) **or** interpretRuntimeVerb → action-runner → getActionHandler → runCalculator / resolveOnboardingAction / run25X / etc. Only one branch runs per action; order is state:* > navigate > contract verbs > runtime verb.

**How engines share state**

- **Read:** Engines and renderer read state via getState() or useSyncExternalStore(subscribeState, getState). DerivedState (currentView, journal, values, scans, interactions) is the shared snapshot. Layout/profile and override stores are separate (layout-store, section-layout-preset-store, organ-internal-layout-store); they are read by JsonRenderer and applyProfileToNode but not by state-resolver.
- **Write:** Only the state-store accepts writes, via dispatchState(intent, payload). Behavior-listener, screen-loader, action handlers (resolve-onboarding, run-calculator), interaction-controller, global-scan.engine, global-scan.state-bridge, state-adapter, etc. all call dispatchState. No engine writes to another engine’s store; Logic does not write layout or override stores; Layout does not write state.

**How engines are triggered**

- **By context:** resolveLandingPage() uses getState(), readEngineState(), resolveOnboardingFromAnswers(answers), resolveContent("construction-cleanup") to decide landing content/flow. Flow-resolver resolveView(flowId, derived) uses derived.interactions to pick flow step. Layout applyProfileToNode uses templateId and override maps from context (layout-store, props).
- **By time (effect):** loadScreen(screen) runs in useEffect when screen or searchParams change. installBehaviorListener(navigate) runs once in layout useEffect. Rehydration runs on bootstrap (state-store).
- **By user input:** Button/field/list etc. dispatch CustomEvents; behavior-listener handles them and routes to dispatchState, navigate, runBehavior, or interpretRuntimeVerb. So: user input → DOM event → CustomEvent → behavior-listener → one of state / navigate / runBehavior / action-runner.

---

## ENGINE INTERACTION MODEL

**Engines do NOT talk directly to UI**

- Engines never import or call React components, DOM APIs, or the Registry. They do not render; they do not attach event listeners to the DOM. The only place that turns engine output into pixels is the Renderer (JsonRenderer + Registry + Section/LayoutMoleculeRenderer). So: Engines → State (or navigate); Renderer → DOM; user → events → behavior-listener → engines. Engines are decoupled from UI.

**Engines communicate through State + Events**

- **State:** Engines read the current snapshot via getState() or useSyncExternalStore(subscribeState, getState). They write only by calling dispatchState(intent, payload), which appends to the log and triggers deriveState and listener notification. So all engine-to-engine communication that affects the app goes through the state log and derived state.
- **Events:** User input and system triggers enter as events (CustomEvents for navigate/action/input-change; loadScreen completion; rehydration). The behavior-listener and screen-loader translate events into calls to dispatchState, navigate, runBehavior, or interpretRuntimeVerb. So engines are triggered by events; they do not poll the DOM or subscribe to UI lifecycle directly.

**Engines are composable runners**

- Document engines run in a fixed sequence (assignSectionInstanceKeys → expandOrgansInDocument → applySkinBindings → composeOfflineScreen); each consumes the output of the previous. Layout resolution runs per-node inside the renderer. Action engines run in a single branch per event (state:* | navigate | contract verb | runtime verb). New engines can be added as: (1) another step in document prep, (2) another handler in action-registry or BehaviorEngine, or (3) another reader of state that then dispatches. They all share the same State + Event contract; they are composable because they do not hold private mutable state that other engines need—they read from and write to the single spine.

---

## STATE PROPAGATION MODEL

**How state writes affect other domains**

- **State → Renderer:** JsonRenderer subscribes to state. When state changes (after dispatchState → deriveState → notify), renderer re-runs; shouldRenderNode(node.when, state) and field values from stateSnapshot.values / journal drive what is visible and what values inputs show. So state writes directly affect UI visibility and form values.
- **State → Logic (read-only):** flow-resolver reads derived.interactions to resolve flow step. landing-page-resolver and resolve-onboarding read getState() (currentView, values, interactions). Action handlers receive state when interpretRuntimeVerb(verb, getState()) or runAction(action, state) is called. Logic never writes state except through the single API: dispatchState (called from behavior-listener or from handlers registered in action-registry).
- **State → Layout:** Layout domain does not read state-store for layout resolution. Section layout id comes from override store, node.layout, or template default. So state writes do **not** directly change layout; only user overrides (OrganPanel) and template/profile do. Values such as sectionLayoutPreset in state.values can be consumed by UI that then calls setSectionLayoutPresetOverride (documented pattern); the authoritative layout input to the renderer is the override store, not state-store.
- **State → Behavior:** behavior-listener uses getState()?.values?.[fieldKey] for valueFrom:"input" when handling journal.add. So state (values) feeds back into behavior path only for that resolution; behavior does not read journal or scans for routing.

**Persistence + history layering**

- **Persistence:** Event log is persisted to localStorage (__app_state_log__) on every dispatch except intent === "state.update". On bootstrap, rehydrate() reads the log and replays: state = deriveState(log). So full history (log) is the persisted layer; derived state is recomputed from it.
- **History:** The log is append-only. deriveState is pure: same log ⇒ same DerivedState. So "history" is the ordered list of intents and payloads; journal (track→key→value), values (key→value), currentView, scans[], interactions[] are derived by replaying that history. No separate "planning" or "relationships" store exists in the current architecture; journal and interactions are the durable, replayed layers that drive JournalHistory UI and flow-resolver steps.

**How journal → planning → relationships → decisions connect (within what exists)**

- **Journal:** Derived state includes journal (track → key → value). It is written by journal.set / journal.add (e.g. from behavior-listener, state-adapter). It is read by JsonRenderer (JournalHistory), state-adapter, and any consumer of getState()?.journal. So journal is the "recorded facts by track" layer; it is not a separate planner—it feeds display and any logic that reads state.
- **Interactions:** derived.interactions is append-only (interaction.record). flow-resolver uses it to decide flow step (resolveView: first step where requires are not yet in completed set). So interactions drive "decisions" in the sense of flow progression (e.g. calculator.completed → next step). resolve-onboarding and other handlers read state (values, interactions) to build fullState for flow.
- **Scans:** derived.scans (from scan.result / scan.interpreted) drive global-scan UIs, dashboards, and selectors. They are an ingest-derived layer: external scan results enter via global-scan.engine and global-scan.state-bridge and become state; they do not have a separate "relationships" or "planner" in the current docs—they are consumed as data by UI and scripts.

---

## CROSS-DOMAIN BRIDGE MODEL

How one domain feeds another, using only existing integration points:

- **Behavior → State:** Every state mutation from the UI goes through behavior-listener (or screen-loader, ensureInitialView, state-mutate bridge). behavior-listener dispatches state:currentView, state.update, journal.add. So Behavior is the bridge from UI events into State.
- **Behavior → Logic:** Contract verbs → runBehavior(domain, action, ctx, args). Other actions → interpretRuntimeVerb(verb, getState()) → action-runner → handlers (runCalculator, resolveOnboarding, run25X). So Behavior is the bridge from UI events into Logic; Logic returns or calls dispatchState/navigate.
- **Logic → State:** Only via dispatchState. Handlers (resolve-onboarding, run-calculator, EducationCard, etc.) and interaction-controller, global-scan.state-bridge call dispatchState. So Logic never writes Layout or Registry; it only writes State (and may call navigate).
- **Screen load → State:** loadScreen (after JSON fetch) applies json.state?.currentView via dispatchState. So the Screen/JSON domain sets initial view through the same State API.
- **Layout → Renderer:** Layout does not "feed" State or Behavior. applyProfileToNode (in JsonRenderer) reads profile and override maps and writes resolved layout id and card preset onto the node; Section compound reads layout prop and calls resolveLayout. So Layout feeds only the Renderer (and Section/LayoutMoleculeRenderer); it never writes to State or Logic.
- **Content / ingest → State:** content-resolver (e.g. resolveContent("construction-cleanup")) is used by landing-page-resolver for content; it does not write state directly. Scans enter state via global-scan.engine (scan.result) and global-scan.state-bridge (scan.interpreted) → dispatchState. So "ingest" that is modeled today is scan-based and enters as state intents; other ingest (documents, imports, web tools) would follow the same pattern: external system → dispatchState or equivalent API, so one domain (ingest) feeds State only.

**Planner → relationships, learning → decisions, recovery → schedule, business → time:** The current architecture does not define named "planner," "relationships," "learning," "recovery," "schedule," or "business/time" domains. The bridges above are the only cross-domain feeds documented. If such domains are added later, they would integrate the same way: read from getState() or from arguments supplied by the pipeline; write only via dispatchState (or navigate) so that one state spine and one pipeline remain.

---

## DOMAIN PLUG-IN PATH

New domains attach along the same spine so that one pipeline and one state remain the single brain. Path:

**JSON → Engines → State → Layout → Renderer → Events**

- **JSON:** New domain can supply screen content (new screen path or data bag keys), or new node types (once registered in Registry and contract). Example: a **planner** domain could emit a screen or a data slice that represents a plan; it would feed loadScreen or the data bag that applySkinBindings consumes.
- **Engines:** New domain can add an engine step (document prep or action handler). It reads from getState() or from arguments (e.g. tree, profile); it writes only via dispatchState. Examples: **planner** = engine that reads state (e.g. goals, journal) and dispatches state.update or a new intent to store a plan. **Relationships** = engine that reads state (e.g. entities, links) and dispatches intents to store relationship graph. **Learning** = engine that reads interactions/state and dispatches intents to store preferences or recommendations (e.g. User Preference Adaptation / trait weights). **Business** = engine that reads state (e.g. values, journal) and dispatches intents for business events or time-based state. **Recovery** = engine that reads log/state and dispatches intents to restore or reconcile state.
- **State:** New intents and derived keys (in state-resolver deriveState) so the new domain has a place in the snapshot. All domains share the same log and derivation; new domains extend the intent set and derived shape.
- **Layout:** Layout reads from override store and template; it does not read state-store for section layout. If a domain must influence layout, it does so by (1) writing state that UI then uses to call setSectionLayoutPresetOverride, or (2) (future) supplying a suggestion via the Suggestion Injection Point; Layout remains the authority.
- **Renderer:** Renders whatever is in the tree and state; when/state and Registry drive visibility and component choice. New domain data in state appears in UI if components read it (e.g. JournalHistory, field values) or if new components are registered.
- **Events:** User and system events enter via the same behavior-listener and loadScreen path. New domain can subscribe to events (e.g. CustomEvents) or to state (subscribeState) and then dispatchState. So new domains plug in by: adding engines that read state and dispatch; extending state intents and derivation; and optionally supplying JSON/content or new handlers. No alternate pipeline or alternate state store.

---

## 2.5D VISIBILITY HOOK

**How 2.5D reads existing state**

- "2.5D" here means any **read-only observation or diagnostics layer** that can see multiple domains (state, layout, renderer, pipeline) without being part of the runtime execution path. In the current codebase this is implemented by:
  - **Pipeline debug store** (pipeline-debug-store.ts) and **pipelineStageTrace** (pipelineStageTrace.ts): they record stages (action, behavior, state, layout, render) and last event; they are written to by behavior-listener and optionally by render path. They are **read** by InteractionTracerPanel and other devtools to show pipeline status.
  - **getState() / subscribeState:** Any observer (including a hypothetical 2.5D dashboard) can subscribe to state-store and read the derived snapshot (currentView, journal, values, scans, interactions) without altering it.
  - **Layout snapshot and override stores:** useSyncExternalStore(subscribeLayout, getLayout) and the override store getters expose current layout and overrides for read-only consumption.
  - **current-screen-tree-store:** getCurrentScreenTree() exposes the composed tree for read-only use.

So "2.5D" reads: (1) state snapshot, (2) layout snapshot and override maps, (3) current screen tree, (4) pipeline trace (last event, stages). No new API is required; all are existing subscriptions or getters.

**How it does NOT alter runtime**

- Diagnostics and trace code are dev-only or gated. They do not call dispatchState, setLayout, setSectionLayoutPresetOverride, or any write API in the production path. So the 2.5D layer is observation-only; runtime behavior and state flow are unchanged by it (see 08_DIAGNOSTICS.md, Dev-only surfaces).

**How it visualizes stacked domains**

- Stacked domains are: State (log + derived), Layout (layout-store + override stores), Renderer (current tree + Registry), Behavior (last action, contract verb path, runtime verb path), and optionally Engine (which handlers ran). A 2.5D view can show: state keys and counts (journal tracks, values keys, scans count, interactions count), layout (templateId, experience, override map keys), render (section keys, layout resolved per section), behavior (last action name, branch taken), and pipeline stages (action pass/fail, behavior pass/fail, etc.). All of this is available from existing getters and trace records; no new architecture is introduced.

---

## INGEST INTEGRATION POINTS

How inputs enter the system, from existing docs and code:

- **Scans (existing):** global-scan.engine produces scan results → dispatchState("scan.result", payload). global-scan.state-bridge produces interpreted scans → dispatchState("scan.interpreted", payload). These feed derived.scans; consumers include global-scan selectors, Google Ads dashboard, UseGlobalWindow, pipeline proof scripts. So "scan" ingest enters via the same state API as all other mutations; no separate ingest pipeline is defined.
- **Screen/content (existing):** Screens enter via loadScreen (fetch /api/screens/... or TSX descriptor). Content for skin/organ slots enters via json?.data and applySkinBindings(slot → data[slotKey]). Content for landing page can come from resolveContent (e.g. "construction-cleanup"). So documents and "content" enter as (1) screen JSON, (2) data bag for slots, (3) content-resolver for specific keys.
- **Product / adapters (existing):** Product-to-screen adapter and scripts (e.g. npm run product-screen) produce or transform data that can be used to build screens or content; they are build-time or one-off. Imports (e.g. from external sources) are not detailed in 01–09; the pattern would be: any external input that should affect the app must eventually produce state intents (dispatchState) or screen/content (loadScreen, data bag) so that the single pipeline and single state spine remain the only entry points.
- **Camera, audio, LiDAR, web tools:** Not described in the existing architecture. If they are added, the contract is: they must not bypass the state or pipeline boundaries. They would feed state via dispatchState (e.g. a dedicated intent like "camera.frame" or "ingest.document") or feed the data bag / content-resolver so that Renderer and Logic see data only through state or through the existing document/slot path. No new architecture is introduced; only new intents or new content keys and consumers.

---

## SENSOR CONTEXT PATH

How context (location, time, device) flows into state and then into decision engines:

**location / time / device → context engines → state enrichment → decision engines**

- **Context sources (conceptual):** Location (e.g. geo), time (e.g. route/effect when loadScreen runs, or timestamp on events), and device (e.g. viewport, density) are not implemented as separate "sensor" services in the current docs. What exists: (1) **Time/route** — searchParams and useEffect drive when loadScreen runs and what path is loaded. (2) **Viewport / density** — documented as optional user context for Layout Decision Engine (Plan 5) and Suggestion Injection Point; supplied by "UI, viewport API, or defaults." (3) **Scans** — global-scan.engine and state-bridge push scan.result / scan.interpreted into state (derived.scans), which can be treated as sensor-derived enrichment.
- **Context engines:** Any processor that turns raw context (location, time, device, or scan data) into state intents is a context engine. Today: global-scan.engine and global-scan.state-bridge are examples (scan → dispatchState). A future "context engine" would read location/time/device (or receive it as input) and call dispatchState with a dedicated intent (e.g. context.location, context.viewport) so that derived state carries enriched context.
- **State enrichment:** State is enriched when new intents are handled in deriveState (e.g. a new derived key like contextViewport or contextLocation). Existing enrichment: scan.result / scan.interpreted → derived.scans; interaction.record → derived.interactions. So "state enrichment" = appending or updating derived state from context/sensor inputs via the same log and deriveState contract.
- **Decision engines:** Engines that choose what to do next (e.g. flow-resolver resolveView, landing-page-resolver, or the planned Layout Decision Engine) read from getState(). They see the enriched state (currentView, values, journal, scans, interactions, and any future context keys). So: context → context engine → dispatchState → log → deriveState → enriched snapshot → decision engines read getState() and run. Decision engines do not read sensors directly; they read only state (and arguments passed by the pipeline). This keeps the topology: sensors/context → State → decision engines → (optional) dispatchState for next step.

---

## AI + HI + PROTECTION POSITIONING

Positioning derived from existing boundaries and contracts:

- **AI (assist layer):** Any component that **suggests** or **augments** without being the authority. In the current system this corresponds to: (1) **Planned** Layout Decision Engine (scores layout IDs by traits; suggestion only; override > explicit > suggestion > default). (2) **Planned** Contextual Layout Logic (content → trait suggestions). (3) **Planned** User Preference Adaptation (trait weights from "more/less like this"). All are read-only for layout/state; they only provide inputs to the resolver or to scoring. So "AI" sits where logic **reads** state and layout and **returns** a recommendation; it never writes layout store or override store or node.layout. Documented in 05_LAYOUT_SYSTEM, 06_CONTRACTS_MASTER, STATE_INFLUENCE_RULES.

- **HI (clarity logic layer):** Rules and contracts that make behavior **explicit and auditable**. In the current system: (1) **State intents** and **deriveState** branches (STATE_INTENTS, state-resolver). (2) **Behavior branch order** (state:* → navigate → contract verbs → visual-proof → interpretRuntimeVerb → warn). (3) **Authority precedence** (override → explicit → template default; last event wins for state). (4) **ENGINE_LAWS** and **Param key mapping** (wrapper law, preset order, section ≠ card, etc.). (5) **Boundary separation** (no cross-boundary writes; integration only via dispatchState, runBehavior, interpretRuntimeVerb, applyProfileToNode, loadScreen). So "HI" is the layer of explicit contracts, precedence, and boundaries that any human or AI can read to understand how the system will behave.

- **Protection (safety / interruption layer):** Mechanisms that **prevent silent wrong behavior** and **limit blast radius**. In the current system: (1) **No silent fallbacks** — resolveLayout returns null → Section renders div; missing Registry type → red div "Missing registry entry"; unknown intent → log only, no derived key. (2) **Explicit warnings** — behavior-listener warns on missing action name, missing navigate 'to', runBehavior throw, unhandled action. (3) **No cross-boundary writes** — Layout cannot write State; Logic cannot write Layout; so a bug in one domain cannot corrupt another. (4) **Persistence skip for state.update** — high-frequency updates do not hammer localStorage. So "protection" is the combination of explicit fallbacks, warnings, and boundary rules; there is no separate "interruption" service in the docs—safety is achieved by contract and by the single write API (dispatchState) and single pipeline.

---

## EXECUTION PRIORITY STACK

Order of influence from existing pipeline and authority docs:

1. **Request / URL** — searchParams (screen, flow) determine whether loadScreen runs and with which path, or resolveLandingPage runs. So **time/route** (when and where the user is) is the first influence.

2. **Screen document** — What is loaded (JSON or TSX) and its root, state.currentView, and data bag. This fixes the initial tree and optional default view.

3. **State default** — loadScreen and ensureInitialView set currentView when absent. So **initial state** is the next influence.

4. **Document prep order** — assignSectionInstanceKeys → expandOrgansInDocument → applySkinBindings → composeOfflineScreen. Order is fixed; **patterns** (organ expansion, skin binding, role inference) apply in this sequence.

5. **Layout precedence** — For each section: **override (store) → explicit node.layout → template default → undefined**. So **user overrides** beat **explicit JSON** beat **template**. (Future: suggestion slot between explicit and template.)

6. **State (derived)** — At render time, state snapshot (currentView, values, journal, scans, interactions) drives visibility (when/state), field values, JournalHistory, and flow step. So **state** influences what is shown and what flow step is active.

7. **Engines (action path)** — When user acts, **state:* > navigate > contract verbs > interpretRuntimeVerb**. So **engine execution** is ordered by this branch; only one path runs per action.

8. **Output** — Renderer produces DOM; state updates produce new snapshot and re-render. So **output** is the result of the stack above.

**Summary stack (order of influence):** Request/URL → Screen doc → State default → Document prep (patterns) → Layout precedence (override → explicit → template) → State (derived) → Behavior branch (state > navigate > contract > runtime) → Engines → Output. There is no separate "commitments" or "time" engine in the docs; "time" is represented by route/effect (when loadScreen runs) and by event order in the log.

---

## SINGLE-BRAIN MODEL

**Many engines**

- Document path: assignSectionInstanceKeys, expandOrgansInDocument (organs), applySkinBindings (logic/bridges), composeOfflineScreen (lib/screens). Render path: applyProfileToNode (layout resolver, compatibility), renderNode (JsonSkinEngine for json-skin, Registry for rest), Section (resolveLayout, LayoutMoleculeRenderer). Action path: behavior-listener, runBehavior (BehaviorEngine), interpretRuntimeVerb, action-runner (runCalculator, resolveOnboarding, run25X, etc.). Also: landing-page-resolver, flow-resolver, content-resolver, engine-bridge. So many engines run in sequence or in branch; each has a single responsibility.

**Many domains**

- Layout, Logic, State, Behavior, Blueprint, Organs, Registry. Each has its own scope and stores; no domain writes another domain’s store (see 01_SYSTEM_OVERVIEW, Boundary separation).

**One state spine**

- All mutable app state flows through state-store: append-only log and deriveState(log) → DerivedState. currentView, journal, values, scans, interactions are the single derived snapshot. Layout and override stores are separate but are the only other writable surfaces (and only via UI/OrganPanel). So "one state spine" means one log, one derivation, one getState()/subscribeState for the rest of the app.

**One runtime pipeline**

- One entry: page.tsx (and layout.tsx for installBehaviorListener). One load path: loadScreen → document prep → setCurrentScreenTree → JsonRenderer. One render path: JsonRenderer → applyProfileToNode → renderNode → Registry / Section / LayoutMoleculeRenderer. One behavior path: CustomEvents → behavior-listener → state / navigate / runBehavior / interpretRuntimeVerb. So many engines and many domains are **wired through** one pipeline and one state spine; they do not create alternate pipelines or alternate state stores.

**How it fits together**

- Engines are **stages** in the pipeline (document prep, layout resolution, render, action handling) or **handlers** invoked by the behavior path. Domains **integrate** only via the documented APIs (dispatchState, runBehavior, interpretRuntimeVerb, applyProfileToNode, loadScreen). The single brain is: one log + one derivation (state), one composed tree (current-screen-tree-store), one layout/profile + overrides (layout-store + section/organ override stores), one renderer (JsonRenderer), one behavior listener. Everything else is either a read-only view of that (2.5D, diagnostics) or a staged engine/handler that reads from and writes to the spine through the same APIs.

---

## CONTRACT ANCHORS

Runtime connections are anchored by these contracts (defined in 06_CONTRACTS_MASTER and in AUTOGEN docs). Use them to verify how the system connects at runtime.

| Contract | What it anchors | Where defined / used |
|----------|-----------------|----------------------|
| **STATE_CONTRACT** | Observed state keys (currentView, journal, values, layoutByScreen, scans, interactions), intents (state:currentView, journal.set/add, state.update, scan.result/interpreted, interaction.record), derived shape (DerivedState). Who may write: dispatchState call sites only. Who may read: getState() / subscribeState consumers (JsonRenderer, flow-resolver, landing-page-resolver, handlers, etc.). | 04_STATE_SYSTEM, 06_CONTRACTS_MASTER; state-resolver deriveState; STATE_FLOW_CONTRACT, STATE_INTENTS, STATE_MUTATION_SURFACE_MAP. |
| **ENGINE_IO_CONTRACT** | Standard engine input: path (screen path or tsx:path), json (screen document), context (layout context: screenKey, sectionKey, profile). Standard engine output: screenTree (composed tree), state (DerivedState), dom (React tree with data-node-id, data-section-layout, data-container-width). Enforced at screen-loader, state-store, json-renderer. Engines do not talk to UI directly; they read/write through State and Events. | 06_CONTRACTS_MASTER, 09_AI_MASTER_SNAPSHOT; ENGINE INTERACTION MODEL above. |
| **RUNTIME_PIPELINE_CONTRACT** | Deterministic order: Request → Screen path resolution → Screen load → Document preparation → Layout resolution (per-section) → Rendering (per node) → Behavior (user gesture → event → handler) → State update. Branch order for actions: state:* → navigate → contract verbs → visual-proof → interpretRuntimeVerb → warn. loadScreen path rules; override store pass-through; no script in runtime from src/scripts/. | 02_RUNTIME_PIPELINE, RUNTIME_PIPELINE_CONTRACT.md, PIPELINE_AND_BOUNDARIES_REFERENCE.md. |

Together, these contracts ensure: (1) all state flows through one log and one derivation (STATE_CONTRACT); (2) all engine I/O goes through state and the pipeline, not direct UI (ENGINE_IO_CONTRACT); (3) the exact flow from input to render to behavior to state update is defined and repeatable (RUNTIME_PIPELINE_CONTRACT). When adding or tracing connections, check against these anchors.

---

*This file is derived from 01_SYSTEM_OVERVIEW.md through 09_AI_MASTER_SNAPSHOT.md and from src/docs/ARCHITECTURE_AUTOGEN and SYSTEM_MAP_AUTOGEN. It does not introduce new architecture; it only explains and connects what already exists.*
