/**
 * Server-side campaigns + hourly data for insights/report pipeline.
 * Shared by GET /api/google-ads/campaigns, /api/google-ads/insights, and report.
 */

import { createGoogleAdsClient, getGoogleAdsMode } from "./client";

export type CampaignItem = {
  id: string;
  name: string;
  status: string;
  channelType: string;
  budget: number;
  metrics: {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
  };
};

export type HourlyPerformanceItem = {
  hour: string;
  campaignId?: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
};

export type CampaignsDataResponse = {
  mode: "mock" | "live";
  campaigns: CampaignItem[];
  hourlyPerformance: HourlyPerformanceItem[];
};

function mockCampaigns(): CampaignItem[] {
  return [
    {
      id: "100001",
      name: "Brand Search - US",
      status: "ENABLED",
      channelType: "SEARCH",
      budget: 150,
      metrics: {
        impressions: 12400,
        clicks: 380,
        cost: 89.42,
        conversions: 12,
      },
    },
    {
      id: "100002",
      name: "Display Remarketing",
      status: "PAUSED",
      channelType: "DISPLAY",
      budget: 75,
      metrics: {
        impressions: 5200,
        clicks: 92,
        cost: 34.10,
        conversions: 3,
      },
    },
    {
      id: "100003",
      name: "Performance Max - Products",
      status: "ENABLED",
      channelType: "PERFORMANCE_MAX",
      budget: 200,
      metrics: {
        impressions: 28100,
        clicks: 610,
        cost: 156.80,
        conversions: 28,
      },
    },
  ];
}

function mockHourlyPerformance(): HourlyPerformanceItem[] {
  const now = new Date();
  const items: HourlyPerformanceItem[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(d.getHours() - i, 0, 0, 0);
    const hour = d.toISOString().slice(0, 13) + ":00:00.000Z";
    const base = 80 + (i % 5) * 20;
    items.push({
      hour,
      campaignId: "100001",
      impressions: base * 12,
      clicks: Math.floor(base * 0.4),
      cost: base * 0.08,
      conversions: Math.floor(base * 0.05),
    });
  }
  return items;
}

/**
 * Fetch campaigns + hourly performance (mock or live). Throws on config/mode error.
 */
export async function getCampaignsData(): Promise<CampaignsDataResponse> {
  const mode = getGoogleAdsMode();
  if (mode === "mock") {
    return {
      mode: "mock",
      campaigns: mockCampaigns(),
      hourlyPerformance: mockHourlyPerformance(),
    };
  }
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
  const formatted: CampaignItem[] = campaigns.map((campaign: any) => ({
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
  return {
    mode: "live",
    campaigns: formatted,
    hourlyPerformance: [],
  };
}
