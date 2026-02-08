/**
 * Refactor planner: suggests priority fixes and mini refactor plans from scan data.
 * Read-only; no file modifications.
 */

import type { SystemScanResult } from "./types";
import type { RefactorSuggestion, MiniRefactorPlan } from "./types";

/**
 * Generate 5–10 priority refactor suggestions from scan result.
 */
export function getPrioritySuggestions(result: SystemScanResult): RefactorSuggestion[] {
  const list: RefactorSuggestion[] = [];
  let id = 0;
  const nextId = () => `refactor-${++id}`;

  const dup = result.registries.duplicated;
  if (dup.length > 0) {
    list.push({
      id: nextId(),
      title: "Consolidate duplicate registry files",
      impact: dup.length >= 3 ? "high" : "medium",
      safety: "safe",
      safetyBadge: "SAFE",
      affectedPaths: dup.slice(0, 10),
      estimatedScope: dup.length,
      affectedFilesCount: dup.length,
      category: "registry",
    });
  }

  if (result.registries.total > 5 && result.registries.duplicated.length > 0) {
    const paths = result.registries.entries.slice(0, 8).map((e) => e.path);
    list.push({
      id: nextId(),
      title: "Align registry paths to single source of truth",
      impact: "medium",
      safety: "safe",
      safetyBadge: "SAFE",
      affectedPaths: paths,
      estimatedScope: result.registries.entries.length,
      affectedFilesCount: paths.length,
      category: "registry",
    });
  }

  if (result.totals.enginesDetected > 20) {
    const enginePaths = result.engines.slice(0, 5).map((e) => e.location);
    list.push({
      id: nextId(),
      title: "Merge or group related engine folders",
      impact: "medium",
      safety: "medium",
      safetyBadge: "MEDIUM",
      affectedPaths: enginePaths,
      estimatedScope: result.totals.enginesDetected,
      affectedFilesCount: enginePaths.length,
      category: "engines",
    });
  }

  if (result.totals.legacyPathsDetected > 0) {
    const paths = ["screens/", "apps-tsx/core", "apps-tsx/utils"].filter(Boolean);
    list.push({
      id: nextId(),
      title: "Archive or remove legacy directories",
      impact: "medium",
      safety: "safe",
      safetyBadge: "SAFE",
      affectedPaths: paths,
      estimatedScope: result.totals.legacyPathsDetected,
      affectedFilesCount: result.totals.legacyPathsDetected,
      category: "legacy",
    });
  }

  if (result.blocks && (result.blocks.definitionFilesCount > result.blocks.compoundsCount + 5)) {
    const paths = result.blocks.paths.definitions.slice(0, 6);
    list.push({
      id: nextId(),
      title: "Normalize molecule/compound definitions",
      impact: "low",
      safety: "safe",
      safetyBadge: "SAFE",
      affectedPaths: paths,
      estimatedScope: result.blocks.definitionFilesCount,
      affectedFilesCount: paths.length,
      category: "blocks",
    });
  }

  if (result.runtime.length > 3) {
    const paths = result.runtime.map((r) => r.path);
    const scope = result.runtime.reduce((s, r) => s + r.fileCount, 0);
    list.push({
      id: nextId(),
      title: "Align runtime modules (screens, loaders, registry)",
      impact: "low",
      safety: "medium",
      safetyBadge: "HIGH",
      affectedPaths: paths,
      estimatedScope: scope,
      affectedFilesCount: scope,
      category: "runtime",
    });
  }

  if (result.pathHealth.length > 0) {
    const paths = result.pathHealth.slice(0, 6).map((p) => p.path);
    list.push({
      id: nextId(),
      title: "Resolve path/alias mismatches",
      impact: "medium",
      safety: "medium",
      safetyBadge: "MEDIUM",
      affectedPaths: paths,
      estimatedScope: result.pathHealth.length,
      affectedFilesCount: paths.length,
      category: "paths",
    });
  }

  if (result.warnings.some((w) => w.severity === "error")) {
    const count = result.warnings.filter((w) => w.severity === "error").length;
    list.push({
      id: nextId(),
      title: "Address high-severity warnings first",
      impact: "high",
      safety: "medium",
      safetyBadge: "MEDIUM",
      affectedPaths: [],
      estimatedScope: count,
      affectedFilesCount: count,
      category: "registry",
    });
  }

  return list.slice(0, 10);
}

/**
 * Build selectable mini refactor plans (small scoped units) from scan result.
 */
export function getMiniRefactorPlans(result: SystemScanResult): MiniRefactorPlan[] {
  const plans: MiniRefactorPlan[] = [];
  let id = 0;
  const nextId = () => `plan-${++id}`;

  const dup = result.registries.duplicated;
  if (dup.length >= 2) {
    const paths = dup.slice(0, 2);
    plans.push({
      id: nextId(),
      title: `Consolidate ${Math.min(2, dup.length)} duplicate registry files`,
      impact: "medium",
      safety: "safe",
      safetyBadge: "SAFE",
      affectedPaths: paths,
      scopeSize: 2,
      affectedFilesCount: paths.length,
      steps: ["Identify canonical registry path.", "Update imports to canonical path.", "Remove or deprecate duplicate file(s)."],
    });
  } else if (dup.length === 1) {
    plans.push({
      id: nextId(),
      title: "Consolidate 1 duplicate registry file",
      impact: "low",
      safety: "safe",
      safetyBadge: "SAFE",
      affectedPaths: dup,
      scopeSize: 1,
      affectedFilesCount: 1,
      steps: ["Point imports to single registry.", "Remove duplicate."],
    });
  }

  const regEntries = result.registries.entries.filter((e) => e.duplicated);
  if (regEntries.length > 0) {
    const paths = [...new Set(regEntries.map((e) => e.path))].slice(0, 3);
    plans.push({
      id: nextId(),
      title: `Normalize 1 registry path group (${paths.length} path(s))`,
      impact: "low",
      safety: "safe",
      safetyBadge: "SAFE",
      affectedPaths: paths,
      scopeSize: paths.length,
      affectedFilesCount: paths.length,
      steps: ["Choose single source of truth.", "Update references.", "Verify no broken imports."],
    });
  }

  if (result.totals.enginesDetected >= 3) {
    const group = result.engines.slice(0, 3).map((e) => e.location);
    plans.push({
      id: nextId(),
      title: "Group 3 related engines",
      impact: "low",
      safety: "medium",
      safetyBadge: "MEDIUM",
      affectedPaths: group,
      scopeSize: 3,
      affectedFilesCount: group.length,
      steps: ["Identify logical group.", "Document grouping.", "Optional: move into subfolder (manual)."],
    });
  }

  if (result.totals.legacyPathsDetected > 0) {
    const paths = ["screens/", "apps-tsx/core", "apps-tsx/utils"];
    plans.push({
      id: nextId(),
      title: "Move legacy files into archive folder (manual)",
      impact: "medium",
      safety: "safe",
      safetyBadge: "SAFE",
      affectedPaths: paths,
      scopeSize: result.totals.legacyPathsDetected,
      affectedFilesCount: result.totals.legacyPathsDetected,
      steps: ["Create archive folder.", "Move legacy files (manual).", "Update or remove imports (manual)."],
    });
  }

  if (result.blocks && result.blocks.definitionFilesCount > 0) {
    const paths = result.blocks.paths.definitions.slice(0, 3);
    plans.push({
      id: nextId(),
      title: "Align molecule definitions with registry",
      impact: "low",
      safety: "safe",
      safetyBadge: "SAFE",
      affectedPaths: paths,
      scopeSize: result.blocks.definitionFilesCount,
      affectedFilesCount: paths.length,
      steps: ["Audit molecule-definitions.json.", "Match types to registry keys.", "Remove unused definitions or register missing."],
    });
  }

  if (result.runtime.length > 0) {
    const paths = result.runtime.map((r) => r.path);
    const scope = result.runtime.reduce((s, r) => s + r.fileCount, 0);
    plans.push({
      id: nextId(),
      title: "Document runtime/screens and loaders boundary",
      impact: "low",
      safety: "safe",
      safetyBadge: "HIGH",
      affectedPaths: paths,
      scopeSize: scope,
      affectedFilesCount: scope,
      steps: ["Document which screens use runtime vs engine.", "Ensure screen-manifest and loaders align."],
    });
  }

  return plans.slice(0, 10);
}
