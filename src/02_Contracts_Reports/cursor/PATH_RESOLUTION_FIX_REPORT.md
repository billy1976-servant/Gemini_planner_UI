# Path Resolution Fix Report

**Date:** 2026-02-07  
**Scope:** Configuration-only stabilization. No logic changes, no file moves, no folder renames.

---

## 1. Webpack override removed

**File:** `next.config.js`

- Any webpack alias of the form `"@/apps-tsx": path.resolve(__dirname, "src/screens")` has been **deleted**.
- No replacement alias was added. Next.js now resolves `@/apps-tsx` via tsconfig paths only.
- A comment in the webpack callback documents this: *"No @/apps-tsx override — Next resolves via tsconfig paths (src/apps-tsx)."*

---

## 2. TSConfig paths confirmed (single source of truth)

**File:** `tsconfig.json`

The following are in place and unchanged from the canonical set:

- `"baseUrl": "."`
- In `paths`:
  - `"@/*": ["src/*"]`
  - `"@/apps-tsx": ["src/apps-tsx"]`
  - `"@/apps-tsx/*": ["src/apps-tsx/*"]`
  - `"@/apps-json": ["src/apps-json"]`
  - `"@/apps-json/*": ["src/apps-json/*"]`

All other existing path entries (e.g. `@/engine/*`, `@/components/*`, etc.) were **not** removed.

---

## 3. require.context root fixed

**File:** `src/app/page.tsx`

- **Before:** `require.context("../../apps-tsx", true, /\.tsx$/)`  
  From `src/app/`, `../../apps-tsx` resolved to project-root `apps-tsx` (non-existent).
- **After:** `require.context("../apps-tsx", true, /\.tsx$/)`  
  From `src/app/`, `../apps-tsx` resolves to `src/apps-tsx`.

No other logic in this file was changed.

---

## 4. Dynamic imports unchanged

**File:** `src/app/page.tsx`

- The dynamic import remains: `` import(`@/apps-tsx/${normalized}`) ``.
- With the webpack override removed and TSConfig as the single source of truth, this now resolves to `src/apps-tsx` at build and runtime.

---

## 5. Physical folders confirmed

- **`src/apps-tsx/`** — Exists. Contains TSX screens and related assets.
- **`src/apps-json/`** — Exists. Contains JSON app definitions (e.g. under `apps/`).

**Not recreated (and must not be):**

- `src/screens` — Do not recreate.
- `src/apps-offline` — Do not recreate.

---

## 6. Summary

- **Webpack override:** Removed; no alias for `@/apps-tsx` in `next.config.js`.
- **TSConfig:** Single source of truth for `@/apps-tsx` and `@/apps-json` (base + wildcard entries).
- **require.context:** Fixed to `"../apps-tsx"` so the context root is `src/apps-tsx`.
- **Physical layout:** `src/apps-tsx` and `src/apps-json` are the only canonical roots; no `src/screens` or `src/apps-offline`.

**Note:** `src/apps-tsx` is now the single runtime root for TSX screens. All TSX screen discovery and dynamic imports resolve against this folder via TSConfig; no webpack override and no escaped relative path.
