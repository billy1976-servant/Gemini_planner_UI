# 06 — Contracts Master

**Source:** Compiled from `src/contracts/`, `src/docs/ARCHITECTURE_AUTOGEN/` contract-related docs, STATE_FLOW_CONTRACT, RUNTIME_PIPELINE_CONTRACT, LAYOUT_RESOLUTION_CONTRACT. This is the anchor definition layer.

---

## State contract

- **Observed keys (written/read):** currentView, journal, values, layoutByScreen, scans, interactions (derived in state-resolver). values.<key> written in state-store, behavior-listener, screen-loader; read in state-resolver, getState() consumers.
- **Intents:** state:currentView, journal.set / journal.add, state.update, layout.override, scan.result / scan.interpreted, interaction.record.
- **Derived shape:** DerivedState in state-resolver (journal, rawCount, currentView, values, layoutByScreen, scans, interactions).

---

## Engine I/O contract

- **Standard engine input envelope:** path: string (screen path or tsx:path); json: object (screen document with root/screen/node, state?, sections?); context: layout context (screenKey, sectionKey, profile).
- **Standard engine output envelope:** screenTree: object (composed tree, section keys, layout applied); state: DerivedState; dom: React tree → data-node-id, data-section-layout, data-container-width.
- **Where enforced (or should be):** screen-loader.ts, state-store.ts, json-renderer.tsx.

---

## Layout resolution contract

- **Precedence (section):** override (store) → node.layout → template defaultSectionLayoutId → undefined.
- **Section params:** layout-related keys stripped; layout id passed as layout prop to Section.
- **resolveLayout(layout)** → LayoutDefinition | null; Section when null renders div only (no fallback layout ID).
- **Stores:** section-layout-preset-store, card (same store), organ-internal-layout-store; passed as overrides to JsonRenderer.

---

## Blueprint / runtime interface

- **Compiler output:** app.json, content.manifest.json under apps-offline/apps/<appPath>/; tree: id, type, children, content, optional role/behavior/params; no section layout keys in params; no screen IDs; no layout primitive nodes (or collapsed in dev).
- **Runtime expects:** root/screen/node or self; optional state.currentView; optional data; section layout from store/template/node.layout only.
- **Must NOT generate:** section layout in params; screen IDs for load; layout primitive nodes as content nodes.
- **Contract 9.2:** Screen tree must not contain layout primitive node types (Grid, Row, Column, Stack) as content nodes; hasLayoutNodeType / collapseLayoutNodes in dev.

---

## ENGINE_LAWS (src/contracts/ENGINE_LAWS.md)

1. **WRAPPER LAW** — When inspecting child nodes in compounds, read from child.props.node, not child.props (MaybeDebugWrapper). Applies to split layouts, media detection.
2. **PRESET OVERRIDE LAW** — Section/Card presets merged after templates and win in conflicts. Order: Base → Template → Experience → Preset → Node Overrides.
3. **HERO IS NOT A NORMAL SECTION LAW** — Hero requires explicit hero presets for container width, padding, alignment, media; never default section styling.
4. **WRAPPER RULE** — Check both child.props and child.props.node for wrapped components.
5. **SPLIT LAYOUT REQUIRES 3 CONDITIONS** — params.split, moleculeLayout.type === "row", media child detected via WRAPPER LAW.
6. **TEMPLATES DEFINE STRUCTURE, PRESETS DEFINE STYLE**
7. **PARAM MERGE MUST BE NON-DESTRUCTIVE** — Deep-merge; never replace entire objects (moleculeLayout, split, spacing, containerWidth).
8. **CONTENT LIVES ON NODE, NOT COMPONENT** — Resolved node is source of truth.
9. **ENGINE LOGS TELL TRUTH, UI DOES NOT** — Trust renderer console logs when debugging.
10. **SECTION LAYOUT ≠ CARD LAYOUT** — Section layout = split/grid; card layout = internal card content flow.
11. **IF A LAYOUT DEPENDS ON CHILD TYPE, IT IS A COMPOUND RESPONSIBILITY** — Fix in compound, not renderer.

---

## Param key mapping (src/contracts/PARAM_KEY_MAPPING.md)

- **Canonical mapping:** JSON_SCREEN_CONTRACT allowedParams ↔ definitions (src/compounds/ui/definitions/*.json) ↔ compound props (12-molecules/*.compound.tsx). Layout and visual params (moleculeLayout, gap, padding, surface, etc.) come from definitions, palette, Layout Engine, Preset System at runtime — not screen JSON.
- **Molecules:** button (surface, label, trigger, supportingText); card (surface, media, title, body); section (title, role); chip, avatar, field, toast, footer, list, modal, toolbar — surface + content keys per contract.
- **Validation:** Definition keys must match; compounds read params.<key>; screen JSON must not contain layout/visual param keys.

---

## Pipeline and boundaries (reference)

- **Behavior branch order:** state:* → navigate → contract verbs → visual-proof → interpretRuntimeVerb → warn.
- **loadScreen:** path must contain "/" or start with "tsx:"; TSX no fetch; JSON fetch /api/screens/${normalized}; state init if json.state?.currentView.
- **Override stores:** section-layout-preset-store, card (same), organ-internal-layout-store — one table; passed to JsonRenderer.
- **State persistence:** localStorage key in state-store; append-only log; deriveState; rehydration; no new persistence without contract update.
- **Component Registry:** Single source registry.tsx; no duplicate type→component maps; new types require Registry + contract update.
- **Scripts boundary:** No script under src/scripts/ imported by app/engine/state/layout at runtime.
