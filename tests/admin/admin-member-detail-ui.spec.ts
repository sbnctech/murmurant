import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Member Detail UI (from search)", () => {
  test("Clicking on a member in search results loads member detail panel", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const searchInput = page.locator('[data-test-id="admin-search-input"]');
    const searchButton = page.locator('[data-test-id="admin-search-button"]');

    // Search for "alice"
    await searchInput.fill("alice");
    await searchButton.click();

    // Wait for results
    const results = page.locator('[data-test-id="admin-search-results"]');
    await expect(results).toBeVisible({ timeout: 5000 });

    // Click on the member row
    const memberRow = page.locator('[data-test-id="admin-search-member-row"]').first();
    await memberRow.click();

    // Wait for member detail panel to appear
    const detailPanel = page.locator('[data-test-id="admin-member-detail-panel"]');
    await expect(detailPanel).toBeVisible({ timeout: 5000 });
  });

  test("@quarantine Panel shows the expected member name, email, status", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const searchInput = page.locator('[data-test-id="admin-search-input"]');
    const searchButton = page.locator('[data-test-id="admin-search-button"]');

    // Search for "alice"
    await searchInput.fill("alice");
    await searchButton.click();

    // Wait for results and click member row
    const memberRow = page.locator('[data-test-id="admin-search-member-row"]').first();
    await expect(memberRow).toBeVisible({ timeout: 5000 });
    await memberRow.click();

    // Wait for member detail panel
    const detailPanel = page.locator('[data-test-id="admin-member-detail-panel"]');
    await expect(detailPanel).toBeVisible({ timeout: 5000 });

    // Check member details
    const memberName = page.locator('[data-test-id="admin-member-panel-name"]');
    await expect(memberName).toContainText("Alice Johnson");

    const memberEmail = page.locator('[data-test-id="admin-member-panel-email"]');
    await expect(memberEmail).toContainText("alice@example.com");

    const memberStatus = page.locator('[data-test-id="admin-member-panel-status"]');
    await expect(memberStatus).toContainText("ACTIVE");
  });

  test("@quarantine Panel shows at least one registration row", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const searchInput = page.locator('[data-test-id="admin-search-input"]');
    const searchButton = page.locator('[data-test-id="admin-search-button"]');

    // Search for "alice"
    await searchInput.fill("alice");
    await searchButton.click();

    // Wait for results and click member row
    const memberRow = page.locator('[data-test-id="admin-search-member-row"]').first();
    await expect(memberRow).toBeVisible({ timeout: 5000 });
    await memberRow.click();

    // Wait for member detail panel
    const detailPanel = page.locator('[data-test-id="admin-member-detail-panel"]');
    await expect(detailPanel).toBeVisible({ timeout: 5000 });

    // Check registrations table exists
    const regTable = page.locator('[data-test-id="admin-member-panel-registrations-table"]');
    await expect(regTable).toBeVisible();

    // Check at least one registration row
    const regRows = page.locator('[data-test-id="admin-member-panel-registration-row"]');
    await expect(regRows).toHaveCount(1);

    // Verify the registration details
    await expect(regRows.first()).toContainText("Welcome Hike");
    await expect(regRows.first()).toContainText("REGISTERED");
  });
});
