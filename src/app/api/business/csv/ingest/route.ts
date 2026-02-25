export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { universalCsvToSignals, normalizeCsv } from "@/logic/business/csv";
import { setSignalsForBusiness } from "@/logic/business/csv-signals-store";
import { putCsvFile } from "@/logic/business/csv-file-store";
import { getBusinessById } from "@/logic/business/business-model";

const PREVIEW_ROW_LIMIT = 50;

/**
 * POST /api/business/csv/ingest
 * Body: { csv: string, businessId: string, filename?: string }
 * Persists raw CSV to .tmp/csv-files, runs pipeline, stores signals.
 * Returns: ok, filename, rowCount, headers, previewRows, reportType, warnings.
 * On failure: { ok: false, error: "reason" } with 400/500.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const csv = typeof body.csv === "string" ? body.csv : "";
    const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
    const filename = typeof body.filename === "string" && body.filename.trim() ? body.filename.trim() : "uploaded.csv";

    if (!businessId) {
      return NextResponse.json({ ok: false, error: "Missing businessId" }, { status: 400 });
    }
    const business = getBusinessById(businessId);
    if (!business || business.dataSourceType !== "csv") {
      return NextResponse.json(
        { ok: false, error: "Business not found or not CSV type. Select \"CSV Upload\" in the business dropdown." },
        { status: 400 }
      );
    }
    if (!csv) {
      return NextResponse.json({ ok: false, error: "Missing csv" }, { status: 400 });
    }

    const { headers, rows } = normalizeCsv(csv);
    if (headers.length === 0 || rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No header row or data rows detected. Check delimiter (comma or semicolon) and that the file has a header with metric columns." },
        { status: 400 }
      );
    }

    putCsvFile(businessId, filename, csv, { headers, rowCount: rows.length });

    const result = universalCsvToSignals(csv, { lenient: true });
    setSignalsForBusiness(businessId, result.signals);

    const previewRows = rows.slice(0, PREVIEW_ROW_LIMIT);
    return NextResponse.json({
      ok: true,
      filename,
      rowCount: result.rowCount,
      headers,
      previewRows,
      reportType: result.reportType,
      warningCount: result.warnings.length,
      warnings: result.warnings.length > 0 ? result.warnings : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to ingest CSV";
    console.error("[csv/ingest] Error:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
