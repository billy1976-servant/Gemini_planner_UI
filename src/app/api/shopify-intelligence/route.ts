export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/shopify-session";
import { fetchShopifySignal } from "@/00_Projects/Business_Files/Container_Creations/Shopify_Intelligence/provider/shopify.provider";
import { computeShopifyControlState } from "@/00_Projects/Business_Files/Container_Creations/Shopify_Intelligence/controller/shopify.controller";
import { executeShopifyControlState } from "@/00_Projects/Business_Files/Container_Creations/Shopify_Intelligence/executor/shopify.executor";

const SHOP_COOKIE = "shopify_shop";

export async function GET(request: NextRequest) {
  const shop =
    request.cookies.get(SHOP_COOKIE)?.value ??
    request.nextUrl.searchParams.get("shop")?.trim();

  if (!shop) {
    return NextResponse.json(
      {
        error: "Not authenticated",
        installUrl: "/api/auth/install?shop=YOUR_STORE.myshopify.com",
      },
      { status: 401 }
    );
  }

  const session = getSession(shop);
  if (!session) {
    return NextResponse.json(
      {
        error: "No session for this shop. Complete OAuth first.",
        installUrl: `/api/auth/install?shop=${encodeURIComponent(shop)}`,
      },
      { status: 401 }
    );
  }

  try {
    const signal = await fetchShopifySignal({
      shop: session.shop,
      accessToken: session.accessToken,
    });
    const controlState = computeShopifyControlState(signal);
    executeShopifyControlState(controlState, true);

    return NextResponse.json({ signal, controlState });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";

    if (msg.includes("Missing required env")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (msg.includes("Shopify API error")) {
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
