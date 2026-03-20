/**
 * Shared API response types for workspace. No engine logic.
 */

/** Same shape as ads-aggregation.engine AggregatedMetrics. */
export interface AggregatedMetrics {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  conversionRate: number;
}

export interface InsightsResponse {
  noData?: boolean;
  executiveSummary?: {
    totalSpend: number;
    totalRevenue: number;
    roas: number;
    cpa: number;
    topState: string;
    topHour: number | null;
    worstState: string;
    growthOpportunities: string[];
  };
  highlights?: Array<{
    label: string;
    value: number;
    direction: "up" | "down" | "stable";
    severity: string;
  }>;
  ranking?: {
    topStates: Array<{ region: string; metrics?: { roas?: number; cost?: number }; rank?: number }>;
    worstStates: Array<{ region: string; metrics?: { roas?: number }; rank?: number }>;
    topHours: Array<{ hour: number; metrics?: { roas?: number; cost?: number }; rank?: number }>;
    worstHours: Array<{ hour: number; metrics?: { roas?: number }; rank?: number }>;
  };
  trends?: {
    numericSlope: number;
    trendDirection: string;
    periodOverPeriodDelta?: { cost?: number; conversions?: number; roas?: number; cpa?: number };
  };
  capacity?: {
    projectedSafeBudget: number;
    projectedAggressiveBudget: number;
    expectedROASAtExpansion?: number;
    marginalCPARisk?: number;
  };
  recommendations?: Array<{
    level: string;
    target: string;
    reason: string;
    expectedImpact: number;
  }>;
  growthOpportunities?: string[];
  projectionConfidenceScore?: number;
  saturation?: unknown;
  demand?: { scalingHeadroomPercent?: number } | null;
  marketDepth?: { scalingHeadroomPercent?: number } | null;
  efficiencyHistory?: { efficiencyTrend?: string; stabilityScore?: number } | null;
  bundleImpact?: unknown;
  /** For Compare/Timeline; from aggregation. */
  byCampaign?: Record<string, AggregatedMetrics>;
  byHour?: Record<number, AggregatedMetrics>;
  byState?: Record<string, AggregatedMetrics>;
}

export interface ProjectionSnapshot {
  id: string;
  timestamp: number;
  createdAt?: number;
  projectedBudget: number;
  projectedROAS: number;
  projectedCPA: number;
}

export interface ProjectionCompareResult {
  varianceROAS: number;
  varianceCPA: number;
  accuracyScore: number;
  adjustmentRecommendation: string;
}
