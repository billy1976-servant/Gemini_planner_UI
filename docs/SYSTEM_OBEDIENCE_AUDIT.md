# System Obedience Analysis

Architectural comprehension audit: how the platform is supposed to work end-to-end and why new organs/organisms do not automatically obey palette, atom/molecule contracts, layout, organ profiles, behavior registry, engine registry, state bindings, blueprint contract, variant system, and cross-surface portability.

---

## 1. Visual Authority Chain (diagram)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PALETTE SELECTION                                                                │
│  state.values.paletteName (primary) → palette-store getPaletteName() (fallback)  │
│  Files: state-store.ts (dispatchState); state-resolver.ts (values);              │
│        palette-store.ts L49-51 getPaletteName() = getState()?.values?.paletteName │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CSS VARIABLE INJECTION                                                           │
│  usePaletteCSS() → setPaletteVarsOnElement(root, palette)                        │
│  File: src/06_Data/site-renderer/palette-bridge.tsx                               │
│  - L158-176: usePaletteCSS() reads getState()?.values?.paletteName ?? getPaletteName() │
│  - L25-142: setPaletteVarsOnElement sets --color-primary, --color-text-primary,    │
│             --color-surface-1, --radius-sm/md/lg/xl, --spacing-*, --font-size-*  │
│  Mount: src/app/layout.tsx L168 usePaletteCSS() (no containerRef → document root) │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          ▼                             ▼                             ▼
┌──────────────────┐    ┌──────────────────────────────┐    ┌─────────────────────┐
│ ATOMS             │    │ MOLECULES                    │    │ LAYOUT RENDERER      │
│ resolveToken()   │    │ resolveParams() → resolveToken│   │ resolveParams()      │
│ (path → value)   │    │ (per-param token resolution)  │   │ for surface/variant   │
└──────────────────┘    └──────────────────────────────┘    └─────────────────────┘
  surface.tsx L20,27       palette-resolver.ts L28-31          LayoutMoleculeRenderer
  text.tsx L25-32           card/button/field etc.              L291-296 surfaceWithVariant
  trigger.tsx L29-31
  sequence.tsx L22
  collection.tsx L23
  focus-ring.tsx L60-62
  spinner.tsx L18-30
  skeleton.tsx L19-25
  field.tsx L71-76
  shell.tsx L15-16
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  TOKEN RESOLUTION (palette-resolve-token.ts)                                      │
│  L21-46: resolveToken(path, depth, paletteOverride)                               │
│  - palette = paletteOverride ?? getPalette()  (L28-29)                            │
│  - result = path.split('.').reduce((acc, key) => acc?.[key], palette) ?? path    │
│  - If result is token-like string → recurse; else return result                  │
│  FAIL SILENTLY: missing key → reduce yields undefined → ?? path → raw string     │
│  (e.g. "color.primary") used as CSS value → invalid CSS, no visible style        │
│  L25-27: spacing/gap/padding tokens intentionally return "0" (engine-owned)       │
└─────────────────────────────────────────────────────────────────────────────────┘

**Trace: Atom JSON → Molecule JSON → TSX molecule → Layout resolver → DOM**

- **Atom JSON:** Params (e.g. surface, title, label) come from molecule props or definition; atoms (surface.tsx, text.tsx, trigger.tsx, etc.) receive params and call resolveToken(params.background), resolveToken(params.color), etc. No separate "Atom JSON" file; atom inputs are the params object passed from the molecule.
- **Molecule JSON:** Molecule definitions (e.g. molecules.json variants/sizes) and screen/node JSON supply params and content. TSX molecules (card.compound.tsx, button.compound.tsx, section.compound.tsx) import resolveParams from palette-resolver, pass resolved params to atoms, and render atoms + structure.
- **TSX molecule:** Section receives layout (string id), calls resolveLayout(layout, { sectionRole: role }) → layout-definitions pageLayouts + componentLayouts; Card/Button pass params to SurfaceAtom/TextAtom. So: JSON/definition → molecule props → resolveParams → atoms → resolveToken → style object → DOM.
- **Layout resolver:** resolveLayout (layout-resolver.ts L44-172) uses getPageLayoutId + getPageLayoutById + resolveComponentLayout; Section passes result to LayoutMoleculeRenderer (section.compound.tsx L199-212). LayoutMoleculeRenderer (L216-412) uses moleculeLayout → resolveMoleculeLayout → SequenceAtom/CollectionAtom + container styles from layout.container → DOM.
- **DOM:** Final DOM is: container div (from LayoutMoleculeRenderer) → SurfaceAtom (optional) → Sequence/Collection or raw children. Atoms output div/span with style={{ ... }} from resolveToken/resolveParams.
```

**How "color.primary" or "--color-text-primary" becomes visible CSS:**

1. **Palette selected:** `getPaletteName()` from `src/03_Runtime/engine/core/palette-store.ts` L49-51 → `getState()?.values?.paletteName ?? "default"`. So state slice `values.paletteName` must exist or default is used.
2. **CSS variables injected:** Only for vars that palette-bridge knows. `setPaletteVarsOnElement` in `src/06_Data/site-renderer/palette-bridge.tsx` L25-142 sets a fixed set (e.g. `--color-primary`, `--color-text-primary`, `--color-surface-1`, `--radius-*`, `--spacing-*`). It does NOT set every possible token path (e.g. `color.primary` as dot-path is resolved in resolveToken from palette object, not from CSS vars).
3. **Atoms call resolveToken:** e.g. `surface.tsx` L20 `backgroundColor: resolveToken(params.background)`. If palette has `color.primary` → hex; if missing → `"color.primary"` string → invalid CSS.
4. **Where tokens fail silently:** `palette-resolve-token.ts` L29-31: when a key is missing, `reduce` returns undefined, then `?? path` returns the path string. That string is assigned to style (e.g. `backgroundColor: "color.primary"`) → browser ignores it → no visible style.

---

## 2. Required Runtime Conditions

| Condition | Where enforced | Required file / import | Required context or mount | Required state key |
|-----------|----------------|------------------------|----------------------------|--------------------|
| **Palette applies** | layout.tsx | `usePaletteCSS` from `@/lib/site-renderer/palette-bridge` | Route must be under app root layout that calls `usePaletteCSS()` (layout.tsx L168) | `values.paletteName` (optional; fallback "default") |
| **Layout resolves** | Section, LayoutMoleculeRenderer | `resolveLayout` from `@/layout`; layout-definitions.json | None (sync read of JSON) | None for resolution; `layoutByScreen` used for overrides |
| **Behavior fires** | behavior-listener | `installBehaviorListener(navigate)` from `@/engine/core/behavior-listener` | layout.tsx L185 (dev) / L461 (other) must call `installBehaviorListener` with navigate callback | N/A |
| **State bindings** | state-resolver | `dispatchState`, `getState` from `@/state/state-store` | None (global module) | `values.*` for generic key/value; `currentView`, `layoutByScreen`, `dashboardLayout` for specific intents |
| **Organ variant** | Section (organ branch) | `loadOrganVariant` from `@/components/organs`; organ-layout-profiles.json | Section only uses variant when `role` is in `getOrganLayoutOrganIds()` (organ-layout-profiles) | N/A |
| **Action handlers** | behavior-listener → interpretRuntimeVerb → action-registry | `getActionHandler` from `@/logic/runtime/action-registry` (via engine contract) | installBehaviorListener must have run (layout.tsx) | state passed to handler |

**Provider / mount summary:**

- **Palette:** No React context; palette is applied by mutating `document.documentElement.style` (or containerRef) in `usePaletteCSS` inside the layout that wraps the route. Routes not under that layout (e.g. standalone or different app root) do not get palette.
- **Layout:** No provider; layout-definitions.json and resolvers are statically imported.
- **Behavior:** Global `window.addEventListener("action" | "navigate" | "input-change")` installed once by `installBehaviorListener` in layout.tsx. If layout does not run (e.g. headless or alternate entry), no behavior.
- **State:** Global singleton (state-store); no provider. Rehydration from persistence in state-store; if state is never initialized, `getState()?.values` may be empty.

**Route / layout dependency:**

- `src/app/layout.tsx` is the Next.js root layout. It calls `usePaletteCSS()`, `installBehaviorListener(navigate)`, `installIdentityAuthBridge()`, and derives experience/palette/template from state. Any route under `app/` (e.g. `app/tsx-test/page.tsx`, `app/dev/page.tsx`) gets these. A route outside this tree (e.g. different root or API-only) does not.

---

## 3. Implicit Dependencies

| System | Implicit context | Evidence (file + line) |
|--------|------------------|-------------------------|
| **Palette** | Palette name comes from state first, then palette-store; palette-store subscribes to state. No explicit "PaletteProvider". | palette-store.ts L26 `subscribeState(notifyListeners)`; L49-51 `getPaletteName()` reads getState(); palette-bridge L161 `getState()?.values?.paletteName ?? getPaletteName()` |
| **Layout** | Section uses `role` to decide organ branch; organ IDs come from organ-layout-profiles.json. No declaration in organ TSX that it "needs" a layout ID. | section.compound.tsx L154-156 `organIds = getOrganLayoutOrganIds()`, `isOrgan = role != null && organIds.includes(role)` |
| **Variant** | loadOrganVariant(organId, variantId) only works if organId is in VARIANTS in organ-registry.ts. New organs (e.g. boardColumn) are not in VARIANTS or profiles. | organ-registry.ts L79-169 VARIANTS keys: header, hero, nav, footer, content-section, features-grid, gallery, testimonials, pricing, faq, cta. No toolbar, sidebar, boardColumn, columnStrip, etc. |
| **Behavior** | Molecules dispatch CustomEvent "action" with detail; behavior-listener must be installed. No contract in molecule that listener exists. | behavior-listener.ts L106-107 `window.addEventListener("action", ...)`; Card/Button fire `window.dispatchEvent(new CustomEvent("action", { detail: behavior }))` — if listener not installed, no handler |
| **State** | Organisms use useSyncExternalStore(subscribeState, getState, getState). State shape (e.g. values.structure, values.dashboardLayout) is not declared in organism; it is implied by action handlers (e.g. structure.actions) and state-resolver. | state-resolver.ts L10-38 DerivedState.values, layoutByScreen, dashboardLayout; BoardOrganism reads state?.values?.structure |
| **Experience** | experience (website | app | learning) drives presentation profile; layout.tsx reads state + layoutSnapshot. No single file that maps experience → required palette/layout. | layout.tsx L127 `experience = stateSnapshot?.values?.experience ?? ... ?? "website"`; presentation-profiles.json has website, app, learning, journal — used by layout/experience logic |
| **Atom params** | Atoms expect params.* keys (e.g. background, radius, color). These are documented in expected-params and molecules.json, not in atom files as a formal contract. | expected-params.ts L5-17 EXPECTED_PARAMS per molecule; param-key-mapping.test.ts asserts definitions vs contract; atoms (surface, text) accept params without schema |

---

## 4. Why Organs Fail to Auto-Style

**A) What must be true for a molecule to render styled?**

- **Required file:** Palette JSON (e.g. default.json) under palettes; palette-store and palette-resolver resolve names and tokens.
- **Required import:** Molecules import `resolveParams` from `@/engine/core/palette-resolver` and pass params to atoms; atoms import `resolveToken` from `@/engine/core/palette-resolve-token`.
- **Required context/provider:** No React context; palette must be applied to the DOM (usePaletteCSS on a parent that contains the tree).
- **Required state key:** `values.paletteName` (optional; default "default").
- **Required JSON contract:** Molecule params (e.g. surface, title, label) must align with EXPECTED_PARAMS and palette token paths (e.g. palette.color.primary, palette.radius.md). No single "Molecule Style Contract" file; contract is spread across expected-params.ts, molecules.json, and palette JSON shape.

**B) What must be true for layout to render non-default?**

- **Required file:** `src/04_Presentation/layout/data/layout-definitions.json` must contain pageLayouts and componentLayouts for the layout id (e.g. organ-boardcolumn).
- **Required import:** Section imports `resolveLayout` from `@/layout`; LayoutMoleculeRenderer imports `resolveMoleculeLayout`, `getSectionLayoutIds`.
- **Required context/provider:** None; layout is resolved synchronously from layout id string.
- **Required state key:** Optional `layoutByScreen[screenKey]` for overrides.
- **Required JSON contract:** layout-definitions.json must have an entry for the id; componentLayouts define type (row/column/grid) and params. No export of "valid layout ids" for machines; getSectionLayoutIds() returns page layout keys.

**C) What must be true for palette to apply?**

- **Required file:** layout.tsx (or any root that calls usePaletteCSS); palette JSON files; palette-store.
- **Required import:** palette-bridge usePaletteCSS; palette-store getPaletteName/getPalette.
- **Required context/provider:** Route must be rendered under the layout that calls usePaletteCSS(). No provider; side effect on document or containerRef.
- **Required state key:** `values.paletteName` (or fallback "default").
- **Required JSON contract:** Palette JSON must expose keys that palette-bridge and resolveToken expect (e.g. color.primary, color.onSurface, radius.md). No explicit "Palette Contract" file listing required keys.

**D) What must be true for variant resolution to apply?**

- **Required file:** organ-layout-profiles.json (organId list + internalLayoutIds); organ-registry.ts (VARIANTS map).
- **Required import:** Section imports getOrganLayoutOrganIds, resolveInternalLayoutId, loadOrganVariant from @/layout-organ and @/components/organs.
- **Required context/provider:** None.
- **Required state key:** None for variant resolution.
- **Required JSON contract:** organ-layout-profiles.json must list the organ's organId and internalLayoutIds; organ-registry VARIANTS must have an entry for that organId and variantId. New organs (e.g. boardColumn) are not in either → variant path never used, layout comes only from layout-definitions.

**E) What must be true for behavior registry to fire?**

- **Required file:** behavior-listener.ts (installBehaviorListener); action-registry.ts (handlers); layout.tsx must call installBehaviorListener(navigate).
- **Required import:** Molecules that emit actions use CustomEvent "action"; behavior-listener registers window listener.
- **Required context/provider:** installBehaviorListener must have been called once (layout.tsx useEffect).
- **Required state key:** Handlers receive getState(); specific intents (e.g. structure:moveItem) expect state.values.structure.
- **Required JSON contract:** behavior-listener branches on params.name (e.g. state:*, navigate); interpretRuntimeVerb → action-registry; action names must exist in registry (e.g. structure:moveItem in structure.actions). No single "Behavior Contract" manifest listing action names and state expectations.

---

## 4b. Why a Newly Written TSX Organ Does NOT Automatically Know

1. **Primary color / radii / spacing exist** — There is no single contract file that declares "these palette token paths exist." Palette JSON files define them; palette-bridge sets a fixed set of CSS vars; resolveToken looks up dot-paths in the palette object. A new organ that uses Section/Card/Button gets styling only if (a) it is under a layout that called usePaletteCSS(), (b) state has a paletteName (or default is used), and (c) the molecule passes params that reference valid token paths. None of this is declared in the organ or in a shared manifest, so the organ does not "know" what exists.

2. **Layout rules exist** — Layout ids (e.g. organ-boardcolumn) are just strings. They are resolved against layout-definitions.json. There is no export or schema that lists "valid organ layout ids" or "required layout shape" for an organ. The organ author must know the id exists in layout-definitions and that componentLayouts has the right type/params. Organ layout profiles (organ-layout-profiles.json) list only website-style organs; board-style organs are not there, so the variant path is never used.

3. **Variant rules exist** — loadOrganVariant(organId, variantId) only returns a value if organId is in VARIANTS in organ-registry.ts and variantId is in that organ's map. New organs are not in VARIANTS. So the organ has no way to "discover" that variants exist or what variant ids are valid; the system is implicit (code + JSON) and not declared per organ.

4. **Behavior registry** — Actions (e.g. structure:moveItem) are handled if they are in the action-registry and if installBehaviorListener has run. There is no manifest listing "these action names are valid and which state keys they use." The organ must be written to match existing handlers; no contract tells the organ what actions exist.

**Is the system self-describing and machine-readable?** **No.** Valid layout ids, palette token paths, organ ids, variant ids, and action names are spread across JSON files and code (layout-definitions, palettes, organ-registry, organ-layout-profiles, action-registry, state-resolver). There is no single export or schema that a machine can read to know "what is allowed."

**Is the system partially implicit?** **Yes.** Palette application depends on the route being under the layout that calls usePaletteCSS(). Behavior depends on installBehaviorListener having run. Organ variant resolution depends on role being in getOrganLayoutOrganIds() and organId being in VARIANTS. State shape is implied by state-resolver and action handlers, not declared where organs are implemented.

**Is it dependent on runtime context not declared in contracts?** **Yes.** The "contract" that "palette applies to this tree" is "this tree is under app layout." The "contract" that "actions are handled" is "layout.tsx mounted and called installBehaviorListener." The "contract" that "organ gets layout from definitions" is "the layout id string exists in layout-definitions.json." None of these are declared in an organ contract or a single system map.

---

## 5. Missing Machine-Readable Contracts

The following declarations are missing or not machine-usable in one place, so a machine (e.g. Cursor) cannot reliably enforce obedience:

| Missing declaration | What exists today | Gap |
|---------------------|-------------------|-----|
| **Explicit Palette Contract** | Palette JSON files; palette-bridge hardcodes which vars it sets; resolveToken uses dot-path into palette object | No single file/schema listing required palette keys (color.*, radius.*, textRole.*, etc.) and which components consume them. |
| **Atom Token Contract manifest** | Atoms use resolveToken(path); param-key-mapping and expected-params cover molecules, not atom-level token paths | No manifest mapping atom + param key → allowed token path(s) (e.g. SurfaceAtom params.background → color.primary | color.surface | var(--color-surface-1)). |
| **Molecule Style Capability manifest** | expected-params.ts (param keys per molecule); molecules.json (variants/sizes); param-key-mapping.test | No single export that lists molecules with their required/optional params and which palette tokens they use. |
| **Layout Capability registry export** | layout-definitions.json (pageLayouts + componentLayouts); getSectionLayoutIds() in code | No exported JSON or schema that lists all valid layout ids and their required shape (container, moleculeLayout type/params) for validation or codegen. |
| **Organ Variant Registry mapping** | organ-registry.ts VARIANTS (hardcoded); organ-layout-profiles.json (organId → internalLayoutIds) | No single manifest: organId → variantIds, defaultVariantId, and which layout-definition ids are valid for that organ. Board-style organs missing from both. |
| **Behavior / Action Registry manifest** | action-registry.ts (registry object); behavior-listener branches (state:*, navigate, runBehavior, interpretRuntimeVerb) | No exported list of action names, state keys they read/write, and which handler (dispatchState vs runBehavior vs action-registry) handles them. |
| **Engine registry export** | action-registry.ts; engine-registry (logic layer); behavior-listener wiring | No single "engine contract" file listing all action names and engine entry points for tooling. |
| **State binding contract** | state-resolver.ts (DerivedState type); intents in dispatchState | No schema or manifest: state keys (values.*, layoutByScreen, dashboardLayout, currentView) and which intents write them. |
| **Blueprint contract machine version** | BLUEPRINT_CONTRACT_V3_DETERMINISTIC_ORGAN.md (human spec) | No machine-readable schema (e.g. JSON Schema) for blueprint organ declarations (rawId, name, organ:organId, slots, variant, state.bind). |
| **Cross-surface portability map** | presentation-profiles.json (website, app, learning, journal); experience in layout.tsx | No explicit document mapping surface (website | app | learning | planner) → required palette, layout defaults, and which organs/behaviors are valid. |
| **Single System Map** | Scattered docs (RUNTIME_PIPELINE, ENGINE_INDEX, etc.); no single dependency graph | No one file describing: palette → layout → behavior → state → organs and their dependencies for obedience. |

---

## 6. Minimal Structural Changes Required (authority declarations only)

No refactor plan; only what structural authority declarations would allow deterministic obedience:

1. **Palette Contract** — One manifest or schema (e.g. JSON) listing required palette root keys (color, radius, spacing, textRole, etc.) and optional token paths used by palette-bridge and resolveToken. Allows validation of palette JSON and prevents silent token failure.
2. **Atom param → token mapping** — For each atom, declare which params accept token paths and valid path prefixes (e.g. SurfaceAtom.background → color.* | radius.* | var(--*)). Enables validation and docs.
3. **Layout ID registry export** — Export from layout system (or static JSON) the set of valid layout ids and their minimal shape (container?, moleculeLayout.type, moleculeLayout.params). Enables layout id validation for Section/organ usage.
4. **Organ registry manifest** — Single source (e.g. JSON or generated from organ-registry + organ-layout-profiles): all organIds, their slot keys, variant ids, default variant, and valid layout ids. New organs (boardColumn, etc.) would be added here to participate in variant/layout resolution.
5. **Behavior / action manifest** — Export from behavior-listener + action-registry: list of action names, intent pattern (state:* | navigate | runBehavior | interpretRuntimeVerb | action-registry), and for action-registry the handler name. Enables "does this action exist?" checks.
6. **State keys manifest** — DerivedState shape + list of intents that write which keys (e.g. state.update → values[key]; layout.override → layoutByScreen; structure:* → values.structure). Enables state-binding validation for organs.
7. **Blueprint schema** — Machine-readable schema (JSON Schema or similar) for organ instance lines (rawId, name, organ:organId, slots, variant, state.bind, etc.) so blueprint parsing and codegen can validate.
8. **Cross-surface matrix** — One table or JSON: surface (website | app | learning | planner) × required palette default, layout defaults, supported organIds, and supported action names. Enables portability checks and onboarding of new surfaces.

---

**End of System Obedience Audit.**
