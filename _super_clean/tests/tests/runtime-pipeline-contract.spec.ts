import { test, expect } from "@playwright/test";
import { persistContractArtifact } from "../src/07_Dev_Tools/debug/persistPipelineContractArtifact";

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

  // #region agent log
  // Wait for page to load and check what's actually rendered
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(2000); // Extra wait for React to render
  const pageInfo = await page.evaluate(() => {
    const organPanel = document.querySelector('[data-organ-panel]');
    const sectionSelects = Array.from(document.querySelectorAll('[id^="section-layout-preset-"]'));
    const allSelects = Array.from(document.querySelectorAll('select'));
    const layoutTilePickers = Array.from(document.querySelectorAll('[data-layout-tile-picker]'));
    const rightSidebar = document.querySelector('[data-right-sidebar]') || document.querySelector('[class*="RightSidebar"]') || document.querySelector('[class*="right-sidebar"]');
    const layoutButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent?.toLowerCase().includes('layout') || 
      btn.getAttribute('aria-label')?.toLowerCase().includes('layout')
    );
    const allButtons = Array.from(document.querySelectorAll('button')).map(btn => ({
      text: btn.textContent,
      ariaLabel: btn.getAttribute('aria-label'),
      id: btn.id,
      className: btn.className
    }));
    return {
      url: window.location.href,
      organPanelExists: !!organPanel,
      organPanelVisible: organPanel ? window.getComputedStyle(organPanel as HTMLElement).display !== 'none' : false,
      sectionSelectsCount: sectionSelects.length,
      sectionSelectIds: sectionSelects.map((el: Element) => el.id),
      allSelectsCount: allSelects.length,
      layoutTilePickersCount: layoutTilePickers.length,
      rightSidebarExists: !!rightSidebar,
      rightSidebarVisible: rightSidebar ? window.getComputedStyle(rightSidebar as HTMLElement).display !== 'none' : false,
      layoutButtonsCount: layoutButtons.length,
      allButtonsCount: allButtons.length,
      sampleButtons: allButtons.slice(0, 10),
      consoleErrors: (window as any).__CONSOLE_ERRORS__ || [],
    };
  });
  fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runtime-pipeline-contract.spec.ts:23',message:'Page load check',data:pageInfo,timestamp:Date.now(),runId:'initial',hypothesisId:'A,B,C,D'})}).catch(()=>{});
  // #endregion

  // #region agent log
  // Try to open the layout panel - it's in the right sidebar rail with aria-label="Layout"
  fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runtime-pipeline-contract.spec.ts:24',message:'Attempting to open layout panel',data:{organPanelExists:pageInfo.organPanelExists,rightSidebarExists:pageInfo.rightSidebarExists},timestamp:Date.now(),runId:'initial',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  // Wait for sidebar to be fully rendered, then click the Layout button
  await page.waitForTimeout(1000);
  const layoutButton = page.locator('button[aria-label="Layout"]');
  const layoutButtonExists = await layoutButton.count() > 0;
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runtime-pipeline-contract.spec.ts:25',message:'Layout button check',data:{layoutButtonExists},timestamp:Date.now(),runId:'initial',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  if (layoutButtonExists) {
    await layoutButton.click();
    await page.waitForTimeout(1500); // Wait for panel to open and OrganPanel to render
    
    // #region agent log
    const afterClick = await page.evaluate(() => {
      const organPanel = document.querySelector('[data-organ-panel]');
      const selects = Array.from(document.querySelectorAll('[id^="section-layout-preset-"]'));
      const tilePickers = Array.from(document.querySelectorAll('[data-layout-tile-picker]'));
      return { 
        organPanelExists: !!organPanel, 
        selectCount: selects.length, 
        selectIds: selects.map((el: Element) => el.id),
        tilePickerCount: tilePickers.length
      };
    });
    fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runtime-pipeline-contract.spec.ts:26',message:'After layout button click',data:afterClick,timestamp:Date.now(),runId:'initial',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  }

  // Check if we need to switch to text mode (selects only appear in text mode)
  const sectionSelect = page.locator('[id^="section-layout-preset-"]').first();
  const selectCount = await sectionSelect.count();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runtime-pipeline-contract.spec.ts:27',message:'Before text mode check',data:{selectCount},timestamp:Date.now(),runId:'initial',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // If no selects found, try switching to text mode
  if (selectCount === 0) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runtime-pipeline-contract.spec.ts:28',message:'Switching to text mode',data:{},timestamp:Date.now(),runId:'initial',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const textModeButton = page.locator('button:has-text("Text")').first();
    const textButtonCount = await textModeButton.count();
    if (textButtonCount > 0) {
      await textModeButton.click();
      await page.waitForTimeout(1000); // Wait for re-render
      // #region agent log
      const afterTextMode = await page.evaluate(() => {
        const selects = Array.from(document.querySelectorAll('[id^="section-layout-preset-"]'));
        return { selectCount: selects.length, selectIds: selects.map((el: Element) => el.id) };
      });
      fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runtime-pipeline-contract.spec.ts:29',message:'After text mode click',data:afterTextMode,timestamp:Date.now(),runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    }
  }
  
  // #region agent log
  const beforeWait = await sectionSelect.count();
  fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'runtime-pipeline-contract.spec.ts:30',message:'Before waitFor',data:{elementCount:beforeWait},timestamp:Date.now(),runId:'initial',hypothesisId:'A,B,C,D'})}).catch(()=>{});
  // #endregion
  
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
