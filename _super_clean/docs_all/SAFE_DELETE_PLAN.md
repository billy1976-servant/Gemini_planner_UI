# SAFE_DELETE_PLAN.md — What can be deleted/moved/archived (with KEEP list)

**Rules applied:** Recommend delete/move/archive **only** for (a) duplicated content, or (b) not referenced by any code, import, or docs index. **Do not delete anything automatically.** This plan is advisory.

---

## 1. Duplicate sets and recommendation

### 1.1 SYSTEM_MASTER

| Location | Contents | Referenced by code? |
|----------|----------|---------------------|
| `src/docs/SYSTEM_MASTER/` | WORKFLOW, LOGIC_ENGINE_SYSTEM, LAYOUT_SYSTEM, SYSTEM_ARCHITECTURE, BLUEPRINT_COMPILER_SYSTEM, CONTRACTS | **No** (no import of docs in codebase) |
| `src/docs/ARCHIVE_RECOVERED/docs_SYSTEM_MASTER/` | Same filenames, same purpose (copy) | **No** |

**Diff summary:** ARCHIVE_RECOVERED copy is a backup; content is the same theme (architecture, layout, logic engine, blueprint, contracts). No code references either path.

**Recommendation:** **KEEP** `src/docs/SYSTEM_MASTER/` as authoritative. **Safe to archive or remove** `src/docs/ARCHIVE_RECOVERED/docs_SYSTEM_MASTER/` (move to an `archive/` folder or delete) **only after** confirming no external links or scripts point at ARCHIVE_RECOVERED. Prefer **move to archive** over delete so the copy remains recoverable.

---

### 1.2 HI_SYSTEM (and HI_SYSTEM subfolders)

| Location | Contents | Referenced by code? |
|----------|----------|---------------------|
| `src/docs/HI_SYSTEM/` | START_HERE, ROADMAP, PLAN_ACTIVE, WORKFLOW_RULES, CHANGELOG, MOLECULE_CONTRACT, BEHAVIOR_CONTRACT, etc. | **No** |
| `src/docs/ARCHIVE_RECOVERED/docs/HI_SYSTEM/` | Same + STYLING CURSOR PLAN subfolder | **No** |

**Diff summary:** ARCHIVE_RECOVERED holds a fuller set (e.g. STYLING CURSOR PLAN, more HI_SYSTEM files). Live `src/docs/HI_SYSTEM/` has fewer files (git status shows many under docs/ as modified/deleted).

**Recommendation:** **KEEP** `src/docs/HI_SYSTEM/` as authoritative. **Do not delete** `src/docs/ARCHIVE_RECOVERED/docs/HI_SYSTEM/` until you have merged any unique content (e.g. STYLING CURSOR PLAN) into the canonical location or explicitly decided to drop it. Then **move to archive** (or delete) the recovered copy.

---

### 1.3 Root `docs/` (already deleted in branch)

| Location | Status | Note |
|----------|--------|------|
| `docs/` (repo root) | **Deleted** (per git status) | Was primary docs home; contained HI_SYSTEM, SYSTEM_MASTER, WIX_*, BLUEPRINT_*, etc. |
| `docs/SYSTEM_MASTER/` | **Added then deleted (AD)** | CONTRACTS, LAYOUT_SYSTEM, LOGIC_ENGINE_SYSTEM, etc. |
| `docs/IMPLEMENTATION_COMPLETE.md`, etc. | **Deleted (D)** | Multiple root docs removed |

**Recommendation:** Nothing to delete (already gone). If restoring, use `src/docs/SYSTEM_MASTER/` and `src/docs/HI_SYSTEM/` plus `src/docs/ARCHIVE_RECOVERED/` as source of truth for recovered content.

---

### 1.4 Cursor layout plan duplicates

| Location | Contents |
|----------|----------|
| `src/cursor/layout/1_organ-layout-plan.md` | Organ layout plan (inbox/active) |
| `src/cursor/layout/complete/1_organ-layout-plan.md` | Same topic, “complete” folder |
| `src/cursor/layout/complete/PLAN_LAYOUT_DecoupleLayoutDropdownState.md` | Decouple layout dropdown |
| `src/cursor/layout/complete/2_PLAN_LAYOUT_DecoupleLayoutDropdownState.md` | Likely duplicate of above |

**Recommendation:** **KEEP** one canonical “organ layout plan” in `src/cursor/layout/complete/` and one “DecoupleLayoutDropdownState” plan. Compare 2_PLAN_* vs PLAN_* and keep the more complete; remove or move the other to inbox/ so there is a single authoritative file per plan.

---

## 2. Unreferenced by code (candidates for archive/delete)

**Verification:** Grep for imports or require of `docs/`, `ARCHIVE_RECOVERED`, `definitions/` (old path), `.idx` — **no code references** any of these.

| Item | Type | Recommendation |
|------|------|-----------------|
| **src/docs/ARCHIVE_RECOVERED/** | Folder (full copy of old docs) | **Safe to move to archive** (e.g. `docs-archive/` or `archive/recovered-docs/`) after copying any unique content into `src/docs/`. Do not delete until uniqueness is checked. |
| **.idx/** | Legacy folder (airules.md, _Legacy_do_not_delete) | **KEEP** — folder name says “_Legacy_do_not_delete”. Not referenced by code; treat as legacy preserve. Do not delete. |
| **src/definitions/** | Deleted (was .txt definition files) | Already removed. No action. |
| **Root docs/** | Deleted | Already removed. No action. |

---

## 3. Do NOT delete (even if duplicated or unreferenced by code)

- **src/contracts/** — Contract and param-key docs + JSON_SCREEN_CONTRACT.json; referenced by CONTRACTS_EXTRACTED and design. **KEEP.**
- **src/layout/requirements/SLOT_NAMES.md** — Referenced by compatibility system and this analysis. **KEEP.**
- **src/engine/core/** — Runtime. **KEEP.**
- **src/state/** — Runtime. **KEEP.**
- **.idx/** — Explicitly “do not delete” in structure. **KEEP.**
- **config/ui-verb-map.json** — Config used by tooling/docs. **KEEP.**

---

## 4. KEEP list — Minimum authoritative docs to retain

**Single minimal set of docs to retain for handoff and continuity:**

| Category | Path(s) | Reason |
|----------|---------|--------|
| **Architecture** | `src/docs/SYSTEM_MASTER/*.md` | Primary architecture (workflow, layout, logic engine, blueprint, contracts, system architecture) |
| **Operational / HI** | `src/docs/HI_SYSTEM/*.md` (START_HERE, MAP, ROADMAP, PLAN_ACTIVE, WORKFLOW_RULES, CHANGELOG, MOLECULE_CONTRACT, BEHAVIOR_CONTRACT) | Entry point and contracts for HI system |
| **Contracts (code)** | `src/contracts/*.md`, `src/contracts/JSON_SCREEN_CONTRACT.json` | Screen and param contracts; ENGINE_LAWS, PARAM_KEY_MAPPING |
| **Layout** | `src/layout/requirements/SLOT_NAMES.md` | Slot naming for compatibility |
| **Cursor plans** | `src/cursor/MASTER_ROADMAP.md`, `src/cursor/RULES.md`; `src/cursor/layout/complete/*.md` (one per plan) | Active and completed plans |
| **This analysis** | `REPO_TREE.md`, `DOCS_INDEX.md`, `ENGINE_INDEX.md`, `RUNTIME_PIPELINE.md`, `CONTRACTS_EXTRACTED.md`, `GAP_REPORT.md`, `SAFE_DELETE_PLAN.md` | Engineer handoff and single source of truth for tree, docs, engine, pipeline, contracts, gaps, and safe delete |
| **Root reports** | Root `*.md` that are reports (SYSTEM_MASTER_MAP, CONTRACT_GAP_REPORT, CONTRACT_VALIDATION_REPORT, APPS_OFFLINE_SYSTEM_MAP, etc.) | Current diagnostics and maps |
| **Organs** | `src/organs/README.md` | Expand/bindings order |
| **Site skin** | `src/lib/site-skin/siteSkin.schema.md`, `PROOF_PATH.md` (if still used) | Schema and proof path |

**Optional but useful:** `src/docs/HI Vision Definitions/` (vision and concepts); `src/cursor/layout/planned/*.md` and `src/cursor/logic/planned/*.md` for planned work.

---

## 5. Summary table

| Action | Target | Condition |
|--------|--------|-----------|
| **KEEP** | All of §4 KEEP list | Always |
| **KEEP** | .idx/ | Per folder convention |
| **Archive (move)** | src/docs/ARCHIVE_RECOVERED/ | After merging unique content into src/docs/ |
| **Consolidate then archive** | Duplicate cursor layout plans (2_PLAN_* vs PLAN_*) | Keep one per plan in complete/; move duplicate to inbox or archive |
| **Do not delete** | src/docs/SYSTEM_MASTER/, src/docs/HI_SYSTEM/, src/contracts/, layout/requirements/SLOT_NAMES.md, engine, state, config | Required for handoff and runtime |
| **N/A** | Root docs/, src/definitions/ | Already deleted |

No automatic deletion is recommended; all changes should be manual and after verification.
