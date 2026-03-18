/**
 * Decision-console strategy loading and segment evaluation.
 * Shared by /api/decision-console/evaluate only.
 * No registries; strategy discovery is folder-based.
 */

import fs from "fs";
import path from "path";
import type { AggregatedMetrics } from "@/logic/business/engines/ads-aggregation.engine";

const STRATEGIES_DIR = path.join(process.cwd(), "src", "config", "decision-console", "strategies");
const ROAS_CAP = 5;
const CPA_CAP = 200;

export interface StrategyRules {
  waste?: {
    minCost?: number;
    maxRoas?: number;
    minClicks?: number;
    maxConversions?: number;
  };
  winners?: {
    minRoas?: number;
    minConversions?: number;
    minCost?: number;
  };
}

export interface StrategyJson {
  id: string;
  label: string;
  description: string;
  segmentTypes?: string[];
  rules?: StrategyRules;
  scoring?: Record<string, number>;
  reallocation?: { enabled?: boolean; percentOfSpendToMove?: number };
}

export interface WasteSegment {
  segmentType: string;
  key: string;
  metrics: AggregatedMetrics;
  score: number;
  reason: string;
}

export interface WinnerSegment {
  segmentType: string;
  key: string;
  metrics: AggregatedMetrics;
  score: number;
  reason: string;
}

export interface ReallocationItem {
  from: { segmentType: string; key: string };
  to: { segmentType: string; key: string };
  amount: number;
  reason: string;
}

export function getAllowlistedStrategyIds(): string[] {
  if (!fs.existsSync(STRATEGIES_DIR)) return [];
  const files = fs.readdirSync(STRATEGIES_DIR);
  return files.filter((f) => f.endsWith(".json")).map((f) => path.basename(f, ".json"));
}

export function loadStrategy(strategyId: string): StrategyJson | null {
  const allowed = getAllowlistedStrategyIds();
  if (!allowed.includes(strategyId)) return null;
  const filePath = path.join(STRATEGIES_DIR, `${strategyId}.json`);
  if (!path.resolve(filePath).startsWith(path.resolve(STRATEGIES_DIR))) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as StrategyJson;
  } catch {
    return null;
  }
}

function matchesWaste(m: AggregatedMetrics, rules: StrategyRules["waste"]): boolean {
  if (!rules) return false;
  if (rules.minCost != null && m.cost < rules.minCost) return false;
  if (rules.maxRoas != null && m.roas > rules.maxRoas) return false;
  if (rules.minClicks != null && m.clicks < rules.minClicks) return false;
  if (rules.maxConversions != null && m.conversions > rules.maxConversions) return false;
  return true;
}

function matchesWinners(m: AggregatedMetrics, rules: StrategyRules["winners"]): boolean {
  if (!rules) return false;
  if (rules.minRoas != null && m.roas < rules.minRoas) return false;
  if (rules.minConversions != null && m.conversions < rules.minConversions) return false;
  if (rules.minCost != null && m.cost < rules.minCost) return false;
  return true;
}

function computeScore(m: AggregatedMetrics, scoring: Record<string, number> | undefined): number {
  if (!scoring) return 0;
  const roasNorm = Number.isFinite(m.roas) ? Math.min(Math.max(m.roas, 0), ROAS_CAP) / ROAS_CAP : 0;
  const cpaNorm = Number.isFinite(m.cpa) ? Math.min(Math.max(m.cpa, 0), CPA_CAP) / CPA_CAP : 0;
  const costNorm = Number.isFinite(m.cost) ? Math.min(m.cost / 1000, 10) / 10 : 0;
  const convNorm = Number.isFinite(m.conversions) ? Math.min(m.conversions / 20, 1) : 0;
  let s = 0;
  if (scoring.cost != null) s += scoring.cost * costNorm;
  if (scoring.roas != null) s += scoring.roas * roasNorm;
  if (scoring.cpa != null) s += scoring.cpa * cpaNorm;
  if (scoring.conversions != null) s += scoring.conversions * convNorm;
  return Number.isFinite(s) ? s : 0;
}

function wasteReason(m: AggregatedMetrics, rules: StrategyRules["waste"]): string {
  const parts: string[] = [];
  if (rules?.maxRoas != null) parts.push(`ROAS ${m.roas.toFixed(2)} below maxRoas ${rules.maxRoas}`);
  if (rules?.maxConversions != null && m.conversions <= (rules.maxConversions ?? 0))
    parts.push(`Conversions ${m.conversions} with cost ${m.cost.toFixed(0)}`);
  if (parts.length === 0) return `Cost ${m.cost.toFixed(0)}, ROAS ${m.roas.toFixed(2)}`;
  return parts.join("; ");
}

function winnerReason(m: AggregatedMetrics, rules: StrategyRules["winners"]): string {
  const parts: string[] = [];
  if (rules?.minRoas != null) parts.push(`ROAS ${m.roas.toFixed(2)}`);
  if (rules?.minConversions != null) parts.push(`Conversions ${m.conversions}`);
  return parts.length ? parts.join(", ") : `Cost ${m.cost.toFixed(0)}, ROAS ${m.roas.toFixed(2)}`;
}

export function evaluateSegments(
  aggregation: {
    byState: Record<string, AggregatedMetrics>;
    byHour: Record<number, AggregatedMetrics>;
    byCampaign: Record<string, AggregatedMetrics>;
  },
  strategy: StrategyJson
): { wasteSegments: WasteSegment[]; winnerSegments: WinnerSegment[] } {
  const wasteSegments: WasteSegment[] = [];
  const winnerSegments: WinnerSegment[] = [];
  const rules = strategy.rules ?? {};
  const scoring = strategy.scoring ?? {};
  const segmentTypes = strategy.segmentTypes ?? ["state", "hour", "campaign"];

  if (segmentTypes.includes("state")) {
    for (const [key, m] of Object.entries(aggregation.byState)) {
      if (matchesWaste(m, rules.waste))
        wasteSegments.push({
          segmentType: "state",
          key,
          metrics: m,
          score: computeScore(m, scoring),
          reason: wasteReason(m, rules.waste),
        });
      if (matchesWinners(m, rules.winners))
        winnerSegments.push({
          segmentType: "state",
          key,
          metrics: m,
          score: computeScore(m, scoring),
          reason: winnerReason(m, rules.winners),
        });
    }
  }
  if (segmentTypes.includes("hour")) {
    for (const [key, m] of Object.entries(aggregation.byHour)) {
      if (matchesWaste(m, rules.waste))
        wasteSegments.push({
          segmentType: "hour",
          key,
          metrics: m,
          score: computeScore(m, scoring),
          reason: wasteReason(m, rules.waste),
        });
      if (matchesWinners(m, rules.winners))
        winnerSegments.push({
          segmentType: "hour",
          key,
          metrics: m,
          score: computeScore(m, scoring),
          reason: winnerReason(m, rules.winners),
        });
    }
  }
  if (segmentTypes.includes("campaign")) {
    for (const [key, m] of Object.entries(aggregation.byCampaign)) {
      if (matchesWaste(m, rules.waste))
        wasteSegments.push({
          segmentType: "campaign",
          key,
          metrics: m,
          score: computeScore(m, scoring),
          reason: wasteReason(m, rules.waste),
        });
      if (matchesWinners(m, rules.winners))
        winnerSegments.push({
          segmentType: "campaign",
          key,
          metrics: m,
          score: computeScore(m, scoring),
          reason: winnerReason(m, rules.winners),
        });
    }
  }
  return { wasteSegments, winnerSegments };
}

export function buildReallocationPlan(
  wasteSegments: WasteSegment[],
  winnerSegments: WinnerSegment[],
  strategy: StrategyJson
): ReallocationItem[] {
  const plan: ReallocationItem[] = [];
  const realloc = strategy.reallocation;
  if (!realloc?.enabled || winnerSegments.length === 0) return plan;
  const pct = Math.min(1, Math.max(0, realloc.percentOfSpendToMove ?? 0));
  const topWinner = winnerSegments.slice().sort((a, b) => b.score - a.score)[0];
  if (!topWinner) return plan;
  for (const w of wasteSegments) {
    const amount = w.metrics.cost * pct;
    if (amount <= 0) continue;
    plan.push({
      from: { segmentType: w.segmentType, key: w.key },
      to: { segmentType: topWinner.segmentType, key: topWinner.key },
      amount,
      reason: `Move ${(pct * 100).toFixed(0)}% of spend from ${w.segmentType}:${w.key} to ${topWinner.segmentType}:${topWinner.key}`,
    });
  }
  return plan;
}
