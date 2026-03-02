# Palette System Contract

**Authority:** This contract is the single source of truth for palette shape, discovery, and extension. All style values that affect look-and-feel must be resolvable from palette (or layout) variables—never from hardcoded defaults in TSX or components.

**Canonical location:** `src/02_Contracts_Reports/contracts/`. Discovery path: `src/04_Presentation/palettes/`.

---

## 1. What a palette is

A **palette** is a named set of design tokens: colors, spacing, typography, radii, borders, and other visual variables. It is stored as a single JSON file under the discovery directory. Each palette file defines the visual vocabulary for one theme or variant.

---

## 2. Palette shape

- **Format:** JSON.
- **Discovery:** All files under `src/04_Presentation/palettes/` with extension `.json` are discovered as palette candidates. The palette **id** is the filename without `.json` (e.g. `default`, `dark`, `premium`).
- **Top-level keys:** A palette MAY contain any of the following categories (and may add more in future by contract update only):
  - `page`, `color`, `surface`, `text`, `accent`, `border`, `radius`, `padding`, `gap`, `spacing`, `typography`, or other token namespaces agreed in this contract or its amendments.
- **Structure:** Each top-level key is an object of token name → value. Values are strings (e.g. hex), numbers (e.g. spacing/radius), or nested objects as defined by the palette schema. No executable code.
- **Required:** At minimum, a palette must be valid JSON and identifiable by its filename. Specific required keys may be added by contract update.

---

## 3. Discovery rules

- **Single directory:** Palettes are discovered from exactly one directory: `src/04_Presentation/palettes/`.
- **Naming:** Only files ending in `.json` are considered. The base name (without `.json`) is the palette id used in selection and reporting.
- **No inference:** Discovery is by filesystem scan only. No palette is implied or invented by code. All available palettes must appear in the Build Report “all available palettes” list before any selection is shown.
- **Listing order:** Reported palette lists must be deterministic (e.g. sorted alphabetically by id).

---

## 4. Layering and extension

- **New palettes:** Adding a new palette is done by adding a new `.json` file in `src/04_Presentation/palettes/` that conforms to this shape. No code edits to a central enum or registry are required for discovery.
- **Overlay / layering:** Palette layering or extension is allowed ONLY by:
  - Adding new palette files, or
  - Explicit overlay rules defined in configuration (e.g. base palette + override palette, or explicit overlay keys in a single palette).
- **Forbidden:** TSX or component-level fallbacks that supply style values when a palette token is missing. Missing tokens must not be replaced by hardcoded values in components; they must be resolved from palette (or layout) only or reported as missing.

---

## 5. Hardcoded styles and defaults — forbidden

- **No hardcoded styles:** Components and TSX must not define inline colors, spacing, fonts, radii, or other visual tokens as literal values (e.g. `#333`, `12px`, `margin: 8`). All such values must come from the selected palette (or from layout/presentation config that itself derives from palette or contract).
- **No default theme fallbacks:** When a token is absent from the chosen palette, the system must not substitute a default from code (e.g. “if no primary, use #1A6BD4”). Either the palette must provide the token, or the gap must be documented and handled by contract-defined overlay or by failing validation.
- **Palette is style authority:** Visual appearance is determined by the selected palette and its tokens. No component may override that authority with local style defaults.

---

## 6. Extensibility

- **New token namespaces or keys:** May be added by updating this contract (and optionally the palette JSON schema). Existing palettes need not include new keys until they are adopted.
- **New palettes:** Always allowed by adding conforming JSON files to the discovery directory; no change to this contract required for new files.
- **New overlay rules:** Allowed only if explicitly added to this contract or to a documented overlay mechanism that this contract references.

---

## 7. Build Report

Every Build Report must list:

- **All available palettes:** The full set of palette ids discovered from `src/04_Presentation/palettes/*.json`.
- **Palette used/selected:** Which palette was chosen for the build or scan, and from the discovered list.

Violations (e.g. use of a palette not in the discovered list, or use of hardcoded styles) must appear in the report’s Violations section.
