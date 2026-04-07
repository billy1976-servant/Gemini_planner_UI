# Container Creations Landing System — Refactor Report

## Summary

The Container Creations landing system was refactored so that **JSON configuration is the single source of truth** for flow logic, navigation, inline controls, and node representation. Hardcoded step logic was removed from the TSX; the Nodes panel in the dev sidebar now displays the landing flow (screens as nodes, nextScreenId and goto targets as connections).

---

## 1. Files Updated

| File | Changes |
|------|--------|
| `src/01_App/(live) Business/Container_Creations/landing-2.tsx` | Removed all hardcoded step ids; added `lightTheme`, `nodePosition` to Screen type; navigation and layout derived from config; register `landingFlowScreens` with dev sidebar when in editor; refined summary text. |
| `src/01_App/(live) Business/Container_Creations/landing-2.json` | Added `lightTheme: true` for intro, structural-fit, ventilation; added optional `nodePosition` on intro; all screens already had `nextScreenId` and `inlineControls`. |
| `src/app/api/container-creations-landing-config/route.ts` | Variant `v3` maps to `ContainerCreationsLanding-3.json`; added `FALLBACK_FILENAME`; when requested variant file is missing, serve fallback (default config). |
| `src/app/ui/control-dock/dev-right-sidebar-store.ts` | Added `LandingFlowScreen` type and `landingFlowScreens?: LandingFlowScreen[]` to `DevSidebarPropsFromPage`. |
| `src/04_Presentation/components/organs/tsx/website/DevNodePanel.tsx` | When `landingFlowScreens` is set, render **Landing flow** view: list of nodes (id, title, layout, inlineControls, nextScreenId, buttons, nodePosition) and a **Connections** section (nextScreenId and goto targets). |

---

## 2. Renderer Changes (TSX)

### Removed
- **Hardcoded step ids** for styling and layout:
  - `isLightStep` was `["intro", "structural-fit", "ventilation"].includes(currentScreenId)` → now `currentScreen.lightTheme === true`.
  - `isHero` was `currentScreenId === "intro"` → now `currentScreen.layout === "hero"`.
  - twoCol branch used `screen.id === "ventilation"` for light card and button placement → now `screen.lightTheme === true`.
  - Root `className` used `currentScreenId === "structural-fit"` and `currentScreenId === "ventilation"` → now `currentScreen.layout === "stamped"` and `currentScreen.layout === "twoCol" && currentScreen.lightTheme`.
  - `main` minHeight used `currentScreenId === "ventilation"` → now `currentScreen.layout === "twoCol" && currentScreen.lightTheme`.

### Added / Kept (config-driven)
- **Navigation**: `goNext()` uses `currentScreen.nextScreenId` if set, else next screen in array; `goBack()` uses array index; buttons use `button.target` for `goto`, `goNext`/`goBack` for `next`/`back`, `resolveHref(cfg)` for `link`.
- **Inline controls**: `renderInlineUI(screen, isLight)` uses `screen.inlineControls ?? []` and `renderInlineControl(type, isLight)` for each type (containerLength, roofRibHeight, ventFitVerified, ventCount, orderSizeConfirmed).
- **Dynamic summary**: When `screen.dynamicSummary === true`, textOnly layout shows `getFinalRecommendationSummary()` built from `stepInputs`.
- **Screen type**: Optional `lightTheme?: boolean` and `nodePosition?: { x: number; y: number }` for styling and future graph editor.

### Layouts supported (unchanged)
- `hero` — video hero + title/subtitle/content/buttons.
- `stamped` — stamped section with video and checklist.
- `twoCol` — two-column (text + media); when `lightTheme` true, full-width light background and buttons below.
- `twoColImageLeft` — image left, text + inline + buttons right.
- `textOnly` — title + content or dynamic summary + link buttons.

---

## 3. Node Integration (Sidebar)

- **Store** (`dev-right-sidebar-store.ts`): `DevSidebarPropsFromPage` now includes `landingFlowScreens?: LandingFlowScreen[]` with `id`, `title`, `stepLabel`, `layout`, `nextScreenId`, `inlineControls`, `nodePosition`, `buttons` (type, target, nodeId).
- **Registration**: When `landing-2` mounts with **editor mode** and config loaded, it calls `setDevSidebarProps({ ...prev, landingFlowScreens: config.screens mapped to LandingFlowScreen })` and clears it on unmount.
- **Nodes panel** (`DevNodePanel.tsx`): If `landingFlowScreens.length > 0`, it renders **Landing flow (from JSON)** instead of the website node-order UI. For each screen it shows:
  - Title, id, layout
  - Optional inlineControls, nextScreenId, goto targets from buttons, nodePosition
  - A **Connections** block: lines `fromId → toId` for nextScreenId and for each goto button target.

**Note**: The Nodes panel shows the flow when the landing component is mounted in the **same window** as the dev layout (e.g. when the dev page renders the landing directly). If the dev preview uses an iframe, the store is not shared; the dev page could alternatively fetch `/api/container-creations-landing-config` when the selected screen is the landing and set `landingFlowScreens` from the response.

### Node editor updating JSON (task 8)
- **Not implemented** in this refactor. Persisting node order, connections, or title/content changes would require a write API (e.g. PATCH that updates the JSON file or a backend store) and wiring the Nodes panel (or a dedicated graph editor) to call it. The current Nodes panel is read-only for the landing flow.

---

## 4. Validation Logic (Inline Controls)

All validation remains in the TSX; control behavior is driven by `screen.inlineControls` from JSON.

| Control | UI | Validation |
|--------|----|------------|
| **containerLength** | Select (20ft / 40ft) | Options only; no range validation. |
| **roofRibHeight** | Number input (inches) | `ROOF_RIB_HEIGHT_MIN` 1.5 – `ROOF_RIB_HEIGHT_MAX` 2.5 in.; message “Within typical range” or “Typical range is 1.5–2.5 in. Confirm your measurement.” |
| **ventFitVerified** | Checkbox | Boolean; no validation. |
| **ventCount** | Number input | Min 1, max 10; message “We recommend N vent(s) for your setup” or “Enter 1–10.” |
| **orderSizeConfirmed** | Checkbox | Boolean; no validation. |

---

## 5. JSON Schema (Confirmed)

Each **screen** in `screens[]` may include:

```ts
{
  "id": string,
  "stepLabel": string,
  "layout": "hero" | "stamped" | "twoCol" | "twoColImageLeft" | "textOnly",
  "title": string,
  "subtitle"?: string,
  "content": ContentBlock[],
  "media": MediaBlock[],
  "buttons": ButtonBlock[],
  "nextScreenId"?: string,
  "inlineControls"?: ("containerLength"|"roofRibHeight"|"ventFitVerified"|"ventCount"|"orderSizeConfirmed")[],
  "dynamicSummary"?: boolean,
  "lightTheme"?: boolean,
  "nodePosition"?: { "x": number, "y": number }
}
```

- **nextScreenId**: Used by “Next” and by `goNext()` when present; otherwise next item in `screens` array.
- **inlineControls**: Which inline verification controls to show on that screen.
- **dynamicSummary**: If true, textOnly layout shows the recommendation summary from collected inputs.
- **lightTheme**: If true, header and step use light theme (e.g. white background); drives `measure-step-active` when layout is twoCol.
- **nodePosition**: Optional; for future graph editor positioning; displayed in Nodes panel when present.

Root config: `shopUrl`, `header`, `stepTracker`, `screens`.

---

## 6. Variant Configs (API)

- **Endpoint**: `GET /api/container-creations-landing-config?variant=vX`
- **Mapping**:  
  - `default` → `landing-2.json`  
  - `v1` → `ContainerCreationsLanding-v1.json`  
  - `v2` → `ContainerCreationsLanding-v2.json`  
  - `v3` → `ContainerCreationsLanding-3.json`
- **Fallback**: If the file for the requested variant is missing, the API serves `FALLBACK_FILENAME` (`landing-2.json`).
- **ContainerCreationsLanding-3.json**: Uses a different schema (`steps[]` with `instruction`, `input`, `next`, etc.). The current TSX expects `screens[]`. Using `-3.json` with the same renderer would require an adapter (steps → screens) or a separate component; not included in this refactor.

---

## 7. Dynamic Summary Example

When `screen.dynamicSummary === true`, the summary is built from `stepInputs` in this style:

- **Example**: `"Container: 40ft. Roof rib height: 2 in. Recommended vents: 2 × 12-inch. Vent fit verified. Order size confirmed."`
- **Logic**: Concatenate container length, roof rib height, recommended vent count × 12-inch, and optional vent fit / order size lines; fallback: “Complete the steps above to see your recommendation.”

---

## 8. Layouts Verified

- **hero** — Intro with video and CTA.
- **stamped** — Structural fit with video and checklist.
- **twoCol** — Used for ventilation (lightTheme), continue, why-we-lead; light variant gets full-width light background and buttons below.
- **twoColImageLeft** — Choose vent with image left.
- **textOnly** — Final recommendation with dynamic summary and link button.

All are driven by `screen.layout` and `screen.lightTheme` with no remaining hardcoded screen ids in the TSX.
