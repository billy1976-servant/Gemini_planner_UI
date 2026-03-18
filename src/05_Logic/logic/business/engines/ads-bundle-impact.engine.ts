/**
 * Ads Bundle Impact Engine — JSON only.
 * Projected AOV lift, revenue lift %, bundle adoption estimate from configurable product mix.
 * All config JSON-driven; no speculation.
 */

import type { AggregatedMetrics } from "./ads-aggregation.engine";

export interface BundleProductAssumption {
  /** Product or SKU id */
  id: string;
  /** Share of conversions (0–1) */
  conversionShare: number;
  /** Lift multiplier if bundled (e.g. 1.15 = 15% AOV lift when in bundle) */
  bundleAovLiftMultiplier: number;
  /** Estimated adoption rate for bundle (0–1) */
  bundleAdoptionRate: number;
}

export interface BundleImpactConfig {
  products: BundleProductAssumption[];
  /** Fallback AOV lift when no product mix (e.g. 1.1 = 10%) */
  defaultAovLiftMultiplier?: number;
  /** Fallback adoption rate when no product mix */
  defaultBundleAdoptionRate?: number;
}

export interface AdsBundleImpactInput {
  totals: AggregatedMetrics;
  /** Current AOV (average order value) */
  currentAov: number;
  /** AOV when bundle is applied (optional; else derived from config) */
  bundledAov?: number;
  config: BundleImpactConfig;
}

export interface AdsBundleImpactOutput {
  projectedAovLift: number;
  projectedRevenueLiftPercent: number;
  bundleAdoptionRateEstimate: number;
}

const DEFAULT_AOV_LIFT = 1.1;
const DEFAULT_ADOPTION = 0.2;

export function runAdsBundleImpact(input: AdsBundleImpactInput): AdsBundleImpactOutput {
  const {
    totals,
    currentAov,
    bundledAov,
    config,
  } = input;

  const defaultLift = config.defaultAovLiftMultiplier ?? DEFAULT_AOV_LIFT;
  const defaultAdoption = config.defaultBundleAdoptionRate ?? DEFAULT_ADOPTION;

  if (!config.products || config.products.length === 0) {
    const liftMultiplier = defaultLift;
    const adoption = defaultAdoption;
    const projectedAovLift = currentAov * (liftMultiplier - 1);
    const projectedRevenueLiftPercent = (liftMultiplier - 1) * adoption * 100;
    return {
      projectedAovLift,
      projectedRevenueLiftPercent,
      bundleAdoptionRateEstimate: adoption,
    };
  }

  const weightedLift = config.products.reduce(
    (sum, p) => sum + p.conversionShare * (p.bundleAovLiftMultiplier - 1),
    0
  );
  const weightedAdoption = config.products.reduce(
    (sum, p) => sum + p.conversionShare * p.bundleAdoptionRate,
    0
  );
  const liftMultiplier = 1 + weightedLift;
  const adoption = weightedAdoption;

  const projectedAovLift = bundledAov != null
    ? bundledAov - currentAov
    : currentAov * (liftMultiplier - 1);
  const projectedRevenueLiftPercent = (liftMultiplier - 1) * adoption * 100;

  return {
    projectedAovLift,
    projectedRevenueLiftPercent,
    bundleAdoptionRateEstimate: adoption,
  };
}
