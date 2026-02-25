/**
 * Universal CSV ingestion layer — unit tests.
 * Run: npx ts-node -r tsconfig-paths/register src/05_Logic/logic/business/csv/universal-csv.test.ts
 */

import { normalizeCsv } from "./header-normalizer";
import { resolveSynonyms } from "./synonym-resolver";
import { classifyReport } from "./report-classifier";
import { extractRow, extractAllRows } from "./metric-extractor";
import { buildSignals } from "./signal-builder";
import { universalCsvToSignals } from "./universal-csv-to-signals";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`CSV test failed: ${message}`);
}

// --- HeaderNormalizer
const sampleCsv = "Date,Region,Cost,Conversions\n2024-01-01,US,10.5,2\n2024-01-02,CA,20,3";
const normalized = normalizeCsv(sampleCsv);
assert(normalized.headers.length === 4, "HeaderNormalizer: 4 headers");
assert(normalized.headers[0] === "date", "HeaderNormalizer: first header lowercased");
assert(normalized.rows.length === 2, "HeaderNormalizer: 2 data rows");
assert(normalized.lineCount === 3, "HeaderNormalizer: line count");

const emptyNorm = normalizeCsv("");
assert(emptyNorm.headers.length === 0 && emptyNorm.rows.length === 0, "HeaderNormalizer: empty CSV");

// --- SynonymResolver
const binding = resolveSynonyms(normalized.headers);
assert(binding.has("date"), "SynonymResolver: date mapped");
assert(binding.has("region"), "SynonymResolver: region mapped");
assert(binding.has("cost"), "SynonymResolver: cost mapped");
assert(binding.has("conversions"), "SynonymResolver: conversions mapped");
assert(binding.get("date") === 0, "SynonymResolver: date index 0");

// --- ReportClassifier
const reportType = classifyReport(binding);
assert(reportType === "by_state", "ReportClassifier: region present => by_state");

const bindingHour = resolveSynonyms(["hour", "cost", "clicks"]);
assert(classifyReport(bindingHour) === "by_hour", "ReportClassifier: hour => by_hour");

const bindingCampaign = resolveSynonyms(["campaign_id", "cost"]);
assert(classifyReport(bindingCampaign) === "campaign", "ReportClassifier: campaignId => campaign");

// --- MetricExtractor
const row0 = normalized.rows[0];
const extracted0 = extractRow(row0, binding);
assert(extracted0.region === "US", "MetricExtractor: region normalized");
assert(extracted0.cost === 10.5, "MetricExtractor: cost parsed");
assert(extracted0.conversions === 2, "MetricExtractor: conversions parsed");

const allExtracted = extractAllRows(normalized.rows, binding);
assert(allExtracted.length === 2, "MetricExtractor: extractAllRows length");

// --- SignalBuilder
const { signals, warnings } = buildSignals(allExtracted, { defaultRegion: "US", lenient: true });
assert(signals.length === 2, "SignalBuilder: 2 signals");
assert(signals[0].source === "google-ads", "SignalBuilder: source");
assert(signals[0].region === "US", "SignalBuilder: region");
assert(signals[0].metrics.cost === 10.5, "SignalBuilder: metrics.cost");
assert(Number.isFinite(signals[0].timestamp), "SignalBuilder: timestamp number");

// --- universalCsvToSignals (campaign-style CSV)
const campaignCsv = `campaign_id,impressions,clicks,cost,conversions,revenue
100001,1000,50,25.5,5,350
100002,500,20,10,2,120`;
const resultCampaign = universalCsvToSignals(campaignCsv);
assert(resultCampaign.signals.length === 2, "universalCsvToSignals: campaign 2 rows");
assert(resultCampaign.reportType === "campaign", "universalCsvToSignals: reportType campaign");
assert(resultCampaign.signals[0].campaignId === "100001", "universalCsvToSignals: campaignId");
assert(resultCampaign.signals[0].metrics.impressions === 1000, "universalCsvToSignals: impressions");

// --- by_hour CSV
const hourCsv = `hour,cost,clicks,conversions
14,25,50,5
15,30,60,6`;
const resultHour = universalCsvToSignals(hourCsv);
assert(resultHour.signals.length === 2, "universalCsvToSignals: by_hour 2 rows");
assert(resultHour.reportType === "by_hour", "universalCsvToSignals: reportType by_hour");
assert(resultHour.signals[0].hour === 14, "universalCsvToSignals: hour 14");

// --- Malformed: invalid hour (lenient => skip row, warning)
const badHourCsv = "hour,cost\n14,10\n99,20";
const resultBad = universalCsvToSignals(badHourCsv, { lenient: true });
assert(resultBad.signals.length === 1, "universalCsvToSignals: lenient skips invalid hour row");
assert(resultBad.warnings.length >= 1, "universalCsvToSignals: warning for invalid hour");

// --- Empty / header-only
const headerOnly = "date,cost\n";
const resultEmpty = universalCsvToSignals(headerOnly);
assert(resultEmpty.signals.length === 0, "universalCsvToSignals: header-only => 0 signals");
assert(resultEmpty.rowCount === 0, "universalCsvToSignals: rowCount 0");

console.log("All universal CSV ingestion unit tests passed.");
