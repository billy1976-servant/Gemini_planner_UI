/**
 * Canonical keys and allowed header names for universal CSV ingestion.
 * SynonymResolver matches normalized CSV headers against these lists.
 * Adding a new export format = adding entries here; no parsing logic change.
 */

export type CanonicalKey =
  | "date"
  | "region"
  | "hour"
  | "campaignId"
  | "adId"
  | "impressions"
  | "clicks"
  | "cost"
  | "conversions"
  | "revenue"
  | "impressionShare"
  | "lostImpressionShareBudget"
  | "lostImpressionShareRank";

/** Per canonical key: list of allowed header names (normalized: lowercase, trimmed). */
export const CSV_HEADER_SYNONYMS: Record<CanonicalKey, string[]> = {
  date: ["date", "day", "time", "report date", "segment date"],
  region: ["region", "location", "geo", "state", "geographic location", "location type", "country", "state/territory", "state / territory", "geography", "customer location", "user region"],
  hour: ["hour", "hour of day", "hour of day (advertiser time zone)", "hour of day (utc)"],
  campaignId: ["campaign_id", "campaign id", "campaign", "campaign id (name)", "campaign name"],
  adId: ["ad_id", "ad id", "ad", "ad group id", "ad group"],
  impressions: ["impressions", "impr", "imp", "views"],
  clicks: ["clicks", "clk", "clicks (all)"],
  cost: ["cost", "spend", "cost (usd)", "total cost", "cost in usd", "cost in local currency"],
  conversions: ["conversions", "conv", "converts", "conversions (all)", "total conversions"],
  revenue: ["revenue", "value", "total revenue", "conversion value", "conversion value (usd)"],
  impressionShare: ["impression share", "impr. share", "search impr. share", "search top is"],
  lostImpressionShareBudget: ["lost is (budget)", "lost impression share (budget)", "search lost is (budget)"],
  lostImpressionShareRank: ["lost is (rank)", "lost impression share (rank)", "search lost is (rank)"],
};

export const ALL_CANONICAL_KEYS: CanonicalKey[] = [
  "date",
  "region",
  "hour",
  "campaignId",
  "adId",
  "impressions",
  "clicks",
  "cost",
  "conversions",
  "revenue",
  "impressionShare",
  "lostImpressionShareBudget",
  "lostImpressionShareRank",
];
