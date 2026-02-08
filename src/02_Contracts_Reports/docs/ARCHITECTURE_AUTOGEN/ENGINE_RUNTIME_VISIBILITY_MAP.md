# Engine Runtime Visibility Map

**Purpose:** Single source of truth for every decision engine in the system — what they decide, where they are called (or should be called), and connection status.

**Generated:** Visibility only. No runtime or engine logic changes.

---

## Engine: Layout Resolver

**File:** layout/resolver/layout-resolver.ts  
**Purpose:** Merges page layout (section placement) and component layout (inner arrangement) into a single layout definition for sections.  
**Decision Outputs:**  
- `LayoutDefinition` (containerWidth, moleculeLayout, etc.)  
- `getLayout2Ids()` — all layout IDs for dropdowns  
- `getDefaultSectionLayoutId(templateId)` — default section layout by template  

**Inputs Required:**  
- Layout reference (string or `{ template, slot }`), optional context (templateId, sectionRole)  
- Page layout data (page-layout-resolver), component layout data (component-layout-resolver)  

**Where It SHOULD Be Called:**  
- When resolving section/card layout for render (section compound and layout application).  

**Where It IS Currently Called:**  
- `src/compounds/ui/12-molecules/section.compound.tsx` — `resolveLayout(layout)`  
- `src/layout/index.ts` — re-exports `resolveLayout`, `getLayout2Ids`  
- `src/app/page.tsx` — `getLayout2Ids`  
- `src/organs/OrganPanel.tsx` — `getLayout2Ids`  
- `src/engine/core/json-renderer.tsx` — `getLayout` (layout-store), layout IDs from layout module  
- `src/dev/section-layout-dropdown.tsx` — `getLayout2Ids`, `evaluateCompatibility`  

**Pipeline Stage:** Layout Resolution  

**Connection Status:** ACTIVE — wired into section compound and layout resolution path.

---

## Engine: Page Layout Resolver

**File:** layout/page/page-layout-resolver.ts  
**Purpose:** Resolves page-level layout (section placement, container width, background) by layout ID from a static registry.  
**Decision Outputs:**  
- `resolvePageLayout(layoutId)` — page layout definition  
- `getPageLayoutId`, `getPageLayoutById`, `getPageLayoutIds`, `getDefaultSectionLayoutId`  

**Inputs Required:**  
- Layout ID (string), optional context.  
- Data: page-layouts.json (or equivalent).  

**Where It SHOULD Be Called:**  
- From main layout resolver when merging page + component layout.  

**Where It IS Currently Called:**  
- `src/layout/resolver/layout-resolver.ts` — `getPageLayoutId`, `getPageLayoutById`, `getPageLayoutIds`, `getDefaultSectionLayoutId` (via layout/page)  
- `src/layout/page/index.ts` — re-exports  

**Pipeline Stage:** Layout Resolution  

**Connection Status:** ACTIVE — used by layout-resolver.

---

## Engine: Component Layout Resolver

**File:** layout/component/component-layout-resolver.ts  
**Purpose:** Resolves component (inner) layout definition by layout ID (column/row/grid/stacked, preset, params).  
**Decision Outputs:**  
- `resolveComponentLayout(layoutId)` — ComponentLayoutDefinition or null  

**Inputs Required:**  
- Layout ID (string).  
- Data: component-layouts.json.  

**Where It SHOULD Be Called:**  
- From main layout resolver when building merged LayoutDefinition.  

**Where It IS Currently Called:**  
- `src/layout/resolver/layout-resolver.ts` — `resolveComponentLayout(layoutId)`  
- `src/layout/component/index.ts` — re-exports  

**Pipeline Stage:** Layout Resolution  

**Connection Status:** ACTIVE — used by layout-resolver.

---

## Engine: Layout Compatibility Evaluator

**File:** layout/compatibility/compatibility-evaluator.ts  
**Purpose:** Evaluates whether selected section, card, and organ internal layouts are compatible with the section’s content (required vs available slots).  
**Decision Outputs:**  
- `CompatibilityResult`: sectionValid, cardValid, organValid, missing slots array  

**Inputs Required:**  
- Section node, sectionLayoutId, cardLayoutId, organId, organInternalLayoutId  
- Content capability extractor (available slots), requirement registry (required slots)  

**Where It SHOULD Be Called:**  
- When applying section/card/organ layout overrides (to validate before applying).  

**Where It IS Currently Called:**  
- `src/engine/core/json-renderer.tsx` — `evaluateCompatibility({ sectionNode, sectionLayoutId, cardLayoutId, organId, organInternalLayoutId })`  
- `src/organs/OrganPanel.tsx` — `evaluateCompatibility` (multiple call sites)  
- `src/dev/section-layout-dropdown.tsx` — `evaluateCompatibility`  
- `src/layout/index.ts` — re-exports  

**Pipeline Stage:** Layout Resolution  

**Connection Status:** ACTIVE — wired in JsonRenderer applyProfileToNode and organ/section UI.

---

## Engine: Molecule Layout Resolver

**File:** lib/layout/molecule-layout-resolver.ts  
**Purpose:** Resolves molecule-level layout (column/row/grid/stack) and preset for a given molecule type and optional flow.  
**Decision Outputs:**  
- Resolved molecule layout definition (type, preset, params)  
- `getLayoutDefinition(flow?)`  

**Inputs Required:**  
- Molecule/node type, optional flow, preset id.  
- Layout definitions (definitions-molecule), presets.  

**Where It SHOULD Be Called:**  
- When rendering molecules (section, card, grid, etc.) that need layout structure.  

**Where It IS Currently Called:**  
- `src/engine/core/json-renderer.tsx` — `resolveMoleculeLayout`  
- `src/lib/site-renderer/renderFromSchema.tsx` — `resolveMoleculeLayout`  
- `src/lib/site-renderer/layout-bridge.tsx` — `resolveMoleculeLayout`  
- `src/layout/renderer/LayoutMoleculeRenderer.tsx` — `resolveMoleculeLayout`  
- Multiple compounds (footer, stepper, avatar, toolbar, field, toast, button, list, card, modal, chip) — `resolveMoleculeLayout`  

**Pipeline Stage:** Render  

**Connection Status:** ACTIVE — used across JsonRenderer, site-renderer, and molecules.

---

## Engine: Screen Layout Resolver

**File:** lib/layout/screen-layout-resolver.ts  
**Purpose:** Resolves screen-level layout type (column, grid, stack, etc.) for site/app screens.  
**Decision Outputs:**  
- Screen layout definition for a given type.  

**Inputs Required:**  
- Screen layout type (string).  

**Where It SHOULD Be Called:**  
- When composing or rendering a screen from schema (site/app).  

**Where It IS Currently Called:**  
- `src/lib/site-renderer/renderFromSchema.tsx` — `resolveScreenLayout`  
- `src/lib/site-renderer/layout-bridge.tsx` — `resolveScreenLayout`  

**Pipeline Stage:** Layout Resolution / Render  

**Connection Status:** ACTIVE — used in site-renderer path only (not main JSON screen path).

---

## Engine: Behavior Runner

**File:** behavior/behavior-runner.ts  
**Purpose:** Dispatches behavior actions (tap, go, back, route, etc.) to the correct handler using verb + variant resolution and BehaviorEngine handlers.  
**Decision Outputs:**  
- Handler execution result; may trigger navigation (fireNavigation) or state updates.  

**Inputs Required:**  
- Domain, action name, context (navigate), params (from JSON/event).  
- BehaviorEngine handlers, behavior-verb-resolver, behavior-interactions/navigations JSON.  

**Where It SHOULD Be Called:**  
- After user interaction events that match contract verbs (action event with name in verb set).  

**Where It IS Currently Called:**  
- `src/engine/core/behavior-listener.ts` — `runBehavior(domain, actionName, { navigate }, params)` for contract verbs  

**Pipeline Stage:** Behavior Dispatch  

**Connection Status:** ACTIVE — wired from behavior-listener.

---

## Engine: Behavior Engine

**File:** behavior/behavior-engine.ts  
**Purpose:** Registry of handler functions for behavior verbs (navigation, UI actions); invoked by Behavior Runner.  
**Decision Outputs:**  
- Handler return value (e.g. navigation target, result payload).  

**Inputs Required:**  
- Handler name (resolved from verb + variant), context, args.  

**Where It SHOULD Be Called:**  
- From behavior-runner when dispatching a contract verb.  

**Where It IS Currently Called:**  
- `src/behavior/behavior-runner.ts` — `(BehaviorEngine as any)?.[handlerName]` invoked by runner  

**Pipeline Stage:** Behavior Dispatch  

**Connection Status:** ACTIVE — used by behavior-runner.

---

## Engine: Behavior Verb Resolver

**File:** behavior/behavior-verb-resolver.ts  
**Purpose:** Resolves (domain, action) to a concrete handler name/variant for the Behavior Engine.  
**Decision Outputs:**  
- Resolved handler name/variant for a given verb and args.  

**Inputs Required:**  
- Domain, action name, optional args (variant, navVariant, etc.).  

**Where It SHOULD Be Called:**  
- From behavior-runner before invoking BehaviorEngine.  

**Where It IS Currently Called:**  
- `src/behavior/behavior-runner.ts` — `resolveBehaviorVerb(domain, action)`  

**Pipeline Stage:** Behavior Dispatch  

**Connection Status:** ACTIVE — used by behavior-runner.

---

## Engine: Runtime Verb Interpreter

**File:** logic/runtime/runtime-verb-interpreter.ts  
**Purpose:** Normalizes JSON/action-style verbs and forwards them to the action-runner; no decision logic.  
**Decision Outputs:**  
- Updated state (returned from runAction).  

**Inputs Required:**  
- Verb (object with type/params or name), current state.  

**Where It SHOULD Be Called:**  
- When an "action" event does not match a contract verb (fallback path).  

**Where It IS Currently Called:**  
- `src/engine/core/behavior-listener.ts` — `interpretRuntimeVerb({ name: actionName, ...params }, getState())` (dynamic require)  
- `src/logic/runtime/interaction-controller.ts` — `interpretRuntimeVerb(verb, state)`  

**Pipeline Stage:** Behavior Dispatch  

**Connection Status:** ACTIVE — wired from behavior-listener and interaction-controller.

---

## Engine: Action Runner

**File:** logic/runtime/action-runner.ts  
**Purpose:** Routes a named action to its registered handler (action-registry); single responsibility, no engine knowledge.  
**Decision Outputs:**  
- Handler side effects; returns state for pipeline continuity.  

**Inputs Required:**  
- Action (name + params), current state.  

**Where It SHOULD Be Called:**  
- From runtime-verb-interpreter and any caller that needs to run a registered action.  

**Where It IS Currently Called:**  
- `src/logic/runtime/runtime-verb-interpreter.ts` — `runAction(...)`  
- `src/screens/tsx-screens/onboarding/cards/CalculatorCard.tsx` — `runAction`  

**Pipeline Stage:** Behavior Dispatch  

**Connection Status:** ACTIVE — wired from verb interpreter and CalculatorCard.

---

## Engine: Engine Registry (applyEngine / getPresentation)

**File:** logic/engine-system/engine-registry.ts  
**Purpose:** Central registry of execution engines (learning, calculator, abc) and aftermath processors (decision, summary); transforms flows via applyEngine and provides getPresentation for step order/presentation.  
**Decision Outputs:**  
- Transformed flow (EngineFlow) per engine ID  
- Presentation model (stepOrder, etc.) per engine ID  

**Inputs Required:**  
- Flow (EducationFlow), engine ID (ExecutionEngineId or AftermathProcessorId).  

**Where It SHOULD Be Called:**  
- When loading a flow for a given engine (flow-loader, engine-viewer, FlowRenderer).  

**Where It IS Currently Called:**  
- `src/logic/flows/flow-loader.ts` — `applyEngine(flow, effectiveEngineId)` (multiple branches)  
- `src/logic/flow-runtime/FlowRenderer.tsx` — `getPresentation(...)`  
- `src/screens/tsx-screens/onboarding/engine-viewer.tsx` — `getAvailableEngines`, `applyEngine`, `getPresentation`  
- `src/logic/ui-bindings/engine-viewer.tsx` — same  
- `src/engine/onboarding/IntegrationFlowEngine.tsx`, `OnboardingFlowRenderer.tsx` — `getPresentation`  

**Pipeline Stage:** Screen Load (flow/TSX path only); not on main JSON screen path  

**Connection Status:** ACTIVE — wired for TSX/flow screens; NOT CONNECTED on main JSON screen load (page → loadScreen → JsonRenderer).

---

## Engine: Flow Router (resolveNextStep)

**File:** logic/engines/flow-router.ts  
**Purpose:** Determines the next step index and updated EngineState based on flow routing rules, signals, blockers, and opportunities.  
**Decision Outputs:**  
- `nextStepIndex`, `engineState`  

**Inputs Required:**  
- Flow, currentStepIndex, accumulatedSignals/Blockers/Opportunities, outcomes, presentation, calcOutputs, engineId.  

**Where It SHOULD Be Called:**  
- When user makes a choice in an education/flow card and the app needs the next step.  

**Where It IS Currently Called:**  
- `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx` — `resolveNextStep(...)`  
- `src/logic/engine-system/engine-explain.ts` — `resolveNextStep` (used for explain)  

**Pipeline Stage:** State Derivation / Behavior Dispatch (flow step progression)  

**Connection Status:** ACTIVE — used by EducationCard and engine-explain.

---

## Engine: Decision Engine (processDecisionState)

**File:** logic/engines/decision/decision.engine.ts  
**Purpose:** Aftermath processor: consumes completed EngineState and produces decision recommendations and explanations (DecisionState).  
**Decision Outputs:**  
- DecisionState (recommendations, explanations, confidence).  

**Inputs Required:**  
- EngineState, optional outcomes array, context.  

**Where It SHOULD Be Called:**  
- After flow completion when HI engine is "decision" or when decision insights are needed.  

**Where It IS Currently Called:**  
- `src/logic/engines/post-processing/hi-engine-runner.ts` — `processDecisionState(engineState, [], {})` for hiEngineId "decision"  
- `src/logic/engine-system/engine-registry.ts` — decisionEngine/decisionPresentation (legacy flow transform path)  

**Pipeline Stage:** Post-Render / State Derivation  

**Connection Status:** ACTIVE — used by HI engine runner and registry (legacy).

---

## Engine: Decision State Aggregator

**File:** logic/engines/decision-engine.ts  
**Purpose:** Aggregates outcomes and calc outputs into a single decision state (signals, blockers, recommendations).  
**Decision Outputs:**  
- Aggregated decision state used by decision.engine.  

**Inputs Required:**  
- Outcomes array, calcOutputs, context (severityDensity, weightSum, totalSteps, etc.).  

**Where It SHOULD Be Called:**  
- From decision.engine when building DecisionState from EngineState.  

**Where It IS Currently Called:**  
- `src/logic/engines/decision/decision.engine.ts` — `aggregateDecisionState(...)`  
- `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx` — `aggregateDecisionState`  

**Pipeline Stage:** State Derivation  

**Connection Status:** ACTIVE — used by decision.engine and EducationCard.

---

## Engine: HI Engine Runner

**File:** logic/engines/post-processing/hi-engine-runner.ts  
**Purpose:** Runs post-processing HI engines (calculator, comparison, decision, shared) on completed EngineState and attaches results.  
**Decision Outputs:**  
- Updated EngineState with HI results (outputs, decisionState, selectedExecutionEngine).  

**Inputs Required:**  
- EngineState, hiEngineId.  

**Where It SHOULD Be Called:**  
- When a flow card completes and a hiEngineId is configured.  

**Where It IS Currently Called:**  
- `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx` — `runHIEngines(derivedEngineState, hiEngineId)` on completion  

**Pipeline Stage:** Post-Render / State Derivation  

**Connection Status:** ACTIVE — used by EducationCard on flow completion.

---

## Engine: Engine Selector

**File:** logic/engines/shared/engine-selector.ts  
**Purpose:** Selects the execution engine (learning/calculator/abc) based on EngineState and context; used for explainability and HI “shared” post-processing.  
**Decision Outputs:**  
- Selected execution engine ID, optional selection reason.  

**Inputs Required:**  
- EngineState, fallback engine ID.  

**Where It SHOULD Be Called:**  
- When determining which engine to use for presentation or for “shared” HI engine.  

**Where It IS Currently Called:**  
- `src/logic/flow-runtime/FlowRenderer.tsx` — `selectExecutionEngine`  
- `src/logic/engines/post-processing/hi-engine-runner.ts` — `selectExecutionEngine(engineState, "learning")` for "shared"  
- `src/screens/tsx-screens/onboarding/engine-viewer.tsx` — `getSelectionReason`  
- `src/logic/ui-bindings/engine-viewer.tsx` — `getSelectionReason`  

**Pipeline Stage:** Layout Resolution / State Derivation (flow path)  

**Connection Status:** ACTIVE — used in flow renderer and HI engine runner.

---

## Engine: Flow Resolver (resolveView)

**File:** logic/runtime/flow-resolver.ts  
**Purpose:** Resolves the next view/screen ID for a flow based on flow definition and derived state (e.g. completed steps).  
**Decision Outputs:**  
- View ID (string) — which screen to show next.  

**Inputs Required:**  
- Flow ID, DerivedState (interactions, etc.).  

**Where It SHOULD Be Called:**  
- When resolving onboarding or flow-based landing view.  

**Where It IS Currently Called:**  
- `src/logic/actions/resolve-onboarding.action.ts` — `resolveView(flow, derivedState)`  

**Pipeline Stage:** Screen Load / State Derivation  

**Connection Status:** ACTIVE — used by resolve-onboarding action.

---

## Engine: View Resolver (Immediate/Expanded/Export)

**File:** logic/runtime/view-resolver.ts  
**Purpose:** Resolves DecisionState into ImmediateView, ExpandedView, ExportView and export artifacts (business-profile aware).  
**Decision Outputs:**  
- `resolveImmediateView`, `resolveExpandedView`, `resolveExportView`, `getExportArtifacts`  

**Inputs Required:**  
- DecisionState (outputs.immediateView, expandedView, exportView, exportArtifacts).  

**Where It SHOULD Be Called:**  
- When rendering decision outputs in mobile/accordion/export UIs.  

**Where It IS Currently Called:**  
- NOT CONNECTED — no imports of view-resolver in codebase; summary/export-resolver.ts has its own resolveImmediateView/resolveExportView.  

**Pipeline Stage:** Post-Render  

**Connection Status:** DORMANT — exists but never called (duplicate or legacy path in summary/export-resolver).

---

## Engine: Landing Page Resolver

**File:** logic/runtime/landing-page-resolver.ts  
**Purpose:** Resolves the initial landing content and flow when no screen or flow param is present (state + engine state + content).  
**Decision Outputs:**  
- `{ content, flow }` for landing page.  

**Inputs Required:**  
- State (getState), engine state (readEngineState), content resolver, onboarding resolution.  

**Where It SHOULD Be Called:**  
- From page when determining what to show when no screen/flow in URL.  

**Where It IS Currently Called:**  
- `src/app/page.tsx` — `resolveLandingPage()` when no screen, no flow  

**Pipeline Stage:** Screen Load  

**Connection Status:** ACTIVE — wired in page.tsx.

---

## Engine: Content Resolver

**File:** logic/content/content-resolver.ts  
**Purpose:** Resolves content by key (e.g. construction-cleanup, education-flow) from a content map.  
**Decision Outputs:**  
- Content payload for a given ContentKey.  

**Inputs Required:**  
- Content key.  

**Where It SHOULD Be Called:**  
- When loading landing or education content.  

**Where It IS Currently Called:**  
- `src/logic/runtime/landing-page-resolver.ts` — `resolveContent("construction-cleanup")`  
- `src/logic/content/education-resolver.ts` — `resolveContent("education-flow")`  

**Pipeline Stage:** Screen Load  

**Connection Status:** ACTIVE — used by landing-page-resolver and education-resolver.

---

## Engine: Screen Loader

**File:** engine/core/screen-loader.ts  
**Purpose:** Loads a screen by path (JSON fetch or TSX screen marker); initializes default state from JSON when present.  
**Decision Outputs:**  
- Screen payload (JSON or `{ __type: "tsx-screen", path }`).  

**Inputs Required:**  
- Path (screen id or path), optional state dispatch.  

**Where It SHOULD Be Called:**  
- From page when screen or flow param is present.  

**Where It IS Currently Called:**  
- `src/app/page.tsx` — `loadScreen(screen)`  
- `src/components/system/app-loader.tsx` — `loadScreen`  

**Pipeline Stage:** Screen Load  

**Connection Status:** ACTIVE — wired in page and app-loader.

---

## Engine: Palette Resolver

**File:** engine/core/palette-resolver.ts  
**Purpose:** Resolves style params (tokens) for nodes from palette/theme (resolveParams).  
**Decision Outputs:**  
- Resolved params object for a node.  

**Inputs Required:**  
- Node (with params/style refs), palette/theme context.  

**Where It SHOULD Be Called:**  
- When rendering any molecule or node that uses palette tokens.  

**Where It IS Currently Called:**  
- `src/engine/core/json-renderer.tsx` — `resolveParams`  
- `src/layout/renderer/LayoutMoleculeRenderer.tsx` — `resolveParams`  
- Multiple compounds (footer, stepper, avatar, navigation, pricing-table, toolbar, field, toast, button, list, card, modal, chip) — `resolveParams`  

**Pipeline Stage:** Render  

**Connection Status:** ACTIVE — used across renderer and molecules.

---

## Engine: Global Scan Engine

**File:** engine/core/global-scan.engine.ts  
**Purpose:** Runs global scan(s) (raw scan execution).  
**Decision Outputs:**  
- Raw scan results (consumed by analyzer and state bridge).  

**Inputs Required:**  
- Scan config.  

**Where It SHOULD Be Called:**  
- Once per process when global scan is requested (e.g. state bridge).  

**Where It IS Currently Called:**  
- `src/state/global-scan.state-bridge.ts` — `runGlobalScan(config)` (guarded once per process)  
- `src/scans/global-scans/global-scan.test.ts` — import only  

**Pipeline Stage:** Other (Scan)  

**Connection Status:** ACTIVE — wired via global-scan.state-bridge.

---

## Engine: JsonSkin Engine

**File:** logic/engines/json-skin.engine.tsx  
**Purpose:** Renders json-skin screen nodes (e.g. landing blocks); reads/writes engine state via engine-bridge.  
**Decision Outputs:**  
- React subtree for json-skin node; engine state updates (writeEngineState).  

**Inputs Required:**  
- Screen node (children), engine state (readEngineState, subscribeEngineState).  

**Where It SHOULD Be Called:**  
- When JsonRenderer encounters node.type === "json-skin".  

**Where It IS Currently Called:**  
- `src/engine/core/json-renderer.tsx` — `<JsonSkinEngine screen={node} />`  

**Pipeline Stage:** Render  

**Connection Status:** ACTIVE — wired in JsonRenderer.

---

## Engine: Learning Engine

**File:** logic/engines/learning.engine.ts  
**Purpose:** Execution engine: filters/orders flow steps by learning/comprehension signals and educational purpose.  
**Decision Outputs:**  
- Transformed flow (EngineFlow), learning presentation model.  

**Inputs Required:**  
- EducationFlow.  

**Where It SHOULD Be Called:**  
- When applyEngine is called with engineId "learning" (flow-loader, engine-viewer).  

**Where It IS Currently Called:**  
- `src/logic/engine-system/engine-registry.ts` — learningEngine, learningPresentation in registries  
- Invoked via flow-loader.applyEngine(flow, "learning") and getPresentation  

**Pipeline Stage:** Screen Load (flow path)  

**Connection Status:** ACTIVE — wired via engine-registry and flow-loader.

---

## Engine: Calculator Engine

**File:** logic/engines/calculator/calculator.engine.ts  
**Purpose:** Execution engine: filters/orders flow steps by numeric signals and calcRefs.  
**Decision Outputs:**  
- Transformed flow, calculator presentation model.  

**Inputs Required:**  
- EducationFlow.  

**Where It SHOULD Be Called:**  
- When applyEngine is called with engineId "calculator".  

**Where It IS Currently Called:**  
- `src/logic/engine-system/engine-registry.ts` — calculatorEngine, calculatorPresentation  
- Invoked via flow-loader and FlowRenderer (HI engine selector)  

**Pipeline Stage:** Screen Load (flow path)  

**Connection Status:** ACTIVE — wired via engine-registry.

---

## Engine: ABC Engine

**File:** logic/engines/abc.engine.ts  
**Purpose:** Execution engine: flow transformation for ABC presentation.  
**Decision Outputs:**  
- Transformed flow, abc presentation model.  

**Inputs Required:**  
- EducationFlow.  

**Where It SHOULD Be Called:**  
- When applyEngine is called with engineId "abc".  

**Where It IS Currently Called:**  
- `src/logic/engine-system/engine-registry.ts` — abcEngine, abcPresentation  
- Invoked via flow-loader and FlowRenderer  

**Pipeline Stage:** Screen Load (flow path)  

**Connection Status:** ACTIVE — wired via engine-registry.

---

## Engine: Summary Engine

**File:** logic/engines/summary/summary.engine.ts  
**Purpose:** Aftermath processor: consumes EngineState and produces summary presentation/outputs.  
**Decision Outputs:**  
- Summary presentation / summary state.  

**Inputs Required:**  
- EducationFlow (legacy), or EngineState for post-processing.  

**Where It SHOULD Be Called:**  
- When summary post-processing is needed after flow completion.  

**Where It IS Currently Called:**  
- `src/logic/engine-system/engine-registry.ts` — summaryEngine, summaryPresentation  
- No direct call to processSummaryState in HI engine runner (comparison stub exists; summary not in HIEngineId enum)  

**Pipeline Stage:** Post-Render (flow path)  

**Connection Status:** PARTIAL — registered and used for getPresentation/applyEngine; summary post-processing not invoked from HI engine runner.

---

## Engine: Engine Explain

**File:** logic/engine-system/engine-explain.ts  
**Purpose:** Explains why a particular next step was chosen (signals, routing mode, nextStepId).  
**Decision Outputs:**  
- EngineExplainEvent (currentStepId, choiceId, emitted, routing, nextStepId, meta).  

**Inputs Required:**  
- Flow, currentStepIndex, currentStepId, choiceId, choiceOutcome, accumulated signals/blockers/opportunities.  

**Where It SHOULD Be Called:**  
- When user or debug UI needs explainability for the last step transition.  

**Where It IS Currently Called:**  
- `src/screens/tsx-screens/onboarding/cards/EducationCard.tsx` — `explainNextStep(...)`  

**Pipeline Stage:** State Derivation / Post-Render  

**Connection Status:** ACTIVE — used by EducationCard.

---

## Engine: Next Step Reason

**File:** logic/engines/next-step-reason.ts  
**Purpose:** Builds a structured reason object (current step, choice, emitted signals/blockers/opportunities, routing explanation, next step) for explainability UI.  
**Decision Outputs:**  
- NextStepReason object, formatNextStepReasonAsJSON.  

**Inputs Required:**  
- Flow, engine state, step/choice/outcome data (and engine-explain event type).  

**Where It SHOULD Be Called:**  
- When displaying why the next step was selected (engine-viewer, debug).  

**Where It IS Currently Called:**  
- `src/screens/tsx-screens/onboarding/engine-viewer.tsx` — `createNextStepReason`, `formatNextStepReasonAsJSON`  
- `src/logic/ui-bindings/engine-viewer.tsx` — same  

**Pipeline Stage:** Post-Render  

**Connection Status:** ACTIVE — used by engine-viewer for explainability.

---

## Engine: Value Translation Engine

**File:** logic/engines/comparison/value-translation.engine.ts  
**Purpose:** Converts facts and research inputs into value-impact blocks (benefits, loss avoidance, peace of mind) with citations; no AI.  
**Decision Outputs:**  
- ValueTranslationOutput (valueImpactBlocks, traceability, etc.).  

**Inputs Required:**  
- ValueTranslationInput (products, research, user intent, dimensions).  

**Where It SHOULD Be Called:**  
- Post-compile annotation, website compile, or when value blocks are needed for UI/export.  

**Where It IS Currently Called:**  
- `src/scripts/proof-runs/run-bend-soap-proof.ts`, `run-gibson-proof.ts` — `translateValue`  
- `src/scripts/websites/adapters/value-translation-adapter.ts` — `translateValue`  
- `src/logic/value/value-annotation.ts` — `translateValue` (import path may be alias to comparison engine)  
- `src/logic/value/validation-guardrails.ts` — types only (ValueImpactBlock)  
- `src/logic/engines/comparison/value-comparison.engine.ts` — types (ValueImpactBlock)  

**Pipeline Stage:** Other (compile/annotation)  

**Connection Status:** PARTIAL — used in scripts, value-annotation, and adapters; not in main runtime render path.

---

## Engine: Value Comparison Engine

**File:** logic/engines/comparison/value-comparison.engine.ts  
**Purpose:** Compares products (or entities) on value dimensions and produces comparison result.  
**Decision Outputs:**  
- Comparison result (e.g. compareProducts).  

**Inputs Required:**  
- Products, dimensions, options.  

**Where It SHOULD Be Called:**  
- When comparison blocks are needed (site overlay or proof scripts).  

**Where It IS Currently Called:**  
- `src/scripts/proof-runs/run-bend-soap-proof.ts`, `run-gibson-proof.ts` — `compareProducts`  
- `src/lib/site-engines/applyEngineOverlays.ts` — engineId "value-comparison" referenced for overlay config; no direct call to compareProducts in applyEngineOverlays  

**Pipeline Stage:** Other (compile/scripts)  

**Connection Status:** PARTIAL — used in proof scripts; site overlay references config but does not call engine directly in main path.

---

## Engine: Apply Engine Overlays

**File:** lib/site-engines/applyEngineOverlays.ts  
**Purpose:** Injects engine-driven blocks (comparison, calculator, badges, recommendations) into SiteSchema between compile and render.  
**Decision Outputs:**  
- SiteSchema with overlay blocks injected.  

**Inputs Required:**  
- SiteSchema, NormalizedSite, EngineOverlayConfig.  

**Where It SHOULD Be Called:**  
- After compileSiteToSchema, before renderFromSchema (site build pipeline).  

**Where It IS Currently Called:**  
- NOT CONNECTED — no callers found in codebase for applyEngineOverlays.  

**Pipeline Stage:** Other (site compile)  

**Connection Status:** DORMANT — exists but never called; site render path may not use this pipeline.

---

## Engine: Calc Resolver

**File:** logic/runtime/calc-resolver.ts  
**Purpose:** Resolves and executes calc references (resolveCalcs) against registered calculators.  
**Decision Outputs:**  
- Resolved calc results (keyed by calc ref id).  

**Inputs Required:**  
- Calc refs, state/context.  

**Where It SHOULD Be Called:**  
- When a step or flow requires calculator outputs (e.g. before or after step completion).  

**Where It IS Currently Called:**  
- NOT CONNECTED — no imports of resolveCalcs found in codebase.  

**Pipeline Stage:** State Derivation  

**Connection Status:** DORMANT — exists but never called.

---

## Engine: Profile Resolver

**File:** lib/layout/profile-resolver.ts  
**Purpose:** Resolves experience and template profile (getExperienceProfile, getTemplateProfile) for layout defaulting.  
**Decision Outputs:**  
- Profile (defaultSectionLayoutId, etc.).  

**Inputs Required:**  
- Experience id, template id; template-profiles / presentation profiles.  

**Where It SHOULD Be Called:**  
- When composing screen or applying layout defaults (page, JsonRenderer).  

**Where It IS Currently Called:**  
- `src/app/page.tsx` — `getExperienceProfile`, `getTemplateProfile`  

**Pipeline Stage:** Screen Load / Layout Resolution  

**Connection Status:** ACTIVE — used in page.tsx.

---

## Engine: Engine Runner (UI)

**File:** engine/runners/engine-runner.tsx  
**Purpose:** Listens for "hicurv.app.load" and passes payload to JsonRenderer; does not perform decisions.  
**Decision Outputs:**  
- None (UI only — renders JsonRenderer with screen from event).  

**Inputs Required:**  
- CustomEvent "hicurv.app.load" detail (screen payload).  

**Where It SHOULD Be Called:**  
- Rendered as route/component when app uses event-driven screen load.  

**Where It IS Currently Called:**  
- `src/components/system/app-loader.tsx` — references "engine-runner listens for this" (comment); EngineRunner component may be mounted elsewhere  
- No direct import of engine-runner.tsx found in grep; likely mounted via route or app shell  

**Pipeline Stage:** Screen Load  

**Connection Status:** PARTIAL — component exists; app-loader comment suggests integration but call chain not fully traced.

---

## Engines NOT in Main Runtime (Documented / Planned)

These are documented in ARCHITECTURE_AUTOGEN or plans but have no implementation or no call sites in the main execution path:

| Name | Notes |
|------|--------|
| **Layout Decision Engine** | Would score/rank compatible layout IDs by traits; not called from resolver or applyProfileToNode. |
| **User Preference Adaptation** | Would persist trait weights from "more/less like this"; no preference memory or wiring. |
| **Suggestion Injection Point** | Resolver never calls Logic for a suggested layout ID; precedence is override → explicit → template default only. |
| **Contextual Layout Logic** | Would map content structure to trait suggestions; no rules or engine in code. |
| **Trait Registry System** | No trait-registry or layout-traits loader; no layout ID → traits lookup in runtime. |
| **Explainability / Trace (Layout)** | No explanation object from layout resolver; no structured trace (source, layoutId, suggestionDetail) in layout path. |

---

# RUNTIME PIPELINE — ENGINE OVERLAY

Map of engines to pipeline stages. Status: ACTIVE / PARTIAL / DORMANT.

**Screen Load**  
  → Screen Loader (ACTIVE)  
  → Landing Page Resolver (ACTIVE)  
  → Content Resolver (ACTIVE)  
  → Flow Resolver resolveView (ACTIVE)  
  → Engine Registry applyEngine / getPresentation (ACTIVE — flow/TSX path only)  
  → Learning Engine (ACTIVE via registry)  
  → Calculator Engine (ACTIVE via registry)  
  → ABC Engine (ACTIVE via registry)  
  → Summary Engine (PARTIAL — registered; summary post-processing not in HI runner)  
  → Profile Resolver (ACTIVE)  
  → Engine Runner UI (PARTIAL)

**Layout Resolution**  
  → Layout Resolver (ACTIVE)  
  → Page Layout Resolver (ACTIVE)  
  → Component Layout Resolver (ACTIVE)  
  → Layout Compatibility Evaluator (ACTIVE)  
  → Screen Layout Resolver (ACTIVE — site-renderer only)  
  → Molecule Layout Resolver (ACTIVE)  
  → Layout Decision Engine (DORMANT — not implemented)  
  → Suggestion Injection / Trait Registry (DORMANT — not implemented)

**Render**  
  → Palette Resolver (ACTIVE)  
  → JsonSkin Engine (ACTIVE)  
  → Molecule Layout Resolver (ACTIVE)

**Behavior Dispatch**  
  → Behavior Runner (ACTIVE)  
  → Behavior Engine (ACTIVE)  
  → Behavior Verb Resolver (ACTIVE)  
  → Runtime Verb Interpreter (ACTIVE)  
  → Action Runner (ACTIVE)

**State Derivation**  
  → Flow Router resolveNextStep (ACTIVE)  
  → Engine Selector (ACTIVE)  
  → Decision Engine processDecisionState (ACTIVE)  
  → Decision State Aggregator (ACTIVE)  
  → HI Engine Runner (ACTIVE)  
  → Calc Resolver (DORMANT — not connected)

**Post-Render**  
  → Engine Explain (ACTIVE)  
  → Next Step Reason (ACTIVE)  
  → View Resolver (DORMANT — not connected)

**Other**  
  → Global Scan Engine (ACTIVE)  
  → Value Translation Engine (PARTIAL — scripts/annotation)  
  → Value Comparison Engine (PARTIAL — scripts)  
  → Apply Engine Overlays (DORMANT — not connected)

---

*Autogenerated per Engine Visibility & Injection Map Protocol. Do not change runtime or engine logic; visibility only.*
