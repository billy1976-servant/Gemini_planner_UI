/**
 * Raw CSV preview — uses same parsing entry point as ingestion (normalizeCsv) so
 * header detection (e.g. Google Ads metadata skip) is consistent. No schema mapping.
 * Used by Data tab viewer only.
 */

import { normalizeCsv } from "@/logic/business/csv";

export interface RawCsvPreview {
  filename: string;
  size: number;
  delimiter: string;
  headers: string[];
  rows: string[][];
}

/**
 * Build raw preview from file text using normalizeCsv() so header detection matches ingestion.
 * Throws on empty or invalid input so caller can show raw fallback.
 */
export function buildRawCsvPreview(text: string, filename: string, size: number): RawCsvPreview {
  console.log("RAW PREVIEW USING FILE:", "rawCsvPreview.ts");
  const normalized = normalizeCsv(text);
  if (normalized.headers.length === 0 && normalized.rows.length === 0) {
    throw new Error("File is empty or no header row detected");
  }
  return {
    filename,
    size,
    delimiter: "comma",
    headers: normalized.headers,
    rows: normalized.rows,
  };
}
