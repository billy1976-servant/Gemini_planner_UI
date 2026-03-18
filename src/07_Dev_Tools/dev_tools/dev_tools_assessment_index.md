# DEV TOOL ASSESSMENT INDEX

Generated: 2026-02-11

This index catalogs all developer diagnostic tools found across the codebase, prioritized by their importance in diagnosing system failures.

---

## 1) ONLINE (UI SCREENS)

Tools accessible through the app UI during development.

### SystemControlCenter.tsx
**How to use:** Navigate to `?screen=system/SystemControlCenter` in the app (or go to `apps-tsx > system > SystemControlCenter.tsx` via screen menu)  
**Path:** `/src/01_App/apps-tsx/system/SystemControlCenter.tsx`  
**Scans:**
- Registry duplication
- Path drift
- Engine fragmentation
- UI block structure
- Runtime modules
- Legacy paths
- Import health
- Unused files

**Detects:**
- Conflicting sources of truth (duplicate registries)
- Unstable adapters (engine fragmentation)
- Structural drift (path mismatches)
- Registry conflicts (multiple registries with same name)
- Legacy path patterns (deprecated folder structures)

**Why it matters:**
- Identifies structural instability before it causes runtime failures
- Provides health scores and stability metrics
- Generates refactor proposals with Cursor commands
- Single UI for comprehensive system architecture scan

**Priority:** HIGH

---

### InteractionTracerPanel.tsx (Pipeline Debugger)
**How to use:** Automatically visible at bottom of screen in development mode (NODE_ENV=development). Click to expand/collapse.  
**Path:** `/src/07_Dev_Tools/devtools/InteractionTracerPanel.tsx`  
**Scans:**
- UI interaction → action → behavior → state → layout → render pipeline
- Pipeline stage execution
- State diff tracking
- Layout resolution chains
- Renderer trace events
- Dead interactions (interactions that produce no effect)

**Detects:**
- Broken signal paths (dead interactions)
- Pipeline stage failures
- State-layout disconnects (state changes not consumed by layout)
- Override resolution mismatches
- Renderer trace gaps
- Section key mismatches

**Why it matters:**
- Real-time pipeline visibility during development
- Identifies exactly where UI interactions fail to propagate
- Shows forensic before/after snapshots per pipeline stage
- Contract test results for layout dropdown interactions
- Critical for debugging layout failures

**Priority:** HIGH

---

### ScreenDiagnostics.tsx
**How to use:** Navigate to `?screen=tsx-screens/diagnostics/ScreenDiagnostics` in the app (or go to `apps-tsx > tsx-screens > diagnostics > ScreenDiagnostics.tsx` via screen menu)  
**Path:** `/src/01_App/apps-tsx/tsx-screens/diagnostics/ScreenDiagnostics.tsx`  
**Scans:**
- All screen files (JSON and TSX)
- Screen loadability
- JSON parse validity
- TSX importability
- Structural drift warnings

**Detects:**
- Missing or invalid screen files
- JSON parse errors
- Import failures
- Path drift (screens referenced but missing)
- Structural instability

**Why it matters:**
- Validates all screens are loadable before runtime
- Prevents runtime crashes from missing screens
- Shows global health score (% healthy screens)
- Identifies structural drift early

**Priority:** MEDIUM

---

## 2) NPM / TERMINAL DEV TOOLS

Tools triggered via `npm run *` or scripts in `/scripts` and `/src/07_Dev_Tools/scripts`.

### npm run diagnostics
**How to use:** Run `npm run diagnostics` in terminal  
**Script:** `src/07_Dev_Tools/devtools/run-diagnostics.ts`  
**What it checks:**
- Full file tree structure
- File existence
- Export validation (TS/TSX files must export something)
- Missing imports (relative imports that can't be resolved)
- Broken module dependencies

**When to use it:**
- Before committing code
- After major refactors
- When imports are failing
- To verify file structure integrity

**Priority:** MEDIUM

---

### npm run pipeline:proof
**How to use:** Run `npm run pipeline:proof` in terminal  
**Script:** `src/07_Dev_Tools/scripts/pipeline-proof.ts`  
**What it checks:**
- JSON loads (app.json + linked.json)
- All 12 molecules present in JSON
- Registry keys found for all molecules
- Runtime pipeline execution (CustomEvent → behavior-listener → state-store)
- State update observation
- Journal write persistence
- Navigation event handling
- Duplicate listener prevention
- Refresh/rehydration proof

**When to use it:**
- After modifying behavior-listener or state-store
- When pipeline is broken
- To verify end-to-end signal flow
- Before deploying pipeline changes

**Priority:** HIGH

---

### npm run contract:report
**How to use:** Run `npm run contract:report` in terminal  
**Script:** `src/07_Dev_Tools/scripts/contract-report.ts`  
**What it checks:**
- JSON parse failures in `/src/apps-json`
- Contract validation (documentation-only, no programmatic validation)

**When to use it:**
- After editing JSON files
- To find malformed JSON
- Before committing JSON changes

**Priority:** LOW

---

### npm run contract:validate
**How to use:** Run `npm run contract:validate` in terminal  
**Script:** `src/07_Dev_Tools/scripts/contract-validate.ts`  
**What it checks:**
- Documentation-only contract validation (exits successfully, no actual validation)

**When to use it:**
- Compatibility script (no-op)

**Priority:** LOW

---

### npm run validate:paths
**How to use:** Run `npm run validate:paths` in terminal (also runs automatically on `npm run build` via prebuild hook)  
**Script:** `scripts/validate-paths.js`  
**What it checks:**
- Path alias validation
- Import path correctness

**When to use it:**
- Runs automatically on `prebuild`
- When path aliases are failing
- After tsconfig changes

**Priority:** MEDIUM

---

### npm run verify:atoms
**How to use:** Run `npm run verify:atoms` in terminal  
**Script:** `scripts/verify-atoms-manifest.ts`  
**What it checks:**
- Atoms manifest integrity

**When to use it:**
- After modifying atom definitions
- To verify atom registry consistency

**Priority:** LOW

---

### npm run verify:compounds
**How to use:** Run `npm run verify:compounds` in terminal  
**Script:** `scripts/verify-compounds-manifest.ts`  
**What it checks:**
- Compounds manifest integrity

**When to use it:**
- After modifying compound definitions
- To verify compound registry consistency

**Priority:** LOW

---

### npm run blocks:status
**How to use:** Run `npm run blocks:status` in terminal  
**Script:** `scripts/scan-blocks-status.ts`  
**What it checks:**
- Block system status
- Atom/compound registration

**When to use it:**
- After UI block changes
- To verify block system health

**Priority:** LOW

---

### npm run globalscan
**How to use:** Run `npm run globalscan` in terminal  
**Script:** `src/07_Dev_Tools/scripts/global-scan.ts`  
**What it checks:**
- Global scan execution via state bridge
- Interpreted scan results
- Derived state from scans

**When to use it:**
- To execute global scan providers (Google Ads, Google Trends)
- To see interpreted scan results in state

**Priority:** LOW

---

### npm run system-report
**How to use:** Run `npm run system-report` in terminal  
**Script:** `src/07_Dev_Tools/scripts/system-report/generate-system-report.ts`  
**What it checks:**
- Full system architecture report
- Generates comprehensive system documentation

**When to use it:**
- To generate system documentation
- For architecture audits

**Priority:** LOW

---

## 3) CORE DIAGNOSTIC ENGINES (INTERNAL)

Hidden but critical system health tools that run automatically or are called by other tools.

### system-scan.ts (System Scan Engine)
**How to use:** Called programmatically via `POST /api/system-scan` (used by SystemControlCenter.tsx UI) or import `runSystemScan` from `@/runtime-diagnostics/system-scan`  
**Path:** `/src/07_Dev_Tools/runtime-diagnostics/system-scan.ts`  
**Function:**
- Full system architecture scanner
- Registry duplication detector
- Engine detection and classification
- Runtime module analysis
- UI block statistics
- Path health analysis
- Legacy pattern detection

**What failures it reveals:**
- Duplicate registries (conflicting sources of truth)
- Engine fragmentation (engines scattered across folders)
- Registry drift (multiple registries with same name)
- Legacy path usage (deprecated folder patterns)
- Structural instability (missing folders, wrong counts)

**Priority:** HIGH

---

### pipelineContractTester.ts (Pipeline Contract Tester)
**How to use:** Called automatically by InteractionTracerPanel.tsx after layout dropdown interactions. Import `runLayoutContractTest` from `@/debug/pipelineContractTester` for programmatic use.  
**Path:** `/src/07_Dev_Tools/debug/pipelineContractTester.ts`  
**Function:**
- Runtime pipeline contract verification
- UI → state → layout → render pipeline validation
- Forensic before/after snapshots per step
- Contract test step validation

**What failures it reveals:**
- Interaction not detected
- Action not emitted
- State not updated (layout keys)
- Page overrides not recomputed
- Resolver not receiving updated input
- Render pass not completed
- Final layout unchanged

**Priority:** HIGH

---

### PipelineDebugStore (Pipeline Debug Store)
**How to use:** Used automatically by InteractionTracerPanel.tsx. Access programmatically via `PipelineDebugStore.getSnapshot()` or `window.__PIPELINE_DEBUG__` in browser console.  
**Path:** `/src/07_Dev_Tools/devtools/pipeline-debug-store.ts`  
**Function:**
- Central debug store for live pipeline state inspection
- Observes interaction, behavior, state, visibility, layout, render layers
- Tracks state diffs, layout changes, section render rows
- Dead interaction detection
- Contract test results storage

**What failures it reveals:**
- Dead interactions (interactions with no downstream effect)
- State-layout disconnects
- Missing render passes
- Layout resolution failures
- Override store vs state mismatches

**Priority:** HIGH

---

### pipelineStageTrace.ts (Pipeline Stage Tracer)
**How to use:** Called automatically throughout pipeline execution. Access via `getPipelineTrace()` or `getLastPipelineTrace()` from `@/engine/debug/pipelineStageTrace`.  
**Path:** `/src/07_Dev_Tools/engine-debug/pipelineStageTrace.ts`  
**Function:**
- Records pipeline stage execution (listener, interaction, action, behavior, state, layout, render)
- Stage status tracking (pass/fail/skipped/warn)
- Message logging per stage

**What failures it reveals:**
- Missing pipeline stages
- Stage execution failures
- Pipeline breaks (stage not reached)
- Stage status mismatches

**Priority:** HIGH

---

### renderer-trace.ts (Renderer Trace)
**How to use:** Emits automatically when `window.__PIPELINE_DEBUGGER_ENABLED__` is true. Subscribe via `subscribeRendererTrace()` from `@/engine/debug/renderer-trace`.  
**Path:** `/src/07_Dev_Tools/engine-debug/renderer-trace.ts`  
**Function:**
- Lightweight passive trace for JSON → Profile Resolver → Layout Decision → Component Render
- Profile resolution tracking
- Component render tracking
- Renderer error tracking

**What failures it reveals:**
- Profile resolution failures
- Layout decision mismatches
- Component render failures
- Renderer errors

**Priority:** MEDIUM

---

### exportFocusedPipelineSnapshot.ts (Pipeline Snapshot Exporter)
**How to use:** Call `exportFocusedPipelineSnapshot()` from `@/debug/exportFocusedPipelineSnapshot` (button available in InteractionTracerPanel.tsx UI)  
**Path:** `/src/07_Dev_Tools/debug/exportFocusedPipelineSnapshot.ts`  
**Function:**
- Exports focused pipeline snapshot (dropdown → layout pipeline)
- Last interaction + behavior + state change + layout diff + render row
- Pipeline stage status

**What failures it reveals:**
- Missing pipeline data
- Incomplete snapshots
- Pipeline stage gaps

**Priority:** MEDIUM

---

### error-classifier.ts (Error Classifier)
**How to use:** Import `classifyError()` or `classifyAndHint()` from `@/engine-diagnostics/error-classifier` for programmatic use. Used by ScreenDiagnostics.tsx.  
**Path:** `/src/07_Dev_Tools/engine-diagnostics/error-classifier.ts`  
**Function:**
- Normalizes error messages into categories
- Provides fix hints for common errors
- Error type classification (PATH_MISSING, MODULE_NOT_FOUND, JSON_PARSE_ERROR, etc.)

**What failures it reveals:**
- Path drift (PATH_MISSING)
- Import failures (MODULE_NOT_FOUND)
- JSON syntax errors (JSON_PARSE_ERROR)
- Runtime import errors (RUNTIME_IMPORT_ERROR)

**Priority:** MEDIUM

---

### runtime-decision-trace.ts (Runtime Decision Trace)
**How to use:** Call `logRuntimeDecision()` from `@/engine-devtools/runtime-decision-trace`. Access log via `getRuntimeDecisionLog()` or `window.__RUNTIME_DECISION_LOG__`.  
**Path:** `/src/07_Dev_Tools/engine-devtools/runtime-decision-trace.ts`  
**Function:**
- Lightweight logger for engine-level decisions
- Non-intrusive decision tracking
- Decision log storage (window.__RUNTIME_DECISION_LOG__)

**What failures it reveals:**
- Engine decision failures
- Decision trace gaps
- Missing decision logs

**Priority:** LOW

---

### global-scan.analyzer.ts (Global Scan Analyzer)
**How to use:** Called automatically by global scan execution. Import `analyzeScan()` from `@/scans/global-scans/global-scan.analyzer` for programmatic use.  
**Path:** `/src/07_Dev_Tools/scans/global-scans/global-scan.analyzer.ts`  
**Function:**
- Converts raw scan signals into meaningful, stable outputs
- Score computation, momentum, trend analysis
- Signal interpretation

**What failures it reveals:**
- Scan signal interpretation failures
- Score computation errors
- Trend analysis issues

**Priority:** LOW

---

### health-model.ts (Health Model)
**How to use:** Called automatically by SystemControlCenter.tsx. Import `computeHealthScores()` or `getHealthBanner()` from `@/system-control/health-model` for programmatic use.  
**Path:** `/src/07_Dev_Tools/system-control/health-model.ts`  
**Function:**
- Health score computation from scan data
- Health banner derivation (stable/minor_drift/needs_attention)
- Structure health, duplication risk, registry drift risk, legacy risk, runtime safety scores

**What failures it reveals:**
- Low health scores
- High duplication risk
- Registry drift
- Legacy path usage
- Low runtime safety

**Priority:** MEDIUM

---

### scan-modules.ts (Scan Modules)
**How to use:** Used automatically by SystemControlCenter.tsx. Import `SCAN_MODULES` or `selectedSubOptionsToApiOptions()` from `@/system-control/scan-modules` for programmatic use.  
**Path:** `/src/07_Dev_Tools/system-control/scan-modules.ts`  
**Function:**
- Scan module definitions (Structure Scan, Renderer Identity Scan, Registry Scan, Engine Scan, UI System Scan)
- Maps UI scan selections to API options
- Scan option key management

**What failures it reveals:**
- Scan configuration issues
- Missing scan modules

**Priority:** LOW

---

### diagnostics/engine.ts (Diagnostics Engine)
**How to use:** Run `npm run diagnostics` (calls `runDiagnostics()` from `@/diagnostics/engine`). Import `runDiagnostics()` for programmatic use.  
**Path:** `/src/07_Dev_Tools/diagnostics/engine.ts`  
**Function:**
- Full recursive file tree scan
- Export validation
- Missing file detection
- Broken export detection

**What failures it reveals:**
- Missing files
- Broken exports
- Invalid file structure
- Import resolution failures

**Priority:** MEDIUM

---

## 4) TOP PRIORITY ORDER (MOST IMPORTANT FIRST)

Ranked list of diagnostic tools by criticality for diagnosing system failures:

### 1. InteractionTracerPanel.tsx (Pipeline Debugger)
**Why it's critical:**
- Real-time visibility into the entire UI → render pipeline
- Detects dead interactions (interactions that produce no effect)
- Shows exact failure point in pipeline stages
- Identifies state-layout disconnects (most common failure mode)
- Contract test results for layout interactions
- **Use when:** Layout dropdowns don't work, interactions have no effect, state changes don't reflect in UI

---

### 2. system-scan.ts (System Scan Engine)
**Why it's critical:**
- Detects duplicate registries (conflicting sources of truth)
- Identifies engine fragmentation (engines scattered)
- Finds registry drift (multiple registries with same name)
- Reveals structural instability before runtime failures
- **Use when:** System feels unstable, registries conflict, engines are fragmented

---

### 3. pipelineContractTester.ts (Pipeline Contract Tester)
**Why it's critical:**
- Validates entire UI → state → layout → render pipeline
- Forensic before/after snapshots per step
- Identifies exact contract violation
- Shows which pipeline stage failed
- **Use when:** Pipeline is broken, layout changes don't work, state updates don't propagate

---

### 4. PipelineDebugStore (Pipeline Debug Store)
**Why it's critical:**
- Central store for all pipeline debug data
- Dead interaction detection
- State diff tracking
- Layout change trace
- Section render row tracking
- **Use when:** Need to inspect pipeline state, debug dead interactions, track state changes

---

### 5. pipelineStageTrace.ts (Pipeline Stage Tracer)
**Why it's critical:**
- Records every pipeline stage execution
- Shows which stages passed/failed/skipped
- Identifies pipeline breaks (stage not reached)
- **Use when:** Pipeline stages are failing, need to see stage execution order

---

### 6. SystemControlCenter.tsx (System Control Center UI)
**Why it's critical:**
- Comprehensive system architecture scan UI
- Health scores and stability metrics
- Refactor proposals with Cursor commands
- Single UI for all system scans
- **Use when:** Need comprehensive system health check, planning refactors, checking registry conflicts

---

### 7. npm run pipeline:proof
**Why it's critical:**
- End-to-end pipeline proof
- Verifies CustomEvent → behavior-listener → state-store pipeline
- Tests persistence and rehydration
- Validates duplicate listener prevention
- **Use when:** Pipeline is broken, need to verify end-to-end flow, after modifying behavior-listener or state-store

---

### 8. renderer-trace.ts (Renderer Trace)
**Why it's critical:**
- Tracks JSON → Profile Resolver → Layout Decision → Component Render
- Shows profile resolution failures
- Identifies layout decision mismatches
- **Use when:** Components aren't rendering, layout decisions are wrong, profile resolution fails

---

### 9. error-classifier.ts (Error Classifier)
**Why it's critical:**
- Normalizes error messages into actionable categories
- Provides fix hints for common errors
- Classifies errors (PATH_MISSING, MODULE_NOT_FOUND, etc.)
- **Use when:** Errors are cryptic, need error categorization, need fix hints

---

### 10. health-model.ts (Health Model)
**Why it's critical:**
- Computes health scores from scan data
- Derives health banners (stable/minor_drift/needs_attention)
- Shows structure health, duplication risk, registry drift risk
- **Use when:** Need overall system health assessment, planning refactors

---

### 11. ScreenDiagnostics.tsx (Screen Diagnostics UI)
**Why it's critical:**
- Validates all screens are loadable
- Shows global health score (% healthy screens)
- Identifies structural drift
- **Use when:** Screens are failing to load, need screen health check

---

### 12. diagnostics/engine.ts (Diagnostics Engine)
**Why it's critical:**
- Full recursive file tree scan
- Export validation
- Missing file detection
- **Use when:** Files are missing, exports are broken, import resolution fails

---

### 13. npm run diagnostics
**Why it's critical:**
- Full file tree structure validation
- Export validation
- Missing import detection
- **Use when:** Before committing, after refactors, when imports fail

---

### 14. exportFocusedPipelineSnapshot.ts (Pipeline Snapshot Exporter)
**Why it's critical:**
- Exports focused pipeline snapshot for debugging
- Last interaction + behavior + state change + layout diff
- **Use when:** Need to export pipeline state for debugging, share pipeline state with team

---

### 15. npm run validate:paths
**Why it's critical:**
- Path alias validation
- Runs automatically on prebuild
- **Use when:** Path aliases are failing, after tsconfig changes

---

### 16. runtime-decision-trace.ts (Runtime Decision Trace)
**Why it's useful:**
- Engine-level decision tracking
- Decision log storage
- **Use when:** Need to debug engine decisions, track decision flow

---

### 17. global-scan.analyzer.ts (Global Scan Analyzer)
**Why it's useful:**
- Scan signal interpretation
- Score computation
- **Use when:** Need to interpret scan signals, compute scores

---

### 18. scan-modules.ts (Scan Modules)
**Why it's useful:**
- Scan module definitions
- Maps UI selections to API options
- **Use when:** Configuring scans, understanding scan modules

---

### 19. npm run contract:report
**Why it's useful:**
- JSON parse failure detection
- **Use when:** JSON files are malformed, after editing JSON

---

### 20. npm run verify:atoms / verify:compounds / blocks:status
**Why they're useful:**
- Manifest integrity checks
- Block system status
- **Use when:** After modifying atom/compound definitions, verifying block system

---

### 21. npm run globalscan / system-report / contract:validate
**Why they're useful:**
- Global scan execution
- System documentation generation
- Contract validation (no-op)
- **Use when:** Need global scans, generating docs, compatibility

---

## SUMMARY

**For diagnosing layout failures:** Use InteractionTracerPanel.tsx (Pipeline Debugger) first, then pipelineContractTester.ts, then PipelineDebugStore.

**For diagnosing registry conflicts:** Use system-scan.ts first, then SystemControlCenter.tsx UI.

**For diagnosing pipeline breaks:** Use pipelineStageTrace.ts first, then pipelineContractTester.ts, then InteractionTracerPanel.tsx.

**For diagnosing structural instability:** Use system-scan.ts first, then ScreenDiagnostics.tsx, then diagnostics/engine.ts.

**For end-to-end pipeline verification:** Use npm run pipeline:proof first, then InteractionTracerPanel.tsx.

---

*This index is auto-generated from codebase analysis. Tools are prioritized by their ability to diagnose critical system failures, especially registry conflicts, layout failures, engine identity instability, render mismatches, and pipeline breaks.*
