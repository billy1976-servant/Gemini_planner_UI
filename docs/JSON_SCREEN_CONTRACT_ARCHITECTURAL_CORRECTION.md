# JSON Screen Contract — Architectural Correction (No Layout Allowed)

**Purpose:** Audit and redesign the JSON screen contract so that screen JSON contains **only** content structure, semantic intent, and behaviors — **NO** layout, styling, visual positioning, or presentation defaults of any kind.

**Core Rule (Absolute):** Screen JSON must be purely structural and semantic. It must NOT contain or imply:
- layout (row, column, grid, stack, wrap, positioning)
- spacing (gap, padding, margin)
- sizing (width, height, columns, containerWidth)
- visual styling (colors, borders, radius, shadow, fonts, alignment)
- presentation defaults of any kind

JSON describes **what exists and what it means**, not **how it looks**.

---

## 1. Audit — Violations Found

### 1.1 Contract File: `JSON_SCREEN_CONTRACT.json`

| Location | Field / Rule | Violation | Category |
|----------|--------------|-----------|----------|
| **atoms.text** | paramKeys: `fontFamily`, `size`, `weight`, `color`, `lineHeight`, `letterSpacing`, `align`, `wrap`, `truncate` | Typography and alignment are visual. | **B** Style/Theming |
| **atoms.media** | paramKeys: `aspectRatio`, `objectFit`, `radius`, `placeholder`, `placeholderColor` | Sizing and visual treatment. | **B** Style/Theming |
| **atoms.surface** | paramKeys: `background`, `borderColor`, `borderWidth`, `radius`, `shadow`, `opacity`, `padding`, `transition` | All visual. | **B** Style/Theming |
| **atoms.sequence** | paramKeys: `flow`, `direction`, `gap`, `padding`, `columns`, `align`, `justify`, `wrap`, `scrollable` | Layout and spacing. | **A** Layout System |
| **atoms.trigger** | paramKeys: `disabledOpacity`, `transition`, `hoverLift`, `hoverLiftTransform`, `cursor` | Visual/UX presentation. | **B** Style/Theming |
| **atoms.collection** | paramKeys: `direction`, `gap`, `padding`, `scrollable` | Layout and spacing. | **A** Layout System |
| **atoms.shell** | paramKeys: `background`, `padding`, `scrollable` | Visual and spacing. | **B** + **A** |
| **atoms.field** | paramKeys: `background`, `borderColor`, `borderWidth`, `radius`, `padding` | Visual styling. | **B** Style/Theming |
| **molecules.section** | allowedParams: `containerWidth`, `heroMode`, `backgroundVariant`, `moleculeLayout`, `layout`, `layoutPreset`, `media` | Layout, sizing, and visual. | **A** + **B** |
| **molecules (all)** | allowedParams: `moleculeLayout` on button, card, avatar, chip, field, footer, list, modal, stepper, toast, toolbar | Layout instruction in screen JSON. | **A** Layout System |
| **molecules (all)** | allowedParams: `surface` (with implied background, border, radius, etc.) | Surface is styling. Compounds merge surface into visuals. | **B** Style/Theming |
| **organs** | `requiredLayoutParams` (empty but present) | Concept implies layout lives in contract. | **A** Layout System |
| **layoutPrimitives** | Entire key: `row`, `column`, `grid`, `stack`, `page` with params/gap/align/justify/padding/background | Contract defines layout primitives and their defaults. | **A** Layout System |
| **rendererExpectations.optionalKeysPerNode** | `layout`, `layoutPreset`, `variant`, `size`, `media` | Layout and presentation in node shape. | **A** + **B** |
| **rendererExpectations.layoutWrapping** | "If node.layout.type is set… children are wrapped in LayoutComponent(node.layout.params)" | Renderer expects layout from JSON. | **A** Layout System |

### 1.2 `PARAM_KEY_MAPPING.md`

| Location | Violation | Category |
|----------|-----------|----------|
| Section molecule: Param Key `layout` → "moleculeLayout merge" | Documents layout as a screen param. | **A** Layout System |
| All surface/media/trigger param mappings | Map visual keys from contract to compound props. | **B** Style/Theming (contract shouldn’t own these) |

### 1.3 Layout System (consumes or implies screen layout)

| File / Concept | Violation | Category |
|----------------|-----------|----------|
| **section-layout-presets.ts** | Presets define `containerWidth`, `heroMode`, `backgroundVariant`, `moleculeLayout` (type, params with gap/align/justify/padding). These are **injected from preset**, but contract **allows** them on section nodes. | **A** — Preset system is correct owner; screen JSON must not allow these. |
| **json-renderer.tsx** | Reads `node.layout`, `node.layoutPreset`, `node.params.moleculeLayout`; applies profile `sections[role].type/params`; wraps children with `LayoutComponent(node.layout.params)`. | **A** — Renderer should get layout from Layout Engine / Preset only, not from node. |
| **molecule-layout-resolver.ts** | Resolves layout from molecule layout spec (type, preset, params). Used by compounds. | **C** — Resolver is fine; **source** of that spec must not be screen JSON. |
| **collapse-layout-nodes.ts** | Merges layout nodes into `parent.params.moleculeLayout`. | **A** — Reinforces that layout lives in params; contract should forbid it. |
| **compileProductDataToScreen.ts** | Writes `moleculeLayout: { type, params }` into section JSON. | **A** — Screen output must not contain moleculeLayout. |

### 1.4 Molecule compounds (reading layout/style from params)

| Compound | Params read that violate Core Rule | Category |
|----------|------------------------------------|----------|
| **section.compound** | `containerWidth`, `heroMode`, `backgroundVariant`, `moleculeLayout`, `layout`, `layoutPreset` | **A** + **B** |
| **card.compound** | `moleculeLayout`, `mediaPosition`, `contentAlign` | **A** layout; **C** mediaPosition/contentAlign can be semantic (e.g. “media left” = meaning) if defined as intent only. |
| **button, avatar, chip, field, footer, list, modal, stepper, toast, toolbar** | `moleculeLayout`, `surface` (visual) | **A** + **B** |

### 1.5 Organ definitions

| Observation | Violation | Category |
|-------------|-----------|----------|
| **organs.*.requiredLayoutParams** | Empty but implies layout is a contract concern. | **A** — Remove or redefine as “layout is never required from JSON”. |
| **Gallery variants** (e.g. grid-2, grid-4) | Variant IDs imply grid column count; used to drive layout. | **D** if variant is “which template”; **A** if JSON carries grid columns. |

---

## 2. Categorization Summary

| Category | Meaning | Examples |
|----------|---------|----------|
| **A) Layout System** | Row/column/grid/stack, gap, padding, containerWidth, layoutPreset, moleculeLayout, node.layout. Should be controlled by **runtime layout engine / presets / UI dropdowns** only. | layoutPrimitives, layoutPreset, moleculeLayout, layoutWrapping, containerWidth, heroMode |
| **B) Style/Theming** | Colors, typography, borders, radius, shadow, alignment (visual). Should be controlled by **style/theming system** (palette, theme, definitions), not screen content. | atoms.*.paramKeys (surface, text, media, trigger, etc.), surface, backgroundVariant |
| **C) Molecule internal** | How a molecule arranges its slots (e.g. media left vs right). Can stay in molecule **logic** if it’s derived from semantic hint (e.g. mediaPosition as “left”/“right” meaning), not from layout values in JSON. | mediaPosition, contentAlign — only if defined as semantic intent, not CSS. |
| **D) Valid structural/semantic** | type, id, role, content, children, items, behavior, when, semantic params only. | type, id, role, content, children, items, behavior, when, role, track (JournalHistory) |

---

## 3. Corrected Contract Structure

### 3.1 What screen JSON **MAY** contain (allowed)

| Key | Purpose |
|-----|--------|
| **type** | Node type (atom/molecule/organ/special). Required. |
| **id** | Stable identity (e.g. for state, overrides). |
| **role** | Semantic role (e.g. hero, features, gallery) for **layout engine** and **preset system** to use. No layout values. |
| **content** | Slots: title, body, media, label, items, etc. Content only. |
| **children** | Child nodes. Structure only. |
| **items** | Repeater data (list of content objects). Structure only. |
| **behavior** | Navigation, Action, Interaction. Intent only. |
| **when** | Conditional visibility: `{ state, equals }`. Semantic. |
| **params** (restricted) | **Semantic params only** — e.g. `track` (JournalHistory), `fieldKey` (field binding), `mediaPosition` **only if** defined as semantic intent (“media left” / “media right” as meaning, not layout spec). No layout, no styling, no sizing. |

### 3.2 What screen JSON **MUST NOT** contain (disallowed)

| Key / Concept | Reason |
|---------------|--------|
| **layout** | Layout is the responsibility of the Layout Engine + Preset System. |
| **layoutPreset** | Preset choice is UI/runtime; not part of content structure. |
| **moleculeLayout** | Row/column/grid/gap/padding belong to Layout Engine + Preset. |
| **layoutPrimitives** | Contract must not define or reference layout primitives; they are runtime layout concepts. |
| **containerWidth**, **heroMode**, **backgroundVariant** | Sizing and visual treatment → Layout/Preset + Style System. |
| **variant**, **size** (visual) | Visual variant/size → Style System / definitions; not screen structure. |
| **params.surface**, **params.trigger** (visual), **params.title** (typography) | Styling → Style System / palette / definitions. |
| **rendererExpectations.layoutWrapping** | Renderer must not wrap based on `node.layout`; layout comes from elsewhere. |
| **optionalKeysPerNode: layout, layoutPreset, variant, size, media** | Remove layout and presentation from “allowed per node.” |

### 3.3 Contract document shape (corrected)

- **atoms**: Keep only **structural/semantic** paramKeys (e.g. condition: `if`; field: `fieldKey`, `value` for binding). Remove all visual paramKeys from the contract; atoms may still accept styling **from the style system at runtime**, but the contract does not list them.
- **molecules**: **allowedParams** only semantic/content: e.g. title, body, media (content refs), label, item, track, fieldKey, role. Remove: layout, layoutPreset, moleculeLayout, containerWidth, heroMode, backgroundVariant, surface (as contract param).
- **organs**: Remove **requiredLayoutParams** or document as “layout never comes from JSON; supplied by layout engine.”
- **layoutPrimitives**: **Remove from contract entirely.** They belong to the layout engine’s registry and preset definitions.
- **rendererExpectations**: Remove **layout** and **layoutPreset** from optionalKeysPerNode. Remove **layoutWrapping** rule. Document that layout and wrapping are applied by the renderer using **layout engine output / preset / UI selection**, not `node.layout`.

### 3.4 Semantic-only params (clarification)

- **mediaPosition**: Allowed **only** if defined as semantic intent (e.g. “media left” vs “media right” for meaning/accessibility). Layout engine or molecule internal logic turns that into actual layout. Contract must not allow numeric or CSS layout values.
- **role**: Allowed. Used by layout engine and presets to choose layout; JSON does not specify the layout itself.

---

## 4. New Responsibility Boundaries

| Layer | Responsible for | Not responsible for |
|-------|------------------|----------------------|
| **Screen JSON** | Structure (type, id, role, content, children, items); semantics (behavior, when, semantic params only). | Layout, spacing, sizing, colors, typography, alignment, presets. |
| **Molecules** | Internal arrangement of slots (e.g. media left/right) **driven by semantic params or defaults**; no forced layout from JSON. | Reading layout/gap/padding/surface from screen JSON; applying theme. |
| **Layout Engine** | Row/column/grid/stack decisions; gap, padding, container width; driven by **UI controls, presets, and role** — not by layout keys in JSON. | Interpreting content meaning; defining behavior. |
| **Preset System** | Visual arrangement templates (section presets, card presets) keyed by **role or UI selection**; supplies moleculeLayout, containerWidth, heroMode, etc. **at runtime.** | Content structure; business logic. |
| **Style System** | Colors, typography, borders, radius, shadow, spacing scales; palette; theme. Applied at render from definitions/palette/profile. | Layout flow; content. |
| **Renderer** | Applying **resolved** layout + style at runtime (layout from engine/preset; style from style system); conditional render (when); behavior wiring. | Deciding layout or style from screen JSON. |

---

## 5. Migration Plan

### Step 1 — Contract and param mapping

1. **Delete from contract**  
   - Entire **layoutPrimitives** section.  
   - From **atoms**: all visual paramKeys (text, media, surface, sequence, trigger, collection, shell, field visual keys). Keep only semantic (e.g. condition.if, field.fieldKey, value for binding).  
   - From **molecules.allowedParams**: `layout`, `layoutPreset`, `moleculeLayout`, `containerWidth`, `heroMode`, `backgroundVariant`; remove `surface` from contract-allowed params (surface comes from style system).  
   - From **rendererExpectations**: `layout`, `layoutPreset`, `variant`, `size`, `media` from optionalKeysPerNode; delete **layoutWrapping** rule.

2. **Update PARAM_KEY_MAPPING.md**  
   - Remove mapping of layout → moleculeLayout.  
   - Document that surface/label/trigger visual keys are **definition/palette-driven**, not screen-JSON-driven.

### Step 2 — Files that must stop reading layout from JSON

1. **json-renderer.tsx**  
   - Do not read `node.layout` or `node.layoutPreset` for layout decisions.  
   - Do not wrap children using `resolvedNode.layout.type` / `LayoutComponent(node.layout.params)`.  
   - Obtain section layout (type, gap, padding, containerWidth, heroMode) from **layout engine + preset system** (e.g. section key + role → preset or dropdown override → resolved layout).  
   - Apply that resolved layout when rendering section (and other molecules as needed).

2. **Section compound**  
   - Do not read `params.containerWidth`, `params.heroMode`, `params.backgroundVariant`, `params.moleculeLayout`, `params.layout`, `params.layoutPreset` from props.  
   - Receive **resolved** layout/sizing/visual from renderer (injected from layout engine + preset + style system).

3. **Card (and other molecules)**  
   - Do not read `params.moleculeLayout` from screen JSON.  
   - Receive resolved layout/spacing from renderer or internal defaults; `mediaPosition`/`contentAlign` only if redefined as semantic and supplied by layout/preset, not raw from JSON.

4. **compileProductDataToScreen.ts**  
   - Stop writing `moleculeLayout` (and any layout/sizing) into screen JSON.  
   - Output only structure + content + role; layout comes from preset/engine by role.

5. **collapse-layout-nodes.ts**  
   - No longer merge layout nodes into `parent.params.moleculeLayout`.  
   - Either remove this path or repurpose: e.g. infer **role or semantic hint** from structure, not layout params in JSON.

6. **save-current-as-template.ts**  
   - Do not read `node.layout` / `node.params.moleculeLayout` from screen to define template layout.  
   - Templates should store preset IDs or role-based rules, not layout payload from JSON.

### Step 3 — Who owns what instead

1. **Layout Engine**  
   - Inputs: current screen tree (types, roles, ids), section key, user’s layout preset overrides (e.g. dropdown), preset registry.  
   - Output: per-section (and per-molecule if needed) resolved layout: type, gap, padding, containerWidth, heroMode, etc.  
   - Renderer calls layout engine **before** or **during** render and passes resolved layout into section (and other) components.

2. **Preset System**  
   - Keeps section-layout-presets (and similar) as now, but presets are keyed by **preset ID + role**, not stored in JSON.  
   - UI (e.g. section layout dropdown) sets preset ID; layout engine resolves preset → layout; that result is what renderer uses.

3. **Style System**  
   - Definitions, palette, theme supply surface, typography, spacing.  
   - Resolver (e.g. resolveParams) takes **definition + palette + profile**, not screen params, for visual props.  
   - Screen JSON no longer carries surface/color/font keys in params.

### Step 4 — Preventing regression

1. **Contract tests**  
   - Add or extend tests that fail if screen JSON (or contract allowedParams) contains: layout, layoutPreset, moleculeLayout, containerWidth, heroMode, backgroundVariant, or visual atom paramKeys.  
   - Optional: schema or validator that rejects these keys on screen nodes.

2. **Documentation**  
   - In contract and CONTENT_DERIVATION_CONTRACT: “Screen JSON is structure and semantics only. Layout and style are applied at runtime by Layout Engine, Preset System, and Style System.”  
   - In PARAM_KEY_MAPPING: “Visual and layout keys are not screen params; they come from definitions and layout resolution.”

3. **Conventions**  
   - New molecules/atoms: allowedParams in contract must not add layout or visual keys.  
   - Compilers and “screen builders” must not emit layout or styling into screen JSON.

---

## Summary

- **Violations:** Layout (layoutPrimitives, layout, layoutPreset, moleculeLayout, layoutWrapping), sizing (containerWidth), visual (atoms’ paramKeys, surface, heroMode, backgroundVariant), and optionalKeysPerNode (layout, layoutPreset, variant, size) all violate the core rule.  
- **Corrected contract:** Screen JSON allows only type, id, role, content, children, items, behavior, when, and semantic-only params; it disallows layout, layoutPreset, moleculeLayout, layoutPrimitives, and visual param keys.  
- **Responsibilities:** Screen JSON = structure + semantics; Layout Engine = layout from UI/preset/role; Preset System = arrangement templates; Style System = look; Renderer = apply resolved layout + style.  
- **Migration:** Remove layout/visual from contract and param mapping; stop reading layout from JSON in renderer, compounds, compiler, and collapse logic; feed layout from layout engine and presets; add validation and docs to prevent layout/style in screen JSON again.

This aligns the architecture with the rule: **JSON describes what exists and what it means, not how it looks.**
