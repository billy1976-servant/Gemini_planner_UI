"use client";

import { useEffect, useState } from "react";
import { subscribeState, getState } from "@/state/state-store";
import { runControlFlow } from "@/logic/controllers/control-flow";
import type { AdControlState } from "@/logic/controllers/google-ads.controller";
import type { ScanEvent } from "@/scans/global-scans/types";

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

export default function GoogleAdsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [controlState, setControlState] = useState<AdControlState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    validated: boolean;
    errors?: string[];
  } | null>(null);
  const [, forceRender] = useState(0);

  // Subscribe to state changes
  useEffect(() => {
    const sync = () => forceRender((v) => v + 1);
    const unsub = subscribeState(sync);
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // Load campaigns
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

  // Load control state when campaign changes
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

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>🚀 Google Ads Dashboard</h1>
        <p>Loading campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1>🚀 Google Ads Dashboard</h1>
        <div style={{ color: "red", padding: 16, background: "#fee", borderRadius: 8, marginTop: 16 }}>
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
      <h1>🚀 Google Ads Dashboard</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        LIVE GOOGLE ADS DATA — Connected to Google Ads API
      </p>

      {/* Campaign Selector */}
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

      {selectedCampaign && controlState && (
        <>
          {/* Budget Control */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <h3>Budget</h3>
            <div style={{ marginTop: 8 }}>
              <div>Current: <strong>${controlState.budget.current.toFixed(2)}</strong></div>
              <div>Recommended: <strong>${controlState.budget.recommended.toFixed(2)}</strong> 
                <span style={{ marginLeft: 8, color: controlState.budget.change === "increase" ? "green" : controlState.budget.change === "decrease" ? "red" : "#666" }}>
                  ({controlState.budget.change})
                </span>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <input
                type="number"
                value={controlState.budget.recommended}
                onChange={(e) =>
                  handleUpdateBudget(parseFloat(e.target.value) || 0)
                }
                step="0.01"
                min="0"
                style={{ padding: 8, fontSize: 14, width: 200, border: "1px solid #ccc", borderRadius: 4 }}
              />
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                {controlState.budget.reason}
              </div>
            </div>
          </div>

          {/* Bid Control */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <h3>Bid</h3>
            <div style={{ marginTop: 8 }}>
              <div>Current: <strong>${controlState.bid.current.toFixed(2)}</strong></div>
              <div>Recommended: <strong>${controlState.bid.recommended.toFixed(2)}</strong>
                <span style={{ marginLeft: 8, color: controlState.bid.change === "increase" ? "green" : controlState.bid.change === "decrease" ? "red" : "#666" }}>
                  ({controlState.bid.change})
                </span>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <input
                type="number"
                value={controlState.bid.recommended}
                onChange={(e) =>
                  handleUpdateBid(parseFloat(e.target.value) || 0)
                }
                step="0.01"
                min="0"
                style={{ padding: 8, fontSize: 14, width: 200, border: "1px solid #ccc", borderRadius: 4 }}
              />
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                {controlState.bid.reason}
              </div>
            </div>
          </div>

          {/* Schedule Control */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
            }}
          >
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
                background: controlState.schedule.current === "active" ? "#ff4444" : "#44ff44",
                color: "white",
                border: "none",
                borderRadius: 4,
                fontWeight: "bold",
              }}
            >
              {controlState.schedule.current === "active"
                ? "⏸ Pause Campaign"
                : "▶ Activate Campaign"}
            </button>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
              {controlState.schedule.reason}
            </div>
          </div>

          {/* Signals */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              background: "#f9f9f9",
            }}
          >
            <h3>Engine Signals</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
              <div>Trend: <strong>{controlState.signals.trend}</strong></div>
              <div>Momentum: <strong>{controlState.signals.momentum.toFixed(2)}</strong></div>
              <div>Score: <strong>{controlState.signals.score.toFixed(2)}</strong></div>
              <div>Confidence: <strong>{controlState.signals.confidence}</strong></div>
            </div>
          </div>

          {/* Validation */}
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
              {validating ? "Validating..." : "✅ Validate Changes with Google Ads API"}
            </button>

            {validationResult && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  background: validationResult.validated ? "#e8f5e9" : "#ffebee",
                  borderRadius: 8,
                }}
              >
                {validationResult.validated ? (
                  <div style={{ color: "#2e7d32", fontWeight: "bold" }}>
                    ✅ Validated by Google Ads API (DRY RUN)
                  </div>
                ) : (
                  <div style={{ color: "#c62828" }}>
                    ❌ Validation Failed:
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
