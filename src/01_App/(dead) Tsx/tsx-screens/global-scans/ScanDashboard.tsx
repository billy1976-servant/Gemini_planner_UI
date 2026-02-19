"use client";
/**
 * ============================================================
 * 📊 GLOBAL SCAN — COMPOSITE DASHBOARD (LIVE)
 * ============================================================
 * READ-ONLY (state)
 * NO SIDE EFFECTS (except explicit scan triggers)
 * NO SCAN EXECUTION LOGIC HERE
 *
 * All values are derived from real scan state via selectors.
 */
import { useEffect, useState } from "react";
import { subscribeState } from "@/state/state-store";
import { selectGlobalWindow } from "@/engine/selectors/select-global-window";


/* 🔒 ADDITIVE ONLY — scheduler controls */
import {
  startScanScheduler,
  stopScanScheduler,
  runScanNow,
} from "@/engine/schedulers/scan-scheduler";


/* ============================================================
   TYPES (UNCHANGED)
============================================================ */
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


type TimeWindow = "6h" | "12h" | "24h";


/* ============================================================
   SIMPLE SVG LINE CHART (UNCHANGED)
============================================================ */
function LineChart({
  values,
  height = 80,
  width = 320,
  color = "#0af",
}: {
  values: number[];
  height?: number;
  width?: number;
  color?: string;
}) {
  if (!values || values.length < 2) {
    return <div style={{ opacity: 0.5 }}>No data</div>;
  }


  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;


  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });


  return (
    <svg width={width} height={height}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points.join(" ")}
      />
    </svg>
  );
}


/* ============================================================
   DASHBOARD
============================================================ */
export default function GlobalScanDashboard() {
  const [window, setWindow] = useState<TimeWindow>("12h");
  const [, forceRender] = useState(0);


  /* -------------------------------
     STATE SUBSCRIPTION (UNCHANGED)
  -------------------------------- */
  useEffect(() => {
    const sync = () => forceRender(v => v + 1);
    const unsub = subscribeState(sync);
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);


  /* -------------------------------
     WINDOW SELECTION (UNCHANGED)
  -------------------------------- */
  const windowMs =
    window === "6h"
      ? 6 * 60 * 60 * 1000
      : window === "12h"
      ? 12 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;


  /* -------------------------------
     DERIVED TRUTH (UNCHANGED)
  -------------------------------- */
  const stats = selectGlobalWindow(windowMs);
  const events: ScanEvent[] = stats.events || [];


  /* -------------------------------
     DIRECTIVE (UNCHANGED)
  -------------------------------- */
  const directive =
    stats.volatility > 25
      ? "PAUSE"
      : stats.avgMomentum > 10 && stats.directionConsistency > 0.7
      ? "SCALE"
      : "HOLD";


  /* -------------------------------
     RENDER
  -------------------------------- */
  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h2>📊 Global Scan — Composite Dashboard</h2>


      {/* 🔒 ADD: SCAN CONTROLS (EXPLICIT ONLY) */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button onClick={runScanNow}>Run Scan Now</button>
        <button onClick={startScanScheduler}>Start Scheduler</button>
        <button onClick={stopScanScheduler}>Stop Scheduler</button>
      </div>


      {/* WINDOW CONTROL */}
      <div style={{ marginBottom: 16 }}>
        <select
          value={window}
          onChange={e => setWindow(e.target.value as TimeWindow)}
        >
          <option value="6h">Last 6 hours</option>
          <option value="12h">Last 12 hours</option>
          <option value="24h">Last 24 hours</option>
        </select>
      </div>


      {/* METRICS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* SCORE */}
        <div>
          <h4>Score Timeline</h4>
          <LineChart values={events.map(e => e.score)} color="#4caf50" />
          <div>Avg score: {stats.avgScore.toFixed(1)}</div>
        </div>


        {/* MOMENTUM */}
        <div>
          <h4>Momentum Timeline</h4>
          <LineChart values={events.map(e => e.momentum)} color="#ff9800" />
          <div>Avg momentum: {stats.avgMomentum.toFixed(1)}</div>
        </div>


        {/* STABILITY */}
        <div>
          <h4>Stability Metrics</h4>
          <div>Volatility: {stats.volatility.toFixed(2)}</div>
          <div>
            Direction consistency:{" "}
            {(stats.directionConsistency * 100).toFixed(0)}%
          </div>
        </div>


        {/* DIRECTIVE */}
        <div>
          <h4>System Directive</h4>
          <div
            style={{
              fontSize: 26,
              fontWeight: "bold",
              color:
                directive === "SCALE"
                  ? "limegreen"
                  : directive === "PAUSE"
                  ? "crimson"
                  : "gold",
            }}
          >
            {directive}
          </div>
        </div>
      </div>


      {/* SNAPSHOT */}
      <h3>Snapshot</h3>
      <table width="100%" style={{ borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th align="left">Time</th>
            <th align="left">Keyword</th>
            <th>Score</th>
            <th>Momentum</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={i} style={{ borderTop: "1px solid #333" }}>
              <td>{new Date(e.timestamp).toLocaleTimeString()}</td>
              <td>{e.keyword}</td>
              <td align="center">{e.score}</td>
              <td align="center">{e.momentum}</td>
              <td align="center">{e.trend}</td>
            </tr>
          ))}
        </tbody>
      </table>


      {events.length === 0 && (
        <div style={{ marginTop: 16, opacity: 0.6 }}>
          No scan data in selected window.
        </div>
      )}
    </div>
  );
}


