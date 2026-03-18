# How to verify CSV upload (Data tab)

## Prerequisites

- Dev server running: `npm run dev`
- Add `.tmp` to `.gitignore` if not present: `.tmp`

## 1. Automated check (with dev server running)

```bash
RUN_HTTP=1 npm run test:csv-e2e
```

**Expected:** All steps pass; console shows:

- Ingest: rowCount=5, filename=e2e-sample.csv, headers=9
- Files: e2e-sample.csv
- Preview: 9 headers, 5 total rows
- Insights: noData=false, byState keys=3 (or similar)

## 2. Manual UI verification

1. Open the app (e.g. http://localhost:3000).
2. In the **header**, open the business dropdown and select **CSV Upload** (not "Google Ads").
3. Go to the **Data** tab (sidebar).
4. You should see:
   - No "Select CSV Upload" error (because CSV Upload is selected).
   - **Upload CSV** button enabled.
   - If you already ran the e2e script: **Files** dropdown lists `e2e-sample.csv`; selecting it shows the table with headers (date, region, hour, campaign_id, impressions, clicks, cost, conversions, revenue) and 5 rows.
5. **Upload a new CSV:** Click **Upload CSV**, choose a Google Ads CSV (e.g. Performance by state/location). After upload:
   - Filename appears in the **Files** dropdown.
   - Raw preview shows **real headers** (multiple columns, e.g. region, currency code, cost, clicks, conversions) and first 50 rows.
   - Green line: "Stored: N signals (used by Compare, Command, Reports, Ads)".
6. **Persistence:** Refresh the page. Select **CSV Upload** again, open **Data** tab. The **Files** dropdown should still list your uploaded file(s); selecting one loads the table (no data loss).
7. **Compare/Reports/Ads:** Without changing business, open **Compare** (or **Reports** or **Ads**). Metrics should be non-zero and reflect the uploaded CSV (e.g. by State with real region names, not a single "by_state" option).

## 3. Error cases (must show on-screen)

- With **Google Ads** selected, open Data tab: message "Select **CSV Upload** in the header dropdown to upload and view CSVs here." and **Upload CSV** disabled.
- With CSV Upload selected, upload an invalid file (e.g. empty or wrong format): red message "Ingest: …" with the API error (e.g. "No header row or data rows detected").

## 4. API contract (for integration)

- **POST** `/api/business/csv/ingest`  
  Body: `{ csv: string, businessId: string, filename?: string }`  
  Success: `{ ok: true, filename, rowCount, headers, previewRows, reportType, warnings? }`  
  Error: `{ ok: false, error: string }` (400/500).

- **GET** `/api/business/csv/files?businessId=<id>`  
  Success: `{ ok: true, files: [{ filename, uploadedAt, headers, rowCount }] }`.

- **GET** `/api/business/csv/preview?businessId=<id>&filename=<name>`  
  Success: `{ ok: true, filename, headers, rows, totalRows }`.

- **GET** `/api/google-ads/insights?businessId=csv-placeholder`  
  With CSV ingested: `noData: false`, `byState` (and/or `byHour`, `byCampaign`) populated.
