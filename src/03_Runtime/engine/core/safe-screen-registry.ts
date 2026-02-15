/**
 * Safe Screen Registry — STRING PATHS ONLY, NO STATIC IMPORTS
 *
 * All JSON screen refs are stored as paths. No import of optional JSON files
 * anywhere; loading is done at runtime via safeImportJson(path).
 */

import type { ComponentType } from "react";

export type ScreenRef =
  | { id: string; kind: "json"; path: string }
  | { id: string; kind: "tsx"; component: ComponentType<any> };

/** Known JSON screens (paths relative to apps-json/apps or apps-json/generated for generated/). Do not enumerate filesystem at runtime. */
const JSON_SCREEN_PATHS: { id: string; path: string }[] = [
  // behavior-tests
  { id: "behavior-tests/A-to-B", path: "behavior-tests/A-to-B.json" },
  { id: "behavior-tests/Journal_with_sections", path: "behavior-tests/Journal_with_sections.json" },
  { id: "behavior-tests/Layout_Dropdown", path: "behavior-tests/Layout_Dropdown.json" },
  { id: "behavior-tests/journal_without_sections", path: "behavior-tests/journal_without_sections.json" },
  // journal_track
  { id: "journal_track/app", path: "journal_track/app.json" },
  // onboarding (legacy refs; file may be missing)
  { id: "Onboarding/trial", path: "Onboarding/trial.json" },
  // legacy / docs
  { id: "websites/showcase/showcase-home", path: "websites/showcase/showcase-home.json" },
  { id: "journal_track/app-1", path: "journal_track/app-1.json" },
  { id: "behavior-tests/A-to-D-Test", path: "behavior-tests/A-to-D-Test.json" },
  { id: "new-blueprint-test/app-1", path: "new-blueprint-test/app-1.json" },
  // Module-system generated (apps-json/generated/<slug>/app.json)
  { id: "generated/dentist-smith/app", path: "generated/dentist-smith/app.json" },
  { id: "generated/contractor-jones/app", path: "generated/contractor-jones/app.json" },
  // Universal diagnostics (capability + System7 + sensors + action gating)
  { id: "diagnostics/universal", path: "diagnostics/universal-diagnostics.json" },
];

const REGISTRY: ScreenRef[] = [
  ...JSON_SCREEN_PATHS.map(({ id, path }) => ({ id, kind: "json" as const, path })),
  // TSX refs can be added here when needed, e.g.:
  // { id: "tsx:tsx-screens/diagnostics/ScreenDiagnostics", kind: "tsx", component: ScreenDiagnostics },
];

export function getAllScreenRefs(): ScreenRef[] {
  return [...REGISTRY];
}

export function getScreenRefById(id: string): ScreenRef | undefined {
  return REGISTRY.find((r) => r.id === id);
}

export function getScreenRefByPath(path: string): ScreenRef | undefined {
  const normalized = path.replace(/\.json$/i, "");
  return REGISTRY.find(
    (r) => r.kind === "json" && (r.path === path || r.path.replace(/\.json$/i, "") === normalized)
  );
}
