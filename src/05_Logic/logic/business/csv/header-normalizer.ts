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

/** Detect delimiter: use semicolon if it yields more columns than comma on the first line. */
function detectDelimiter(firstLine: string): "," | ";" {
  const commaCols = firstLine.split(",").length;
  const semicolonCols = firstLine.split(";").length;
  return semicolonCols > commaCols ? ";" : ",";
}

/**
 * Find the first line index that is the real header (>= 5 columns and metric keyword).
 * Uses delimiter so semicolon-delimited exports are detected.
 */
function detectHeaderRowIndex(lines: string[], delimiter: "," | ";"): number {
  for (let i = 0; i < lines.length; i++) {
    if (isLikelyHeaderRow(lines[i], delimiter)) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("Detected header row index:", i, "delimiter:", delimiter);
      }
      return i;
    }
  }
  return 0;
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
  const delimiter = detectDelimiter(lines[0]);
  const headerIndex = detectHeaderRowIndex(lines, delimiter);
  const headerLine = lines[headerIndex];
  const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase().replace(/\s+/g, " "));
  const rows: string[][] = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.trim());
    rows.push(cells);
  }
  return { headers, rows, lineCount: 1 + rows.length };
}
