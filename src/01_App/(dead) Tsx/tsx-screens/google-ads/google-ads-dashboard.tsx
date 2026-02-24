"use client";

import { useEffect, useState } from "react";
import { subscribeState, getState } from "@/state/state-store";
import { runControlFlow } from "@/logic/controllers/control-flow";
import type { AdControlState } from "@/logic/controllers/google-ads.controller";
import type { ScanEvent } from "@/scans/global-scans/types";
import { getIndicator } from "@/logic/business/ui/indicator-map";

type Campaign = {
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

type InsightsPayload = {
  executiveSummary: {
    totalSpend: number;
    totalRevenue: number;
    roas: number;
    cpa: number;
    topState: string;
    topHour: number | null;
    worstState: string;
    growthOpportunities: string[];
  };
  highlights: Array<{ label: string; value: number; direction: "up" | "down" | "stable"; severity: string }>;
  ranking: {
    topStates: Array<{ region: string; metrics: { roas: number; cost: number }; rank: number }>;
    worstStates: Array<{ region: string; metrics: { roas: number }; rank: number }>;
    topHours: Array<{ hour: number; metrics: { roas: number; cost: number }; rank: number }>;
    worstHours: Array<{ hour: number; metrics: { roas: number }; rank: number }>;
  };
  trends: { numericSlope: number; trendDirection: string };
  capacity: { projectedSafeBudget: number; projectedAggressiveBudget: number };
  recommendations: Array<{ level: string; target: string; reason: string; expectedImpact: number }>;
  growthOpportunities: string[];
  projectionConfidenceScore: number;
};

const INDICATOR_COLOR_CSS: Record<string, string> = {
  green: "#22c55e",
  "light-green": "#86efac",
  gray: "#6b7280",
  "light-red": "#fca5a5",
  red: "#ef4444",
};

function indicatorStyle(colorToken: string): { color: string } {
  return { color: INDICATOR_COLOR_CSS[colorToken] ?? INDICATOR_COLOR_CSS.gray };
}

export default function GoogleAdsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adsMode, setAdsMode] = useState<"mock" | "live" | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [controlState, setControlState] = useState<AdControlState | null>(null);
  const [insights, setInsights] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    validated: boolean;
    errors?: string[];
  } | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const sync = () => forceRender((v) => v + 1);
    const unsub = subscribeState(sync);
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await fetch("/api/google-ads/campaigns");
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        if (data.mode === "mock" || data.mode === "live") {
          setAdsMode(data.mode);
        }
        if (data.campaigns?.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(data.campaigns[0].id);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    }
    loadCampaigns();
  }, []);

  useEffect(() => {
    async function loadInsights() {
      try {
        const res = await fetch("/api/google-ads/insights");
        if (res.ok) {
          const data = await res.json();
          setInsights(data);
        }
      } catch {
        // Non-blocking
      }
    }
    loadInsights();
  }, [campaigns.length]);

  useEffect(() => {
    if (!selectedCampaignId) return;

    async function loadControlState() {
      const state = getState();
      const scanEvents: ScanEvent[] = (state.scans || []).filter(
        (s: any) => s.source === "google-ads"
      );

      const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
      if (!selectedCampaign) return;

      const result = await runControlFlow({
        scanEvents,
        campaignId: selectedCampaignId,
        currentBudget: selectedCampaign.budget,
        currentBid: 1.0,
        currentStatus:
          selectedCampaign.status === "ENABLED" ? "active" : "paused",
      });

      setControlState(result.controlState);
    }

    if (campaigns.length > 0) {
      loadControlState();
    }
  }, [selectedCampaignId, campaigns]);

  async function handleValidate() {
    if (!controlState) return;
    setValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch("/api/google-ads/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(controlState),
      });

      const data = await res.json();
      setValidationResult(data);
    } catch (e: any) {
      setValidationResult({
        validated: false,
        errors: [e.message || "Validation failed"],
      });
    } finally {
      setValidating(false);
    }
  }

  function handleGeneratePdf() {
    window.open("/api/reports/google-ads-summary", "_blank");
  }

  function handleUpdateBudget(newBudget: number) {
    if (!controlState) return;
    const updated: AdControlState = {
      ...controlState,
      budget: {
        ...controlState.budget,
        recommended: newBudget,
        change: newBudget > controlState.budget.current ? "increase" : newBudget < controlState.budget.current ? "decrease" : "maintain",
      },
    };
    setControlState(updated);
  }

  function handleUpdateBid(newBid: number) {
    if (!controlState) return;
    const updated: AdControlState = {
      ...controlState,
      bid: {
        ...controlState.bid,
        recommended: newBid,
        change: newBid > controlState.bid.current ? "increase" : newBid < controlState.bid.current ? "decrease" : "maintain",
      },
    };
    setControlState(updated);
  }

  function handleToggleSchedule() {
    if (!controlState) return;
    const updated: AdControlState = {
      ...controlState,
      schedule: {
        ...controlState.schedule,
        recommended:
          controlState.schedule.current === "active" ? "paused" : "active",
        change:
          controlState.schedule.current === "active" ? "pause" : "activate",
      },
    };
    setControlState(updated);
  }

  const trendSlope = insights?.trends?.numericSlope ?? 0;
  const budgetIndicator = controlState
    ? getIndicator(
        controlState.budget.recommended / Math.max(1, controlState.budget.current),
        trendSlope,
        { metric: "generic" }
      )
    : null;
  const bidIndicator = controlState
    ? getIndicator(
        controlState.bid.recommended / Math.max(0.01, controlState.bid.current),
        trendSlope,
        { metric: "generic" }
      )
    : null;

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Google Ads Dashboard</h1>
        <p>Loading campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Google Ads Dashboard</h1>
        <div style={{ padding: 16, background: "#fee", borderRadius: 8, marginTop: 16, ...indicatorStyle("red") }}>
          <strong>Error:</strong> {error}
          <div style={{ marginTop: 8, fontSize: 12 }}>
            Make sure your Google Ads API credentials are configured in .env.local
          </div>
        </div>
      </div>
    );
  }

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1200, margin: "0 auto" }}>
      <h1>Google Ads Dashboard</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        {adsMode != null ? (
          <strong>Google Ads Mode: {adsMode === "mock" ? "MOCK" : "LIVE"}</strong>
        ) : (
          "Google Ads Mode: —"
        )}
      </p>

      <div style={{ marginBottom: 24, padding: 16, background: "#f5f5f5", borderRadius: 8 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: "bold" }}>
          Campaign:
        </label>
        <select
          value={selectedCampaignId}
          onChange={(e) => setSelectedCampaignId(e.target.value)}
          style={{ padding: 8, fontSize: 14, width: "100%", maxWidth: 400 }}
        >
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.id}) — {c.status}
            </option>
          ))}
        </select>
      </div>

      {insights && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
              <h3>Top 5 States</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {insights.ranking.topStates.slice(0, 5).map((s) => {
                  const ind = getIndicator(s.metrics.roas, trendSlope, { metric: "roas" });
                  return (
                    <li key={s.region} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={indicatorStyle(ind.color)}>{ind.arrow}</span>
                      <strong>{s.region}</strong>
                      <span style={indicatorStyle(ind.color)}>ROAS {s.metrics.roas.toFixed(2)}</span>
                    </li>
                  );
                })}
                {insights.ranking.topStates.length === 0 && <li style={{ color: "#666" }}>No state data</li>}
              </ul>
            </div>
            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
              <h3>Top 5 Hours</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {insights.ranking.topHours.slice(0, 5).map((h) => {
                  const ind = getIndicator(h.metrics.roas, trendSlope, { metric: "roas" });
                  return (
                    <li key={h.hour} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={indicatorStyle(ind.color)}>{ind.arrow}</span>
                      <strong>{h.hour}:00</strong>
                      <span style={indicatorStyle(ind.color)}>ROAS {h.metrics.roas.toFixed(2)}</span>
                    </li>
                  );
                })}
                {insights.ranking.topHours.length === 0 && <li style={{ color: "#666" }}>No hourly data</li>}
              </ul>
            </div>
          </div>

          <div style={{ marginBottom: 24, padding: 16, background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
            <h3>Growth Potential & Capacity</h3>
            <p style={{ margin: "8px 0" }}>
              <strong>Projected safe budget:</strong> ${insights.capacity.projectedSafeBudget.toFixed(2)}
              {" · "}
              <strong>Aggressive:</strong> ${insights.capacity.projectedAggressiveBudget.toFixed(2)}
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>Projection confidence:</strong> {(insights.projectionConfidenceScore * 100).toFixed(0)}%
            </p>
            <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
              {insights.growthOpportunities.slice(0, 3).map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginBottom: 24 }}>
            <button
              type="button"
              onClick={handleGeneratePdf}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: "bold",
                cursor: "pointer",
                background: "#4285f4",
                color: "white",
                border: "none",
                borderRadius: 4,
              }}
            >
              Generate PDF report
            </button>
          </div>
        </>
      )}

      {selectedCampaign && controlState && (
        <>
          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3>Budget</h3>
            <div style={{ marginTop: 8 }}>
              <div>Current: <strong>${controlState.budget.current.toFixed(2)}</strong></div>
              <div>
                Recommended: <strong>${controlState.budget.recommended.toFixed(2)}</strong>
                {budgetIndicator && (
                  <span style={{ marginLeft: 8, ...indicatorStyle(budgetIndicator.color) }}>
                    {budgetIndicator.arrow} ({controlState.budget.change})
                  </span>
                )}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <input
                type="number"
                value={controlState.budget.recommended}
                onChange={(e) => handleUpdateBudget(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                style={{ padding: 8, fontSize: 14, width: 200, border: "1px solid #ccc", borderRadius: 4 }}
              />
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                {controlState.budget.reason}
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3>Bid</h3>
            <div style={{ marginTop: 8 }}>
              <div>Current: <strong>${controlState.bid.current.toFixed(2)}</strong></div>
              <div>
                Recommended: <strong>${controlState.bid.recommended.toFixed(2)}</strong>
                {bidIndicator && (
                  <span style={{ marginLeft: 8, ...indicatorStyle(bidIndicator.color) }}>
                    {bidIndicator.arrow} ({controlState.bid.change})
                  </span>
                )}
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <input
                type="number"
                value={controlState.bid.recommended}
                onChange={(e) => handleUpdateBid(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                style={{ padding: 8, fontSize: 14, width: 200, border: "1px solid #ccc", borderRadius: 4 }}
              />
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                {controlState.bid.reason}
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3>Schedule</h3>
            <div style={{ marginTop: 8 }}>
              <div>Current: <strong>{controlState.schedule.current}</strong></div>
              <div>Recommended: <strong>{controlState.schedule.recommended}</strong></div>
            </div>
            <button
              onClick={handleToggleSchedule}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                fontSize: 14,
                cursor: "pointer",
                background: controlState.schedule.current === "active" ? "#ef4444" : "#22c55e",
                color: "white",
                border: "none",
                borderRadius: 4,
                fontWeight: "bold",
              }}
            >
              {controlState.schedule.current === "active"
                ? "Pause Campaign"
                : "Activate Campaign"}
            </button>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {controlState.schedule.reason}
            </div>
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16, background: "#f9f9f9" }}>
            <h3>Engine Signals</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
              <div>Trend: <strong>{controlState.signals.trend}</strong></div>
              <div>Momentum: <strong>{controlState.signals.momentum.toFixed(2)}</strong></div>
              <div>Score: <strong>{controlState.signals.score.toFixed(2)}</strong></div>
              <div>Confidence: <strong>{controlState.signals.confidence}</strong></div>
            </div>
          </div>

          <div style={{ marginTop: 24, padding: 16, background: "#f0f0f0", borderRadius: 8 }}>
            <button
              onClick={handleValidate}
              disabled={validating}
              style={{
                padding: "12px 24px",
                fontSize: 16,
                fontWeight: "bold",
                cursor: validating ? "not-allowed" : "pointer",
                background: "#4285f4",
                color: "white",
                border: "none",
                borderRadius: 4,
              }}
            >
              {validating ? "Validating..." : "Validate Changes with Google Ads API"}
            </button>

            {validationResult && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: validationResult.validated ? "#dcfce7" : "#fee2e2",
                  borderRadius: 8,
                }}
              >
                {validationResult.validated ? (
                  <div style={{ color: "#166534", fontWeight: "bold" }}>
                    Validated by Google Ads API (DRY RUN)
                  </div>
                ) : (
                  <div style={{ color: "#991b1b" }}>
                    Validation Failed:
                    <ul style={{ marginTop: 8 }}>
                      {validationResult.errors?.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
