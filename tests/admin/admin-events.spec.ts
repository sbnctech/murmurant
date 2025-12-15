import { test, expect } from "@playwright/test";
import { waitForAdminFrame } from "../helpers/waitForAdminFrame";
import {
  DEMO_EVENTS,
  DEMO_PUBLISHED_EVENT_COUNT,
} from "../fixtures/demo-seed";

test.describe("@quarantine Admin Events Table", () => {
  test("renders seed events", async ({ page }) => {
    await page.goto("/admin-frame");

    const frame = await waitForAdminFrame(page);

    const rows = frame.locator('[data-test-id="admin-events-row"]');
    // Check we have at least the published events (seed has 3 published)
    await expect(rows).toHaveCount(DEMO_PUBLISHED_EVENT_COUNT);

    // Verify known events from seed are present
    const rowTexts = await rows.allTextContents();
    const allText = rowTexts.join(" ");
    expect(allText).toContain(DEMO_EVENTS.MORNING_HIKE.title);
  });

  test("shows event categories", async ({ page }) => {
    await page.goto("/admin-frame");

    const frame = await waitForAdminFrame(page);

    const rows = frame.locator('[data-test-id="admin-events-row"]');
    const rowTexts = await rows.allTextContents();
    const allText = rowTexts.join(" ");

    // Seed has Social and Outdoors categories
    expect(allText).toContain("Social");
    expect(allText).toContain("Outdoors");
  });
});
