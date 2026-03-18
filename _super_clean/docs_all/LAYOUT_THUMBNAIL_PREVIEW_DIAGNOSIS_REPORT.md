# Layout thumbnail preview — root cause diagnosis (trace only, no changes)

**Goal:** Determine why all layout thumbnails render identical output even after PreviewRender integration.

---

## 1. What node is actually being rendered?

**PreviewRender.tsx:**
- **Root node passed to JsonRenderer:** Always `screenModel` (the full screen root). No logging of `sectionKey`, `previewValue`, or resolved section node id exists today.
- **Override maps built per tile:** `sectionOverrides = { [sectionKey]: previewValue }` and `cardOverrides = { [sectionKey]: previewValue }` (or default card for section layout). So each tile passes a **different** override map (different `previewValue` or same `sectionKey` per row).
- **First child id:** Not logged. The root is the same object as the main screen (`treeForRender`); its first child is `screenModel.children[0]`, which is the first section. The renderer does **not** restrict rendering to that node.

**Conclusion:** The component does **not** log which node is being rendered. The renderer receives the **full screen** every time; it never receives a slice (single section or single card).

---

## 2. Is the renderer always defaulting to first section / first card / root.children[0]?

**No.** Code path shows:
- `JsonRenderer` is called with `node={screenModel}` (full tree).
- `renderNode(node, ...)` runs for the root, then for **every** child in `resolvedNode.children` (see `json-renderer.tsx` ~774–779). There is no branch that renders only `root.children[0]`.
- Registry for root type `screen` is `({ children }) => <>{children}</>` (registry.tsx), so all children are rendered.

So the preview is **not** forced to the first section. It always renders the full screen. The only thing that varies per tile is the **override maps** (`sectionLayoutPresetOverrides` / `cardLayoutPresetOverrides`).

---

## 3. Override application path — do overrides reach JsonRenderer?

**Yes.** They reach the same props layer as the main screen:

- **PreviewRender** builds `sectionOverrides` and `cardOverrides` and passes them as `sectionLayoutPresetOverrides` and `cardLayoutPresetOverrides` to `JsonRenderer` (PreviewRender.tsx 59–62).
- **JsonRenderer** accepts `sectionLayoutPresetOverrides` and `cardLayoutPresetOverrides` (json-renderer.tsx 923–924, 936–938) and passes them into `renderNode` and `applyProfileToNode`.
- **applyProfileToNode** uses them: `getSectionLayoutId(..., sectionLayoutPresetOverrides, ...)`, `overrideId = sectionLayoutPresetOverrides?.[sectionKey]?.trim()`, and `cardLayoutPresetOverrides?.[parentSectionKey]` for cards (json-renderer.tsx 366–377, 410–411, 511, 732).

So **overrides are not ignored by design**; they are read in the same way as on the main screen. If thumbnails are identical, overrides are either not varying per tile or the **sectionKey used in the map does not match** the section key used in the tree (see below).

---

## 4. Is the preview tree scoped (target section/card) or full screen?

**Full screen every time.** PreviewRender always passes `node={screenModel}`. There is no logic that:
- Slices the tree to the target section node, or
- Renders only the target card node.

So every thumbnail is the **full screen** with one override entry (e.g. `{ [sectionKey]: previewValue }`). Layout differences are only visible for the section whose key matches; other sections use template/default. **If the first section dominates the visible area** (e.g. hero full-bleed), the scaled preview can look the same even when a different section’s override is applied, because the changed section may be below the fold or small in the thumbnail.

---

## 5. sectionKey mapping — does lookup match the tree?

**Intended alignment:**
- **Panel:** `sectionKey` comes from `rowIds` = `sectionKeysForPreset` = `collectSectionKeysAndNodes(treeForRender?.children ?? [])`. Key is `(node.id ?? node.role) ?? ""` (section-helpers.ts 21).
- **Renderer:** In `applyProfileToNode`, section key is `(node.id ?? node.role) ?? ""` (json-renderer.tsx 365). Override lookup is `sectionLayoutPresetOverrides?.[sectionKey]`.

So the same convention is used. **If** the tree passed to `collectSectionKeysAndNodes` is the same as the one passed to PreviewRender (it is: both use `treeForRender`), keys should match and lookup should succeed.

**Risks (to confirm with logging):**
- Section keys might be assigned or transformed elsewhere (e.g. `assignSectionInstanceKeys` in resolve-organs) so that at render time sections have different `id`/`role` than when section keys were collected.
- If lookup fails (key not in map), `overrideId` is null and the resolver falls back to template/default, so that section would **not** reflect the tile’s `previewValue`. If every section’s key failed to match, every thumbnail would show the same (default) layout and **all tiles would look identical**.

---

## 6. JsonRenderer caching / memo blocking updates?

**No evidence of that.**
- **PreviewRender** is `memo(PreviewRender)`; inner content is `useMemo(..., [screenModel, defaultState, profileOverride, sectionKey, previewType, previewValue, currentSectionPreset, screenKey])`. Different `sectionKey` or `previewValue` per tile ⇒ new content.
- **JsonRenderer** does not memoize the result by override map; it runs `renderNode(...)` on every render (json-renderer.tsx 1095). No cache key or memo around the tree output was found.

So caching/memo is **not** the identified failure point. The only caveat is React keying: the “(default)” tile uses `id: ""`, so multiple rows have a tile with `key=""`. They live under different row parents (`key={sectionKey}`), so React should still treat them as separate instances; worth confirming in the DOM that each PreviewRender instance gets the expected props.

---

## Summary — exact failure point

| Question | Finding |
|----------|--------|
| **Is preview always rendering root.children[0]?** | **No.** Full screen is rendered every time; all sections are rendered. No slice to a single section/card. |
| **Are overrides ignored?** | **No.** Overrides are passed and read in JsonRenderer the same way as on the main screen. If thumbnails are identical, the cause is likely **sectionKey mismatch** (override key not matching tree section key), not overrides being dropped. |
| **Is sectionKey resolving correctly?** | **Unverified.** Convention matches (panel and renderer both use `node.id ?? node.role`), but there is **no runtime trace** of: sectionKey received, section node lookup, or fallback to index 0. **Recommended:** Add the requested logs in PreviewRender (and optionally in applyProfileToNode) to confirm that the key used in the override map matches the key used for each section in the tree and that lookup does not silently fail. |
| **JsonRenderer caching/memo blocking updates?** | **No.** No memo/cache found that would freeze the preview output. |

**Most likely failure point:** **sectionKey mismatch** between the keys used in the override map (from the panel) and the keys used in the tree (in `applyProfileToNode`). If the section key from the panel does not match any section’s `node.id ?? node.role` in the tree, that section’s override is never applied and the resolver uses template/default for every section, so every thumbnail shows the same layout. Adding the requested diagnostics (sectionKey, previewValue, resolved section node id, first child id, and a trace of override lookup per section) will confirm this.

**Secondary contributor:** Even with correct overrides, **full-screen preview + first section dominating** can make thumbnails look the same when the varied section is not visible in the scaled viewport.
