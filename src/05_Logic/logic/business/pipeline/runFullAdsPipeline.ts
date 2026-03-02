/**
 * Legacy wrapper: delegates to shared pipeline.
 * Prefer runAdsPipelineFromSignals from @/logic/business/pipelines/ads-pipeline for new code.
 */

import { runAdsPipelineFromSignals } from "@/logic/business/pipelines/ads-pipeline";
import type { BusinessSignal } from "@/logic/business/business-signal";
import type { AdsAggregationOutput } from "@/logic/business/engines/ads-aggregation.engine";
import type { AdsInsightsOutput } from "@/logic/business/engines/ads-insights.engine";
import type { AdsRankingOutput } from "@/logic/business/engines/ads-ranking.engine";
import type { AdsTrendOutput } from "@/logic/business/engines/ads-trend.engine";
import type { AdsCapacityOutput } from "@/logic/business/engines/ads-capacity.engine";

export interface RunFullAdsPipelineResult {
  aggregation: AdsAggregationOutput;
  insights: AdsInsightsOutput & {
    ranking: AdsRankingOutput;
    trend: AdsTrendOutput;
    capacity: AdsCapacityOutput;
  };
}

export function runFullAdsPipeline(
  signals: BusinessSignal[],
  totalBudget: number = 0
): RunFullAdsPipelineResult {
  const result = runAdsPipelineFromSignals(signals, totalBudget);
  return {
    aggregation: result.aggregation,
    insights: result.insights,
  };
}
