import { getState } from "@/state/state-store";


export function selectGlobalWindow(windowMs: number) {
  const state = getState();
  const scans = Array.isArray(state.scans) ? state.scans : [];
  const now = Date.now();


  const events = scans.filter(s => now - s.timestamp <= windowMs);


  if (events.length === 0) {
    return {
      events: [],
      avgScore: 0,
      avgMomentum: 0,
      volatility: 0,
      directionConsistency: 0,
    };
  }


  const scores = events.map(e => e.score);
  const momentum = events.map(e => e.momentum);


  const avgScore = scores.reduce((a,b) => a+b, 0) / scores.length;
  const avgMomentum = momentum.reduce((a,b) => a+b, 0) / momentum.length;


  const variance =
    scores.reduce((a,b) => a + Math.pow(b - avgScore, 2), 0) / scores.length;


  const volatility = Math.sqrt(variance);


  const directionConsistency =
    events.filter(e => e.trend === events[0].trend).length / events.length;


  return {
    events,
    avgScore,
    avgMomentum,
    volatility,
    directionConsistency,
  };
}


