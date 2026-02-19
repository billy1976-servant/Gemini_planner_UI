/**
 * Wizard structure contract: config type, renderer props, and renderer boundary.
 */

import type { WizardStructureConfig } from "../types";

export type { WizardStructureConfig };

export interface WizardRendererProps {
  structureConfig: WizardStructureConfig;
  structureType: "wizard";
  schemaVersion: string;
  featureFlags?: Record<string, boolean | string>;
  onStepChange?: (stepIndex: number) => void;
  onComplete?: () => void;
}

/** JSON controls: steps source/showProgress/progressStyle, navigation back/next/skip/placement, branching enabled/decisionKey, linear. TSX controls: step content components, validation, submit flow. */
export const WIZARD_RENDERER_BOUNDARY =
  "JSON controls: steps source/showProgress/progressStyle, navigation back/next/skip/placement, branching enabled/decisionKey, linear. TSX controls: step content components, validation, submit flow.";
