# DEAD FILE + STRUCTURE CLEANUP AUDIT

**Mode:** READ ONLY. No files were deleted, moved, or modified.

**Objective:** Map files/folders that are unused, pure re-exports, legacy, safe to archive/delete, or core runtime.

---

## SECTION 1 — UNUSED FILES (zero imports)

Files that are **never imported** from any other `.ts`/`.tsx` in `/src` (and are not entry points like `app/page.tsx`, `app/layout.tsx`, or API routes).

### Safe delete (high confidence)

| File | Reason |
|------|--------|
| `src/behavior/behavior-listerner.ts` | Typo in name (`listerner`). Runtime uses `@/engine/core/behavior-listener`. This file is a debug duplicate and is **never imported** anywhere. |

### Verify first (may be dynamic or script entry)

| File | Reason |
|------|--------|
| `src/engine/runners/engine-runner.tsx` | No imports found. Only referenced in a comment in `app-loader.tsx`. Could be legacy or intended for dynamic load. |
| `src/engine/loaders/theme-loader.ts` | No imports from `@/engine/loaders/theme-loader` anywhere. `ui-loader` and `ux-loader` are used; theme-loader is not. |
| `src/compounds/ui/definitions/registry.ts` | Re-exports `compound-definitions.json`. Only `@/compounds/ui/index` is imported by json-renderer and tests; index uses the JSON directly. This file is redundant. |

### Possible dead (folder not referenced by runtime)

| Folder / files | Reason |
|----------------|--------|
| `src/logic/orchestration/*` (`integration-flow-engine.tsx`, `next-step-reason.ts`, `Onboarding-flow-router.tsx`) | No runtime code imports from `@/logic/orchestration`. `@/logic/engines/Onboarding-flow-router` is used instead. Orchestration appears to be legacy/duplicate. Only mentioned in generated docs. |

---

## SECTION 2 — UNUSED FOLDERS

Folders under `/src` that are **not referenced by runtime** (no `from "@/..."` or `from "..."` into that folder from app, engine, layout, logic, state, etc.).

| Folder | Classification | Notes |
|--------|----------------|-------|
| `src/cursor/` | **Possible dead zone** | Plans, audits, RULES, workflow. No code imports from cursor. Documentation/process only. |
| `src/docs/` | **Possible dead zone** | Generated and hand-written docs. Not part of runtime. |
| `src/refactor_ROUND 1/`, `refactor_ROUND 2/`, `refactor_ROUND 3/` | **Possible dead zone** | Refactor plans and execution docs. Not imported. |
| `src/KNOCKOUT/` | **Possible dead zone** | Markdown notes. Not imported. |
| `src/system-architecture/` | **Possible dead zone** | Architecture docs. Not imported. |
| `src/system-reports/` | **Possible dead zone** | Reports and snapshots. Not imported. |
| `src/temp files/` | **Possible dead zone** | Single `.txt` hold file. Not imported. |
| `src/map (old)/` | **Legacy** | Old map engine (`.ts`, `.json`, `.txt`). No imports from this path in codebase. |
| `src/engine/system7/` | **Possible dead zone** | Channels, definitions, sensors, system7-router, system7.tsx. No external file imports `@/engine/system7` or any subpath. Only internal references within system7. |
| `src/apps-offline/` | **Data / authority** | Mostly JSON + 1 TS file. Referenced by API routes, screen-loader (path), and tests. **Keep** as data. |

**Referenced top-level folders (used by runtime):**  
`app`, `behavior`, `compiler`, `components`, `compounds`, `config`, `contracts`, `content` (organs tests), `debug`, `dev`, `devtools`, `engine` (except system7, theme-loader, engine-runner), `layout`, `layout-organ`, `lib`, `logic`, `organs`, `palettes`, `registry`, `scans`, `screens`, `scripts` (as CLI, not as imports), `state`, `styles`, `system` (contracts re-export), `types`, `ui`, `ux`.

---

## SECTION 3 — PURE RE-EXPORT FILES

Files that **only** re-export from another file (barrel or bridge). Suggest: **absorb** = inline into consumers and remove; **keep** = retain as single public API.

| File | Re-exports from | Suggestion |
|------|-----------------|------------|
| `src/contracts/index.ts` | SystemContract, contract-verbs, layout-node-types, ui-node, expected-params, renderer-contract | **Keep** — single contracts surface. |
| `src/behavior/contract-verbs.ts` | `@/contracts/contract-verbs` | **Absorb** — single line; consumers could use `@/contracts/contract-verbs` directly. |
| `src/engine/types/ui-node.ts` | `@/contracts/ui-node` | **Keep** — engine namespace. |
| `src/layout/layout-node-types.ts` | `@/contracts/layout-node-types` | **Keep** — layout namespace. |
| `src/system/contracts/SystemContract.ts` | `@/contracts/SystemContract` | **Absorb** — one line; avoid duplicate path. |
| `src/logic/onboarding-engines/abc.engine.ts` | `@/logic/engines/abc.engine` | **Keep** — onboarding-engines as facade. |
| `src/logic/onboarding-engines/calculator.engine.ts` | `@/logic/engines/calculator/calculator.engine` | **Keep** — same. |
| `src/logic/onboarding-engines/learning.engine.ts` | `@/logic/engines/learning.engine` | **Keep** — same. |
| `src/logic/onboarding-engines/summary.engine.ts` | `@/logic/engines/summary/summary.engine` | **Keep** — same. |
| `src/layout/index.ts` | page, component, resolver, compatibility, lib/layout (preset, molecule, card) | **Keep** — layout facade. |
| `src/layout/compatibility/index.ts` | compatibility-evaluator, content-capability-extractor | **Keep** — compatibility surface. |
| `src/lib/layout/index.ts` | Default export of `presentation-profiles.json` | **Keep** — data authority. |
| `src/lib/product-screen-adapter/index.ts` | compileProductDataToScreen | **Keep** — thin barrel. |
| `src/logic/engine-system/engine-contract.ts` | Also exports `getActionHandler` from action-registry | **Keep** — not pure re-export; contract + registry bridge. |

---

## SECTION 4 — CORE TRUNK MAP (runtime spine)

Canonical runtime flow (entry → core modules). No refactors suggested; mapping only.

1. **Entry**
   - `app/page.tsx` — main screen; uses `loadScreen`, `JsonRenderer`, state-store, layout-store, organs, layout-organ, `composeOfflineScreen`, skin bindings.
   - `app/layout.tsx` — root layout; installs **behavior-listener**, state-store, layout-store, palette-store, template list.

2. **Behavior listener**
   - `engine/core/behavior-listener.ts` — `installBehaviorListener`; routes CustomEvent → state-store, `behavior-runner`, navigate. Used only by `app/layout.tsx`.

3. **Action runner**
   - `logic/runtime/action-runner.ts` — `runAction`; uses `getActionHandler` from **engine-contract**.
   - `logic/engine-system/engine-contract.ts` — engine facade; re-exports `getActionHandler` from `logic/runtime/action-registry`.

4. **Engine contract**
   - `logic/engine-system/engine-contract.ts` — `applyEngine`, `getPresentation`, engine list; used by flow-loader, engine-viewer, FlowRenderer, OnboardingFlowRenderer, IntegrationFlowEngine.

5. **Layout facade**
   - `layout/index.ts` — exports page layout, component layout, resolver, compatibility, `LayoutMoleculeRenderer`, lib/layout preset/molecule/card helpers.
   - Consumed by: page.tsx, layout-organ, section compound, lib/site-renderer, molecule compounds, etc.

6. **State store**
   - `state/state-store.ts` — `getState`, `subscribeState`, `dispatchState`. Used by page, layout, behavior-listener, screen-loader, json-renderer, engine bridge, actions, resolvers, devtools.

7. **JSON renderer**
   - `engine/core/json-renderer.tsx` — `JsonRenderer`; renders node tree; uses Registry, layout-store, palette-store, state-store, contracts, pipeline trace. Used by page.tsx, SiteSkin, trial/premium/json-skin screens, engine-runner (if ever loaded).

8. **Screen loader**
   - `engine/core/screen-loader.ts` — `loadScreen(path)`; TSX descriptor or fetch `/api/screens/*`; dispatches state when JSON has default state. Used by `app/page.tsx`, `app-loader.tsx`.

9. **Supporting (same trunk)**
   - `engine/core/layout-store.ts` — layout snapshot/subscribe.
   - `engine/core/palette-store.ts` — palette name/subscribe (and `@/palettes`).
   - `engine/core/current-screen-tree-store.ts` — current composed tree.
   - `organs/index.ts` + `layout-organ/index.ts` — organs and organ layout; used by page, section compound, compatibility.
   - `lib/screens/compose-offline-screen.ts` — composes screen with experience/template; used by page.
   - `logic/bridges/skinBindings.apply.ts` — skin bindings; used by page, SiteSkinPreviewScreen.

---

## SECTION 5 — SAFE CLEANUP PLAN

Categorization only. **Do not delete, move, or rename** without separate approval.

### Immediate delete safe (after quick verification)

- `src/behavior/behavior-listerner.ts` — Duplicate of behavior-listener with typo; never imported.

### Archive safe (move to `/archive` or docs, not delete)

- `src/cursor/` — Plans and audits.
- `src/refactor_ROUND 1/`, `refactor_ROUND 2/`, `refactor_ROUND 3/` — Refactor docs.
- `src/docs/` — If consolidating docs elsewhere.
- `src/KNOCKOUT/` — Notes.
- `src/system-architecture/` — Architecture docs.
- `src/system-reports/` — Generated reports.
- `src/map (old)/` — Legacy map engine.
- `src/logic/orchestration/` — If `logic/engines` is canonical for Onboarding-flow-router and flow logic.
- `src/engine/system7/` — Unused from runtime; archive if not planned for use.
- `src/temp files/` — Temp/hold content.

### Verify before any change

- `src/engine/runners/engine-runner.tsx` — Confirm no dynamic import or future use.
- `src/engine/loaders/theme-loader.ts` — Confirm no build or runtime use.
- `src/compounds/ui/definitions/registry.ts` — Redundant with `compounds/ui/index.ts`; absorb or remove after confirming no external imports.

### Leave alone (core or actively used)

- **Core runtime:** `app/`, `engine/core/`, `engine/bridge/`, `engine/onboarding/`, `engine/site-runtime/`, `engine/debug/`, `engine/devtools/`, `engine/loaders/` (ui-loader, ux-loader), `engine/schedulers/`, `engine/selectors/`, `engine/core/global-scan.engine.ts`.
- **Layout:** `layout/`, `layout-organ/`, `lib/layout/`.
- **Logic:** `logic/` (except orchestration if archived), including `engine-system`, `runtime`, `engines`, `flows`, `bridges`, `actions`, `controllers`, `registries`, `research`, `value`, `products`, etc.
- **State:** `state/`.
- **Contracts / config:** `contracts/`, `config/`.
- **Data / authorities:** `behavior/` (minus behavior-listerner), `lib/`, `palettes/`, `registry/`, `content/`, `apps-offline/`, `scans/`.
- **UI:** `components/`, `compounds/`, `organs/`, `screens/`, `ui/`, `ux/`, `types/`.
- **Tooling / scripts:** `scripts/`, `debug/`, `devtools/`, `dev/`, `diagnostics/` (used by diagnostics provider).

---

*End of audit. No files were modified.*
