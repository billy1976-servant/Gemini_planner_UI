// src/engine/selectors/global-scan-time-window-reducer.ts


/**
 * GLOBAL SCAN TIME WINDOW REDUCER
 *
 * PURPOSE:
 * - Reduce raw / interpreted scan history into a TIME-BOUNDED summary
 * - Produce a UI-ready object (counts, averages, trends)
 *
 * GUARANTEES:
 * - Pure function
 * - No mutation
 * - No state access
 * - No timers
 * - No side effects
 *
 * INPUT:
 * - scans: append-only scan events (from derivedState.scans)
 * - windowMs: time window size (e.g. last 5m, 1h, 24h)
 *
 * OUTPUT:
 * - Deterministic summary object for rendering
 */


export type TimeWindowScanSummary = {
    windowMs: number;
    total: number;
    byKeyword: Record<
      string,
      {
        count: number;
        avgScore: number;
        lastTimestamp: number;
        trend?: string;
        momentum?: number;
      }
    >;
  };
  
  
  export function reduceScansToTimeWindow(
    scans: any[] | undefined,
    windowMs: number,
    now: number = Date.now()
  ): TimeWindowScanSummary {
    const summary: TimeWindowScanSummary = {
      windowMs,
      total: 0,
      byKeyword: {},
    };
  
  
    if (!Array.isArray(scans) || scans.length === 0) {
      return summary;
    }
  
  
    const windowStart = now - windowMs;
  
  
    for (const scan of scans) {
      if (!scan || typeof scan.timestamp !== "number") continue;
      if (scan.timestamp < windowStart) continue;
  
  
      summary.total++;
  
  
      const key = typeof scan.keyword === "string" ? scan.keyword : "unknown";
  
  
      if (!summary.byKeyword[key]) {
        summary.byKeyword[key] = {
          count: 0,
          avgScore: 0,
          lastTimestamp: scan.timestamp,
          trend: scan.trend,
          momentum: scan.momentum,
        };
      }
  
  
      const entry = summary.byKeyword[key];
  
  
      entry.count++;
      entry.avgScore =
        (entry.avgScore * (entry.count - 1) + (scan.score ?? 0)) /
        entry.count;
  
  
      if (scan.timestamp > entry.lastTimestamp) {
        entry.lastTimestamp = scan.timestamp;
        entry.trend = scan.trend;
        entry.momentum = scan.momentum;
      }
    }
  
  
    return summary;
  }
  
  
  