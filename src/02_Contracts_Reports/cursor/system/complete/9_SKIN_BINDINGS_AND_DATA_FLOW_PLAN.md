# Plan 9 — Skin Bindings and Data Flow

**Purpose:** Define skin bindings (applySkinBindings) and data flow; palette and shells; compile path vs runtime path.

**Scope:** `src/logic/bridges/skinBindings.apply.ts`, `src/lib/site-skin/`, `src/engine/core/palette-store.ts`, `src/lib/site-renderer/palette-bridge.tsx`, shells (AppShell, LearningShell, WebsiteShell).

**Non-negotiables:**
- applySkinBindings called from page after document ready; no Layout/State mutation inside skin apply.
- Palette: layout and renderer subscribe to palette-store; no direct state-store write from palette.
- Compile path (compileSkinFromBlueprint) is API/script; runtime path is page → applySkinBindings.

**Current runtime summary:**
- page.tsx calls applySkinBindings(document, ...). layout.tsx uses usePaletteCSS (palette-bridge); json-renderer subscribes to palette. Shells used by page for wrapper. Status: Wired. See SKIN_APPLICATION_CONTRACT.generated.md.

**Required outputs:**
- Data flow doc: document → applySkinBindings → what; palette flow (store → bridge → layout/renderer).
- Contract: compile path vs runtime path; no overlap with Layout/State authority.

**Verification checklist:**
- [ ] applySkinBindings does not call dispatchState or setLayout/setOverride.
- [ ] Palette store is separate from state-store.
- [ ] Shell usage documented.

---

## Verification Report (Step 9)

| Check | Result |
|-------|--------|
| Purpose and scope defined | PASS |
| Non-negotiables stated | PASS |
| Current runtime summary | PASS |
| Required outputs | PASS |
| Verification checklist run | PASS |
