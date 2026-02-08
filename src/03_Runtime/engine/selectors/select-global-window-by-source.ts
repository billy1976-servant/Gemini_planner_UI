import { getState } from "@/state/state-store";


type ScanEvent = {
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


function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}


function volatility(nums: number[]) {
  if (nums.length < 2) return 0;
  const mean = avg(nums);
  return Math.sqrt(avg(nums.map(n => (n - mean) ** 2)));
}


export function selectGlobalWindowBySource(windowMs: number) {
  const state = getState();
  const scans: ScanEvent[] = Array.isArray(state.scans) ? state.scans : [];
  const now = Date.now();


  const windowed = scans.filter(s => now - s.timestamp <= windowMs);


  const grouped: Record<string, ScanEvent[]> = {};


  for (const e of windowed) {
    const source = e.source || "unknown";
    if (!grouped[source]) grouped[source] = [];
    grouped[source].push(e);
  }


  return Object.entries(grouped).map(([source, events]) => {
    const scores = events.map(e => e.score);
    const momentum = events.map(e => e.momentum);


    return {
      source,
      count: events.length,
      avgScore: avg(scores),
      avgMomentum: avg(momentum),
      volatility: volatility(scores),
    };
  });
}


