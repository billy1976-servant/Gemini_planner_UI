"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  runDomainRoutingTests,
  type DomainRoutingTestResult,
} from "./runDomainRoutingTests";

export default function DomainRoutingTestsPage() {
  const [report, setReport] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DomainRoutingTestResult[] | null>(null);

  const runTests = useCallback(async () => {
    if (process.env.NODE_ENV !== "development") return;
    setRunning(true);
    setReport(null);
    setResults(null);
    try {
      const { passed, failed, results: res } = await runDomainRoutingTests({ failFast: true });
      setResults(res);
      const lines: string[] = [
        `Host: ${typeof window !== "undefined" ? window.location.hostname : ""}`,
        `Ran: ${res.length} | Passed: ${passed} | Failed: ${failed}`,
        "",
      ];
      for (const r of res) {
        const status = r.pass ? "PASS" : "FAIL";
        lines.push(`${status} ${r.url}`);
        lines.push(`  Expected: ${r.expectedPath ?? "(200 only)"} | Actual: ${r.actualPath ?? "(none)"}`);
        if (r.status != null) lines.push(`  Status: ${r.status}`);
        if (r.networkError) lines.push(`  Error: ${r.networkError}`);
        if (!r.pass && r.message) lines.push(`  ${r.message}`);
        lines.push("");
      }
      setReport(lines.join("\n"));
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return;
    (window as Window & { runDomainRoutingTests?: typeof runDomainRoutingTests }).runDomainRoutingTests =
      runDomainRoutingTests;
    return () => {
      delete (window as Window & { runDomainRoutingTests?: unknown }).runDomainRoutingTests;
    };
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return (
      <div style={{ padding: "2rem", color: "#666" }}>
        Domain routing tests are only available in development.
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: 720 }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Domain routing tests</h1>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        Run tests for the current host. Point learn.containercreations.com and christian.hiclarify.com to 127.0.0.1, then open this page from each host and run.
      </p>
      <p style={{ marginBottom: "1rem" }}>
        <strong>Console:</strong> <code>window.runDomainRoutingTests()</code>
      </p>
      <button
        type="button"
        onClick={runTests}
        disabled={running}
        style={{
          padding: "0.5rem 1rem",
          cursor: running ? "wait" : "pointer",
          marginBottom: "1rem",
        }}
      >
        {running ? "Running…" : "Run tests (UI)"}
      </button>
      {results != null && (
        <p style={{ marginBottom: "0.5rem" }}>
          {results.every((r) => r.pass) ? "All passed." : "Some tests failed."}
        </p>
      )}
      {report && (
        <pre
          style={{
            background: "#f4f4f4",
            padding: "1rem",
            overflow: "auto",
            fontSize: 12,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {report}
        </pre>
      )}
    </div>
  );
}
