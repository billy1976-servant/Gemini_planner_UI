export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { listCsvFiles, deleteCsvFile } from "@/logic/business/csv-file-store";
import { getBusinessById } from "@/logic/business/business-model";

/**
 * GET /api/business/csv/files?businessId=
 * Returns list of uploaded CSV filenames and meta for the business (from file-backed manifest).
 */
export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId")?.trim() ?? "";
    if (!businessId) {
      return NextResponse.json({ ok: false, reason: "missing businessId" }, { status: 400 });
    }
    const business = getBusinessById(businessId);
    if (!business || business.dataSourceType !== "csv") {
      return NextResponse.json({ ok: false, reason: "Business not found or not CSV type" }, { status: 400 });
    }
    const files = listCsvFiles(businessId);
    return NextResponse.json({ ok: true, files });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to list files";
    console.error("[csv/files] Error:", error);
    return NextResponse.json({ ok: false, reason: message }, { status: 500 });
  }
}

/**
 * DELETE /api/business/csv/files?businessId=&filename=
 * Removes the stored CSV file and its manifest entry.
 */
export async function DELETE(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId")?.trim() ?? "";
    const filename = request.nextUrl.searchParams.get("filename")?.trim() ?? "";
    if (!businessId || !filename) {
      return NextResponse.json({ ok: false, reason: "missing businessId or filename" }, { status: 400 });
    }
    const business = getBusinessById(businessId);
    if (!business || business.dataSourceType !== "csv") {
      return NextResponse.json({ ok: false, reason: "Business not found or not CSV type" }, { status: 400 });
    }
    const removed = deleteCsvFile(businessId, filename);
    return NextResponse.json({ ok: removed, removed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete file";
    console.error("[csv/files] DELETE Error:", error);
    return NextResponse.json({ ok: false, reason: message }, { status: 500 });
  }
}
