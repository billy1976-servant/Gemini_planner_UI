/**
 * Ads Ranking Engine — JSON only.
 * Input: aggregated buckets (byState, byHour).
 * Output: topStates, worstStates, topHours, worstHours.
 * Rank by ROAS first; secondary sort by volume (cost) threshold.
 */

import type { AggregatedMetrics } from "./ads-aggregation.engine";

export interface RankedState {
  region: string;
  metrics: AggregatedMetrics;
  rank: number;
}

export interface RankedHour {
  hour: number;
  metrics: AggregatedMetrics;
  rank: number;
}

export interface AdsRankingInput {
  byState: Record<string, AggregatedMetrics>;
  byHour: Record<number, AggregatedMetrics>;
  topN?: number;
  volumeThreshold?: number; // min cost to qualify for "top" (avoid tiny buckets)
}

export interface AdsRankingOutput {
  topStates: RankedState[];
  worstStates: RankedState[];
  topHours: RankedHour[];
  worstHours: RankedHour[];
}

const DEFAULT_TOP_N = 5;
const DEFAULT_VOLUME_THRESHOLD = 0;

function rankStates(
  byState: Record<string, AggregatedMetrics>,
  topN: number,
  volumeThreshold: number
): { top: RankedState[]; worst: RankedState[] } {
  const entries = Object.entries(byState)
    .filter(([, m]) => m.cost >= volumeThreshold)
    .map(([region, metrics]) => ({ region, metrics }));
  entries.sort((a, b) => b.metrics.roas - a.metrics.roas);
  const top = entries.slice(0, topN).map((e, i) => ({ region: e.region, metrics: e.metrics, rank: i + 1 }));
  const worst = entries.slice(-topN).reverse().map((e, i) => ({ region: e.region, metrics: e.metrics, rank: i + 1 }));
  return { top, worst };
}

function rankHours(
  byHour: Record<number, AggregatedMetrics>,
  topN: number,
  volumeThreshold: number
): { top: RankedHour[]; worst: RankedHour[] } {
  const entries = Object.entries(byHour)
    .map(([h, m]) => ({ hour: Number(h), metrics: m }))
    .filter((e) => e.metrics.cost >= volumeThreshold && e.hour >= 0 && e.hour <= 23);
  entries.sort((a, b) => b.metrics.roas - a.metrics.roas);
  const top = entries.slice(0, topN).map((e, i) => ({ hour: e.hour, metrics: e.metrics, rank: i + 1 }));
  const worst = entries.slice(-topN).reverse().map((e, i) => ({ hour: e.hour, metrics: e.metrics, rank: i + 1 }));
  return { top, worst };
}

export function runAdsRanking(input: AdsRankingInput): AdsRankingOutput {
  const topN = input.topN ?? DEFAULT_TOP_N;
  const volumeThreshold = input.volumeThreshold ?? DEFAULT_VOLUME_THRESHOLD;
  const { top: topStates, worst: worstStates } = rankStates(input.byState, topN, volumeThreshold);
  const { top: topHours, worst: worstHours } = rankHours(input.byHour, topN, volumeThreshold);
  return {
    topStates,
    worstStates,
    topHours,
    worstHours,
  };
}
