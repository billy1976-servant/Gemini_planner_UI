# RUNTIME_FALLBACKS.generated.md

Runtime fallbacks: layout ID not found, missing registry component, missing behavior handler, missing state key. Code-derived only.

---

## Layout ID not found

| Location | Condition | Fallback | File |
|----------|-----------|----------|------|
| getPageLayoutId | layout null or template+slot not in templates | Returns null | src/layout/page/page-layout-resolver.ts |
| getPageLayoutById | id not in pageLayouts | Returns null | src/layout/page/page-layout-resolver.ts |
| resolveLayout | !layoutId or !pageDef | Returns null | src/layout/resolver/layout-resolver.ts |
| Section compound | layoutDef == null (resolveLayout(layout) null) | Renders &lt;div data-section-id={id}&gt;{children}&lt;/div&gt; (no LayoutMoleculeRenderer) | src/compounds/ui/12-molecules/section.compound.tsx |
| applyProfileToNode (section layout id) | No override, no node.layout, no template default | next.layout undefined; Section receives layout undefined → resolveLayout(undefined) → null → div fallback | src/engine/core/json-renderer.tsx, src/layout/page/page-layout-resolver.ts getDefaultSectionLayoutId (templates[templateId]["defaultLayout"]) |

---

## Missing registry component

| Location | Condition | Fallback | File |
|----------|-----------|----------|------|
| renderNode | (Registry as any)[resolvedNode.type] falsy | Red div: "Missing registry entry: &lt;type&gt;" (MaybeDebugWrapper) | src/engine/core/json-renderer.tsx |
| renderNode | Component from Registry but !isValidReactComponentType(Component) | console.error("INVALID REGISTRY COMPONENT TYPE", type); return null | src/engine/core/json-renderer.tsx |

---

## Missing behavior handler

| Location | Condition | Fallback | File |
|----------|-----------|----------|------|
| behavior-listener (action) | !actionName | console.warn("[action] Missing action name"); return | src/engine/core/behavior-listener.ts |
| behavior-listener (state:*) | valueFrom "input" and resolvedValue === undefined | console.error("INPUT PIPELINE BROKEN", ...); still dispatches state-mutate for legacy | src/engine/core/behavior-listener.ts |
| behavior-listener (navigate) | !params.to | console.warn("[action:navigate] Missing 'to'"); return | src/engine/core/behavior-listener.ts |
| behavior-listener (contract verb) | runBehavior throws | console.warn("[behavior-runner] failed", { domain, actionName, err }); return | src/engine/core/behavior-listener.ts |
| behavior-listener (runtime verb) | interpretRuntimeVerb runs (no explicit "missing handler" branch) | After try/finally: return. Unhandled action: console.warn("[action] Unhandled action:", actionName) only when no state:*, no navigate, no contract verb, and (runtimeInFlight or !getState?) so runtime path not taken | src/engine/core/behavior-listener.ts |
| behavior-runner | fireNavigation when no ctx.setScreen/navigate/router.push | console.warn("Navigation target resolved but no ctx navigation hook found:", target) | src/behavior/behavior-runner.ts |
| runBehavior | Handler from fromAction/fromInteraction/fromNavigation; if handler not found on BehaviorEngine | BehaviorEngine[handlerName] may be undefined; call (ctx, args) can throw → caught in listener | src/behavior/behavior-runner.ts |

---

## Missing state key

| Location | Condition | Fallback | File |
|----------|-----------|----------|------|
| deriveState | intent not state:currentView, journal.*, state.update, scan.result/interpreted, interaction.record | No branch; intent ignored (no derived key). | src/state/state-resolver.ts |
| shouldRenderNode | state[key] === undefined and defaultState[key] === undefined | stateValue = undefined; render if equals === undefined (loose). | src/engine/core/json-renderer.tsx |
| Field value | stateSnapshot.values[fk] undefined and stateSnapshot[fk] undefined | nextValue undefined; props.params.field.value not set (uncontrolled or previous value). | src/engine/core/json-renderer.tsx |
| JournalHistory | getState()?.journal?.[track]?.entry missing | entry undefined; entries = [] or [entry] if string. | src/engine/core/json-renderer.tsx |
| journal.add (valueFrom "input") | getState()?.values?.[fk] undefined | resolvedValue undefined; INPUT PIPELINE BROKEN logged; state-mutate still fired. | src/engine/core/behavior-listener.ts |
| ensureInitialView | !state?.currentView | dispatchState("state:currentView", { value: defaultView }) | src/state/state-store.ts |

---

## Other fallbacks

| Case | Fallback | File |
|------|----------|------|
| loadOrganVariant(organId, variantId) unknown organ or variant | Returns null | src/organs/organ-registry.ts |
| expandOrgans (organ node, variant null) | Pushes original node (organ not replaced) | src/organs/resolve-organs.ts |
| resolveSlotNode (data path missing or not array of nodes) | Returns [] | src/logic/bridges/skinBindings.apply.ts |
| JsonSkinEngine screen?.children missing | return null | src/logic/engines/json-skin.engine.tsx |
| JsonSkinEngine selectActiveChildren: no match, conditional sections exist | Render defaultSections | src/logic/engines/json-skin.engine.tsx |
| resolveInternalLayoutId | Unknown organ: getOrganLayoutProfile(organId) null → return null. Invalid layoutId: use profile.defaultInternalLayoutId. | src/layout-organ/organ-layout-resolver.ts |
| getDefaultSectionLayoutId(templateId) no template or no defaultLayout | return undefined | src/layout/page/page-layout-resolver.ts |
