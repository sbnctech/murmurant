import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL ?? "http://localhost:3000";

test("admin email activity shows a recently logged email", async ({ page, request }) => {
  // First, send a mock email via the test endpoint
  const response = await request.post(`${BASE}/api/email/test`, {
    data: { to: "admin-email-test@example.com" },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.ok).toBe(true);
  expect(data.to).toBe("admin-email-test@example.com");

  // Now load the admin dashboard
  await page.goto(`${BASE}/admin`);

  const table = page.locator('[data-test-id="admin-email-table"]');
  await expect(table).toBeVisible();

  const rows = page.locator('[data-test-id="admin-email-row"]');
  await expect(rows.first()).toContainText("admin-email-test@example.com");
});
