/**
 * Universal CSV pipeline: normalize → resolve → classify → extract → build.
 * Single entry point for any Google Ads CSV export.
 * No grouping or reduction: one CSV row → one signal when valid; region is a grouping dimension when present.
 */

import type { BusinessSignal } from "../business-signal";
import { normalizeCsv } from "./header-normalizer";
import { resolveSynonyms } from "./synonym-resolver";
import { classifyReport } from "./report-classifier";
import { extractAllRows } from "./metric-extractor";
import { buildSignals, type SignalBuilderOptions } from "./signal-builder";
import type { ReportType } from "./report-classifier";
import type { CanonicalKey } from "./csv-header-synonyms";

export interface UniversalCsvOptions extends SignalBuilderOptions {
  timestamp?: number;
  defaultRegion?: string;
  lenient?: boolean;
}

export interface UniversalCsvResult {
  signals: BusinessSignal[];
  reportType: ReportType;
  warnings: string[];
  rowCount: number;
}

const DIMENSION_KEYS: CanonicalKey[] = ["date", "region", "hour", "campaignId", "adId"];

function logDimensionResolution(binding: Map<string, number>, reportType: ReportType): void {
  const primaryKeys = DIMENSION_KEYS.filter((k) => binding.has(k));
  const groupingFields = reportType === "by_state" ? ["region"] : reportType === "by_hour" ? ["hour"] : reportType === "campaign" ? ["campaignId"] : [];
  const hasRegion = binding.has("region");
  const hasHour = binding.has("hour");
  const hasDate = binding.has("date");
  const hasCampaignId = binding.has("campaignId");
  const fallback = !hasRegion && !hasHour && !hasCampaignId ? "no dimensions → defaultRegion per row" : "";
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[universalCsvToSignals] primary dimension keys:", primaryKeys);
    console.log("[universalCsvToSignals] grouping fields:", groupingFields.length ? groupingFields : "none");
    console.log("[universalCsvToSignals] binding: region=" + hasRegion + " hour=" + hasHour + " date=" + hasDate + " campaignId=" + hasCampaignId);
    if (fallback) console.log("[universalCsvToSignals] fallback:", fallback);
  }
}

/**
 * Ingest CSV string through the full pipeline; return signals and metadata.
 * One row → one signal (no collapsing); when region is present it is the grouping key for aggregation.
 */
export function universalCsvToSignals(
  csvText: string,
  options: UniversalCsvOptions = {}
): UniversalCsvResult {
  const { headers, rows } = normalizeCsv(csvText);
  if (headers.length === 0 || rows.length === 0) {
    return { signals: [], reportType: "custom", warnings: [], rowCount: 0 };
  }

  const binding = resolveSynonyms(headers);
  const reportType = classifyReport(binding);
  logDimensionResolution(binding as Map<string, number>, reportType);

  const extracted = extractAllRows(rows, binding);
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[universalCsvToSignals] extracted rows:", extracted.length);
    if (extracted.length > 0) {
      const first = extracted[0];
      console.log("[universalCsvToSignals] first row dimensions: region=" + first.region + " hour=" + first.hour + " campaignId=" + first.campaignId);
    }
  }

  const { signals, warnings } = buildSignals(extracted, {
    timestamp: options.timestamp,
    defaultRegion: options.defaultRegion,
    lenient: options.lenient ?? true,
  });

  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[universalCsvToSignals] signals produced:", signals.length);
    if (signals.length > 0) {
      const uniqRegions = new Set(signals.map((s) => s.region ?? "undefined"));
      console.log("[universalCsvToSignals] unique regions in signals:", uniqRegions.size, Array.from(uniqRegions).slice(0, 10));
    }
  }

  return {
    signals,
    reportType,
    warnings,
    rowCount: signals.length,
  };
}
