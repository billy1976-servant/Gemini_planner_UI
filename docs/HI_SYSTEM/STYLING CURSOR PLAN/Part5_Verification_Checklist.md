# Part 5: Verification Steps — Checklist

From [Execution_Plan_UI_Layer.md](Execution_Plan_UI_Layer.md) lines 205–210.

## 1. Palette dropdown

- **Action:** Switch palette: default → dark → kids (in Navigator bar).
- **Confirm:** Typography (size, color), surfaces (background), shadows change.
- **Load:** `?screen=apps/diagnostics/app.json` (or equivalent diagnostics screen).

## 2. Experience / visual preset

- **Action:** Switch experience: app / website / learning.
- **Confirm:** Density changes (padding, gap). App = compact, learning = spacious.
- **Note:** website → default preset; app → compact; learning → spacious (see visual-preset-resolver).

## 3. JSON screens

- **Load:** `?screen=apps/journal_track/app-1.json`, `?screen=apps/diagnostics/app.json`.
- **Confirm:** Sections, Cards have elevation, typography, spacing. No TSX changes required.

## 4. Token resolution

- **Action:** Add temporary log in `resolveToken` ([src/engine/core/palette-resolve-token.ts](../../src/engine/core/palette-resolve-token.ts)); run app; open console.
- **Confirm:** All values resolve from palette (no raw token paths or px/rem in final output).
- **After verification:** Remove the temporary log.
