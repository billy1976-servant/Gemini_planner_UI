/**
 * Shared types for system-control UI layer.
 * Read-only: interprets scan data only; never modifies files.
 */

export type ScanTotals = {
  foldersScanned: number;
  tsxFiles: number;
  jsonFiles: number;
  enginesDetected: number;
  registries: number;
  loaders: number;
  runtimeModules: number;
  uiBlocks: number;
  screens: number;
  warningsCount: number;
  duplicatesCount: number;
  legacyPathsDetected: number;
};

export type RegistryEntry = { path: string; name: string; duplicated?: boolean; duplicateOf?: string };

export type SystemScanResult = {
  totals: ScanTotals;
  systemStructure: Record<string, { path: string; folderCount: number; fileCount: number; subfolders: string[]; byExt: Record<string, number> }>;
  engines: { name: string; location: string; importUsageCount: number }[];
  runtime: { path: string; fileCount: number; subfolders: string[] }[];
  blocks: {
    atomsCount: number;
    compoundsCount: number;
    definitionFilesCount: number;
    schemaFilesCount: number;
    runtimeRenderersCount: number;
    paths: { atoms: string[]; compounds: string[]; definitions: string[]; schemas: string[] };
  } | null;
  registries: { entries: RegistryEntry[]; duplicated: string[]; total: number };
  apps: { screenCount: number; templateCount: number; generatedWebsitesCount: number; paths: string[] };
  pathHealth: { kind: string; path: string; root?: string; mismatch?: string }[];
  warnings: { id: string; message: string; severity: "info" | "warn" | "error" }[];
  suggestions: { area: string; fix: string }[];
};

export type HealthStatus = "stable" | "minor_drift" | "needs_attention";

export type ImpactLevel = "low" | "medium" | "high";
export type SafetyLevel = "safe" | "medium" | "risky";

export type RefactorSuggestion = {
  id: string;
  title: string;
  impact: ImpactLevel;
  safety: SafetyLevel;
  safetyBadge: SafetyBadge;
  affectedPaths: string[];
  estimatedScope: number;
  affectedFilesCount: number;
  category: "registry" | "paths" | "engines" | "legacy" | "blocks" | "runtime";
};

export type MiniRefactorPlan = {
  id: string;
  title: string;
  impact: ImpactLevel;
  safety: SafetyLevel;
  safetyBadge: SafetyBadge;
  affectedPaths: string[];
  scopeSize: number;
  affectedFilesCount: number;
  steps: string[];
};

export type ScanCategoryStatus = "completed" | "attention" | "not_run";
export type ScanCategory = {
  id: string;
  label: string;
  status: ScanCategoryStatus;
  summary?: string;
};

export type SafetyZone = "safe" | "caution" | "do_not_touch";
export type SafetyZoneItem = {
  zone: SafetyZone;
  label: string;
  items: string[];
};

/** Safety badge for execution guard rails: SAFE = structural only, HIGH = runtime-touching (block execution). */
export type SafetyBadge = "SAFE" | "MEDIUM" | "HIGH";

/** Persisted control center state (localStorage). */
export type PersistedControlState = {
  lastScanTimestamp: number;
  lastPlanSelection: string[];
  previousHealthScore: number;
  previousStabilityScores?: StabilityScores;
};

/** Stability score categories (0–100 each; higher = healthier). */
export type StabilityScores = {
  registryHealth: number;
  identityStability: number;
  adapterIntegrity: number;
  engineFragmentation: number; // inverted: lower raw = more fragmented; we expose as 100 - raw
  legacyDebt: number;          // inverted: lower raw = more debt
};

export type DriftSeverity = "low" | "medium" | "high";
export type RefactorUrgency = "low" | "medium" | "high";

/** Scan module: conceptual group with sub-options. apiKeys map to existing system-scan API options. */
export type ScanModuleDef = {
  id: string;
  label: string;
  subOptions: { id: string; label: string; apiKeys: string[] }[];
};

/** Output of plan consolidation: merged scope, deduped steps, estimated safety/impact. */
export type CombinedRefactorPlan = {
  orderedSteps: string[];
  affectedPaths: string[];
  estimatedSafety: SafetyBadge;
  estimatedRuntimeImpact: "low" | "medium" | "high";
  planCount: number;
};
