# Authority & Precedence Map (WHO is in control)

**Purpose:** Expose override, explicit, suggestion, and default authority layers across the system.  
**Source:** Code and existing `STATE_AND_OVERRIDE_ORCHESTRATION.md`; tables only.

---

## Layout domain

| Item | Influence sources | Precedence order | Conflict resolution rule | Where implemented (file + function) |
|------|-------------------|------------------|---------------------------|-------------------------------------|
| Section layout id | User override (OrganPanel); explicit node.layout; template default | 1. User override → 2. Explicit node.layout → 3. Template default → 4. undefined | First defined wins; no silent fallback | `src/engine/core/json-renderer.tsx` — `applyProfileToNode` (layoutId = overrideId \|\| existingLayoutId \|\| templateDefaultLayoutId \|\| undefined) |
| Section override storage | User only (UI) | N/A | Only user action writes | `src/state/section-layout-preset-store.ts` — `setSectionLayoutPresetOverride`; called from app page / OrganPanel |
| Card layout preset | User override (OrganPanel) | Same screen/section key | Override wins for that section | `src/state/section-layout-preset-store.ts` — `setCardLayoutPresetOverride`; applied in `applyProfileToNode` for card children via `cardLayoutPresetOverrides[parentSectionKey]` |
| Organ internal layout | User override (OrganPanel) | Same screen/section key | Override wins | `src/state/organ-internal-layout-store.ts` — `setOrganInternalLayoutOverride`; passed into `applyProfileToNode` as `organInternalLayoutOverrides` |
| Template default layout | Template JSON | Used when no override and no explicit node.layout | templates[templateId]["defaultLayout"] | `src/layout/page/page-layout-resolver.ts` — `getDefaultSectionLayoutId`; `src/engine/core/json-renderer.tsx` — profile.defaultSectionLayoutId or getDefaultSectionLayoutId(templateId) |
| Logic suggestion | Decision Engine / contextual logic (future) | Not yet applied in resolver | Reserved slot (3) in precedence; logic never overwrites 1 or 2 | Documented in STATE_AND_OVERRIDE_ORCHESTRATION; not wired in applyProfileToNode yet |

---

## State domain

| Item | Influence sources | Precedence order | Conflict resolution rule | Where implemented (file + function) |
|------|-------------------|------------------|---------------------------|-------------------------------------|
| currentView | JSON default state on screen load; user/action (state:currentView) | Screen load applies json.state.currentView; then event log wins | Last event wins | `src/state/state-resolver.ts` — `deriveState` (intent "state:currentView"); `src/engine/core/screen-loader.ts` — apply default on load; `src/state/state-store.ts` — `ensureInitialView` if empty |
| Journal | journal.set / journal.add events | Append/overwrite by track+key | Last event per track+key wins | `src/state/state-resolver.ts` — `deriveState` |
| values (generic key/value) | state.update events; input pipeline (fieldKey → value) | Event log order | Last event per key wins | `src/state/state-resolver.ts` — `deriveState` (intent "state.update"); `src/engine/core/behavior-listener.ts` — dispatchState("state.update", { key, value }) for valueFrom "input" |
| scans / interactions | scan.result, scan.interpreted, interaction.record | Append-only | No conflict; append | `src/state/state-resolver.ts` — `deriveState` |
| State persistence | Event log | N/A | Full log persisted (except state.update excluded from persist in state-store) | `src/state/state-store.ts` — persist(); rehydrate() |

---

## Behavior domain

| Item | Influence sources | Precedence order | Conflict resolution rule | Where implemented (file + function) |
|------|-------------------|------------------|---------------------------|-------------------------------------|
| Action handler | Contract verb (6x7 + interactions + navigations); runtime verb | 1. fromAction (behavior-actions-6x7) → 2. fromInteraction (behavior-interactions) → 3. fromNavigation (verb+variant) | First non-null map wins | `src/behavior/behavior-runner.ts` — `runBehavior` |
| Nav variant | Explicit args (variant, navVariant, subverb, mode, kind, type, targetType); inferred from args (screenId, modalId, flowId, panelId, sheetId, path, url, one/all/root) | Explicit string first; else inferred | Explicit wins; else infer from presence of known params | `src/behavior/behavior-runner.ts` — `resolveNavVariant` |
| Behavior execution | BehaviorEngine[handlerName]; ctx (setScreen, navigate, openModal, etc.) | Handler must exist on BehaviorEngine | No handler → warn and return | `src/behavior/behavior-runner.ts` — runBehavior; `src/behavior/behavior-engine.ts` — handler implementations |
| Action routing (listener) | state:*, navigate, contract verbs, runtime verb | state: > navigate > contract verb set > runtime | First matching branch | `src/engine/core/behavior-listener.ts` — action handler |

---

## Flow / logic domain

| Item | Influence sources | Precedence order | Conflict resolution rule | Where implemented (file + function) |
|------|-------------------|------------------|---------------------------|-------------------------------------|
| Flow source | Override flow map; flow cache; screen-specific fetch; FLOWS registry | 1. overrideFlowMap[flowId] → 2. flowCache[flowId] → 3. screen-specific API → 4. FLOWS[flowId] | First found wins; else throw | `src/logic/flows/flow-loader.ts` — loadFlow |
| Flow transformation | effectiveEngineId (engineId \|\| currentEngineId); applyEngine | Override flow can be engine-transformed; on failure use base | try applyEngine; catch → base flow | `src/logic/flows/flow-loader.ts` |
| View (flow step) | interactions; flow.steps.requires | No interactions → flow.start; else first step where !completed.has(requires) → step.view; else flow.complete | Deterministic walk | `src/logic/runtime/flow-resolver.ts` — resolveView |
| Landing page / current view | state.currentView; resolveLandingPage().flow | state.currentView if set; else flow from landing resolver | Explicit view wins | `src/logic/runtime/landing-page-resolver.ts` — getCurrentView |

---

## Hardcoded / explicit fallbacks (no override layer)

| Location | Condition | Fallback | File |
|----------|-----------|----------|------|
| getPageLayoutById | id not in pageLayouts | null | `src/layout/page/page-layout-resolver.ts` |
| resolveLayout | !layoutId or !pageDef | null | `src/layout/resolver/layout-resolver.ts` |
| Section compound | layoutDef == null | Render div wrapper (no LayoutMoleculeRenderer) | Section compound (see RUNTIME_FALLBACKS.generated.md) |
| ensureInitialView | !state?.currentView | dispatchState("state:currentView", { value: defaultView }) | `src/state/state-store.ts` |
| getDefaultSectionLayoutId | No template or no defaultLayout | undefined | `src/layout/page/page-layout-resolver.ts` |

---

*End of Authority & Precedence Map. All rows reference real files and functions.*
