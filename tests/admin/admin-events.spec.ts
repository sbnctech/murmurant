import { test, expect } from "@playwright/test";
import { waitForAdminFrame } from "../helpers/waitForAdminFrame";

test.describe("Admin Events Table (iframe)", () => {
  test("renders events from seed", async ({ page }) => {
    await page.goto("/admin-frame");

    const frame = await waitForAdminFrame(page);

    const rows = frame.locator('[data-test-id="admin-events-row"]');
    // Wait for events to load and verify at least one exists
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify some events from seed are present
    const rowTexts = await rows.allTextContents();
    const allText = rowTexts.join(" ");
    // Check for known events from seed
    expect(allText).toContain("Coffee"); // Welcome Coffee
    expect(allText).toContain("Hike"); // Morning Hike at Rattlesnake Canyon
  });

  test("shows event categories", async ({ page }) => {
    await page.goto("/admin-frame");

    const frame = await waitForAdminFrame(page);

    const rows = frame.locator('[data-test-id="admin-events-row"]');
    await expect(rows.first()).toBeVisible();

    const rowTexts = await rows.allTextContents();
    const allText = rowTexts.join(" ");

    // Seed has Social and Outdoors categories
    expect(allText).toContain("Social");
    expect(allText).toContain("Outdoors");
  });
});
