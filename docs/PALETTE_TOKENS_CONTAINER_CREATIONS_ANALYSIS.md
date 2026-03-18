# Why Palette Tokens Do Not Work for Container Creations

## Summary

Palette tokens in `container-creations.landing.json` (e.g. `tokens.textPrimary`, `tokens.surface`, `tokens.cardBackground`) are **never resolved to colors**. The screen is rendered by **JsonSkinEngine**, which uses `node.params` (color, background) **directly** in inline styles without calling the palette resolver. The `"palette": "container-creations"` on the document root is **never read** by the render path, and **paletteOverride** is not passed from the landing page. Result: style values like `"tokens.surface"` are applied as literal strings, so the UI does not get real hex colors.

---

## 1. Does the renderer support palette token resolution?

**For Registry-rendered nodes (Section, Card, Button, etc.):** Yes. **JsonRenderer** calls `resolveParams(..., paletteOverride)` and then `resolveToken(value, 0, paletteOverride)` for each param value. Token paths like `color.primary` or `tokens.textPrimary` are resolved to hex (or other values) from the palette.

**For json-skin nodes:** No. When `node.type === "json-skin"`, JsonRenderer **does not** call `resolveParams`. It immediately renders:

```tsx
<JsonSkinEngine screen={node} />
```

and does **not** pass `paletteOverride` to JsonSkinEngine. So the entire Container Creations tree is rendered by JsonSkinEngine with **no** token resolution.

**Token format:** The resolver in `palette-resolve-token.ts` only treats a value as a token path if it matches `/^[\w.]+$/` (word chars and dots). So:

- `"tokens.textPrimary"` → resolved if a palette is used (e.g. `palette.tokens.textPrimary` → `"#ffffff"`).
- `"$palette.background"` → **not** treated as a token (contains `$`), so it is returned as-is and would not resolve even if the resolver were called.

So: **Registry path = resolution supported. JsonSkin path = no resolution.** The JSON currently uses `tokens.*`, which is the correct format for the existing resolver; the problem is that JsonSkinEngine never calls it.

---

## 2. Rendering path for this screen

```
container-creations.landing.json (id, palette, state, root)
    ↓
src/app/landing/page.tsx
    - Imports JSON, builds tree from json.root (json-skin node + children)
    - Does NOT pass json.palette anywhere
    - Passes node={treeForRender} to <ExperienceRenderer />
    - Does NOT pass paletteOverride
    ↓
ExperienceRenderer (src/03_Runtime/engine/core/ExperienceRenderer.tsx)
    - Receives node, passes it to JsonRenderer with paletteOverride={undefined}
    ↓
JsonRenderer (src/03_Runtime/engine/core/json-renderer.tsx)
    - Sees node.type === "json-skin"
    - Renders <JsonSkinEngine screen={node} /> only (no resolveParams, no paletteOverride)
    ↓
JsonSkinEngine (src/05_Logic/logic/engines/json-skin.engine.tsx)
    - Renders each child via JsonNode (section, text, button, image, video)
    - Uses node.params.color / node.params.background directly in style objects
    - Never calls resolveToken or resolveParams
    → Styles receive literal "tokens.textPrimary", "tokens.surface", etc.
```

So: **JSON → landing page → ExperienceRenderer → JsonRenderer → JsonSkinEngine → direct use of params in styles.** No step in this path resolves palette tokens.

---

## 3. Does the JSON reference palette tokens correctly?

Yes. The file uses dot-path tokens that the existing resolver can resolve when given the right palette:

- `"color": "tokens.textPrimary"`
- `"background": "tokens.surface"` (video)
- `"background": "tokens.cardBackground"` (images)

The **container-creations** palette in `src/04_Presentation/palettes/container-creations.json` has `tokens.textPrimary`, `tokens.surface`, `tokens.cardBackground` defined. So **if** resolution were run with that palette, these would resolve to `#ffffff`, `#1a1d23`, and `#111`.

If the JSON were changed to `"$palette.textPrimary"` etc., the current resolver would **not** treat those as token paths (because of the `$`), so they would stay as literal strings. The correct format for the existing resolver is `tokens.*` (or other dot paths into the palette object).

---

## 4. Is the palette file loaded?

Yes. The palette is loaded by the app’s palette system:

- File: `src/04_Presentation/palettes/container-creations.json` (same content as `src/palettes/container-creations.palette.json`).
- `src/04_Presentation/palettes/index.ts` uses `require.context(".", false, /\.json$/)`, so `container-creations.json` is included and exposed as `palettes["container-creations"]`.
- `getPaletteForResolution("container-creations")` in `palette-resolver.ts` returns that object.

So the palette is available; it is simply **never used** on the Container Creations path because JsonSkinEngine doesn’t call the resolver and the landing page doesn’t pass a palette override.

---

## 5. Is the screen root `"palette": "container-creations"` read by the renderer?

No. The document has:

```json
{
  "id": "container-creations-landing",
  "palette": "container-creations",
  "state": { ... },
  "root": { "type": "json-skin", "id": "...", "children": [ ... ] }
}
```

The **root** node passed to JsonRenderer is `json.root` (the object with `type`, `id`, `children`). The `"palette"` key is a **sibling** of `root`, not a property of it. So:

- `screen` in JsonSkinEngine is `json.root` → `screen.palette` is **undefined**.
- The landing page never passes `json.palette` into the render tree (e.g. as `paletteOverride` or by attaching it to the node).

So the declared palette is never read by the renderer.

---

## 6. Existing token resolution patterns

| Pattern | Where | Purpose |
|--------|--------|--------|
| `resolveToken(path, depth, paletteOverride)` | `palette-resolve-token.ts` | Resolves a single value (e.g. `"color.primary"` or `"tokens.textPrimary"`) from a palette. |
| `resolveParams(..., paletteOverrideName?)` | `palette-resolver.ts` | Merges presets + inline params and resolves every value through `resolveToken` with optional palette override. |
| `getPaletteForResolution(paletteName)` | `palette-resolver.ts` | Returns the palette object for a given name (e.g. `"container-creations"`) from `@/palettes`. |
| Registry components (Section, Card, Button, etc.) | Used by JsonRenderer for non–json-skin nodes | Receive params that have already been run through `resolveParams` in JsonRenderer, so their styles get resolved colors. |
| JsonSkinEngine | Used by JsonRenderer for `type === "json-skin"` | Does **not** use `resolveToken` or `resolveParams`; uses `node.params` as-is. |

So token resolution exists and is used for Registry nodes; the gap is that **JsonSkinEngine never uses it**.

---

## 7. Exact missing pieces

### A. JsonSkinEngine does not resolve params

It uses `node.params.background`, `node.params.color`, etc. directly in styles. So values like `"tokens.surface"` become literal CSS values and do not turn into hex colors.

**Minimal fix:** In JsonSkinEngine, before applying any style that comes from `node.params` (e.g. `color`, `background`), resolve that value with the palette:

- Get palette: from a prop (e.g. `paletteOverride`) or from the **document** root (see B). The engine only receives `screen` (the json-skin node); it does not receive the top-level `palette` field today.
- For each such param, if the value is a string that looks like a token path, use `resolveToken(value, 0, paletteOverride)` and use the result in the style.

So the smallest code change is: **in JsonSkinEngine, resolve `node.params.color` and `node.params.background` (and any other style params that should be tokens) via `resolveToken` with the correct palette.**

### B. Screen palette never reaches the engine

- The document has `"palette": "container-creations"` at the top level, but the node passed to JsonRenderer is `json.root`, which does not include `palette`.
- The landing page does not pass `paletteOverride` to ExperienceRenderer.

So either:

1. **Landing page** passes `paletteOverride={json.palette}` into ExperienceRenderer when the JSON has a `palette` field, and JsonRenderer passes that same `paletteOverride` into JsonSkinEngine (JsonRenderer currently doesn’t pass it to JsonSkinEngine), or  
2. The **root node** is augmented somewhere so that the json-skin node carries the palette (e.g. when building `treeForRender`, set `root.palette = json.palette`), and JsonSkinEngine reads `screen.palette` and uses `getPaletteForResolution(screen.palette)` to get the palette object for resolution.

Option 2 avoids changing JsonRenderer’s signature and keeps the palette on the tree. Option 1 keeps palette as a top-level concern and passes it explicitly.

### C. `$palette.` prefix not supported

If the JSON (or any future convention) uses `"$palette.background"`, the current resolver will not resolve it because `looksLikeTokenPath` rejects strings containing `$`. So either:

- Keep using **dot paths** like `tokens.background`, `tokens.textPrimary` (current JSON is correct), or  
- Extend the resolver to treat `$palette.xxx` as an alias for `tokens.xxx` (e.g. strip the prefix and resolve `tokens.xxx`). That would be a small, localized change in `palette-resolve-token.ts`.

---

## Smallest correct implementation path

1. **Use the screen’s palette in JsonSkinEngine**
   - Either attach the document palette to the node before render (e.g. in the landing page set `treeForRender.palette = (landingJson as any).palette` so `screen.palette` is `"container-creations"`), or pass `paletteOverride` from the landing page through ExperienceRenderer and JsonRenderer into JsonSkinEngine.
   - In JsonSkinEngine, get the palette object: e.g. `const palette = screen.palette ? getPaletteForResolution(screen.palette) : undefined` (and use global palette when undefined), or receive it as a prop.

2. **Resolve style params in JsonSkinEngine**
   - For **text:** when building the `color` style, if `node.params.color` is present, use `resolveToken(node.params.color, 0, palette)` (fallback to current hardcoded var if needed).
   - For **image / video:** when building the `background` style, use `resolveToken(node.params?.background, 0, palette)` (or keep existing fallback when missing).
   - Use the same pattern for any other params that are intended to be palette tokens (e.g. border, shadow if they appear later).

3. **Optional:** If you want to support `$palette.xxx` in the JSON, add a small branch in `resolveToken`: if `path` is a string and starts with `"$palette."`, replace with `"tokens." + path.slice(9)` and then resolve. Otherwise, no change to the JSON is required; `tokens.*` is already correct.

No refactor of the whole system is required; only the Container Creations render path (JsonSkinEngine + how the screen palette is provided) needs the above changes so that palette tokens are resolved before being applied to styles.
