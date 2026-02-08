/**
 * Google Ads Control Adapter
 * 
 * PURPOSE:
 * - Consumes ScanEvent[] from global scan sources
 * - Produces AdControlState (budget, bid, schedule, status)
 * - Pure deterministic logic - no UI, no API calls
 * - Maps scan signals → control decisions
 * 
 * CONSTRAINTS:
 * - Deterministic only
 * - No AI
 * - No randomness
 * - No side effects
 */

import type { ScanEvent } from "@/scans/global-scans/types";

/**
 * Ad Control State - Output of the controller
 */
export interface AdControlState {
  campaignId?: string;
  budget: {
    current: number;
    recommended: number;
    change: "increase" | "decrease" | "maintain";
    reason: string;
  };
  bid: {
    current: number;
    recommended: number;
    change: "increase" | "decrease" | "maintain";
    reason: string;
  };
  schedule: {
    current: "active" | "paused";
    recommended: "active" | "paused";
    change: "activate" | "pause" | "maintain";
    reason: string;
  };
  status: "ready" | "throttled" | "paused" | "error";
  signals: {
    trend: "up" | "down" | "flat";
    momentum: number;
    score: number;
    confidence: "low" | "medium" | "high";
  };
  timestamp: number;
}

/**
 * Control Decision Input
 */
export interface ControlDecisionInput {
  scanEvents: ScanEvent[];
  currentBudget?: number;
  currentBid?: number;
  currentStatus?: "active" | "paused";
  campaignId?: string;
}

/**
 * Compute control state from scan events
 * 
 * Rules:
 * - High score + up trend → increase budget/bid
 * - Low score + down trend → decrease budget/bid
 * - Negative momentum → pause
 * - Flat trend → maintain
 */
export function computeAdControlState(input: ControlDecisionInput): AdControlState {
  const { scanEvents, currentBudget = 100, currentBid = 1.0, currentStatus = "active", campaignId } = input;

  // Filter Google Ads events only
  const adsEvents = scanEvents.filter((e) => e.source === "google-ads");

  if (adsEvents.length === 0) {
    // No ads data - maintain current state
    return {
      campaignId,
      budget: {
        current: currentBudget,
        recommended: currentBudget,
        change: "maintain",
        reason: "No scan data available",
      },
      bid: {
        current: currentBid,
        recommended: currentBid,
        change: "maintain",
        reason: "No scan data available",
      },
      schedule: {
        current: currentStatus,
        recommended: currentStatus,
        change: "maintain",
        reason: "No scan data available",
      },
      status: "ready",
      signals: {
        trend: "flat",
        momentum: 0,
        score: 0,
        confidence: "low",
      },
      timestamp: Date.now(),
    };
  }

  // Aggregate signals from all events
  const avgScore = adsEvents.reduce((sum, e) => sum + e.score, 0) / adsEvents.length;
  const avgMomentum = adsEvents.reduce((sum, e) => sum + e.momentum, 0) / adsEvents.length;
  
  // Determine dominant trend
  const trends = adsEvents.map((e) => e.trend);
  const upCount = trends.filter((t) => t === "up").length;
  const downCount = trends.filter((t) => t === "down").length;
  const dominantTrend: "up" | "down" | "flat" = 
    upCount > downCount ? "up" : downCount > upCount ? "down" : "flat";

  // Compute confidence
  const confidence: "low" | "medium" | "high" = 
    adsEvents.length >= 3 ? "high" : adsEvents.length >= 2 ? "medium" : "low";

  // Budget decision logic - calculate delta from signals (no hard-coded percentages)
  let budgetChange: "increase" | "decrease" | "maintain" = "maintain";
  let budgetRecommended = currentBudget;
  let budgetReason = "Maintaining current budget";

  // Calculate delta from score and momentum (0-100 scale)
  const scoreDelta = (avgScore - 50) / 50; // -1 to +1
  const momentumDelta = Math.max(-1, Math.min(1, avgMomentum / 50)); // Normalize momentum
  const trendMultiplier = dominantTrend === "up" ? 1 : dominantTrend === "down" ? -1 : 0;
  
  const combinedDelta = (scoreDelta * 0.6 + momentumDelta * 0.4) * trendMultiplier;
  const budgetDeltaPercent = Math.max(-50, Math.min(50, combinedDelta * 50)); // Cap at ±50%
  
  if (Math.abs(budgetDeltaPercent) > 5) { // Only change if >5% delta
    budgetChange = budgetDeltaPercent > 0 ? "increase" : "decrease";
    budgetRecommended = Math.round(currentBudget * (1 + budgetDeltaPercent / 100));
    budgetReason = `Signal-based adjustment: ${budgetDeltaPercent > 0 ? "+" : ""}${budgetDeltaPercent.toFixed(1)}% (score: ${avgScore.toFixed(1)}, momentum: ${avgMomentum.toFixed(1)}, trend: ${dominantTrend})`;
  }

  // Bid decision logic - calculate delta from signals (no hard-coded percentages)
  let bidChange: "increase" | "decrease" | "maintain" = "maintain";
  let bidRecommended = currentBid;
  let bidReason = "Maintaining current bid";

  const bidDeltaPercent = Math.max(-30, Math.min(30, combinedDelta * 30)); // Cap at ±30% for bids
  
  if (Math.abs(bidDeltaPercent) > 3) { // Only change if >3% delta
    bidChange = bidDeltaPercent > 0 ? "increase" : "decrease";
    bidRecommended = Math.round(currentBid * (1 + bidDeltaPercent / 100) * 100) / 100;
    bidReason = `Signal-based adjustment: ${bidDeltaPercent > 0 ? "+" : ""}${bidDeltaPercent.toFixed(1)}% (score: ${avgScore.toFixed(1)}, momentum: ${avgMomentum.toFixed(1)})`;
  }

  // Schedule decision logic
  let scheduleChange: "activate" | "pause" | "maintain" = "maintain";
  let scheduleRecommended: "active" | "paused" = currentStatus;
  let scheduleReason = `Maintaining ${currentStatus} status`;

  if (avgMomentum < -20 && avgScore < 20) {
    scheduleChange = "pause";
    scheduleRecommended = "paused";
    scheduleReason = `Critical decline (momentum: ${avgMomentum.toFixed(1)}, score: ${avgScore.toFixed(1)})`;
  } else if (currentStatus === "paused" && avgScore > 50 && dominantTrend === "up") {
    scheduleChange = "activate";
    scheduleRecommended = "active";
    scheduleReason = `Recovery detected (score: ${avgScore.toFixed(1)}, trend: up)`;
  }

  // Determine overall status
  let status: "ready" | "throttled" | "paused" | "error" = "ready";
  if (scheduleRecommended === "paused") {
    status = "paused";
  } else if (avgMomentum < -15) {
    status = "throttled";
  } else if (confidence === "low" && adsEvents.length === 0) {
    status = "error";
  }

  return {
    campaignId,
    budget: {
      current: currentBudget,
      recommended: budgetRecommended,
      change: budgetChange,
      reason: budgetReason,
    },
    bid: {
      current: currentBid,
      recommended: bidRecommended,
      change: bidChange,
      reason: bidReason,
    },
    schedule: {
      current: currentStatus,
      recommended: scheduleRecommended,
      change: scheduleChange,
      reason: scheduleReason,
    },
    status,
    signals: {
      trend: dominantTrend,
      momentum: avgMomentum,
      score: avgScore,
      confidence,
    },
    timestamp: Date.now(),
  };
}
