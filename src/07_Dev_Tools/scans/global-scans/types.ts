/**
 * Global Scan Types
 */

export type ScanEvent = {
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
