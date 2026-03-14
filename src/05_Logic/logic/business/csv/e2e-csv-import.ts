/**
 * E2E: CSV pipeline + in-memory store (no HTTP).
 * Run: npm run test:csv-e2e
 * Optional: RUN_HTTP=1 npm run test:csv-e2e (requires dev server; set NEXT_PUBLIC_APP_URL or it defaults to http://localhost:3000)
 */

const SAMPLE_CSV = `date,region,hour,campaign_id,impressions,clicks,cost,conversions,revenue
2024-01-15,US,14,100001,1000,50,25.50,5,350.00
2024-01-15,US,15,100001,1200,60,30.00,6,420.00
2024-01-15,CA,14,100002,500,20,10.00,2,120.00
2024-01-16,US,9,100001,800,40,20.00,4,280.00
2024-01-16,TX,12,100002,600,25,12.50,3,180.00`;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`E2E CSV failed: ${message}`);
}

async function main(): Promise<void> {
  const { universalCsvToSignals } = await import("./universal-csv-to-signals");
  const { setSignalsForBusiness, getSignalsForBusiness } = await import("../csv-signals-store");

  console.log("1. Run universal pipeline on sample CSV...");
  const result = universalCsvToSignals(SAMPLE_CSV, { lenient: true });
  assert(result.signals.length > 0, "Pipeline must produce at least one signal");
  assert(result.rowCount === result.signals.length, "rowCount must match signals.length");
  console.log(`   -> ${result.signals.length} signals, reportType=${result.reportType}`);

  console.log("2. Store and retrieve (csv-placeholder)...");
  const businessId = "csv-placeholder";
  setSignalsForBusiness(businessId, result.signals);
  const stored = getSignalsForBusiness(businessId);
  assert(stored.length === result.signals.length, "Stored count must match");
  console.log(`   -> Stored ${stored.length} signals for ${businessId}`);

  if (process.env.RUN_HTTP === "1") {
    const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    const filename = "e2e-sample.csv";

    console.log("3. HTTP: POST ingest (with filename)...");
    const ingestRes = await fetch(`${base}/api/business/csv/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: SAMPLE_CSV, businessId, filename }),
    });
    const ingestJson = await ingestRes.json();
    assert(ingestRes.ok && ingestJson.ok !== false, "Ingest must succeed: " + (ingestJson.error || ingestJson.reason || ""));
    assert((ingestJson.rowCount ?? 0) > 0, "Ingest must return rowCount > 0");
    assert(Array.isArray(ingestJson.headers) && ingestJson.headers.length >= 5, "Ingest must return headers (>= 5)");
    console.log(`   -> Ingest: rowCount=${ingestJson.rowCount}, filename=${ingestJson.filename}, headers=${ingestJson.headers?.length}`);

    console.log("4. GET files list...");
    const filesRes = await fetch(`${base}/api/business/csv/files?businessId=${encodeURIComponent(businessId)}`);
    const filesJson = await filesRes.json();
    assert(filesRes.ok && filesJson.ok === true, "Files list must succeed");
    const names = (filesJson.files ?? []).map((f: { filename: string }) => f.filename);
    assert(names.includes(filename), `Files list must include ${filename}, got: ${JSON.stringify(names)}`);
    console.log(`   -> Files: ${names.join(", ")}`);

    console.log("5. GET preview...");
    const previewRes = await fetch(
      `${base}/api/business/csv/preview?businessId=${encodeURIComponent(businessId)}&filename=${encodeURIComponent(filename)}`
    );
    const previewJson = await previewRes.json();
    assert(previewRes.ok && previewJson.ok === true, "Preview must succeed");
    const headers = previewJson.headers ?? [];
    const hasRegion = headers.some((h: string) => /region|user location/i.test(h));
    const hasCost = headers.some((h: string) => /cost/i.test(h));
    const hasClicks = headers.some((h: string) => /click/i.test(h));
    assert(hasRegion || headers.length >= 5, "Preview should have region or many columns; headers: " + headers.join(", "));
    assert(hasCost && hasClicks, "Preview should have cost and clicks columns");
    console.log(`   -> Preview: ${headers.length} headers, ${previewJson.totalRows ?? 0} total rows`);

    console.log("6. GET insights...");
    const insightsRes = await fetch(`${base}/api/google-ads/insights?businessId=${businessId}`);
    const insightsJson = await insightsRes.json();
    assert(insightsRes.ok, "Insights must return 200");
    const hasData =
      !insightsJson.noData &&
      (Object.keys(insightsJson.byCampaign ?? {}).length > 0 ||
        Object.keys(insightsJson.byState ?? {}).length > 0 ||
        Object.keys(insightsJson.byHour ?? {}).length > 0);
    assert(hasData, "Insights must have byCampaign, byState, or byHour data");
    const totalRows = (insightsJson.byState && Object.keys(insightsJson.byState).length) || 0;
    console.log(`   -> Insights: noData=${insightsJson.noData}, byState keys=${Object.keys(insightsJson.byState ?? {}).length}`);
  } else {
    console.log("3. Skip HTTP (set RUN_HTTP=1 to test against dev server).");
  }

  console.log("E2E CSV import: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
