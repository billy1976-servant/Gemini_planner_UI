---
name: domain-based-routing-v2
overview: Extend the existing domain-based routing so that URL path segments also control section and version, enabling dynamic selection of versioned onboarding/landing files without code changes.
todos: []
isProject: false
---

### Goals

- **Preserve domain-based company/app routing** from the first plan while adding **section + version selection from the URL path**.
- **Let URLs control which versioned asset/screen loads** (e.g. `/onboarding/v2`, `/onboarding/v3`) by resolving to the correct 01_App file based on filename patterns.
- **Remove hardcoded version/file choices**, so new versions can be rolled out by dropping files following naming conventions.

### Target behavior

- **Domain → platform + company + base app**: Reuse the existing logic from the first plan (host → HIClarify vs Business, company, section) as-is.
- **First path segment = section**:
  - For a given company/app context, the **first URL path segment after the domain** represents the section folder, e.g. `/onboarding/...` → `Onboarding` folder.
  - This applies after any internal rewrite done by middleware (so you can keep special cases like `/prayer`).
- **Second path segment = version selector**:
  - The optional second path segment (e.g. `/v2`, `/v3`, `/version2`) selects a **version number**.
  - Normalization rules:
    - Lowercase the segment.
    - Accept prefixes like `v`, `version` and strip them; parse the numeric tail.
    - `v2`, `version2`, `V2` all normalize to the number `2`.
    - If no numeric tail can be parsed, treat as "no explicit version" and fall back to default.
- **File resolution rules** (example for Business Container Creations onboarding):
  - The base folder for the section is determined by domain + section: e.g. `src/01_App/Business/Container_Creations/` for the ContainerCreations business.
  - For a given **section** and **version number N**:
    - Find files in that section folder whose name contains the version number `N` according to your conventions.
    - Example mapping:
      - `onboarding/v2` → matches `ContainerCreationsLanding-2.json` (or a similar `*2.`* filename under the `Onboarding`/section folder).
      - `onboarding/v3` → matches `ContainerCreationsLanding-3.json`.
  - **No version segment provided** → select the **default version**:
    - Prefer the **highest numeric version** among matching files, falling back to a non-versioned "base" file if present (e.g. `ContainerCreationsLanding.json` or `...-base.json`).

### Design & implementation outline

#### 1. Version parsing & normalization helpers

- Add a small utility module (or extend an existing domain/path util) with functions:
  - `parseVersionFromSegment(segment: string | undefined): number | null`:
    - If `segment` is falsy → `null`.
    - Normalize to lowercase; if it starts with `v` or `version`, strip that prefix.
    - Use a simple regex or numeric parse to extract an integer (e.g. `/^v?(?:ersion)?(\d+)$/`); return `null` if no integer.
  - `extractVersionFromFilename(filename: string): number | null`:
    - Scan for `-<number>` or other agreed patterns in the filename before extension (e.g. `ContainerCreationsLanding-2.json` → `2`).
- These helpers are **pure and testable**, and can be reused anywhere file-based versioning is needed.

#### 2. Section + version path extraction

- In the domain router (`_domain/[domain]/[[...path]]/page.tsx`) or any higher-level router where `path` segments are available:
  - Interpret `pathSegments[0]` as `sectionSegment` and `pathSegments[1]` as `versionSegment`.
  - Normalize `sectionSegment` into a folder/identifier (e.g. PascalCase) using existing name normalization utilities from the first plan.
  - Use `parseVersionFromSegment(pathSegments[1])` to get `versionNumber` or `null`.

#### 3. Version-aware file/module resolution

- In the existing **filesystem-based resolver** (the `require.context`-style code that locates `*App.tsx` or JSON assets under `src/01_App`):
  - After determining the **base folder** from domain + company + app + section, list available files for that section.
  - Build a list of candidate files with their extracted numeric versions from `extractVersionFromFilename`.
  - **Selection algorithm**:
    - If `versionNumber != null`:
      - Pick the file whose extracted version exactly equals `versionNumber`.
    - Else (no explicit version in URL):
      - If there are any files with numeric versions, pick the one with the **largest version number**.
      - Else, fall back to a base file that has no version number.
  - Use the selected file to either:
    - Import a TSX module (for screen components), or
    - Load JSON content (for JSON-based screens) via the existing pipeline (e.g. referencing the path in an app component).

#### 4. Replace hardcoded file selection with version-based lookups

- Identify places where a **specific versioned onboarding/landing file is hardcoded**, particularly in Business flows such as Container Creations:
  - Examples in `src/01_App/Business/Container_Creations/` like `ContainerCreationsLanding-2.json`, `ContainerCreationsLanding-3.json`, and any TSX wrappers that import them directly.
- Introduce an abstraction like `getVersionedOnboardingConfig({ company, section, versionNumber })` that:
  - Encapsulates the versioned file selection logic described above.
  - Is called by the Container Creations app (and similar flows) instead of directly importing a specific `...-2.json` or `...-3.json` file.
- Ensure that **all uses** of those onboarding files go through this new helper, so adding `-4.json` or `-5.json` automatically makes `/onboarding/v4` or `/onboarding/v5` work.

#### 5. URL → version wiring & defaults

- In the routing layer (domain router / app page for Business onboarding):
  - Use the **second path segment** to compute `versionNumber` and pass it either as:
    - A prop to the app component (e.g. `<ContainerCreationsLanding version={versionNumber} />`), or
    - A value in state/context that the app uses to call the central versioned loader.
- Ensure that when **no version segment** is present, the loader is called with `versionNumber = null`, triggering the default (latest) selection logic.
- Keep this behavior **orthogonal to dev mode**:
  - In `/dev` or other builder views, allow explicit screen selection to override versioning when needed, but when the dev URL uses a versioned path, it should still respect that version.

### Todos

- **version-utils**: Implement helpers to normalize version segments (e.g. `v2`, `version2`) and extract numeric versions from filenames.
- **section-version-routing**: Update the domain/path router to interpret the first path segment as section and the second as version, passing version data into the app layer.
- **versioned-file-resolver**: Extend the filesystem/module resolver to pick the correct file based on the requested version or default to the latest/base file.
- **container-creations-wiring**: Refactor Container Creations (and similar onboarding flows) to call a version-aware loader instead of importing fixed `Landing-2`/`Landing-3` files.
- **dev-mode-behavior**: Ensure dev mode and the existing screen selection dropdown remain functional and can use or override versioning derived from the URL as appropriate.

