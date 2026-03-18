# Full Pipeline Failure Diagnosis — Template → Blueprint → Content → Render

**Reference working example:** `apps-json/apps/behavior-tests/Layout_Dropdown.json`  
**Assessed generated output:** `apps-json/generated/destiny/` (app.json, blueprint.txt, content.txt, content.manifest.json)

**Scope:** Trace only. No fixes. Root-cause diagnosis for: partial UI, no images, no hero/header structure, layout not applied, sections truncated.

---

## Executive summary

| Symptom | Root cause (stage) |
|--------|---------------------|
| Structure lost (sections = text + buttons only) | **Blueprint → app.json**: no `layout` or `role` on Section nodes; compiler never emits them. |
| Images stop flowing | **Content + template**: `content.media` is `""`; no template/media-default injection. |
| Layout stops applying | **Renderer**: `getSectionLayoutId` returns `undefined` (no node.layout, no node.role, no template attached). |
| Hero/header disappear as structure | **Tree shape + role**: Single root Section + role inference only on top-level; nested sections never get role. |
| Height collapse | **SectionCompound**: `resolveLayout(undefined) === null` → fallback to bare `<div>`, no flex/minHeight. |

**Conclusion:** The **template/blueprint system is incomplete** (no layout/role, no media defaults, nested tree shape). The **renderer behaves correctly** given the JSON it receives; it does not strip nodes. Data is dropped and layout is never established earlier in the pipeline.

---

## STEP 1 — Pipeline trace (where data is dropped)

### 1.1 Template chosen → which blueprint

- **Module path:** Template selection (e.g. `medical_dentist`) → `create-from-module` or `generate-app` → writes `blueprint.txt` + `content.txt` under `apps-json/generated/<slug>/` or from `08_Modules/<vertical>/<subtype>/`.
- **Blueprint used:** `generated/destiny/blueprint.txt` (and equivalent for other generated apps). Content is correct (sections, Card with `[body, media]`, Stepper, Footer, etc.).

### 1.2 Blueprint → app.json

- **Code:** `07_Dev_Tools/scripts/blueprint.ts`: `parseBlueprint()` → `buildTree(rawNodes, contentMap, organIndex)` → `compileApp(appPath)` writes `app.json`.
- **Dropping point:**  
  - **`parseBlueprint()`** only extracts: `rawId`, `name`, `type`, `slots`, `behaviorToken`, `target`, `state`, `logic`, `variant`, `organId`. It does **not** parse or emit **`role`** or **`layout`** (blueprint grammar has no such tokens).  
  - **`buildTree()`** sets `entry.role = node.role` only when `node.role` is set (it never is). There is **no assignment of `layout`** anywhere.  
- **Result:** `app.json` has **no `role`** and **no `layout`** on any Section node. Compare: working `Layout_Dropdown.json` has `"role": "hero"`, `"layout": "hero-split"` etc.; generated `destiny/app.json` has neither.

### 1.3 content.txt → content.manifest.json

- **Code:** Same `blueprint.ts`: `compileApp()` calls `generateContentManifest(rawNodes, appPath, organIndex)` then `buildTree(..., contentMap, ...)`.
- **Dropping point:**  
  - **`generateContentManifest()`** builds a manifest from `rawNodes` with **all values set to `""`** and **writes it to disk**. It **never merges `contentMap`** (parsed from `content.txt`) into the manifest. So **content.manifest.json is always an empty-slot template** after compile.  
  - **`buildTree()`** uses **`contentMap`** (from `parseContent(contentText)`), not the manifest file, to fill `node.content`. So **app.json node content is correct** (titles, body, etc.) and the **renderer does not read content.manifest.json** for binding.  
- **Result:** **Stage where “manifest” is empty:** compiler intentionally writes manifest as schema-only; content lives only in app.json. No runtime reads the manifest for display. So “content exists in content.txt + content.manifest.json” is half-true: content.txt is used (via contentMap → app.json); content.manifest.json on disk is empty and not used for render.

### 1.4 Manifest → node binding

- **Reality:** The **renderer does not bind from content.manifest.json**. It uses **`node.content`** from the tree (app.json). So manifest → node binding is **not** the pipeline for the current render path. Content binding for render is **content.txt → parseContent → contentMap → buildTree → app.json → JsonRenderer**. That path **does** carry text content; media is empty because content.txt has `media: ""` and nothing fills it.

### 1.5 Layout profile attachment

- **Code:** `03_Runtime/engine/core/json-renderer.tsx`: `applyProfileToNode()` → `getSectionLayoutId({ sectionKey, node, templateId, sectionLayoutPresetOverrides, defaultSectionLayoutIdFromProfile })` (from `04_Presentation/layout/section-layout-id.ts`).  
- **Ladder:** override → **node.layout** → **template role** (templates[templateId][node.role]) → **template default** (profile.defaultSectionLayoutId / getDefaultSectionLayoutId(templateId)).  
- **Dropping point:** For generated apps: **node.layout** and **node.role** are missing; **templateId** is `""` when loading generated screen (no template chosen in UI/state/layout-store). So `getSectionLayoutId` gets no override, no explicit layout, no template role, no template default → **layoutId === undefined**.  
- **Result:** **Stage where layout stops applying:** layout profile/template is never attached to generated screens (no templateId), and app.json never supplies layout/role, so resolver returns `undefined`.

### 1.6 Media slot resolution

- **Blueprint:** Nodes do have `[media]` in slots (e.g. HeroCard `[body, media]`).  
- **content.txt:** Populates `media: ""` for HeroCard (and any media slot).  
- **content.manifest.json:** Carries the slot key with value `""` (or the compiler overwrites with empty; in either case manifest is not used for render).  
- **Renderer:** `card.compound.tsx` / MediaAtom: only renders when `content.media` is a non-empty string. Empty string → no image.  
- **Template:** No code injects stock/placeholder image URLs when media is empty.  
- **Result:** **Stage where images stop flowing:** content and manifest carry `media` as empty; template does not inject defaults; renderer correctly hides empty media.

### 1.7 Section renderer / compatibility

- **Code:** `SectionCompound` (`04_Presentation/components/molecules/section.compound.tsx`): `layoutDef = resolveLayout(layout)`. If `layout` is undefined (from above), `getPageLayoutId(undefined)` returns null → **layoutDef === null** → component returns **`<div data-section-id={id}>{children}</div>`** (no LayoutMoleculeRenderer, no flex/minHeight/stretch).  
- **Compatibility:** `evaluateCompatibility` is used for section/card/organ presets; it does not remove HeroSection or header nodes. No organ/layout compatibility step strips these nodes.  
- **Result:** **Stage where layout collapses height:** Section receives `layout === undefined` → no layout definition → bare div wrapper; sections are not “stripped” but they are not given any layout structure.

---

## STEP 2 — Media slot flow

| Check | Result |
|-------|--------|
| Blueprint nodes contain `[media]`? | Yes (e.g. HeroCard `[body, media]`). |
| content.txt populates them? | Yes, as `media: ""`. |
| content.manifest carries them? | Keys yes; values empty (manifest not merged with contentMap). |
| Renderer ignores media if empty? | Yes; no image rendered when `content.media` is empty. |
| Template injects stock images when empty? | No. No injection step. |

**Conclusion:** Media slots exist end-to-end but are empty; there is no template or default-media step, so images never appear.

---

## STEP 3 — Hero loss

- **HeroSection in blueprint/app.json:** Present as a Section node (e.g. `|HeroSection` with child `|HeroCard`). Not removed by compatibility or filtering.  
- **Why it looks like “text only”:**  
  - Section has **no `role`** and **no `layout`**. So it is not treated as a “hero” section by the layout system (no hero-split, no hero-specific layout).  
  - **Role inference** (`06_Data/screens/compose-offline-screen.ts`: `inferRolesFromOfflineTree`) runs only on **top-level children** of the screen root. Generated app has **one** top-level child: **RootSection**. So only RootSection gets an inferred role (“header”). **HeroSection is nested inside RootSection**, so it never gets an inferred role.  
- **HeroCard:** Renders as a Card with `content.media === ""` → no image; body text still shows.  
- **Conclusion:** HeroSection is not removed. It loses “hero” treatment because: (1) no role/layout in app.json, (2) role inference only on top-level, (3) generated tree has one root Section wrapping all others.

---

## STEP 4 — Header loss

- **NavStepper / header nodes:** Present in app.json (e.g. `|NavStepper`). Not skipped by renderer.  
- **Structure:** In generated app, NavStepper is a **child of RootSection**, not a sibling of “header” section. Working example has a **flat** list: `nav_section`, `header_section`, `hero_section`, … So “header” in the working file is a distinct section with `role: "header"` and `layout: "content-stack"`. In generated app there is no such top-level section; there is one RootSection and inside it NavStepper + sections. So the **tree shape** does not match the working example (flat sections vs one wrapper Section).  
- **Renderer:** Only “skips” header in the sense that there is no top-level section with role "header" and no layout applied; it does not strip nodes.  
- **Conclusion:** Header “loss” is due to tree shape (no top-level header section) and missing role/layout, not renderer stripping.

---

## STEP 5 — Height collapse

- **Layout actually applied:** `undefined` → `resolveLayout(undefined)` → `null` → SectionCompound uses fallback: `<div data-section-id={id}>{children}</div>`. No LayoutMoleculeRenderer, no layout definition, no CSS from layout system.  
- **Why sections are not full height:** No flex/minHeight/stretch is applied because no layout definition is resolved. The default when layout is missing is a plain div.  
- **Layout profile default:** When templateId is missing, there is no “content-stack” or other default from profile; `getDefaultSectionLayoutId(undefined)` returns `undefined`.  
- **Conclusion:** Height collapse is a direct result of layoutId being undefined and SectionCompound correctly falling back to a minimal wrapper.

---

## STEP 6 — Template payload (incomplete)

- **Template source:** App creation uses `create-from-module` (08_Modules copy + compile) or `generate-app` (module-system: `treeToBlueprint` + `treeToContent`).  
- **Layout assignment:** **Not included.** Blueprint grammar and `treeToBlueprint()` do not emit `layout` (or `role`). Compiler does not add them.  
- **Palette/behavior:** Handled elsewhere (state, palette-store); not the cause of structure/layout loss.  
- **Media placeholders:** Template/content.txt can set `media: ""` or a URL. No code injects a default URL when media is empty.  
- **Conclusion:** The template/system that produces blueprint + content does **not** include layout assignment or role; it also does not inject media defaults. So the **template system is incomplete** for full layout + media behavior.

---

## STEP 7 — Diagnosis summary

| Question | Answer |
|----------|--------|
| **Stage where structure is lost** | **Blueprint → app.json:** Section nodes never get `layout` or `role` (blueprint parser and tree builder do not produce them; tree shape is one root Section with nested sections instead of flat sections). |
| **Stage where images stop flowing** | **Content + template:** content/media slots are present but empty; no template or compiler step injects default/stock image URLs. |
| **Stage where layout stops applying** | **Layout resolution (renderer):** `getSectionLayoutId` returns `undefined` because node has no layout/role and no template is attached for generated screens; SectionCompound then gets no layout definition and uses a bare div. |
| **Stage where hero/header disappear** | **Tree shape + role inference:** Single root Section; role inference only on top-level children, so nested sections (Hero, etc.) never get role; no layout/role in JSON so hero/header are not distinguished. |
| **Template incomplete vs renderer stripping** | **Template/system is incomplete.** Renderer does not strip nodes; it resolves layout from node + profile and falls back to a minimal div when layout is undefined. |

---

## Reference: Working vs generated (destiny)

**Layout_Dropdown.json (working):**

- `screenRoot.children` = flat list of sections: `nav_section`, `header_section`, `hero_section`, `features_section`, …
- Each section has `role` (e.g. `"hero"`, `"nav"`) and `layout` (e.g. `"hero-split"`, `"content-stack"`).
- Cards have `content.media` with full URLs (e.g. Unsplash).
- Footer has `content.left` / `content.right` as objects with `label`.

**destiny/app.json (generated):**

- `screenRoot.children` = single node: `|RootSection` (type Section).
- `RootSection.children` = NavStepper, HeroSection, AboutSection, … (nested sections and blocks).
- No `role` or `layout` on any node.
- HeroCard has `content.media: ""`.
- Footer has `content.left`/`right` as strings.

So the fix surface is: **blueprint/module system** (emit role + layout; optionally flatten or support flat sections), **compiler** (optional: add default layout/role or merge content into manifest if something must read it), **template/content** (optional: default media URLs), and **screen load** (attach a template profile for generated screens so layoutId can resolve when node lacks layout/role).
