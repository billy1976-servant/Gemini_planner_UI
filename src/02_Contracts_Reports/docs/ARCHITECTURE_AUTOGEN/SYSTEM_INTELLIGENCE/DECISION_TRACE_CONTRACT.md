# Decision Trace Contract (WHY decisions happen)

**Purpose:** Document how every decision-making engine evaluates inputs and reaches outputs.  
**Source:** Static analysis of `src/logic/`, `src/layout/`, `src/behavior/`, `src/state/`. Code-derived only; no speculation.

---

## 1. Flow Router (Logic)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Flow Router |
| **File Path** | `src/logic/engines/flow-router.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | `resolveNextStep`: next step index; `evaluateRoutingRule`: rule match; `applyRoutingAction`: skip/goto/repeat. |
| **Inputs Read** | `flow`, `currentStepIndex`, `accumulatedSignals`, `accumulatedBlockers`, `accumulatedOpportunities`, `outcomes`, `presentation`, `calcOutputs`, `engineId`. |
| **Conditions Evaluated** | `routing.defaultNext === "linear"` → linear; else for each `routing.rules`: `when.signals` every in state.signals, `when.blockers` some in state.blockers, `when.opportunities` some in state.opportunities. |
| **Possible Branches** | Linear: `nextIndex = currentStepIndex + 1` (or null if past end). Signal-based: first matching rule → `applyRoutingAction` (skip → index of skipTo or current+1; goto → index of gotoStep or null; repeat → index of repeatStep or current). No rule match → linear. |
| **Output Produced** | `{ nextStepIndex: number \| null, engineState: EngineState }`. |
| **Why One Branch Wins** | Linear: no routing config or `defaultNext === "linear"`. Rule wins: all `when` conditions match; first match wins. |
| **Why Others Fail** | Rule fails: missing signal/blocker/opportunity; goto step id not in orderedStepIds returns null. |

---

## 2. Engine Selector (Logic)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Engine Selector |
| **File Path** | `src/logic/engines/shared/engine-selector.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | `selectExecutionEngine`: which engine (calculator | abc | learning). |
| **Inputs Read** | `engineState`: accumulatedSignals, accumulatedBlockers, accumulatedOpportunities, calcOutputs, completedStepIds, totalSteps, currentStepIndex; `currentEngineId`. |
| **Conditions Evaluated** | Calculator: `hasCalcOutputs \|\| hasCalculatorSignals` (signals contain cost/loss/profit/price/expense/revenue/budget/monthly_cost/total_loss/intent_score). ABC: `hasAbcSignals \|\| hasMultipleDecisions` (signals contain checkbox/cascade/decision/choice/multiple/branch/conditional; or opportunities>2 or blockers>2). Learning: `hasLearningSignals \|\| accumulatedSignals.length === 0`. |
| **Possible Branches** | Return "calculator" | "abc" | "learning" | currentEngineId (fallback). |
| **Output Produced** | `ExecutionEngineId`. |
| **Why One Branch Wins** | Priority order: (1) calculator if numeric/calc outputs, (2) abc if cascading/multiple decisions, (3) learning if comprehension or no signals, (4) current engine. |
| **Why Others Fail** | Later conditions not evaluated once earlier one matches. |

---

## 3. Decision Engine / Decision Processor (Logic)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Decision Engine (aggregate) + Decision Processor (aftermath) |
| **File Paths** | `src/logic/engines/decision-engine.ts`, `src/logic/engines/decision/decision.engine.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | `aggregateDecisionState`: classify outcome flags/learned into signals vs blockers vs opportunities; calculator score ≥80 → opportunity "high_intent", &lt;40 → blocker "low_intent"; `extractSignalFromText`: pattern match (profit/drain, safety/trust, appearance/bids, cleanup/clean). |
| **Inputs Read** | `outcomes` (stepId, choiceId, outcome.signals/blockers/opportunities/flags/learned), `calculatorResults` (totalLoss, scoring.score), `context`. |
| **Conditions Evaluated** | Flag contains "blocked" → blocker; "opportunity" or "understood" → opportunity; else signal. Learned text pattern → signal. totalLoss → signal profit_drain. score ≥80 → opportunity; score &lt;40 → blocker. |
| **Possible Branches** | Immediate/expanded/export views: presence of blockers → alert first; opportunities → opportunity block; signals → signal block. Recommended steps: blockers → high priority; opportunities → medium; other signals → low. |
| **Output Produced** | `DecisionState`: signals, blockers, opportunities (deduped), recommendedNextSteps, outputs (immediateView, expandedView, exportView, exportArtifacts). |
| **Why One Branch Wins** | Classification is deterministic from content of flags/learned/signals and calculator score. View ordering: blockers > opportunities > signals. |
| **Why Others Fail** | No "failure"; all outcomes are categorized; no-match text returns null in extractSignalFromText. |

---

## 4. Layout Resolver (Layout)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Layout Resolver (unified) |
| **File Path** | `src/layout/resolver/layout-resolver.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | `resolveLayout`: layoutId from getPageLayoutId; then getPageLayoutById + resolveComponentLayout. `getLayout2Ids` / `getDefaultSectionLayoutId` delegate to page. |
| **Inputs Read** | `layout` (string or { template, slot }), `context` (templateId, sectionRole). |
| **Conditions Evaluated** | layout == null → use context.templateId + context.sectionRole for template map; else string → trim; else object with template+slot → templateMap[slot]. |
| **Possible Branches** | layoutId null → return null. pageDef null → return null. Else return merged pageDef + moleculeLayout from component. |
| **Output Produced** | `LayoutDefinition | null`. |
| **Why One Branch Wins** | First non-null source: explicit layout string, or template+slot lookup, or context template+sectionRole. |
| **Why Others Fail** | No template map for templateId; missing slot; id not in pageLayouts/componentLayouts. |

---

## 5. Page Layout Resolver (Layout)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Page Layout Resolver |
| **File Path** | `src/layout/page/page-layout-resolver.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | `getPageLayoutId`: layout vs context; `getPageLayoutById`: id lookup; `getDefaultSectionLayoutId`: template default. |
| **Inputs Read** | layout (string | { template, slot } | null), context (templateId?, sectionRole?), id (string). |
| **Conditions Evaluated** | layout == null → templates[context.templateId][context.sectionRole]. typeof layout === "string" → trim. template+slot → templates[template][slot]. getDefaultSectionLayoutId: templates[templateId]["defaultLayout"]. |
| **Possible Branches** | Return layout id string or null/undefined. |
| **Output Produced** | `string | null` (id), `PageLayoutDefinition | null`, `string | undefined` (default). |
| **Why One Branch Wins** | Explicit layout wins; then template+slot; then template default. No silent fallback (undefined when no default). |
| **Why Others Fail** | Missing template or slot in templates.json; id not in pageLayouts. |

---

## 6. Component Layout Resolver (Layout)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Component Layout Resolver |
| **File Path** | `src/layout/component/component-layout-resolver.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | `resolveComponentLayout`: lookup by layoutId (normalized lowercase and raw). |
| **Inputs Read** | `layoutId` (string | null | undefined). |
| **Conditions Evaluated** | layoutId null/not string/empty → null. Else componentLayouts[normalized] ?? componentLayouts[id]. |
| **Possible Branches** | Return component definition object or null. |
| **Output Produced** | `ComponentLayoutDefinition | null`. |
| **Why One Branch Wins** | Id present in component-layouts.json. |
| **Why Others Fail** | Id missing or invalid type. |

---

## 7. Compatibility Evaluator (Layout)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Compatibility Evaluator |
| **File Path** | `src/layout/compatibility/compatibility-evaluator.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | Section valid: required slots ⊆ available; card valid: same; organ valid (if organId + organInternalLayoutId): organ required slots ⊆ available. |
| **Inputs Read** | sectionNode, sectionLayoutId, cardLayoutId, organId, organInternalLayoutId. Uses getAvailableSlots(sectionNode), getRequiredSlots("section"|"card", id), getRequiredSlotsForOrgan(organId, internalLayoutId). |
| **Conditions Evaluated** | sectionRequired.length === 0 or every required in availableSet. Same for card and organ. |
| **Possible Branches** | sectionValid, cardValid, organValid (optional), missing[] union. |
| **Output Produced** | `CompatibilityResult`: sectionValid, cardValid, organValid?, missing[]. |
| **Why One Branch Wins** | Valid when all required slots present in available. |
| **Why Others Fail** | Any required slot not in availableSet → false and slot added to missing. |

---

## 8. applyProfileToNode — Section Layout Id (Engine Core)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Profile-to-Node Resolver (section layout) |
| **File Path** | `src/engine/core/json-renderer.tsx` (function applyProfileToNode) |

| Field | Details |
|-------|---------|
| **Decision Points** | Section layout id: override vs explicit node.layout vs template default. Card preset: apply cardLayoutPresetOverrides by parentSectionKey. |
| **Inputs Read** | node, profile, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, parentSectionKey, organInternalLayoutOverrides. profile.defaultSectionLayoutId or getDefaultSectionLayoutId(templateId). |
| **Conditions Evaluated** | isSection: overrideId = overrides[sectionKey].trim or null; existingLayoutId = node.layout trim or null; templateDefaultLayoutId from profile or getDefaultSectionLayoutId. layoutMode === "custom" → skip template section logic (strip layout keys only). |
| **Possible Branches** | layoutId = overrideId \|\| existingLayoutId \|\| templateDefaultLayoutId \|\| undefined. Then evaluateCompatibility with resolved ids. |
| **Output Produced** | next.layout, next._effectiveLayoutPreset; compatibility logged in dev. |
| **Why One Branch Wins** | Precedence: override > explicit node.layout > template default > undefined. |
| **Why Others Fail** | No override, no node.layout, no template default → undefined. |

---

## 9. Behavior Runner + Verb Resolver (Behavior)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Behavior Runner / Behavior Verb Resolver |
| **File Paths** | `src/behavior/behavior-runner.ts`, `src/behavior/behavior-verb-resolver.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | resolveBehaviorVerb: entry.enabled === true; resolveNavVariant: explicit args (variant, navVariant, …) or inferred from args (go→screen/modal/flow, open→panel/sheet, route→internal/external, back→one/all/root). runBehavior: fromAction (verb resolver) \|\| fromInteraction \|\| fromNavigation; then BehaviorEngine[handlerName]. |
| **Inputs Read** | domain, action, ctx, args; behavior-actions-6x7.json; behavior-interactions.json; behavior-navigations.json. |
| **Conditions Evaluated** | actions[domain][verb].enabled === true. Navigation: variant from args or inferred; navigations[verb][variant] present. |
| **Possible Branches** | Handler from media-primitive map, flat interaction map, or nav verb+variant. If no map: warn and return. If handler missing: warn and return. |
| **Output Produced** | Invokes handler; navigation domain may set result.target / args.target for fireNavigation. |
| **Why One Branch Wins** | First defined: fromAction then fromInteraction then fromNavigation. Nav variant: explicit then inferred from args. |
| **Why Others Fail** | Verb not in JSON or enabled false; nav variant missing or not mapped; handler not on BehaviorEngine. |

---

## 10. State Resolver (State)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | State Resolver (derive state from log) |
| **File Path** | `src/state/state-resolver.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | For each log event: intent branch (state:currentView, journal.set/add, state.update, scan.result/interpreted, interaction.record). |
| **Inputs Read** | `log: StateEvent[]` (intent, payload). |
| **Conditions Evaluated** | intent === "state:currentView" → derived.currentView = payload.value. intent === "journal.set" | "journal.add" → derived.journal[track][key] = value. intent === "state.update" → derived.values[key] = payload.value. intent scan/journal/interaction → append. |
| **Possible Branches** | Each intent maps to one branch; unknown intents ignored (no derived key). |
| **Output Produced** | `DerivedState`: journal, rawCount, currentView, scans, interactions, values. |
| **Why One Branch Wins** | First match by intent; later events overwrite/append. |
| **Why Others Fail** | Unrecognized intent skipped. |

---

## 11. Flow Loader (Logic)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Flow Loader |
| **File Path** | `src/logic/flows/flow-loader.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | Source: overrideFlowMap[flowId] → override flow (with optional engine transform); else flowCache[flowId] → cached; else screen-specific fetch; else FLOWS registry; else throw. Engine transform: applyEngine(flow, effectiveEngineId); on failure use base flow. |
| **Inputs Read** | flowId, engineId, currentEngineId, screenParam. overrideFlowMap, flowCache, FLOWS. |
| **Conditions Evaluated** | overrideFlowMap[flowId] present; flowCache[flowId] present; screenParam match and fetch ok; FLOWS[flowId]. |
| **Possible Branches** | Return override flow (transformed or base), cached flow (transformed or base), screen-specific flow, or registered flow. Throw if not found. |
| **Output Produced** | EducationFlow (cloned). |
| **Why One Branch Wins** | Override > cache > screen-specific > registry. |
| **Why Others Fail** | Fetch fail, invalid structure, or flowId not in registry. |

---

## 12. Flow Resolver (View) (Logic)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Flow Resolver (resolveView) |
| **File Path** | `src/logic/runtime/flow-resolver.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | Flow lookup; no interactions → flow.start; else first step where !completed.has(step.requires) → step.view; else flow.complete. |
| **Inputs Read** | flowId, derived (DerivedState: interactions). FLOWS[flowId]. |
| **Conditions Evaluated** | derived.interactions.length === 0; for each step completed.has(step.requires). |
| **Possible Branches** | Return flow.start | step.view | flow.complete. |
| **Output Produced** | View id string. |
| **Why One Branch Wins** | No interactions → start. First unmet step wins. All met → complete. |
| **Why Others Fail** | Unknown flowId throws. |

---

## 13. Landing Page Resolver (Logic)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Landing Page Resolver |
| **File Path** | `src/logic/runtime/landing-page-resolver.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | answers empty → default content + "calculator-1". Else resolveOnboardingFromAnswers(answers) → flow; content from resolveContent("construction-cleanup"). getCurrentView: state.currentView or resolveLandingPage().flow. |
| **Inputs Read** | getState(), readEngineState(); answers / calculatorInput. |
| **Conditions Evaluated** | answers or engineState.answers or engineState.calculatorInput; Object.keys(answers).length === 0. state.currentView set. |
| **Possible Branches** | Default landing vs onboarding-derived flow; currentView vs flow. |
| **Output Produced** | { content, flow }; view string. |
| **Why One Branch Wins** | No answers → default. Else onboarding router decides flow. View: explicit currentView wins. |
| **Why Others Fail** | resolveContent throws → content null. |

---

## 14. Screen Loader (Engine Core)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Screen Loader |
| **File Path** | `src/engine/core/screen-loader.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | path empty → throw. path without "/" and not "tsx:" → throw (IDs forbidden). path.startsWith("tsx:") → return tsx-screen descriptor. Else fetch JSON; apply default state (json.state.currentView) on load. |
| **Inputs Read** | path (string); json from /api/screens/...; getState(). |
| **Conditions Evaluated** | path format; res.ok; json.state?.currentView. |
| **Possible Branches** | TSX screen object; or fetched screen JSON with default state applied. |
| **Output Produced** | Screen payload (tsx or JSON). |
| **Why One Branch Wins** | TSX path → tsx branch. Valid path → fetch and apply defaults. |
| **Why Others Fail** | Invalid path; fetch !ok; IDs forbidden. |

---

## 15. Behavior Listener (Engine Core)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Behavior Listener (action routing) |
| **File Path** | `src/engine/core/behavior-listener.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | action name missing → return. state:* → resolve value (input vs explicit); dispatchState by mutation (currentView, update, journal.add). navigate → navigate(to). Contract verb set → runBehavior(domain, action, …). Else runtime verb interpreter. |
| **Inputs Read** | action event (params.name, params.valueFrom, params.fieldKey, params.to, etc.); getState().values; inputByFieldKey; lastInputValue. |
| **Conditions Evaluated** | actionName.startsWith("state:"); actionName === "navigate"; actionName in contract verb set; else runtime. valueFrom === "input" → resolve from state.values or input buffers. |
| **Possible Branches** | state mutation, navigate, contract behavior, runtime verb. |
| **Output Produced** | dispatchState calls; navigate(to); runBehavior; interpretRuntimeVerb. |
| **Why One Branch Wins** | Order: state: > navigate > contract verbs > runtime. |
| **Why Others Fail** | Missing action name; missing "to" for navigate; handler throw caught in listener. |

---

## 16. Calculator Engine (Logic)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Calculator Engine |
| **File Path** | `src/logic/engines/calculator/calculator.engine.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | Step classification: numericSteps (outcome signals match numeric list), inputSteps (purpose==="input"), calcRefSteps (in flow.calcRefs inputs), otherSteps. Reorder: inputSteps, numericSteps, calcRefSteps, otherSteps. Presentation: inputSteps first, then calc-tagged or weight≥3, then others. |
| **Inputs Read** | flow (steps, choices, outcome.signals, meta.purpose, meta.tags, meta.weight, calcRefs). |
| **Conditions Evaluated** | choice.outcome?.signals match numericSignals; step.meta?.purpose === "input"; calcRefs inputs include step.id; meta.tags includes "calc" or weight >= 3. |
| **Possible Branches** | Reordered flow steps; presentation stepOrder. |
| **Output Produced** | EngineFlow; PresentationModel. |
| **Why One Branch Wins** | Fixed priority: input > numeric > calcRef > other; presentation same idea. |
| **Why Others Fail** | Steps only reordered/prioritized; no branch "fails". |

---

## 17. Global Scan Engine (Engine Core)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Global Scan Engine |
| **File Path** | `src/engine/core/global-scan.engine.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | config array → run each runSingleScan; else runSingleScan(config). Invalid config (missing source.query) → throw. |
| **Inputs Read** | config (single or array); config.source.query for fetchScanSignal. |
| **Conditions Evaluated** | Array.isArray(config); config?.source?.query. |
| **Possible Branches** | Single ScanResult; or ScanResult[]. |
| **Output Produced** | ScanResult | ScanResult[]. |
| **Why One Branch Wins** | Array → multi-scan; else single. |
| **Why Others Fail** | Missing source.query throws. |

---

## 18. Layout Store (Engine Core)

| Attribute | Value |
|-----------|--------|
| **Engine Name** | Layout Store (setLayout) |
| **File Path** | `src/engine/core/layout-store.ts` |

| Field | Details |
|-------|---------|
| **Decision Points** | setLayout: type must be in allowedTypes (column, row, grid, stack, page) else keep activeLayout.type; merge partial next with activeLayout. |
| **Inputs Read** | next (experience, type, preset, templateId, mode, regionPolicy); activeLayout. |
| **Conditions Evaluated** | next.type && allowedTypes.has(next.type). |
| **Possible Branches** | Resolved type = next.type or current; rest merged. |
| **Output Produced** | activeLayout updated; listeners notified. |
| **Why One Branch Wins** | Valid type wins; invalid keeps current. |
| **Why Others Fail** | Invalid type not applied. |

---

*End of Decision Trace Contract. All entries derived from code only.*
