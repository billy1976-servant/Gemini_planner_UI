/**
 * Shopify Intelligence — content for TSX template (Template V2).
 * No hardcoded strings in the screen; all from here.
 */
export const content = {
  title: "Shopify Intelligence",
  apiPath: "/api/shopify-intelligence",
  fallbackShop: "hiclarify-dev.myshopify.com",
  labels: {
    loading: "Loading…",
    error: "Error",
    installAuthorize: "Install app / Authorize",
    totalRevenue: "Total Revenue (30 days)",
    revenueVelocity: "Revenue Velocity (daily avg)",
    topSKUs: "Top 5 SKUs",
    sku: "SKU",
    revenue: "Revenue",
    units: "Units",
    noSkuData: "No SKU data",
    healthScore: "Health Score",
    suggestedAction: "Suggested Action",
    failedToLoad: "Failed to load",
  },
} as const;

export default content;
