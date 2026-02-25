/**
 * ReportClassifier — infer report type from column binding.
 * Used to decide which dimensions to populate (region, hour, campaignId, adId).
 */

import type { ColumnBinding } from "./synonym-resolver";
import type { CanonicalKey } from "./csv-header-synonyms";

export type ReportType =
  | "campaign"
  | "by_state"
  | "by_hour"
  | "ad_group"
  | "custom";

/**
 * Classify report from which canonical columns are present.
 * Order matters: more specific (hour, region+state, ad) before generic campaign/custom.
 * When region is present but hour/campaign_id/date are missing, report is by_state (region = grouping key).
 */
export function classifyReport(binding: ColumnBinding): ReportType {
  const has = (k: CanonicalKey) => binding.has(k);
  const hasDimension = has("hour") || has("date") || has("campaignId");
  if (has("hour")) return "by_hour";
  if (has("region")) {
    if (!hasDimension) {
      console.log("[report-classifier] Primary dimension: region (no date/hour/campaign_id); grouping by region.");
    }
    return "by_state";
  }
  if (has("adId")) return "ad_group";
  if (has("campaignId")) return "campaign";
  console.log("[report-classifier] Fallback: custom (no region/hour/campaign/ad).");
  return "custom";
}
