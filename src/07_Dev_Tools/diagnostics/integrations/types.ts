/**
 * Integration diagnostics stage result — matches pipeline style.
 * Used by IntegrationsPanel and runIntegrationTests.
 */

export type IntegrationStageResult = {
  stage: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
  substages?: Array<{ label: string; status: "PASS" | "FAIL"; detail?: string }>;
};
