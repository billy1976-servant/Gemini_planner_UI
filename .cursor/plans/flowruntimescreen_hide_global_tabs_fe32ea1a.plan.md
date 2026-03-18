---
name: FlowRuntimeScreen Hide Global Tabs
overview: Conditionally hide global layout tabs (top app chrome and/or bottom nav) when the current dev screen is FlowRuntimeScreen, using URL-based detection in the root layout, without affecting other pages.
todos: []
isProject: false
---

# Conditionally disable global layout tabs for FlowRuntimeScreen

## Current state

- **Root layout**: [src/app/layout.tsx](src/app/layout.tsx) — `RootLayoutBody` renders the dev UI when `pathname === "/dev"` (via `isUserMode`). It already has:
  - **Top chrome** (lines 341–399): `app-chrome` with "HIclarify Navigator", `CascadingScreenMenu`, `DevicePreviewToggle`, `EditorPreviewToggle`, Save Layout, Sections, GoogleLoginButton.
  - **Bottom nav** (lines 353–364): `#screen-ui-layer` with `BottomNavBar_Text` — **already conditionally hidden** when `isOnboardingTsx` is true (`!isOnboardingTsx && (...)`).
- **Screen detection**: `currentScreen` is set from `getCanonicalScreenKey(searchParams)` (line 129). For FlowRuntimeScreen the URL is `/dev?screen=tsx:Runtime/FlowRuntimeScreen` (and optionally `&flowId=...`), so `currentScreen` is `"tsx:Runtime/FlowRuntimeScreen"`.
- **Dev layout**: [src/app/dev/layout.tsx](src/app/dev/layout.tsx) only enables inline editing; it does not render tabs. All tab/nav UI is in the root layout.

## Detection logic

Use the same `currentScreen` already available in `RootLayoutBody` (from `searchParams` via `getCanonicalScreenKey`). No pathname check needed: when on `/dev`, the screen is entirely determined by `?screen=`.

Add a derived flag:

- **Option A (recommended)**: `const isFlowRuntimeScreen = (currentScreen ?? "").includes("FlowRuntimeScreen");`  
Simple and matches any URL that selects the flow runtime (e.g. `tsx:Runtime/FlowRuntimeScreen`).
- **Option B (stricter)**: `const isFlowRuntimeScreen = currentScreen === "tsx:Runtime/FlowRuntimeScreen" || (currentScreen ?? "").endsWith("/FlowRuntimeScreen");`  
Use if you want to avoid false positives for other screens whose names contain "FlowRuntimeScreen".

Implement in [src/app/layout.tsx](src/app/layout.tsx) next to the existing `isOnboardingTsx` (around line 140).

## Conditional rendering

### 1. Bottom nav (required)

The bottom nav is already gated by `!isOnboardingTsx`. Extend the condition so it is also hidden when the screen is FlowRuntimeScreen:

- **Current** (lines 353–364): `{!isOnboardingTsx && ( <div id="screen-ui-layer" ...><BottomNavBar_Text /></div> )}`
- **Change to**: `{!isOnboardingTsx && !isFlowRuntimeScreen && ( ... )}`

This removes the bottom tab strip on FlowRuntimeScreen and fixes the mobile/phone preview layout without touching other screens.

### 2. Top chrome (optional, for full-screen experience)

If the goal is a **full-screen** flow (no top bar either), conditionally hide the entire `devMode === "dev"` block when `isFlowRuntimeScreen` is true. That implies:

- When `isFlowRuntimeScreen`: render only the **page content** (e.g. the same `children` that would go in the canvas), without the editor-root chrome (no Navigator, no CascadingScreenMenu, no device toggles, no left/right sidebars). You can reuse the same `previewContent` / canvas structure but without the outer chrome and without the bottom nav.
- **Exit flow**: Provide a minimal way to get back to the dev shell (e.g. a fixed "Back to Navigator" link or button that navigates to `/dev` or sets `screen` to something else). Otherwise the user cannot leave the flow without changing the URL manually.

If you prefer to **keep** the top chrome (Navigator, screen menu, device toggles) and only fix the broken mobile layout, then **do not** hide the top chrome; hiding only the bottom nav is enough.

## Optional: flag-based architecture

To avoid parsing the URL in the layout and to make it easy for other “runtime” screens to opt out of global nav later:

1. **Store or context**: Add a small store (e.g. `global-nav-store.ts`) or React context with a flag `disableGlobalNav: boolean`.
2. **Layout**: In `RootLayoutBody`, subscribe to the flag (or read from context). When `disableGlobalNav` is true, hide the same elements as above (bottom nav and optionally top chrome). Default the flag to `false`.
3. **FlowRuntimeScreen**: In [src/03_Runtime/engine/onboarding/FlowRuntimeScreen.tsx](src/03_Runtime/engine/onboarding/FlowRuntimeScreen.tsx), set the flag to `true` on mount and reset to `false` on unmount.

Caveat: the layout renders before the page’s component tree. So on first paint, the flag may still be false and the nav may flash. To avoid that, either (a) keep URL-based detection in the layout (e.g. `disableGlobalNav = isFlowRuntimeScreen || store.disableGlobalNav`), or (b) set the flag from the dev page when it resolves the screen to FlowRuntimeScreen (before rendering the TSX), so the layout can read it on the same pass. Option (a) is simpler and avoids a flash.

## What not to do

- Do **not** remove or disable the top/bottom nav globally; only when `isFlowRuntimeScreen` (and optionally when a future `disableGlobalNav` flag is set).
- Do **not** change behavior for other routes: only `/dev` with `screen=...FlowRuntimeScreen` is affected.
- Do **not** rely on pathname alone for “FlowRuntimeScreen” — the route is always `/dev`; the screen is determined by `searchParams.screen`.

## Summary


| Task                           | Action                                                                                                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Where tabs are**             | Root layout [src/app/layout.tsx](src/app/layout.tsx): top `app-chrome` (CascadingScreenMenu, etc.) and bottom `#screen-ui-layer` with `BottomNavBar_Text`.                                          |
| **Detect FlowRuntimeScreen**   | In `RootLayoutBody`, add `isFlowRuntimeScreen = (currentScreen ?? "").includes("FlowRuntimeScreen")` (or stricter check). `currentScreen` already comes from `getCanonicalScreenKey(searchParams)`. |
| **Hide bottom nav**            | Change condition from `!isOnboardingTsx` to `!isOnboardingTsx && !isFlowRuntimeScreen` for the block that renders `BottomNavBar_Text`.                                                              |
| **Hide top chrome (optional)** | When `isFlowRuntimeScreen`, render a full-screen layout (content only, no app-chrome, no sidebars) and add a minimal “Back to Navigator” control.                                                   |
| **Optional flag**              | Add `disableGlobalNav` store/context; set in FlowRuntimeScreen on mount/unmount; layout reads it. Prefer combining with URL check so first paint is correct.                                        |


Result: FlowRuntimeScreen can render without the global bottom nav (and optionally without the top chrome), giving a full-screen flow and a correct mobile/phone preview, while all other pages keep the existing tabs and layout.