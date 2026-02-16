# Version 3 — Unified Multi-Tool App — Execution Plan (Analysis Only)

**Mode:** Analysis only. No file edits, no implementation.  
**Carries forward:** Unified Input Engine v4 (capture → input-log → interpret + IntegrationLab + diagnostics). System Signals v2 (battery, network, device, screen; thermals stub).  
**Non-negotiables:** No refactors/renames/deletes. No changes to System7, state-store, JsonRenderer, or Registry contracts. Additive work local to `src/09_Integrations/**` and `src/01_App/apps-json/**` unless one minimal justified exception.

---

## A) V3 Corrected Mental Model (5 bullets)

1. **One app hub:** A single JSON-driven “Master Sensor Hub” screen where the user selects tools (Gyro / Camera / Audio / Motion / System signals). Each tool can have multiple views/variations (e.g. 10 gyro experiences) in one JSON file via repeated sections/cards and shared stateKeys — no duplication of logic, no 3 separate files per variation.

2. **Two pipelines, one log:** (A) Calibrated sensors: gyro, orientation, motion, camera, audio, location — capture → input-log → interpret (calibration later). (B) System signals: battery, network, device, screen (future: thermals, memory, lifecycle) — same capture → log → interpret with **normalization** only (no calibration). Both write to the same unified input log and timeline.

3. **Tools as views:** Tools do not own sensors. They consume the shared pipeline via actions (e.g. `diagnostics:sensorRead`, `diagnostics:sensorReadAll`, `diagnostics:systemSnapshot`) and state (e.g. `diagnostics_sensor_orientation`, `diagnostics_systemSnapshot`). User can turn on 2–3 tools together and share state (System7-style).

4. **JSON-first, Android-ready:** The primary product is a JSON-driven hub that generates tool views the user can open on the Android skin now. Live features (video stream, mic level bar, continuous motion) are bridged via minimal new UI primitives that bind to state/log safely without breaking the JSON-first rule.

5. **Launcher without overload:** Navigation/model for many tools and variations is section-based with optional “multi-toggle / multi-run” (run multiple sensors together, show combined output). Throttling/coalescing is central (capture/interpret), not per-tool. Capabilities and permissions UX is consistent (prompts + available/blocked status).

---

## B) Current State Inventory

### What exists now (file pointers)

| Area | What exists | Files |
|------|-------------|--------|
| **Unified pipeline** | fireTrigger → gate → read → append; getLatestInterpreted; appendInputEvent, getLatestRead, getLogSnapshot | [capture.ts](src/09_Integrations/capture.ts), [input-log.ts](src/09_Integrations/input-log.ts), [interpret.ts](src/09_Integrations/interpret.ts), [input-event.ts](src/09_Integrations/input-event.ts) |
| **Facade** | motion, location, camera, audio, device, gates; SensorId = orientation, motion, location, camera, audio, battery, network, device, screen | [04_FACADE/integrations.ts](src/09_Integrations/04_FACADE/integrations.ts), [modules/*.ts](src/09_Integrations/04_FACADE/modules/) |
| **Diagnostics actions** | sensorRead, inputLogSnapshot, capabilityDomain, system7Route, actionGating, resolveProfile, setCapabilityLevel, exportPdf, exportSummary, mediaPayloadHook | [diagnostics.actions.ts](src/05_Logic/logic/actions/diagnostics.actions.ts), [action-registry.ts](src/05_Logic/logic/runtime/action-registry.ts) |
| **JSON screens** | Universal diagnostics (capability + sensors + System7 + gating + export); IntegrationLab (per-sensor buttons + log snapshot) | [universal-diagnostics.json](src/01_App/apps-json/apps/diagnostics/universal-diagnostics.json), [IntegrationLab.screen.json](src/09_Integrations/05_TESTS/IntegrationLab.screen.json) |
| **Screen loading** | API serves JSON from apps-json/apps and from 09_Integrations/05_TESTS for integration-lab.json; safe-screen-registry lists ids/paths | [route.ts](src/app/api/screens/[...path]/route.ts), [safe-screen-registry.ts](src/03_Runtime/engine/core/safe-screen-registry.ts) |
| **Viewer primitives** | diagnostics-value (stateKey → JSON dump); select (DiagnosticsLevelSelect for capability domain) | [DiagnosticsValueViewer.tsx](src/04_Presentation/ui/dev/DiagnosticsValueViewer.tsx), [registry.tsx](src/03_Runtime/engine/core/registry.tsx) |
| **Behavior** | Action type with params.name + params (e.g. diagnostics:sensorRead, sensorId). Navigate: behavior.json has navigations (go, back, open, close, route); installBehaviorListener in layout does router.replace(`/dev?screen=...`) or state:currentView | [behavior-runner.ts](src/03_Runtime/behavior/behavior-runner.ts), [behavior.json](src/03_Runtime/behavior/behavior.json), [layout.tsx](src/app/layout.tsx) |
| **Mobile-test (TSX)** | Live camera (video + srcObject), mic level (AnalyserNode + animation frame), motion/orientation listeners, battery/network, Test All grid; direct browser APIs, no 09_Integrations | [mobile-test/page.tsx](src/app/diagnostics/mobile-test/page.tsx) |

### What is missing (for V3)

- **Master Sensor Hub** JSON screen (single hub with sections: Gyro, Camera, Audio, Motion, System signals).
- **Launcher/navigation** model for many tools/variations (section-based + optional deep links; no new contracts).
- **diagnostics:sensorReadAll** action (orchestration over existing fireTrigger list).
- **Unified “system snapshot”** derived view (latest battery, network, device, screen in one object) + action to write it to state (e.g. diagnostics_systemSnapshot) + JSON panel to show it.
- **Variations in one JSON** per tool class (e.g. one gyro JSON with multiple cards/sections, shared stateKeys).
- **Multi-toggle / multi-run** mode (run multiple sensors together, combined output state key).
- **Bridge for live features:** camera-preview viewer, mic-level viewer (minimal new primitives binding to state/log).
- **Situational awareness:** analysis and plan hooks only (orientation/holding → suggested tool mode); no implementation in this plan.
- **Capabilities + permissions UX:** consistent prompts and available/blocked in UI (surfacing existing capability + interpret results).
- **Throttling/coalescing policy** (design only; central throttles in capture/interpret).
- **Folder organization** inside 09_Integrations (proposed layout for two pipelines; no moves yet).
- **Migration path** for mobile-test: parity checklist and when JSON hub replaces it.

---

## C) V3 Execution Plan (Numbered Steps)

Each step: intent, exact files to touch, JSON artifacts, new action names + registration, build/test gate.

---

### Step 1 — Add system snapshot API and diagnostics action (S4)

- **Intent:** Expose a unified “system snapshot” (latest battery, network, device, screen) as one object. Interpretation layer returns it; diagnostics action writes it to state for the hub.
- **Files to touch:**  
  - `src/09_Integrations/interpret.ts` — add `getSystemSnapshot(): { battery, network, device, screen } | null` (read getLatestInterpreted for each of battery, network, device, screen; return one object).  
  - `src/05_Logic/logic/actions/diagnostics.actions.ts` — add `runDiagnosticsSystemSnapshot`; write to `diagnostics_systemSnapshot`.  
  - `src/05_Logic/logic/runtime/action-registry.ts` — register `diagnostics:systemSnapshot`.
- **JSON:** None this step.
- **New action:** `diagnostics:systemSnapshot`. Registered in action-registry.ts.
- **Build/test gate:** `npm run build`. Manual: trigger action (e.g. from universal-diagnostics or a temp button), confirm state.values.diagnostics_systemSnapshot has battery, network, device, screen.

---

### Step 2 — Add diagnostics:sensorReadAll orchestration action (S3)

- **Intent:** One action that fires all allowed sensors (existing SensorId list), then writes a combined result or per-sensor results to state so “Test All” in the hub is one button.
- **Files to touch:**  
  - `src/05_Logic/logic/actions/diagnostics.actions.ts` — add `runDiagnosticsSensorReadAll`. Loop over KNOWN_SENSOR_IDS (or a dedicated SYSTEM_SIGNAL_IDS + CALIBRATED_IDS if you want to separate), call fireTrigger for each, then getLatestInterpreted for each; write to e.g. `diagnostics_sensorReadAll` as `{ results: Record<SensorId, InterpretedResult | null>, t }`.  
  - `src/05_Logic/logic/runtime/action-registry.ts` — register `diagnostics:sensorReadAll`.
- **JSON:** None this step.
- **New action:** `diagnostics:sensorReadAll`. Registered in action-registry.ts.
- **Build/test gate:** `npm run build`. Manual: trigger diagnostics:sensorReadAll, confirm state has diagnostics_sensorReadAll with results for each sensor.

---

### Step 3 — Create Master Sensor Hub JSON screen (S1, S2)

- **Intent:** One “Master Sensor Hub” screen with organized sections: Gyro (orientation), Camera, Audio, Motion, System signals (battery, network, device, screen). Each section has buttons (e.g. Read, or Test All) and diagnostics-value viewers. Launcher/navigation: user opens this screen via existing dev?screen= or navigator; no new nav contract.
- **Files to touch:** None in 09_Integrations or logic (JSON only).
- **JSON artifacts to add:**  
  - New file: `src/01_App/apps-json/apps/diagnostics/sensor-hub.json` (or `master-sensor-hub.json`). Structure: screen → sections: “Gyro”, “Camera”, “Audio”, “Motion”, “System signals”. In each section: card(s) with button(s) (e.g. “Read orientation” → diagnostics:sensorRead sensorId orientation; “System snapshot” → diagnostics:systemSnapshot; “Test all” → diagnostics:sensorReadAll) and diagnostics-value with stateKey diagnostics_sensor_orientation, diagnostics_sensor_camera, … diagnostics_systemSnapshot, diagnostics_sensorReadAll.
- **Screen registration:** Add one entry to `src/03_Runtime/engine/core/safe-screen-registry.ts`: e.g. `{ id: "diagnostics/sensor-hub", path: "diagnostics/sensor-hub.json" }`. Path must match how API resolves (screens API uses SCREENS_ROOT = apps-json/apps; so path relative to apps is `diagnostics/sensor-hub.json` and the file must live under `src/01_App/apps-json/apps/diagnostics/`).  
  - **Minimal exception:** safe-screen-registry is outside 09_Integrations and apps-json; justified because it is the single place that declares loadable screens; one new row is additive.
- **Build/test gate:** `npm run build`. Manual: open /dev?screen=diagnostics/sensor-hub (or equivalent from your navigator), confirm hub loads, sections visible, buttons trigger actions and viewers update.

---

### Step 4 — Gyro tool: one JSON with multiple variations (S5)

- **Intent:** One JSON file for the “Gyro” tool class with multiple views/variations (e.g. “Level simple”, “Level precision”, “Raw angles”) as repeated cards or sections, sharing the same stateKey (e.g. diagnostics_sensor_orientation) so no duplicate logic.
- **Files to touch:** None (JSON only).
- **JSON artifacts to add:**  
  - New file: `src/01_App/apps-json/apps/diagnostics/tool-gyro.json`. Content: screen with sections/cards for “Level simple”, “Level precision”, “Raw angles”; each card has “Read” button (diagnostics:sensorRead sensorId orientation) and same diagnostics-value stateKey diagnostics_sensor_orientation. Optionally add a “Level” display card that shows only beta/gamma (requires either a new viewer or a structured text block from state — see Step 8).  
  - Register in safe-screen-registry: `{ id: "diagnostics/tool-gyro", path: "diagnostics/tool-gyro.json" }`.
- **Build/test gate:** `npm run build`. Manual: open tool-gyro screen, switch between variations (sections), confirm one Read updates all viewers using same stateKey.

---

### Step 5 — System signals panel on hub (S4 continued)

- **Intent:** Dedicated “System signals” panel on the Master Sensor Hub showing the unified system snapshot (one diagnostics-value with stateKey diagnostics_systemSnapshot) plus optional per-signal buttons.
- **Files to touch:** None (covered by Step 3 JSON; ensure hub includes a section “System signals” with button “Refresh system snapshot” → diagnostics:systemSnapshot and diagnostics-value stateKey diagnostics_systemSnapshot).
- **JSON:** Included in sensor-hub.json from Step 3.
- **Build/test gate:** Manual: on hub, open System signals section, tap Refresh, confirm panel shows battery, network, device, screen in one block.

---

### Step 6 — Multi-toggle / multi-run mode (S6)

- **Intent:** Optional “run multiple sensors together” and show combined output. Implement as an action that accepts a list of sensorIds (e.g. diagnostics:sensorReadMultiple with param sensorIds: string[]) and fires fireTrigger for each, then writes combined result to a single state key (e.g. diagnostics_sensorReadMultiple).
- **Files to touch:**  
  - `src/05_Logic/logic/actions/diagnostics.actions.ts` — add `runDiagnosticsSensorReadMultiple(action: { sensorIds?: string[] }, _state)`. If sensorIds missing, default to system signals only [battery, network, device, screen]. Loop fireTrigger + getLatestInterpreted; write to diagnostics_sensorReadMultiple.  
  - `src/05_Logic/logic/runtime/action-registry.ts` — register `diagnostics:sensorReadMultiple`.
- **JSON:** In sensor-hub.json add a button “Run system signals” → diagnostics:sensorReadMultiple with params sensorIds: ["battery","network","device","screen"], and a diagnostics-value stateKey diagnostics_sensorReadMultiple.
- **Build/test gate:** `npm run build`. Manual: trigger multi-run, confirm combined output in one viewer.

---

### Step 7 — Bridge plan for live camera/mic (S7)

- **Intent:** Identify minimal new UI primitives so live camera preview and mic level bar can be used from JSON-driven screens without breaking JSON-first rule. No implementation in this plan; only design and where they would bind.
- **Files to touch:** None (analysis only).
- **Design:**  
  - **Camera preview:** A new Registry type (e.g. `camera-preview`) that: (1) reads a state key that may hold a “stream id” or “active” flag, and (2) when the app has started a stream (e.g. via diagnostics:sensorRead camera), a separate mechanism (e.g. a small hook or a dedicated “attach stream to ref” action) sets the stream onto a ref that the primitive subscribes to. Safe option: state holds `diagnostics_sensor_camera` with value `[MediaStream]` replaced by a sentinel; the actual MediaStream is not in state. So the minimal primitive is: component that subscribes to a “stream slot” provided by a 09_Integrations module (e.g. lastCameraStreamRef) and renders <video ref={…} /> when stream is present. Binding: JSON passes stateKey or a fixed key like diagnostics_cameraStreamRef; the primitive reads from 09_Integrations or from a single “stream registry” in 09_Integrations.  
  - **Mic level viewer:** Same idea: a primitive that reads from an analyser or level value. Option A: state key holds numeric level (updated by a periodic action or by a 09_Integrations “mic level” reader that writes to state). Option B: a small ref-based level meter component that subscribes to a 09_Integrations “current mic level” getter.  
  - **Exact files to touch when implementing:** (1) Add `src/09_Integrations/stream-bridge.ts` (or under system-signals-v2 if you prefer) to hold lastCameraStreamRef and optional getMicLevel(). (2) Add one component in 04_Presentation/ui/dev/ or 09_Integrations: CameraPreviewViewer, MicLevelViewer. (3) Register in registry.tsx as camera-preview, mic-level. (4) diagnostics.actions or capture.ts: when camera read succeeds, store stream in stream-bridge so CameraPreviewViewer can show it. No change to state-store contract; stream is not in state.
- **JSON:** Future. After primitives exist, hub or tool-camera.json would include type: "camera-preview" with params stateKey or streamKey; type: "mic-level" with params stateKey or levelKey.
- **Build/test gate:** N/A until implementation.

---

### Step 8 — Gyro Level “clear display” (minimal first deliverable) (D)

- **Intent:** User sees a clear level display (not only a JSON dump). Options: (A) New primitive “orientation-level” that reads diagnostics_sensor_orientation and renders a simple level (e.g. bubble or bar from beta/gamma). (B) Reuse diagnostics-value but add a “format” or “view” variant that, when value has beta/gamma, renders a short human line (e.g. “Level: β=2.1° γ=-0.5°”). Option B is smaller: extend DiagnosticsValueViewer with optional format: "orientationLevel" that, if value?.value?.beta != null, renders a single line “Level β=… γ=…” plus optional simple SVG/canvas bubble. Option A: new component OrientationLevelViewer, register as orientation-level.
- **Files to touch (Option B):** `src/04_Presentation/ui/dev/DiagnosticsValueViewer.tsx` — accept params.format; when stateKey corresponds to orientation and format === "orientationLevel", render compact level line + optional bubble.  
  **Files to touch (Option A):** New file `src/04_Presentation/ui/dev/OrientationLevelViewer.tsx` (or under 09_Integrations if you keep viewers local); register in registry.tsx as orientation-level. JSON then uses type: "orientation-level", params: { stateKey: "diagnostics_sensor_orientation" }.
- **JSON:** In tool-gyro.json add a card with orientation-level (or diagnostics-value with format orientationLevel) bound to diagnostics_sensor_orientation.
- **Build/test gate:** `npm run build`. Manual: open Gyro tool, tap Read orientation, confirm level display shows (bubble or line).

---

### Step 9 — Camera view minimal deliverable (D)

- **Intent:** At least preview or a justified staged approach. Staged approach: (1) Phase 1: Hub already has “Read camera” → diagnostics:sensorRead camera; diagnostics-value shows [MediaStream] or error. No live video yet. (2) Phase 2: Add camera-preview primitive (Step 7) and stream-bridge so that after “Read camera”, the preview component shows live video. Acceptance: on Android, open hub → Camera section → Read camera → either see JSON “active: true” or (Phase 2) live preview.
- **Files to touch:** Phase 1: none beyond hub JSON. Phase 2: as in Step 7 (stream-bridge, CameraPreviewViewer, registry, wiring in capture or diagnostics to push stream to bridge).
- **JSON:** Hub Camera section: button “Read camera”, diagnostics-value diagnostics_sensor_camera. Phase 2: add camera-preview component with streamKey.
- **Build/test gate:** Phase 1: manual confirm camera section and payload. Phase 2: manual confirm preview on device.

---

### Step 10 — Situational awareness hooks (S8)

- **Intent:** Analysis and plan hooks only. No implementation. Document: when orientation/holding state is available (e.g. beta/gamma from getLatestInterpreted("orientation")), a future “situational awareness” module could suggest tool mode (portrait → cam, landscape → level). Hooks: (1) interpret layer could expose “derived.holdingState” (e.g. portrait/landscape/flat) from beta/gamma. (2) Hub or launcher could read that and show a hint or auto-open a suggested tool. No files to touch in V3; add a short note in 09_Integrations or system-architecture doc.
- **Files to touch:** None, or one doc file under system-architecture or 09_Integrations/06_NOTES.
- **Build/test gate:** N/A.

---

### Step 11 — Capabilities + permissions UX (S9)

- **Intent:** Consistent “available/blocked” and permission prompts in the hub. Surface existing capability and interpret results: (1) For each tool section, show “Available” or “Blocked” from getLatestInterpreted or from capability (isSensorAllowed). (2) When user taps Read and result is error (e.g. permission denied), show message in diagnostics-value (already there). Optional: add a small “Capability status” card on hub that calls diagnostics:resolveProfile and diagnostics:capabilityDomain for sensors/camera and shows level; and/or per-section “Status: allowed | blocked” from last sensor read result.
- **Files to touch:** Optional: `src/05_Logic/logic/actions/diagnostics.actions.ts` — add `runDiagnosticsSensorsAvailability` that writes diagnostics_sensorsAvailability: Record<SensorId, { allowed: boolean }> using gates.isSensorAllowed for each. No new contracts.  
  **JSON:** Hub: add card “Sensor availability” with button “Refresh” → diagnostics:sensorsAvailability and diagnostics-value stateKey diagnostics_sensorsAvailability. Or per-section show status from existing diagnostics_sensor_* (allowed/error in value).
- **New action (optional):** diagnostics:sensorsAvailability. Register in action-registry.
- **Build/test gate:** `npm run build`. Manual: toggle capability off, confirm hub shows blocked/available where applicable.

---

### Step 12 — Throttling/coalescing policy plan (S10)

- **Intent:** Design only. Central throttles in capture/interpret for battery/perf. Document: (1) In capture: max N reads per source per minute (configurable); coalesce rapid fireTrigger(sameId) into one read per time window. (2) In interpret: getLatestInterpreted and getSystemSnapshot are read-through; throttle only if we add continuous polling (not in current design). (3) No per-tool throttling; tools trigger on-demand. File: add 09_Integrations/06_NOTES/THROTTLING_POLICY.md or a section in 01_MASTER_PLAN.md.
- **Files to touch:** New file under 09_Integrations (e.g. `06_NOTES/THROTTLING_POLICY.md`) — text only. No code.
- **Build/test gate:** N/A.

---

### Step 13 — Folder organization proposal (S11)

- **Intent:** Clear visual separation of two pipelines inside 09_Integrations. No moves yet; propose layout so a human can see “calibrated” vs “system signals” and where future normalization lives.
- **Files to touch:** None (proposal only). Create a one-page doc: e.g. `09_Integrations/00_STRUCTURE_V3.md` (or 06_NOTES) with proposed tree:
  - `09_Integrations/
    - capture.ts, input-log.ts, interpret.ts, input-event.ts  (shared spine)
    - 04_FACADE/  (unchanged)
    - 05_TESTS/   (IntegrationLab + future hub-related tests)
    - system-signals-v2/   (future: power/, connectivity/, device-state/, display/, performance/ — conceptual from System Signals v2 plan)
    - calibrated/  (future: optional subfolder for calibration store / calibration pass — no file moves now)`
  So: “no moves yet” but document where new files would go for system-signals-v2 and for calibration.
- **Build/test gate:** N/A.

---

### Step 14 — Migration path for mobile-test (S12)

- **Intent:** Define parity checklist and when the JSON hub replaces /diagnostics/mobile-test. No delete or refactor of mobile-test in V3.
- **Files to touch:** None, or one doc: e.g. `09_Integrations/06_NOTES/MOBILE_TEST_PARITY.md`. Content: (1) Parity checklist: camera (start/stop/preview), mic (level bar), motion/orientation (live values), battery, network, device, screen, Test All. (2) JSON hub parity: when hub has camera preview (Step 7/9), system snapshot, sensorReadAll, and orientation level view (Step 8), hub is “feature parity” for primary use. (3) Decision: keep mobile-test as legacy TSX tester until hub has camera preview + mic level; then mark hub as preferred and mobile-test as “legacy hardware test only”.
- **Build/test gate:** N/A.

---

## D) Minimal First Deliverable (Android)

- **Gyro Level view:** Clear level display: implement Step 8 (Option A or B). Option B (extend DiagnosticsValueViewer with format "orientationLevel") is minimal: one viewer change, no new registry type. Option A (OrientationLevelViewer) gives a dedicated “level bubble” and is clearer UX. Recommendation: Option A for “clear level display” — one new component, one registry entry, one JSON card.
- **Camera view:** Phase 1: hub shows “Read camera” and JSON result (active/error). Phase 2: add camera-preview primitive + stream-bridge (Step 7) so Android shows live preview after Read camera. Staged approach justified: Phase 1 ships without touching MediaStream in state; Phase 2 adds minimal bridge and one primitive.
- **System signals snapshot panel:** Step 1 + Step 3: diagnostics:systemSnapshot action and hub section with one diagnostics-value stateKey diagnostics_systemSnapshot. User opens hub on Android, taps “Refresh system snapshot”, sees battery/network/device/screen in one block.

**Acceptance (Android):**  
(1) Open app → navigate to Master Sensor Hub (diagnostics/sensor-hub).  
(2) Gyro section: tap Read orientation → see level display (orientation-level or formatted diagnostics-value).  
(3) Camera section: tap Read camera → Phase 1: see JSON; Phase 2: see live preview.  
(4) System signals section: tap Refresh system snapshot → see single panel with battery, network, device, screen.

---

## E) Final Checklist (No Interpretation)

1. Implement **getSystemSnapshot** in interpret.ts; add **runDiagnosticsSystemSnapshot** and register **diagnostics:systemSnapshot**; verify with build + manual state check.
2. Add **runDiagnosticsSensorReadAll**; register **diagnostics:sensorReadAll**; verify build + manual combined result.
3. Create **sensor-hub.json** under apps/diagnostics with sections Gyro, Camera, Audio, Motion, System signals; register screen in safe-screen-registry; verify hub loads and buttons/views work.
4. Create **tool-gyro.json** with multiple variations (shared stateKey); register screen; verify one Read updates all variation viewers.
5. Ensure hub “System signals” section has diagnostics:systemSnapshot button and diagnostics_systemSnapshot viewer; verify panel.
6. Add **runDiagnosticsSensorReadMultiple** and register **diagnostics:sensorReadMultiple**; add hub button + viewer for diagnostics_sensorReadMultiple; verify.
7. Document camera-preview and mic-level bridge design (stream-bridge, primitives, binding); no code yet.
8. Implement Gyro level display: either OrientationLevelViewer (new component + registry) or DiagnosticsValueViewer format "orientationLevel"; add to tool-gyro.json; verify on device.
9. Camera: Phase 1 — hub camera section + diagnostics-value; Phase 2 — stream-bridge + camera-preview component + registry + wiring; verify on Android.
10. Add situational awareness note (optional doc); no code.
11. Optional: add diagnostics:sensorsAvailability and hub availability card; verify.
12. Write THROTTLING_POLICY.md (or equivalent) under 09_Integrations; no code.
13. Write folder structure proposal (00_STRUCTURE_V3.md or 06_NOTES); no moves.
14. Write MOBILE_TEST_PARITY.md with parity checklist and “when hub replaces mobile-test” decision.

---

**Document status:** Analysis and plan only. No file edits, no implementation. All steps are additive and respect non-negotiables. Single minimal exception: one new row in safe-screen-registry for new JSON screens (additive).
