# DATA_FLOW_CONTRACT.generated.md

How data moves: Blueprint output → Screen JSON → Organs → Molecules → Atoms. Which layer transforms vs displays; where filtering/mapping happens. Code-derived only.

---

## Pipeline stages (transform vs display)

| Stage | File(s) | Transform or display | Data shape in → out |
|-------|---------|----------------------|----------------------|
| Blueprint compile | src/scripts/blueprint.ts | Transform | blueprint + content → app.json (nodes: id, type, children, content, role, params, behavior). Writes apps-offline/apps/.../app.json, content.manifest.json. |
| API serve screen | src/app/api/screens/[...path]/route.ts | Display (read) | Reads file apps-offline/apps/...path.json; returns JSON. No transform. |
| loadScreen | src/engine/core/screen-loader.ts | Transform (state init only) | Fetches JSON; if json.state?.currentView, dispatchState("state:currentView", { value }); returns json. |
| Root resolution | src/app/page.tsx | Transform | renderNode = json?.root ?? json?.screen ?? json?.node ?? json. |
| assignSectionInstanceKeys | src/organs/resolve-organs.ts | Transform | children get id = node.id ?? `section-${i}`. |
| expandOrgansInDocument | src/organs/resolve-organs.ts | Transform | type "organ" nodes replaced by variant tree; merged layout/params/content; params.internalLayoutId = variantId. |
| applySkinBindings | src/logic/bridges/skinBindings.apply.ts | Transform | type "slot" nodes replaced by data[slotKey] (array of nodes or []). |
| composeOfflineScreen | src/lib/screens/compose-offline-screen.ts | Transform | inferRolesFromOfflineTree (role inference for sections without role). |
| setCurrentScreenTree / collapseLayoutNodes | src/app/page.tsx, src/engine/core/collapse-layout-nodes.ts | Transform | Store composed tree; dev: collapse layout node types to content-only. |
| applyProfileToNode | src/engine/core/json-renderer.tsx | Transform | Section layout id (override → node.layout → template default); section params stripped of layout keys; card preset merged into Card params; spacing/profile merged. |
| renderNode (Registry lookup, repeater, when) | src/engine/core/json-renderer.tsx | Transform + display | shouldRenderNode (when); repeater → item nodes; Registry[type] → Component; props built; Field value from state; JournalHistory entries from state. |
| Section compound | src/compounds/ui/12-molecules/section.compound.tsx | Display (layout resolve) | resolveLayout(layout); if organ, organ variant moleculeLayout overrides; LayoutMoleculeRenderer or fallback div. |
| LayoutMoleculeRenderer | src/layout/renderer/LayoutMoleculeRenderer.tsx | Display | Renders layout (surface, split/grid/column) and children. |
| Atoms/molecules (Registry) | src/engine/core/registry.tsx, src/compounds/ui, src/components/9-atoms | Display | React components receive props; no further data transform. |

---

## Where filtering or mapping happens

| Location | What | File |
|----------|------|------|
| shouldRenderNode | Filter: hide node when state[node.when.state] !== node.when.equals (or defaultState fallback). | src/engine/core/json-renderer.tsx |
| Repeater | Map: items[] → Card (or feature-card) nodes; content from item.title, item.body, item.icon/image. | src/engine/core/json-renderer.tsx |
| expandOrgans | Filter/map: organ nodes replaced; others cloned with recursive expand on children. | src/organs/resolve-organs.ts |
| resolveSlotNode | Map: slot → data[slotKey]; if array of nodes, use; else []. | src/logic/bridges/skinBindings.apply.ts |
| selectActiveChildren (JsonSkinEngine) | Filter: when conditionalSections exist, render only section where state[node.when.state] === node.when.equals else defaultSections. | src/logic/engines/json-skin.engine.tsx |
| evaluateCompatibility | Filter: required slots vs available slots (dev-only logging; used for dropdown options elsewhere). | src/layout/compatibility/compatibility-evaluator.ts |

---

## Data flow summary (content → UI)

1. **Blueprint** (build): Produces app.json tree. Not at runtime.
2. **Screen load**: API returns JSON; loader applies default state; page takes root.
3. **Document prep**: assignSectionInstanceKeys → expandOrgansInDocument (organ → section trees) → applySkinBindings (slot → data) → composeOfflineScreen (role inference) → optional collapseLayoutNodes.
4. **Layout resolution**: Per-node in renderer: applyProfileToNode sets section layout, card preset, spacing. Section compound: resolveLayout(layout); organ sections merge variant moleculeLayout.
5. **Render**: renderNode recurses; visibility (when), repeater mapping, Registry, props; Section → LayoutMoleculeRenderer; atoms/molecules display only.

---

## Layer roles (one-line)

| Layer | Role |
|-------|------|
| Blueprint | Transform: source → app.json. |
| API | Read file; no transform. |
| loadScreen | Transform: apply default state. |
| page (root → finalChildren) | Transform: instance keys, organ expand, skin bindings, compose, layout-node collapse. |
| JsonRenderer applyProfileToNode | Transform: layout id, strip section layout params, merge presets. |
| JsonRenderer renderNode | Transform: when, repeater, field/journal injection; display via Registry. |
| Section / LayoutMoleculeRenderer | Display (layout structure). |
| Registry components | Display. |
