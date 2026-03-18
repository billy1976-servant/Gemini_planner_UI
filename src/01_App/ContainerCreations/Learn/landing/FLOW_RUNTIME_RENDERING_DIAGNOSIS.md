# Flow Runtime Rendering Failure — Diagnosis

## Summary

- **Fallback renderer (explicit):** `src/05_Logic/logic/engines/json-skin.engine.tsx` **line 128**
- **Condition that triggers it:** `Component` is null because `tsxEmbed?.getComponent(path) ?? null` is null.
- **Causes:** (1) `tsxEmbed` is null (no `TsxEmbedProvider` ancestor), or (2) `getComponent(path)` returns null because **path and screenPath do not match** in the dev page’s `getComponent` closure.

---

## 1. Rendering chain (FlowRuntimeScreen → FlowEngine)

1. **Dev page** (`src/app/dev/page.tsx`): When `screen=tsx:Runtime/FlowRuntimeScreen`, `loadScreen("tsx:Runtime/FlowRuntimeScreen")` returns `{ __type: "tsx-screen", path: "Runtime/FlowRuntimeScreen" }`. `TsxComponent` is set to the dynamic FlowRuntimeScreen; `tsxMeta.path` is `"Runtime/FlowRuntimeScreen"`.
2. **Synthetic tree:** `screenPath` is set to `"tsx:Runtime/FlowRuntimeScreen"`. A synthetic tree is built with one child: `{ type: "tsx-embed", params: { path: screenPath }, children: [] }` (line 777). So `params.path` is `"tsx:Runtime/FlowRuntimeScreen"`.
3. **JsonRenderer** (`src/03_Runtime/engine/core/json-renderer.tsx`): Root node has `type: "json-skin"` (line 770). So it renders **JsonSkinEngine** with `screen={node}` and does **not** use the generic JSON renderer for the root.
4. **JsonSkinEngine** (`src/05_Logic/logic/engines/json-skin.engine.tsx`): Renders `screen.children` via **JsonNode**. The only child is the `tsx-embed` node.
5. **JsonNode** (same file): For `node.type === "tsx-embed"` (line 125), it reads `path = node?.params?.path ?? ""` and `Component = tsxEmbed?.getComponent(path) ?? null`.  
   - **If `Component` is null:** it renders the fallback at **line 128**:  
     `return <div style={{ padding: 16, color: "#666" }}>TSX screen not found: {path || "(no path)"}</div>;`  
     That is the only explicit “fallback renderer” in this chain.
   - **If `Component` is not null:** it renders `<Component />` (EnvelopeWrapped → TSXScreenWithEnvelope → FlowRuntimeScreen → FlowScreenWrapper → FlowEngine). FlowEngine then renders the flow (hero, stamped, etc.) and uses `renderContentBlocks` and `@/app/landing/landing-theme.css`.

So: **FlowRuntimeScreen does pass the flow config to FlowEngine** only when the tsx-embed branch resolves a component (no fallback). Config is loaded by **FlowScreenWrapper** from `configUrl` and passed as `config` into **FlowEngine**.

---

## 2. Where components are resolved

- **Registry / getComponent:** The TSX screen is resolved in two places:
  - **Dev page** (line 784): `tsxEmbedValue = { getComponent: (path: string) => (path === screenPath ? EnvelopeWrapped : null) }`. So the “registry” is this closure; the component is returned only when `path === screenPath` (strict equality).
  - **JsonSkinEngine** (line 127): `Component = tsxEmbed?.getComponent(path) ?? null`. So resolution is: **path** from `node.params.path` must exactly match **screenPath** from the dev page closure.
- **Path flow:** `screenPath` = `"tsx:Runtime/FlowRuntimeScreen"`. The tree’s `params.path` is set to that same `screenPath`. So in theory they match. If they ever differ (e.g. encoding, whitespace, or a different tree instance with an old path), `getComponent(path)` returns null and the **fallback at line 128** is used.

---

## 3. JsonSkinEngine vs generic renderer

- **JsonSkinEngine is used** when the root node has `node.type === "json-skin"` (json-renderer.tsx line 770). For the flow runtime URL, the dev page always passes a root with `type: "json-skin"`, so **JsonSkinEngine is not bypassed** for the root.
- The **generic** JsonRenderer (definitions, profile, sections, etc.) is used only for non–json-skin nodes. So for this flow URL the generic renderer is not used for the root.

---

## 4. Why the fallback renderer is used

The fallback at **json-skin.engine.tsx line 128** is used when:

- **Condition:** `!Component`, i.e. `tsxEmbed?.getComponent(path) ?? null` is null.

So either:

1. **`tsxEmbed` is null** — JsonSkinEngine is not under a `TsxEmbedProvider` (e.g. different React tree or portal). In the dev page, `TsxEmbedProvider` wraps `ExperienceRenderer` → `JsonRenderer` → … → JsonSkinEngine, so normally `tsxEmbed` is set.
2. **`getComponent(path)` returns null** — In the dev page, that happens only when `path !== screenPath`. So any mismatch between `node.params.path` and the closure’s `screenPath` (e.g. one with `tsx:` and one without, or different normalization) will trigger the fallback.

If the user sees **“TSX screen not found: …”**, that is this fallback.  
If the user sees **flow text but no styling/palette**, then the fallback at 128 is **not** triggered; the component is found and FlowEngine is rendering, and the problem is missing theme/palette (CSS or envelope scope), not the TSX resolution path.

---

## 5. Minimal fix

**File:** `src/app/dev/page.tsx`  
**Location:** Where `tsxEmbedValue` is created (around line 784).

**Change:** Make `getComponent` resolve by **normalized path** so that `params.path` and `screenPath` match even if one has or lacks the `tsx:` prefix or differs in whitespace.

Replace:

```ts
const tsxEmbedValue = { getComponent: (path: string) => (path === screenPath ? EnvelopeWrapped : null) };
```

with:

```ts
const normalizedScreenPath = (screenPath ?? "").replace(/^tsx:/, "").trim();
const tsxEmbedValue = {
  getComponent: (path: string) => {
    const normalizedPath = (path ?? "").replace(/^tsx:/, "").trim();
    return normalizedPath === normalizedScreenPath ? EnvelopeWrapped : null;
  },
};
```

This keeps the same behavior when paths already match and avoids the fallback when the only difference is `tsx:` or trimming.

**If the issue is “flow text renders but no styling/palette”:** then the fallback at line 128 is not the cause. In that case the fix is to ensure:

- The envelope (TSXScreenWithEnvelope) applies palette to the wrapper that contains FlowRuntimeScreen, and
- `@/app/landing/landing-theme.css` is loaded and in scope for the FlowEngine output (no extra wrapper that strips or overrides styles).

No refactors or new wrappers are required for the path-mismatch fix above.
