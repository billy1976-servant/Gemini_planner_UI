# System 7 Integration Report (Read-Only)

**Purpose:** Map System 7’s role and dependencies, explain why it is not part of the active runtime spine, and provide a safe, step-by-step upgrade plan to make it a first-class, JSON-driven module without changing existing behavior.

**Scope:** Entire repo — files, imports, comments, JSON, runtime hooks. No code changes in this document.

---

## Reference map: where System 7 appears

| Location | Type | Role |
|----------|------|------|
| `src/engine/system7/` | **Implementation** | Only definition of System 7 in the codebase. Contains router, channels, definitions, sensors, `system7.json`, `system7.tsx`. |
| `src/engine/system7/system7.tsx` | Entry | Aggregates 7 channels; exports `System7(spec, data)`. |
| `src/engine/system7/system7-router.ts` | Router | Exports `System7Router.route(channel, action, payload)`; calls `System7(...)`. **Never imported outside this folder.** |
| `src/engine/system7/system7.json` | Config | Stub: `{"channels":{"identity":{},...,"timeline":{}}}`. **Not loaded by any code.** |
| `src/engine/system7/channels/*.tsx` (7) | Channels | identity, media, content, environment, parameters, style, timeline. Each returns `{ kind, channel, data, children }`. Only consumed by `system7.tsx`. |
| `src/engine/system7/definitions/*.ts` (7) | Schema-like | JSON-like content (id, label, description, fields). **Not imported by system7 or anywhere else.** |
| `src/engine/system7/sensors/*.ts` (6) | Sensors | audio, camera, device, lidar, location, screen. Export `read*()` helpers. **Not imported by system7 or anywhere else.** |
| `src/cursor/DEAD_FILE_AND_STRUCTURE_CLEANUP_AUDIT.md` | Doc | Marks `engine/system7/` as “Possible dead zone”; no external imports. |
| `src/cursor/FINAL_CLEANUP_VALIDATION_REPORT.md` | Doc | Same: isolated; “isolate; not trunk.” |
| `src/refactor_MASTER_FULL_PLAN.md` | Doc | Cluster 11: “System7 — Separate system — Isolate; not trunk.” |
| `src/refactor_ROUND 3/Phase3_Execution_Report.md` | Doc | Notes pre-existing TS errors in `engine/system7/definitions/*.ts`. |
| `src/docs/SYSTEM_MAP_AUTOGEN/REACHABILITY_REPORT.generated.md` | Generated | All 24 system7 modules listed as **UNREACHABLE**; “First break: (no importers)”. |
| `src/docs/HI Vision Definitions_(Vision Only)/Core System/System-7-Drivers_Media.txt` | Vision | Defines System 7 as “driver layer” and seven channels (MEDIA, CONTENT, ENVIRONMENT, TIMELINE, IDENTITY, PARAMETERS, STYLE). |
| `DOCS_INDEX.md`, `REPO_TREE.md`, `src-file-list.txt` | Tree / index | Mention system7 path or System-7 docs. |
| `src-file-list.txt` | List | Also references `src/engine/System-7/` (Pascal-case) identity, media-capture, navigation, etc. — **that path does not exist** in the current tree; only `src/engine/system7/` exists. |

**Conclusion:** The only runtime implementation is under `src/engine/system7/`. No app entrypoint, behavior pipeline, layout, or state layer imports `@/engine/system7` or any subpath. Definitions and sensors are unused by the rest of system7 itself.

---

## 1. Completeness assessment

| Area | Status | Notes |
|------|--------|--------|
| **Core aggregator** | Complete | `system7.tsx` wires all 7 channels and returns a single `{ kind: "system7", channels }` object. |
| **Router** | Complete but unused | `System7Router.route(channel, action, payload)` exists; no caller. |
| **Channels** | Complete | All 7 channels implemented with consistent shape: `{ kind: "semantic", channel, data, children }`. |
| **Channel contract** | Consistent | Each channel is a function `(spec, data) => semantic object`; no divergence. |
| **system7.json** | Stub only | Keys match channel names but values are empty; no behavior or schema. |
| **Definitions** | Present, unused | 7 files in `definitions/` with id/label/description/fields; not imported by system7 or any other module. |
| **Sensors** | Present, unused | 6 sensors with `read*()`; not referenced by channels or system7.tsx. |
| **Runtime wiring** | Missing | No import of System7 or System7Router from `app/`, `behavior/`, `engine/core/`, or state/layout. |
| **JSON-driven config** | Partial | Config exists as `system7.json` but is never loaded; channel behavior is code-only. |
| **Type safety** | Weak | `spec: any`, `data: any` throughout; definitions are JSON-in-.ts (some invalid as TS modules). |

**Overall:** Implementation of the “seven channels” idea is structurally complete inside `src/engine/system7/`, but the subtree is isolated: no runtime spine, no consumption of definitions/sensors, and no real JSON-driven behavior.

---

## 2. Gaps vs current engine / layout / state architecture

- **Runtime spine**
  - **Active spine:** `app/layout.tsx` → `installBehaviorListener`; `app/page.tsx` → `loadScreen`, `getLayout`, `JsonRenderer`, `setCurrentScreenTree`, etc. Behavior flows: CustomEvent `"action"` / `"navigate"` → `behavior-listener` → `runBehavior` (behavior-runner) or `dispatchState` or `navigate`.
  - **Gap:** System7 and System7Router are not in this graph. No `import` from `@/engine/system7` in layout, page, behavior-listener, behavior-runner, json-renderer, layout-store, state-store, or screen-loader.

- **Layout**
  - **Current:** Template profiles (e.g. `template-profiles.json`), layout-store (experience, type, preset, templateId, regionPolicy), resolveMoleculeLayout / getSectionLayoutId, etc. No concept of “System 7 channels” or driver layer.
  - **Gap:** System 7 does not feed layout decisions; layout does not read from System7(spec, data). No shared types or hooks.

- **State**
  - **Current:** state-store (dispatchState / getState), state-resolver (deriveState from intent log), state-defaults and config. No “channel” or “driver” slice.
  - **Gap:** System 7 output is not stored or subscribed to. No intent like `system7.dispatch` or `state.system7`; no subscription for UI to react to channel updates.

- **Behavior**
  - **Current:** behavior-listener routes by action name (e.g. contract verbs → runBehavior; `state:*` → dispatchState; `navigate` → navigate). behavior-runner uses behavior.json (interactions, navigations) and BehaviorEngine.
  - **Gap:** No action branch that calls System7Router.route(...). No event (e.g. `system7` or `channel`) that behavior-listener forwards to System 7. No mapping from behavior.json to channels/actions.

- **Engines / registries**
  - **Current:** logic/engines, engine-system (engine-registry), behavior-runner, palette-store, layout-store. system7 is explicitly “isolate; not trunk” in refactor plans.
  - **Gap:** System 7 is not registered as an engine and is not invoked by any engine registry or runner.

- **JSON-driven patterns elsewhere**
  - **Current:** Layout (layout-schema, template-profiles.json), behavior (behavior.json), config (config.json, state-defaults), compounds, palettes. Many layers are driven by JSON.
  - **Gap:** System 7’s behavior is hardcoded in channel functions; system7.json is not read; definitions are not used for codegen or runtime schema.

---

## 3. Exact integration points to connect it safely

To make System 7 part of the runtime without changing existing behavior, use these integration points only:

1. **Behavior listener (optional event branch)**  
   - **File:** `src/engine/core/behavior-listener.ts`.  
   - **Point:** After existing `action` handling (state:, navigate, contract verbs, etc.), add a **new** branch for a dedicated action or event (e.g. `actionName === "system7"` or a new `window.addEventListener("system7", ...)`).  
   - **Behavior:** Read `channel`, `action`, `payload` from event/params; call `System7Router.route(channel, action, payload)`; do **not** mutate layout or state unless you later define a clear contract (e.g. “media.capture” → state.update a known key).  
   - **Safety:** New branch only; no change to existing state:/navigate/contract-verb paths.

2. **Optional read-only “context” for renderer or layout**  
   - **Files:** e.g. `src/engine/core/json-renderer.tsx` or a small hook used by it.  
   - **Point:** If a molecule or screen schema later declares that it needs “system7 context,” call `System7(spec, data)` with spec/data from props or a small system7-store (see below); pass result as read-only context or prop.  
   - **Safety:** Consume only; no writes from System 7 into layout-store or state-store unless a separate, explicit contract exists.

3. **System7 “store” (optional, for subscription)**  
   - **New module:** e.g. `src/engine/system7/system7-store.ts` (or under state/).  
   - **API:** `getSystem7()`, `subscribeSystem7(fn)`, and optionally `dispatchSystem7(channel, action, payload)` that updates internal snapshot and calls `System7(...)`, then notifies subscribers.  
   - **Integration:** Only if you want UI to react to channel state; not required for “first-class JSON-driven module” but useful for first-class *runtime* presence.

4. **Loading system7.json**  
   - **File:** `src/engine/system7/system7.tsx` (or a small loader in the same folder).  
   - **Point:** At module init or first use, `import system7Config from "./system7.json"` (or fetch); use it to decide which channels are enabled or to pass default spec/data.  
   - **Safety:** Purely additive; channel functions already accept empty spec/data.

5. **Wiring definitions and sensors (optional, later)**  
   - **Definitions:** Either import definitions in system7.tsx (or a schema layer) and use them to validate or shape spec/data, or drive codegen from them.  
   - **Sensors:** Have channel implementations (e.g. media, environment) call sensor `read*()` where appropriate and merge into `data` before returning the semantic object.  
   - **Safety:** Internal to system7; no change to external behavior until you define how channel output affects state/layout.

6. **No direct changes to**  
   - layout-store, palette-store, state-resolver, behavior-runner’s existing logic, screen-loader, or app routing.  
   - Any existing behavior.json actions or contract verbs.

---

## 4. Weaknesses and legacy patterns to refactor

- **Typing:** Pervasive `any` for spec and data; no shared types for channel payloads or system7 result. Prefer interfaces (or types) for each channel’s spec/data and for the aggregated `System7` return type.
- **Definitions as .ts with raw JSON:** Files in `definitions/` are JSON-like content in `.ts`; some are invalid as TS modules (no export). Move to `.json` or use `as const` and proper `export` so they can be imported and used by system7 or tooling.
- **Sensors unused:** Sensors are not called by channels or system7. Either remove them, or have media/environment (and others as needed) call the appropriate `read*()` and fold results into channel `data`.
- **system7.json unused:** Config is not loaded. Load it and use it for channel enable/disable or default spec so that behavior is JSON-driven.
- **Router only logs:** `System7Router.route` logs and forwards to `System7`; it does not persist or broadcast result. Decide whether routing should update a system7-store and/or emit an event so UI or other engines can react.
- **No single “driver” entry for the app:** The vision doc describes System 7 as the “driver layer.” Today there is no single place that creates a System7(spec, data) from current app context (layout, state, URL). A small “driver” facade that builds spec/data from layout-store + state-store (read-only) and calls System7 would align with that idea without changing existing stores.
- **Duplicate naming (System-7 vs system7):** Docs and some paths use “System-7” or “System 7”; code uses `system7`. Standardize on one (e.g. `system7` in code and “System 7” in prose).
- **Pre-existing errors in definitions:** Refactor reports note TypeScript errors in `src/engine/system7/definitions/*.ts`. Fix when converting definitions to proper JSON or typed TS modules.

---

## 5. Step-by-step upgrade plan (first-class, JSON-driven, behavior-preserving)

1. **Stabilize and type (no wiring yet)**  
   - Add types for channel spec/data and for the return type of `System7` and each channel.  
   - Convert `definitions/*.ts` to valid modules (exported JSON or typed `as const`) or to `definitions/*.json` and import where needed.  
   - Fix existing TypeScript errors in `definitions/` reported in refactor docs.

2. **Make config the source of truth**  
   - Load `system7.json` from `system7.tsx` (or a dedicated loader).  
   - Use it to: enable/disable channels, and/or supply default `spec`/`data` per channel.  
   - Keep current channel function signatures; only feed them from JSON where applicable.

3. **Optional: system7-store**  
   - Add a minimal store: `getSystem7()`, `subscribeSystem7(fn)`, and optionally `dispatchSystem7(channel, action, payload)` that runs `System7Router.route` (or `System7`) and updates an internal snapshot, then notifies subscribers.  
   - Do not replace or alter state-store or layout-store.

4. **Wire router into the behavior pipeline (optional)**  
   - In `behavior-listener.ts`, add a branch for a dedicated action (e.g. `system7`) or a new `system7` event.  
   - In that branch only: read `channel`, `action`, `payload` and call `System7Router.route(channel, action, payload)`.  
   - If you introduced a system7-store, have the router update it after calling `System7`.  
   - Leave all existing action handling unchanged.

5. **Use definitions at runtime**  
   - Import definitions (from JSON or typed TS) in system7 or in a thin schema layer.  
   - Use them to validate or default spec/data for each channel, or to drive a single “channel config” structure read from system7.json.

6. **Wire sensors into channels**  
   - In media and environment channels (and others as needed), call the corresponding sensor `read*()` and merge into `data` before returning the semantic object.  
   - Keep channel output shape unchanged so existing callers (if any later) are unaffected.

7. **Optional: renderer/layout context**  
   - If a screen or molecule type is defined to “use system7 context,” have the renderer (or a hook) call `getSystem7()` (or `System7(spec, data)` with store-driven spec/data) and pass the result as read-only context.  
   - Do not let System 7 directly drive layout or state unless you add an explicit, documented contract (e.g. specific state keys or layout flags).

8. **Document and lock**  
   - Document System 7 as a first-class, JSON-driven module: config in system7.json, optional event in behavior-listener, optional store and read-only context.  
   - Add a short “System 7” section to the system overview / pipeline doc.  
   - Keep “no behavior change” for existing state:, navigate, and contract-verb flows.

---

## Summary

- **Role:** System 7 is an isolated “seven channels” implementation (identity, media, content, environment, parameters, style, timeline) with a router that is never called.  
- **Why it’s not in the spine:** No file outside `src/engine/system7/` imports it; refactor plans label it “isolate; not trunk”; reachability report marks all 24 modules as unreachable.  
- **Safe integration:** Add a dedicated branch/event in behavior-listener, optionally a system7-store and JSON-driven config, then definitions and sensors used inside system7 only; no changes to existing layout/state/behavior contracts.  
- **Upgrade plan:** Type and fix definitions → load system7.json → optional store → optional behavior-listener branch → definitions at runtime → sensors in channels → optional renderer context → document. All steps preserve current behavior of the active runtime spine.
