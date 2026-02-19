# Container Creations TSX Website — Hand-Built V1 (Execution Command)

We are building a new TSX node-based website system for Container Creations.
- This is not connected to the legacy JSON organ pipeline.
- This is not modifying blueprint.ts or compiler logic.
- This is a clean TSX build that is JSON content–driven and deterministic via nodeOrder.
- We will reverse-engineer compiler integration later.

---

## RIPPED FILES — 00_Projects folder system

**Move exported ripped containercreations.com files** to the following location under the 00_Projects folder system:

```
src/00_Projects/Business_Files/Container_Creations/Website/Ripped Files/
```

- **Ripper output:** When you export/rip containercreations.com, place the output in the above path.
- **Reconstructed site** (if used later) can live under: `Website/Reconstructed Site/`.
- No auto-import in V1; manual copy of product/copy into node props is allowed. Compiler/ripper integration later.

---

## OBJECTIVE

Build a fully working TSX website at:

```
/dev?screen=tsx:(live) Business/Container_Creations/ContainerCreationsWebsite
```

Using:

- **JSON contract:** `{ industry?, palette?, nodes[], nodeOrder[] }`
- Deterministic rendering via nodeOrder
- Dev sidebar node reorder (override only, in-memory)
- TSXScreenWithEnvelope compliance
- useAutoStructure() compliance
- CSS variables only
- No legacy organ edits
- No blueprint edits

---

## PHASE 1 — CREATE TSX WEBSITE SYSTEM

Create directory: `src/04_Presentation/components/organs/tsx/website/`

Create the following files:

### 1. types.ts

```ts
export type TsxWebsiteNode = {
  id: string;
  type: string;
  props?: Record<string, any>;
};

export type TsxWebsiteContract = {
  industry?: string;
  palette?: string;
  nodes: TsxWebsiteNode[];
  nodeOrder: string[];
};
```

### 2. node-order-override-store.ts

- Keyed by screenPath
- Methods: `getOverride(screenPath)`, `setOverride(screenPath, order)`, `clearOverride(screenPath)`, `subscribe(callback)`
- No persistence. No localStorage.

### 3. useNodeOrder.ts

- `useNodeOrder(nodes, nodeOrder, screenPath)`
- effectiveOrder = override || nodeOrder
- Build orderedNodes: for each id in effectiveOrder include matching node; append nodes not listed. Return orderedNodes. No layout logic.

### 4. NodeRegistry.ts

- Register: header, hero, content-section, cta, footer, flow-embed
- Each: pure TSX, CSS variables only, simple flex column, no hardcoded spacing, no layout constants, no external state
- flow-embed v1: section with title + button linking to `/dev?flow=${flowId}`. Do NOT embed FlowViewer yet.

### 5. NodeRenderer.tsx

- Lookup component from NodeRegistry; if missing return null. Render component with node.props. No layout wrapper.

### 6. WebsiteTemplate.tsx

- Props: `{ contract: TsxWebsiteContract; screenPath: string; experience?: string }`
- Uses **global palette system** — no applyPaletteToElement. Envelope (TSXScreenWithEnvelope) applies palette from state/palette-store.
- Call useAutoStructure() once. Use useNodeOrder(). Render vertical flex container; map orderedNodes → NodeRenderer.
- Does NOT bypass global layout engine; respects the envelope. Rerenders when experience mode changes (parent subscribes to state).

### 7. DevNodePanel.tsx

- Receives screenPath. Reads current nodeOrder. Draggable list or up/down arrows. On reorder: setOverride(screenPath, newOrder). Live update. No persistence.

---

## PHASE 2 — DEV SIDEBAR INTEGRATION

- **dock-state.ts:** Add `"nodes"` to DockPanelId.
- **RightFloatingSidebar.tsx:** Add pill `{ id: "nodes", label: "Nodes" }`. When `openPanel === "nodes"` render DevNodePanel. Only show reorder UI when current screen is a TSX website screen.

---

## PHASE 3 — CONTAINER CREATIONS JSON

Create: `src/00_Projects/Business_Files/Container_Creations/Website/container-creations-website.json`

Content:

```json
{
  "industry": "container-ventilation",
  "palette": "default",
  "nodes": [
    { "id": "header", "type": "header", "props": { "title": "Container Creations" } },
    { "id": "hero", "type": "hero", "props": { "headline": "Heavy-Duty Container Vent Systems", "subheadline": "Built for real-world steel environments" } },
    { "id": "flow", "type": "flow-embed", "props": { "flowId": "container-direct-buy" } },
    { "id": "cta", "type": "cta", "props": { "label": "Get a Custom Quote" } },
    { "id": "footer", "type": "footer", "props": { "text": "© Container Creations" } }
  ],
  "nodeOrder": ["header", "hero", "flow", "cta", "footer"]
}
```

**Ripped files location (same Website folder):**  
Place exported ripped containercreations.com files in:

`src/00_Projects/Business_Files/Container_Creations/Website/Ripped Files/`

---

## PHASE 4 — SCREEN ENTRY

Create: `src/01_App/(live) Business/Container_Creations/ContainerCreationsWebsite.tsx`

- Import contract JSON.
- Get screenPath from useSearchParams(). Subscribe to state (experience); sync contract.palette to state + palette-store on load so envelope and Palette Contract Inspector use same source.
- Validate contract at runtime (validateTsxWebsiteContract); resolve palette to valid global name.
- Render: `<WebsiteTemplate contract={contract} screenPath={screenPath} experience={experience} />`. Dev page already wraps this screen in TSXScreenWithEnvelope (global layout + palette).

---

## RESULT EXPECTED

- TSX website visible in /dev
- Node order deterministic
- Dev “Nodes” panel allows reorder with live visual updates
- No legacy JSON organs touched; blueprint untouched; compiler untouched
- Page renders; Dev Nodes panel visible; reorder works live; palette applies; flow button navigates correctly

**Ripped files:** Exported ripped containercreations.com files live under **00_Projects**:  
`src/00_Projects/Business_Files/Container_Creations/Website/Ripped Files/`

---

## FINAL NOTES

- Build by hand. Make it beautiful. Use JSON only for deterministic contract. Reverse-engineer compiler later.
- Execute cleanly. No scope expansion. No legacy edits. This is V1.
