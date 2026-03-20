# Dev Runtime Render Tree — Palette Provider Propagation Trace

## Goal

Trace the dev runtime render tree and explain exactly why the palette provider is not present in the mounted component tree; identify the **file** and **condition** where the palette context stops propagating. No code changes.

---

## 1. Dev runtime render tree (from root to flow content)

When the URL is `/dev?screen=tsx:Runtime/FlowRuntimeScreen&flowId=...&configUrl=...`:

1. **RootLayout** (`src/app/layout.tsx` line 559)  
   - Renders `<RootLayoutBody>{children}</RootLayoutBody>` for `/dev` (line 584).

2. **RootLayoutBody** (`src/app/layout.tsx` line 120)  
   - `previewContent` = `children` (or wrapped in preview-tablet/mobile divs) — i.e. the **DevPage** component (line 216–225).  
   - Calls **`usePaletteCSS(devMode === "dev" ? canvasPaletteScopeRef : undefined)`** (line 228). So in dev mode, palette CSS variables are applied **imperatively** to the element that `canvasPaletteScopeRef` points to.  
   - Does **not** wrap `children` (or `previewContent`) in any **React context provider** for palette (no `ThemeProvider`, no `PaletteProvider`).  
   - Renders the dev chrome (e.g. “HIclarify Navigator”), then the canvas structure.  
   - **Palette-scope div** (lines 422–426):  
     `<div ref={canvasPaletteScopeRef} className="palette-scope" ...>`  
   - Inside it: `app-shell` → `stage-center` → `json-stage` → inner div → **`{previewContent}`** (line 465).  
   - So **DevPage** is a **descendant** of the `palette-scope` div in the DOM.

3. **DevPage** (`src/app/dev/page.tsx`)  
   - When `TsxComponent` is set (FlowRuntimeScreen), returns (lines 807–817):  
     `PreviewStage` → `TsxNavCapture` → `TsxEmbedProvider` → **ExperienceRenderer** (with `node={treeForRenderTsx}`).

4. **ExperienceRenderer** (`src/03_Runtime/engine/core/ExperienceRenderer.tsx`)  
   - Renders a wrapper div and **JsonRenderer** with `node={node}` (lines 70–90).  
   - No palette or theme provider here.

5. **JsonRenderer** (`src/03_Runtime/engine/core/json-renderer.tsx`)  
   - Root node has `type: "json-skin"` (synthetic tree from dev page).  
   - Line 770: `if (node.type === "json-skin")` → renders **JsonSkinEngine** with `screen={node}`.  
   - No palette provider in this path.

6. **JsonSkinEngine** (`src/05_Logic/logic/engines/json-skin.engine.tsx`)  
   - Renders `screen.children` via **JsonNode**.  
   - Single child: `{ type: "tsx-embed", params: { path: "tsx:Runtime/FlowRuntimeScreen" }, children: [] }`.

7. **JsonNode** (same file)  
   - For `node.type === "tsx-embed"` (line 125):  
     - `path = node?.params?.path ?? ""`  
     - `Component = tsxEmbed?.getComponent(path) ?? null`  
   - **If `Component` is null:** returns the fallback at **line 128** (`"TSX screen not found: …"`).  
     - In that branch there is **no** TSX envelope and **no** FlowRuntimeScreen/FlowEngine.  
     - So the only “content” in the tree is the unstyled fallback div; **no palette-scoped flow UI** is mounted.  
   - **If `Component` is not null:** returns `<div><Suspense><Component /></Suspense></div>` (lines 129–134).  
     - `Component` = **EnvelopeWrapped** → **TSXScreenWithEnvelope** → **FlowRuntimeScreen** → FlowScreenWrapper → FlowEngine.

8. **TSXScreenWithEnvelope** (`src/lib/tsx-structure/TSXScreenWithEnvelope.tsx`)  
   - Renders a single **div** with `ref={wrapperRef}` (lines 141–157).  
   - **Palette application (imperative, not context):**  
     - `applyPalette = profile.palette !== "inherit"` (line 108).  
     - For `Runtime/FlowRuntimeScreen`, profile gives `palette: "vars-only"` (flow/wizard branch in `getDefaultTsxEnvelopeProfile`), so `applyPalette === true`.  
     - **useEffect** (lines 109–124): if `applyPalette`, calls `applyPaletteToElement(wrapperRef.current, paletteName)` and subscribes to palette/state.  
   - So the **envelope div** is the only place in the TSX flow that **applies palette (CSS variables)** to a DOM node that wraps FlowRuntimeScreen/FlowEngine.  
   - There is **no** React context provider for palette here either — only a ref and a side effect.

9. **FlowRuntimeScreen** → **FlowScreenWrapper** → **FlowEngine**  
   - No `useTheme()` or palette context usage; they rely on CSS variables and `landing-theme.css`.

So in the **mounted** tree we have:

- **Layout:** `palette-scope` div (ref) + `usePaletteCSS(canvasPaletteScopeRef)` → palette applied to that div.  
- **Envelope (only if Component resolved):** envelope div + `applyPaletteToElement(wrapperRef.current, …)` → palette applied to that div.  
- **No** React **context** provider for palette anywhere in this chain.

---

## 2. Why the “palette provider” is not present (two senses)

### A. React context “palette provider”

- **ThemeProvider** (and any palette React context) exists only under **`(domain)/layout`** and **`_domain/layout`** (`src/app/(domain)/layout.tsx`, `src/app/_domain/layout.tsx`).  
- The **/dev** route is rendered by **RootLayout** → **RootLayoutBody** only.  
- **RootLayoutBody** never wraps `children` or `previewContent` in **ThemeProvider** or any palette context provider.  
- So in the dev runtime tree there is **no** palette **context provider** at all; it never “starts” for `/dev`.

**File:** `src/app/layout.tsx`  
**Condition:** For the dev route, the layout that wraps the page is **RootLayoutBody**. RootLayoutBody renders the canvas (including the `palette-scope` div and `previewContent`) **without** any ancestor that provides a palette **React context** (e.g. `ThemeProvider`). So any component that expects `useTheme()` or `usePalette()` will not find a provider.

### B. Envelope as palette “scope” (CSS) — when it’s absent

- The only other place that applies palette to a **wrapper of the flow** is **TSXScreenWithEnvelope**, which applies it to `wrapperRef.current` in a **useEffect** (imperative, not context).
- That envelope is in the tree **only if** JsonSkinEngine’s **tsx-embed** branch resolves a component: `Component = tsxEmbed?.getComponent(path) ?? null` is non-null.
- **If `Component` is null**, JsonSkinEngine does **not** render `<Component />`. It renders the **fallback** at line 128. So **TSXScreenWithEnvelope** (and thus the envelope div and its palette application) **never mount**. The flow content (FlowRuntimeScreen, FlowEngine) is not in the tree; only the “TSX screen not found” div is. So the envelope-based palette “scope” is **absent** whenever the fallback is used.

**File:** `src/05_Logic/logic/engines/json-skin.engine.tsx`  
**Line:** 128 (the return that renders the fallback).  
**Condition:** `Component` is null — i.e. `tsxEmbed?.getComponent(path) ?? null` is null (either `tsxEmbed` is null or `getComponent(path)` returns null, e.g. path mismatch). When this condition holds, the palette-applying envelope is **never mounted**, so palette context/scope does not “propagate” to any flow UI because the flow UI is not in the tree.

---

## 3. Summary table

| Sense of “palette provider” | File where it stops / never starts | Condition |
|-----------------------------|------------------------------------|-----------|
| **React context** (ThemeProvider / useTheme) | `src/app/layout.tsx` (RootLayoutBody) | Dev route uses RootLayoutBody only; it does not wrap content in any palette/theme context provider. |
| **Envelope CSS scope** (envelope div + applyPaletteToElement) | `src/05_Logic/logic/engines/json-skin.engine.tsx` (line 128 branch) | `Component === null` (getComponent(path) returned null or tsxEmbed is null), so the fallback is rendered instead of `<Component />`; the envelope never mounts and never applies palette to the flow. |

No code changes were made; this is diagnosis only.
