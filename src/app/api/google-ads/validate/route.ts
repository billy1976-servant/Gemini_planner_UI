export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createGoogleAdsClient } from "../client";
import type { AdControlState } from "@/logic/controllers/google-ads.controller";

export async function POST(request: Request) {
  try {
    const controlState: AdControlState = await request.json();
    const { customer, customerId } = await createGoogleAdsClient();

    if (!controlState.campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      );
    }

    const operations: any[] = [];
    const campaignId = controlState.campaignId.replace(/-/g, "");
    const customerIdClean = customerId.replace(/-/g, "");

    // Budget mutation
    if (controlState.budget.change !== "maintain") {
      // First, get the budget ID for this campaign
      const campaignQuery = await customer.query(`
        SELECT campaign_budget FROM campaign WHERE campaign.id = ${campaignId} LIMIT 1
      `);
      
      if (campaignQuery.length > 0) {
        const budgetResourceName = campaignQuery[0].campaign.campaign_budget;
        const budgetId = budgetResourceName.split("/").pop();
        
        operations.push({
          update: {
            resource_name: `customers/${customerIdClean}/campaignBudgets/${budgetId}`,
            amount_micros: Math.round(controlState.budget.recommended * 1_000_000),
          },
        });
      }
    }

    // Campaign status mutation (pause/activate)
    if (controlState.schedule.change !== "maintain") {
      operations.push({
        update: {
          resource_name: `customers/${customerIdClean}/campaigns/${campaignId}`,
          status:
            controlState.schedule.recommended === "active"
              ? "ENABLED"
              : "PAUSED",
        },
      });
    }

    if (operations.length === 0) {
      return NextResponse.json({
        validated: true,
        message: "No changes to validate",
      });
    }

    // Validate with Google Ads API (dry-run)
    try {
      await customer.mutateResources({
        operations,
        validate_only: true,
      });

      return NextResponse.json({
        validated: true,
        message: "All changes validated successfully",
      });
    } catch (apiError: any) {
      const errors = apiError.errors || [apiError];
      return NextResponse.json(
        {
          validated: false,
          errors: errors.map((e: any) => e.message || String(e)),
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("[Google Ads API] Validation error:", error);
    return NextResponse.json(
      {
        error: "Validation failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
