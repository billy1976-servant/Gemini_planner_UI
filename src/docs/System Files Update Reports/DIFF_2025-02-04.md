# SYSTEM FILES UPDATE — DIFF REPORT

**Run date:** 2025-02-04  
**Protocol:** `src/docs/RUNTIME/SYSTEM_FILES_UPDATE_PROTOCOL.md`  
**Scope:** Scanned `src/` (engine, layout, state, organs, compounds, layout-organ, behavior, screen-loader, API); compared to `src/docs/ARCHITECTURE_AUTOGEN/` and `src/docs/SYSTEM_MAP_AUTOGEN/`.

---

## 🔴 Outdated docs

Docs that no longer match runtime behavior (path or reference errors only; no full-regeneration).

| Doc | Mismatch |
|-----|----------|
| **ARCHITECTURE_AUTOGEN/RUNTIME_PIPELINE_CONTRACT.md** | Note (line 86) states `interpretRuntimeVerb` lives in `src/engine/runtime/runtime-verb-interpreter.ts`. Actual path is `src/logic/runtime/runtime-verb-interpreter.ts`. Code: `require("../../logic/runtime/runtime-verb-interpreter")` from `src/engine/core/behavior-listener.ts`. |
| **ARCHITECTURE_AUTOGEN/BEHAVIOR_TO_STATE_MAP.generated.md** | Lines 15–16 cite `src/engine/runtime/runtime-verb-interpreter.ts` for state:* and navigate. Runtime module lives in `src/logic/runtime/runtime-verb-interpreter.ts`. |
| **ARCHITECTURE_AUTOGEN/SYSTEM_DEPENDENCY_GRAPH.mmd** | Node `RVI` (line 36) labels runtime-verb-interpreter as `src/engine/runtime/runtime-verb-interpreter.ts`. Should be `src/logic/runtime/runtime-verb-interpreter.ts`. |
| **SYSTEM_MAP_AUTOGEN/START_HERE.md** | Line 17 lists "Runtime verbs (TSX path): `src/engine/runtime/`, `src/logic/runtime/`". There is no `src/engine/runtime/`; runtime-verb-interpreter and action-runner live only under `src/logic/runtime/`. Also lines 1–2 and 25–26 reference "docs/SYSTEM_MASTER/" and "docs/HI_SYSTEM/" as primary architecture reference; those root `docs/` paths were removed/relocated per git status — current live docs are under `src/docs/ARCHITECTURE_AUTOGEN/`, `src/docs/SYSTEM_MAP_AUTOGEN/`, and root-level maps (e.g. SYSTEM_MASTER_MAP.md, BLUEPRINT_QUICK_REFERENCE.md). |

---

## 🟡 Missing docs

No missing architectural contracts identified. Layout (page/component/resolver/compatibility), layout-organ, state stores, behavior-listener → state/store, screen load → compose → render path, and registry are all covered in ARCHITECTURE_AUTOGEN and SYSTEM_MAP_AUTOGEN.

---

## 🟢 New contracts discovered

None. Current code matches the described pipeline: Request → loadScreen (TSX or JSON) → root resolution → assignSectionInstanceKeys → expandOrgansInDocument → applySkinBindings → composeOfflineScreen → setCurrentScreenTree; layout from layout-store + template-profiles + section/card/organ override stores; resolveLayout (page + component) and layout-organ; JsonRenderer + applyProfileToNode + evaluateCompatibility (dev); behavior-listener → state/runBehavior/interpretRuntimeVerb (`src/logic/runtime/`). No new subsystems or contracts beyond what the autogen docs already describe.

---

## Proposed updates (apply only after user confirmation)

Below are **only the changed sections** for each affected file. Do not overwrite entire files.

---

### Proposed update for: `src/docs/ARCHITECTURE_AUTOGEN/RUNTIME_PIPELINE_CONTRACT.md`

**Location:** End of section 6 (Behavior), the Note after the Runtime verb row.

**Replace:**

```text
Note: `interpretRuntimeVerb` in `src/engine/runtime/runtime-verb-interpreter.ts` is invoked via require inside behavior-listener; it is not installed as a separate listener. `installRuntimeVerbInterpreter` in that file exists but is not called in the traced pipeline; the behavior-listener directly calls `interpretRuntimeVerb` on action events.
```

**With:**

```text
Note: `interpretRuntimeVerb` in `src/logic/runtime/runtime-verb-interpreter.ts` is invoked via require inside behavior-listener; it is not installed as a separate listener. `installRuntimeVerbInterpreter` in that file exists but is not called in the traced pipeline; the behavior-listener directly calls `interpretRuntimeVerb` on action events.
```

---

### Proposed update for: `src/docs/ARCHITECTURE_AUTOGEN/BEHAVIOR_TO_STATE_MAP.generated.md`

**Location:** Table rows that reference runtime-verb-interpreter (state:* and navigate).

**Replace:**  
Any occurrence of `src/engine/runtime/runtime-verb-interpreter.ts`  

**With:**  
`src/logic/runtime/runtime-verb-interpreter.ts`

(Apply to the two rows that cite the runtime verb interpreter file path.)

---

### Proposed update for: `src/docs/ARCHITECTURE_AUTOGEN/SYSTEM_DEPENDENCY_GRAPH.mmd`

**Location:** Line 36, node RVI.

**Replace:**

```text
RVI["runtime-verb-interpreter\nsrc/engine/runtime/runtime-verb-interpreter.ts"]
```

**With:**

```text
RVI["runtime-verb-interpreter\nsrc/logic/runtime/runtime-verb-interpreter.ts"]
```

---

### Proposed update for: `src/docs/SYSTEM_MAP_AUTOGEN/START_HERE.md`

**Location:** Table row "Logic" (line 17) and the "Current goal" / "One command" section that references docs/SYSTEM_MASTER and docs/HI_SYSTEM.

**Replace (Logic row):**

```text
| **Logic** | Behavior: `src/engine/core/behavior-listener.ts`, `src/behavior/` (runner, engine, verb resolver). State: `src/state/state-store.ts`, `src/state/state-resolver.ts`. Runtime verbs (TSX path): `src/engine/runtime/`, `src/logic/runtime/`. |
```

**With:**

```text
| **Logic** | Behavior: `src/engine/core/behavior-listener.ts`, `src/behavior/` (runner, engine, verb resolver). State: `src/state/state-store.ts`, `src/state/state-resolver.ts`. Runtime verbs: `src/logic/runtime/` (runtime-verb-interpreter, action-runner). |
```

**Replace (top "Primary Architecture Reference" and "Current goal" / "One command"):**

- Change "Primary Architecture Reference: docs/SYSTEM_MASTER/" to point to live docs, e.g.:  
  **Primary architecture reference:** `src/docs/ARCHITECTURE_AUTOGEN/`, `src/docs/SYSTEM_MAP_AUTOGEN/`, and root `SYSTEM_MASTER_MAP.md`, `BLUEPRINT_QUICK_REFERENCE.md`.
- Where it says to "open **docs/HI_SYSTEM/**" and read START_HERE, MAP, PLAN_ACTIVE: either remove if those paths are gone, or replace with: open `src/docs/SYSTEM_MAP_AUTOGEN/` and read `START_HERE.md`, `ENGINE_INDEX.md`, `RUNTIME_PIPELINE.md`; for plans see `src/cursor/` and root-level plan docs as applicable.

---

## Applied updates (2025-02-04)

The following updates were applied after running the protocol:

- **RUNTIME_PIPELINE_CONTRACT.md** — Corrected runtime-verb-interpreter path to `src/logic/runtime/`.
- **BEHAVIOR_TO_STATE_MAP.generated.md** — Replaced both citations of `src/engine/runtime/runtime-verb-interpreter.ts` with `src/logic/runtime/runtime-verb-interpreter.ts`.
- **SYSTEM_DEPENDENCY_GRAPH.mmd** — RVI node path set to `src/logic/runtime/runtime-verb-interpreter.ts`.
- **START_HERE.md** — Logic row updated (runtime verbs path); primary architecture reference and "One command" reading list updated to point to live `src/docs/` and root maps.
