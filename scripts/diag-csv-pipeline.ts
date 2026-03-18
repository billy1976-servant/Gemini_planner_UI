/**
 * Phase 1 diagnostic: CSV ingest → store → insights → summary.
 * Run with dev server up: npm run diag:csv
 * Uses BASE_URL from env (default http://localhost:3000).
 * Same sample CSV as e2e / DataTab flow.
 */
export {};

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const BUSINESS_ID = "csv-placeholder";

const SAMPLE_CSV = `date,region,hour,campaign_id,impressions,clicks,cost,conversions,revenue
2024-01-15,US,14,100001,1000,50,25.50,5,350.00
2024-01-15,US,15,100001,1200,60,30.00,6,420.00
2024-01-15,CA,14,100002,500,20,10.00,2,120.00
2024-01-16,US,9,100001,800,40,20.00,4,280.00
2024-01-16,TX,12,100002,600,25,12.50,3,180.00`;

function fail(step: string, raw: unknown): never {
  console.error("\n--- FAIL ---");
  console.error("Step:", step);
  console.error("Raw response:", typeof raw === "object" ? JSON.stringify(raw, null, 2) : String(raw));
  process.exit(1);
}

async function runDiagCsvPipeline(): Promise<void> {
  console.log("DIAG: BASE_URL =", BASE_URL);
  console.log("1. POST ingest...");

  const ingestRes = await fetch(`${BASE_URL}/api/business/csv/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv: SAMPLE_CSV, businessId: BUSINESS_ID, filename: "diag-sample.csv" }),
  });
  const ingestJson = (await ingestRes.json().catch(() => ({}))) as {
    ok?: boolean;
    rowCount?: number;
    error?: string;
    [k: string]: unknown;
  };

  if (!ingestRes.ok || ingestJson.ok !== true) {
    fail("ingest (ok/status)", { status: ingestRes.status, body: ingestJson });
  }
  const rowCount = ingestJson.rowCount ?? 0;
  if (rowCount <= 0) {
    fail("ingest (rowCount > 0)", ingestJson);
  }
  console.log("   ingest ok, rowCount =", rowCount);

  console.log("2. GET signals...");
  const signalsRes = await fetch(`${BASE_URL}/api/business/csv/signals?businessId=${encodeURIComponent(BUSINESS_ID)}`);
  const signalsJson = (await signalsRes.json().catch(() => ({}))) as { count?: number };
  const count = signalsJson.count ?? 0;
  console.log("   signals count =", count);
  if (count <= 0) {
    fail("signals (count > 0)", signalsJson);
  }

  console.log("3. GET insights...");
  const insightsRes = await fetch(`${BASE_URL}/api/google-ads/insights?businessId=${encodeURIComponent(BUSINESS_ID)}`);
  const insightsJson = (await insightsRes.json().catch(() => ({}))) as {
    noData?: boolean;
    executiveSummary?: { totalSpend?: number; [k: string]: unknown };
    byState?: Record<string, unknown>;
    byHour?: Record<string, unknown>;
    byCampaign?: Record<string, unknown>;
    [k: string]: unknown;
  };
  const noData = insightsJson.noData === true;
  const totalSpend = insightsJson.executiveSummary?.totalSpend ?? "—";
  const byStateKeys = insightsJson.byState ? Object.keys(insightsJson.byState).length : 0;
  const byHourKeys = insightsJson.byHour ? Object.keys(insightsJson.byHour).length : 0;
  const byCampaignKeys = insightsJson.byCampaign ? Object.keys(insightsJson.byCampaign).length : 0;
  console.log("   noData =", noData, ", executiveSummary.totalSpend =", totalSpend);
  console.log("   byState keys =", byStateKeys, ", byHour =", byHourKeys, ", byCampaign =", byCampaignKeys);
  if (noData) {
    fail("insights (noData === false)", insightsJson);
  }

  console.log("4. GET google-ads-summary...");
  const summaryRes = await fetch(
    `${BASE_URL}/api/reports/google-ads-summary?businessId=${encodeURIComponent(BUSINESS_ID)}`
  );
  const summaryContentType = summaryRes.headers.get("content-type") ?? "";
  let summaryPreview: string;
  if (summaryContentType.includes("application/json")) {
    const j = await summaryRes.json().catch(() => ({}));
    summaryPreview = JSON.stringify(j).slice(0, 200);
  } else {
    const text = await summaryRes.text();
    summaryPreview = text.slice(0, 200);
  }
  console.log("   status =", summaryRes.status, ", preview =", summaryPreview);

  console.log("\nPASS: ingest ok, rowCount > 0, signals count > 0, insights.noData === false.");
  process.exit(0);
}

runDiagCsvPipeline().catch((err) => {
  console.error("\n--- FAIL ---");
  console.error("Uncaught:", err);
  process.exit(1);
});
