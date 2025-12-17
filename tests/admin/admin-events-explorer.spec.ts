import { test, expect } from "@playwright/test";
import { SEED_EVENTS } from "../fixtures/seed-data";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Events Explorer", () => {
  test("shows events list page", async ({ page }) => {
    await page.goto(`${BASE}/admin/events`);

    const root = page.locator('[data-test-id="admin-events-list-root"]');
    await expect(root).toBeVisible();
  });

  test("displays events from seed", async ({ page }) => {
    await page.goto(`${BASE}/admin/events`);

    const rows = page.locator('[data-test-id="admin-events-list-row"]');
    // Wait for rows to load and verify at least one exists
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const rowTexts = await rows.allTextContents();
    const allText = rowTexts.join(" ");
    // Check for known events from seed
    expect(allText).toContain("Coffee"); // Welcome Coffee
    expect(allText).toContain("Hike"); // Morning Hike at Rattlesnake Canyon
  });

  test("title links navigate to event detail page", async ({ page }) => {
    await page.goto(`${BASE}/admin/events`);

    // Find any title link and click it
    const titleLinks = page.locator('[data-test-id="admin-events-list-title-link"]');
    await expect(titleLinks.first()).toBeVisible();

    await titleLinks.first().click();

    // URL should contain a UUID
    await expect(page).toHaveURL(/\/admin\/events\/[0-9a-f-]{36}/);

    // Wait for detail page to load
    const detailRoot = page.locator('[data-test-id="admin-event-detail-root"]');
    await expect(detailRoot).toBeVisible({ timeout: 10000 });
  });

  test("nav link from main admin page works", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const navLink = page.locator('[data-test-id="admin-nav-events-explorer"]');
    await expect(navLink).toBeVisible();

    await navLink.click();

    await expect(page).toHaveURL(`${BASE}/admin/events`);

    const root = page.locator('[data-test-id="admin-events-list-root"]');
    await expect(root).toBeVisible();
  });

  test("shows event categories from seed", async ({ page }) => {
    await page.goto(`${BASE}/admin/events`);

    const rows = page.locator('[data-test-id="admin-events-list-row"]');
    await expect(rows.first()).toBeVisible();

    const rowTexts = await rows.allTextContents();
    const allText = rowTexts.join(" ");

    // Seed has Social and Outdoors categories
    expect(allText).toContain(SEED_EVENTS.WELCOME_COFFEE.category);
    expect(allText).toContain(SEED_EVENTS.MORNING_HIKE.category);
  });
});
