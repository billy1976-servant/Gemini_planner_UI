/**
 * SignalBuilder — map extracted rows to BusinessSignal[].
 * Validates types, hour range, no NaN/Infinity. Optional lenient mode (skip bad rows, collect warnings).
 */

import type { BusinessSignal, BusinessSignalMetrics } from "../business-signal";
import type { ExtractedRow } from "./metric-extractor";

export interface SignalBuilderOptions {
  timestamp?: number;
  defaultRegion?: string;
  /** If true, skip invalid rows and add to warnings; if false, throw on first invalid row. */
  lenient?: boolean;
}

export interface SignalBuilderResult {
  signals: BusinessSignal[];
  warnings: string[];
}

function safeNum(v: number | undefined): number | undefined {
  if (v == null) return undefined;
  if (Number.isNaN(v) || !Number.isFinite(v)) return 0;
  return v;
}

function buildMetrics(row: ExtractedRow): BusinessSignalMetrics {
  const metrics: BusinessSignalMetrics = {};
  const imp = safeNum(row.impressions);
  if (imp !== undefined) metrics.impressions = imp;
  const clk = safeNum(row.clicks);
  if (clk !== undefined) metrics.clicks = clk;
  const cost = safeNum(row.cost);
  if (cost !== undefined) metrics.cost = cost;
  const conv = safeNum(row.conversions);
  if (conv !== undefined) metrics.conversions = conv;
  const rev = safeNum(row.revenue);
  if (rev !== undefined) metrics.revenue = rev;
  const isShare = safeNum(row.impressionShare);
  if (isShare !== undefined) metrics.impressionShare = isShare;
  const lostBudget = safeNum(row.lostImpressionShareBudget);
  if (lostBudget !== undefined) metrics.lostImpressionShareBudget = lostBudget;
  const lostRank = safeNum(row.lostImpressionShareRank);
  if (lostRank !== undefined) metrics.lostImpressionShareRank = lostRank;
  return metrics;
}

function isValidSignal(row: ExtractedRow, options: SignalBuilderOptions): { ok: true; signal: BusinessSignal } | { ok: false; reason: string } {
  const now = options.timestamp ?? Date.now();
  const defaultRegion = options.defaultRegion ?? "US";

  let hour: number | undefined = row.hour;
  if (hour !== undefined && (hour < 0 || hour > 23 || !Number.isInteger(hour))) {
    // When region is present, treat invalid hour as campaign-level so signal groups by region.
    if (row.region) {
      hour = undefined;
    } else {
      return { ok: false, reason: `Invalid hour: ${row.hour}` };
    }
  }

  const region = row.region ?? defaultRegion;
  const metrics = buildMetrics(row);

  const signal: BusinessSignal = {
    source: "google-ads",
    timestamp: now,
    region: region || undefined,
    hour,
    campaignId: row.campaignId || undefined,
    adId: row.adId || undefined,
    metrics,
  };
  return { ok: true, signal };
}

/**
 * Build BusinessSignal[] from extracted rows. Validates each row; in lenient mode skips invalid and collects warnings.
 */
export function buildSignals(
  rows: ExtractedRow[],
  options: SignalBuilderOptions = {}
): SignalBuilderResult {
  const signals: BusinessSignal[] = [];
  const warnings: string[] = [];
  const lenient = options.lenient ?? true;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const result = isValidSignal(row, options);
    if (!result.ok) {
      const reason = (result as { ok: false; reason: string }).reason;
      if (lenient) {
        warnings.push(`Row ${i + 2}: ${reason}; skipped.`);
      } else {
        throw new Error(`Row ${i + 2}: ${reason}`);
      }
    } else {
      signals.push(result.signal);
    }
  }

  return { signals, warnings };
}
