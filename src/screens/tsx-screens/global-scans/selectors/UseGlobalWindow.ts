// src/screens/tsx-screens/global-scans/selectors/UseGlobalWindow.ts


import { getState } from "@/state/state-store";
import { Scan, WindowStats } from "../types";


function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}


function volatility(nums: number[]) {
  if (nums.length < 2) return 0;
  const mean = avg(nums);
  return Math.sqrt(avg(nums.map(n => (n - mean) ** 2)));
}


export function useGlobalWindow(windowMs: number): WindowStats {
  const state = getState();
  const scans: Scan[] = Array.isArray(state.scans) ? state.scans : [];


  const now = Date.now();
  const events = scans.filter(s => now - s.timestamp <= windowMs);


  const scores = events.map(e => e.score);
  const momentum = events.map(e => e.momentum);


  const directionConsistency =
    events.length === 0
      ? 0
      : events.filter(e => e.trend === events[0].trend).length / events.length;


  return {
    events,
    avgScore: avg(scores),
    avgMomentum: avg(momentum),
    volatility: volatility(scores),
    directionConsistency,
  };
}
