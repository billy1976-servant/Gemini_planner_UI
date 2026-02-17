# Navigator JSON-First Restore

**Date:** 2026-02-16  
**Goal:** Restore JSON-first Navigator behavior; remove TSX as primary nav; keep dev-mobile CSS and hamburger panels wrapping the original navigator.

## Summary

- **JSON apps are primary again:** Screens dropdown shows PROJECT (JSON) first, TSX/System last. Default selection is first JSON category.
- **No TSX as default home:** DevHome no longer blocks the Navigator on first load; Navigator is the default view.
- **Scroll and mobile:** Content area has a proper scroll container in dev-mobile mode; existing dev-mobile-mode CSS and hamburger panels unchanged and wrap the same navigator.

## Files Changed (no full reverts; targeted fixes only)

| File | Change |
|------|--------|
| `src/app/components/CascadingScreenMenu.tsx` | **JSON-first grouping:** `groupCategories()` now puts PROJECT (JSON) first, "TSX / System" last. Added `firstJsonCategory()` and use it for initial hover so the first selected category is always a JSON app. |
| `src/app/dev/DevHome.tsx` | **Navigator default:** `useDevHomeDismissed()` now treats missing sessionStorage as dismissed (show Navigator). Only `sessionStorage "0"` shows DevHome; otherwise Navigator is shown. |
| `src/07_Dev_Tools/styles/dev-mobile.css` | **Scroll container:** `.app-content` in dev-mobile-mode gets `overflow-y: auto`, `overflow-x: hidden`, `-webkit-overflow-scrolling: touch`, `min-height: 0` so the main content scrolls. |

## What Was Not Touched

- `blueprint.txt`, `content.txt`
- Compile pipeline, engines, app.json generation
- Firebase, state logic
- Registry, JSON screen loading, runtime
- dev-mobile-mode class, useDevMobileMode hook, hamburger panels, or panel CSS

## Confirmation: JSON-First Navigation

1. **Screens dropdown:** First section is "PROJECT" (JSON app categories). Second section is "TSX / System" (tsx:*). Default selected category when opening the menu is the first JSON category.
2. **Default view:** Visiting `/dev` shows the Navigator (chrome + Screens dropdown + content area). DevHome overlay only appears if `sessionStorage.dev_home_dismissed === "0"`.
3. **API order unchanged:** `/api/screens` still returns JSON categories then TSX; no API or pipeline changes.
4. **Mobile:** dev-mobile-mode CSS and hamburger panels still apply; they wrap the same Navigator. Content area scrolls correctly on phone.
