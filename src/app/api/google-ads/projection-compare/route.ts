export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getProjectionSnapshotById } from "@/logic/business/projections/projection-store";
import { runProjectionCompare } from "@/logic/business/engines/ads-projection-compare.engine";
import { getCampaignsData } from "../get-campaigns-data";
import { normalizeCampaignsToSignals } from "@/logic/business/business-signal";
import { runAdsAggregation } from "@/logic/business/engines/ads-aggregation.engine";

/**
 * GET /api/google-ads/projection-compare?id=<snapshotId>
 * Compare a stored projection to current actual metrics.
 */
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing query parameter: id" },
        { status: 400 }
      );
    }
    const projection = getProjectionSnapshotById(id);
    if (!projection) {
      return NextResponse.json(
        { error: "Projection snapshot not found", id },
        { status: 404 }
      );
    }
    const { campaigns, hourlyPerformance } = await getCampaignsData();
    const signals = normalizeCampaignsToSignals(campaigns, hourlyPerformance);
    const aggregated = runAdsAggregation({ signals });
    const result = runProjectionCompare({
      projection,
      actual: aggregated.totals,
    });
    return NextResponse.json({
      projectionId: id,
      comparison: result,
    });
  } catch (error: any) {
    console.error("[projection-compare] Error:", error);
    return NextResponse.json(
      { error: "Failed to compare projection", message: error.message },
      { status: 500 }
    );
  }
}
