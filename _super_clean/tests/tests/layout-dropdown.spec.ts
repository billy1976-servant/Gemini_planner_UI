import { test, expect } from "@playwright/test";

test("Section layout dropdown triggers full runtime pipeline contract PASS", async ({
  page,
}) => {
  // Load app screen that has section layout dropdown (OrganPanel)
  await page.goto("http://localhost:3000/?screen=websites/demo-blueprint-site/app");

  // Wait for layout dropdown to be present
  await page.locator('[id^="section-layout-preset-"]').first().waitFor({ state: "visible", timeout: 15000 });

  // Open layout dropdown and change preset
  await page.selectOption('[id^="section-layout-preset-"]', { index: 1 });

  // Wait for contract results to appear in window
  await page.waitForFunction(
    () => (window as any).__LAST_CONTRACT_RESULTS__ !== undefined,
    { timeout: 5000 }
  );

  const results = await page.evaluate(() => (window as any).__LAST_CONTRACT_RESULTS__);

  console.log("Contract Results:", results);

  expect(results).toBeTruthy();
  expect(results.passed).toBe(true);
});
