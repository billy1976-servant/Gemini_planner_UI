# Content Blocks — Universal Renderer Rule

## Law

**Layouts must NEVER filter content blocks by type.** Content is rendered through a single universal renderer only.

## Rules

1. **One renderer for content**
   - All screen/layout components that render `screen.content` (or equivalent content arrays) MUST use the single universal function: `renderContentBlocks(content, options)`.
   - Do NOT use `content.map(...)` or `content.filter(...)` in layout code to pick specific block types (e.g. only paragraphs).

2. **Layouts control structure only**
   - Layouts decide: image placement, stacking order, columns, sections, wrappers.
   - Layouts do NOT decide: which block types appear. That is the responsibility of `renderContentBlocks`.

3. **Block types live in the universal renderer**
   - Add or extend block types (paragraph, checklist, badge, heading, video, image, future types) only inside `renderContentBlocks` (or the equivalent single renderer in that codebase).
   - Unknown block types must not crash: return `null` or a fallback; optionally log in development.

4. **Editor and preview use the same path**
   - Both editor and preview must call the same `renderContentBlocks(screen.content, ...)` so they cannot diverge. Pass editor-only options (e.g. `isEditor`, `onParagraphChange`) via the options argument.

## Applies to

- ContainerCreationsLanding-2 and any landing/screen component with `screen.content` and multiple layouts (hero, stamped, twoCol, twoColImageLeft, textOnly, etc.).
- Any future layout added to the same component: it must render content via `renderContentBlocks(screen.content, ...)` and never filter by `block.type`.

## Result

Any JSON screen can include checklist, paragraph, video, images, and future block types, and they will always render correctly in both editor and preview.
