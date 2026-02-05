# Engine Responsibility Index (WHAT each engine owns)

**Purpose:** Define strict ownership boundaries so engines never overlap responsibilities.  
**Source:** Static scan of `src/logic`, `src/layout`, `src/behavior`, `src/state`, `src/organs`, `src/engine/core`.  
**Convention:** "Owns" = primary responsibility. "Must NOT Modify" = architectural boundary.

---

## Table

| Engine | Owns | Reads From | Writes To | Must NOT Modify |
|--------|------|------------|-----------|-----------------|
| Flow Router | Next step index and EngineState from flow + signals | flow, presentation, outcomes, calcOutputs | (returns new engineState; caller persists) | Flow JSON; state store; layout stores |
| Engine Selector | Which execution engine (calculator/abc/learning) | EngineState | (return value only) | Flow; state store; layout |
| Decision Engine (aggregate) | DecisionState from outcomes + calc results | outcomes, calculatorResults, context | (return value only) | Flow; state store; layout |
| Decision Processor (aftermath) | DecisionState from EngineState | EngineState, outcomes, context | (return value only) | Flow; state store; layout |
| Layout Resolver | Merged layout definition (page + component) | page layouts, component layouts, getPageLayoutId, context | (return value only) | State stores; logic stores; node tree |
| Page Layout Resolver | Page layout id and definition; template default id | layout ref, context, page-layouts.json, templates.json | (return value only) | State; logic; component layouts |
| Component Layout Resolver | Component (moleculeLayout) definition by id | layoutId, component-layouts.json | (return value only) | State; logic; page layouts |
| Compatibility Evaluator | Compatibility result (section/card/organ valid + missing) | sectionNode, layout ids, requirement registry, content-capability extractor | (return value only) | Node; stores; layout resolver |
| Content Capability Extractor | Available slots for a section node | sectionNode, organ layout profile | (return value only) | Node; stores |
| Requirement Registry | Required slots per layout type/id | section/card/organ requirement JSON | (return value only) | Stores; node |
| applyProfileToNode (JsonRenderer) | Resolved section/card layout and compatibility on node copy | node, profile, override maps, getDefaultSectionLayoutId, evaluateCompatibility | Mutates copy of node (next.layout, _effectiveLayoutPreset, params for card) | State store; logic store; override stores (read-only) |
| Behavior Engine | Interaction and navigation handler execution | UIState (set); ctx (setScreen, navigate, etc.); args | UIState; ctx side effects (navigation) | State store log; layout; flow |
| Behavior Runner | Resolving and invoking behavior handler | behavior-actions-6x7, behavior-interactions, behavior-navigations, args, ctx | (invokes handler; handler may write) | State store; layout store |
| Behavior Verb Resolver | Handler + params for domain+verb | behavior-actions-6x7.json | (return value only) | All stores |
| Behavior Listener | Routing action events to state/nav/behavior | getState, action event detail | dispatchState; navigate(); runBehavior | Flow; layout store; override stores |
| State Resolver | DerivedState from event log | StateEvent[] log | (return value only) | Log array; layout; logic |
| State Store | Event log and derived state; persistence | log, deriveState | log; state (derived); localStorage | Layout stores; logic engines; flow |
| Section Layout Preset Store | Per-screen section layout overrides | (internal state + localStorage) | sectionOverrides; cardOverrides; localStorage | State store; logic; layout resolver logic |
| Organ Internal Layout Store | Per-screen organ internal layout overrides | (internal state + localStorage) | state; localStorage | State store; logic; layout resolver logic |
| Flow Loader | Loaded EducationFlow (override/cache/screen/registry) | overrideFlowMap, flowCache, FLOWS, screen API, engine registry | flowCache; engineFlowCache (when used) | State store; layout store |
| Flow Resolver (resolveView) | View id for a flow from state | flowId, FLOWS, derived.interactions | (return value only) | State store; layout |
| Landing Page Resolver | Landing content + flow; current view hint | getState, readEngineState, resolveOnboardingFromAnswers, resolveContent | (return value only) | State store mutation; layout |
| View Resolver (Immediate/Expanded/Export) | Resolved view blocks with business labels | DecisionState, resolveBusinessProfile | (return value only) | State; layout; flow |
| Content Resolver | Content by key | CONTENT_MAP | (return value only) | State; layout; flow |
| Screen Loader | Screen payload (JSON or TSX) | path, /api/screens, getState | dispatchState (default state on load) | Layout store; logic store; override stores |
| JsonRenderer (renderNode) | React tree from node + profile + state | node, profile, stateSnapshot, defaultState, override maps, Registry, palette, layout store | (React render only) | State store log; layout store; override store contents (read-only) |
| Layout Store | Active layout (experience, type, preset, templateId, mode, regionPolicy) | activeLayout, layoutSchema | activeLayout; listeners | State store; override stores; logic |
| Palette Store / Resolver | Palette name and token resolution | (internal + schema) | (internal) | State store; logic |
| Engine Runner (React) | Mounting JsonRenderer with screen from event | hicurv.app.load event | (React state: setScreen) | State; layout; behavior |
| Global Scan Engine | Scan result(s) from config | config, fetchScanSignal | dispatchState (scan results) | Layout; flow; override stores |
| Organ Registry | Organ variant JSON by organId + variantId | VARIANTS (imported JSON) | (return value only) | State; layout; logic |
| resolve-organs (expandOrgans) | Expanded tree with organ nodes replaced by variant | nodes, loadOrganVariant, overrides | (return new array) | State store; layout store; source nodes |
| Engine Registry (logic) | Engine application to flow (applyEngine) | flow, engineId, engine implementations | (return transformed flow) | State; layout |
| Engine State (logic runtime) | deriveEngineState from flow, presentation, outcomes | flow, presentation, stepIndex, outcomes, calcOutputs | (return value only) | State store; layout |
| Action Runner / Registry | Action execution by name | action registry, params | (invokes action; action may write) | Layout; flow |
| Calc Resolver | Calculator resolution | calc refs, registry | (return value only) | State store; layout |
| Engine Bridge | readEngineState (bridge to engine state) | (external engine state source) | (return value only) | State store; layout store |
| Flow Loader (flow-definitions) | FLOWS registry | (static FLOWS) | (none) | All stores |
| Learning / ABC / Calculator engines | Flow transformation and presentation model | EducationFlow | (return EngineFlow / PresentationModel) | State store; layout store |
| Layout Store (engine/core) | experience, templateId, mode, regionPolicy | layoutSchema | activeLayout | State store; section/card/organ override stores |
| UIState (engine/core) | Ephemeral UI key/value (e.g. interaction.tap) | (internal) | UIState map | State store log; layout |
| Palette Store (engine/core) | Current palette name | (internal) | (internal) | State store; logic |

---

## Summary by directory

| Directory | Primary ownership |
|-----------|--------------------|
| **src/logic** | Flow loading, step routing, engine selection, decision aggregation, view/landing resolution, flow-view mapping, calculator/learning/abc flow transform. |
| **src/layout** | Layout id resolution (page + component), compatibility evaluation, requirement and capability data; no store writes. |
| **src/behavior** | Verb resolution, handler dispatch, interaction/navigation execution; writes UIState and ctx only. |
| **src/state** | Event log, derivation, section/card/organ override persistence; no layout or logic engine logic. |
| **src/organs** | Organ variant loading and tree expansion; no store writes. |
| **src/engine/core** | Screen load, layout store, palette store, JsonRenderer (profile apply + render), behavior listener, global scan; JsonRenderer and listener read overrides but must NOT write them. |

---

## ARCHITECTURAL GAPS DETECTED

*(Cross-link validation: every engine listed in ENGINE_RESPONSIBILITY_INDEX appears in or is implied by DECISION_TRACE_CONTRACT; precedence in AUTHORITY_PRECEDENCE_MAP matches resolver logic. No runtime code was modified; only documentation and static analysis.)*

1. **Suggestion slot (layout)**  
   AUTHORITY_PRECEDENCE_MAP and STATE_AND_OVERRIDE_ORCHESTRATION document a "logic suggestion" precedence slot (3) for layout. This is **not** implemented in `applyProfileToNode`: the resolver uses override → explicit → template default → undefined only. So precedence docs are **ahead of implementation**; no inconsistency in existing resolver logic.

2. **Decision Trace coverage**  
   All engines in the responsibility index that perform conditional decisions are documented in DECISION_TRACE_CONTRACT. Engines that are pure lookups or simple merges (e.g. Content Resolver, Requirement Registry, Content Capability Extractor) have no separate "decision" section because they do not branch on multi-way conditions in a way that changes outcomes; they are covered implicitly (e.g. Compatibility Evaluator uses them). **No gap**: responsibility index includes both decision engines and non-decision modules.

3. **Override writers**  
   Authority map states that only app page / OrganPanel call `setSectionLayoutPresetOverride`, `setCardLayoutPresetOverride`, `setOrganInternalLayoutOverride`. This was not re-verified by full codebase grep in this run; the existing STATE_AND_OVERRIDE_ORCHESTRATION verification is referenced. **Recommendation**: run periodic grep for these setter names to ensure no engine or layout code calls them.

4. **state.update and persistence**  
   State store explicitly does **not** persist on `state.update` (to avoid high-frequency input flooding). Authority map and state-resolver both reflect this. **No gap**.

5. **Flow Loader precedence**  
   DECISION_TRACE_CONTRACT and AUTHORITY_PRECEDENCE_MAP both state: override flow → cache → screen-specific → FLOWS registry. Flow loader code matches. **No gap**.

6. **applyProfileToNode precedence**  
   Code: `layoutId = overrideId || existingLayoutId || templateDefaultLayoutId || undefined`. Authority map: 1. User override → 2. Explicit node.layout → 3. Template default → 4. undefined. **Match**.

7. **Engine list completeness**  
   Engines under src/logic (flow-router, engine-selector, decision-engine, decision processor, flow-loader, flow-resolver, landing-page-resolver, view-resolver, content-resolver, calculator engine, engine registry, engine-state, action runner, calc resolver, engine bridge) are in the index. Layout (resolver, page, component, compatibility, content-capability, requirement-registry) and applyProfileToNode are in the index. Behavior (engine, runner, verb-resolver) and behavior-listener are in the index. State (state-resolver, state-store, section-layout-preset-store, organ-internal-layout-store) are in the index. Organs (organ-registry, resolve-organs) and engine/core (screen-loader, json-renderer, layout-store, engine-runner, global-scan, palette, UIState) are in the index. **No missing engine** from the scanned directories.

8. **Must NOT Modify boundaries**  
   Layout resolver and compatibility do not write to state or logic. State store does not write to layout or override stores. Logic engines do not write to override stores. Behavior runner/listener write only to UIState or state-store by defined intents. **Aligned** with STATE_AND_OVERRIDE_ORCHESTRATION.

---

*End of Engine Responsibility Index and Architectural Gaps Detected.*
