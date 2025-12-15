import { test, expect } from "@playwright/test";
import { lookupRegistrationId } from "./helpers/lookupIds";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin Registration Detail Page", () => {
  test("shows registration detail page for r1", async ({ page }) => {
    const registrationId = await lookupRegistrationId(page.request, { memberEmail: "alice@example.com" });
    await page.goto(`${BASE}/admin/registrations/${registrationId}`);

    const root = page.locator('[data-test-id="admin-registration-detail-root"]');
    await expect(root).toBeVisible();
  });

  test("displays all detail field test IDs", async ({ page }) => {
    const registrationId = await lookupRegistrationId(page.request, { memberEmail: "alice@example.com" });
    await page.goto(`${BASE}/admin/registrations/${registrationId}`);

    const memberName = page.locator('[data-test-id="admin-registration-member-name"]');
    await expect(memberName).toBeVisible();

    const eventTitle = page.locator('[data-test-id="admin-registration-event-title"]');
    await expect(eventTitle).toBeVisible();

    const status = page.locator('[data-test-id="admin-registration-status"]');
    await expect(status).toBeVisible();

    const registeredAt = page.locator('[data-test-id="admin-registration-registered-at"]');
    await expect(registeredAt).toBeVisible();
  });

  test("returns 404 for invalid registration id", async ({ page }) => {
    const response = await page.goto(`${BASE}/admin/registrations/invalid-id`);
    expect(response?.status()).toBe(404);
  });
});