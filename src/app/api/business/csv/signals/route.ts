export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSignalsForBusiness } from "@/logic/business/csv-signals-store";
import { getBusinessById } from "@/logic/business/business-model";

/**
 * GET /api/business/csv/signals?businessId=
 * Returns stored signal count for the business so the client can show "N signals loaded" and avoid depending on component state.
 */
export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId")?.trim() ?? "";
    if (!businessId) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }
    const business = getBusinessById(businessId);
    if (!business || business.dataSourceType !== "csv") {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }
    const signals = getSignalsForBusiness(businessId);
    console.log("[diag] signals businessId=%s count=%s", businessId, signals.length);
    return NextResponse.json({ count: signals.length });
  } catch (error) {
    console.error("[csv/signals] Error:", error);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
