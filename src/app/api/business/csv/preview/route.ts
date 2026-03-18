export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCsvFile } from "@/logic/business/csv-file-store";
import { normalizeCsv } from "@/logic/business/csv";
import { getBusinessById } from "@/logic/business/business-model";

const PREVIEW_ROW_LIMIT = 50;

/**
 * GET /api/business/csv/preview?businessId=&filename=
 * Returns headers and first N rows for a stored CSV (same normalization as ingest).
 */
export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId")?.trim() ?? "";
    const filename = request.nextUrl.searchParams.get("filename")?.trim() ?? "";
    if (!businessId) {
      return NextResponse.json({ ok: false, reason: "missing businessId" }, { status: 400 });
    }
    if (!filename) {
      return NextResponse.json({ ok: false, reason: "missing filename" }, { status: 400 });
    }
    const business = getBusinessById(businessId);
    if (!business || business.dataSourceType !== "csv") {
      return NextResponse.json({ ok: false, reason: "Business not found or not CSV type" }, { status: 400 });
    }
    const raw = getCsvFile(businessId, filename);
    if (raw === null) {
      return NextResponse.json({ ok: false, reason: "File not found" }, { status: 404 });
    }
    const { headers, rows } = normalizeCsv(raw);
    const previewRows = rows.slice(0, PREVIEW_ROW_LIMIT);
    return NextResponse.json({
      ok: true,
      filename,
      headers,
      rows: previewRows,
      totalRows: rows.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get preview";
    console.error("[csv/preview] Error:", error);
    return NextResponse.json({ ok: false, reason: message }, { status: 500 });
  }
}
