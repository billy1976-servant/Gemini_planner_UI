/**
 * Shopify Intelligence — Controller
 * Pure function: ShopifySignal → ShopifyControlState
 */

import type { ShopifyControlState, ShopifySignal } from "../types";

export function computeShopifyControlState(
  signal: ShopifySignal
): ShopifyControlState {
  const v = signal.revenueVelocity;

  let healthScore: number;
  if (v > 500) healthScore = 85;
  else if (v > 200) healthScore = 65;
  else if (v > 50) healthScore = 40;
  else healthScore = 20;

  let suggestedAction: ShopifyControlState["suggestedAction"];
  if (v > 500) suggestedAction = "Increase Ads";
  else if (v >= 200 && v <= 500) suggestedAction = "Maintain";
  else if (v < 50) suggestedAction = "Promote High Margin SKUs";
  else suggestedAction = "Reduce Ads";

  return {
    healthScore,
    trend: "flat",
    suggestedAction,
  };
}
