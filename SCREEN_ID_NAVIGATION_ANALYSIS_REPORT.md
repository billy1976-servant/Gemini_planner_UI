# Screen-ID Navigation System — Full Analysis Report

**Goal:** Explain how the Screen-ID navigation system is supposed to work and why it is currently not visible or usable in the UI.  
**Scope:** Analysis and explanation only (no code changes).

---

## 1. SCREEN REGISTRY

**File:** `src/07_Dev_Tools/nav/screen-registry.ts`

### How screen IDs are generated

- **Formula:** `id = slugify(path)`.
- **slugify:** Lowercase, replace non-alphanumeric with `-`, collapse/consecutive dashes, trim leading/trailing dashes.
- **Example:** Path `"tsx:(dead) Tsx/Gibson Guitars/blueprint"` → ID `"tsx-dead-tsx-gibson-guitars-blueprint"`.

### How the registry is populated

- **Storage:** Module-level `pathList: string[]` (no subscription; not reactive).
- **Population:** `setScreenPaths(paths: string[])` overwrites `pathList`.
- **Source of paths:** `flattenIndexToPaths(index)` turns the `/api/screens` index into path strings. For root sections like `"(dead) Tsx"`, `tsx-organisms`, `tsx-organs` it adds a `tsx:…/` prefix; then it flattens `directFiles` and `folders` into full path strings (e.g. `tsx:(dead) Tsx/CategoryName/folder/file`).

### Whether `/api/screens` correctly feeds the registry

- **Yes.** In `src/app/layout.tsx` (and again in `src/app/page.tsx`), on mount:
  - `fetch("/api/screens")` is called.
  - Response is passed to `flattenIndexToPaths(list)`.
  - Result is passed to `setScreenPaths(flattenIndexToPaths(list))`.
- **API:** `GET /api/screens` (in `src/app/api/screens/route.ts`) scans `src/01_App`, TSX organisms/organs, and returns a `ScreensIndexItem[]` (category, directFiles, folders, rootSection). Structure matches what `flattenIndexToPaths` expects.

### What a Screen ID looks like

- A **lowercase, hyphenated** identifier derived from the screen path (e.g. `tsx-hiclarify-hiclarifyonboarding`, `gibson-guitars-blueprint`).
- **Lookup:** `getScreenById(id)` / `getScreenIdByPath(path)` use the same `slugify` so path ↔ id is consistent.

### Where it should appear in the UI

- **Intended:** In any dev UI that lets the user pick “which screen does this button/card navigate to?” — e.g. a **Link target** or **Screen target** dropdown that lists `getAllScreens()` (each with `id` and `title`).
- **Current:** That UI exists only as the **LinkTargetPicker** component; it is **never rendered** anywhere (see §5).

---

## 2. NAVIGATION TRIGGER SYSTEM

**Files:**  
`src/04_Presentation/components/molecules/button.compound.tsx`,  
`src/04_Presentation/components/molecules/card.compound.tsx`,  
`src/03_Runtime/engine/core/behavior-listener.ts`

### How clicking a button/card triggers navigation

1. **Button / Card**  
   On tap they call a `handleTap` that:
   - If `nav?.toScreenId` is set: dispatches a **custom event** `navigate` with `detail: { toScreenId, toAnchor }`.
   - Else if `behavior?.type === "Navigation"`: dispatches `navigate` with legacy shape (`to`, `screenId`, etc.).
   - Else dispatches `action` or `interaction` as appropriate.

2. **Global listener**  
   `installBehaviorListener(navigate)` (called from `layout.tsx`) subscribes to `"navigate"` on `window`:
   - Prefers **Screen-ID format:** `detail.toScreenId` (and optional `toAnchor`). If present, calls `navigate({ toScreenId, toAnchor })`.
   - Otherwise falls back to `detail.to` / `screenId` / `target` and calls `navigate(destination)` (string or legacy payload).

3. **Router**  
   The `navigate` callback in layout uses `goToScreen(router, payload.toScreenId, { devMode: "user", anchor: payload.toAnchor, replace: true })` so the app actually changes screen/URL.

So: **click → handleTap → "navigate" event → behavior-listener → goToScreen → URL/screen change.**

### What the `nav` prop must contain

- **Shape:** `nav?: { toScreenId?: string; toAnchor?: string }`.
- **Meaning:** `toScreenId` = Screen ID (slugified path); `toAnchor` = optional in-page anchor.
- **Source at runtime:** Either:
  - Set **explicitly in JSON** on the node (e.g. `nav: { toScreenId: "some-screen-id" }`), or
  - **Injected by the renderer** from `navTargets[elementId]` when that map is present (see §4).

### How `{ toScreenId, toAnchor }` is passed through

- **Molecules:** Button and Card accept `nav` in props and use it in `handleTap` to dispatch the `navigate` event.
- **Renderer:** For `typeKey === "button"` or `"card"`, `json-renderer` looks up `navTargets[elementKey]` (elementKey = `resolvedNode.id ?? resolvedNode.role ?? effectivePath`) and, if present, sets `props.nav = nav`.
- **State:** `navTargets` are expected to live in **state** under `layoutByScreen[screenKey].navTargets` (see §3). Today nothing ever **writes** that state (no `layout.setNavTargets` dispatch), so the renderer never gets navTargets from state.

### Element types that support navigation

- **Button** and **Card** (and any molecule that accepts `nav` and dispatches `"navigate"`).
- The **renderer** only injects `nav` from `navTargets` for `button` and `card` (see `json-renderer.tsx` around 698–702).

### Configuration required for navigation to work

1. **Screen registry** populated (e.g. via `/api/screens` → `setScreenPaths`).
2. **navTargets** map: for the current screen, a map from **element id** (or role/path) to `{ toScreenId?, toAnchor? }`.
3. That map must be either:
   - In **state:** `state.layoutByScreen[screenKey].navTargets` (so the renderer can pass it down), or
   - On the **profile** passed to the renderer: `profileOverride.navTargets`.
4. The **element** must have a stable `id` (or `role`) that matches the key used in `navTargets`.

---

## 3. NAV TARGET STORAGE

**File:** `src/03_Runtime/state/state-resolver.ts`

### Where navTargets are stored in state

- **Shape:** `DerivedState.layoutByScreen[screenKey].navTargets`
- **Type:** `Record<string, { toScreenId?: string; toAnchor?: string }>` (key = element id/role).
- **Derivation:** In `deriveState(log)`, when an event has `intent === "layout.setNavTargets"`, the payload is expected to have `screenKey` and `navTargets`. The resolver ensures `layoutByScreen[screenKey]` exists (with section, card, organ) and sets `layoutByScreen[screenKey].navTargets = { ...navTargets }`.

### How layout.setNavTargets updates them

- **Intent:** `"layout.setNavTargets"`.
- **Payload:** `{ screenKey: string, navTargets: Record<string, { toScreenId?: string; toAnchor?: string }> }`.
- **Effect:** Merges/replaces navTargets for that screenKey in derived state. No other logic; it’s a direct write from the event log.

### How screenKey is determined

- **When reading (e.g. in layout or dev page):** `screenKey` is derived from the **current screen** (URL/searchParams or loaded JSON).
  - In **layout.tsx** (Save): `currentScreen.replace(/[^a-zA-Z0-9]/g, "-")`.
  - In **dev/page.tsx**: `screen.replace(/[^a-zA-Z0-9]/g, "-")` or a hash-based key when needed.
  - In **page.tsx** (main app): `json?.id ?? effectivePath.replace(/[/.]/g, "-")` — so it can differ (e.g. `json.id` vs path-based key).
- **When writing:** Whoever dispatches `layout.setNavTargets` must use the **same** screenKey that the renderer and save flow use for that screen, or navTargets won’t be found.

### How navTargets connect elements to screens

- **Per-screen:** Each screen has its own `layoutByScreen[screenKey]`; `navTargets` there map **element identifiers on that screen** to **destination screen ID + optional anchor**.
- **At render:** JsonRenderer receives `screenId` (the current screen’s key) and reads `rawState?.layoutByScreen?.[screenId]?.navTargets`. It passes this as `navTargets` into `renderNode`. For each Button/Card, it looks up `navTargets[elementId]` (or role/path) and sets `props.nav` so the button/card emits the correct `navigate` event.

---

## 4. RENDERING PIPELINE

**File:** `src/03_Runtime/engine/core/json-renderer.tsx`

### How navTargets are injected into rendered components

- **JsonRenderer (default export):**  
  It computes  
  `navTargets = (screenId && rawState?.layoutByScreen?.[screenId]?.navTargets) ?? profileOverride?.navTargets ?? undefined`  
  and passes `navTargets` into `renderNode(..., navTargets)`.

- **renderNode:**  
  When building props for the component (around 698–702):
  - If `navTargets` is set and the node type is `"button"` or `"card"`:
    - `elementKey = resolvedNode.id ?? resolvedNode.role ?? effectivePath`
    - `nav = navTargets[elementKey] ?? navTargets[effectivePath]`
    - If `nav` has `toScreenId` or `toAnchor`, `props.nav = nav`.
  - So the **element’s `id` (or `role`, or path)** must match a key in `navTargets`.

### What elementId must match

- The key in `navTargets` must be the **same** as what the renderer uses: `resolvedNode.id ?? resolvedNode.role ?? effectivePath` (where `effectivePath` is `nodePath ?? (node?.id ?? node?.role ?? \`n_${depth}\`)`). So buttons/cards should have a stable `id` (or `role`) in the JSON if nav is driven by layout state.

### How profileOverride.navTargets works

- If the **profile** passed to JsonRenderer as `profileOverride` has `navTargets`, that map is used when **state** has no `layoutByScreen[screenId].navTargets`. So a template or preloaded profile can define link targets without going through state (e.g. from saved template JSON).

### Conditions for a button to become clickable navigation

1. **Node type** is `button` or `card`.
2. **navTargets** is defined (from state for current `screenId` or from `profileOverride`).
3. **Element key** (id, role, or effective path) exists in `navTargets`.
4. The entry has at least `toScreenId` or `toAnchor`.
5. **Button/Card** receive `nav` and dispatch `"navigate"` on tap (no `onTap` override that skips it).

---

## 5. DEV UI TOOLING

**File:** `src/07_Dev_Tools/nav/LinkTargetPicker.tsx`

### What the component does

- **Props:** `devMode`, `value: NavTarget`, `onChange`, `elementId`, `label`.
- **Behavior:** If `devMode !== "dev"`, returns `null`. Otherwise renders a small form: label (with elementId), a **select** (screen list from `getAllScreens()`), and an optional **anchor** text input. On change it calls `onChange` with `{ toScreenId?, toAnchor? }`.

### Where it is rendered

- **Nowhere.** Grep shows **no imports or usage** of `LinkTargetPicker` in the app. It is only exported from `src/07_Dev_Tools/nav/index.ts`.

### What UI should show the dropdown

- **Intended:** A dev-only “element properties” or “link target” area when a **button or card** is selected (e.g. in an inspector or in the Organ Panel next to section/card/organ layout dropdowns). That UI would:
  - Show the current `nav` for the selected element (or empty).
  - Use **LinkTargetPicker** to choose screen + optional anchor.
  - On change, call something that **updates state** (e.g. dispatch `layout.setNavTargets` with the current screenKey and an updated navTargets map).

### Why it is not visible

1. **LinkTargetPicker is never mounted** — no parent component includes it.
2. **No “selected element” + “nav for this element” flow** — OrganPanel and the diagnostics rail offer section/card/organ **layout** overrides and pipeline/inspector panels, but no “selected button/card” + “link target” editor.
3. **devMode:** The component would only render when `devMode === "dev"`. That is satisfied when the user is in dev mode; the missing piece is a **place in the tree** (e.g. inspector or panel) that renders LinkTargetPicker and wires it to state.

### State wiring

- To persist the user’s choice, the UI that hosts LinkTargetPicker must:
  - Read current `navTargets` for the current screen from state (e.g. `getState()?.layoutByScreen?.[screenKey]?.navTargets`).
  - On `onChange`, merge the new target for the current element into that map and **dispatch** `layout.setNavTargets` with `{ screenKey, navTargets }`.  
- **Currently nothing in the codebase dispatches `layout.setNavTargets`**, so even if LinkTargetPicker were rendered, its `onChange` would need to be wired to that dispatch (and to a “selected element” concept).

---

## 6. SAVE / LOAD FLOW

**Files:**  
`src/04_Presentation/lib-layout/save-current-as-template.ts`,  
`src/04_Presentation/lib-layout/template-profiles.ts`

### How navTargets are persisted

- **buildTemplateFromTree(root, options):**  
  If `options.navTargets` is provided and non-empty, the built template object includes `navTargets` (see `save-current-as-template.ts`). So the **template profile** (and any JSON saved from it) can carry `navTargets` per screen.

- **TemplateProfile type:**  
  In `template-profiles.ts`, `TemplateProfile` has an optional `navTargets?: Record<string, { toScreenId?: string; toAnchor?: string }>`.

### When they are saved to template JSON

- **Save Layout** in `layout.tsx` (dev chrome):
  - Gets current tree from `getCurrentScreenTree()`.
  - Computes `screenKey = currentScreen.replace(/[^a-zA-Z0-9]/g, "-")`.
  - Reads **navTargets** from state: `getState()?.layoutByScreen?.[screenKey]?.navTargets`.
  - Calls `buildTemplateFromTree(tree, { navTargets })` and serializes the result to JSON for download.
- So **if** `layoutByScreen[screenKey].navTargets` were ever populated (via `layout.setNavTargets`), Save Layout would include them in the downloaded template. Today that state is never set, so the downloaded template never contains navTargets.

### What happens when Save Layout is clicked

- Template is built from the current screen tree plus **current** section/card/organ overrides (from state) and **current** navTargets (from state).
- Section/card/organ come from `layout.override` (dispatched by OrganPanel). navTargets would come from `layout.setNavTargets`, which is never dispatched.
- The file is downloaded as `{id}.json`; it could later be loaded or applied as a template (e.g. via profile loading) so that `profileOverride.navTargets` is set and the renderer uses it.

---

## 7. WHAT THE SYSTEM CURRENTLY DOES

End-to-end flow today:

1. **Screen list:** `/api/screens` is fetched; `setScreenPaths(flattenIndexToPaths(list))` fills the screen registry. Screen IDs are slugified paths.
2. **Navigation at runtime:**  
   If a Button or Card has `nav` (from JSON or from navTargets), tap → `handleTap` → `window.dispatchEvent("navigate", { detail: { toScreenId, toAnchor } })` → behavior-listener → `navigate({ toScreenId, toAnchor })` → `goToScreen(router, …)` → URL/screen change. So the **runtime navigation path works** when `nav` is present.
3. **Where does `nav` come from today?**  
   Only from (a) explicit `nav` in screen JSON, or (b) `profileOverride.navTargets` (e.g. a loaded template). **State is never the source** because nothing ever dispatches `layout.setNavTargets`.
4. **Renderer:** Correctly reads `layoutByScreen[screenId].navTargets` and `profileOverride.navTargets`, and injects `nav` into Button/Card by element id/role/path. So **injection is implemented** but the state branch is never populated.
5. **Save:** Save Layout correctly reads `layoutByScreen[screenKey].navTargets` and passes them into `buildTemplateFromTree`. So **save is implemented** but, again, navTargets in state are always empty.
6. **Dev UI:** LinkTargetPicker exists and would list screens and set `{ toScreenId, toAnchor }`, but it is **never rendered**, and there is **no handler** that dispatches `layout.setNavTargets` when the user picks a target.

So: **backend, state shape, renderer, and save are in place; the only missing piece is a dev UI that (1) shows LinkTargetPicker for a chosen button/card and (2) writes choices to state via `layout.setNavTargets`.**

---

## 8. WHAT UI SHOULD EXIST

- **Screen registry:** Already populated; no extra UI required.
- **Link target assignment (dev):**
  - When in **dev mode**, the user should have a way to **select a button or card** (e.g. click in the tree, or in an “Inspector” that highlights elements and shows the selected one).
  - For the **selected element**, a **“Link target”** (or “Navigate to”) control should appear:
    - A **dropdown** listing all screens (from `getAllScreens()`), e.g. “Screen — screenId”.
    - An **optional anchor** field.
    - On change, the app should update **state** for the current screen: merge the new `{ toScreenId, toAnchor }` for that element’s id into `layoutByScreen[screenKey].navTargets` and dispatch `layout.setNavTargets`.
  - That control is exactly what **LinkTargetPicker** provides; it just needs to be **mounted** and **wired** to selection + state.
- **Where it should live:**  
  Either:
  - In the **Organ Panel** (right sidebar in dev), e.g. a section “Link target” when the selected node is a button/card, or
  - In an **Inspector** panel (e.g. in the left diagnostics rail) that shows “selected element” props and includes LinkTargetPicker when the element is a button or card.

---

## 9. WHY THE USER CANNOT SEE THEM

1. **LinkTargetPicker is never used** — no component imports or renders it.
2. **No “selected element” + “nav” editing flow** — there is no UI that:
   - Tracks “current selected button/card” (by id or role), and
   - Renders LinkTargetPicker for that element and dispatches `layout.setNavTargets` on change.
3. **No dispatch of `layout.setNavTargets`** — so even if a user could type a screen ID somewhere, state would never be updated. The only way to get navTargets today is from template JSON (profileOverride), not from the builder.

So the navigation system is **invisible** because the **dev UI to assign and persist link targets** was never wired: no place to show the picker and no state write when the user chooses a target.

---

## 10. WHAT BUTTONS OR PANELS SHOULD EXIST

- **In dev mode:**
  1. **Way to select a button or card**  
     - e.g. “Select element” in the inspector, or click on a button/card in the preview and have it become “selected” (with its id/role stored).
  2. **“Link target” (or “Navigate to”) block**  
     - Visible when the selected element is a Button or Card.
     - Contains **LinkTargetPicker** (screen dropdown + optional anchor).
     - Label can show the element id/role (e.g. “Link target (cta-primary)”).
  3. **Persistence**  
     - On change, dispatch `layout.setNavTargets` with current `screenKey` and the updated navTargets map (current map for that screen with the selected element’s key updated).
- **Save Layout**  
  - Already in the dev chrome; it already saves navTargets from state. Once state is written by the new UI, Save Layout will include navTargets in the downloaded template.

No new top-level panels are strictly required; the Link target block can live inside an existing dev panel (Organ Panel or Inspector).

---

## 11. STEP-BY-STEP USAGE (INTENDED)

1. **Create a button**  
   - Add a Button (or Card) to the screen JSON with a stable `id` (e.g. `"cta-primary"`). Or use an existing button.
2. **Assign a screen target**  
   - Enter dev mode (`/dev`, devMode === "dev").
   - Select that button/card (e.g. via inspector or Organ Panel “selected element”).
   - In the “Link target” block, open the screen dropdown (LinkTargetPicker), choose a screen, optionally set an anchor.
   - On change, the app dispatches `layout.setNavTargets` so `layoutByScreen[screenKey].navTargets[elementId] = { toScreenId, toAnchor }`.
3. **Save navigation**  
   - Click **Save Layout** in the dev chrome. The template JSON is built with current `navTargets` from state and downloaded. That file includes `navTargets` for the current screen.
4. **Runtime**  
   - When the screen is rendered, JsonRenderer passes `navTargets` (from state or profile) into the tree; the button/card gets `nav` and on tap dispatches `navigate` → `goToScreen` → screen change.

Today step 2 is impossible because there is no UI to select the element and no dispatch of `layout.setNavTargets`.

---

## 12. RECOMMENDED FIX PLAN (MINIMAL)

**Objective:** Make Screen-ID navigation visible and usable in the builder without refactoring architecture or rewriting navigation logic.

1. **Introduce “selected nav element” in dev**  
   - Add minimal state (e.g. in a small store or React state in layout/dev) for “current element id (or role) we’re editing nav for” and optionally “current screenKey.”  
   - Provide a way to set this when the user selects a button/card (e.g. from a list of buttons/cards on the current screen, or from an inspector that discovers elements with `data-hi-element` / `data-node-id` and lets the user pick one).  
   - Keep scope small: e.g. a dropdown “Edit link for: [list of button/card ids on this screen]” or a single “selected element id” that the user sets by clicking in the preview (if click-to-select is already or can be added).

2. **Render LinkTargetPicker and wire to state**  
   - In the same place (Organ Panel or Inspector), when “selected nav element” is set and that element is a button or card:
     - Render **LinkTargetPicker** with:
       - `devMode="dev"` (from existing devMode),
       - `value`: from `getState()?.layoutByScreen?.[screenKey]?.navTargets?.[elementId] ?? {}`,
       - `onChange`: (nav) => dispatch `layout.setNavTargets` with `screenKey` and `navTargets` = current map for that screen with `navTargets[elementId] = nav`,
       - `elementId`: selected element id/role.
   - Ensure `screenKey` used here matches the one used by the renderer and by Save Layout (e.g. same normalization as in dev/page.tsx and layout.tsx).

3. **Optional: load template with navTargets**  
   - If templates are loaded from JSON (e.g. from a previously saved file), ensure that when a template is applied, its `navTargets` are passed as part of the profile (e.g. `profileOverride.navTargets`) or merged into state for the current screen so that the renderer and Save flow see them. (This may already work if the profile is applied with `navTargets`; verify and document.)

4. **Do not change**  
   - Screen registry, slugify, or `/api/screens`.  
   - Button/Card tap handling or the `navigate` event contract.  
   - state-resolver handling of `layout.setNavTargets`.  
   - JsonRenderer logic that injects `nav` from `navTargets`.  
   - Save Layout logic that reads navTargets from state and passes them to `buildTemplateFromTree`.

**Result:** User can select a button/card in dev, set its link target via LinkTargetPicker, have that stored in state, see navigation work at runtime, and persist it with Save Layout. No new navigation architecture; only the missing UI and one state write path are added.

---

*End of report.*
