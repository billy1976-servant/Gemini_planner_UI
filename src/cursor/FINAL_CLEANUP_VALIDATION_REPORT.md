# FINAL CLEANUP VALIDATION REPORT

**Mode:** READ-ONLY ANALYSIS. No files were deleted, moved, or modified.

**Objective:** Validate the Dead File + Structure Cleanup Audit and confirm classification with static/dynamic/runtime checks.

---

## 1) STATIC IMPORT GRAPH — VALIDATION RESULTS

### Methodology

- Full scan of `/src` for `from "@/..."` and `from '...'` (relative) imports.
- Checked for dynamic `import()` and `require()` of suspect paths.
- Checked config/build artifacts (e.g. SRC_EXPORT.json) for path references.
- No registration hooks or string-based loaders reference the suspect files below (except where noted).

---

### SAFE_DELETE[] — 100% unused, safe to delete

| File | Static | Dynamic | Config/Ref | Verdict |
|------|--------|---------|------------|---------|
| `src/behavior/behavior-listerner.ts` | No imports | No `import()`/`require()` of this path | No references | **CONFIRMED SAFE DELETE** — Typo duplicate; runtime uses `@/engine/core/behavior-listener` only. |

---

### VERIFY_DYNAMIC[] — No static/dynamic import; possible build or future use

| File | Static | Dynamic | Config/Ref | Verdict |
|------|--------|---------|------------|---------|
| `src/engine/runners/engine-runner.tsx` | No imports from any file | No dynamic import of this path in codebase | **SRC_EXPORT.json** lists `./src/engine/runners/engine-runner.ts` | **VERIFY** — Documented DEAD in refactor plans; export config may be legacy. Confirm SRC_EXPORT.json usage before delete. |
| `src/engine/loaders/theme-loader.ts` | No imports | No dynamic import | No references | **VERIFY** — Zero references. Safe to delete after confirming no build/tooling use. |
| `src/compounds/ui/definitions/registry.ts` | No imports | No dynamic import | No references; json-renderer uses `@/compounds/ui/index` only | **VERIFY** — Redundant with `compounds/ui/index.ts`. Safe to remove after confirming no external imports. |

---

### ARCHIVE_ONLY[] — Not runtime; documentation/plans/legacy

| Folder / path | Import count | Notes |
|---------------|--------------|--------|
| `src/cursor/` | 0 | Plans, audits, RULES. No code imports. |
| `src/docs/` | 0 | Generated and hand-written docs. |
| `src/refactor_ROUND 1/`, `refactor_ROUND 2/`, `refactor_ROUND 3/` | 0 | Refactor execution docs. |
| `src/KNOCKOUT/` | 0 | Markdown notes. |
| `src/system-architecture/` | 0 | Architecture docs. |
| `src/system-reports/` | 0 | Reports and snapshots. |
| `src/temp files/` | 0 | Single hold .txt. |

---

### CORE_DEPENDENCY[] — Confirmed on runtime path

All of the following are imported from app entry points, layout, engine/core, or other trunk modules:

- `engine/core/behavior-listener.ts` — used by `app/layout.tsx`; dynamic import in `scripts/pipeline-proof.ts`.
- `engine/core/json-renderer.tsx` — used by `app/page.tsx`, SiteSkin, trial/premium/json-skin, engine-runner (unused), diagnostics.
- `engine/core/screen-loader.ts` — used by `app/page.tsx`, `components/system/app-loader.tsx`.
- `state/state-store.ts` — used across page, layout, behavior-listener, screen-loader, json-renderer, actions, resolvers, devtools.
- `layout/` (index, page, component, resolver, compatibility) — used by page, layout-organ, section compound, lib/site-renderer, molecules.
- `logic/runtime/` (action-runner, engine-bridge, flow-resolver, etc.) — used by engine-contract, flow-loader, engine-viewer, FlowRenderer, actions.
- `logic/engine-system/` (engine-contract, engine-registry, engine-explain) — used by flow-loader, engine-viewer, FlowRenderer, OnboardingFlowRenderer, action-registry.

---

## 2) DUPLICATE IMPLEMENTATION DETECTION

### DUPLICATE_UNUSED[]

| Canonical (used) | Duplicate (unused) | Evidence |
|------------------|--------------------|---------|
| `engine/core/behavior-listener.ts` | `behavior/behavior-listerner.ts` | Only `engine/core/behavior-listener` is imported (layout.tsx, pipeline-proof). Typo file never referenced. |
| `logic/engines/Onboarding-flow-router.tsx` | `logic/orchestration/Onboarding-flow-router.tsx` | All imports use `@/logic/engines/Onboarding-flow-router`. Orchestration version has different internal import (`./25x.engine`). |
| `logic/engines/next-step-reason.ts` | `logic/orchestration/next-step-reason.ts` | Imports use `@/logic/engines/next-step-reason`. Orchestration file not imported. |
| `compounds/ui/index.ts` (compound-definitions.json) | `compounds/ui/definitions/registry.ts` | Only `@/compounds/ui/index` is imported; registry.ts re-exports same JSON, never imported. |

### LEGACY_ISLAND[]

| Island | Description |
|--------|-------------|
| **engine/system7/** | Entire subtree (channels, definitions, sensors, system7-router, system7.tsx). No external file imports `@/engine/system7` or any subpath. Only self-references and comments. Documented as "isolate; not trunk" in refactor plans. |
| **logic/orchestration/** | Three files: `integration-flow-engine.tsx`, `next-step-reason.ts`, `Onboarding-flow-router.tsx`. Zero imports from rest of codebase. Runtime uses `logic/engines/` equivalents. |
| **map (old)/** | Legacy map engine. No imports from this path. |
| **engine/runners/engine-runner.tsx** | Single file island. Imports JsonRenderer but is never imported; only comment in app-loader and entry in SRC_EXPORT.json. |
| **engine/loaders/theme-loader.ts** | Single file. ui-loader and ux-loader are used; theme-loader has zero references. |

---

## 3) RUNTIME SPINE PROTECTION

The following areas are **confirmed as core trunk**. Nothing here may be removed without breaking the runtime.

| Area | Role | Import / usage |
|------|------|----------------|
| **app/** | Entry: page.tsx, layout.tsx, API routes | Next.js entry; layout imports behavior-listener, state-store, layout-store, palette-store; page imports screen-loader, JsonRenderer, state-store, layout, organs, layout-organ, composeOfflineScreen. |
| **engine/core/** | behavior-listener, json-renderer, screen-loader, layout-store, palette-store, palette-resolver, collapse-layout-nodes, current-screen-tree-store, registry | Used by app, layout, compounds, lib/site-skin, screens, devtools, debug. |
| **layout/** | Page layout, component layout, resolver, compatibility, LayoutMoleculeRenderer | Used by page, layout-organ, section compound, lib/site-renderer, molecule compounds. |
| **state/** | state-store, section-layout-preset-store, organ-internal-layout-store, state-resolver | Used by page, layout, behavior-listener, screen-loader, json-renderer, logic/runtime, actions, devtools. |
| **logic/runtime/** | action-runner, engine-bridge, flow-resolver, calc-resolver, landing-page-resolver, view-resolver, action-registry, engine-state | Used by engine-contract, flow-loader, engine-viewer, FlowRenderer, json-skin.engine, actions. |
| **logic/engine-system/** | engine-contract, engine-registry, engine-explain | Used by flow-loader, engine-viewer, FlowRenderer, OnboardingFlowRenderer, action-registry. |
| **JsonRenderer path** | `engine/core/json-renderer.tsx` | Imported by app/page, SiteSkin, trial, premium-onboarding, json-skin, diagnostics; referenced in scripts/docs. |
| **behavior-listener path** | `engine/core/behavior-listener.ts` | Imported by app/layout; dynamically in pipeline-proof; referenced in scripts/docs. |
| **screen-loader path** | `engine/core/screen-loader.ts` | Imported by app/page, app-loader; referenced in scripts/docs. |

**Protected:** No file in the above paths may be deleted or moved as part of a "dead code" cleanup. Only the files explicitly listed in SAFE_DELETE[] and VERIFY_DYNAMIC[] (after verification) are candidates for removal.

---

## 4) FOLDER-LEVEL USAGE HEATMAP

For each top-level folder under `/src`, approximate **IMPORT_COUNT** (number of files that contain at least one `from "@/folder/..."` import), and classification.

| Folder | IMPORT_COUNT (files) | RUNTIME_IMPORT | DEV_ONLY | DOC_ONLY | LEGACY |
|--------|----------------------|----------------|----------|----------|--------|
| app | 0 (entry) | — | — | — | — |
| behavior | ~3 | Yes | tests | — | — |
| compiler | used by lib/site-compiler | Yes | — | — | — |
| components | 20+ | Yes | — | — | — |
| compounds | 15+ | Yes | — | — | — |
| config | 2 | Yes | — | — | — |
| contracts | 25+ | Yes | tests | — | — |
| content | tests/organs | — | tests | — | — |
| cursor | 0 | — | — | **Yes** | — |
| debug | 3 | — | **Yes** | — | — |
| dev | 1 (section-layout-dropdown) | dev panel | **Yes** | — | — |
| devtools | 6+ | dev panel/trace | **Yes** | — | — |
| diagnostics | 1 | optional | **Yes** | — | — |
| engine | 55+ | Yes | devtools/debug | — | system7, theme-loader, engine-runner |
| layout | 4 (internal) + many from layout index | Yes | — | — | — |
| layout-organ | 4 | Yes | — | — | — |
| lib | 45+ | Yes | scripts | — | — |
| logic | 50+ | Yes | scripts | — | orchestration |
| organs | 5+ | Yes | tests | — | — |
| palettes | 2 | Yes | — | — | — |
| registry | 1 (styler) | Yes | — | — | — |
| scans | 5+ | Yes | — | — | — |
| screens | many (dynamic) | Yes | — | — | — |
| scripts | 0 (CLI) | — | **Yes** | — | — |
| state | 25+ | Yes | — | — | — |
| system | 1 (re-export) | Yes | — | — | — |
| types | 5+ | Yes | — | — | — |
| ui | 5+ | Yes | — | — | — |
| ux | 1 | Yes | — | — | — |
| docs | 0 | — | — | **Yes** | — |
| refactor_* | 0 | — | — | **Yes** | — |
| KNOCKOUT | 0 | — | — | **Yes** | — |
| system-architecture | 0 | — | — | **Yes** | — |
| system-reports | 0 | — | — | **Yes** | — |
| temp files | 0 | — | — | — | — |
| map (old) | 0 | — | — | — | **Yes** |

---

## 5) CONFIRMED SAFE DELETES

After full static/dynamic/config scan:

- **Single file:** `src/behavior/behavior-listerner.ts` — **100% unused**. Safe to delete.

---

## 6) ARCHIVE-SAFE FOLDERS

Safe to move to an `/archive` or docs location (do not delete without policy):

- `src/cursor/`
- `src/docs/`
- `src/refactor_ROUND 1/`, `refactor_ROUND 2/`, `refactor_ROUND 3/`
- `src/KNOCKOUT/`
- `src/system-architecture/`
- `src/system-reports/`
- `src/temp files/`
- `src/map (old)/`
- `src/logic/orchestration/`
- `src/engine/system7/`

---

## 7) LEGACY ISLANDS (duplicate or unused subsystems)

- **behavior/behavior-listerner.ts** — Duplicate of engine/core/behavior-listener (typo).
- **logic/orchestration/** — Duplicate of logic/engines (Onboarding-flow-router, next-step-reason); integration-flow-engine unused.
- **engine/system7/** — Isolated; no external imports.
- **engine/runners/engine-runner.tsx** — Unused; SRC_EXPORT.json reference only.
- **engine/loaders/theme-loader.ts** — Unused; ui-loader/ux-loader used instead.
- **compounds/ui/definitions/registry.ts** — Redundant with compounds/ui/index.ts.

---

## 8) PROTECTED RUNTIME TRUNK

Do not remove or move:

- **app/** — All entry points.
- **engine/core/** — behavior-listener, json-renderer, screen-loader, layout-store, palette-store, palette-resolver, collapse-layout-nodes, current-screen-tree-store, registry, site-loader, styler, ui-state, useUIState.
- **layout/** — index, page, component, resolver, compatibility, renderer.
- **state/** — state-store, section-layout-preset-store, organ-internal-layout-store, state-resolver, state-adapter, etc.
- **logic/runtime/** — action-runner, engine-bridge, flow-resolver, calc-resolver, landing-page-resolver, view-resolver, action-registry, engine-state, interaction-controller, runtime-verb-interpreter, engine-runtime-provider.
- **logic/engine-system/** — engine-contract, engine-registry, engine-explain.
- **JsonRenderer path** — `engine/core/json-renderer.tsx`.
- **behavior-listener path** — `engine/core/behavior-listener.ts`.
- **screen-loader path** — `engine/core/screen-loader.ts`.

---

## 9) RISK WARNINGS

1. **engine-runner.tsx** — Listed in `SRC_EXPORT.json`. Confirm whether any build or tool consumes this export before deleting.
2. **logic/orchestration** — Contains `integration-flow-engine.tsx` with similar name to `screens/tsx-screens/onboarding/integration-flow-engine.tsx`. The screens version is the one loadable as TSX; do not confuse the two when archiving.
3. **theme-loader** — No references found; low risk to remove after confirming no custom build step or loader registry.
4. **definitions/registry.ts** — Safe to remove if all consumers use `@/compounds/ui/index`; double-check test and any generated code.

---

## 10) REPO RUNTIME VS DEAD WEIGHT (APPROXIMATE)

- **Total .ts + .tsx under `/src`:** ~477 files.
- **Confirmed unused (candidate delete/archive):**
  - 1 file: behavior-listerner.ts
  - 1 file: engine-runner.tsx (verify export config)
  - 1 file: theme-loader.ts
  - 1 file: compounds/ui/definitions/registry.ts
  - 3 files: logic/orchestration/*
  - ~24 files: engine/system7/*
  - ~5 files: map (old)/*
- **Approximate dead .ts/.tsx:** ~36 files (~7.5% of src).
- **Doc-only folders:** cursor, docs, refactor_*, KNOCKOUT, system-architecture, system-reports (no .ts/.tsx; not counted in percentage).
- **Approximate runtime-reachable .ts/.tsx:** ~441 (~92.5%). Remainder is scripts (CLI), tests, devtools, and the unused/legacy files above.

---

*End of validation report. No file changes were made.*
