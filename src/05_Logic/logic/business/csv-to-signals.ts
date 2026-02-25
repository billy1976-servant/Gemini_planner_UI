/**
 * Legacy CSV parser — thin wrapper over universal pipeline.
 * Parse CSV string into BusinessSignal[]. Uses universal ingestion; returns only signals for backward compatibility.
 */

import type { BusinessSignal } from "./business-signal";
import { universalCsvToSignals } from "./csv";

export interface CsvColumnMap {
  date?: string;
  region?: string;
  hour?: string;
  campaignId?: string;
  impressions?: string;
  clicks?: string;
  cost?: string;
  conversions?: string;
  revenue?: string;
}

/**
 * Parse CSV text into BusinessSignal[].
 * Delegates to universalCsvToSignals; returns signals only (legacy API).
 */
export function csvToSignals(
  csvText: string,
  options?: { columnMap?: Partial<CsvColumnMap>; timestamp?: number }
): BusinessSignal[] {
  const result = universalCsvToSignals(csvText, {
    timestamp: options?.timestamp,
    defaultRegion: "US",
    lenient: true,
  });
  return result.signals;
}
