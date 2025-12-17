import { test, expect } from "@playwright/test";
import { SEED_MEMBERS, SEED_EVENTS } from "../fixtures/seed-data";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Search UI", () => {
  test("Renders search input and button", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const searchPanel = page.locator('[data-test-id="admin-search-panel"]');
    await expect(searchPanel).toBeVisible();

    const searchInput = page.locator('[data-test-id="admin-search-input"]');
    await expect(searchInput).toBeVisible();

    const searchButton = page.locator('[data-test-id="admin-search-button"]');
    await expect(searchButton).toBeVisible();
  });

  test("Typing a query and searching shows member/event/registration matches", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const searchInput = page.locator('[data-test-id="admin-search-input"]');
    const searchButton = page.locator('[data-test-id="admin-search-button"]');

    // Search for "alice" - should match member Alice Chen (from seed)
    await searchInput.fill("alice");
    await searchButton.click();

    // Wait for results
    const results = page.locator('[data-test-id="admin-search-results"]');
    await expect(results).toBeVisible({ timeout: 5000 });

    // Check members table has Alice
    const membersTable = page.locator('[data-test-id="admin-search-members-table"]');
    await expect(membersTable).toBeVisible();
    const memberRow = page.locator('[data-test-id="admin-search-member-row"]');
    await expect(memberRow).toContainText(SEED_MEMBERS.ALICE.fullName);

    // Registrations should also match (Alice has registrations)
    const registrationsTable = page.locator('[data-test-id="admin-search-registrations-table"]');
    await expect(registrationsTable).toBeVisible();
    const regRow = page.locator('[data-test-id="admin-search-registration-row"]');
    await expect(regRow.first()).toContainText(SEED_MEMBERS.ALICE.fullName);
  });

  test("Shows no results state when nothing matches", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const searchInput = page.locator('[data-test-id="admin-search-input"]');
    const searchButton = page.locator('[data-test-id="admin-search-button"]');

    // Search for something that does not exist
    await searchInput.fill("xyznonexistent123");
    await searchButton.click();

    // Wait for no results message
    const noResults = page.locator('[data-test-id="admin-search-no-results"]');
    await expect(noResults).toBeVisible({ timeout: 5000 });
    await expect(noResults).toContainText("No results found");
  });

  test("Searching for event title shows event results", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const searchInput = page.locator('[data-test-id="admin-search-input"]');
    const searchButton = page.locator('[data-test-id="admin-search-button"]');

    // Search for "hike" - should match Morning Hike event from seed
    await searchInput.fill("hike");
    await searchButton.click();

    // Wait for results
    const results = page.locator('[data-test-id="admin-search-results"]');
    await expect(results).toBeVisible({ timeout: 5000 });

    // Check events table has Morning Hike
    const eventsTable = page.locator('[data-test-id="admin-search-events-table"]');
    await expect(eventsTable).toBeVisible();
    const eventRow = page.locator('[data-test-id="admin-search-event-row"]');
    await expect(eventRow).toContainText(SEED_EVENTS.MORNING_HIKE.title);
  });
});
