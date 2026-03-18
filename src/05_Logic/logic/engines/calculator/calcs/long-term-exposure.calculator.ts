/**
 * Long-term Exposure Calculator
 * 
 * Calculates long-term exposure impact over years.
 * 
 * Features:
 * - Frequency × impact accumulation
 * - Maintenance avoidance calculations
 * - Hidden by default (expandable only)
 * 
 * CONTRACT-BOUNDARY: Do not change shape without updating SystemContract.ts
 */

export interface LongTermExposureInput {
  dailyFrequency: number; // Times per day
  yearsOfExposure: number;
  impactPerExposure: number; // Impact score (0-10)
  accumulationRate?: number; // How impact accumulates (default: 1.0)
}

export interface LongTermExposureResult {
  totalExposures: number;
  cumulativeImpact: number;
  annualImpact: number;
  maintenanceAvoidance?: {
    avoidedIncidents: number;
    avoidedCost: number;
    unit: string;
  };
  proof: {
    formula: string;
    steps: string[];
    assumptions: string[];
  };
}

/**
 * Calculate long-term exposure impact
 * 
 * @param input - Exposure input parameters
 * @returns Calculation result with proof
 */
export function calculateLongTermExposure(
  input: LongTermExposureInput
): LongTermExposureResult {
  const { dailyFrequency, yearsOfExposure, impactPerExposure, accumulationRate = 1.0 } = input;

  // Total exposures over time
  const totalExposures = dailyFrequency * 365 * yearsOfExposure;

  // Cumulative impact (with accumulation)
  const cumulativeImpact = totalExposures * impactPerExposure * accumulationRate;

  // Annual impact
  const annualImpact = dailyFrequency * 365 * impactPerExposure * accumulationRate;

  // Maintenance avoidance (if applicable)
  let maintenanceAvoidance;
  if (impactPerExposure > 5) {
    // High impact exposures may lead to maintenance needs
    const avoidedIncidents = Math.floor(cumulativeImpact / 100); // Rough estimate
    maintenanceAvoidance = {
      avoidedIncidents,
      avoidedCost: avoidedIncidents * 200, // $200 per incident estimate
      unit: "USD",
    };
  }

  const proof = {
    formula: `cumulativeImpact = dailyFrequency × 365 × yearsOfExposure × impactPerExposure × accumulationRate`,
    steps: [
      `Total exposures: ${dailyFrequency} times/day × 365 days × ${yearsOfExposure} years = ${totalExposures.toLocaleString()} exposures`,
      `Cumulative impact: ${totalExposures.toLocaleString()} × ${impactPerExposure} × ${accumulationRate} = ${cumulativeImpact.toFixed(2)}`,
      `Annual impact: ${dailyFrequency} × 365 × ${impactPerExposure} × ${accumulationRate} = ${annualImpact.toFixed(2)}`,
    ],
    assumptions: ["long_term_exposure_accumulation", "daily_exposure_frequency"],
  };

  return {
    totalExposures,
    cumulativeImpact,
    annualImpact,
    maintenanceAvoidance,
    proof,
  };
}

/**
 * Calculate maintenance avoidance
 * 
 * @param yearsOwned - Years product will be owned
 * @param maintenanceFrequency - Maintenance frequency per year
 * @param costPerMaintenance - Cost per maintenance event
 * @returns Maintenance avoidance calculation
 */
export function calculateMaintenanceAvoidance(
  yearsOwned: number,
  maintenanceFrequency: number,
  costPerMaintenance: number
): {
  totalMaintenanceEvents: number;
  totalCost: number;
  avoidedWithBetterProduct: {
    eventsAvoided: number;
    costAvoided: number;
  };
} {
  const totalMaintenanceEvents = yearsOwned * maintenanceFrequency;
  const totalCost = totalMaintenanceEvents * costPerMaintenance;

  // Assume better product reduces maintenance by 30-50%
  const reductionFactor = 0.4; // 40% reduction
  const eventsAvoided = Math.floor(totalMaintenanceEvents * reductionFactor);
  const costAvoided = eventsAvoided * costPerMaintenance;

  return {
    totalMaintenanceEvents,
    totalCost,
    avoidedWithBetterProduct: {
      eventsAvoided,
      costAvoided,
    },
  };
}
