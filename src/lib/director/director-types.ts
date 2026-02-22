/**
 * Director types — app schema and mode profile shape.
 * No feature names; config-driven only.
 */

import type { DirectorProps } from "./primitive-registry";

export type Archetype =
  | "journal"
  | "sequence"
  | "dashboard"
  | "presenter"
  | "form"
  | "collection"
  | "editor"
  | "hybrid";

/** Mode profile sub-blocks from mode-profiles.json */
export type VisualProfile = Partial<Pick<DirectorProps, "variant" | "typographyOverride" | "paletteOverride">>;
export type InteractionProfile = Partial<Pick<DirectorProps, "tooltipEnable" | "feedbackLevel" | "animationLevel">>;
export type BehaviorProfile = Partial<Pick<DirectorProps, "inlineEditEnable" | "readOnlyMode" | "advancedToggle">>;
export type DensityProfile = Partial<Pick<DirectorProps, "layoutDensity" | "compactMode">>;
export type SafetyProfile = Partial<
  Pick<DirectorProps, "modalEnable" | "roleBasedAccess" | "interactionStrictness" | "loggingVerbosity">
>;

export type ModeProfileConfig = {
  visualProfile?: VisualProfile;
  interactionProfile?: InteractionProfile;
  behaviorProfile?: BehaviorProfile;
  densityProfile?: DensityProfile;
  safetyProfile?: SafetyProfile;
};

export type ModeProfilesMap = Record<string, ModeProfileConfig>;

/** Optional app schema passed to Director (from resolver or JSON). */
export type AppSchema = {
  archetype?: Archetype;
  primitives?: Partial<DirectorProps>;
  defaults?: Partial<DirectorProps>;
};

export type DirectorContextValue = {
  directorProps: DirectorProps;
  /** Resolved experience (website | app | learning | focus). Used for visibility primitive. */
  experience: string;
  /** Resolved profile name (google | child | adult | business). */
  profileName: string;
  /** Resolved archetype from app schema or default. */
  archetype: Archetype;
};
