/**
 * MetricExtractor — per-row extraction using column binding.
 * Uses normalizers from business-signal. Output: per-row plain object (canonical keys + parsed values).
 */

import type { ColumnBinding } from "./synonym-resolver";
import type { CanonicalKey } from "./csv-header-synonyms";
import { normalizeRegion, normalizeHour } from "../business-signal";

export interface ExtractedRow {
  date?: string;
  region?: string;
  hour?: number;
  campaignId?: string;
  adId?: string;
  impressions?: number;
  clicks?: number;
  cost?: number;
  conversions?: number;
  revenue?: number;
  impressionShare?: number;
  lostImpressionShareBudget?: number;
  lostImpressionShareRank?: number;
}

function parseNum(val: string): number {
  if (val == null || val === "") return 0;
  const n = Number(String(val).replace(/[^0-9.-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function parseHour(val: string): number | undefined {
  if (val == null || val === "") return undefined;
  const n = parseNum(val);
  if (n >= 0 && n <= 23) return n;
  // Pass through out-of-range numeric values so SignalBuilder can reject them (e.g. hour 99).
  const trimmed = String(val).trim();
  if (trimmed !== "" && !Number.isNaN(n)) return n;
  const d = new Date(val);
  if (!Number.isNaN(d.getTime())) return d.getUTCHours();
  return undefined;
}

function getCell(row: string[], binding: ColumnBinding, key: CanonicalKey): string {
  const idx = binding.get(key);
  if (idx == null || idx < 0 || row[idx] === undefined) return "";
  return String(row[idx]).trim();
}

/**
 * Extract one row to canonical keys with parsed/normalized values.
 */
export function extractRow(
  row: string[],
  binding: ColumnBinding
): ExtractedRow {
  const out: ExtractedRow = {};
  const regionRaw = getCell(row, binding, "region");
  if (regionRaw) out.region = normalizeRegion(regionRaw) ?? undefined;
  const hourRaw = getCell(row, binding, "hour");
  if (hourRaw) {
    const h = parseHour(hourRaw);
    if (h !== undefined) out.hour = h;
  }
  const dateRaw = getCell(row, binding, "date");
  if (dateRaw) out.date = dateRaw;
  const cid = getCell(row, binding, "campaignId");
  if (cid) out.campaignId = cid;
  const aid = getCell(row, binding, "adId");
  if (aid) out.adId = aid;

  const imp = getCell(row, binding, "impressions");
  if (imp !== "") out.impressions = parseNum(imp);
  const clk = getCell(row, binding, "clicks");
  if (clk !== "") out.clicks = parseNum(clk);
  const cost = getCell(row, binding, "cost");
  if (cost !== "") out.cost = parseNum(cost);
  const conv = getCell(row, binding, "conversions");
  if (conv !== "") out.conversions = parseNum(conv);
  const rev = getCell(row, binding, "revenue");
  if (rev !== "") out.revenue = parseNum(rev);

  const isShare = getCell(row, binding, "impressionShare");
  if (isShare !== "") out.impressionShare = parseNum(isShare);
  const lostBudget = getCell(row, binding, "lostImpressionShareBudget");
  if (lostBudget !== "") out.lostImpressionShareBudget = parseNum(lostBudget);
  const lostRank = getCell(row, binding, "lostImpressionShareRank");
  if (lostRank !== "") out.lostImpressionShareRank = parseNum(lostRank);

  return out;
}

/**
 * Extract all rows. Rows with no metric columns yield empty-ish objects; SignalBuilder may skip or allow.
 */
export function extractAllRows(
  rows: string[][],
  binding: ColumnBinding
): ExtractedRow[] {
  return rows.map((row) => extractRow(row, binding));
}
