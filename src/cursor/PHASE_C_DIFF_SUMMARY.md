# Phase C — JSON Consolidation (Structural Only) — Diff Summary

**Scope:** Merge multi-file JSON surfaces into single-authority bundles per domain. No logic, key, contract, or behavior-order changes. Layout authority, renderer, state, and behavior-listener untouched.

---

## 1. Spacing scales

### Merged

- **From:** `src/lib/layout/spacing-scales/default.json`, `luxury.json`, `saas.json`, `magazine.json`, `course.json`
- **Into:** `src/lib/layout/spacing-scales.json`
- **Structure:** Top-level keys `default`, `luxury`, `saas`, `magazine`, `course`. Each value preserves the original shape (e.g. `section`, `card` with `surface`, `layout`).

### Loader updated

- **File:** `src/lib/layout/spacing-scale-resolver.ts`
- **Change:** Single import from `./spacing-scales.json`; `SCALES` built from `scalesBundle.default`, `scalesBundle.luxury`, etc. No change to `getSpacingForScale()` signature or logic.

### Deleted

- `src/lib/layout/spacing-scales/default.json`
- `src/lib/layout/spacing-scales/luxury.json`
- `src/lib/layout/spacing-scales/saas.json`
- `src/lib/layout/spacing-scales/magazine.json`
- `src/lib/layout/spacing-scales/course.json`

---

## 2. Visual presets

### Merged

- **From:** `src/lib/layout/visual-presets/default.json`, `compact.json`, `spacious.json`, `prominent.json`, `editorial.json`
- **Into:** `src/lib/layout/visual-presets.json`
- **Structure:** Top-level keys `default`, `compact`, `spacious`, `prominent`, `editorial`. Internal shapes (section, card, button, list, etc.) unchanged.

### Loader updated

- **File:** `src/lib/layout/visual-preset-resolver.ts`
- **Change:** Single import from `./visual-presets.json`; `PRESETS` built from `presetsBundle.default`, etc. No change to `getVisualPresetForMolecule()` or `EXPERIENCE_TO_PRESET`.

### Deleted

- `src/lib/layout/visual-presets/default.json`
- `src/lib/layout/visual-presets/compact.json`
- `src/lib/layout/visual-presets/spacious.json`
- `src/lib/layout/visual-presets/prominent.json`
- `src/lib/layout/visual-presets/editorial.json`

---

## 3. Screen definitions

### Merged

- **From:** `src/lib/layout/definitions-screen/row.json`, `column.json`, `grid.json`, `stack.json`, `page.json`
- **Into:** `src/lib/layout/screen-definitions.json`
- **Structure:** Top-level keys `row`, `column`, `grid`, `stack`, `page`. Each value keeps `defaults` and `presets` as in the originals. Unused variants (`column-left.json`, `stack-left.json`) left in place and not merged.

### Loader updated

- **File:** `src/lib/layout/screen-layout-resolver.ts`
- **Change:** Single import from `@/lib/layout/screen-definitions.json`; `SCREEN_LAYOUT_DEFINITIONS` maps `row` → `screenDefinitions.row`, etc. No change to `resolveScreenLayout()` or `getScreenLayoutDefinition()`.

### Deleted

- `src/lib/layout/definitions-screen/row.json`
- `src/lib/layout/definitions-screen/column.json`
- `src/lib/layout/definitions-screen/grid.json`
- `src/lib/layout/definitions-screen/stack.json`
- `src/lib/layout/definitions-screen/page.json`

### Unchanged (unused variants)

- `src/lib/layout/definitions-screen/column-left.json`
- `src/lib/layout/definitions-screen/stack-left.json`

---

## 4. Calculator types

### Merged

- **From:** `src/logic/engines/calculator/calculator-types/simple-hours.json`, `profit.calculator.json`, `cleanup-labor.json`, `monthly-losss.json`, `test-calculator.json`, `wage-multiplier.calculator.json`
- **Into:** `src/logic/engines/calculator/calculator-types.json`
- **Structure:** Top-level keys `simpleHours`, `profit`, `cleanupLabor`, `monthlyLosss`, `testCalculator`, `wageMultiplier`. Internal content of each file preserved (type, calculators array, etc.).

### Loader updated

- **File:** `src/logic/engines/calculator/calcs/calc-registry.ts`
- **Change:** Single import from `../calculator-types.json`; `simpleHours = calculatorTypes.simpleHours`, `profit = calculatorTypes.profit`. `CALCULATOR_REGISTRY` mappings (cleanup_labor_monthly, cleanup-labor, profit, monthly-loss, morale) unchanged. No change to `getCalculator()`, `listCalculators()`, `hasCalculator()`, or calc function registration.

### Deleted

- `src/logic/engines/calculator/calculator-types/simple-hours.json`
- `src/logic/engines/calculator/calculator-types/profit.calculator.json`
- `src/logic/engines/calculator/calculator-types/cleanup-labor.json`
- `src/logic/engines/calculator/calculator-types/monthly-losss.json`
- `src/logic/engines/calculator/calculator-types/test-calculator.json`
- `src/logic/engines/calculator/calculator-types/wage-multiplier.calculator.json`

---

## 5. Files summary

| Action   | Count | Paths |
|----------|-------|--------|
| Created  | 4     | `lib/layout/spacing-scales.json`, `lib/layout/visual-presets.json`, `lib/layout/screen-definitions.json`, `logic/engines/calculator/calculator-types.json` |
| Modified | 4     | `lib/layout/spacing-scale-resolver.ts`, `lib/layout/visual-preset-resolver.ts`, `lib/layout/screen-layout-resolver.ts`, `logic/engines/calculator/calcs/calc-registry.ts` |
| Deleted  | 21    | 5 spacing-scales/*.json, 5 visual-presets/*.json, 5 definitions-screen (row/column/grid/stack/page), 6 calculator-types/*.json |

---

## 6. Confirmation: runtime behavior unchanged

- **Spacing:** `getSpacingForScale(scaleId, moleculeType)` still returns the same param overlay for the same inputs; data source is one bundle keyed by scale id.
- **Visual presets:** `getVisualPresetForMolecule(moleculeType, presetName, experience)` unchanged; resolution and fallbacks identical; data from one bundle.
- **Screen layout:** `resolveScreenLayout(type, preset, params)` and `getScreenLayoutDefinition(type)` unchanged; same defaults/presets merge and same return values; data from one bundle (row, column, grid, stack, page).
- **Calculators:** `getCalculator()`, `listCalculators()`, `hasCalculator()` and all registry aliases (cleanup_labor_monthly, cleanup-labor, profit, monthly-loss, morale) unchanged; data from one bundle (simpleHours, profit).
- **Layout authority:** Still in layout/ and lib/layout; no resolution moved into renderer.
- **Renderer, state, behavior-listener, engine systems:** Not modified.

Phase C JSON consolidation is complete with strict preservation of behavior and APIs.
