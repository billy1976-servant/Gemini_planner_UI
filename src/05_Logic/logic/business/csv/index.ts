/**
 * Universal CSV ingestion layer.
 */

export { CSV_HEADER_SYNONYMS, ALL_CANONICAL_KEYS } from "./csv-header-synonyms";
export type { CanonicalKey } from "./csv-header-synonyms";
export { normalizeCsv } from "./header-normalizer";
export type { NormalizedCsv } from "./header-normalizer";
export { resolveSynonyms } from "./synonym-resolver";
export type { ColumnBinding } from "./synonym-resolver";
export { classifyReport } from "./report-classifier";
export type { ReportType } from "./report-classifier";
export { extractRow, extractAllRows } from "./metric-extractor";
export type { ExtractedRow } from "./metric-extractor";
export { buildSignals } from "./signal-builder";
export type { SignalBuilderOptions, SignalBuilderResult } from "./signal-builder";
export { universalCsvToSignals } from "./universal-csv-to-signals";
export type { UniversalCsvOptions, UniversalCsvResult } from "./universal-csv-to-signals";
