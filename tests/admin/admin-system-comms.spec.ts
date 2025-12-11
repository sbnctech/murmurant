import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test.describe("Admin System Communications panel", () => {
  test("displays system comms section with health OK", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    // Assert the section is visible
    const section = page.locator('[data-test-id="system-comms-section"]');
    await expect(section).toBeVisible();

    // Assert health shows OK (may need to wait for async fetch)
    const healthElement = page.locator('[data-test-id="system-comms-health"]');
    await expect(healthElement).toBeVisible();
    await expect(healthElement).toContainText("Health: OK", { timeout: 10000 });
  });

  test("email test button triggers successful test", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const emailButton = page.locator('[data-test-id="system-comms-email-button"]');
    await expect(emailButton).toBeVisible();

    await emailButton.click();

    const emailStatus = page.locator('[data-test-id="system-comms-email-status"]');
    await expect(emailStatus).toContainText("Last email test: OK", { timeout: 10000 });
  });

  test("SMS test button triggers successful test", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const smsButton = page.locator('[data-test-id="system-comms-sms-button"]');
    await expect(smsButton).toBeVisible();

    await smsButton.click();

    const smsStatus = page.locator('[data-test-id="system-comms-sms-status"]');
    await expect(smsStatus).toContainText("Last SMS test: OK", { timeout: 10000 });
  });

  test("System communications heading is visible", async ({ page }) => {
    await page.goto(`${BASE}/admin`);

    const heading = page.getByRole("heading", { name: "System communications" });
    await expect(heading).toBeVisible();
  });
});
