# TSX Organism Readiness — Audit

## 1. Pipeline confirmation

TSX screens can dispatch actions via `dispatchOrganAction` and reach the action-registry.

**Flow:**

1. **TSX screen / organism** calls `dispatchOrganAction(name, payload)` from [src/03_Runtime/engine/core/organ-action-bridge.ts](src/03_Runtime/engine/core/organ-action-bridge.ts).
2. **organ-action-bridge** dispatches `CustomEvent("action", { detail: { type: "Action", params: { name, ...payload } } })` on `window`.
3. **behavior-listener** ([src/03_Runtime/engine/core/behavior-listener.ts](src/03_Runtime/engine/core/behavior-listener.ts)) listens for `"action"`, reads `params.name`; if not `state:*`, `navigate`, or a contract verb, it calls `interpretRuntimeVerb({ name: actionName, ...verbParams }, currentState)`.
4. **runtime-verb-interpreter** normalizes the verb and calls `runAction(verb, state)`.
5. **action-runner** ([src/05_Logic/logic/runtime/action-runner.ts](src/05_Logic/logic/runtime/action-runner.ts)) calls `getActionHandler(action.name)` from engine-contract (re-export of action-registry).
6. **action-registry** returns the handler; the handler runs and typically calls `dispatchState("state.update", { key, value })`.
7. **state-store** appends to log, runs `deriveState(log)`, notifies subscribers; components using `subscribeState` / `getState` re-render.

**Conclusion:** The pipeline is complete. Any action name registered in action-registry is reachable from TSX via `dispatchOrganAction`.

---

## 2. Eight structure types × required verbs/state matrix

| Structure  | Create item/column | Update | Delete | Reorder | Move (e.g. card→column) | Step (wizard) | Layout (dashboard) | Required state |
|------------|--------------------|--------|--------|---------|--------------------------|---------------|--------------------|----------------|
| **list**   | EXISTS (structure:addItem) | EXISTS | EXISTS | ADDED (structure:reorderItems) | N/A | N/A | N/A | values.structure.items, itemOrder |
| **board**  | EXISTS (addItem for cards); ADDED (addTreeNode for columns) | EXISTS | EXISTS | ADDED (reorderItems, reorderTreeChildren) | ADDED (structure:moveItem) | N/A | N/A | values.structure.tree, items, itemOrder; categoryId = column |
| **dashboard** | ADDED (dashboard:addWidget) | ADDED (dashboard:setLayout) | ADDED (dashboard:removeWidget) | N/A | N/A | N/A | ADDED (dashboard:setLayout) | dashboardLayout (widget rects) |
| **editor** | N/A | EXISTS (state.update) | N/A | N/A | N/A | N/A | N/A | values.* (draft content) |
| **timeline** | EXISTS (setBlocksForDate/addItem) | EXISTS | CAN BE COMPOSED | ADDED (reorderItems) | ADDED (moveItem for lane) | N/A | N/A | values.structure.blocksByDate, items |
| **detail**  | N/A | EXISTS | EXISTS | N/A | N/A | N/A | N/A | values.structure.items, selection in values.* |
| **wizard** | N/A | N/A | N/A | N/A | N/A | ADDED (wizard:next, wizard:prev, wizard:goTo) | N/A | engine-bridge currentFlow/currentStepIndex or values.wizardStepIndex_* |
| **gallery** | EXISTS (structure:addItem) | EXISTS | EXISTS | ADDED (structure:reorderItems) | N/A | N/A | N/A | values.structure.items, itemOrder |

---

## 3. Exact missing verbs and state (pre-implementation)

**Verbs added by this mission:**

- **structure:** reorderItems, moveItem, addTreeNode, removeTreeNode, reorderTreeChildren  
- **dashboard:** setLayout, addWidget, removeWidget  
- **wizard:** next, prev, goTo  

**State added:**

- **values.structure:** `itemOrder?: string[]` — optional ordered list of item ids for list/board/gallery.  
- **DerivedState:** `dashboardLayout?: Record<string, { widgets: Array<{ id: string; x: number; y: number; w: number; h: number }> }>` — widget rects per screenKey; intents `dashboard.layout` and optionally `dashboard.updateWidget`.  
- **Wizard step:** engine-bridge `currentFlow` / `currentStepIndex` for flows loaded by flow-loader; optional `values.wizardStepIndex_<flowId>` for standalone wizard screens.
