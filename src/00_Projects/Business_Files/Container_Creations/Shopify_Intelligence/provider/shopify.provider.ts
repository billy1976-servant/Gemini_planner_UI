/**
 * Shopify Intelligence — Provider
 * Fetches last 30 days orders from Shopify Admin API and returns ShopifySignal.
 */

import type { ShopifySignal } from "../types";

const ENV_STORE = "SHOPIFY_STORE_DOMAIN";
const ENV_TOKEN = "SHOPIFY_ACCESS_TOKEN";

function getEnv(name: string): string {
  const v = process.env[name];
  if (v == null || String(v).trim() === "") {
    throw new Error(`Missing required env: ${name}`);
  }
  return String(v).trim();
}

function getCreatedAtMin(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

interface ShopifyOrderLineItem {
  sku?: string | null;
  price?: string;
  quantity?: number;
}

interface ShopifyOrder {
  line_items?: ShopifyOrderLineItem[];
}

interface ShopifyOrdersResponse {
  orders?: ShopifyOrder[];
}

/**
 * Optional credentials from app layer (e.g. OAuth session). When provided, env is not required.
 */
export interface ShopifyCredentials {
  shop: string;
  accessToken: string;
}

/**
 * Fetch last 30 days orders and aggregate into ShopifySignal.
 * When credentials is provided (e.g. from OAuth session), uses those; otherwise uses env.
 */
export async function fetchShopifySignal(credentials?: ShopifyCredentials): Promise<ShopifySignal> {
  const store = credentials
    ? credentials.shop.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : getEnv(ENV_STORE);
  const token = credentials ? credentials.accessToken : getEnv(ENV_TOKEN);

  const baseUrl = `https://${store}`;
  const url = `${baseUrl}/admin/api/2024-01/orders.json?status=any&created_at_min=${encodeURIComponent(getCreatedAtMin())}&limit=250`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify API error: ${res.status} ${body || res.statusText}`);
  }

  const data = (await res.json()) as ShopifyOrdersResponse;
  const orders = data.orders ?? [];

  let totalRevenue = 0;
  const revenueBySku: Record<string, { revenue: number; units: number }> = {};

  for (const order of orders) {
    const items = order.line_items ?? [];
    for (const item of items) {
      const price = parseFloat(item.price ?? "0") || 0;
      const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
      const lineRevenue = price * qty;
      totalRevenue += lineRevenue;

      const sku = (item.sku ?? "unknown").trim() || "unknown";
      if (!revenueBySku[sku]) {
        revenueBySku[sku] = { revenue: 0, units: 0 };
      }
      revenueBySku[sku].revenue += lineRevenue;
      revenueBySku[sku].units += qty;
    }
  }

  const topSKUs = Object.entries(revenueBySku)
    .map(([sku, { revenue, units }]) => ({ sku, revenue, units }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const revenueVelocity = totalRevenue / 30;

  return {
    totalRevenue,
    revenueVelocity,
    topSKUs,
  };
}
