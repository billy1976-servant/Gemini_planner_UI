"use client";

/**
 * Wizard engine: normalizer and useWizardConfig hook.
 */

import { useStructureConfig } from "../StructureConfigContext";
import type { WizardStructureConfig } from "../types";

export function toWizardConfig(template: Record<string, unknown>): WizardStructureConfig {
  const steps = (template.steps as Record<string, unknown>) ?? {};
  const navigation = (template.navigation as Record<string, unknown>) ?? {};
  const branching = (template.branching as Record<string, unknown>) ?? {};
  return {
    steps: {
      source: steps.source === "data" ? "data" : "config",
      showProgress: steps.showProgress !== false,
      progressStyle: ((): WizardStructureConfig["steps"]["progressStyle"] => {
        const v = steps.progressStyle as string;
        return ["bar", "stepper", "dots", "minimal"].includes(v) ? (v as WizardStructureConfig["steps"]["progressStyle"]) : "stepper";
      })(),
    },
    navigation: {
      back: navigation.back !== false,
      next: navigation.next !== false,
      skip: navigation.skip === true,
      placement: ((): WizardStructureConfig["navigation"]["placement"] => {
        const v = navigation.placement as string;
        return ["bottom", "top", "sides"].includes(v) ? (v as WizardStructureConfig["navigation"]["placement"]) : "bottom";
      })(),
    },
    branching: {
      enabled: branching.enabled === true,
      decisionKey: typeof branching.decisionKey === "string" ? branching.decisionKey : undefined,
    },
    linear: template.linear !== false,
  };
}

export function useWizardConfig(): WizardStructureConfig | null {
  const resolved = useStructureConfig();
  if (!resolved || resolved.structureType !== "wizard") return null;
  return toWizardConfig(resolved.template);
}
