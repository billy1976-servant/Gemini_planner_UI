// src/apps-tsx/tsx-screens/global-scans/types.ts


export type Scan = {
  id: string;
  keyword: string;
  region: string;
  timestamp: number;
  rawValue: number;
  score: number;
  momentum: number;
  trend: "up" | "down" | "flat";
  tags?: string[];
  source?: string;
};


export type TimeWindow = "1h" | "6h" | "12h" | "24h" | "all";


export type WindowStats = {
  events: Scan[];
  avgScore: number;
  avgMomentum: number;
  volatility: number;
  directionConsistency: number;
};
