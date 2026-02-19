export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { fetchShopifySignal } from "@/shopify/provider/shopify.provider";
import { computeShopifyControlState } from "@/shopify/controller/shopify.controller";
import { executeShopifyControlState } from "@/shopify/executor/shopify.executor";

export async function GET() {
  try {
    const signal = await fetchShopifySignal();
    const controlState = computeShopifyControlState(signal);
    executeShopifyControlState(controlState, true);

    return NextResponse.json({ signal, controlState });
  } catch (err: any) {
    const msg = err?.message ?? "Unknown error";

    if (msg.includes("Missing required env")) {
      return NextResponse.json(
        { error: msg },
        { status: 400 }
      );
    }

    if (msg.includes("Shopify API error")) {
      return NextResponse.json(
        { error: msg },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
