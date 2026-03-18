# Engine Decision Trace Map

**Purpose:** Expose actual runtime branching for each engine so planning can be deterministic and exhaustive.  
**Source:** Code-only; reflects runtime behavior, not plans.

---

## Engine: Layout Resolver (unified)

**Entry:** `src/layout/resolver/layout-resolver.ts` — `resolveLayout(layout, context?)`

**Decision Flow:**
1. **Condition:** `layoutId = getPageLayoutId(layout, context)`.
2. **Branch when true (layoutId truthy):** Fetch `pageDef = getPageLayoutById(layoutId)`, `componentDef = resolveComponentLayout(layoutId)`; if `!pageDef` → return null; else return `{ ...pageDef, moleculeLayout: componentDef ?? undefined }`.
3. **Branch when false (no layoutId):** Log decision "getPageLayoutId returned null or missing pageDef", return null.
4. **Fallback path:** If pageDef is null after layoutId exists, log "getPageLayoutById returned null", return null.
5. **Output:** `LayoutDefinition | null` (merged page + component layout, or null).

**Possible Outputs:**
- Layout definition (containerWidth, split, backgroundVariant, moleculeLayout) keyed by layoutId.
- `null` when layout ref cannot be resolved to an ID or when page definition is missing.

**Fallback Order:**
1. Return merged layout when layoutId and pageDef exist.
2. Return null when layoutId is null/undefined.
3. Return null when pageDef is null for a valid layoutId.

---

## Engine: Page Layout Resolver (layout ID and default)

**Entry:** `src/layout/page/page-layout-resolver.ts` — `getPageLayoutId(layout, context?)`, `getPageLayoutById(id)`, `getDefaultSectionLayoutId(templateId)`

**Decision Flow (getPageLayoutId):**
1. **Condition:** `layout == null`.
2. **Branch when true:** If `context?.templateId` and `context?.sectionRole` → lookup `templates[context.templateId][context.sectionRole]`; if templateMap missing → null; else return trimmed layoutId or null.
3. **Branch when false:** If `typeof layout === "string"` → return `layout.trim()` or null; if object with `template` and `slot` → lookup `templates[template][slot]`, return trimmed or null; else return null.
4. **Fallback path:** No templateMap or missing slot → null.
5. **Output:** `string | null` (layout ID).

**Decision Flow (getPageLayoutById):**
- Lookup `pageLayouts[normalized] ?? pageLayouts[id]`; return def if object, else null.

**Decision Flow (getDefaultSectionLayoutId):**
- If `templateId` and `templates[templateId]` exist, return `templates[templateId]["defaultLayout"]` trimmed or undefined; else undefined.

**Possible Outputs:**
- Layout ID string; PageLayoutDefinition or null; default layout ID or undefined.

**Fallback Order:**
1. Explicit string layout → trim.
2. Template+slot → templates lookup.
3. Context templateId+sectionRole → templates lookup.
4. getDefaultSectionLayoutId: template default or undefined (no hard fallback).

---

## Engine: Component Layout Resolver

**Entry:** `src/layout/component/component-layout-resolver.ts` — `resolveComponentLayout(layoutId)`

**Decision Flow:**
1. **Condition:** `layoutId == null` or not string or empty after trim.
2. **Branch when true:** Return null.
3. **Branch when false:** `normalized = layoutId.toLowerCase()`; return `componentLayouts[normalized] ?? componentLayouts[layoutId]` if object, else null.
4. **Fallback path:** None; null in for invalid input.
5. **Output:** `ComponentLayoutDefinition | null`.

**Possible Outputs:**
- MoleculeLayout-shaped definition (type, preset, params) or null.

**Fallback Order:**
1. Normalized key lookup then raw id lookup.
2. Null when not found or invalid input.

---

## Engine: Profile / Section Layout (applyProfileToNode)

**Entry:** `src/engine/core/json-renderer.tsx` — `applyProfileToNode(node, profile, sectionLayoutPresetOverrides, cardLayoutPresetOverrides, parentSectionKey, organInternalLayoutOverrides)`

**Decision Flow (section layout ID):**
1. **Condition:** `node.type === "section"` and `layoutMode` (profile.mode) not "custom".
2. **Branch when true:** Compute `overrideId` from sectionLayoutPresetOverrides[sectionKey], `existingLayoutId` from node.layout, `templateDefaultLayoutId` from profile.defaultSectionLayoutId or getDefaultSectionLayoutId(templateId). Set `next.layout = overrideId || existingLayoutId || templateDefaultLayoutId || undefined`. Call evaluateCompatibility (dev log). Recurse to children with sectionKey.
3. **Branch when false (not section):** If card and parentSectionKey and cardLayoutPresetOverrides[parentSectionKey], apply card preset (mediaPosition, contentAlign) to next.params; recurse with parentSectionKey.
4. **Fallback path:** No override, no explicit, no template default → layoutId undefined.
5. **Output:** Node copy with next.layout, _effectiveLayoutPreset, params stripped of layout keys; card children get preset params.

**Possible Outputs:**
- Section layout ID (override / explicit / template default / undefined).
- Card preset params (mediaPosition, contentAlign) for card children under section.

**Fallback Order:**
1. overrideId (section override store).
2. existingLayoutId (node.layout).
3. templateDefaultLayoutId (profile or getDefaultSectionLayoutId).
4. undefined.

---

## Engine: Organ Internal Layout

**Entry (variant selection):** `src/organs/resolve-organs.ts` — `expandOrgans(nodes, loadOrganVariant, overrides)`  
**Entry (resolution + render):** `src/layout-organ/organ-layout-resolver.ts` — `resolveInternalLayoutId(organId, layoutId)`; `src/compounds/ui/12-molecules/section.compound.tsx` — organ branch.

**Decision Flow (expandOrgans):**
1. **Condition:** Node is organ (type === "organ").
2. **Branch when true:** variantId = overrides[instanceKey] ?? overrides[organId] ?? node.variant ?? "default". loadOrganVariant(organId, variantId); merge variant with node; set merged.params.internalLayoutId = variantId; recurse children.
3. **Branch when false:** Clone node; recurse children; push clone.
4. **Fallback path:** loadOrganVariant returns null → push original node.
5. **Output:** Expanded tree with organ nodes replaced by variant; internalLayoutId on params.

**Decision Flow (resolveInternalLayoutId):**
1. **Condition:** profile = getOrganLayoutProfile(organId); requested = layoutId trimmed.
2. **Branch when true (profile exists, requested valid):** Return matching id from internalLayoutIds or profile.defaultInternalLayoutId.
3. **Branch when false (no profile):** Return null.
4. **Fallback path:** Invalid or missing requested → return profile.defaultInternalLayoutId.
5. **Output:** Internal layout ID string or null.

**Decision Flow (SectionCompound organ branch):**
1. **Condition:** role in getOrganLayoutOrganIds() (isOrgan).
2. **Branch when true:** internalLayoutId = resolveInternalLayoutId(role, params.internalLayoutId); loadOrganVariant(role, internalLayoutId ?? "default"); effectiveDef = { ...layoutDef, moleculeLayout: variantParams?.moleculeLayout ?? layoutDef.moleculeLayout }.
3. **Branch when false:** effectiveDef = layoutDef (from resolveLayout only).
4. **Fallback path:** layoutDef == null → render div wrapper (no LayoutMoleculeRenderer).
5. **Output:** LayoutDefinition for LayoutMoleculeRenderer or div fallback.

**Possible Outputs:**
- Variant ID per organ (override → explicit node.variant → "default").
- Resolved internal layout ID (valid requested or organ default).
- Merged layout def with organ moleculeLayout when section is organ.

**Fallback Order:**
1. Override by instanceKey then organId.
2. node.variant then "default".
3. resolveInternalLayoutId: valid requested id else profile.defaultInternalLayoutId.
4. SectionCompound: null layoutDef → div wrapper.

---

## Engine: Behavior Runner

**Entry:** `src/behavior/behavior-runner.ts` — `runBehavior(domain, action, ctx, args)`

**Decision Flow:**
1. **Condition:** Resolve handler: fromAction = resolveBehaviorVerb(domain, action); fromInteraction = interactions[action]; fromNavigation = navigations[action]?.[resolveNavVariant(action, args)].
2. **Branch when true (fromAction):** Run fromAction.handler(ctx, args); return.
3. **Branch when false:** If fromInteraction → run fromInteraction.handler; else if fromNavigation → resolve target, fireNavigation(ctx, target); else console.warn no handler.
4. **Fallback path:** resolveNavVariant: explicit variant from args (variant, navVariant, subverb, mode, kind, type, targetType); else infer from action (e.g. go → screen/modal/flow by param presence; back → one/all/root by args).
5. **Output:** Side effects only (ctx.setScreen, ctx.navigate, router.push, handler run); no return value.

**Possible Outputs:**
- Navigation (setScreen, navigate, router.push).
- Interaction/media handler execution.
- No handler → warn.

**Fallback Order:**
1. fromAction (behavior-actions-6x7).
2. fromInteraction (behavior-interactions).
3. fromNavigation (verb + variant).
4. No handler → warn.

---

## Engine: Runtime Verb Interpreter (logic/runtime)

**Entry:** `src/logic/runtime/runtime-verb-interpreter.ts` — `interpretRuntimeVerb(verb, state)`

**Decision Flow:**
1. **Condition:** verb falsy.
2. **Branch when true:** Return state unchanged.
3. **Branch when false:** If verb.type === "Action" && verb.params → runAction({ name: verb.params.name, ...verb.params }, state). If typeof verb.name === "string" → runAction(verb, state). Else warn unrecognized, return state.
4. **Fallback path:** runAction delegates to getActionHandler(action.name); handler(action, state); no handler → console.error, return state.
5. **Output:** state (returned; handlers may call dispatchState/navigate internally).

**Possible Outputs:**
- State mutations via action handlers (e.g. run-calculator, resolve-onboarding dispatch state.update).
- No direct return mutation; handlers perform side effects.

**Fallback Order:**
1. Normalized Action-style verb → runAction.
2. Direct verb with name → runAction.
3. Unrecognized → warn, return state.

---

## Engine: Runtime Verb Interpreter (logic/runtime — state/navigate bridge)

**Entry:** `src/logic/runtime/runtime-verb-interpreter.ts` — `handleAction(detail)` (used when that layer is wired)

**Decision Flow:**
1. **Condition:** params.name starts with "state:".
2. **Branch when true:** intent = params.name.replace("state:", ""); dispatchState(intent, { value, ...rest }); return.
3. **Branch when false:** If params.name === "navigate" and to → navigate(to); return. Else other handlers.
4. **Fallback path:** N/A.
5. **Output:** dispatchState or navigate calls.

**Possible Outputs:**
- state:currentView, state.update, etc. via dispatchState.
- navigate(to).

**Fallback Order:**
- state:* → dispatchState; navigate → navigate(to).

---

## Engine: State Resolver (derivation)

**Entry:** `src/state/state-resolver.ts` — `deriveState(log)`

**Decision Flow:**
1. **Condition:** For each evt in log, intent === evt.intent.
2. **Branches:** intent "state:currentView" → derived.currentView = payload.value. "journal.set" | "journal.add" → derived.journal[track][key] = value. "state.update" → derived.values[key] = payload.value. "scan.result" | "scan.interpreted" → derived.scans.push(payload). "interaction.record" → derived.interactions.push(payload).
3. **Fallback path:** Unknown intent → no branch; key unchanged.
4. **Output:** DerivedState (journal, rawCount, currentView, scans, interactions, values).

**Possible Outputs:**
- currentView string; journal by track/key; values by key; scans array; interactions array.

**Fallback Order:**
- Last event per key/track wins (replay in order).

---

## Engine: Screen Loader

**Entry:** `src/engine/core/screen-loader.ts` — `loadScreen(path)`

**Decision Flow:**
1. **Condition:** path empty → throw. path no "/" and not "tsx:" → throw (IDs forbidden).
2. **Branch when path.startsWith("tsx:"):** Return { __type: "tsx-screen", path: tsxPath } (no fetch).
3. **Branch when false (JSON):** Normalize path; fetch `/api/screens/${normalized}?t=...` (no-store). If !res.ok → throw. json = await res.json(). If json?.state?.currentView → dispatchState("state:currentView", { value: json.state.currentView }). Return json.
4. **Fallback path:** No default state in JSON → no dispatch; still return json.
5. **Output:** TSX descriptor or JSON tree; optional state init.

**Possible Outputs:**
- TSX screen descriptor.
- JSON screen + optional currentView state injection.

**Fallback Order:**
1. TSX path → return descriptor.
2. JSON fetch → apply default state if present, return json.
3. No default state → return json only.

---

## Engine: Behavior Listener (action routing)

**Entry:** `src/engine/core/behavior-listener.ts` — `installBehaviorListener(navigate)`; window "action" listener.

**Decision Flow:**
1. **Condition:** actionName = params.name; missing → warn, return.
2. **Branch actionName.startsWith("state:"):** Resolve value (valueFrom "input" → getState().values[fk] or inputByFieldKey); dispatchState("state:currentView" | "state.update" | "journal.add"); return.
3. **Branch actionName === "navigate":** navigate(params.to); return.
4. **Branch contract verbs (tap, double, long, drag, scroll, swipe, go, back, open, close, route, crop, filter, frame, layout, motion, overlay):** runBehavior(domain, actionName, { navigate }, params); return.
5. **Branch actionName === "visual-proof":** DOM proof; return.
6. **Fallback:** interpretRuntimeVerb({ name: actionName, ...params }, getState()) (re-entrancy guarded); else warn unhandled.
7. **Output:** dispatchState, navigate, runBehavior, or interpretRuntimeVerb.

**Possible Outputs:**
- state:currentView, state.update, journal.add.
- navigate(to).
- runBehavior for contract verbs.
- interpretRuntimeVerb for other actions.

**Fallback Order:**
1. state:* → dispatchState.
2. navigate → navigate(to).
3. Contract verb set → runBehavior.
4. visual-proof → DOM.
5. Else → interpretRuntimeVerb (logic/runtime).
6. No match → warn unhandled.

---

## Engine: Layout Store (profile / template UI)

**Entry:** `src/engine/core/layout-store.ts` — `setLayout(next)`

**Decision Flow:**
1. **Condition:** next contains experience, type, preset, templateId, mode, regionPolicy.
2. **Branch:** Merge next into activeLayout; validate type in allowedTypes; notify listeners.
3. **Output:** Updated activeLayout; used by getLayout() / subscribeLayout for templateId, mode, experience (profile source for applyProfileToNode).

**Possible Outputs:**
- experience, templateId, mode, type, preset, regionPolicy (drives getTemplateProfile, applyProfileToNode profile).

**Fallback Order:**
- Partial merge; type validated against allowed set.

---

This file exposes runtime decision logic that is not visible in static architecture diagrams. Each engine’s branches, fallbacks, and outputs are derived from actual code paths so that planning and debugging can be deterministic and exhaustive.
