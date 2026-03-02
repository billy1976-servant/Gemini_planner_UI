---
name: Full Organism Readiness Audit
overview: Exhaustive audit of the runtime system to determine whether it can support full organisms across all 8 structure types (list, board, dashboard, editor, timeline, detail, wizard, gallery), covering the global action pipeline, state capability surface, action registry coverage, organ integration, drag/reorder surface, and a final verdict.
todos: []
isProject: false
---

# Full Organism Readiness Audit — All 8 Structure Types

## SECTION 1 — Global Action Pipeline

**Trace: TSX Organ → onAction → dispatchOrganAction → CustomEvent("action") → behavior-listener → interpretRuntimeVerb → action-registry → dispatchState → deriveState → subscriber re-render**


| Step                             | Location                                                                                                                                                                                                           | Status |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| TSX Organ invokes callback       | [tsx-organs/types.ts](src/04_Presentation/components/organs/tsx-organs/types.ts): `OrganProps.onAction?: (actionName: string, payload?: unknown) => void`                                                          | Exists |
| Callback → dispatchOrganAction   | [organ-action-bridge.ts](src/03_Runtime/engine/core/organ-action-bridge.ts): `dispatchOrganAction(name, payload)` → `CustomEvent("action", { detail: { type: "Action", params: { name, ...payload } } })`          | Exists |
| Window "action" listener         | [behavior-listener.ts](src/03_Runtime/engine/core/behavior-listener.ts) L106: `window.addEventListener("action", ...)`; reads `actionName = params.name`                                                           | Exists |
| Branch to interpretRuntimeVerb   | L284–307: not state:*, not navigate, not CONTRACT_VERBS, not visual-proof → lazy `require("@/logic/runtime/runtime-verb-interpreter")` → `interpretRuntimeVerb({ name: actionName, ...verbParams }, currentState)` | Exists |
| interpretRuntimeVerb → runAction | [runtime-verb-interpreter.ts](src/05_Logic/logic/runtime/runtime-verb-interpreter.ts): normalizes verb, calls `runAction(verb, state)`                                                                             | Exists |
| runAction → getActionHandler     | [action-runner.ts](src/05_Logic/logic/runtime/action-runner.ts) L59–66: `getActionHandler(action.name)` from engine-contract (re-export of [action-registry.ts](src/05_Logic/logic/runtime/action-registry.ts))    | Exists |
| Handler → dispatchState          | Handlers (e.g. structure.actions) call `dispatchState("state.update", { key, value })`                                                                                                                             | Exists |
| dispatchState → deriveState      | [state-store.ts](src/03_Runtime/state/state-store.ts) L58–62: `log.push(...)`; `state = deriveState(log)`                                                                                                          | Exists |
| Subscriber re-render             | L73: `listeners.forEach(l => l())`; React uses `subscribeState` / `getState`                                                                                                                                       | Exists |


**Answers**

- **Does this loop fully exist?** Yes. No missing link.
- **Are there missing links?** No. Unregistered action names reach `runAction` → `getActionHandler` returns undefined → [action-runner.ts](src/05_Logic/logic/runtime/action-runner.ts) L61–63 logs "No handler" and returns without throwing.
- **Does it support arbitrary literal action names from blueprint?** Yes. Any string flows through; behavior-listener does not whitelist. Registered names get handlers; unregistered names are no-ops with console error.

---

## SECTION 2 — State Capability Surface

**Domain slices (from [state-resolver.ts](src/03_Runtime/state/state-resolver.ts) `DerivedState`):**

- **journal** — `Record<track, Record<key, string>>`
- **rawCount** — log length
- **currentView** — string (screen/view id)
- **scans** — array (append-only)
- **interactions** — array (append-only)
- **values** — `Record<string, any>` (generic; structure lives as `values.structure`)
- **layoutByScreen** — `Record<screenKey, { section, card, organ }>` (preset IDs per section/card/organ, not widget grid positions)

**Capability matrix**


| Capability                   | Status              | Notes                                                                                                     |
| ---------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| Ordered collections          | SUPPORTED           | `values.structure.items` array                                                                            |
| Nested collections           | SUPPORTED           | `values.structure.tree`                                                                                   |
| Grouped collections          | SUPPORTED           | `values.structure.blocksByDate`                                                                           |
| Selection state              | PARTIALLY SUPPORTED | No first-class slice; use `values.`* (e.g. `values.selectedIds`)                                          |
| Filtering state              | PARTIALLY SUPPORTED | No first-class; use `values.*`                                                                            |
| Pagination state             | PARTIALLY SUPPORTED | No first-class; use `values.*`                                                                            |
| Active/expanded state        | PARTIALLY SUPPORTED | No first-class; use `values.*`                                                                            |
| Step index state             | PARTIALLY SUPPORTED | Flow/engine state in engine-bridge; or `values.*` for wizard step                                         |
| Modal visibility state       | PARTIALLY SUPPORTED | Via navigation or `values.*`                                                                              |
| Widget layout state          | NOT SUPPORTED       | `layoutByScreen` is section/card/organ preset IDs only; no grid x,y,w,h persistence for dashboard widgets |
| Timeline blocks by lane/date | SUPPORTED           | `values.structure.blocksByDate`                                                                           |
| Gallery selection state      | PARTIALLY SUPPORTED | No first-class; use `values.*`                                                                            |


---

## SECTION 3 — Action Registry Coverage

**All registered verbs (by namespace)**

- **logic:** runCalculator, run25x, resolveOnboarding  
- **diagnostics:** capabilityDomain, sensorRead, system7Route, actionGating, resolveProfile, mediaPayloadHook, exportPdf, exportSummary, setCapabilityLevel, inputLogSnapshot, systemSnapshot, systemSignalsReadAll, plannerParserPipeline, plannerFullParseTrace  
- **structure:** addItem, addItems, updateItem, deleteItem, setBlocksForDate, setActivePlanner, cancelDay, addFromText, addJourney, setParserStaging, updateStagingRow, confirmStaging, setTaskFolderTemplate, setTaskTemplateRows, setParserConfig, loadRuleset, ensureTaskTemplateRows, setScheduledSection, parseToStaging  
- **calendar:** today, week, month, setDay, setWeek, setMonth, setDate (aliases: calendar.today, calendar.week, calendar.month, calendar:setDay, etc.)

**Per-structure-type coverage**


| Structure     | Verb / capability          | Status                                                                    |
| ------------- | -------------------------- | ------------------------------------------------------------------------- |
| **LIST**      | create item                | EXISTS (structure:addItem)                                                |
|               | update item                | EXISTS (structure:updateItem)                                             |
|               | delete item                | EXISTS (structure:deleteItem)                                             |
|               | reorder item               | **MISSING**                                                               |
|               | filter items               | CAN BE COMPOSED (state.update)                                            |
|               | paginate items             | CAN BE COMPOSED (state.update)                                            |
|               | batch select               | CAN BE COMPOSED (state.update)                                            |
| **BOARD**     | create column              | **MISSING**                                                               |
|               | delete column              | **MISSING**                                                               |
|               | reorder column             | **MISSING**                                                               |
|               | create card                | EXISTS (structure:addItem)                                                |
|               | update card                | EXISTS (structure:updateItem)                                             |
|               | delete card                | EXISTS (structure:deleteItem)                                             |
|               | move card between columns  | **MISSING** (needs columnId + update or dedicated verb)                   |
|               | reorder card within column | **MISSING** (no reorder in structure)                                     |
| **DASHBOARD** | add widget                 | **MISSING**                                                               |
|               | remove widget              | **MISSING**                                                               |
|               | resize widget              | **MISSING**                                                               |
|               | move widget                | **MISSING**                                                               |
|               | persist layout             | **MISSING** (layout.override is preset-only; no grid layout state)        |
| **EDITOR**    | update content             | CAN BE COMPOSED (state.update)                                            |
|               | save draft                 | CAN BE COMPOSED                                                           |
|               | publish                    | CAN BE COMPOSED or **MISSING** (domain-specific)                          |
|               | undo/redo                  | **MISSING**                                                               |
|               | block-level operations     | **MISSING**                                                               |
| **TIMELINE**  | create block               | EXISTS (structure:setBlocksForDate / addItem)                             |
|               | delete block               | CAN BE COMPOSED (setBlocksForDate with filtered blocks)                   |
|               | move block across lanes    | **MISSING** (no lane-move verb)                                           |
|               | reorder within lane        | CAN BE COMPOSED (if block order in payload)                               |
|               | change date range          | CAN BE COMPOSED (calendar:* verbs)                                        |
| **DETAIL**    | select entity              | CAN BE COMPOSED (state.update)                                            |
|               | update entity              | EXISTS (structure:updateItem / state.update)                              |
|               | delete entity              | EXISTS (structure:deleteItem)                                             |
|               | navigate entity            | CAN BE COMPOSED (navigate)                                                |
| **WIZARD**    | next step                  | **MISSING** (flow in flow-resolver/engine-bridge, not in action-registry) |
|               | previous step              | **MISSING**                                                               |
|               | jump to step               | **MISSING**                                                               |
|               | validation                 | CAN BE COMPOSED or app-specific                                           |
|               | completion                 | CAN BE COMPOSED                                                           |
| **GALLERY**   | add item                   | EXISTS (structure:addItem)                                                |
|               | delete item                | EXISTS (structure:deleteItem)                                             |
|               | reorder item               | **MISSING**                                                               |
|               | select item                | CAN BE COMPOSED (state.update)                                            |
|               | open lightbox              | CAN BE COMPOSED (state.update / navigate)                                 |


---

## SECTION 4 — Organ Integration

- **Can all 21 TSX organs receive onAction and emit literal action names?** Yes. [types.ts](src/04_Presentation/components/organs/tsx-organs/types.ts) defines `OrganProps` with `onAction?: (actionName: string, payload?: unknown) => void`; all 21 organs accept `OrganProps`; ToolbarOrgan, ModalOrgan, LightboxOrgan explicitly destructure `onAction`; others receive it via props (slots/molecules can call it).
- **Structural coupling preventing reuse?** None. Organs are presentational (slots + optional onAction).
- **Dependence on missing state contracts?** No. State is generic (`values` + `layoutByScreen`); no organ-specific state contracts required.

---

## SECTION 5 — Drag + Reorder Surface

- **Does drag exist in behavior-engine?** Yes. [behavior-engine.ts](src/03_Runtime/behavior/behavior-engine.ts): `interact.dragX`, `interact.dragY`, `interact.dragXY` — they call `UIState.set(...)` and `dispatchState("interaction.record", { type: "drag", payload: { ...args, direction } })`.
- **Does drag mutate structure?** No. No handler updates `values.structure` or reorders items from these handlers.
- **Is there a reorder mechanism?** No. [structure.actions.ts](src/05_Logic/logic/actions/structure.actions.ts) has no `structure:reorderItem` or `structure:reorderItems`; no move-card or reorder-column verbs.
- **Minimal mutation verb required:** e.g. `structure:reorderItems` (list: fromIndex, toIndex or itemIds order) and/or `structure:moveCard` (cardId, toColumnId) for board; optionally a generic `structure:reorder` payload for other structures.

---

## SECTION 6 — Final Verdict

**Verdict: C) NOT READY**

**Consolidated list of missing runtime capabilities**

1. **Verbs**
  - **List:** `structure:reorderItems` (or equivalent reorder-by-index/order).
  - **Board:** `board:createColumn`, `board:deleteColumn`, `board:reorderColumns`, `board:moveCard` (cardId, toColumnId), `board:reorderCardInColumn` (or equivalent).
  - **Dashboard:** `dashboard:addWidget`, `dashboard:removeWidget`, `dashboard:resizeWidget`, `dashboard:moveWidget`, `dashboard:persistLayout` (or equivalent); plus state support for widget grid layout (see below).
  - **Editor:** `editor:undo`, `editor:redo`; optional `editor:blockOperation` (or equivalent) if block-level ops are required.
  - **Timeline:** `timeline:moveBlockToLane` (or equivalent; or composable via structure with lane id).
  - **Wizard:** `wizard:nextStep`, `wizard:previousStep`, `wizard:jumpToStep` (or equivalent) in action-registry, wiring flow/engine step state to the same pipeline).
  - **Gallery:** `structure:reorderItems` (or gallery-specific reorder) for gallery items.
2. **State**
  - **Widget layout state:** First-class (or agreed `values.`*) storage for dashboard widget grid positions/sizes (x, y, w, h or equivalent) and persistence via `layout.override` or a dedicated intent; current `layoutByScreen` only stores section/card/organ preset IDs, not grid layout.
3. **Drag that mutates structure**
  - **Reorder/move from drag:** Behavior-engine drag only records interaction; no verb or handler that updates structure from drag. Either: (a) a reorder/move verb invoked by the UI when drag ends, or (b) a dedicated drag-handler path that calls existing or new reorder/move verbs so that drag mutates structure.

No redesign, no new architecture, no theory—only the above missing capabilities.