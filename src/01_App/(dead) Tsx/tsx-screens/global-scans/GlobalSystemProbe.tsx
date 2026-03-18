"use client";


import { useEffect, useState } from "react";
import { analyzeScan, InterpretedScan } from "@/scans/global-scans/global-scan.analyzer";
import scanConfig from "@/scans/global-scans/global-scan.config.json";


/**
 * ============================================================
 * 🌍 GlobalScanBaselineScreen
 * ============================================================
 *
 * PURPOSE:
 * - Baseline, ZERO-dependency screen to validate your scan system
 * - No registry
 * - No renderer
 * - No schedulers
 * - No state engine
 *
 * WHAT THIS PROVES:
 * ✅ scan config loads
 * ✅ sources fire
 * ✅ analyzer runs
 * ✅ interpretation works
 * ✅ results are renderable
 *
 * This is the “plug something in and SEE IT” screen.
 */


export default function GlobalScanBaselineScreen() {
  const [results, setResults] = useState<InterpretedScan[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let cancelled = false;


    async function runScans() {
      try {
        setRunning(true);
        setError(null);


        const outputs: InterpretedScan[] = [];


        for (const scanDef of scanConfig as any[]) {
          const interpreted = await analyzeScan({
            id: scanDef.id,
            source: {
              query: scanDef.source.query,
              scope: scanDef.source.scope,
            },
          });


          outputs.push(interpreted);
        }


        if (!cancelled) {
          setResults(outputs);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setRunning(false);
        }
      }
    }


    runScans();


    return () => {
      cancelled = true;
    };
  }, []);


  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Global Scan — Baseline Screen</h1>


      <p>
        Status:{" "}
        <strong>
          {running ? "Running…" : error ? "Error" : "Complete"}
        </strong>
      </p>


      {error && (
        <pre style={{ color: "red", whiteSpace: "pre-wrap" }}>
          {error}
        </pre>
      )}


      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          marginTop: 16,
        }}
      >
        <thead>
          <tr>
            <th align="left">Scan ID</th>
            <th align="left">Keyword</th>
            <th align="left">Region</th>
            <th align="right">Score</th>
            <th align="right">Momentum</th>
            <th align="left">Trend</th>
            <th align="left">Tags</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.keyword}</td>
              <td>{r.region}</td>
              <td align="right">{r.score}</td>
              <td align="right">{r.momentum}</td>
              <td>{r.trend}</td>
              <td>{r.tags.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>


      {results.length === 0 && !running && !error && (
        <p>No results.</p>
      )}
    </div>
  );
}


