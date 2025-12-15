import { test, expect } from "@playwright/test";
import {
  DEMO_EVENTS,
  DEMO_PUBLISHED_EVENT_COUNT,
} from "../fixtures/demo-seed";
import { expectUrlContainsUuid } from "../fixtures/demo-helpers";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Events Explorer", () => {
  test("shows events list page", async ({ page }) => {
    await page.goto(`${BASE}/admin/events`);

    const root = page.locator('[data-test-id="admin-events-list-root"]');
    await expect(root).toBeVisible();
  });

  test("@quarantine displays published events from seed", async ({ page }) => {
    await page.goto(`${BASE}/admin/events`);

    const rows = page.locator('[data-test-id="admin-events-list-row"]');
    // Seed has 3 published events
    await expect(rows).toHaveCount(DEMO_PUBLISHED_EVENT_COUNT);

    const rowTexts = await rows.allTextContents();
    const allText = rowTexts.join(" ");
    // Check for known events from seed
    expect(allText).toContain("Coffee"); // Welcome Coffee
    expect(allText).toContain("Hike");   // Morning Hike
  });

  test("@quarantine title links navigate to event detail page", async ({ page }) => {
    await page.goto(`${BASE}/admin/events`);

    // Find the link for Morning Hike
    const titleLinks = page.locator('[data-test-id="admin-events-list-title-link"]');
    const hikeLink = titleLinks.filter({ hasText: "Hike" });
    await expect(hikeLink).toBeVisible();

    await hikeLink.click();

    // URL should contain a UUID (not e1)
    const url = page.url();
    expect(expectUrlContainsUuid(url)).toBe(true);

    const detailRoot = page.locator('[data-test-id="admin-event-detail-root"]');
    await expect(detailRoot).toBeVisible();
  });

  test("@quarantine nav link from main admin page works", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const navLink = page.locator('[data-test-id="admin-nav-events-explorer"]');
    await expect(navLink).toBeVisible();

    await navLink.click();

    await expect(page).toHaveURL(`${BASE}/admin/events`);

    const root = page.locator('[data-test-id="admin-events-list-root"]');
    await expect(root).toBeVisible();
  });

  test("@quarantine shows event categories from seed", async ({ page }) => {
    await page.goto(`${BASE}/admin/events`);

    const rows = page.locator('[data-test-id="admin-events-list-row"]');
    const rowTexts = await rows.allTextContents();
    const allText = rowTexts.join(" ");

    // Seed has Social and Outdoors categories
    expect(allText).toContain(DEMO_EVENTS.WELCOME_COFFEE.category);
    expect(allText).toContain(DEMO_EVENTS.MORNING_HIKE.category);
  });
});
