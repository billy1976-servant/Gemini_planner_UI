# GAP_REPORT.md — Docs missing or outdated vs code

**Purpose:** Identify documentation that is missing, outdated, or references removed code. Proof by file path and code reference.

---

## 1. Missing docs (no doc for existing code)

| Gap | Evidence (code) | Doc status |
|-----|------------------|------------|
| **Screen loader + API contract** | `src/engine/core/screen-loader.ts`, `src/app/api/screens/[...path]/route.ts` — path normalization, TSX vs JSON, state init | No single doc that describes loadScreen + API route contract (path rules, __tsx__, state:currentView). |
| **Layout resolver unification** | `src/layout/resolver/layout-resolver.ts`, `src/layout/page/`, `src/layout/component/`, `src/layout-organ/` — page + component + organ resolution order | LAYOUT_SYSTEM in docs describes layout conceptually; no doc that maps exact resolution order and file roles (page vs component vs organ). |
| **Organ expand + skin bindings order** | `src/app/page.tsx` (assignSectionInstanceKeys → expandOrgansInDocument → applySkinBindings → composeOfflineScreen) | `src/organs/README.md` mentions expandOrgansInDocument and applySkinBindings order; no doc at app level that ties this to page.tsx flow. |
| **State intents (full list)** | `src/state/state-resolver.ts` — all intents handled in deriveState | JSON_SCREEN_CONTRACT stateModel.mutationIntents is close; no standalone “state intents” doc that is the single reference for dispatchState(...) callers. |
| **Behavior listener → runner → engine wiring** | `src/engine/core/behavior-listener.ts`, `src/behavior/behavior-runner.ts`, behavior-*.json | BEHAVIOR_CONTRACT in docs; no doc that lists exact listener branches (state:*, navigate, contract verbs, runtime verb) and runner resolution (interactions + navigations + verb resolver). |
| **Blueprint script vs runtime** | `src/scripts/blueprint.ts` parses blueprint.txt; runtime does not use it for screen loading (screens from apps-offline + API) | BLUEPRINT_COMPILER_SYSTEM may imply a “compiler” in the runtime path; blueprint script is file/build-time only. Clarification missing. |
| **Site compiler pipeline** | `src/lib/site-compiler/normalizeSiteData.ts`, `compileSiteToSchema.ts`; `src/compiler/*.ts` used by normalizeSiteData | Docs reference “compiler” and “website” build; no single doc that lists normalizeSiteToSchema → compileSiteToSchema and compiler/* usage. |
| **Engine registry and execution engines** | `src/logic/engine-system/engine-registry.ts`, engines (learning, calculator, decision, summary, abc) | LOGIC_ENGINE_SYSTEM exists in src/docs; may be outdated (engine list, getPresentation, applyEngine). |

---

## 2. Outdated docs (reference removed or renamed code)

| Doc / location | Outdated reference | Current code |
|----------------|--------------------|--------------|
| **Any doc referring to `layout-2/`** | `src/layout-2/` (index, layout-resolver, layouts.json, etc.) | **Deleted.** Layout lives in `src/layout/` (page, component, resolver, compatibility) and `src/layout-organ/`. |
| **Any doc referring to `src/definitions/`** | Definitions as `.txt` in `src/definitions/` | **Deleted.** Compound definitions are `src/compounds/ui/definitions/*.json` and compounds in `src/compounds/ui/`. |
| **Docs that say “screen ID” or “screen-*”** | Old screen ID–based loading | **Forbidden.** screen-loader.ts throws if path does not contain "/" and is not tsx:. |
| **ARCHIVE_RECOVERED docs pointing to `docs/SYSTEM_MASTER/` or `docs/HI_SYSTEM/`** | Paths under repo root `docs/` | Root `docs/` **deleted** (git status). Live copies are `src/docs/SYSTEM_MASTER/`, `src/docs/HI_SYSTEM/`. |
| **References to layout2, Layout2, getLayout2Ids** | Old layout-2 module | Code still exports `getLayout2Ids()` from `src/layout/index.ts` but implementation is `getPageLayoutIds()` from page layout; naming is legacy. |

**Citation for layout-2 removal:** Git status shows `D src/layout-2/index.ts`, `D src/layout-2/layout-resolver.ts`, etc., and `R src/layout-2/...` to `src/layout/page/` or `src/layout/renderer/`.

---

## 3. Recently deleted docs (from git status)

**Deleted (D) or added-then-deleted (MD/AD) in branch — not present on disk in current branch:**

- **Root `docs/`:**  
  `BLUEPRINT_WEBSITE_GUIDE.md`, `IMPLEMENTATION_COMPLETE.md`, `JSON_SCREEN_CONTRACT_ARCHITECTURAL_CORRECTION.md`, `LAYOUT_PRESET_TRACE_REPORT.md`, `ROOT_CAUSE_GRID_AS_NODE_TYPE_AND_FIX.md`, `ROOT_CAUSE_IMAGE_LEFT_TEXT_RIGHT_AND_GRID.md`, `STEP1_VERIFICATION.md`, `SYSTEM_COMPLETE_SUMMARY.md`, `WIX_SYSTEM_ARCHITECTURE.md`, `WIX_SYSTEM_IMPLEMENTATION_SUMMARY.md`, `SECTION_LAYOUT_LAYOUT2_ACTION_PLAN.md`, and others under root `docs/`.
- **Root `docs/HI_SYSTEM/`** (and STYLING CURSOR PLAN subfolder): Multiple MD files (ACTION_PLAN_CURSOR, ADAPTERS, BEHAVIOR_CONTRACT, etc.) — status MD = modified or deleted in index.
- **Root `docs/SYSTEM_MASTER/`:**  
  `BLUEPRINT_COMPILER_SYSTEM.md`, `CONTRACTS.md`, `LAYOUT_SYSTEM.md`, `LOGIC_ENGINE_SYSTEM.md`, `SYSTEM_ARCHITECTURE.md`, `WORKFLOW.md` — status AD = added in index then deleted from working tree (or moved).
- **`src/definitions/`:**  
  All `.txt` files (e.g. `0. GPT-Constraints.txt`, `1. Core-Philosophy.txt`, `Atoms-JSON-Driven.txt`, …) — **deleted.**

**Note:** `src/docs/ARCHIVE_RECOVERED/` contains copies of many of the above (docs_SYSTEM_MASTER, docs/HI_SYSTEM, docs/ root). So “deleted” here means removed from their **original** locations (root docs/, src/definitions/), not necessarily lost.

---

## 4. Duplicate doc sets (which is authoritative)

| Set A | Set B | Recommendation |
|-------|-------|----------------|
| **src/docs/SYSTEM_MASTER/** | **src/docs/ARCHIVE_RECOVERED/docs_SYSTEM_MASTER/** | **Authoritative:** `src/docs/SYSTEM_MASTER/`. ARCHIVE_RECOVERED is a copy; code does not import either. Prefer the non-archive folder as canonical. |
| **src/docs/HI_SYSTEM/** | **src/docs/ARCHIVE_RECOVERED/docs/HI_SYSTEM/** | **Authoritative:** `src/docs/HI_SYSTEM/`. Same as above. |
| **Root reports (*.md at repo root)** | **Similar names in ARCHIVE_RECOVERED/docs/** | Root reports (e.g. SYSTEM_MASTER_MAP.md, CONTRACT_GAP_REPORT.md) are the live artifacts. ARCHIVE_RECOVERED is historical. |
| **src/cursor/layout/complete/1_organ-layout-plan.md** | **src/cursor/layout/1_organ-layout-plan.md** | Two versions; complete/ is the “done” folder. Prefer complete/ for final plan; root layout/ for in-progress or pointer. |

---

## 5. Code with no doc reference (candidates for future docs)

- **src/engine/core/collapse-layout-nodes.ts** — Used in page.tsx to strip layout node types in dev; not described in a layout doc.
- **src/state/section-layout-preset-store.ts**, **src/state/organ-internal-layout-store.ts** — Per-screen, per-section overrides; only briefly referenced in RUNTIME_PIPELINE / ENGINE_INDEX.
- **src/logic/runtime/runtime-verb-interpreter.ts** and **action-runner.ts** — Used when behavior-listener falls through; not fully described in behavior docs.
- **config/ui-verb-map.json** — Verb list and appliesTo; runtime uses behavior-runner + listener, not this file directly; doc could clarify “config vs runtime.”

---

**Summary:** Main gaps are (1) missing single-source docs for screen load + API, layout resolution order, state intents, and behavior wiring; (2) outdated references to layout-2 and src/definitions; (3) root docs/ and src/definitions/ removed (with copies in ARCHIVE_RECOVERED where applicable). Authoritative doc locations are `src/docs/SYSTEM_MASTER/`, `src/docs/HI_SYSTEM/`, and root *.md reports; ARCHIVE_RECOVERED is for recovery/history only.
