/**
 * Full HTTP integration test: ingest → store → insights.
 * Run (dev server must be on port 3000): node scripts/http-csv-integration-test.js
 */

const SAMPLE_CSV = `date,region,hour,campaign_id,impressions,clicks,cost,conversions,revenue
2024-01-15,US,14,100001,1000,50,25.50,5,350.00
2024-01-15,US,15,100001,1200,60,30.00,6,420.00
2024-01-15,CA,14,100002,500,20,10.00,2,120.00
2024-01-16,US,9,100001,800,40,20.00,4,280.00
2024-01-16,TX,12,100002,600,25,12.50,3,180.00`;

const BASE = "http://localhost:3000";

async function checkPort() {
  try {
    const r = await fetch(`${BASE}/api/business/csv/ingest`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  console.log("0. Checking dev server on port 3000...");
  const serverUp = await checkPort();
  if (!serverUp) {
    console.error("FAIL: Dev server not reachable at " + BASE + ". Start with: npm run dev");
    process.exit(1);
  }
  console.log("   Server OK.\n");

  console.log("1. POST ingest (businessId=csv-placeholder, csv=sample CSV)");
  const ingestBody = { businessId: "csv-placeholder", csv: SAMPLE_CSV };
  const ingestRes = await fetch(`${BASE}/api/business/csv/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ingestBody),
  });
  const ingestJson = await ingestRes.json();
  console.log("   Ingest response (full JSON):", JSON.stringify(ingestJson, null, 2));
  console.log("   Status:", ingestRes.status);

  console.log("\n2. GET insights?businessId=csv-placeholder");
  const insightsRes = await fetch(`${BASE}/api/google-ads/insights?businessId=csv-placeholder`);
  const insightsJson = await insightsRes.json();
  console.log("   Insights response (full JSON):", JSON.stringify(insightsJson, null, 2));
  console.log("   Status:", insightsRes.status);
  console.log("   noData:", insightsJson.noData);
  if (insightsJson.byCampaign && Object.keys(insightsJson.byCampaign).length > 0) {
    console.log("   byCampaign keys:", Object.keys(insightsJson.byCampaign).length);
  }
  if (insightsJson.byState && Object.keys(insightsJson.byState).length > 0) {
    console.log("   byState keys:", Object.keys(insightsJson.byState).length);
  }

  const ok = ingestRes.ok && (ingestJson.rowCount ?? 0) > 0 && !insightsJson.noData;
  if (ok) {
    console.log("\n3. GET report (HTML)");
    const reportRes = await fetch(`${BASE}/api/reports/google-ads-summary?businessId=csv-placeholder`);
    const reportText = await reportRes.text();
    const hasData = reportText.indexOf("No CSV data") === -1;
    console.log("   Report has data (no 'No CSV data'):", hasData);
    console.log("\n--- HTTP integration test PASSED ---");
  } else {
    console.log("\n--- HTTP integration test FAILED (ingest rowCount>0 and insights noData=false required) ---");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
