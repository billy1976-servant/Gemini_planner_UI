# ROUND 3 — Phase 03: JSON Surface Compression

**Goal:** Minimal JSON surface: layout-definitions, config, contract, profiles, palettes; optional compound/organ bundle.

---

## Objectives

1. **Layout:** One layout-definitions (or page + component) file(s); one molecule-layouts; one presentation-profiles (if not done in R2). All under layout/data or lib/layout.
2. **Config:** One config.json or keep state-defaults, renderer-contract, ui-verb-map as three; document as "config surface."
3. **Contract:** JSON_SCREEN_CONTRACT.json only; no duplicate schema files for trunk.
4. **Palettes:** Single index or single bundle; palettes/index.ts already re-exports.
5. **Optional:** Single compound-definitions.json (all compound param/defaults); single build-time organs bundle (all organ variants). If not done, document as "optional R3 follow-up."

---

## Acceptance criteria

- [ ] Core trunk JSON is a small, named set: layout-definitions, molecule-layouts, presentation-profiles, config (1–3 files), JSON_SCREEN_CONTRACT, palettes (1 or index).
- [ ] No new JSON files added for trunk; only merges and re-exports.
- [ ] Optional: compound-definitions and/or organs bundle completed or explicitly deferred.

---

## Files to touch (planning)

- layout/data or lib/layout (merged JSON)
- config/
- contracts/JSON_SCREEN_CONTRACT.json (no schema change)
- palettes/
- compounds/ui/definitions (optional merge)
- organs (optional bundle script)

---

*Planning only; execution later.*
