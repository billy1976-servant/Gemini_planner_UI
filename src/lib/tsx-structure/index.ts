/**
 * TSX App Structure Engine — public API.
 * Universal library: JSON control plane, TSX renderer. Auto-discoverable by convention.
 */

export { resolveAppStructure, setResolverConfig, getResolverConfig } from "./resolver";
export type {
  ResolvedAppStructure,
  ScreenMetadata,
  StructureType,
  TimelineStructureConfig,
  ListStructureConfig,
  BoardStructureConfig,
  DashboardStructureConfig,
  EditorStructureConfig,
  DetailStructureConfig,
  WizardStructureConfig,
  GalleryStructureConfig,
  ResolverConfig,
  ResolverPatternConfig,
} from "./types";
export { SCHEMA_VERSION } from "./types";
export { StructureConfigProvider, useStructureConfig } from "./StructureConfigContext";
export { useAutoStructure } from "./useAutoStructure";
export type { UseAutoStructureResult } from "./useAutoStructure";
export { default as ProofStructureConsumer } from "./ProofStructureConsumer";

export * from "./contracts";
export * from "./engines";
