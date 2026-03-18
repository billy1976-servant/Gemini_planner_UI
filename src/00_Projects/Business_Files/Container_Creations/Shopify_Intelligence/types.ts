/**
 * Shopify Intelligence — shared types
 * Used by provider, controller, executor, and the TSX page for viewing online.
 */

export interface ShopifySignal {
  totalRevenue: number;
  revenueVelocity: number; // daily average (last 30 days)
  topSKUs: Array<{
    sku: string;
    revenue: number;
    units: number;
  }>;
}

export interface ShopifyControlState {
  healthScore: number; // 0–100
  trend: "up" | "down" | "flat";
  suggestedAction:
    | "Increase Ads"
    | "Maintain"
    | "Reduce Ads"
    | "Promote High Margin SKUs";
}

/** GET /api/shopify-intelligence success body — used by TSX page for viewing online */
export interface ShopifyIntelligenceApiResponse {
  signal: ShopifySignal;
  controlState: ShopifyControlState;
}

/** GET /api/shopify-intelligence error body (401 / 4xx / 5xx) */
export interface ShopifyIntelligenceApiError {
  error: string;
  installUrl?: string;
}
