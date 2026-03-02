export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getBusinessById } from "@/logic/business/business-model";
import { getSignalsForBusiness } from "@/logic/business/csv-signals-store";
import { runAdsPipelineFromSignals } from "@/logic/business/pipelines/ads-pipeline";
import {
  loadStrategy,
  evaluateSegments,
  buildReallocationPlan,
  type WasteSegment,
  type WinnerSegment,
  type ReallocationItem,
} from "@/logic/business/decision-console/strategy-evaluator";
import type { ExecutiveSummary } from "@/logic/business/engines/ads-insights.engine";

/**
 * GET /api/decision-console/evaluate?businessId=...&strategyId=...
 * CSV-only: requires valid businessId, CSV business, and signals > 0. No fallback, no mock data.
 */
export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get("businessId")?.trim() ?? "";
  const strategyId = request.nextUrl.searchParams.get("strategyId")?.trim() ?? "";

  try {
    const strategy = strategyId ? loadStrategy(strategyId) : null;
    if (!strategy) {
      return NextResponse.json(
        {
          ok: false,
          error: "Strategy not found or invalid strategyId",
          debug: { strategyId },
          counts: { signals: 0, byStateKeys: 0, byHourKeys: 0, byCampaignKeys: 0 },
          raw: { notes: ["Strategy not found"] },
        },
        { status: 400 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { ok: false, noData: true, error: "Valid businessId required", businessId: "", strategyId },
        { status: 400 }
      );
    }

    const business = getBusinessById(businessId);
    if (!business || business.dataSourceType !== "csv") {
      return NextResponse.json(
        { ok: false, noData: true, error: "Business not found or not CSV", businessId, strategyId },
        { status: 400 }
      );
    }

    const signals = getSignalsForBusiness(businessId);

    if (signals.length === 0) {
      console.log("[decision-console] evaluate businessId=%s strategyId=%s noData=true (no CSV signals)", businessId, strategyId);
      return NextResponse.json({
        ok: false,
        noData: true,
        error: "No CSV data available. Upload data in the Data tab.",
        businessId,
        strategyId,
      });
    }

    const { aggregation, insights } = runAdsPipelineFromSignals(signals, 0);
    const { wasteSegments, winnerSegments } = evaluateSegments(aggregation, strategy);
    const reallocationPlan = buildReallocationPlan(wasteSegments, winnerSegments, strategy);

    const executiveSummary = insights.executiveSummary;
    const byStateKeys = Object.keys(aggregation.byState).length;
    const byHourKeys = Object.keys(aggregation.byHour).length;
    const byCampaignKeys = Object.keys(aggregation.byCampaign).length;
    const segmentCounts = { states: byStateKeys, hours: byHourKeys, campaigns: byCampaignKeys };

    console.log(
      "[decision-console] evaluate businessId=%s strategyId=%s waste=%s winners=%s realloc=%s",
      businessId,
      strategyId,
      wasteSegments.length,
      winnerSegments.length,
      reallocationPlan.length
    );

    const response = {
      ok: true,
      noData: false,
      businessId,
      strategyId,
      counts: { signals: signals.length, byStateKeys, byHourKeys, byCampaignKeys },
      strategy: { id: strategy.id, label: strategy.label, description: strategy.description },
      inputs: {
        totalsSummary: executiveSummary,
        segmentCounts,
      },
      wasteSegments,
      winnerSegments,
      reallocationPlan,
      raw: {
        aggregationKeysPresent: { byState: byStateKeys, byHour: byHourKeys, byCampaign: byCampaignKeys },
        notes: [] as string[],
      },
    };
    return NextResponse.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[decision-console] evaluate error:", msg);
    return NextResponse.json(
      {
        ok: false,
        error: msg,
        debug: { businessId, strategyId },
        counts: { signals: 0, byStateKeys: 0, byHourKeys: 0, byCampaignKeys: 0 },
        raw: { notes: [msg] },
      },
      { status: 500 }
    );
  }
}
