export type WindowStats = {
    count: number;
    avgScore: number;
    avgMomentum: number;
    volatility: number;
    directionConsistency: number; // 0..1
  };
  
  
  export function selectScanWindow(
    events: any[],
    scanId: string,
    windowMs: number,
    now = Date.now()
  ): WindowStats {
    const items = events.filter(
      e =>
        e.intent === "scan.interpreted" &&
        e.payload.id === scanId &&
        now - e.payload.timestamp <= windowMs
    );
  
  
    if (!items.length) {
      return { count: 0, avgScore: 0, avgMomentum: 0, volatility: 0, directionConsistency: 0 };
    }
  
  
    const scores = items.map(i => i.payload.score);
    const momenta = items.map(i => i.payload.momentum);
    const trends = items.map(i => i.payload.trend);
  
  
    const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
    const variance = (a: number[]) => avg(a.map(v => (v - avg(a)) ** 2));
  
  
    const dominant = trends.filter(t => t === trends[0]).length / trends.length;
  
  
    return {
      count: items.length,
      avgScore: avg(scores),
      avgMomentum: avg(momenta),
      volatility: Math.sqrt(variance(scores)),
      directionConsistency: dominant,
    };
  }
  
  
  