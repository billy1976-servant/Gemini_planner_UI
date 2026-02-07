# System 7 Wiring Report

Structural wiring only. No behavior changes, no activation, no sensor/camera/LiDAR/state/layout/renderer/behavior-listener integration.

---

## What was connected

| Item | Location | Description |
|------|----------|-------------|
| **Types** | `src/engine/system7/system7.types.ts` | `System7Input`, `System7Output`, `System7Channel` defined and used in system7.tsx and system7-router.ts. |
| **Entry** | `src/engine/system7/system7.entry.ts` | `runSystem7(input, context)` — calls `System7Router.route(channel, action, payload)` only. Does not touch state-store, layout-store, or sensors. |
| **Config** | `src/engine/system7/system7.config.json` | Created with `channels`, `definitions`, `sensors`, `exportModes` (all empty arrays). Loaded in system7.tsx via import; not used for logic. |
| **Engine registry** | `src/logic/engine-system/engine-registry.ts` | `EngineId` extended with `"system7"`. Identity stub engine `system7EngineStub(flow) => flow` in `ENGINE_REGISTRY`. Minimal `system7Presentation(flow)` in `PRESENTATION_REGISTRY`. In `applyEngine(flow, engineId)`, when `engineId === "system7"` the flow is returned unchanged (no execution engine call). System 7 is **not** in `EXECUTION_ENGINE_REGISTRY` (so it does not appear in `getAvailableEngines()` or step routing). |

---

## What remains dormant

- **No callers:** Nothing calls `runSystem7` or `applyEngine(flow, "system7")` from app, behavior, or renderer.
- **No auto-trigger:** No event listeners or mounts that invoke System 7.
- **No behavior-listener integration:** No action branch or `system7` event in behavior-listener.
- **No renderer integration:** No System 7 context or props in json-renderer or layout.
- **No state-store or layout-store:** System 7 does not read or write state or layout.
- **Definitions and sensors:** `definitions/*.ts` and `sensors/*.ts` are still unused by system7 code; config arrays are empty and unused.

---

## Where future sensors plug in

- **Channel layer:** Implementations under `src/engine/system7/channels/*.tsx` (e.g. media, environment) can later call the existing `read*()` helpers from `src/engine/system7/sensors/*.ts` and merge results into the channel `data` passed to the semantic object. No sensor code was added in this wiring pass.
- **Adapter option:** A thin adapter could call sensor `read*()` functions and pass their output as `data` into `System7(spec, data)` or into `System7Router.route` payloads. Again, no implementation in this pass.

---

## Where HI export would attach

- **Config hook:** `system7.config.json` includes an `exportModes` array (currently empty). A future HI export path can read this and/or read System 7 output from `runSystem7` (or a dedicated getter) to produce HI artifacts.
- **No implementation:** No export logic was added; this is a documented attachment point only.

---

## Files touched (summary)

| File | Change |
|------|--------|
| `src/engine/system7/system7.types.ts` | Created. |
| `src/engine/system7/system7.entry.ts` | Created. |
| `src/engine/system7/system7.config.json` | Created. |
| `src/engine/system7/system7.tsx` | Types applied; config imported (no logic use). |
| `src/engine/system7/system7-router.ts` | Return type `System7Output`; payload typed. |
| `src/logic/engine-system/engine-registry.ts` | `EngineId` + system7; stub engine and presentation; applyEngine branch. |
| `src/cursor/SYSTEM7_WIRING_REPORT.md` | This report. |
