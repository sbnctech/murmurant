import { test, expect } from "@playwright/test";
import { waitForAdminFrame } from "../helpers/waitForAdminFrame";

test.describe("Admin Events Table (iframe)", () => {
  test("renders events from PFOS seed", async ({ page }) => {
    await page.goto("/admin-frame");

    const frame = await waitForAdminFrame(page);

    const rows = frame.locator('[data-test-id="admin-events-row"]');
    // Wait for events to load and verify at least one exists
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify PFOS events are present
    const rowTexts = await rows.allTextContents();
    const allText = rowTexts.join(" ");
    // Check for known events from PFOS seed
    expect(allText).toContain("Sparrow"); // Annual House Sparrow Count
    expect(allText).toContain("Bird Walk"); // The Completely Ordinary Bird Walk
  });

  test("shows event categories", async ({ page }) => {
    await page.goto("/admin-frame");

    const frame = await waitForAdminFrame(page);

    const rows = frame.locator('[data-test-id="admin-events-row"]');
    await expect(rows.first()).toBeVisible();

    const rowTexts = await rows.allTextContents();
    const allText = rowTexts.join(" ");

    // PFOS seed has Census, Social, Outing categories
    expect(allText).toContain("Census");
    expect(allText).toContain("Social");
    expect(allText).toContain("Outing");
  });
});
