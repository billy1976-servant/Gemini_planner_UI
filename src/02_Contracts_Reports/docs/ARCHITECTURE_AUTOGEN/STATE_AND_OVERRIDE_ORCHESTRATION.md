# State and Override Orchestration

**Source:** Logic Plan 2 — [2_STATE_AND_OVERRIDE_ORCHESTRATION_PLAN.md](../../cursor/logic/complete/2_STATE_AND_OVERRIDE_ORCHESTRATION_PLAN.md).  
**Classification:** FOUNDATIONAL — Override precedence and storage; primary architecture reference: src/docs/ARCHITECTURE_AUTOGEN, src/docs/SYSTEM_MAP_AUTOGEN

How state, overrides, and engine decisions coexist safely. Clear separation of user overrides, logic recommendations, and template defaults; precedence order; where each is stored. Logic never overwrites user overrides; Layout never writes to logic stores.

---

## Separation of Concerns

| Source | Description | Who writes | Who reads |
|--------|-------------|------------|-----------|
| **User overrides** | Section/card/organ layout choices from UI (e.g. OrganPanel). | User via UI; stored in override maps (sectionLayoutPresetOverrides, cardLayoutPresetOverrides, organInternalLayoutOverrides) passed into render. | Layout resolver (applyProfileToNode) when resolving layout. |
| **Logic recommendations** | Trait weights or suggested layout ID from Decision Engine / Contextual Logic. | Logic engines compute; not written to override store. | Layout resolver may use when no override and no explicit node.layout. |
| **Template defaults** | Default section (and optionally per-role) layout from template JSON. | Defined in templates.json; read by getDefaultSectionLayoutId(templateId). | Layout resolver when override and explicit are absent. |

---

## Precedence Order

1. **User override** — e.g. sectionLayoutPresetOverrides[sectionKey].
2. **Explicit node.layout** — value already on the section node.
3. **Logic suggestion** — recommended layout ID from Decision Engine (Plan 5, when integrated).
4. **Template default** — getDefaultSectionLayoutId(templateId) from templates.json.
5. **Explicit undefined** — when none of the above; no silent fallback layout ID.

Layout resolver applies this order exactly. Logic never overwrites 1 or 2; Layout never writes to logic stores.

---

## Where Each Is Stored

| Item | Storage |
|------|---------|
| **User overrides** | Override maps from `src/state/section-layout-preset-store.ts` and `src/state/organ-internal-layout-store.ts`; passed into renderNode/applyProfileToNode. Not in layout-store's template/experience state. |
| **Logic recommendation** | Not persisted. Computed at resolution time from section node, compatibility, trait registry, and context/preference weights. |
| **Template default** | Template JSON (e.g. templates[templateId].defaultLayout). Read via getDefaultSectionLayoutId in `src/layout/page/page-layout-resolver.ts`. |
| **Layout store** | `src/engine/core/layout-store.ts`: experience, templateId, mode, region policy. Does not hold per-section overrides; overrides are separate. |

---

## Guarantees

- **Logic never overwrites user overrides.** Logic only produces suggestions. The resolver uses suggestion only when there is no user override and no explicit node.layout.
- **Layout engine never writes to logic stores.** Layout resolver and compatibility engine do not call Logic store setters. Compatibility is read-only (evaluateCompatibility).
- **User override, once set, is only changed by user action.** No engine or automatic path may clear or replace an override.

---

## Event Timing (When Engines Run)

1. Load screen JSON; apply template profile.
2. Run compatibility per section (read-only).
3. Optionally run Logic to get suggestion (read-only for layout state).
4. Resolver applies precedence and sets resolved layout on the node.
5. Render uses resolved node.

Logic runs before or during resolution; it only provides inputs to the resolver. It does not run after render to "fix" layout.

---

## Non-Negotiable System Rules

1. **No cross-engine store writes.** Logic does not write to layout store or override store. Layout does not write to logic stores.
2. **No silent fallbacks.** When no layout can be resolved, behavior is explicit (undefined or "no layout"); no silent fallback layout ID in code.
3. **No hardcoded layout IDs in logic.** Logic outputs only trait ids/weights or a recommended ID from trait registry lookup; layout ID set comes from Layout/compatibility.
4. **All layout decisions must be explainable from inputs.** Every resolved layout is traceable to: user override, explicit node.layout, logic suggestion, or template default, plus compatibility.

---

## Verification (Plan 2 completion)

- **Override writers:** Only `src/app/page.tsx` calls setSectionLayoutPresetOverride, setCardLayoutPresetOverride, setOrganInternalLayoutOverride — in OrganPanel callbacks (user UI). No logic or layout engine calls these.
- **Precedence in resolver:** `applyProfileToNode` uses override → explicit → template default → undefined; suggestion slot (3) reserved for Plan 5/8 integration.
- **Storage separation:** Layout store (layout-store.ts) holds templateId, mode, experience; override stores (section-layout-preset-store, organ-internal-layout-store) hold per-section overrides; template defaults from templates.json via getDefaultSectionLayoutId.
- **No Layout → Logic store writes:** Layout resolver and compatibility layer do not call any logic store setters.
