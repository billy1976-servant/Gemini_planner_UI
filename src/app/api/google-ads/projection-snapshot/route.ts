export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCampaignsData } from "../get-campaigns-data";
import { normalizeCampaignsToSignals } from "@/logic/business/business-signal";
import { runAdsAggregation } from "@/logic/business/engines/ads-aggregation.engine";
import { runAdsCapacity } from "@/logic/business/engines/ads-capacity.engine";
import { createProjectionSnapshot } from "@/logic/business/engines/ads-projection.engine";
import { appendProjectionSnapshot } from "@/logic/business/projections/projection-store";
import type { ProjectionSnapshotWithMeta } from "@/logic/business/projections/projection-snapshot";

/**
 * POST /api/google-ads/projection-snapshot
 * Create and store a projection snapshot from current metrics + capacity.
 */
export async function POST() {
  try {
    const { campaigns, hourlyPerformance } = await getCampaignsData();
    const signals = normalizeCampaignsToSignals(campaigns, hourlyPerformance);
    const aggregated = runAdsAggregation({ signals });
    const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
    const capacity = runAdsCapacity({
      totals: aggregated.totals,
      currentBudget: totalBudget,
    });
    const snapshot = createProjectionSnapshot({
      currentMetrics: aggregated.totals,
      capacityOutput: capacity,
    });
    const withMeta: ProjectionSnapshotWithMeta = {
      ...snapshot,
      createdAt: Date.now(),
    };
    appendProjectionSnapshot(withMeta);
    return NextResponse.json({ ok: true, snapshot: withMeta });
  } catch (error: any) {
    console.error("[projection-snapshot] Error:", error);
    return NextResponse.json(
      { error: "Failed to create projection snapshot", message: error.message },
      { status: 500 }
    );
  }
}
