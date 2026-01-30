export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createGoogleAdsClient } from "../client";

export async function GET() {
  try {
    const { customer } = await createGoogleAdsClient();

    const campaigns = await customer.query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros,
        campaign_budget.period,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.id
      LIMIT 100
    `);

    const formatted = campaigns.map((campaign: any) => ({
      id: campaign.campaign.id.toString(),
      name: campaign.campaign.name,
      status: campaign.campaign.status,
      channelType: campaign.campaign.advertising_channel_type,
      budget: campaign.campaign_budget?.amount_micros
        ? Number(campaign.campaign_budget.amount_micros) / 1_000_000
        : 0,
      metrics: {
        impressions: Number(campaign.metrics?.impressions || 0),
        clicks: Number(campaign.metrics?.clicks || 0),
        cost: campaign.metrics?.cost_micros
          ? Number(campaign.metrics.cost_micros) / 1_000_000
          : 0,
        conversions: Number(campaign.metrics?.conversions || 0),
      },
    }));

    return NextResponse.json({ campaigns: formatted });
  } catch (error: any) {
    console.error("[Google Ads API] Error fetching campaigns:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch campaigns",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
