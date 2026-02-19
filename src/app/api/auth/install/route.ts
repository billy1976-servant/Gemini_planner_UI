export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getInstallRedirectUrl } from "@/app/lib/shopify-oauth";

/**
 * GET /api/auth/install?shop=store.myshopify.com
 * Redirects the merchant to Shopify OAuth. After approval, Shopify redirects to /api/auth/callback.
 */
export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get("shop");
  if (!shop || !shop.trim()) {
    return NextResponse.json(
      { error: "Missing query parameter: shop (e.g. your-store.myshopify.com)" },
      { status: 400 }
    );
  }

  try {
    const host = process.env.HOST || request.nextUrl.origin;
    const base = host.startsWith("http") ? host : `https://${host}`;
    const redirectUri = `${base.replace(/\/$/, "")}/api/auth/callback`;
    const url = getInstallRedirectUrl(shop.trim(), redirectUri);
    return NextResponse.redirect(url);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Install URL failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
