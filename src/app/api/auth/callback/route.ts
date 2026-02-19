export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { validateHmac, exchangeCodeForToken } from "@/app/lib/shopify-oauth";
import { setSession } from "@/app/lib/shopify-session";

const COOKIE_NAME = "shopify_shop";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * GET /api/auth/callback?code=...&shop=...&hmac=...&timestamp=...
 * Shopify redirects here after the merchant approves. We validate HMAC, exchange code for token,
 * store session, set cookie, redirect to /shopify-intelligence.
 */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const { code, shop, hmac } = params;

  if (!shop || !code) {
    return NextResponse.json(
      { error: "Missing shop or code in callback" },
      { status: 400 }
    );
  }

  if (!validateHmac(params)) {
    return NextResponse.json({ error: "HMAC validation failed" }, { status: 400 });
  }

  try {
    const accessToken = await exchangeCodeForToken(shop, code);
    const normalizedShop = shop.trim().toLowerCase().replace(/^https?:\/\//, "");
    if (!normalizedShop.endsWith(".myshopify.com")) {
      return NextResponse.json({ error: "Invalid shop domain" }, { status: 400 });
    }

    setSession(normalizedShop, accessToken);

    const host = process.env.HOST || request.nextUrl.origin;
    const base = host.startsWith("http") ? host : `https://${host}`;
    const redirectTo = `${base.replace(/\/$/, "")}/shopify-intelligence`;

    const res = NextResponse.redirect(redirectTo);
    res.cookies.set(COOKIE_NAME, normalizedShop, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Token exchange failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
