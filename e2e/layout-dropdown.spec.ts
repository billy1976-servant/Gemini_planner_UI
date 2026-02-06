import { test, expect } from "@playwright/test";

/**
 * E2E: Section layout dropdown → DOM actually changes.
 * Verifies that changing the section layout preset in the dropdown updates the section's
 * data-section-layout in the DOM. Fails if no visual/layout change occurs (truth detector).
 */
test.describe("Section layout dropdown", () => {
  const APP_URL = "/?screen=websites/demo-blueprint-site/app";

  test("changing section layout preset updates section data-section-layout in DOM", async ({
    page,
  }) => {
    await page.goto(APP_URL);

    // Wait for app and layout panel (OrganPanel) to be ready — section layout dropdown visible
    const sectionLayoutSelect = page.locator(
      'select[id^="section-layout-preset-"]'
    ).first();
    await expect(sectionLayoutSelect).toBeVisible({ timeout: 15000 });
    await expect(sectionLayoutSelect).toBeVisible();

    const selectId = await sectionLayoutSelect.getAttribute("id");
    expect(selectId).toBeTruthy();
    const sectionId = selectId!.replace("section-layout-preset-", "");

    // Section in main content (not in the side panel)
    const sectionEl = page.locator(
      `[data-section-id="${sectionId}"]`
    ).first();
    await expect(sectionEl).toBeVisible({ timeout: 5000 });

    const layoutAttrBefore = await sectionEl.getAttribute("data-section-layout");

    // Get options and pick a different value than current
    const currentValue = await sectionLayoutSelect.inputValue();
    const options = await sectionLayoutSelect.locator("option").allTextContents();
    const values = await sectionLayoutSelect.locator("option").evaluateAll(
      (opts) => opts.map((o) => (o as HTMLOptionElement).value)
    );
    const valueOptions = values
      .map((v, i) => ({ value: v, label: options[i]?.trim() ?? v }))
      .filter((o) => o.value !== "");

    if (valueOptions.length < 2) {
      test.skip();
      return;
    }

    const otherOption = valueOptions.find((o) => o.value !== currentValue) ?? valueOptions[1];
    await sectionLayoutSelect.selectOption(otherOption.value);

    // Wait for DOM to update: section's data-section-layout must become the selected value
    await expect(sectionEl).toHaveAttribute(
      "data-section-layout",
      otherOption.value,
      { timeout: 10000 }
    );

    const layoutAttrAfter = await sectionEl.getAttribute("data-section-layout");
    expect(layoutAttrAfter).toBe(otherOption.value);
    if (layoutAttrBefore !== undefined && layoutAttrBefore !== null) {
      expect(layoutAttrAfter).not.toBe(layoutAttrBefore);
    }
  });
});
