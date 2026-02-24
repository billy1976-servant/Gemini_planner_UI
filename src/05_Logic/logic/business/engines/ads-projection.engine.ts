/**
 * Ads Projection Engine — create projection snapshots for later accuracy comparison.
 * JSON only; no side effects (store is called by API).
 */

import type { AggregatedMetrics } from "./ads-aggregation.engine";
import type { AdsCapacityOutput } from "./ads-capacity.engine";
import type { ProjectionSnapshot } from "../projections/projection-snapshot";

export interface AdsProjectionInput {
  currentMetrics: AggregatedMetrics;
  capacityOutput: AdsCapacityOutput;
  region?: string;
  hour?: number;
  id?: string;
}

/**
 * Create a projection snapshot from current metrics and capacity output.
 * Caller is responsible for persisting (e.g. projection-store).
 */
export function createProjectionSnapshot(input: AdsProjectionInput): ProjectionSnapshot {
  const { currentMetrics, capacityOutput, region, hour, id } = input;
  return {
    id: id ?? `proj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    region,
    hour,
    projectedBudget: capacityOutput.projectedSafeBudget,
    projectedROAS: capacityOutput.expectedROASAtExpansion,
    projectedCPA: currentMetrics.cpa + capacityOutput.marginalCPARisk,
  };
}
