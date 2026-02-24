/**
 * BusinessSignal — unified row of business metrics.
 * All downstream engines consume this shape.
 * Timestamps normalized at ingestion; region codes enforced when present.
 */

export type BusinessSignalSource = "google-ads" | "shopify" | "onboarding";

export interface BusinessSignalMetrics {
  impressions?: number;
  clicks?: number;
  cost?: number;
  conversions?: number;
  revenue?: number;
  /** 0–1 when available from reporting */
  impressionShare?: number;
  /** Lost impression share due to budget */
  lostImpressionShareBudget?: number;
  /** Lost impression share due to rank */
  lostImpressionShareRank?: number;
}

export interface BusinessSignal {
  source: BusinessSignalSource;
  timestamp: number;
  region?: string;
  hour?: number;
  campaignId?: string;
  adId?: string;
  metrics: BusinessSignalMetrics;
}

/** Normalized region code: uppercase, 2-letter when possible. */
export function normalizeRegion(region: string | undefined): string | undefined {
  if (region == null || region === "") return undefined;
  const trimmed = String(region).trim().toUpperCase();
  if (trimmed.length === 0) return undefined;
  return trimmed.length === 2 ? trimmed : trimmed.slice(0, 2);
}

/** Normalize hour from ISO string (e.g. "2026-02-24T14:00:00.000Z") to 0–23. */
export function normalizeHour(isoHour: string | undefined): number | undefined {
  if (isoHour == null || isoHour === "") return undefined;
  try {
    const d = new Date(isoHour);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.getUTCHours();
  } catch {
    return undefined;
  }
}

/** Normalize timestamp to ms; accept Date or number. */
export function normalizeTimestamp(ts: Date | number): number {
  if (typeof ts === "number") return ts;
  const t = ts.getTime();
  return Number.isNaN(t) ? Date.now() : t;
}

// ---------------------------------------------------------------------------
// Adapter input types (campaigns API / CSV shape)
// ---------------------------------------------------------------------------

export interface CampaignMetricsInput {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

export interface CampaignItemInput {
  id: string;
  name: string;
  status: string;
  channelType: string;
  budget: number;
  metrics: CampaignMetricsInput;
}

export interface HourlyPerformanceItemInput {
  hour: string;
  campaignId?: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

/**
 * Normalize campaigns + optional hourly performance into BusinessSignal[].
 * - One signal per campaign (aggregate metrics); timestamp = now.
 * - When hourlyPerformance present: one signal per hour per campaign (or global if no campaignId).
 * Region defaults to "US" when not provided by data; missing region handled gracefully downstream.
 */
export function normalizeCampaignsToSignals(
  campaigns: CampaignItemInput[],
  hourlyPerformance: HourlyPerformanceItemInput[] | undefined,
  options?: { defaultRegion?: string; timestamp?: number }
): BusinessSignal[] {
  const now = options?.timestamp ?? Date.now();
  const defaultRegion = options?.defaultRegion ?? "US";
  const signals: BusinessSignal[] = [];

  // Campaign-level signals (one per campaign)
  for (const c of campaigns) {
    signals.push({
      source: "google-ads",
      timestamp: now,
      region: defaultRegion,
      campaignId: c.id,
      metrics: {
        impressions: c.metrics.impressions ?? 0,
        clicks: c.metrics.clicks ?? 0,
        cost: c.metrics.cost ?? 0,
        conversions: c.metrics.conversions ?? 0,
        revenue: undefined,
      },
    });
  }

  // Hourly breakdown when available
  if (hourlyPerformance && hourlyPerformance.length > 0) {
    for (const h of hourlyPerformance) {
      const hourNum = normalizeHour(h.hour);
      signals.push({
        source: "google-ads",
        timestamp: now,
        region: defaultRegion,
        hour: hourNum,
        campaignId: h.campaignId,
        metrics: {
          impressions: h.impressions ?? 0,
          clicks: h.clicks ?? 0,
          cost: h.cost ?? 0,
          conversions: h.conversions ?? 0,
        },
      });
    }
  }

  return signals;
}
