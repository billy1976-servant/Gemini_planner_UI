/**
 * Shopify Intelligence — shared types
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
