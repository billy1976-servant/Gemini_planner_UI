export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { listCsvFiles } from "@/logic/business/csv-file-store";
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
