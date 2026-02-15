# 09_Integrations — Master Plan (Sections A → F)

Single authority for device integrations; additive only; no breaking moves.

---

## Section A — Create the New Authority Folder (NO MOVES YET)

- [x] Create folder: `src/09_Integrations/`
- [x] Create `00_README.md` (purpose + authority rule: all device hooks through this layer)
- [x] Create `01_MASTER_PLAN.md` (this file; plan A→F with checkboxes)
- [x] Create `02_INVENTORY.md` (auto-generated list of integration points)
- [x] Create `03_MANIFEST.json` (machine-readable inventory)
- [x] Create `04_FACADE/` (stable public API)
- [x] Create `05_TESTS/` (integration test screens / harness)
- [x] Create `06_NOTES/` (scratchpad)

---

## Section B — Auto-Discover “The 60 Components” (Inventory Generation)

- [x] Scan repo for integrations:
  - `src/03_Runtime/engine/system7/sensors/**` (sensor modules, gates, listeners)
  - `src/03_Runtime/engine/system7/*bridge*.ts` (environment, media, identity-auth)
  - `src/05_Logic/logic/engine-system/universal-engine-adapter.ts` (payload injection)
  - `read*()` sensor functions and event/listener hooks
- [x] Output to `02_INVENTORY.md` (human readable)
- [x] Output to `03_MANIFEST.json` (structured: id, category, current_file_path, exported_functions, wrapped?)

---

## Section C — Build the “09 Integrations” Facade (Wrap + Re-Export)

- [x] Create `04_FACADE/integrations.ts` — single import surface; stable API (motion, location, camera, audio, device, gates)
- [x] Wrappers call through to existing implementations; no rewrites
- [x] Stubs for missing capabilities (e.g. camera/audio “not wired”) that do not crash
- [x] Create per-category wrappers in `04_FACADE/modules/`: motion, location, camera, audio, device
- [x] Update `03_MANIFEST.json` to set `wrapped: true` where wrapper exists

---

## Section D — Make Progress Visible (One Test Harness Screen)

- [x] Create `05_TESTS/IntegrationLab.screen.json` — JSON-driven screen with buttons and result display
- [x] Buttons: Read Orientation, Read Motion, Read Location, Read Battery, Camera Test, Audio Test
- [x] Use existing UI primitives (section, card, button, diagnostics-value); no new component framework
- [x] Wire logic so each button calls `Integrations.<category>.<readFn>()` and shows result (state-driven)
- [x] Register screen and ensure API can serve it (or route to existing diagnostics)

---

## Section E — Minimum “Unified Input Engine” Wiring (Optional; Start the Spine)

- [x] Create `input-event.ts` (Event type)
- [x] Create `input-log.ts` (append + latest read)
- [x] Create `capture.ts` (fireTrigger → gate → read → append)
- [x] Create `interpret.ts` (latest passthrough)
- [ ] Do NOT integrate across the whole app; only let IntegrationLab optionally “Capture + Show Latest” to prove pipeline (spine ready; not wired into lab UI yet)

---

## Section F — Safe Migration (NOT TODAY)

- [ ] Do NOT physically move old files unless zero-risk
- [ ] If migrating later: move file into `src/09_Integrations/`, leave re-export shim at old path
- [ ] No mass import rewrite

---

## Deliverables Checklist

- [x] `01_MASTER_PLAN.md` (this file)
- [x] `02_INVENTORY.md`
- [x] `03_MANIFEST.json`
- [x] `04_FACADE/integrations.ts`
- [x] `05_TESTS/IntegrationLab.screen.json` (+ wiring so lab runs)
- [x] Project builds; lab runs; orientation + at least one more integration return real data (build verified; lab loadable at path integration-lab.json)
