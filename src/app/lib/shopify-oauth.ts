/**
 * Shopify OAuth: HMAC validation and token exchange.
 * Uses SHOPIFY_API_KEY (client_id) and SHOPIFY_API_SECRET (client_secret).
 */

import crypto from "crypto";

const ENV_KEY = "SHOPIFY_API_KEY";
const ENV_SECRET = "SHOPIFY_API_SECRET";

function getSecret(): string {
  const v = process.env[ENV_SECRET];
  if (!v || String(v).trim() === "") {
    throw new Error("Missing required env: SHOPIFY_API_SECRET");
  }
  return String(v).trim();
}

function getApiKey(): string {
  const v = process.env[ENV_KEY];
  if (!v || String(v).trim() === "") {
    throw new Error("Missing required env: SHOPIFY_API_KEY");
  }
  return String(v).trim();
}

/**
 * Validate HMAC from Shopify callback query.
 * Shopify sends: shop, code, hmac, timestamp. We recompute HMAC from the other params.
 */
export function validateHmac(params: Record<string, string>): boolean {
  const { hmac, ...rest } = params;
  if (!hmac) return false;

  const secret = getSecret();
  const sorted = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("&");
  const computed = crypto.createHmac("sha256", secret).update(sorted).digest("hex");
  const a = Buffer.from(hmac, "hex");
  const b = Buffer.from(computed, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Exchange authorization code for access token.
 */
export async function exchangeCodeForToken(shop: string, code: string): Promise<string> {
  const clientId = getApiKey();
  const clientSecret = getSecret();
  const host = shop.replace(/^https?:\/\//, "").trim().toLowerCase();
  if (!host.endsWith(".myshopify.com")) {
    throw new Error("Invalid shop domain");
  }

  const url = `https://${host}/admin/oauth/access_token`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("No access_token in response");
  }
  return data.access_token;
}

/**
 * Build the install URL to redirect the merchant to Shopify OAuth.
 */
export function getInstallRedirectUrl(shop: string, redirectUri: string): string {
  const clientId = getApiKey();
  const host = shop.replace(/^https?:\/\//, "").trim().toLowerCase();
  if (!host.endsWith(".myshopify.com")) {
    throw new Error("Invalid shop domain");
  }
  const scopes = "read_orders,read_products";
  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state,
  });
  return `https://${host}/admin/oauth/authorize?${params.toString()}`;
}
