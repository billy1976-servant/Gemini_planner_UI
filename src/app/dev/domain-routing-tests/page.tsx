"use client";

import React, { useCallback, useEffect, useState } from "react";

/** One test case: host + path (tested against current origin in dev). */
export type DomainRoutingTestCase = {
  host: string;
  path: string;
  expectedPath: string | null; // null = only check 200, no [AUTO-RESOLVE] path
  description?: string;
};

const TEST_CASES: DomainRoutingTestCase[] = [
  {
    host: "learn.containercreations.com",
    path: "/",
    expectedPath: "ContainerCreations/Learn/landing",
    description: "learn landing",
  },
  {
    host: "learn.containercreations.com",
    path: "/onboarding",
    expectedPath: "ContainerCreations/Learn/onboarding",
    description: "learn onboarding",
  },
  {
    host: "learn.containercreations.com",
    path: "/onboarding/ContainerCreationsLanding-5.json",
    expectedPath: null,
    description: "JSON resource 200",
  },
  {
    host: "christian.hiclarify.com",
    path: "/",
    expectedPath: "HIClarify/Christian",
    description: "christian landing (default)",
  },
  {
    host: "christian.hiclarify.com",
    path: "/prayer",
    expectedPath: "HIClarify/Christian/prayer",
    description: "christian prayer",
  },
];

export type DomainRoutingTestResult = {
  url: string;
  expectedPath: string | null;
  actualPath: string | null;
  status: number | null;
  networkError: string | null;
  autoResolveSeen: boolean;
  pass: boolean;
  message: string;
};

function buildTestUrl(origin: string, host: string, path: string): string {
  try {
    const u = new URL(origin);
    const port = u.port ? `:${u.port}` : "";
    const protocol = u.protocol || "http:";
    return `${protocol}//${host}${port}${path}`;
  } catch {
    return `${origin}${path}`;
  }
}

async function runSingleTest(
  testUrl: string,
  expectedPath: string | null,
  failFast: boolean
): Promise<{ result: DomainRoutingTestResult; shouldStop: boolean }> {
  const report: DomainRoutingTestResult = {
    url: testUrl,
    expectedPath,
    actualPath: null,
    status: null,
    networkError: null,
    autoResolveSeen: false,
    pass: false,
    message: "",
  };

  // 1) Fetch for status
  try {
    const res = await fetch(testUrl, { method: "GET", credentials: "same-origin" });
    report.status = res.status;
  } catch (err) {
    report.networkError = err instanceof Error ? err.message : String(err);
  }

  // 2) Load in iframe to capture [AUTO-RESOLVE] (same-origin only)
  const actualPath = await new Promise<string | null>((resolve) => {
    let settled = false;
    const settle = (value: string | null) => {
      if (settled) return;
      settled = true;
      iframe.remove();
      resolve(value);
    };
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.setAttribute("aria-hidden", "true");

    const timeout = setTimeout(() => {
      try {
        const w = iframe.contentWindow as Window & { __LAST_AUTO_RESOLVE__?: string } | null;
        settle(w?.__LAST_AUTO_RESOLVE__ ?? null);
      } catch {
        settle(null);
      }
    }, 5000);

    iframe.onload = () => {
      // Allow React to hydrate and run getResolvedPath (which sets __LAST_AUTO_RESOLVE__)
      setTimeout(() => {
        clearTimeout(timeout);
        try {
          const w = iframe.contentWindow as Window & { __LAST_AUTO_RESOLVE__?: string } | null;
          settle(w?.__LAST_AUTO_RESOLVE__ ?? null);
        } catch {
          settle(null);
        }
      }, 400);
    };
    iframe.onerror = () => {
      clearTimeout(timeout);
      settle(null);
    };
    document.body.appendChild(iframe);
    iframe.src = testUrl;
  });

  report.actualPath = actualPath;
  report.autoResolveSeen = actualPath != null && actualPath.length > 0;

  // 3) Validate — fail conditions
  const pathMismatch = expectedPath != null && actualPath !== expectedPath;
  const non200 = report.status != null && report.status !== 200;
  const noAutoResolve = expectedPath != null && !report.autoResolveSeen;
  const hasNetworkError = report.networkError != null;

  if (pathMismatch) report.message = `Path mismatch: expected "${expectedPath}", got "${actualPath}"`;
  else if (non200) report.message = `Non-200 status: ${report.status}`;
  else if (noAutoResolve) report.message = "No [AUTO-RESOLVE] log (expected path but none seen)";
  else if (hasNetworkError) report.message = `Network error: ${report.networkError}`;
  else report.message = "OK";

  report.pass = !pathMismatch && !non200 && !noAutoResolve && !hasNetworkError;
  const shouldStop = failFast && !report.pass;

  return { result: report, shouldStop };
}

export async function runDomainRoutingTests(options?: {
  failFast?: boolean;
  origin?: string;
}): Promise<{ passed: number; failed: number; results: DomainRoutingTestResult[] }> {
  const failFast = options?.failFast !== false;
  const origin = options?.origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  const casesToRun = TEST_CASES.filter((t) => t.host === hostname);
  if (casesToRun.length === 0) {
    console.warn(
      "[domain-routing-tests] No test cases for current host:",
      hostname,
      "— add hosts (e.g. learn.containercreations.com, christian.hiclarify.com) to 127.0.0.1 and open this page from that host."
    );
    return { passed: 0, failed: 0, results: [] };
  }

  const results: DomainRoutingTestResult[] = [];
  let passed = 0;
  let failed = 0;

  console.log("[domain-routing-tests] Running", casesToRun.length, "tests for host:", hostname);

  for (const tc of casesToRun) {
    const testUrl = buildTestUrl(origin, tc.host, tc.path);
    const { result, shouldStop } = await runSingleTest(testUrl, tc.expectedPath, failFast);
    results.push(result);
    if (result.pass) passed++;
    else failed++;

    const status = result.pass ? "PASS" : "FAIL";
    console.log(
      `[domain-routing-tests] ${status} ${testUrl}`,
      result.pass ? "" : result.message,
      result.actualPath != null ? `resolved: ${result.actualPath}` : ""
    );

    if (shouldStop) {
      console.error("[domain-routing-tests] Failing fast after first failure.");
      break;
    }
  }

  // Report
  const lines: string[] = [
    "",
    "========== Domain routing test report ==========",
    `Host: ${hostname}`,
    `Ran: ${results.length} | Passed: ${passed} | Failed: ${failed}`,
    "",
  ];
  for (const r of results) {
    const status = r.pass ? "PASS" : "FAIL";
    lines.push(`${status} ${r.url}`);
    lines.push(`  Expected path: ${r.expectedPath ?? "(any / 200 only)"}`);
    lines.push(`  Actual path:   ${r.actualPath ?? "(none)"}`);
    if (r.status != null) lines.push(`  HTTP status:   ${r.status}`);
    if (r.networkError) lines.push(`  Network error: ${r.networkError}`);
    if (!r.pass && r.message) lines.push(`  Message: ${r.message}`);
    lines.push("");
  }
  lines.push("==========================================");
  const reportText = lines.join("\n");
  console.log(reportText);

  return { passed, failed, results };
}

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
    (window as Window & { runDomainRoutingTests?: () => Promise<ReturnType<typeof runDomainRoutingTests>> }).runDomainRoutingTests =
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
