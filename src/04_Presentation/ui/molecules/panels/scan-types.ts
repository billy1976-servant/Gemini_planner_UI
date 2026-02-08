/**
 * Scan types for global-scan panels (moved from apps-tsx/tsx-screens/global-scans).
 */
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
