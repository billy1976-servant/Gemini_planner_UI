export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { loadStrategy } from "@/logic/business/decision-console/strategy-evaluator";

/**
 * GET /api/decision-console/strategy?strategyId=...
 * Returns full strategy definition for Active Strategy Parameters display.
 */
export async function GET(request: NextRequest) {
  const strategyId = request.nextUrl.searchParams.get("strategyId")?.trim() ?? "";
  if (!strategyId) {
    return NextResponse.json({ ok: false, error: "missing strategyId" }, { status: 400 });
  }
  const strategy = loadStrategy(strategyId);
  if (!strategy) {
    return NextResponse.json({ ok: false, error: "Strategy not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, strategy });
}
