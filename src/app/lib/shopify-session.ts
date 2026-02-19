/**
 * In-memory session store for Shopify OAuth (dev).
 * Keyed by shop domain; stores access token.
 * For production, replace with persistent storage (e.g. DB).
 */

export interface ShopifySession {
  shop: string;
  accessToken: string;
}

const sessions = new Map<string, ShopifySession>();

export function setSession(shop: string, accessToken: string): void {
  const normalized = normalizeShop(shop);
  sessions.set(normalized, { shop: normalized, accessToken });
}

export function getSession(shop: string): ShopifySession | null {
  const normalized = normalizeShop(shop);
  return sessions.get(normalized) ?? null;
}

function normalizeShop(shop: string): string {
  let s = shop.trim().toLowerCase();
  if (!s.endsWith(".myshopify.com") && !s.includes(".")) {
    s = `${s}.myshopify.com`;
  }
  return s.replace(/^https?:\/\//, "");
}
