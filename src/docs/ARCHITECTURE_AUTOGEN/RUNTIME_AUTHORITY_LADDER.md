# Runtime Authority & Precedence Ladder

**Purpose:** Document which source of truth wins when conflicts occur. Rules enforced by runtime code only (no future plans).

---

## Section Layout Authority

1. **Node.layout explicit** — `node.layout` (string) from screen JSON. Explicit JSON never overridden by template or profile.
2. **User override store** — `sectionLayoutPresetOverrides[sectionKey]` (from section-layout-preset-store; OrganPanel / page.tsx).
3. **Template role-based** — when layout ref missing and context has `templateId` + `sectionRole`; `getPageLayoutId(null, { templateId, sectionRole })` from templates.json slot map.
4. **Template default** — `profile.defaultSectionLayoutId` or `getDefaultSectionLayoutId(templateId)` (templates.json or template-profiles).
5. **Hard fallback** — `undefined` (no layout ID; Section compound may render div wrapper).

*Implemented in:* `src/engine/core/json-renderer.tsx` — `applyProfileToNode` (layoutId = existingLayoutId || overrideId || templateRoleLayoutId || templateDefaultLayoutId || undefined). See `LAYOUT_SIGNAL_PRIORITY.generated.md` for full hierarchy.

---

## Card Preset Precedence

1. **User override** — `cardLayoutPresetOverrides[parentSectionKey]` (section-layout-preset-store; OrganPanel).
2. **No explicit node-level card layout** in applyProfileToNode — card preset is override-only for mediaPosition/contentAlign on card children.

*Implemented in:* `src/engine/core/json-renderer.tsx` — `applyProfileToNode` (isCard && parentSectionKey && cardLayoutPresetOverrides[parentSectionKey]); `src/state/section-layout-preset-store.ts` — `setCardLayoutPresetOverride`.

---

## Organ Internal Layout Precedence

1. **User override** — `organInternalLayoutOverrides[sectionKey]` passed into expandOrgansInDocument as overrides; keyed by instanceKey (node.id) or organId.
2. **Explicit node.variant** — on organ node from JSON.
3. **Default** — `"default"` variant when override and explicit absent.
4. **Resolution** — `resolveInternalLayoutId(organId, layoutId)`: valid requested ID else profile.defaultInternalLayoutId from organ-layout-profiles.json.

*Implemented in:* `src/organs/resolve-organs.ts` — variantId = overrides[instanceKey] ?? overrides[organId] ?? n.variant ?? "default"; `src/layout-organ/organ-layout-resolver.ts` — resolveInternalLayoutId; `src/state/organ-internal-layout-store.ts` — setOrganInternalLayoutOverride.

---

## Profile vs Runtime Overrides (Layout)

- **Profile** = templateId, mode, defaultSectionLayoutId (from getTemplateProfile / getExperienceProfile; layout-store provides templateId/mode/experience).
- **Runtime overrides** = section/card/organ override stores (per screen, per section key).
- **Authority:** Runtime overrides win over profile defaults. Profile is used only when no override and no explicit node.layout (section) or no override (card/organ variant).

*Implemented in:* applyProfileToNode reads overrides first; profile used for templateDefaultLayoutId and mode (template vs custom).

---

## State vs Screen JSON

- **Screen JSON** may declare `state.currentView`; applied on load by screen-loader via dispatchState("state:currentView", { value }).
- **State store** holds event log; deriveState replays it. Last event wins for currentView, values[key], journal[track][key].
- **Authority:** After load, all state changes go through dispatchState. Screen JSON only sets initial currentView when loadScreen runs; subsequent state:currentView / state.update / journal.add events override.

*Implemented in:* `src/engine/core/screen-loader.ts` (apply default on load); `src/state/state-resolver.ts` (deriveState); `src/state/state-store.ts` (dispatchState, persist).

---

## Behavior vs Direct State Updates

- **Behavior path:** User action → "action" event → behavior-listener → state:* → dispatchState; or contract verb → runBehavior; or other → interpretRuntimeVerb → action-runner → handler (handlers may call dispatchState).
- **Direct state updates:** dispatchState called from screen-loader (default state), ensureInitialView (defaultView), state-mutate bridge, input-change (state.update), action handlers (e.g. run-calculator, resolve-onboarding).
- **Authority:** No conflict; both paths push to the same event log. Last dispatch wins per intent/key. Behavior is one of the triggers; direct updates (e.g. screen load, ensureInitialView) are others.

*Implemented in:* `src/engine/core/behavior-listener.ts`; `src/state/state-store.ts` (dispatchState, installStateMutateBridge, ensureInitialView).

---

## Layout Resolver Output (Page + Component)

- **resolveLayout** does not apply precedence; it resolves a single layout ref to a definition. Precedence is applied earlier when choosing the layout ref (in applyProfileToNode: override → explicit → template default).
- **Authority for “which layout ref”:** applyProfileToNode. Authority for “what definition does this ref yield”: getPageLayoutId → getPageLayoutById + resolveComponentLayout; null if ref or page def missing.

*Implemented in:* `src/layout/resolver/layout-resolver.ts`; `src/layout/page/page-layout-resolver.ts`; `src/layout/component/component-layout-resolver.ts`.

---

## Action Handler Routing (Behavior Listener)

1. **state:*** — dispatchState (no runBehavior).
2. **navigate** — navigate(to).
3. **Contract verb set** (tap, double, long, drag, scroll, swipe, go, back, open, close, route, crop, filter, frame, layout, motion, overlay) — runBehavior(domain, actionName, { navigate }, params).
4. **visual-proof** — DOM proof.
5. **Other** — interpretRuntimeVerb (logic/runtime) → action-runner → handler.
6. **Unhandled** — warn.

*Implemented in:* `src/engine/core/behavior-listener.ts` (order of if branches).

---

## Section layoutDef null fallback (8.3)

When **resolveLayout(layout)** returns **null** (e.g. no layoutId, or layoutId not in page defs), the section compound does **not** invent a layout ID. It renders a **div wrapper** only: `<div data-section-id={id}>{children}</div>`. No LayoutMoleculeRenderer is used.

*Implemented in:* `src/compounds/ui/12-molecules/section.compound.tsx` — `layoutDef = resolveLayout(layout)`; when `effectiveDef` is falsy (including `layoutDef == null`), return div; no fallback layout ID is passed.

---

## Hard Fallbacks (No Override Layer)

| Location | Condition | Result |
|----------|-----------|--------|
| getPageLayoutById | id not in pageLayouts | null |
| resolveLayout | !layoutId or !pageDef | null |
| getDefaultSectionLayoutId | No template or no defaultLayout | undefined |
| ensureInitialView | !state?.currentView | dispatchState("state:currentView", { value: defaultView }) |
| Section compound | layoutDef == null | Render div wrapper (no LayoutMoleculeRenderer); **no invented layout ID** |

*Implemented in:* See ENGINE_DECISION_TRACE_MAP.md and code references above.

---

This file exposes runtime decision logic that is not visible in static architecture diagrams. The ordered ladders reflect actual precedence enforced in code so that conflicts can be resolved predictably during planning and debugging.
