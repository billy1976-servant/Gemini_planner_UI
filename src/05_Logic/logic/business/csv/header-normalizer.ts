/**
 * HeaderNormalizer — pure function.
 * Input: raw CSV string.
 * Output: normalized lines (trim, strip BOM, consistent line endings, first line as header).
 * Skips Google Ads metadata rows by detecting the first line that looks like a real header.
 */

const BOM = "\uFEFF";

function isLikelyHeaderRow(line: string, delimiter: "," | ";"): boolean {
  const lower = line.toLowerCase();
  const count = line.split(delimiter).length;
  const hasMetric =
    lower.includes("cost") ||
    lower.includes("click") ||
    lower.includes("conversion") ||
    lower.includes("impression");
  return count >= 5 && hasMetric;
}

/**
 * Find the first line that looks like a header (>= 5 columns and metric keyword)
 * and the delimiter that makes it so. This allows files with a title row (e.g. "by state view")
 * on line 0 and the real header on line 1 to be read the same way, and supports both
 * comma- and semicolon-delimited files regardless of which line is the title.
 */
function detectHeaderRowAndDelimiter(lines: string[]): { headerIndex: number; delimiter: "," | ";" } {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isLikelyHeaderRow(line, ",")) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("Detected header row index:", i, "delimiter: comma");
      }
      return { headerIndex: i, delimiter: "," };
    }
    if (isLikelyHeaderRow(line, ";")) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("Detected header row index:", i, "delimiter: semicolon");
      }
      return { headerIndex: i, delimiter: ";" };
    }
  }
  return { headerIndex: 0, delimiter: "," };
}

export interface NormalizedCsv {
  /** First row (header) as array of trimmed, lowercased strings. */
  headers: string[];
  /** Data rows as arrays of trimmed strings. */
  rows: string[][];
  /** Original line count (header + rows). */
  lineCount: number;
}

/**
 * Normalize CSV: strip BOM, consistent line endings, trim.
 * Delimiter: comma or semicolon (auto-detected from first line if semicolon yields more columns).
 * For Google Ads exports: skip metadata and use first row with >= 5 columns and a metric keyword as header.
 */
export function normalizeCsv(csvText: string): NormalizedCsv {
  const trimmed = String(csvText).replace(/^\uFEFF/, "").trim();
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [], lineCount: 0 };
  }
  // #region agent log
  const line0 = lines[0] ?? "";
  const line1 = lines[1] ?? "";
  const comma0 = line0.split(",").length;
  const semi0 = line0.split(";").length;
  const tab0 = line0.split("\t").length;
  const comma1 = line1.split(",").length;
  const semi1 = line1.split(";").length;
  const tab1 = line1.split("\t").length;
  const h0comma = isLikelyHeaderRow(line0, ",");
  const h0semi = isLikelyHeaderRow(line0, ";");
  const h1comma = isLikelyHeaderRow(line1, ",");
  const h1semi = isLikelyHeaderRow(line1, ";");
  fetch("http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "df01c7" },
    body: JSON.stringify({
      sessionId: "df01c7",
      location: "header-normalizer.ts:normalizeCsv",
      message: "CSV lines 0-1 and header detection",
      data: {
        lineCount: lines.length,
        line0Preview: line0.slice(0, 100),
        line1Preview: line1.slice(0, 100),
        comma0,
        semi0,
        tab0,
        comma1,
        semi1,
        tab1,
        h0comma,
        h0semi,
        h1comma,
        h1semi,
      },
      timestamp: Date.now(),
      hypothesisId: "A",
    }),
  }).catch(() => {});
  // #endregion
  const { headerIndex, delimiter } = detectHeaderRowAndDelimiter(lines);
  const headerLine = lines[headerIndex];
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/7e15e045-3112-419f-8116-3226c0884ac1", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "df01c7" },
    body: JSON.stringify({
      sessionId: "df01c7",
      location: "header-normalizer.ts:after detect",
      message: "Chosen header row and delimiter",
      data: { headerIndex, delimiter, headerLinePreview: headerLine.slice(0, 120) },
      timestamp: Date.now(),
      hypothesisId: "B",
    }),
  }).catch(() => {});
  // #endregion
  const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase().replace(/\s+/g, " "));
  const rows: string[][] = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.trim());
    rows.push(cells);
  }
  return { headers, rows, lineCount: 1 + rows.length };
}
