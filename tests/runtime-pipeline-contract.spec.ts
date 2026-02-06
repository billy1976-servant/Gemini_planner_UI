import { test, expect } from "@playwright/test";
import { persistContractArtifact } from "../src/debug/persistPipelineContractArtifact";

test("Runtime pipeline contract: layout dropdown triggers full pipeline and all steps pass", async (
  { page },
  testInfo
) => {
  const consoleLogs: string[] = [];
  const requestFailures: { url: string; failure: string }[] = [];

  page.on("console", (msg) => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
  });
  page.on("requestfailed", (req) => {
    requestFailures.push({
      url: req.url(),
      failure: req.failure()?.errorText ?? "unknown",
    });
  });

  await page.goto("http://localhost:3000/?screen=websites/demo-blueprint-site/app");

  const sectionSelect = page.locator('[id^="section-layout-preset-"]').first();
  await sectionSelect.waitFor({ state: "visible", timeout: 15000 });

  const currentValue = await sectionSelect.inputValue();
  const options = await sectionSelect.locator("option").evaluateAll((opts) =>
    opts.map((o) => (o as HTMLOptionElement).value).filter((v) => v !== "")
  );
  const otherValue = options.find((v) => v !== currentValue) ?? options[1];
  if (otherValue == null) {
    testInfo.skip();
    return;
  }

  await sectionSelect.selectOption(otherValue);

  await page.waitForFunction(
    () => (window as any).__PIPELINE_CONTRACT_RESULT__ !== undefined,
    { timeout: 10000 }
  );

  const results = await page.evaluate(() => (window as any).__PIPELINE_CONTRACT_RESULT__);
  const snapshot = await page.evaluate(() => (window as any).__PIPELINE_CONTRACT_SNAPSHOT__);

  const debugDump = results?.debugDump ?? {};
  const screenKey = debugDump.screenKey ?? "unknown";
  const activeSection = debugDump.activeSection ?? null;
  const failingStep = results?.results?.find((r: { pass: boolean }) => !r.pass);
  const reason = results?.failureReason ?? failingStep?.reason ?? null;

  if (results?.passed) {
    console.log("[CONTRACT] PASSED", { activeSection, screenKey });
  } else {
    console.log("[CONTRACT] FAILED", {
      failingStep: failingStep?.stepId ?? failingStep?.step,
      reason,
      activeSection,
      screenKey,
      beforeAfter: failingStep
        ? { before: failingStep.before, after: failingStep.after }
        : undefined,
    });
  }

  const artifactPath = persistContractArtifact(results);
  if (artifactPath) {
    console.log("[CONTRACT] Artifact saved:", artifactPath);
  }

  // --- BROWSER LAYOUT PROOF CAPTURE ---
  const sectionKeyForProof = activeSection ?? "nav_organ";
  const layoutProof = await page.evaluate((sectionKey: string) => {
    const results: Record<string, unknown> = {};
    const el = document.querySelector(`[data-section-id="${sectionKey}"]`) as HTMLElement | null;
    if (!el) {
      results.error = "Section element not found in DOM";
      results.sectionKey = sectionKey;
      return results;
    }
    const computed = window.getComputedStyle(el);
    results.sectionKey = sectionKey;
    results.dataset = { ...el.dataset };
    results.className = el.className;
    results.computedStyles = {
      maxWidth: computed.maxWidth,
      width: computed.width,
      display: computed.display,
      paddingLeft: computed.paddingLeft,
      paddingRight: computed.paddingRight,
    };
    results.boundingBox = {
      offsetWidth: el.offsetWidth,
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
    };
    return results;
  }, sectionKeyForProof);

  await testInfo.attach("layout-browser-proof.json", {
    body: JSON.stringify(layoutProof, null, 2),
    contentType: "application/json",
  });

  await testInfo.attach("pipeline-contract-result.json", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });
  if (results.conciseHandoffReport) {
    await testInfo.attach("pipeline-handoff-report.json", {
      body: JSON.stringify(results.conciseHandoffReport, null, 2),
      contentType: "application/json",
    });
  }
  await testInfo.attach("page-content.html", {
    body: await page.content(),
    contentType: "text/html",
  });
  await testInfo.attach("console-logs.txt", {
    body: consoleLogs.join("\n"),
    contentType: "text/plain",
  });
  if (requestFailures.length > 0) {
    await testInfo.attach("network-failures.json", {
      body: JSON.stringify(requestFailures, null, 2),
      contentType: "application/json",
    });
  }
  if (snapshot) {
    await testInfo.attach("pipeline-contract-snapshot.json", {
      body: JSON.stringify(snapshot, null, 2),
      contentType: "application/json",
    });
  }
  await page.screenshot({ path: testInfo.outputPath("screenshot.png"), fullPage: true }).catch(() => {});
  await testInfo.attach("screenshot", {
    path: testInfo.outputPath("screenshot.png"),
    contentType: "image/png",
  }).catch(() => {});

  expect(results).toBeTruthy();
  expect(results.passed).toBe(true);

  if (results.results && Array.isArray(results.results)) {
    const failed = results.results.filter((r: { pass: boolean }) => !r.pass);
    if (failed.length > 0) {
      const msg = failed
        .map(
          (r: { stepId?: string; step?: string; reason?: string; before?: unknown; after?: unknown }) =>
            `${r.stepId ?? r.step}: ${r.reason ?? "failed"} (before: ${JSON.stringify(r.before)}, after: ${JSON.stringify(r.after)})`
        )
        .join("; ");
      throw new Error(`Contract steps failed: ${msg}`);
    }
  }
  if (results.failureReason) {
    throw new Error(`Contract failure: ${results.failureReason}`);
  }
});
