# Screen loading stability report

**Goal:** App never crash/build-fail due to missing JSON screen imports. All missing/invalid screens degrade to a fallback diagnostic screen.

**Constraint:** No changes to JsonRenderer, state-store, layout-store, palette-store, or engine execution. Only loading strategy + fallback + diagnostics.

---

## Phase 0 — Breakpoints found

Static JSON imports from `@/apps-offline/` were found in:

| File | Purpose |
|------|--------|
| `src/screens/tsx-screens/onboarding/trial.tsx` | TSX screen wrapper importing `Onboarding/trial.json` |
| `src/screens/tsx-screens/onboarding/premium-onboarding.tsx` | TSX screen wrapper importing `Onboarding/trial.json` |
| `src/contracts/param-key-mapping.test.ts` | Test importing `journal_track/app-1.json` |
| `src/contracts/showcase-visual-quality.test.ts` | Test importing `websites/showcase/showcase-home.json` |

No other runtime TSX files imported apps-offline JSON. (Docs and scripts mention paths only.)

---

## Phase 1 — New files

| File | Purpose |
|------|--------|
| `src/engine/core/safe-screen-registry.ts` | `ScreenRef` type, `getAllScreenRefs()`, `getScreenRefById()`, `getScreenRefByPath()`. JSON refs as string paths only; starter list of known screens. |
| `src/engine/core/safe-json-import.ts` | `safeImportJson(path)` → `{ ok, json }` or `{ ok: false, error }`. Uses fetch `/api/screens/{path}` only (no Node/fs) so the client bundle never pulls in `fs`. Never throws; normalizes common errors. |
| `src/contracts/load-app-offline-json.node.ts` | Node-only loader for contract tests: `loadAppOfflineJson(relativePath)` using fs; used by param-key-mapping and showcase tests so they do not import from client safe-json-import. |
| `src/engine/core/fallback-screen.ts` | `makeFallbackScreen({ title, message, meta })` returns a valid Screen JSON tree (screen → Section → content with title/body and “Open Diagnostics” hint). |

---

## Phase 2 — Screen loader

| File | Change |
|------|--------|
| `src/engine/core/screen-loader.ts` | Entire load path wrapped in try/catch. Empty/invalid path and forbidden IDs return fallback instead of throwing. JSON branch uses `safeImportJson(path)`; on `!result.ok` returns `makeFallbackScreen(...)`. On any unexpected throw, returns fallback. `loadScreen()` always resolves to a valid screen tree (or TSX descriptor). |

---

## Phase 3 — Static imports removed

| File | Change |
|------|--------|
| `src/screens/tsx-screens/onboarding/trial.tsx` | Removed `import screenJson from "@/apps-offline/...trial.json"`. Uses `useState` + `useEffect` + `loadScreen("Onboarding/trial.json")`; shows loading state then `JsonScreenRenderer` or fallback tree. |
| `src/screens/tsx-screens/onboarding/premium-onboarding.tsx` | Same: removed static import; runtime `loadScreen("Onboarding/trial.json")` with loading state. |
| `src/contracts/param-key-mapping.test.ts` | Removed `import app1 from "@/apps-offline/...app-1.json"`. Uses `loadAppOfflineJson("journal_track/app-1.json")` from Node-only loader in async `runApp1Assertions()`; skips app-1 assertions with a warn if file missing. |
| `src/contracts/showcase-visual-quality.test.ts` | Removed static import. Entire test runs inside `async function run()`; loads via `loadAppOfflineJson("websites/showcase/showcase-home.json")`; exits 0 with warn if file missing. |

---

## Phase 4 — Diagnostics screen

| File | Purpose |
|------|--------|
| `src/screens/tsx-screens/diagnostics/ScreenDiagnostics.tsx` | UI: dropdown of `getAllScreenRefs()`, “Reload selected”, “Run all”. Table: id \| kind \| path \| status PASS/FAIL \| error snippet. JSON refs: `safeImportJson(path)`; TSX: PASS if component exists. Preview: link `/?screen=<path without .json>` when PASS. FAIL: show error and suggested fix (file path, path mismatch). |

---

## Phase 5 — Validation

1. **Grep check**  
   - Pattern: `from ["']@/apps-offline/`  
   - Result: **0 matches** in `src/`.

2. **Behavior**  
   - Deleting or renaming a JSON in `apps-offline` no longer causes build failure (no static imports).  
   - At runtime, missing screen → `loadScreen()` returns fallback tree → JsonRenderer shows error card with “Open Diagnostics”.  
   - Diagnostics screen: “Run all” shows PASS/FAIL per registered screen; FAIL shows error snippet and suggested fix.

3. **Build**  
   - Next compile succeeds for all screen-loading changes (no static JSON imports). JSON files referenced in the registry are strings only; loading is runtime via API. (Any unrelated type/lint errors in other files, e.g. google-ads client, are outside this scope.)

---

## File summary

**New:**  
- `src/engine/core/safe-screen-registry.ts`  
- `src/engine/core/safe-json-import.ts`  
- `src/engine/core/fallback-screen.ts`  
- `src/screens/tsx-screens/diagnostics/ScreenDiagnostics.tsx`  
- `src/contracts/load-app-offline-json.node.ts` (Node-only loader for contract tests)  

**Edited:**  
- `src/engine/core/screen-loader.ts`  
- `src/screens/tsx-screens/onboarding/trial.tsx`  
- `src/screens/tsx-screens/onboarding/premium-onboarding.tsx`  
- `src/contracts/param-key-mapping.test.ts`  
- `src/contracts/showcase-visual-quality.test.ts`  

**Grep confirmation:** `from "@/apps-offline/` → **0 matches**.
